# Simple Google Drive Integration Guide

## Overview
This system uses a **centralized Google Drive account** (22235103183@cse.bubt.edu.bd) for file storage, with admin-managed access and student viewing via public embed links.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Centralized Google Drive Account                       │
│  📧 22235103183@cse.bubt.edu.bd                          │
│                                                          │
│  📁 Folder Structure:                                    │
│  ├── CSE-319-20/                                         │
│  │   ├── Midterm/                                        │
│  │   │   ├── Notes/                                      │
│  │   │   ├── Slides/                                     │
│  │   │   ├── CT-Questions/                               │
│  │   │   ├── Suggestions/                                │
│  │   │   ├── Super-Tips/                                 │
│  │   │   └── Videos/                                     │
│  │   └── Final/                                          │
│  │       ├── Notes/                                      │
│  │       └── ... (same structure)                        │
│  ├── CSE-327/                                            │
│  ├── CSE-407/                                            │
│  └── ... (other courses)                                 │
└─────────────────────────────────────────────────────────┘
           │
           │ Admin uploads files
           │ Makes them public ("Anyone with link")
           ↓
┌─────────────────────────────────────────────────────────┐
│  Admin Panel (Edu51Five)                                │
│  🔑 Email: MUST end with @cse.bubt.edu.bd                │
│                                                          │
│  Process:                                                │
│  1. Verify @cse.bubt.edu.bd email                        │
│  2. Select: Course | Midterm/Final | Category            │
│  3. Paste embed URL from Drive                           │
│  4. Save to Supabase database                            │
└─────────────────────────────────────────────────────────┘
           │
           │ Saves metadata
           ↓
┌─────────────────────────────────────────────────────────┐
│  Supabase Database (materials table)                    │
│                                                          │
│  Columns:                                                │
│  - course_id (UUID)                                      │
│  - title (text)                                          │
│  - type (category: notes, slides, etc.)                  │
│  - file_url (embed URL)                                  │
│  - download_url (direct link)                            │
│  - exam_period (midterm/final)                           │
│  - uploaded_by (admin email)                             │
└─────────────────────────────────────────────────────────┘
           │
           │ Query by course + period
           ↓
