-- ============================================
-- COMPLETE NOTICES TABLE SETUP FOR EDU51FIVE
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- This sets up the notices table with all required columns
-- and proper RLS policies for multi-device sync

-- 1. DROP existing table and recreate (WARNING: This deletes all notices!)
-- DROP TABLE IF EXISTS notices CASCADE;

-- 2. CREATE notices table with all fields
CREATE TABLE IF NOT EXISTS notices (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
    category TEXT DEFAULT 'announcement',
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
    exam_type TEXT,
    event_date TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notices_active_created 
ON notices(is_active DESC, created_at DESC);

-- 4. Enable RLS (Row Level Security)
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies (if any)
DROP POLICY IF EXISTS "notices_select" ON notices;
DROP POLICY IF EXISTS "notices_insert" ON notices;
DROP POLICY IF EXISTS "notices_update" ON notices;
DROP POLICY IF EXISTS "notices_delete" ON notices;

-- 6. Create new RLS policies (allow all operations - no authentication needed)
CREATE POLICY "notices_select"
    ON notices FOR SELECT
    USING (true);

CREATE POLICY "notices_insert"
    ON notices FOR INSERT
    WITH CHECK (true);

CREATE POLICY "notices_update"
    ON notices FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "notices_delete"
    ON notices FOR DELETE
    USING (true);

-- 7. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notices_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS notices_update_timestamp ON notices;
CREATE TRIGGER notices_update_timestamp
    BEFORE UPDATE ON notices
    FOR EACH ROW
    EXECUTE FUNCTION update_notices_timestamp();

-- 8. Insert default notices (if table is empty)
INSERT INTO notices (id, title, content, type, category, priority, is_active, created_at)
SELECT 
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
    true,
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM notices WHERE id = 'welcome-notice');

-- 9. Verify setup
SELECT 
    'Notices table setup complete!' as status,
    COUNT(*) as total_notices,
    COUNT(CASE WHEN is_active THEN 1 END) as active_notices
FROM notices;

-- 10. Test query (returns up to 5 active notices sorted by latest)
-- SELECT * FROM notices WHERE is_active = true ORDER BY created_at DESC LIMIT 5;
