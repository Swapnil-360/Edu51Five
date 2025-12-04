# 🔧 Fix Active User Count - Setup Instructions

The active user count shows 0 because the database table needs to be created/migrated with the correct schema.

## Quick Fix (2 minutes)

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project
2. Click **SQL Editor** in the left sidebar
3. Create a new query

### Step 2: Run Migration SQL
Copy and paste the contents of `MIGRATE-ACTIVE-USERS-TABLE.sql` into the SQL editor and click **Run**.

This will:
- ✅ Drop the old table (if it exists with wrong schema)
- ✅ Create new `active_users` table with correct columns:
  - `session_id` (device ID)
  - `page_name` (student/admin)
  - `updated_at` (last activity timestamp)
  - `last_seen` (for reference)
- ✅ Set up proper policies for public access
- ✅ Enable real-time subscriptions

### Step 3: Test It
1. Open the website on **Device A** → go to any course
2. Open admin dashboard on **Device B**
3. The Active Users count should show **1** and update in real-time

## How It Works Now

### Active User Tracking:
- Device ID stored in `localStorage` (survives refresh)
- Updated every **10 seconds** while on student/admin pages
- Shows users **active in last 2 minutes**

### Real-Time Updates:
- Admin panel updates **instantly** when users join/leave
- No polling delays
- Uses Supabase PostgreSQL real-time subscriptions

## Debug Console Logs

Open browser DevTools (F12) → Console to see:

```
✅ Tracking user presence as student [device_id]
🔍 Fetching active users... Filter: updated_at > [timestamp]
✅ Active users count updated: 1
✅ Presence tracked for student page at [timestamp]
```

If you see **❌** errors, the table might not exist or have wrong permissions.

## Troubleshooting

**Still showing 0?**
- Check browser console for error messages
- Verify SQL migration ran without errors
- Make sure you're on different devices/browsers

**Real-time not updating?**
- Check Supabase table has realtime enabled
- Verify `active_users` is in the publication: Settings → Realtime → Add Table

**Getting permission errors?**
- Run the migration SQL again
- Make sure Row Level Security policies are set to public access
