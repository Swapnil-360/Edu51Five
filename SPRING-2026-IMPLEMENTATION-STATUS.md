# Spring 2026 Tri-Semester Migration - Implementation Summary

## ✅ Completed Tasks

### 1. Semester Configuration Updated ✅
**File:** `src/config/semester.ts`
- Updated to **Spring 2026** (Jan 15 - May 15, 2026)
- Implemented tri-semester system with 3 phases:
  - Regular Classes: Jan 15 - Mar 10
  - Mid-term Exams: Mar 11 - Mar 20
  - Final Exam Prep: Mar 21 - Apr 25
  - Final Exams: Apr 26 - May 10
- Summer Break: May 16 - Jun 14
- Next semester: Summer 2026 (starts Jun 15)
- Updated special events and timeline UI

### 2. SQL Migration Created ✅
**File:** `SPRING-2026-MIGRATION.sql`

Key changes:
- **Profiles table**: Major field now NOT NULL with CHECK constraint (AI, Software Engineering, Networking)
- **Courses table**: Added `major`, `semester`, `is_active` columns with indexes
- **Materials table**: Added `major` and `semester` tracking
- **RLS Policies**: Tightened security - users can only access courses/materials for their major
- **Helper functions**: `get_user_major()`, `can_access_course()` for major-based access control
- **Sample data**: Inserted courses for AI, Software Engineering, Networking majors

### 3. Supabase Authentication Implemented ✅
**File:** `src/App.tsx`

Major changes:
- Added `authSession`, `authLoading` states
- Implemented `onAuthStateChange` listener for real-time auth state
- Session persistence with localStorage fallback
- Profile loading from Supabase on signin
- Last login timestamp tracking
- Proper sign-out flow with Supabase auth + localStorage cleanup

Authentication flow now:
1. Check Supabase session on app load
2. Listen for auth state changes (SIGNED_IN/SIGNED_OUT)
3. Load profile from `profiles` table when authenticated
4. Update `last_login_at` timestamp
5. Clear session and profile on sign-out

## 🚧 Remaining Tasks

### 4. Gate Course/Material Views Behind Auth (IN PROGRESS)
**Need to add:**
- Auth check in `loadCourses()` - require authenticated session
- Auth check in `loadMaterials()` - require authenticated session
- Redirect to sign-in modal if user tries to access Section 5 without login
- Show sign-in prompt on course page if not authenticated
- Filter courses by user's major (AI/Software/Networking)

### 5. Major-Specific Course Filtering (NOT STARTED)
**Files to update:**
- `src/config/googleDrive.ts` - Add major-based folder structure
- `src/App.tsx` - Filter courses by `userProfile.major`
- Course fetcher - Add WHERE clause: `courses.major = user.major OR courses.major = 'Common'`

Example:
```typescript
const loadCourses = async () => {
  if (!authSession) {
    setCourses([]);
    return;
  }
  
  const userMajor = userProfile.major;
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .or(`major.eq.${userMajor},major.eq.Common`)
    .eq('semester', 'SPRING_2026')
    .eq('is_active', true);
  
  setCourses(data || []);
};
```

### 6. Update Home Page Sections (NOT STARTED)
**Current state:** Single "Section 5" card
**Target state:** Three major-based section cards

Changes needed:
- Replace single Section 5 button with 3 cards:
  - AI Major (Intake 51, AI)
  - Software Engineering Major (Intake 51, SE)
  - Networking Major (Intake 51, NET)
- Each card filters courses by major
- Update navigation: `/section5` → `/section/{major}`
- Update view state: `section5` → `sectionAI`, `sectionSE`, `sectionNET`

Example UI:
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <MajorCard 
    major="AI" 
    title="Artificial Intelligence"
    icon="🤖"
    courses={coursesAI}
  />
  <MajorCard 
    major="Software Engineering" 
    title="Software Engineering"
    icon="💻"
    courses={coursesSE}
  />
  <MajorCard 
    major="Networking" 
    title="Networking"
    icon="🌐"
    courses={coursesNET}
  />
</div>
```

## Next Steps

### Immediate (Complete Auth Gating):
1. Add `if (!isLoggedIn || !authSession) return` checks in loadCourses/loadMaterials
2. Show sign-in prompt instead of course list if not logged in
3. Test auth flow: signup → signin → view courses → signout

### Short-term (Major Filtering):
1. Update course queries to filter by `userProfile.major`
2. Add Google Drive folder structure for 3 majors
3. Update `getCourseFiles()` to support major-based paths

### Long-term (Home Page Redesign):
1. Create 3 major section cards on home page
2. Update routing to support `/section/ai`, `/section/se`, `/section/net`
3. Update course grid to show major-specific courses
4. Add section switcher if user wants to browse other majors (read-only?)

## Database Setup Instructions

1. **Run the migration in Supabase SQL Editor:**
   ```bash
   # Open Supabase Dashboard → SQL Editor
   # Copy and run: SPRING-2026-MIGRATION.sql
   ```

2. **Verify migration:**
   ```sql
   -- Check profiles structure
   SELECT column_name, data_type, is_nullable 
   FROM information_schema.columns 
   WHERE table_name = 'profiles';
   
   -- Check courses by major
   SELECT major, COUNT(*) 
   FROM courses 
   GROUP BY major;
   
   -- Check RLS policies
   SELECT tablename, policyname, cmd 
   FROM pg_policies 
   WHERE tablename IN ('profiles', 'courses', 'materials');
   ```

3. **Update existing user profiles:**
   ```sql
   -- Set default major for existing users (if any)
   UPDATE profiles 
   SET major = 'Software Engineering' 
   WHERE major IS NULL OR major = '';
   ```

## Testing Checklist

### Authentication:
- [ ] Sign up with new account (with major selection)
- [ ] Sign in with email + password
- [ ] Session persists on page reload
- [ ] Sign out clears session and redirects
- [ ] Unauthenticated users cannot access courses

### Major-Based Access:
- [ ] AI student sees only AI + Common courses
- [ ] SE student sees only SE + Common courses
- [ ] NET student sees only NET + Common courses
- [ ] Materials filtered by course major
- [ ] Google Drive folders organized by major

### UI/UX:
- [ ] Home page shows 3 major sections
- [ ] Section cards display course count
- [ ] Course grid filtered by selected major
- [ ] Semester tracker shows Spring 2026 timeline
- [ ] Dark/light mode works for all new components

## Notes

- **Backward Compatibility**: localStorage fallback still works for offline mode
- **Admin Access**: Admin password still `edu51five2025` - no major restriction
- **Google Drive**: Primary storage, Supabase for metadata only
- **RLS**: Authenticated users see only their major's content
- **Semester**: Tri-semester system (Spring, Summer, Fall) instead of traditional two

## Migration Rollback (If Needed)

If issues arise, rollback with:
```sql
-- Revert profiles major constraint
ALTER TABLE profiles ALTER COLUMN major DROP NOT NULL;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_major_check;

-- Revert courses major column
ALTER TABLE courses DROP COLUMN IF EXISTS major;
ALTER TABLE courses DROP COLUMN IF EXISTS semester;

-- Restore old RLS policies (permissive)
DROP POLICY IF EXISTS "Authenticated users read courses for their major" ON courses;
CREATE POLICY "Enable read access for all users" ON courses FOR SELECT USING (true);
```

---

**Status:** 50% Complete (3/6 tasks done)
**Next Action:** Implement auth gating in course/material loaders
**Estimated Time:** 2-3 hours for remaining tasks
