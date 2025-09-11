-- Supabase Database Setup for Edu51Five
-- Run these SQL commands in your Supabase SQL Editor

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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (course_code) REFERENCES courses(code)
);

-- Insert sample courses
INSERT INTO courses (name, code, description) VALUES
    ('Networking', 'CSE-319-20', 'Computer Networks and Security'),
    ('Software Development', 'CSE-327', 'Software Engineering Principles'),
    ('Project Management and Professional Ethics', 'CSE-407', 'Project Management & Ethics'),
    ('Distributed Database', 'CSE-417', 'Database Systems and Management'),
    ('Artificial Intelligence', 'CSE-351', 'AI and Machine Learning')
ON CONFLICT (code) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

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
