-- Insert Common Courses for Spring 2026 (Shared by All Majors)
-- ⚠️ IMPORTANT: Run SPRING-2026-MIGRATION.sql FIRST to add major/semester/is_active columns!
-- Then run this file in Supabase SQL Editor
-- These courses are shared across AI, Software Engineering, and Networking majors

INSERT INTO courses (code, name, description, major, semester, is_active) VALUES
  ('CSE-341', 'Computer Graphics', 'Computer Graphics and Visualization', 'Common', 'SPRING_2026', true),
  ('CSE-425', 'Internet of Things', 'IoT Systems and Applications', 'Common', 'SPRING_2026', true),
  ('CSE-475', 'Data Mining', 'Data Mining and Knowledge Discovery', 'Common', 'SPRING_2026', true),
  ('CSE-498A', 'Capstone Project 1', 'Final Year Capstone Project Part 1', 'Common', 'SPRING_2026', true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  major = EXCLUDED.major,
  semester = EXCLUDED.semester,
  is_active = EXCLUDED.is_active;

-- Verify insertion
SELECT code, name, description, major, semester, is_active 
FROM courses 
WHERE major = 'Common' AND semester = 'SPRING_2026'
ORDER BY code;

-- Test query: Check if courses are accessible by all majors
-- The app queries: major.eq.AI OR major.eq.Common (same for Software Engineering and Networking)
SELECT 'AI Major' as test, code, name FROM courses WHERE major IN ('AI', 'Common') AND semester = 'SPRING_2026'
UNION ALL
SELECT 'Software Engineering' as test, code, name FROM courses WHERE major IN ('Software Engineering', 'Common') AND semester = 'SPRING_2026'
UNION ALL
SELECT 'Networking' as test, code, name FROM courses WHERE major IN ('Networking', 'Common') AND semester = 'SPRING_2026';
