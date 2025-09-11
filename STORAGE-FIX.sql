-- Storage Fix: Disable RLS on storage objects
-- Run this in Supabase SQL Editor

-- Disable RLS on storage objects table (this is likely causing the upload issue)
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- If you want to re-enable it later with proper policies:
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Verify the change
SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = 'storage' AND tablename = 'objects';