┌─────────────────────────────────────────────────────────┐
│  Student Panel                                           │
│  👀 No authentication needed                             │
│                                                          │
│  Views:                                                  │
│  - Browse by course                                      │
│  - Filter by midterm/final                               │
│  - Categories (notes, slides, etc.)                      │
│  - Embedded PDF preview (Google Drive iframe)            │
│  - Download button                                       │
└─────────────────────────────────────────────────────────┘
```

## Admin Workflow

### Step 1: Setup Drive Folders (One-time)
1. Login to 22235103183@cse.bubt.edu.bd
2. Create folder structure:
   ```
   CSE-319-20/
   ├── Midterm/
   │   ├── Notes/
   │   ├── Slides/
   │   ├── CT-Questions/
   │   ├── Suggestions/
   │   ├── Super-Tips/
   │   └── Videos/
   └── Final/
       └── (same structure)
   ```
3. Repeat for all courses (CSE-327, CSE-407, CSE-417, CSE-351)

### Step 2: Upload Files
1. Navigate to appropriate folder (e.g., CSE-319-20 → Midterm → Notes)
2. Upload your PDF/video file
3. Right-click file → **Share** → **Change to "Anyone with the link"**
4. Copy the link

### Step 3: Convert to Embed URL
**Original link:**
```
https://drive.google.com/file/d/1abc123XYZ456/view?usp=sharing
```

**Embed URL (for preview):**
```
https://drive.google.com/file/d/1abc123XYZ456/preview
```

**Download URL (for direct download):**
```
https://drive.google.com/file/d/1abc123XYZ456/view
```

### Step 4: Add to Admin Panel
1. Go to Edu51Five admin panel
2. Enter your @cse.bubt.edu.bd email
3. Click "Verify Email"
4. Fill in:
   - **Course**: CSE-319-20
   - **Exam Period**: Midterm
   - **Category**: Notes
   - **File Name**: Chapter 1 Notes.pdf
   - **Embed URL**: https://drive.google.com/file/d/FILE_ID/preview
   - **Download URL** (optional): https://drive.google.com/file/d/FILE_ID/view
5. Click "Add File to Student Portal"

✅ **Done!** File immediately appears in student view.

## Student Experience

### Browsing Files
1. Select course (e.g., CSE-319-20)
2. Choose exam period (Midterm/Final)
3. Browse by category (Notes, Slides, etc.)
4. Click file to preview in embedded viewer
5. Download button available

### Preview (No Login Required)
- Files load directly from Google Drive
- Embedded iframe shows PDF content
- Works on mobile and desktop
- No Drive account needed

## Database Schema

```sql
CREATE TABLE materials (
  id UUID PRIMARY KEY,
  course_id UUID REFERENCES courses(id),
  title TEXT NOT NULL,
  type TEXT NOT NULL,  -- 'notes', 'slides', 'ct-questions', etc.
  file_url TEXT,       -- Embed URL (for preview)
  download_url TEXT,   -- Direct link (for download)
  exam_period TEXT DEFAULT 'midterm',  -- 'midterm' or 'final'
  uploaded_by TEXT,    -- Admin email (@cse.bubt.edu.bd)
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Security Model

### Admin Access
- **Email verification**: MUST end with `@cse.bubt.edu.bd`
- **No OAuth**: Client-side email check only (simple verification)
- **No file upload**: Admin uploads files manually to Drive first

### Student Access
- **Public viewing**: No authentication needed
- **Read-only**: Students can only view/download
- **Direct from Drive**: All files served from Google Drive CDN

### Drive Account
- **Centralized storage**: One account (22235103183@cse.bubt.edu.bd)
- **Shared access**: Multiple admins can access Drive account
- **Public files**: All files set to "Anyone with the link can view"

## Benefits

✅ **Free unlimited storage** (Google Drive)
✅ **Fast delivery** (Google CDN)
✅ **No backend upload handling** (files uploaded directly to Drive)
✅ **Simple admin workflow** (paste link, done!)
✅ **Instant availability** (no processing needed)
✅ **Mobile-friendly** (Google Drive preview works on all devices)
✅ **Organized structure** (course → period → category folders)

## Troubleshooting

### File not showing in student view?
1. Check if file is set to "Anyone with the link"
2. Verify embed URL format: `/file/d/FILE_ID/preview`
3. Ensure course code and category match
4. Check exam period (midterm vs final)

### Embed preview not working?
1. Use `/preview` endpoint, not `/view`
2. Ensure file is a supported format (PDF works best)
3. Check if file is publicly accessible
4. Try opening embed URL directly in browser

### Admin email not verifying?
1. Must end with `@cse.bubt.edu.bd`
2. Check for typos in email
3. Email verification is client-side only (no backend check)

### Database save fails?
1. Verify course exists in `courses` table
2. Check Supabase connection
3. Ensure all required fields filled (course, title, embed URL)
4. Run `SIMPLE-DRIVE-SETUP.sql` to add new columns

## Maintenance

### Adding a new course
1. Create folder structure in Drive (Course → Midterm/Final → Categories)
2. Add course to database (if not exists)
3. Update course dropdown in `SimpleDriveUpload.tsx` if needed

### Removing files
1. Delete from Supabase database (admin panel → delete material)
2. Optionally delete from Drive (or just leave it)

### Changing exam period
1. Currently in midterm? Switch to final when midterm exams end
2. Students can toggle between midterm/final in their view
3. All files remain in database (just filtered by period)

## Next Steps

1. **Run SQL setup**: Execute `SIMPLE-DRIVE-SETUP.sql` in Supabase
2. **Create Drive folders**: Setup folder structure in 22235103183@cse.bubt.edu.bd
3. **Test upload flow**: Upload one file and verify it appears for students
4. **Update student view**: Add exam period toggle (midterm/final)
5. **Document for team**: Share this guide with other admins

---

**Key Difference from Previous System:**
- ❌ No OAuth authentication flow
- ❌ No programmatic file upload via API
- ✅ Manual upload to Drive → paste embed link
- ✅ Simple email verification (@cse.bubt.edu.bd)
- ✅ One centralized Drive account for all files
