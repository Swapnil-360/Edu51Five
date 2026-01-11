# Fix for "Row-Level Security Policy" Error During Signup

## Problem
When users try to sign up, they get this error:
```
new row violates row-level security policy for table 'profiles'
```

This happens because the RLS policy on the `profiles` table is too restrictive during the signup flow.

## Solution

### 1. Update Signup Code ✅ (Already Applied)
The signup modal now uses `insert` instead of `upsert` and properly passes the authenticated user ID.

### 2. Update RLS Policies (Manual Step Required)

Run this SQL in Supabase SQL Editor:

```sql
-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Replace with a more permissive policy
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Ensure service role can create profiles
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
CREATE POLICY "Service role can insert profiles" ON profiles
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Update policy should work for authenticated users
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
```

### 3. Verify the Profiles Table

Make sure the `profiles` table has these columns (the signup will fail silently if columns are missing):
- `id` (UUID, primary key) - matches auth user ID
- `bubt_email` (text)
- `notification_email` (text)
- `phone` (text)
- `name` (text)
- `section` (text)
- `major` (text)
- `profile_pic` (text)
- `created_at` (timestamp)
- `last_login_at` (timestamp)

### 4. Test Signup

After applying the SQL:
1. Close the signup modal
2. Click Sign Up again
3. Fill in the form and submit
4. You should see a success message instead of the RLS error

## If You Still Get an Error

1. Check Supabase logs (Supabase Dashboard → Logs)
2. Verify the `profiles` table exists and RLS is enabled
3. Verify the SQL was applied successfully
4. Make sure you're running the latest code
