-- Fix the materials table structure
-- Run this in Supabase SQL Editor

-- First, let's see what columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'materials' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Option 1: Rename course_id to course_code (if course_id exists)
ALTER TABLE materials RENAME COLUMN course_id TO course_code;

-- Option 2: If course_id doesn't exist, add course_code column
-- ALTER TABLE materials ADD COLUMN course_code TEXT;

-- Update any NULL values
UPDATE materials SET course_code = 'CSE-319-20' WHERE course_code IS NULL;

-- Set NOT NULL constraint
ALTER TABLE materials ALTER COLUMN course_code SET NOT NULL;
