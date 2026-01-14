# Custom Routine Database Setup Guide

## Overview
This guide walks you through setting up the Supabase database for cross-device custom routine synchronization. Once deployed, students can access their custom routines from any device after logging in.

## Prerequisites
- Supabase project already connected (environment variables set in `.env`)
- Admin access to Supabase SQL Editor

## Deployment Steps

### 1. Execute SQL Setup
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Open the file `CUSTOM-ROUTINE-TABLE-SETUP.sql` from this repo
4. Copy all SQL content
5. Paste into a new query in SQL Editor
6. Click **Run** to execute

### 2. Verify Table Creation
After execution, verify in **Table Editor**:
- Table name: `custom_routines`
- Columns visible:
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `entry_id` (text, unique per entry)
  - `title`, `course_code`, `type`, `mode`, `day`, `start_time`, `end_time`
  - `room`, `section`, `teacher`, `linked_to`
  - `created_at`, `updated_at` (timestamps)

### 3. Verify RLS Policies
Check **Authentication > Policies**:
- `custom_routines` should have 4 policies:
  - `Users can view their own routines` (SELECT)
  - `Users can insert their own routines` (INSERT)
  - `Users can update their own routines` (UPDATE)
  - `Users can delete their own routines` (DELETE)

All policies should use `auth.uid() = user_id` condition.

### 4. Test the Feature
1. **As Guest User:**
   - Add custom routine entries
   - Verify they save to localStorage only
   - Check console: no sync errors, sync indicators hidden

2. **As Logged-In User:**
   - Log in via the app
   - Navigate to Custom Routine page
   - Add an entry
   - Verify "Synced" message appears in header
   - Open Supabase Table Editor
   - Check `custom_routines` table has new row

3. **Cross-Device Sync:**
   - Log in on different device/browser
   - Navigate to Custom Routine
   - Verify entries load automatically from database

## How It Works

### On Mount (Page Load)
1. Component calls `loadFromDatabase()`
2. Checks if user is authenticated via `supabase.auth.getUser()`
3. If logged in:
   - Fetches all entries from `custom_routines` where `user_id = auth.uid()`
   - Loads into React state
   - Saves to localStorage (fallback for offline)
4. If not logged in:
   - Loads from localStorage only

### On Every Change (Add/Remove Entry)
1. Component updates React state
2. Saves to localStorage immediately
3. Calls `syncToDatabase()` automatically
4. If logged in:
   - Deletes all existing entries for user
   - Inserts current entries as fresh batch
   - Shows "Syncing..." then "Synced" in header
5. If not logged in:
   - Silently skips sync (no errors)

### Graceful Degradation
- **No internet:** Uses localStorage cache
- **Not logged in:** Works fully offline with localStorage
- **Supabase down:** Logs error, continues with localStorage
- **Sync failed:** Shows "Sync failed" message, retries on next change

## Data Structure

### RoutineEntry (React State)
```typescript
{
  id: string;              // UUID
  title: string;           // "Software Engineering"
  courseCode?: string;     // "CSE-327"
  type: RoutineType;       // "regular" | "improvement" | "retake"
  mode: ClassMode;         // "theory" | "lab"
  day: Day;                // "Sun" | "Mon" | ...
  start: string;           // "09:45"
  end: string;             // "11:15"
  room?: string;           // "2710"
  section?: string;        // "Intake 51, S-5"
  teacher?: string;        // "SHB"
  linkedTo?: string;       // UUID of paired 3hr lab slot
  createdAt: number;       // Unix timestamp
}
```

