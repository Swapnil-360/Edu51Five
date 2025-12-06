-- Update course name from "Software Development" to "Software Engineering" in Supabase
-- Run this in your Supabase SQL Editor

UPDATE courses 
SET name = 'Software Engineering'
WHERE code = 'CSE-327' AND name = 'Software Development';
