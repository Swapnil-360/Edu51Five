-- Complete Fix for RLS Issues
-- Run ALL of these commands in Supabase SQL Editor

-- 1. Completely disable RLS on both tables
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE materials DISABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Public read access" ON courses;
DROP POLICY IF EXISTS "Public read access" ON materials;
DROP POLICY IF EXISTS "Public write access" ON courses;
DROP POLICY IF EXISTS "Public write access" ON materials;
DROP POLICY IF EXISTS "Enable read access for all users" ON courses;
DROP POLICY IF EXISTS "Enable read access for all users" ON materials;
DROP POLICY IF EXISTS "Enable insert for all users" ON courses;
DROP POLICY IF EXISTS "Enable insert for all users" ON materials;
DROP POLICY IF EXISTS "Allow all operations" ON courses;
DROP POLICY IF EXISTS "Allow all operations" ON materials;

-- 3. Verify tables exist and work
SELECT 'Courses table ready' as status, count(*) as course_count FROM courses;
SELECT 'Materials table ready' as status, count(*) as material_count FROM materials;

-- 4. Test insert (this should work now)
-- Uncomment the line below to test:
-- INSERT INTO materials (title, description, type, course_code) VALUES ('Test Material', 'Test Description', 'pdf', 'CSE-319-20');
