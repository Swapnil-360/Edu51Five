-- Add user_id to push_subscriptions so we can send targeted push to specific users
alter table public.push_subscriptions
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists push_sub_user_idx on public.push_subscriptions(user_id);

-- In-app notifications (mentions, etc.)
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null default 'mention',      -- 'mention' | 'notice'
  title       text not null,
  body        text,
  team_id     uuid references public.teams(id) on delete cascade,
  message_id  uuid references public.team_messages(id) on delete cascade,
  actor_id    uuid references auth.users(id) on delete set null,
  actor_name  text,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

create index notifications_user_unread_idx
  on public.notifications(user_id, created_at desc)
  where not read;

alter table public.notifications enable row level security;

create policy "own_select" on public.notifications
  for select to authenticated using (user_id = auth.uid());

create policy "own_update" on public.notifications
  for update to authenticated using (user_id = auth.uid());

-- Allow any authenticated user to insert (needed for client-side mention inserts)
create policy "any_insert" on public.notifications
  for insert to authenticated with check (true);

alter publication supabase_realtime add table public.notifications;
