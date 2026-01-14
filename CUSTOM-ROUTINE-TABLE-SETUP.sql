-- Custom Routine Storage Setup for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Create custom_routines table
CREATE TABLE IF NOT EXISTS custom_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_id TEXT NOT NULL,
  title TEXT NOT NULL,
  course_code TEXT,
  type TEXT NOT NULL CHECK (type IN ('regular', 'improvement', 'retake')),
  mode TEXT NOT NULL CHECK (mode IN ('theory', 'lab')),
  day TEXT NOT NULL CHECK (day IN ('Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat')),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  room TEXT,
  section TEXT,
  teacher TEXT,
  linked_to TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries by user
CREATE INDEX idx_custom_routines_user_id ON custom_routines(user_id);
CREATE INDEX idx_custom_routines_entry_id ON custom_routines(entry_id);

-- Enable Row Level Security
ALTER TABLE custom_routines ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own routines
CREATE POLICY "Users can view their own custom routines"
  ON custom_routines
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own routines
CREATE POLICY "Users can insert their own custom routines"
  ON custom_routines
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own routines
CREATE POLICY "Users can update their own custom routines"
  ON custom_routines
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own routines
CREATE POLICY "Users can delete their own custom routines"
  ON custom_routines
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_custom_routines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_custom_routines_timestamp
  BEFORE UPDATE ON custom_routines
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_routines_updated_at();

-- Grant permissions
GRANT ALL ON custom_routines TO authenticated;
GRANT ALL ON custom_routines TO service_role;
