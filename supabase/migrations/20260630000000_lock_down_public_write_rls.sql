-- Security fix: materials, courses, and the legacy `users` table allowed the
-- `public` role (anon + authenticated, i.e. anyone with the public anon key)
-- to INSERT/UPDATE/DELETE any row with no auth check. Found via Supabase's
-- security advisor. App code only ever writes to these tables from
-- admin-gated UI (handleFileUpload, handleCreateCourse), so admin-only DB
-- writes match actual app behavior.

-- materials: lock writes to admins, keep existing public/major-scoped reads
drop policy if exists "Enable insert for all users" on public.materials;
drop policy if exists "Enable update for all users" on public.materials;
drop policy if exists "Enable delete for all users" on public.materials;

create policy "Admins can insert materials"
  on public.materials for insert to authenticated
  with check (public.is_app_admin());

create policy "Admins can update materials"
  on public.materials for update to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());

create policy "Admins can delete materials"
  on public.materials for delete to authenticated
  using (public.is_app_admin());

-- courses: lock writes to admins, keep existing public reads
drop policy if exists "Enable insert for all users" on public.courses;
drop policy if exists "Enable update for all users" on public.courses;
drop policy if exists "Enable delete for all users" on public.courses;

create policy "Admins can insert courses"
  on public.courses for insert to authenticated
  with check (public.is_app_admin());

create policy "Admins can update courses"
  on public.courses for update to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());

create policy "Admins can delete courses"
  on public.courses for delete to authenticated
  using (public.is_app_admin());

-- users: legacy table, superseded by `profiles`, not referenced anywhere in
-- app code. Still live with PII columns (email, phone) and was fully
-- public-readable/writable. Lock down entirely to admins.
drop policy if exists "Enable insert for all users" on public.users;
drop policy if exists "Enable update for users" on public.users;
drop policy if exists "Enable read access for all users" on public.users;

create policy "Admins can read users"
  on public.users for select to authenticated
  using (public.is_app_admin());

create policy "Admins can insert users"
  on public.users for insert to authenticated
  with check (public.is_app_admin());

create policy "Admins can update users"
  on public.users for update to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());
