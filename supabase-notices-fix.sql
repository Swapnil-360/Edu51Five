-- QUICK FIX: Create missing notices table and storage for Edu51Five
-- This addresses the "Could not find the table 'public.notices'" error

-- 1. Create notices table (THIS IS THE MISSING PIECE!)
CREATE TABLE IF NOT EXISTS notices (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create storage bucket for exam routines
INSERT INTO storage.buckets (id, name, public)
VALUES ('exam-routines', 'exam-routines', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Enable RLS and create policies for notices table
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON notices;
DROP POLICY IF EXISTS "Enable insert for all users" ON notices;
DROP POLICY IF EXISTS "Enable update for all users" ON notices;
DROP POLICY IF EXISTS "Enable delete for all users" ON notices;

-- Create new policies
CREATE POLICY "Enable read access for all users" ON notices
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON notices
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON notices
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON notices
    FOR DELETE USING (true);

-- 4. Create storage policies for exam-routines bucket
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

-- Success!
SELECT 'Notices table and storage setup completed! Exam routines should now sync across devices.' as message;