### Database Row (custom_routines)
```sql
{
  id: uuid;                -- Auto-generated primary key
  user_id: uuid;           -- References auth.users(id)
  entry_id: text;          -- Maps to RoutineEntry.id
  title: text;
  course_code: text;
  type: text;              -- "regular" | "improvement" | "retake"
  mode: text;              -- "theory" | "lab"
  day: text;               -- "Sun" | "Mon" | ...
  start_time: text;        -- "09:45"
  end_time: text;          -- "11:15"
  room: text;
  section: text;
  teacher: text;
  linked_to: text;         -- entry_id of paired slot
  created_at: timestamptz; -- Auto-set on insert
  updated_at: timestamptz; -- Auto-updated by trigger
}
```

## Security

### Row Level Security (RLS)
- **Enabled** on `custom_routines` table
- Users can only access their own data (filtered by `user_id`)
- No cross-user data leakage possible
- Admin access requires direct SQL queries with proper permissions

### Data Privacy
- All entries scoped to authenticated user
- Guest users: data stays in browser localStorage only
- Logged-in users: data encrypted in transit (HTTPS + Supabase TLS)
- No public read access to any custom routines

## Troubleshooting

### "Sync failed" message appears
1. Check browser console for errors
2. Verify Supabase connection in Network tab
3. Confirm environment variables set correctly
4. Check RLS policies allow INSERT/UPDATE/DELETE

### Entries don't load after login
1. Verify user is authenticated (`supabase.auth.getUser()` returns user)
2. Check `custom_routines` table has rows for that `user_id`
3. Look for console errors during `loadFromDatabase()`
4. Try clearing localStorage and syncing fresh entries

### Duplicate entries appear
- Likely caused by multiple tabs/windows modifying simultaneously
- Each change triggers full replace (delete all + insert all)
- Consider closing extra tabs or refreshing page

### Entries lost after logout
- Expected behavior: localStorage cleared on logout
- After re-login, entries reload from database automatically
- If missing: check database has entries for that user_id

## Performance Considerations

### Sync Strategy: Full Replace
- **Why:** Simplest conflict resolution (no merge logic needed)
- **Trade-off:** More database writes (DELETE + INSERT batch on every change)
- **Impact:** Minimal for typical use (5-15 entries, <1KB data)
- **Future optimization:** Could implement delta sync (only send changed entries)

### Query Optimization
- Index on `user_id` ensures fast lookups (created in SQL setup)
- Index on `entry_id` speeds up conflict resolution queries
- `created_at` index allows efficient ordering

### Client-Side Caching
- localStorage serves as offline cache
- Reduces database reads (only loads on mount)
- Instant UI updates (no waiting for database)

## Maintenance

### Cleanup Stale Data
Run periodically to remove entries from deleted users:
```sql
DELETE FROM custom_routines
WHERE user_id NOT IN (SELECT id FROM auth.users);
```

### Monitor Table Size
Check table statistics:
```sql
SELECT 
  COUNT(*) as total_entries,
  COUNT(DISTINCT user_id) as total_users,
  pg_size_pretty(pg_total_relation_size('custom_routines')) as table_size
FROM custom_routines;
```

### Backup Entries
Export all entries to JSON:
```sql
SELECT json_agg(row_to_json(custom_routines)) 
FROM custom_routines;
```

## Migration Notes

### From localStorage-only to Database
- Old users: entries auto-sync on first login after deployment
- No data loss: localStorage serves as source of truth until synced
- Gradual rollout: works seamlessly for both guest and logged-in users

### Future Enhancements
- **Version control:** Track entry history (add `version` column)
- **Soft delete:** Add `deleted_at` column instead of hard delete
- **Shared routines:** Add `shared_with` array for group schedules
- **Delta sync:** Implement incremental updates (only changed entries)

---

**Deployment Checklist:**
- [ ] SQL executed in Supabase SQL Editor
- [ ] `custom_routines` table visible in Table Editor
- [ ] 4 RLS policies visible in Policies page
- [ ] Tested as guest user (localStorage only)
- [ ] Tested as logged-in user (sync indicators visible)
- [ ] Verified cross-device sync works
- [ ] Checked browser console for errors
- [ ] Confirmed "Synced" message appears after changes
