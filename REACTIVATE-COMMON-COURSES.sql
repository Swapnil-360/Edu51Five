-- Re-activate Common Courses for Spring 2026
-- Run this if you want to restore courses to the database (temporarily)
-- Eventually these will be replaced by Google Drive folder browsing

UPDATE courses 
SET is_active = true 
WHERE major = 'Common' AND semester = 'SPRING_2026';

-- Verify
SELECT code, name, major, semester, is_active 
FROM courses 
WHERE major = 'Common' AND semester = 'SPRING_2026'
ORDER BY code;
