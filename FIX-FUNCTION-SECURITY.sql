-- ============================================
-- FIX: Function Search Path Security Issue
-- ============================================
-- This fixes the "role mutable search_path" security warning
-- Run this in your Supabase SQL Editor

-- Drop and recreate the function with proper security settings
DROP FUNCTION IF EXISTS update_notices_timestamp() CASCADE;

CREATE OR REPLACE FUNCTION update_notices_timestamp()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS notices_update_timestamp ON notices;

CREATE TRIGGER notices_update_timestamp
    BEFORE UPDATE ON notices
    FOR EACH ROW
    EXECUTE FUNCTION update_notices_timestamp();

-- Verify the fix
SELECT 
    routine_name,
    routine_type,
    security_type,
    routine_definition
FROM information_schema.routines
WHERE routine_name = 'update_notices_timestamp';

-- ✅ Done! The security issue should now be resolved.
-- The function now has:
-- 1. SECURITY DEFINER - Runs with creator's privileges
-- 2. SET search_path = public - Prevents search path manipulation attacks
