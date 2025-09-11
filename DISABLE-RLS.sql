-- Quick Fix: Temporarily disable RLS to test uploads
-- Run this in Supabase SQL Editor

-- Disable RLS temporarily for testing
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE materials DISABLE ROW LEVEL SECURITY;

-- You can re-enable it later and set up proper policies
-- ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
