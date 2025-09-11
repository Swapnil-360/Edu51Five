-- Fix Materials Table Structure
-- Run this in Supabase SQL Editor

-- Check current table structure
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'materials' AND table_schema = 'public';

-- Add the missing course_code column if it doesn't exist
ALTER TABLE materials ADD COLUMN IF NOT EXISTS course_code TEXT;

-- Make sure all required columns exist
ALTER TABLE materials ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'pdf';
ALTER TABLE materials ADD COLUMN IF NOT EXISTS size TEXT;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update NOT NULL constraints where needed
ALTER TABLE materials ALTER COLUMN title SET NOT NULL;
ALTER TABLE materials ALTER COLUMN type SET NOT NULL;
ALTER TABLE materials ALTER COLUMN course_code SET NOT NULL;

-- Verify the structure
SELECT column_name, data_type, is_nullable FROM information_schema.columns 
WHERE table_name = 'materials' AND table_schema = 'public'
ORDER BY ordinal_position;
