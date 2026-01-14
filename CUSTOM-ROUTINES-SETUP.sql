-- ================================================
-- Custom Routines Table Setup (Device-Based)
-- No authentication required - uses device IDs
-- ================================================

-- Drop existing table and policies
DROP TABLE IF EXISTS public.custom_routines CASCADE;

-- Create table with TEXT user_id for device IDs
CREATE TABLE public.custom_routines (
  user_id text not null,
  entry_id text not null,
  title text not null,
  course_code text,
  type text not null check (type in ('regular','improvement','retake')),
  mode text not null check (mode in ('theory','lab')),
  day text not null check (day in ('Sun','Mon','Tue','Wed','Thu')),
  start_time text not null,
  end_time text not null,
  room text,
  section text,
  teacher text,
  linked_to text,
  created_at timestamptz not null default now(),
  primary key (user_id, entry_id)
);

-- Enable RLS
ALTER TABLE public.custom_routines ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read/write their device's routines (public access)
CREATE POLICY custom_routines_public_access
  ON public.custom_routines
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_custom_routines_user ON public.custom_routines(user_id);
CREATE INDEX idx_custom_routines_created ON public.custom_routines(created_at DESC);

-- Grant public access
GRANT ALL ON public.custom_routines TO anon;
GRANT ALL ON public.custom_routines TO authenticated;
