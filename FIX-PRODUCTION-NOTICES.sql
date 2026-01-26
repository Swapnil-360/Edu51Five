-- ========================================
-- FIX PRODUCTION NOTICES LOADING ISSUE
-- ========================================
-- Run this SQL in your Supabase SQL Editor to fix notices not loading in production
-- Go to: https://supabase.com/dashboard → Your Project → SQL Editor → New Query

-- Step 1: Recreate notices table (if it doesn't exist or has issues)
DROP TABLE IF EXISTS notices CASCADE;

CREATE TABLE notices (
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

-- Step 2: Enable Row Level Security
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop all existing policies (clean slate)
DROP POLICY IF EXISTS "Allow all operations on notices" ON notices;
DROP POLICY IF EXISTS "Enable read access for all users" ON notices;
DROP POLICY IF EXISTS "Enable insert for all users" ON notices;
DROP POLICY IF EXISTS "Enable update for all users" ON notices;
DROP POLICY IF EXISTS "Enable delete for all users" ON notices;
DROP POLICY IF EXISTS "Public read access" ON notices;
DROP POLICY IF EXISTS "Public write access" ON notices;

-- Step 4: Create PUBLIC READ POLICY (critical for anonymous users)
CREATE POLICY "Public read access to notices"
ON notices
FOR SELECT
USING (true);  -- Allow everyone to read all notices

-- Step 5: Create ADMIN WRITE POLICIES (for authenticated users)
CREATE POLICY "Allow insert for authenticated users"
ON notices
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users"
ON notices
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow delete for authenticated users"
ON notices
FOR DELETE
TO authenticated
USING (true);

-- Step 6: Insert default notices
INSERT INTO notices (id, title, content, type, category, priority, exam_type, is_active, created_at)
VALUES 
(
    'welcome-notice',
    '🎉 Welcome to Edu51Five - BUBT Intake 51 Section 5',
    'Dear BUBT Intake 51 Students,

Welcome to Edu51Five, your comprehensive learning platform designed specifically for your academic excellence and exam preparation success!

🎯 **Your Exam Success Platform:**
📚 Complete Study Materials • 📝 Past Exam Questions • 🔔 Real-time Updates

This platform is your centralized hub for all Section 5 (Computer Science & Engineering) resources. Use it regularly to stay ahead in your studies and achieve academic excellence!

Best of luck with your studies!
- Edu51Five Team',
    'info',
    'announcement',
    'normal',
    NULL,
    true,
    NOW()
),
(
    'exam-routine-notice',
    '📅 Final Exam Routine - Section 5 (Dec 04–14, 2025)',
    'Final examination schedule for Section 5 (Computer Science & Engineering).

📋 **Exam Information (Finals - Dec 04 to Dec 14, 2025):**
• 04/12/2025 (Thursday) — 09:45 AM to 11:45 AM • CSE 319 • SHB • Room 2710
• 07/12/2025 (Sunday)   — 09:45 AM to 11:45 AM • CSE 327 • DMAa • Room 2710
• 09/12/2025 (Tuesday)  — 09:45 AM to 11:45 AM • CSE 407 • NB   • Room 2710
• 11/12/2025 (Thursday) — 09:45 AM to 11:45 AM • CSE 351 • SHD  • Room 2710
• 14/12/2025 (Sunday)   — 09:45 AM to 11:45 AM • CSE 417 • TAB  • Room 2710

• Arrive 15 minutes early for each exam
• Carry your student ID and necessary materials

[EXAM_ROUTINE_PDF]https://aljnyhxthmwgesnkqwzu.supabase.co/storage/v1/object/public/materials/materials/Final_Exam_Routine_Dec_2025.pdf[/EXAM_ROUTINE_PDF]',
    'warning',
    'exam',
    'high',
    'final',
    true,
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    content = EXCLUDED.content,
    type = EXCLUDED.type,
    category = EXCLUDED.category,
    priority = EXCLUDED.priority,
    exam_type = EXCLUDED.exam_type,
    is_active = EXCLUDED.is_active;

-- Step 7: Verify setup
SELECT 
    'Notices table setup complete!' as status,
    COUNT(*) as total_notices,
    COUNT(*) FILTER (WHERE is_active = true) as active_notices
FROM notices;

-- Step 8: Test anonymous read access (this should return notices)
SELECT id, title, is_active FROM notices WHERE is_active = true;

-- ========================================
-- DONE! Your notices should now load in production
-- ========================================
-- After running this SQL:
-- 1. Go to your Vercel deployment: https://edu51five.vercel.app
-- 2. Open browser console (F12)
-- 3. Refresh the page
-- 4. Look for "✅ Database notices loaded" in console
-- 5. Check notification bell icon - should show 2+ notices
