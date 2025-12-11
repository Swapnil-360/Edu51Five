-- Profiles table for app user data
create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  name text,
  section text,
  major text,
  bubt_email text unique,
  notification_email text,
  phone text,
  profile_pic text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_profiles_bubt_email on public.profiles (bubt_email);

-- Keep updated_at fresh
create or replace function public.update_profiles_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.update_profiles_timestamp();
