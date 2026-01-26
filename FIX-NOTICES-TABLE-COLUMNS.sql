-- Fix Notices Table Schema - Add Missing Columns
-- This script updates the notices table to include all required columns

-- Step 1: Check if column exists before adding (to avoid errors if already present)
-- Using conditional logic to add missing columns

-- Add category column if missing
ALTER TABLE notices 
ADD COLUMN IF NOT EXISTS category TEXT 
  CHECK (category IN ('random', 'exam', 'event', 'information', 'academic', 'announcement'))
  DEFAULT 'announcement';

-- Add priority column if missing
ALTER TABLE notices 
ADD COLUMN IF NOT EXISTS priority TEXT 
  CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
  DEFAULT 'normal';

-- Add exam_type column if missing
ALTER TABLE notices 
ADD COLUMN IF NOT EXISTS exam_type TEXT 
  CHECK (exam_type IN ('midterm', 'final'))
  DEFAULT NULL;

-- Add event_date column if missing
ALTER TABLE notices 
ADD COLUMN IF NOT EXISTS event_date DATE DEFAULT NULL;

-- Verify the table structure
SELECT 
  column_name, 
  data_type, 
  column_default, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'notices'
ORDER BY ordinal_position;

-- Success message
SELECT '✅ Notices table schema updated successfully!' as message;
