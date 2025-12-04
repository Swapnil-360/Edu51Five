-- ============================================
-- REAL-TIME USER TRACKING SETUP
-- ============================================
-- This creates a table to track active users and their sessions
-- Run this in your Supabase SQL Editor

-- 1. Create active_users table with correct schema
CREATE TABLE IF NOT EXISTS active_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,
    page_name TEXT NOT NULL,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_active_users_page_time 
ON active_users(page_name, updated_at DESC);

-- 3. Enable Row Level Security
ALTER TABLE active_users ENABLE ROW LEVEL SECURITY;

-- 4. Create policies for public access (read/write)
DROP POLICY IF EXISTS "Allow public to insert" ON active_users;
CREATE POLICY "Allow public to insert"
ON active_users FOR INSERT
TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public to update own session" ON active_users;
CREATE POLICY "Allow public to update own session"
ON active_users FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public to delete own session" ON active_users;
CREATE POLICY "Allow public to delete own session"
ON active_users FOR DELETE
TO public
USING (true);

DROP POLICY IF EXISTS "Allow public to read" ON active_users;
CREATE POLICY "Allow public to read"
ON active_users FOR SELECT
TO public
USING (true);

-- 5. Create function to cleanup stale sessions (older than 5 minutes)
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

-- 6. Create function to get active user count by page (2-minute window)
CREATE OR REPLACE FUNCTION get_active_user_count(page_name TEXT)
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    user_count INTEGER;
BEGIN
    -- First cleanup stale sessions
    PERFORM cleanup_stale_sessions();
    
    -- Then count active users on the page (active within 2 minutes)
    SELECT COUNT(DISTINCT session_id)
    INTO user_count
    FROM active_users
    WHERE page_name = $1
    AND updated_at > NOW() - INTERVAL '2 minutes';
    
    RETURN user_count;
END;
$$;

-- 7. Enable Realtime for the table
ALTER PUBLICATION supabase_realtime ADD TABLE active_users;

-- 8. Test the setup
SELECT 
    'Active users tracking setup complete!' as status,
    COUNT(*) as current_sessions
FROM active_users;

-- ✅ Done! Now you can:
-- 1. Insert/update user sessions from your app
-- 2. Subscribe to realtime changes
-- 3. Query active user counts by page
