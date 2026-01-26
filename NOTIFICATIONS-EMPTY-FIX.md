## Why Notifications Are Empty - Quick Summary

### The Problem
- Notifications show as **empty** on home and admin pages
- Should load from Supabase database but don't appear
- Users see: "No notifications" message

### The Root Cause
The `notices` table is **missing important columns**:

**Current columns (created by setup):**
```
id, title, content, type, is_active, created_at
```

**Missing columns (required by app):**
```
category, priority, exam_type, event_date
```

When the app loads notices, it expects these fields but gets `NULL` values, causing the data to be invalid.

---

## The Fix (3 Simple Steps)

### 1️⃣ Add Missing Columns to Database
**Where:** Supabase SQL Editor (https://supabase.com)

**Run this SQL:**
```sql
ALTER TABLE notices ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'announcement';
ALTER TABLE notices ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';
ALTER TABLE notices ADD COLUMN IF NOT EXISTS exam_type TEXT DEFAULT NULL;
ALTER TABLE notices ADD COLUMN IF NOT EXISTS event_date DATE DEFAULT NULL;
```

### 2️⃣ Insert Default Notices
**Run this SQL to add sample notices:**
```sql
INSERT INTO notices (id, title, content, type, category, priority, is_active)
VALUES 
(
  'welcome-notice',
  '🎉 Welcome to Edu51Five',
  'Welcome to your academic platform!',
  'info',
  'announcement',
  'normal',
  true
),
(
  'exam-routine-notice', 
  '📅 Exam Schedule',
  'Your final exams are scheduled for December 4-14, 2025.',
  'warning',
  'exam',
  'high',
  true
)
ON CONFLICT (id) DO NOTHING;
```

### 3️⃣ Reload the App
```
1. Open browser DevTools (F12)
2. Run: localStorage.clear()
3. Refresh page (Ctrl+R)
```

---

## Verification

✅ **Done when you see:**
- 🔔 Bell icon shows notification count
- Click bell → See 2+ notices listed
- Browser console shows: `✅ Database notices loaded: X notices`

---

## How Notifications Work

```
Page loads
   ↓
loadNotices() function runs
   ↓
Query Supabase: SELECT * FROM notices WHERE is_active=true
   ↓
If database has data → Show it
If database empty → Initialize defaults
If database error → Use localStorage (fallback)
   ↓
Notice panel displays the data
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/App.tsx` (line 1410) | `loadNotices()` function |
| `src/App.tsx` (line 567-576) | `activeNotices` calculation |
| `src/types/index.ts` (line 40) | Notice interface |
| Supabase | Database storage |

---

## Common Issues

| Issue | Solution |
|-------|----------|
| Still showing empty after fix | Clear localStorage: `localStorage.clear()` then reload |
| See "No notifications" message | Insert default notices using SQL above |
| Database connection error | Check `.env` file has Supabase URL & key |
| Notices disappear after reload | Add RLS policy: `CREATE POLICY "Enable read" ON notices FOR SELECT USING (true)` |

---

## Creating Notifications (Admin)

### Option A: Admin Panel (Easy)
1. Login with password: `edu51five2025`
2. Click "Create Notice"
3. Fill form → Click "Create Notice"

### Option B: Direct SQL (Fast)
```sql
INSERT INTO notices (id, title, content, type, category, priority, is_active)
VALUES (
  'my-notice-' || gen_random_uuid()::text,
  'Announcement Title',
  'Announcement content here',
  'info',
  'announcement',
  'normal',
  true
);
```

---

**Questions?** Check [NOTIFICATIONS-FIX-GUIDE.md](./NOTIFICATIONS-FIX-GUIDE.md) for detailed troubleshooting.
