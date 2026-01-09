-- Deactivate all existing courses (they're now in Google Drive folders)
-- Run this in Supabase SQL Editor to clean up

UPDATE courses 
SET is_active = false 
WHERE is_active = true;

-- Verify deactivation
SELECT code, name, is_active, major, semester 
FROM courses 
WHERE is_active = true;

-- This query should return 0 rows if all courses were successfully deactivated
-- Courses are now managed via Google Drive folders:
-- - Common folder: shared by all majors
-- - AI folder: AI-specific courses  
-- - Software Engineering folder: SE-specific courses
-- - Networking folder: Networking-specific courses
