-- Phase 1c: Teams, membership, invitations, join requests, announcements
CREATE TABLE IF NOT EXISTS public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 3 AND 80),
  description text,
  goal text,
  category text NOT NULL CHECK (category IN
    ('startup','research','hackathon','academic_project','open_source','freelancing','competition')),
  required_skills text[] NOT NULL DEFAULT '{}',
  max_members int NOT NULL DEFAULT 5 CHECK (max_members BETWEEN 2 AND 7),
  logo_url text,
  banner_url text,
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS teams_skills_gin ON public.teams USING gin (required_skills);
CREATE INDEX IF NOT EXISTS teams_category_idx ON public.teams(category);

CREATE TABLE IF NOT EXISTS public.team_members (
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, user_id)
);
CREATE INDEX IF NOT EXISTS team_members_user_idx ON public.team_members(user_id);

-- SECURITY DEFINER helpers: break RLS recursion, reused by chat/kanban/files/storage
CREATE OR REPLACE FUNCTION public.is_team_member(_team uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$ SELECT EXISTS (SELECT 1 FROM team_members WHERE team_id = _team AND user_id = _user) $$;

CREATE OR REPLACE FUNCTION public.team_role(_team uuid, _user uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$ SELECT role FROM team_members WHERE team_id = _team AND user_id = _user $$;

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY teams_select ON public.teams FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY teams_insert ON public.teams FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY teams_update ON public.teams FOR UPDATE
  USING (public.team_role(id, auth.uid()) IN ('owner','admin'));
CREATE POLICY teams_delete ON public.teams FOR DELETE USING (owner_id = auth.uid());

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY tm_select ON public.team_members FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY tm_delete ON public.team_members FOR DELETE USING (
  user_id = auth.uid()
  OR (public.team_role(team_id, auth.uid()) = 'owner' AND role <> 'owner')
  OR (public.team_role(team_id, auth.uid()) = 'admin' AND role = 'member'));
CREATE POLICY tm_update ON public.team_members FOR UPDATE
  USING (public.team_role(team_id, auth.uid()) = 'owner' AND role <> 'owner');
-- NO client INSERT policy: membership rows created only by trigger/RPCs below.

-- Auto-add owner row when a team is created
CREATE OR REPLACE FUNCTION public.handle_team_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO team_members (team_id, user_id, role) VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS on_team_created ON public.teams;
CREATE TRIGGER on_team_created AFTER INSERT ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.handle_team_created();

-- Invitations
CREATE TABLE IF NOT EXISTS public.team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  inviter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invitee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS team_inv_pending_uq ON public.team_invitations(team_id, invitee_id) WHERE status = 'pending';
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY inv_select ON public.team_invitations FOR SELECT
  USING (invitee_id = auth.uid() OR public.team_role(team_id, auth.uid()) IN ('owner','admin'));
CREATE POLICY inv_insert ON public.team_invitations FOR INSERT
  WITH CHECK (inviter_id = auth.uid() AND public.team_role(team_id, auth.uid()) IN ('owner','admin'));
CREATE POLICY inv_cancel ON public.team_invitations FOR UPDATE
  USING (public.team_role(team_id, auth.uid()) IN ('owner','admin') AND status = 'pending');

-- Join requests
CREATE TABLE IF NOT EXISTS public.team_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS team_jr_pending_uq ON public.team_join_requests(team_id, user_id) WHERE status = 'pending';
ALTER TABLE public.team_join_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY jr_select ON public.team_join_requests FOR SELECT
  USING (user_id = auth.uid() OR public.team_role(team_id, auth.uid()) IN ('owner','admin'));
CREATE POLICY jr_insert ON public.team_join_requests FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY jr_cancel ON public.team_join_requests FOR UPDATE
  USING (user_id = auth.uid() AND status = 'pending');

-- Membership mutations as RPCs (capacity check + atomic insert)
CREATE OR REPLACE FUNCTION public.respond_team_invitation(_invitation uuid, _accept boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE inv team_invitations; cnt int; cap int;
BEGIN
  SELECT * INTO inv FROM team_invitations WHERE id = _invitation AND invitee_id = auth.uid() AND status = 'pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'Invitation not found or not yours'; END IF;
  IF _accept THEN
    SELECT count(*), t.max_members INTO cnt, cap FROM team_members m JOIN teams t ON t.id = m.team_id
      WHERE m.team_id = inv.team_id GROUP BY t.max_members;
    IF cnt >= cap THEN RAISE EXCEPTION 'Team is full'; END IF;
    INSERT INTO team_members (team_id, user_id, role) VALUES (inv.team_id, inv.invitee_id, 'member')
      ON CONFLICT DO NOTHING;
  END IF;
  UPDATE team_invitations SET status = CASE WHEN _accept THEN 'accepted' ELSE 'rejected' END,
    responded_at = now() WHERE id = _invitation;
END $$;

CREATE OR REPLACE FUNCTION public.respond_join_request(_request uuid, _approve boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE req team_join_requests; cnt int; cap int;
BEGIN
  SELECT * INTO req FROM team_join_requests WHERE id = _request AND status = 'pending';
  IF NOT FOUND OR public.team_role(req.team_id, auth.uid()) NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'Not authorized'; END IF;
  IF _approve THEN
    SELECT count(*), t.max_members INTO cnt, cap FROM team_members m JOIN teams t ON t.id = m.team_id
      WHERE m.team_id = req.team_id GROUP BY t.max_members;
    IF cnt >= cap THEN RAISE EXCEPTION 'Team is full'; END IF;
    INSERT INTO team_members (team_id, user_id, role) VALUES (req.team_id, req.user_id, 'member')
      ON CONFLICT DO NOTHING;
  END IF;
  UPDATE team_join_requests SET status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END,
    responded_at = now() WHERE id = _request;
END $$;

-- Announcements
CREATE TABLE IF NOT EXISTS public.team_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS team_ann_idx ON public.team_announcements(team_id, created_at DESC);
ALTER TABLE public.team_announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY ann_select ON public.team_announcements FOR SELECT
  USING (public.is_team_member(team_id, auth.uid()));
CREATE POLICY ann_write ON public.team_announcements FOR INSERT
  WITH CHECK (author_id = auth.uid() AND public.team_role(team_id, auth.uid()) IN ('owner','admin'));
CREATE POLICY ann_delete ON public.team_announcements FOR DELETE
  USING (public.team_role(team_id, auth.uid()) IN ('owner','admin'));
