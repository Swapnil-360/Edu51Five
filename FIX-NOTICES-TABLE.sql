-- ============================================
-- ADD MISSING COLUMNS TO EXISTING NOTICES TABLE
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- This adds the missing columns to the existing notices table

-- 1. Add missing columns (if they don't exist)
ALTER TABLE notices
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'announcement',
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS exam_type TEXT,
ADD COLUMN IF NOT EXISTS event_date TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Create index for faster queries (if not exists)
CREATE INDEX IF NOT EXISTS idx_notices_active_created 
ON notices(is_active DESC, created_at DESC);

-- 3. Create or replace trigger to update updated_at timestamp
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

-- 4. Verify the schema
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'notices'
ORDER BY ordinal_position;

-- 5. Verify data
SELECT 
    'Schema updated successfully!' as status,
    COUNT(*) as total_notices,
    COUNT(CASE WHEN is_active THEN 1 END) as active_notices
FROM notices;

-- Done! The notices table is now ready for multi-device sync.
