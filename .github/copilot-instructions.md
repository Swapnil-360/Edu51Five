# Copilot Instructions for Edu51Five

## Project Overview
**Edu51Five** is an academic portal for BUBT (Bangladesh University of Business & Technology) Intake 51, Section 5 (CSE). It's a Vite + React + TypeScript SPA deployed on Vercel, featuring course materials, exam tracking, and semester progress visualization.

**Tech Stack:** React 18 + TypeScript + Vite + Supabase + Tailwind CSS + Vercel

## Architecture & Key Patterns

### 1. Hybrid Data Strategy (Critical!)
The app uses a **dual-source approach** for data:
- **Google Drive links** in `src/config/googleDrive.ts` - Primary source for course materials (PDFs, videos)
- **Supabase backend** - Secondary/optional for admin-uploaded materials and notices
- **Local fallbacks** - localStorage for notices when Supabase unavailable

**Why:** Google Drive provides free unlimited storage for large files, while Supabase handles metadata and admin features.

```typescript
// Pattern: Always check Google Drive files first, then Supabase
const files = getCourseFiles(courseCode, category); // Google Drive
const { data } = await supabase.from('materials').select('*'); // Supabase
```

### 2. Single-Page Navigation (No React Router!)
Uses **manual browser history management** instead of react-router-dom:
- `window.history.pushState()` for navigation
- `popstate` event listener for back/forward
- View state managed in `App.tsx` via `currentView` state

```typescript
const goToView = (view: 'admin' | 'section5' | 'course' | 'home', extra?: string) => {
  let path = view === 'course' && extra ? `/course/${extra}` : `/${view}`;
  window.history.pushState({}, '', path);
  setCurrentView(view);
};
```

**Why:** Simpler than router for this single-section app, avoids routing complexity.

### 3. Real-Time Semester Tracking
Live clock and progress tracking system in `src/config/semester.ts`:
- **Updates every second** via setInterval in components
- Calculates current phase (Regular/Midterm/Final/Break)
- Provides countdown to next milestone
- Bangladesh Standard Time (Asia/Dhaka timezone)

```typescript
// Pattern: Always use getCurrentSemesterStatus() for live data
const [semesterStatus, setSemesterStatus] = useState(getCurrentSemesterStatus());
useEffect(() => {
  const interval = setInterval(() => {
    setSemesterStatus(getCurrentSemesterStatus());
  }, 1000); // Every second for real-time updates
  return () => clearInterval(interval);
}, []);
```

### 4. Global Notice System (2-Notice Limit)
Only **2 global notices** exist system-wide:
- `welcome-notice` - Introduction/welcome message
- `exam-routine-notice` - Current exam schedule with optional image

**Never create more than 2 notices!** Update existing ones via admin panel.

## Development Workflows

### Local Development
```powershell
npm run dev          # Start dev server (port 5174)
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # ESLint check
```

### Database Setup (Supabase)
1. Create project at supabase.com
2. Run SQL in `supabase-setup.sql` (creates courses, materials, notices tables)
3. Create storage bucket named `materials` (public access)
4. Set environment variables in `.env`:
   ```
   VITE_SUPABASE_URL=your_url
   VITE_SUPABASE_ANON_KEY=your_key
   ```

**Graceful Degradation:** App works without Supabase (shows Google Drive files only). Check `src/lib/supabase.ts` for mock client.

### Deployment (Vercel)
- Connected to GitHub repo `Swapnil-360/Edu51Five`
- Auto-deploys on push to `main` branch
- `vercel.json` configures SPA routing (`/(.*) → /`)
- Build command: `npm run build` (outputs to `dist/`)

## Project-Specific Conventions

### Component Organization
```
src/
├── components/
│   ├── Admin/          # Admin-only components
│   ├── Student/        # Student-facing components
│   ├── Layout/         # Reusable layout components
│   ├── Search/         # Search functionality
│   └── *.tsx           # Shared components (PDFViewer, SemesterTracker)
├── config/             # Static configuration files
│   ├── googleDrive.ts  # All Google Drive links and file metadata
│   ├── semester.ts     # Academic calendar and progress logic
│   └── examMaterials.ts # Exam-specific content
├── lib/                # External service integrations
│   └── supabase.ts     # Supabase client (with mock fallback)
├── types/              # TypeScript type definitions
└── App.tsx             # Main app with view routing logic
```

