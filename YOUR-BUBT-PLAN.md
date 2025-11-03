# BUBT Student Features - YOUR PLAN ✨

## 🎯 The Concept

When BUBT students sign in with `@cse.bubt.edu.bd` Gmail, they get a **BUBT Portal** with quick access to all their tools - right from the app!

---

## 🚀 What BUBT Students Get (4 Features)

### 1. Google Classroom Access 📚
```
Icon: Classroom icon
Click: Opens Google Classroom
  • On Phone: Opens Classroom mobile app
  • On PC: Opens Classroom website in new tab
No login needed (already signed in with their BUBT Gmail)
```

### 2. BUBT Annex 🏢
```
Icon: BUBT icon
Click: Opens BUBT Annex website in new tab
```

### 3. Updated Routine Website 📅
```
Icon: Calendar icon
Click: Opens Routine website in new tab
```

### 4. Personal Gmail Drive 📁 (INSIDE APP!)
```
Icon: Drive icon
Click: Opens their personal Google Drive inside the app
(Using Google Drive API - same as CourseDriveView)
Shows all their personal files
Can browse, open, download
No new tab needed - stays in app
```

---

## 📱 UI Design

### Header (When BUBT Student Logged In)
```
[Logo] [Dark Mode] [👤 Raj (BUBT)] [⚙️ Settings] [Logout]
```

### Main Navigation
```
Sidebar:
- Courses
- Exam Materials
- Semester Tracker
+ BUBT Portal ← NEW!
```

### BUBT Portal Page (NEW) 🎨
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎓 BUBT PORTAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Welcome, Raj! 👋

[Grid of 4 Cards]

┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│   BookOpen      │   Building2     │   Calendar      │   HardDrive     │
│   CLASSROOM     │   ANNEX         │   ROUTINE       │   MY DRIVE      │
├─────────────────┼─────────────────┼─────────────────┼─────────────────┤
│                 │                 │                 │                 │
│  Open in new    │  Open in new    │  Open in new    │  Browse inside  │
│  tab/app        │  tab            │  tab            │  app (Drive API)│
│                 │                 │                 │                 │
│  [→ Open]       │  [→ Open]       │  [→ Open]       │  [→ Browse]     │
│                 │                 │                 │                 │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Signed in as: raj@cse.bubt.edu.bd | [Sign Out]
```

---

## 🔐 How It Works

### Step 1: BUBT Student Signs In
```
1. Visits app
2. Clicks "👤 Sign In (BUBT)"
3. Signs in with raj@cse.bubt.edu.bd (Google OAuth)
4. App validates: Email ends with @cse.bubt.edu.bd ✅
5. Stores in localStorage: email, Google OAuth token
```

### Step 2: Navigate to BUBT Portal
```
1. Sidebar shows "BUBT Portal" link (new)
2. Clicks "BUBT Portal"
3. Goes to /bubt-portal page
4. Sees 4 cards with icons
```

### Step 3: Click Each Icon

**BookOpen - Google Classroom:**
```
Icon: BookOpen (Lucide React)
URL: https://classroom.google.com
Click → Opens in new tab/app

If Phone:
  • Opens Classroom mobile app (if installed)
  • Fallback to web browser

If PC:
  • Opens https://classroom.google.com in new tab
```

**BUBT Annex Logo - BUBT Annex:**
```
Icon: https://annex.bubt.edu.bd/global_file/gazo/rf_sis.png (BUBT official logo)
URL: https://annex.bubt.edu.bd/
Click → Opens in new tab

Shows BUBT Annex website with announcements and information
```

**Calendar - Updated Routine:**
```
Icon: Calendar (Lucide React)
URL: https://routine.bubt.edu.bd/
Click → Opens in new tab

