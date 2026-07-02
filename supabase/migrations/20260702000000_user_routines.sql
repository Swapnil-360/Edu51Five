-- New clean per-user routines table (auth-based, replaces device-based custom_routines)
create table if not exists public.user_routines (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  entry_id    text not null,
  title       text not null,
  course_code text,
  type        text not null default 'regular',
  mode        text not null default 'theory',
  day         text not null,
  start_time  text not null,
  end_time    text not null,
  room        text,
  section     text,
  teacher     text,
  linked_to   text,
  created_at  timestamptz not null default now(),
  unique (user_id, entry_id)
);

create index if not exists user_routines_user_idx on public.user_routines(user_id);

alter table public.user_routines enable row level security;

create policy "own_select" on public.user_routines
  for select to authenticated using (user_id = auth.uid());

create policy "own_insert" on public.user_routines
  for insert to authenticated with check (user_id = auth.uid());

create policy "own_update" on public.user_routines
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own_delete" on public.user_routines
  for delete to authenticated using (user_id = auth.uid());

-- Drop the old device-based table
drop table if exists public.custom_routines;
