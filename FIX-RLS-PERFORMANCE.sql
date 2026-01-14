-- FIX SUPABASE RLS PERFORMANCE WARNINGS
-- This optimizes Row Level Security policies for better performance and security

-- ============================================================================
-- 1. PROFILES TABLE - More secure policies
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can update profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;

-- INSERT: Only authenticated users can create their own profile
CREATE POLICY "Authenticated users can insert own profile" ON profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- SELECT: Users can read their own profile + read all public profile data
CREATE POLICY "Users can read profiles" ON profiles
    FOR SELECT
    TO authenticated, anon
    USING (true);  -- Allow reading all profiles (public student directory)

-- UPDATE: Users can only update their own profile
CREATE POLICY "Authenticated users can update own profile" ON profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- DELETE: Service role only
CREATE POLICY "Service role can delete profiles" ON profiles
    FOR DELETE
    TO service_role
    USING (true);

-- ============================================================================
-- 2. MATERIALS TABLE - Restrict to authenticated users
-- ============================================================================

DROP POLICY IF EXISTS "Allow all operations on materials" ON materials;
DROP POLICY IF EXISTS "Materials are readable by all" ON materials;
DROP POLICY IF EXISTS "Everyone can read materials" ON materials;
DROP POLICY IF EXISTS "Service role can manage materials" ON materials;
DROP POLICY IF EXISTS "Service role can update materials" ON materials;
DROP POLICY IF EXISTS "Service role can delete materials" ON materials;

-- SELECT: Everyone can read materials
CREATE POLICY "Everyone can read materials" ON materials
    FOR SELECT
    TO authenticated, anon
    USING (true);

-- INSERT: Only service role (admin/functions)
CREATE POLICY "Service role can manage materials" ON materials
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- UPDATE: Service role only
CREATE POLICY "Service role can update materials" ON materials
    FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);

-- DELETE: Service role only
CREATE POLICY "Service role can delete materials" ON materials
    FOR DELETE
    TO service_role
    USING (true);

-- ============================================================================
-- 3. NOTICES TABLE - Public read access
-- ============================================================================

DROP POLICY IF EXISTS "Allow all operations on notices" ON notices;
DROP POLICY IF EXISTS "Everyone can read notices" ON notices;
DROP POLICY IF EXISTS "Service role manages notices" ON notices;
DROP POLICY IF EXISTS "Service role updates notices" ON notices;
DROP POLICY IF EXISTS "Service role deletes notices" ON notices;

-- SELECT: Everyone can read notices
CREATE POLICY "Everyone can read notices" ON notices
    FOR SELECT
    TO authenticated, anon
    USING (true);

-- INSERT/UPDATE/DELETE: Service role only
CREATE POLICY "Service role manages notices" ON notices
    FOR INSERT
    TO service_role
    WITH CHECK (true);

CREATE POLICY "Service role updates notices" ON notices
    FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role deletes notices" ON notices
    FOR DELETE
    TO service_role
    USING (true);

-- ============================================================================
-- 4. PUSH_SUBSCRIPTIONS TABLE - User-owned subscriptions
-- ============================================================================

DROP POLICY IF EXISTS "Allow all on push_subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can read own subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can delete own subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Service role manages all subscriptions" ON push_subscriptions;

-- SELECT: Users can read their own subscriptions
CREATE POLICY "Users can read own subscriptions" ON push_subscriptions
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- INSERT: Users can create their own subscriptions
CREATE POLICY "Users can insert own subscriptions" ON push_subscriptions
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can update their own subscriptions
CREATE POLICY "Users can update own subscriptions" ON push_subscriptions
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- DELETE: Users can delete their own subscriptions
CREATE POLICY "Users can delete own subscriptions" ON push_subscriptions
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Service role can manage all subscriptions
CREATE POLICY "Service role manages all subscriptions" ON push_subscriptions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- 5. COURSES TABLE - Public read access
-- ============================================================================

DROP POLICY IF EXISTS "Everyone can read courses" ON courses;
DROP POLICY IF EXISTS "Service role manages courses" ON courses;

CREATE POLICY "Everyone can read courses" ON courses
    FOR SELECT
    TO authenticated, anon
    USING (true);

CREATE POLICY "Service role manages courses" ON courses
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check that RLS is enabled on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'materials', 'notices', 'push_subscriptions', 'courses');

-- List all policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