### Styling Patterns
- **Tailwind CSS utility-first** - All styles inline via className
- **Responsive breakpoints:** sm (640px), md (768px), lg (1024px), xl (1280px)
- **Mobile-first design** - Base styles for mobile, add responsive classes for larger screens
- **Gradient patterns:** Every course/material has unique color scheme (see `getCourseColorScheme()`)
- **Glass morphism:** `backdrop-blur-*` + `bg-white/opacity` for modern effects

### Material Categories
Six fixed categories per course (defined in `googleDrive.ts`):
1. `notes` - Study notes
2. `slides` - Lecture slides
3. `ct-questions` - Class test questions
4. `suggestions` - Study suggestions
5. `super-tips` - Last-minute exam tips
6. `videos` - Video lectures

**Color schemes map to categories** - see `getCategoryInfo()` for icon/color assignments.

### Admin Password
Hardcoded: `edu51five2025` (see `App.tsx` line ~186)
- To change: Update `ADMIN_PASSWORD` constant
- Production: Consider environment variable or proper auth

## Common Tasks

### Adding a New Course
1. Add to Supabase via SQL or admin panel
2. Update `googleDrive.ts` with folder links:
   ```typescript
   "CSE-XXX": {
     name: "Course Name",
     folders: {
       "notes": "drive_link",
       "slides": "drive_link",
       // ... all 6 categories
     }
   }
   ```
3. Add file metadata in `getCourseFiles()` if preview needed

### Updating Semester Timeline
Edit `src/config/semester.ts`:
- `SEMESTER_CONFIG` - Dates for current semester
- `periods` - Regular/Midterm/Final dates
- Progress calculations update automatically

### Adding Files to Google Drive
1. Upload to appropriate course/category folder
2. Get shareable link (Anyone with link → Viewer)
3. Convert to embed URL: `https://drive.google.com/file/d/FILE_ID/preview`
4. Add to `getCourseFiles()` in `googleDrive.ts`

### Modifying Notices
Admin panel → "Update Notice" → Edits one of 2 global notices
- Welcome notice: General introduction
- Exam routine: Can include image upload to Supabase Storage

## Integration Points

### Supabase Tables
- `courses` - Course catalog (code, name, description)
- `materials` - Admin-uploaded files (optional, Google Drive is primary)
- `notices` - Global notices (2 max, stored in localStorage + DB)

### External Services
- **Google Drive** - All file storage and delivery
- **Supabase** - Database + Storage (optional, app works without it)
- **Vercel Analytics** - Imported in `main.tsx`

### Environment Variables
```env
VITE_SUPABASE_URL=        # Supabase project URL (optional)
VITE_SUPABASE_ANON_KEY=   # Supabase anon key (optional)
```

## Important Gotchas

1. **Don't use react-router-dom** - Manual history management in use
2. **Notices limited to 2** - System design constraint, not a bug
3. **Google Drive links expire** - Use `?usp=drive_link` format for stability
4. **Semester calculations update live** - Don't cache, always call `getCurrentSemesterStatus()`
5. **Mobile-first responsive** - Test on mobile viewports, not just desktop
6. **Supabase is optional** - App must work without backend connectivity
7. **Bangladesh timezone** - All times in Asia/Dhaka, not UTC

## Testing Approach
- Manual testing on mobile (primary user device)
- Check responsive breakpoints in DevTools
- Test without Supabase connection (mock client)
- Verify Google Drive preview links work
- Test admin password and material upload flow

## Current State (Fall 2025)
- **Active semester:** Fall 2025 (Jul 15 - Dec 15)
- **Current phase:** Mid-term period (Sep 14-24)
- **Active courses:** 5 (CSE-319, 327, 407, 417, 351)
- **Sections supported:** Section 5 only (expansion planned)
- **Total materials:** Mix of Google Drive files + admin uploads

---

**Key Philosophy:** This is a student-centric platform prioritizing **reliability** (works offline with Google Drive), **speed** (minimal dependencies), and **mobile experience** (most students access via phone). Keep it simple, fast, and accessible.
