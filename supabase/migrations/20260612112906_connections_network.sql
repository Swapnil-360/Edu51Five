-- Phase 1b: LinkedIn-style connections
CREATE TABLE IF NOT EXISTS public.connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  CHECK (requester_id <> addressee_id)
);
-- one connection row per pair regardless of direction
CREATE UNIQUE INDEX IF NOT EXISTS connections_pair_uq ON public.connections
  (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
CREATE INDEX IF NOT EXISTS connections_addressee_idx ON public.connections(addressee_id, status);
CREATE INDEX IF NOT EXISTS connections_requester_idx ON public.connections(requester_id, status);

ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY conn_select ON public.connections FOR SELECT
  USING (auth.uid() IN (requester_id, addressee_id));
CREATE POLICY conn_insert ON public.connections FOR INSERT
  WITH CHECK (requester_id = auth.uid());
CREATE POLICY conn_update ON public.connections FOR UPDATE
  USING (addressee_id = auth.uid() AND status = 'pending');
CREATE POLICY conn_delete ON public.connections FOR DELETE
  USING (auth.uid() IN (requester_id, addressee_id));

CREATE OR REPLACE FUNCTION public.are_connected(a uuid, b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM connections
    WHERE status = 'accepted'
      AND least(requester_id, addressee_id) = least(a, b)
      AND greatest(requester_id, addressee_id) = greatest(a, b));
$$;
