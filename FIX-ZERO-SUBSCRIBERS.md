# Fix: "Push notification sent to 0 subscriber(s)"

## Problem
Users have enabled notifications but the system shows 0 subscribers.

## Diagnosis Steps

### Step 1: Check if table exists

Run this SQL in **Supabase SQL Editor**:

```sql
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'push_subscriptions'
) AS table_exists;
```

**If returns FALSE:** Table doesn't exist → Go to **Solution A**
**If returns TRUE:** Table exists → Go to **Step 2**

---

### Step 2: Check subscription count

```sql
SELECT COUNT(*) as total_subscriptions FROM push_subscriptions;
```

**If returns 0:** No subscriptions saved → Go to **Solution B**
**If returns > 0:** Subscriptions exist → Go to **Solution C**

---

## Solutions

### Solution A: Create the Table (If it doesn't exist)

Run this SQL in **Supabase SQL Editor**:

```sql
-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT UNIQUE NOT NULL,
    subscription JSONB NOT NULL,
    endpoint TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_session_id ON push_subscriptions(session_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_updated_at ON push_subscriptions(updated_at DESC);

-- Disable RLS for easier testing (re-enable later with proper policies)
ALTER TABLE push_subscriptions DISABLE ROW LEVEL SECURITY;

-- Verify table created
SELECT * FROM push_subscriptions;
```

After running this, **reload your app** and have users **re-enable notifications**.

---

### Solution B: Subscriptions Not Saving

If the table exists but has 0 rows, subscriptions aren't being saved. Check:

#### B1. Check browser console for errors

1. Open your app in browser
2. Press **F12** → Console tab
3. Enable notifications
4. Look for errors like:
   - "Error saving push subscription"
   - "Permission denied"
   - "Failed to subscribe"

#### B2. Check RLS (Row Level Security) policies

```sql
-- Check if RLS is blocking inserts
SELECT * FROM pg_policies WHERE tablename = 'push_subscriptions';

-- Temporarily disable RLS for testing
ALTER TABLE push_subscriptions DISABLE ROW LEVEL SECURITY;

-- OR set proper policies
DROP POLICY IF EXISTS "Allow public insert push subscriptions" ON push_subscriptions;
CREATE POLICY "Allow public insert push subscriptions" ON push_subscriptions
    FOR ALL
    USING (true)
    WITH CHECK (true);
```

#### B3. Verify Supabase connection

Check your `.env` file has:
```env
VITE_SUPABASE_URL=https://aljnyhxthmwgesnkqwzu.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

#### B4. Test manual insert

Try inserting a test subscription:
```sql
INSERT INTO push_subscriptions (session_id, subscription, endpoint)
VALUES (
    'test-session-123',
    '{"endpoint":"https://fcm.googleapis.com/test","keys":{"p256dh":"test","auth":"test"}}'::jsonb,
    'https://fcm.googleapis.com/test'
);

-- Check if it worked
SELECT * FROM push_subscriptions WHERE session_id = 'test-session-123';
```

If this works, the issue is in the frontend. If it fails, check error message.

---

### Solution C: Subscriptions Exist But Not Being Sent

If subscriptions exist in database but Edge Function returns 0:

#### C1. Check Edge Function logs

```powershell
npx supabase functions logs send-push-notification --limit 20
```

Look for errors like:
- "Missing VAPID_PUBLIC_KEY"
- "Failed to get subscriptions"
- "No active subscriptions found"

#### C2. Verify VAPID keys in Edge Function

```powershell
npx supabase secrets list
```

Should show:
- VAPID_PUBLIC_KEY
- VAPID_PRIVATE_KEY

If missing, set them:
```powershell
npx supabase secrets set VAPID_PUBLIC_KEY=BGTEAag0_lKOToSElyiwSSMmtLG7V6paCY8EE51pC6FI6IJBl2uPoHb3KaVydzxQHmQJZ6izx_eN_Dq7bYv8dOk

npx supabase secrets set VAPID_PRIVATE_KEY=0bzOYBk7N5_qalitGCY2hMe4IvIGmSssdgg6aQfvX7E
```

#### C3. Test Edge Function directly

```powershell
$body = @{
    title = "Test"
    body = "Test notification"
    url = "/"
    broadcast = $true
} | ConvertTo-Json

curl -X POST "https://aljnyhxthmwgesnkqwzu.supabase.co/functions/v1/send-push-notification" `
  -H "Authorization: Bearer YOUR_ANON_KEY" `
  -H "Content-Type: application/json" `
  -d $body
```

Replace `YOUR_ANON_KEY` with your Supabase anon key from `.env`.

---

## Quick Fix Checklist

✅ **Step 1:** Run `PUSH-NOTIFICATIONS-SETUP.sql` in Supabase SQL Editor
✅ **Step 2:** Run `DIAGNOSE-PUSH-SUBS.sql` to check table and data
✅ **Step 3:** Disable RLS temporarily: `ALTER TABLE push_subscriptions DISABLE ROW LEVEL SECURITY;`
✅ **Step 4:** Reload app and re-enable notifications
✅ **Step 5:** Check browser console (F12) for errors
✅ **Step 6:** Check subscription count: `SELECT COUNT(*) FROM push_subscriptions;`
✅ **Step 7:** Test broadcast again

---

## Most Common Cause

**99% of the time:** The `push_subscriptions` table doesn't exist or RLS is blocking inserts.

**Quick fix:**
```sql
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT UNIQUE NOT NULL,
    subscription JSONB NOT NULL,
    endpoint TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE push_subscriptions DISABLE ROW LEVEL SECURITY;
```

Then reload your app and re-enable notifications.

---

## Still Not Working?

Share the output of:
1. `SELECT COUNT(*) FROM push_subscriptions;`
2. Browser console logs when enabling notifications
3. Edge Function logs: `npx supabase functions logs send-push-notification`
