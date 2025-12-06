# Course Name Update Verification

## Issue
The frontend code has been updated to show "Software Engineering" (CSE-327), but the **Supabase database** still contains the old name "Software Development".

When you click on a course:
1. App fetches courses from Supabase via `loadCourses()`
2. If successful, displays database data (old name)
3. Only shows hardcoded data if database fails

## Fix
Run this SQL in your **Supabase SQL Editor**:

```sql
UPDATE courses 
SET name = 'Software Engineering'
WHERE code = 'CSE-327' AND name = 'Software Development';
```

**Steps:**
1. Go to https://supabase.com → Your Project
2. Click "SQL Editor" on left sidebar
3. Click "New Query"
4. Paste the SQL above
5. Click "Run"
6. You should see: "1 row(s) updated"

## Verify
After running the SQL, hard refresh your browser: `Ctrl + Shift + R`

You should now see **"Software Engineering"** inside the course view.

## Why This Happened
- Frontend code is updated ✅
- Supabase database still has old value ❌
- The app prioritizes database data over hardcoded fallback

All frontend files already have "Software Engineering":
- ✅ src/App.tsx (line 842 fallback + line 177 hardcoded)
- ✅ src/components/Admin/SimpleDriveUpload.tsx
- ✅ src/components/Admin/EnhancedDriveUpload.tsx
- ✅ src/components/Admin/DirectDriveUpload.tsx
- ✅ src/config/semester.ts
- ✅ src/components/Admin/Dashboard.tsx
- ✅ src/config/googleDrive.ts
- ✅ src/components/Student/SectionView.tsx
