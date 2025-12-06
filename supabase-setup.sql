-- Supabase Database Setup for Edu51Five
-- Run these SQL commands in your Supabase SQL Editor

-- 1. Create enhanced notices table with categories
CREATE TABLE IF NOT EXISTS notices (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT CHECK (type IN ('info', 'warning', 'success', 'error')) NOT NULL DEFAULT 'info',
    category TEXT CHECK (category IN ('random', 'exam', 'event', 'information', 'academic', 'announcement')) DEFAULT 'announcement',
    priority TEXT CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
    exam_type TEXT CHECK (exam_type IN ('midterm', 'final')) DEFAULT NULL,
    event_date DATE DEFAULT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create courses table
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (course_code) REFERENCES courses(code)
);

-- Insert sample courses
INSERT INTO courses (name, code, description) VALUES
    ('Networking', 'CSE-319-20', 'Computer Networks and Security'),
    ('Software Engineering', 'CSE-327', 'Software Engineering Principles'),
    ('Project Management and Professional Ethics', 'CSE-407', 'Project Management & Ethics'),
    ('Distributed Database', 'CSE-417', 'Database Systems and Management'),
    ('Artificial Intelligence', 'CSE-351', 'AI and Machine Learning')
ON CONFLICT (code) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Enable read access for all users" ON courses;
DROP POLICY IF EXISTS "Enable read access for all users" ON materials;
DROP POLICY IF EXISTS "Enable insert for all users" ON courses;
DROP POLICY IF EXISTS "Enable insert for all users" ON materials;
DROP POLICY IF EXISTS "Enable update for all users" ON courses;
DROP POLICY IF EXISTS "Enable update for all users" ON materials;
DROP POLICY IF EXISTS "Enable delete for all users" ON courses;
DROP POLICY IF EXISTS "Enable delete for all users" ON materials;

-- Create policies for public access (students can read)
CREATE POLICY "Enable read access for all users" ON courses
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON materials
    FOR SELECT USING (true);

-- Create policies for admin access (admin can insert/update/delete)
CREATE POLICY "Enable insert for all users" ON courses
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable insert for all users" ON materials
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON courses
    FOR UPDATE USING (true);

CREATE POLICY "Enable update for all users" ON materials
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON courses
    FOR DELETE USING (true);

CREATE POLICY "Enable delete for all users" ON materials
    FOR DELETE USING (true);

-- 3. Create storage bucket for exam routines
INSERT INTO storage.buckets (id, name, public)
VALUES ('exam-routines', 'exam-routines', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Enable RLS and create policies for notices table
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

-- Drop existing notice policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON notices;
DROP POLICY IF EXISTS "Enable insert for all users" ON notices;
DROP POLICY IF EXISTS "Enable update for all users" ON notices;
DROP POLICY IF EXISTS "Enable delete for all users" ON notices;

CREATE POLICY "Enable read access for all users" ON notices
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON notices
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON notices
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON notices
    FOR DELETE USING (true);

-- 5. Create storage policies for exam-routines bucket
-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Anyone can view exam routine images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload exam routine images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update exam routine images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete exam routine images" ON storage.objects;

CREATE POLICY "Anyone can view exam routine images" ON storage.objects
    FOR SELECT USING (bucket_id = 'exam-routines');

CREATE POLICY "Anyone can upload exam routine images" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'exam-routines');

CREATE POLICY "Anyone can update exam routine images" ON storage.objects
    FOR UPDATE USING (bucket_id = 'exam-routines');

CREATE POLICY "Anyone can delete exam routine images" ON storage.objects
    FOR DELETE USING (bucket_id = 'exam-routines');

-- Setup completed successfully!
