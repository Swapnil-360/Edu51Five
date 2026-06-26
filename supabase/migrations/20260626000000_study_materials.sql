-- Study Materials System
-- Replaces Google Drive integration with a fully Supabase-backed
-- folder + file management system for study materials.

-- ── Folders ──────────────────────────────────────────────────────────
create table if not exists public.study_folders (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  parent_id   uuid references public.study_folders(id) on delete cascade,
  -- NULL = Common (visible to all majors)
  -- 'AI' | 'Software Engineering' | 'Networking'
  major       text,
  color       text not null default '#3b82f6',
  order_index int  not null default 0,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index study_folders_parent_idx on public.study_folders(parent_id);
create index study_folders_major_idx  on public.study_folders(major);

alter table public.study_folders enable row level security;

-- All authenticated users can read
create policy "sf_select" on public.study_folders
  for select to authenticated using (true);

-- Only admins can mutate
create policy "sf_insert" on public.study_folders
  for insert to authenticated with check (is_app_admin());

create policy "sf_update" on public.study_folders
  for update to authenticated using (is_app_admin());

create policy "sf_delete" on public.study_folders
  for delete to authenticated using (is_app_admin());


-- ── Materials ─────────────────────────────────────────────────────────
create table if not exists public.study_materials (
  id          uuid primary key default gen_random_uuid(),
  folder_id   uuid references public.study_folders(id) on delete cascade,
  title       text not null,
  description text,
  file_url    text not null,
  file_path   text not null,   -- storage key: {folderId}/{uuid}.{ext}
  file_size   bigint,
  file_type   text,            -- mime type
  order_index int  not null default 0,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index study_materials_folder_idx on public.study_materials(folder_id, order_index);

alter table public.study_materials enable row level security;

create policy "sm_select" on public.study_materials
  for select to authenticated using (true);

create policy "sm_insert" on public.study_materials
  for insert to authenticated with check (is_app_admin());

create policy "sm_update" on public.study_materials
  for update to authenticated using (is_app_admin());

create policy "sm_delete" on public.study_materials
  for delete to authenticated using (is_app_admin());


-- ── Storage bucket ────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'study-materials',
  'study-materials',
  true,
  52428800,   -- 50 MB
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'text/plain'
  ]
)
on conflict (id) do nothing;

-- Admins can upload / delete
create policy "sm_storage_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'study-materials' and is_app_admin());

create policy "sm_storage_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'study-materials' and is_app_admin());

-- All authenticated users can read (public bucket still benefits from policy)
create policy "sm_storage_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'study-materials');
