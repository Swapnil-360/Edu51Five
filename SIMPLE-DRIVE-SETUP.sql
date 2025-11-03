-- Simple Google Drive Integration Setup
-- Add new columns to materials table for centralized Drive storage

-- Add exam_period column (midterm/final)
ALTER TABLE materials
ADD COLUMN IF NOT EXISTS exam_period TEXT DEFAULT 'midterm'
CHECK (exam_period IN ('midterm', 'final'));

-- Add uploaded_by column (admin email)
ALTER TABLE materials
ADD COLUMN IF NOT EXISTS uploaded_by TEXT;

-- Add download_url column (separate from embed URL)
ALTER TABLE materials
ADD COLUMN IF NOT EXISTS download_url TEXT;

-- Create index for faster queries by exam period
CREATE INDEX IF NOT EXISTS idx_materials_exam_period ON materials(exam_period);

-- Create index for uploaded_by
CREATE INDEX IF NOT EXISTS idx_materials_uploaded_by ON materials(uploaded_by);

-- Add comment
COMMENT ON COLUMN materials.exam_period IS 'Exam period for this material: midterm or final';
COMMENT ON COLUMN materials.uploaded_by IS 'Admin email who uploaded this file (@cse.bubt.edu.bd)';
COMMENT ON COLUMN materials.download_url IS 'Direct download link (separate from embed URL)';

-- Sample data structure:
-- INSERT INTO materials (course_id, title, type, file_url, download_url, exam_period, uploaded_by)
-- VALUES (
--   'course_uuid_here',
--   'Chapter 1 Notes.pdf',
--   'notes',
--   'https://drive.google.com/file/d/FILE_ID/preview',
--   'https://drive.google.com/file/d/FILE_ID/view',
--   'midterm',
--   'admin@cse.bubt.edu.bd'
-- );

-- Verify changes
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'materials'
AND column_name IN ('exam_period', 'uploaded_by', 'download_url');