Shows class routine and exam schedule for all sections
```

**HardDrive - My Personal Drive:**
```
Icon: HardDrive (Lucide React)
Click → Opens their personal Google Drive inside app
Uses Google Drive API (user's authenticated Gmail)

Full Access:
✅ Browse all files and folders
✅ Create new folders
✅ Upload files
✅ Download files
✅ Delete files
✅ Rename files/folders
✅ Move files
✅ Share files (if they want)
✅ View file details

No new tab - stays in app
Same interface as Google Drive website but inside our app
```

---

## 💻 Technical Implementation

### Context/State
```typescript
// In App.tsx or new BubtContext.tsx
const [bubtUser, setBubtUser] = useState({
  email: "raj@cse.bubt.edu.bd",
  accessToken: "google_oauth_token_here",
  isBubtStudent: true
})
```

### Components to Create
1. **BubtPortal.tsx** - Main page with 4 cards
2. **BubtDriveAccess.tsx** - Personal Drive browser (similar to CourseDriveView)

### Components to Modify
1. **App.tsx** - Add "BUBT Portal" to sidebar
2. **App.tsx** - Add BUBT sign-in logic

### Google Drive API Usage
```typescript
// For Personal Drive Access
// Same as current CourseDriveView but:
// - User's root Drive (not a shared folder)
// - Show all personal files
// - User can browse and download
```

---

## 🎯 User Flow

### Anonymous Student (No Sign-in)
```
Visit app → Browse Courses → See Materials → Leave
(No BUBT Portal available)
```

### BUBT Student (Signed In)
```
Visit app
  ↓
Click "Sign In (BUBT)"
  ↓
Sign in with raj@cse.bubt.edu.bd
  ↓
✅ Logged in! Header shows "👤 Raj (BUBT)"
  ↓
Sidebar shows new "BUBT Portal" link
  ↓
Click "BUBT Portal"
  ↓
See 4 cards:
  📚 Classroom → Opens in app/new tab
  🏢 Annex → Opens in new tab
  📅 Routine → Opens in new tab
  📁 My Drive → Browse inside app
  ↓
Can explore all 4 tools
  ↓
Sign Out when done
```

---

## 📋 Implementation Checklist

### Phase 1: Infrastructure (SAME AS BEFORE)
- [ ] Create BubtUser context
- [ ] Create useBubtUser hook
- [ ] Setup localStorage logic
- [ ] Email validation (@cse.bubt.edu.bd)

### Phase 2: Sign-In UI (SAME AS BEFORE)
- [ ] Create "Sign In (BUBT)" button in header
- [ ] Create BubtAuthModal component
- [ ] Google OAuth integration
- [ ] Show "Sign Out" when logged in

### Phase 3: BUBT Portal Page (NEW!)
- [ ] Create BubtPortal.tsx component
- [ ] Create 4 cards layout (Classroom, Annex, Routine, Drive)
- [ ] Add responsive styling (mobile-first)
- [ ] Add to App.tsx routing

### Phase 4: Classroom Icon
- [ ] Detect platform (mobile vs PC)
- [ ] Mobile: Try to open app, fallback to web
- [ ] PC: Open classroom.google.com in new tab

### Phase 5: BUBT Annex & Routine
- [ ] Add links/buttons for Annex
- [ ] Add links/buttons for Routine
- [ ] Both open in new tab

### Phase 6: Personal Drive Access (MOST COMPLEX)
- [ ] Create BubtDriveAccess.tsx component
- [ ] Use Google Drive API to access user's root Drive
- [ ] Show file/folder browser inside app
- [ ] Add download functionality
- [ ] Add back button to return to portal

### Phase 7: Testing & Polish
- [ ] Test on mobile
- [ ] Test on PC
- [ ] Test Classroom app detection
- [ ] Test Drive API access
- [ ] Style consistency

---

## 🎨 Design Notes

**Colors:** Use existing Tailwind colors
**Icons:** Use existing Lucide React icons
**Mobile-First:** Design for mobile first, then scale up
**Dark Mode:** Support dark/light modes (already have this)

---

## ❓ Questions Clarified ✅

1. ✅ **BUBT Annex URL** - https://annex.bubt.edu.bd/
2. ✅ **Updated Routine URL** - https://routine.bubt.edu.bd/
3. ✅ **BUBT Annex Icon** - https://annex.bubt.edu.bd/global_file/gazo/rf_sis.png
4. ✅ **Personal Drive** - Full access (browse, upload, download, create, delete, everything!)
5. ✅ **Classroom** - Opens in app (mobile) or new tab (PC)

---

## ✅ Ready to Build!

All details confirmed:
- ✅ URLs confirmed
- ✅ Icons chosen (BUBT logo for Annex, Lucide icons for others)
- ✅ Personal Drive: Full access (browse, upload, download, delete, etc)
- ✅ Classroom: Auto-detect mobile/PC
- ✅ Architecture: BUBT Portal page with 4 cards

---

## 🚀 BUILD PHASES

### Phase 1: Infrastructure (1-2 hours)
- [ ] Create BubtContext.tsx (context for user auth state)
- [ ] Create useBubtUser hook (use BUBT user from context)
- [ ] Setup localStorage logic (save/load BUBT email)
- [ ] Email validation (@cse.bubt.edu.bd)
- [ ] Create types for BubtUser

### Phase 2: Sign-In Modal (2-3 hours)
- [ ] Create BubtAuthModal.tsx component
- [ ] Add "Sign In (BUBT)" button in App.tsx header
- [ ] Google OAuth integration (@react-oauth/google)
- [ ] Show user info when logged in
- [ ] Add "Sign Out" button
- [ ] Update header conditionally

### Phase 3: BUBT Portal Page (1-2 hours)
- [ ] Create BubtPortal.tsx component
- [ ] Add "BUBT Portal" link to sidebar (only when logged in)
- [ ] Create 4 card layout
- [ ] Add responsive grid (mobile/tablet/desktop)
- [ ] Add styling (match existing design, dark mode support)

### Phase 4: Classroom Icon (30 minutes)
- [ ] Detect device type (mobile vs PC)
- [ ] Mobile: Try to open app, fallback to web
- [ ] PC: Open in new tab
- [ ] Add BookOpen icon (Lucide)

### Phase 5: Annex & Routine Icons (30 minutes)
- [ ] Add BUBT Annex card with official logo
- [ ] Add Routine card with Calendar icon
- [ ] Both open URL in new tab
- [ ] Add link icons

### Phase 6: Personal Drive Browser (3-4 hours) - MOST COMPLEX
- [ ] Create BubtDriveAccess.tsx component
- [ ] Use Google Drive API to access user's root drive
- [ ] Show file/folder tree structure
- [ ] Add upload functionality
- [ ] Add download functionality
- [ ] Add delete/rename/create folder
- [ ] Add breadcrumb navigation
- [ ] Add search/filter
- [ ] Handle large file uploads
- [ ] Add progress indicators
- [ ] Add responsive design

### Phase 7: Polish & Testing (1-2 hours)
- [ ] Test on mobile
- [ ] Test on desktop
- [ ] Test dark/light mode
- [ ] Test sign-in/logout flow
- [ ] Test all 4 links work
- [ ] Fix styling issues
- [ ] Test Google Drive operations
- [ ] Performance optimization

---

## 📊 Estimated Timeline

| Phase | Hours | Difficulty |
|-------|-------|-----------|
| 1. Infrastructure | 1.5 | Easy |
| 2. Sign-In Modal | 2.5 | Medium |
| 3. Portal Page | 1.5 | Easy |
| 4. Classroom | 0.5 | Easy |
| 5. Annex/Routine | 0.5 | Easy |
| 6. Drive Browser | 3.5 | Hard |
| 7. Polish/Test | 1.5 | Easy |
| **TOTAL** | **~11.5 hours** | **Medium** |

---

## 🎯 Start Building Now? 

Ready to begin **Phase 1 (Infrastructure)**? 🚀
