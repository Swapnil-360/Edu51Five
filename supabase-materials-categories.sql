-- Add category column to materials table for organized material types
-- Categories: notes, suggestions, super-tips, slides, ct-questions, videos, other

-- Add category column if it doesn't exist
ALTER TABLE materials 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'other' 
CHECK (category IN ('notes', 'suggestions', 'super-tips', 'slides', 'ct-questions', 'videos', 'other'));

-- Update existing materials to have default category
UPDATE materials 
SET category = CASE 
    WHEN type = 'suggestion' THEN 'suggestions'
    WHEN type = 'past_question' THEN 'ct-questions'
    WHEN type = 'video' THEN 'videos'
    WHEN type = 'pdf' THEN 'notes'
    ELSE 'other'
END 
WHERE category IS NULL OR category = 'other';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_course_category ON materials(course_code, category);