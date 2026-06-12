-- Phase 1a: Extend profiles with LinkedIn-style social fields (additive, existing users unaffected)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username        text,
  ADD COLUMN IF NOT EXISTS headline        text,
  ADD COLUMN IF NOT EXISTS about           text,
  ADD COLUMN IF NOT EXISTS location        text,
  ADD COLUMN IF NOT EXISTS website         text,
  ADD COLUMN IF NOT EXISTS social_links    jsonb   NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS avatar_url      text,
  ADD COLUMN IF NOT EXISTS cover_photo_url text,
  ADD COLUMN IF NOT EXISTS skills          text[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS interests       text[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS visibility      text    NOT NULL DEFAULT 'users'
    CHECK (visibility IN ('public','users','private')),
  ADD COLUMN IF NOT EXISTS is_alumni       boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_admin        boolean NOT NULL DEFAULT false;

-- Backfill usernames from bubt_email prefix, dedupe with short id suffix
UPDATE public.profiles p SET username =
  lower(regexp_replace(split_part(coalesce(p.bubt_email, p.id::text), '@', 1), '[^a-zA-Z0-9_.]', '', 'g'))
  || CASE WHEN EXISTS (
       SELECT 1 FROM public.profiles q
       WHERE q.id <> p.id
         AND lower(split_part(coalesce(q.bubt_email,''),'@',1)) = lower(split_part(coalesce(p.bubt_email,''),'@',1))
         AND q.created_at < p.created_at
     ) THEN substr(p.id::text, 1, 4) ELSE '' END
WHERE p.username IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_uq ON public.profiles (lower(username));
CREATE INDEX IF NOT EXISTS profiles_skills_gin    ON public.profiles USING gin (skills);
CREATE INDEX IF NOT EXISTS profiles_interests_gin ON public.profiles USING gin (interests);

-- Visibility helper used by child-table policies
CREATE OR REPLACE FUNCTION public.profile_visible(owner uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT owner = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = owner
      AND (p.visibility = 'public' OR (p.visibility = 'users' AND auth.uid() IS NOT NULL))
  );
$$;

-- Education entries
CREATE TABLE IF NOT EXISTS public.educations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  institution text NOT NULL,
  department text,
  degree text,
  session text,
  graduation_year int,
  cgpa numeric(4,2) CHECK (cgpa IS NULL OR (cgpa >= 0 AND cgpa <= 4.00)),
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS educations_user_idx ON public.educations(user_id);
ALTER TABLE public.educations ENABLE ROW LEVEL SECURITY;
CREATE POLICY educations_select ON public.educations FOR SELECT USING (public.profile_visible(user_id));
CREATE POLICY educations_insert ON public.educations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY educations_update ON public.educations FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY educations_delete ON public.educations FOR DELETE USING (user_id = auth.uid());

-- Experience entries
CREATE TABLE IF NOT EXISTS public.experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  company text NOT NULL,
  employment_type text CHECK (employment_type IN
    ('full_time','part_time','internship','freelance','contract','volunteer')),
  start_date date NOT NULL,
  end_date date,
  is_current boolean NOT NULL DEFAULT false,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS experiences_user_idx ON public.experiences(user_id);
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
CREATE POLICY experiences_select ON public.experiences FOR SELECT USING (public.profile_visible(user_id));
CREATE POLICY experiences_insert ON public.experiences FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY experiences_update ON public.experiences FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY experiences_delete ON public.experiences FOR DELETE USING (user_id = auth.uid());
