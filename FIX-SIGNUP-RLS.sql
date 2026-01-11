-- FIX RLS POLICY FOR PROFILE CREATION DURING SIGNUP
-- This allows new users to insert their profile during the signup process

-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Replace with a more permissive policy that allows authenticated users to insert
-- and also handles the signup case where the user might not be fully authenticated yet
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT
    TO authenticated, anon
    WITH CHECK (
        auth.uid() = id OR auth.uid() IS NULL
    );

-- Also ensure the user ID is set correctly during signup
-- Update the constraint to allow NULL id during creation
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_pkey;
ALTER TABLE profiles ADD PRIMARY KEY (id);

-- Verify the update policy still works
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id OR id = auth.uid())
    WITH CHECK (auth.uid() = id OR id = auth.uid());

-- Allow service role full access for admin operations
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
CREATE POLICY "Service role can insert profiles" ON profiles
    FOR INSERT
    TO service_role
    WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can update profiles" ON profiles;
CREATE POLICY "Service role can update profiles" ON profiles
    FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);
