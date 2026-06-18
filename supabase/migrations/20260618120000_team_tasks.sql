-- Create the team tasks table
CREATE TABLE IF NOT EXISTS public.team_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 150),
  description text,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  due_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Performance index
CREATE INDEX IF NOT EXISTS team_tasks_team_id_idx ON public.team_tasks(team_id);

-- Enable RLS
ALTER TABLE public.team_tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to allow clean re-run
DROP POLICY IF EXISTS select_tasks ON public.team_tasks;
DROP POLICY IF EXISTS insert_tasks ON public.team_tasks;
DROP POLICY IF EXISTS update_tasks ON public.team_tasks;
DROP POLICY IF EXISTS delete_tasks ON public.team_tasks;

-- Select policy: Any team member can read team tasks
CREATE POLICY select_tasks ON public.team_tasks FOR SELECT
  USING (public.is_team_member(team_id, auth.uid()));

-- Insert policy: Any team member can insert tasks (marking themselves as creator)
CREATE POLICY insert_tasks ON public.team_tasks FOR INSERT
  WITH CHECK (
    public.is_team_member(team_id, auth.uid()) 
    AND created_by = auth.uid()
  );

-- Update policy: Any team member can update tasks in the team (move columns or edit details)
CREATE POLICY update_tasks ON public.team_tasks FOR UPDATE
  USING (public.is_team_member(team_id, auth.uid()));

-- Delete policy: Task creator or team owner/admin can delete tasks
CREATE POLICY delete_tasks ON public.team_tasks FOR DELETE
  USING (
    created_by = auth.uid()
    OR public.team_role(team_id, auth.uid()) IN ('owner', 'admin')
  );
