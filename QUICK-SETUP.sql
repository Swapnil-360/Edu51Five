-- Quick Database Setup for Edu51Five
-- Copy and paste this into your Supabase SQL Editor and click RUN

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create materials table
CREATE TABLE IF NOT EXISTS materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT,
    video_url TEXT,
    type TEXT NOT NULL DEFAULT 'pdf',
    course_code TEXT NOT NULL,
    size TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default courses
INSERT INTO courses (name, code, description) VALUES
    ('Networking', 'CSE-319-20', 'Computer Networks and Security'),
    ('Software Development', 'CSE-327', 'Software Engineering Principles'),
    ('Project Management and Professional Ethics', 'CSE-407', 'Project Management & Ethics'),
    ('Distributed Database', 'CSE-417', 'Database Systems and Management'),
    ('Artificial Intelligence', 'CSE-351', 'AI and Machine Learning')
ON CONFLICT (code) DO NOTHING;

-- Enable public access (so students can read, admin can write)
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public read access" ON courses;
DROP POLICY IF EXISTS "Public read access" ON materials;
DROP POLICY IF EXISTS "Public write access" ON courses;
DROP POLICY IF EXISTS "Public write access" ON materials;
DROP POLICY IF EXISTS "Enable read access for all users" ON courses;
DROP POLICY IF EXISTS "Enable read access for all users" ON materials;
DROP POLICY IF EXISTS "Enable insert for all users" ON courses;
DROP POLICY IF EXISTS "Enable insert for all users" ON materials;

-- Create permissive policies for all operations
CREATE POLICY "Allow all operations" ON courses FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON materials FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
