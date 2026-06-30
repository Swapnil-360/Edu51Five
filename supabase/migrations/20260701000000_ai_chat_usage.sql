-- AI Assistant: daily usage tracking for rate-limiting the shared Gemini
-- free-tier quota. Only the ai-chat edge function (service role, bypasses
-- RLS) writes to this table; users can read their own row.
create table public.ai_chat_usage (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  usage_date    date not null default current_date,
  message_count int not null default 0,
  unique (user_id, usage_date)
);

create index ai_chat_usage_user_date_idx on public.ai_chat_usage(user_id, usage_date);

alter table public.ai_chat_usage enable row level security;

create policy "own_select" on public.ai_chat_usage
  for select to authenticated using (user_id = auth.uid());
