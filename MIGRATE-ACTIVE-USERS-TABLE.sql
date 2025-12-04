-- ============================================
-- MIGRATE ACTIVE_USERS TABLE SCHEMA
-- ============================================
-- Run this if your active_users table has old schema (page, last_active)
-- This migrates it to new schema (page_name, updated_at, last_seen)

-- 1. Drop old table if it has wrong schema
DROP TABLE IF EXISTS active_users CASCADE;

-- 2. Create fresh active_users table with correct schema
CREATE TABLE active_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,
    page_name TEXT NOT NULL,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create index for faster queries
CREATE INDEX idx_active_users_page_time 
ON active_users(page_name, updated_at DESC);

-- 4. Enable Row Level Security
ALTER TABLE active_users ENABLE ROW LEVEL SECURITY;

-- 5. Create policies for public access (read/write)
CREATE POLICY "Allow public to insert"
ON active_users FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Allow public to update own session"
ON active_users FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public to delete own session"
ON active_users FOR DELETE
TO public
USING (true);

CREATE POLICY "Allow public to read"
ON active_users FOR SELECT
TO public
USING (true);

-- 6. Create function to cleanup stale sessions (older than 5 minutes)
CREATE OR REPLACE FUNCTION cleanup_stale_sessions()
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM active_users 
    WHERE updated_at < NOW() - INTERVAL '5 minutes';
END;
$$;

-- 7. Enable Realtime for the table
ALTER PUBLICATION supabase_realtime ADD TABLE active_users;

-- 8. Verify setup
SELECT 
    'Active users table migrated successfully!' as status,
    COUNT(*) as current_sessions
FROM active_users;
