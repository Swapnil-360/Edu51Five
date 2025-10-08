-- Add exam_period column to materials table
-- This allows materials to be categorized as midterm or final exam materials

-- Add the exam_period column with default value 'midterm' for backward compatibility
ALTER TABLE materials 
ADD COLUMN IF NOT EXISTS exam_period TEXT DEFAULT 'midterm' CHECK (exam_period IN ('midterm', 'final'));

-- Update existing materials to be midterm by default
UPDATE materials 
SET exam_period = 'midterm' 
WHERE exam_period IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN materials.exam_period IS 'Exam period for the material: midterm or final';
