## 🔍 Debugging Active User Count (Still Showing 0?)

Follow these steps to identify the exact problem:

### Step 1: Open Browser Console
1. Open the website in a browser
2. Press **F12** to open DevTools
3. Go to **Console** tab
4. **Keep console open while testing**

### Step 2: Navigate to a Student Page
Navigate to any course (e.g., CSE-319) and watch the console.

**You should see:**
```
✅ Tracking user presence as student device_12345...
📝 Inserting presence: session=device_12345..., page=student, time=2025-12-05T...
✅ Presence tracked: student (device_12345...)
```

**If you see ❌ errors instead:**
- Copy the full error message
- It will tell us what's wrong with the table

### Step 3: Open Admin Dashboard
Now open admin dashboard on same or different browser/device and watch console.

**You should see:**
```
🔍 Fetching active users count...
📊 Total records in active_users: 1
✅ Active student users (last 2 min): 1
```

**If you see ❌ errors like:**
- `"Table not found"` → Table doesn't exist, need to run migration SQL
- `"Permission denied"` → Policies need to be fixed
- `"Column not found"` → Table has wrong schema

### Common Issues & Fixes

#### ❌ "relation "public.active_users" does not exist"
**Problem:** Table doesn't exist
**Fix:** Run `MIGRATE-ACTIVE-USERS-TABLE.sql` in Supabase SQL Editor

#### ❌ "permission denied for table active_users"
**Problem:** Row level security policies are blocking access
**Fix:** Run the migration SQL again to reset policies

#### ❌ "column "page_name" does not exist"
**Problem:** Old table schema (has `page` instead of `page_name`)
**Fix:** Run `MIGRATE-ACTIVE-USERS-TABLE.sql` to drop and recreate table

#### Shows 0 but no errors
**Problem:** Data is being inserted but with wrong page_name
**Debugging:**
1. Go to Supabase → SQL Editor
2. Run: `SELECT * FROM active_users;`
3. Check if records exist and have:
   - ✅ `session_id` populated
   - ✅ `page_name` = "student" or "admin"
   - ✅ `updated_at` is recent (within 2 minutes)

### Manual Test in Supabase

Run this SQL to check the table state:

```sql
-- Check all data
SELECT session_id, page_name, updated_at, created_at 
FROM active_users 
ORDER BY updated_at DESC;

-- Count by page
SELECT page_name, COUNT(*) as count 
FROM active_users 
WHERE updated_at > NOW() - INTERVAL '2 minutes'
GROUP BY page_name;

-- Check total records
SELECT COUNT(*) as total FROM active_users;
```

### Verify Realtime is Enabled

1. Go to Supabase → Settings → Realtime
2. Look for `active_users` table in the list
3. If not there, click "Add table" and select `active_users`

### Still Not Working?

Send me these console logs from your browser:
1. Error messages from when you navigate to a course
2. Error messages from admin dashboard
3. Output of the SQL test queries above
