-- ============================================================
-- Edu51Five — Supabase profiles table fix (safe version)
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Unique index on bubt_email (prevents duplicate profile rows)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_bubt_email_key
  ON profiles (bubt_email);

-- 2. Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies (drop first so re-running is safe)
DROP POLICY IF EXISTS "Users can read own profile"   ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Authenticated users can only read/edit their own row
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 4. Notices table — anyone can read active notices
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read notices" ON notices;

CREATE POLICY "Anyone can read notices"
  ON notices FOR SELECT
  USING (is_active = true);
