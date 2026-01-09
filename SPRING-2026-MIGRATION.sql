-- ============================================
-- SPRING 2026 TRI-SEMESTER MIGRATION
-- Major-based sections with authenticated access
-- ============================================

-- ============================================
-- STEP 1: Update profiles table for major enforcement
-- ============================================

-- Make major column NOT NULL and add constraint
ALTER TABLE profiles 
  ALTER COLUMN major SET NOT NULL,
  ADD CONSTRAINT profiles_major_check CHECK (major IN ('AI', 'Software Engineering', 'Networking'));

-- Add section mapping based on major
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS section_code TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN major = 'AI' THEN 'INTAKE51_AI'
      WHEN major = 'Software Engineering' THEN 'INTAKE51_SE'
      WHEN major = 'Networking' THEN 'INTAKE51_NET'
      ELSE 'INTAKE51_GENERAL'
    END
  ) STORED;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_major ON profiles(major);
CREATE INDEX IF NOT EXISTS idx_profiles_section_code ON profiles(section_code);

-- Add authentication timestamp
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

-- ============================================
-- STEP 2: Update courses table for major-based filtering
-- ============================================

-- Add major field to courses
ALTER TABLE courses 
  ADD COLUMN IF NOT EXISTS major TEXT;

-- Add semester field for tri-semester support
ALTER TABLE courses 
  ADD COLUMN IF NOT EXISTS semester TEXT DEFAULT 'SPRING_2026';

-- Add active status
ALTER TABLE courses 
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_courses_major ON courses(major);
CREATE INDEX IF NOT EXISTS idx_courses_semester ON courses(semester);
CREATE INDEX IF NOT EXISTS idx_courses_active ON courses(is_active);
CREATE INDEX IF NOT EXISTS idx_courses_major_semester ON courses(major, semester, is_active);

-- Add constraint for valid majors
ALTER TABLE courses 
  ADD CONSTRAINT courses_major_check CHECK (major IN ('AI', 'Software Engineering', 'Networking', 'Common'));

-- ============================================
-- STEP 3: Update materials table
-- ============================================

-- Add major field to materials (inherits from course or explicit)
ALTER TABLE materials 
  ADD COLUMN IF NOT EXISTS major TEXT;

-- Add semester tracking
ALTER TABLE materials 
  ADD COLUMN IF NOT EXISTS semester TEXT DEFAULT 'SPRING_2026';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_materials_major ON materials(major);
CREATE INDEX IF NOT EXISTS idx_materials_semester ON materials(semester);

-- ============================================
-- STEP 4: Tighten RLS policies for authenticated access
-- ============================================

-- DROP OLD PERMISSIVE POLICIES FOR PROFILES
DROP POLICY IF EXISTS "Allow read access to profiles" ON profiles;
DROP POLICY IF EXISTS "Allow users to insert profiles" ON profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON profiles;

-- NEW SECURE POLICIES FOR PROFILES
-- Only authenticated users can read their own profile
CREATE POLICY "Users can read own profile" ON profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Service role can read all profiles (for admin)
CREATE POLICY "Service role can read all profiles" ON profiles
    FOR SELECT
    TO service_role
    USING (true);

-- Users can insert their own profile during signup
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- DROP OLD PERMISSIVE POLICIES FOR COURSES
DROP POLICY IF EXISTS "Enable read access for all users" ON courses;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON courses;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON courses;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON courses;

-- NEW SECURE POLICIES FOR COURSES
-- Only authenticated users can read courses for their major
CREATE POLICY "Authenticated users read courses for their major" ON courses
    FOR SELECT
    TO authenticated
    USING (
        major IN (
            SELECT p.major FROM profiles p WHERE p.id = auth.uid()
        ) OR major = 'Common'
    );

-- Service role (admin) can manage all courses
CREATE POLICY "Service role can manage courses" ON courses
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- DROP OLD PERMISSIVE POLICIES FOR MATERIALS
DROP POLICY IF EXISTS "Enable read access for all users" ON materials;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON materials;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON materials;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON materials;

-- NEW SECURE POLICIES FOR MATERIALS
-- Only authenticated users can read materials for their major
CREATE POLICY "Authenticated users read materials for their major" ON materials
    FOR SELECT
    TO authenticated
    USING (
        course_code IN (
            SELECT c.code 
            FROM courses c
            JOIN profiles p ON p.id = auth.uid()
            WHERE c.major = p.major OR c.major = 'Common'
        )
    );

-- Service role (admin) can manage all materials
CREATE POLICY "Service role can manage materials" ON materials
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================
-- STEP 5: Update registered_users table (OPTIONAL - Skip if table doesn't exist)
-- ============================================

-- Commented out - only uncomment if registered_users table exists
-- ALTER TABLE registered_users 
--   ADD COLUMN IF NOT EXISTS major TEXT;

-- ALTER TABLE registered_users 
--   ADD CONSTRAINT registered_users_major_check CHECK (major IN ('AI', 'Software Engineering', 'Networking'));

-- CREATE INDEX IF NOT EXISTS idx_registered_users_major ON registered_users(major);

-- ============================================
-- STEP 6: Create helper functions for major-based access
-- ============================================

-- Function to get user's major
CREATE OR REPLACE FUNCTION get_user_major(user_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT major FROM profiles WHERE id = user_id LIMIT 1;
$$;

-- Function to check if user can access course
CREATE OR REPLACE FUNCTION can_access_course(user_id UUID, course_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
    user_major TEXT;
    course_major TEXT;
BEGIN
    -- Get user's major
    SELECT major INTO user_major FROM profiles WHERE id = user_id;
    
    -- Get course major
    SELECT major INTO course_major FROM courses WHERE code = course_code;
    
    -- Allow if course is common or matches user's major
    RETURN (course_major = 'Common' OR course_major = user_major);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_major(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_course(UUID, TEXT) TO authenticated;

-- ============================================
-- STEP 7: Insert sample courses for Spring 2026 (Optional)
-- ============================================

-- Insert common courses (available to all majors)
INSERT INTO courses (code, name, major, semester, is_active) VALUES
('CSE-101', 'Introduction to Computer Science', 'Common', 'SPRING_2026', true),
('CSE-102', 'Discrete Mathematics', 'Common', 'SPRING_2026', true)
ON CONFLICT (code) DO UPDATE 
SET major = EXCLUDED.major, semester = EXCLUDED.semester, is_active = EXCLUDED.is_active;

-- AI Major courses
INSERT INTO courses (code, name, major, semester, is_active) VALUES
('CSE-401', 'Artificial Intelligence', 'AI', 'SPRING_2026', true),
('CSE-402', 'Machine Learning', 'AI', 'SPRING_2026', true),
('CSE-403', 'Deep Learning', 'AI', 'SPRING_2026', true)
ON CONFLICT (code) DO UPDATE 
SET major = EXCLUDED.major, semester = EXCLUDED.semester, is_active = EXCLUDED.is_active;

-- Software Engineering Major courses
INSERT INTO courses (code, name, major, semester, is_active) VALUES
('CSE-301', 'Software Engineering Principles', 'Software Engineering', 'SPRING_2026', true),
('CSE-302', 'Web Development', 'Software Engineering', 'SPRING_2026', true),
('CSE-303', 'Database Systems', 'Software Engineering', 'SPRING_2026', true)
ON CONFLICT (code) DO UPDATE 
SET major = EXCLUDED.major, semester = EXCLUDED.semester, is_active = EXCLUDED.is_active;

-- Networking Major courses
INSERT INTO courses (code, name, major, semester, is_active) VALUES
('CSE-501', 'Computer Networks', 'Networking', 'SPRING_2026', true),
('CSE-502', 'Network Security', 'Networking', 'SPRING_2026', true),
('CSE-503', 'Wireless Communications', 'Networking', 'SPRING_2026', true)
ON CONFLICT (code) DO UPDATE 
SET major = EXCLUDED.major, semester = EXCLUDED.semester, is_active = EXCLUDED.is_active;

-- ============================================
-- STEP 8: Add comments for documentation
-- ============================================

COMMENT ON COLUMN profiles.major IS 'Student major: AI, Software Engineering, or Networking';
COMMENT ON COLUMN profiles.section_code IS 'Auto-generated section code based on major';
COMMENT ON COLUMN profiles.last_login_at IS 'Last successful authentication timestamp';
COMMENT ON COLUMN courses.major IS 'Course major restriction or Common for all';
COMMENT ON COLUMN courses.semester IS 'Semester code: SPRING_2026, SUMMER_2026, FALL_2026';
COMMENT ON COLUMN courses.is_active IS 'Whether course is currently available';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check profiles structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Check courses structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'courses'
ORDER BY ordinal_position;

-- Check active policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('profiles', 'courses', 'materials')
ORDER BY tablename, policyname;

-- Count courses by major
SELECT major, COUNT(*) as course_count
FROM courses
WHERE semester = 'SPRING_2026' AND is_active = true
GROUP BY major;

-- ✅ Migration complete!
