# Google Drive Integration - Admin to Student Access Flow

## 📊 Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        ADMIN PANEL                               │
├─────────────────────────────────────────────────────────────────┤
│  1. Admin Signs in with Google                                  │
│  2. Selects Course (e.g., CSE-319) & Category (e.g., notes)    │
│  3. Uploads PDF/Video file                                      │
│     ↓                                                            │
│  ┌──────────────────────────────────────────────┐              │
│  │  Google Drive API                             │              │
│  │  - Creates folder: CSE-319/notes/            │              │
│  │  - Uploads file                               │              │
│  │  - Makes file PUBLIC                          │              │
│  │  - Returns FILE_ID                            │              │
│  └──────────────────────────────────────────────┘              │
│     ↓                                                            │
│  4. System generates URLs:                                      │
│     - Embed: drive.google.com/file/d/FILE_ID/preview           │
│     - Download: drive.google.com/uc?export=download&id=FILE_ID │
│     ↓                                                            │
│  5. Save to Supabase Database:                                  │
│     INSERT INTO materials (                                     │
│       course_id: 'CSE-319',                                     │
│       title: 'Lecture Notes Chapter 1',                         │
│       type: 'notes',                                            │
│       file_url: '[embed_url]',                                  │
│       drive_file_id: 'FILE_ID'                                  │
│     )                                                            │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE DATABASE                             │
├─────────────────────────────────────────────────────────────────┤
│  Table: materials                                                │
│  ┌────────────┬──────────────┬────────┬──────────────────────┐ │
│  │ course_id  │ title        │ type   │ file_url             │ │
│  ├────────────┼──────────────┼────────┼──────────────────────┤ │
│  │ CSE-319    │ Lecture N... │ notes  │ drive.google.com/... │ │
│  │ CSE-327    │ Lab Guide    │ slides │ drive.google.com/... │ │
│  └────────────┴──────────────┴────────┴──────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                      STUDENT VIEW                                │
├─────────────────────────────────────────────────────────────────┤
│  1. Student opens Section 5 page                                │
│  2. System loads materials from Supabase:                       │
│     SELECT * FROM materials WHERE course_id = 'CSE-319'        │
│     ↓                                                            │
│  3. Displays materials grouped by category:                     │
│     📚 Notes (3 files)                                          │
│     📊 Slides (2 files)                                         │
│     ✅ CT Questions (5 files)                                   │
│     ↓                                                            │
│  4. Student clicks "View" button                                │
│     ↓                                                            │
│  5. Opens PDFViewer modal with embed URL                        │
│     <iframe src="drive.google.com/file/d/FILE_ID/preview" />   │
│     ↓                                                            │
│  6. Student can view/download the file                          │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 How It Works Now

### Step 1: Admin Uploads File
```typescript
// Admin clicks "Sign In with Google"
// Selects course: CSE-319
// Selects category: notes
// Uploads: "Lecture_Notes.pdf"

GoogleDriveUpload component:
1. uploadFile(file, folderId)
2. makeFilePublic(fileId)
3. getEmbedUrl(fileId) → https://drive.google.com/file/d/ABC123/preview
4. Calls onFileUploaded(fileId, embedUrl, downloadUrl)
```

### Step 2: Auto-Save to Database
```typescript
// In App.tsx (onFileUploaded callback):
await supabase
  .from('materials')
  .insert([{
    course_id: 'CSE-319',
    title: 'Lecture Notes Chapter 1',
    type: 'notes',
    file_url: embedUrl,
    drive_file_id: fileId,
  }]);

// Refresh materials list
loadMaterials();
```

### Step 3: Students Access Files
```typescript
// Student view automatically shows all materials
// Because loadMaterials() fetches from Supabase:

const { data, error } = await supabase
  .from('materials')
  .select('*')
  .order('created_at', { ascending: false });

// Materials are displayed in course view
// Clicking "View" opens PDFViewer with the Google Drive embed URL
```

## 📁 Current File Structure

### Google Drive (Admin's Drive)
```
My Drive/
  └── CSE-319/
      ├── notes/
      │   ├── Lecture_Notes_Ch1.pdf
      │   └── Lecture_Notes_Ch2.pdf
      ├── slides/
      │   └── Presentation_Week1.pptx
      ├── ct-questions/
      │   ├── CT1_Questions.pdf
      │   └── CT2_Questions.pdf
      └── ...
```

### Supabase Database
```sql
SELECT * FROM materials WHERE course_id = 'CSE-319';

| id | course_id | title           | type  | file_url                    | drive_file_id |
|----|-----------|-----------------|-------|----------------------------|---------------|
| 1  | CSE-319   | Lecture Notes 1 | notes | drive.google.com/file/...  | ABC123        |
| 2  | CSE-319   | Week 1 Slides   | slides| drive.google.com/file/...  | DEF456        |
```

## 🎯 Benefits of This Approach

### ✅ Advantages:
1. **Unlimited Storage** - Google Drive has 15GB free (or more with Google Workspace)
2. **Fast Delivery** - Google's CDN serves files quickly
3. **Easy Management** - Files organized in folders, easy to find
4. **Public Access** - No login required for students to view
5. **Database Tracking** - Supabase keeps metadata for search/filter
6. **Automatic Preview** - Drive's built-in PDF/video viewer

### 🔐 Security:
- Files are PUBLIC but URLs are not easily guessable
- Only admins can upload (password protected)
- Students can view but not delete/modify
- Admin can revoke file access from Google Drive anytime

## 🚀 Usage Example

### Admin Workflow:
```bash
1. Go to Admin Panel (password: edu51five2025)
2. Scroll to "Google Drive Upload" section
3. Click "Sign In with Google" → Grant permissions
4. Enter Course Code: CSE-319
5. Select Category: notes
6. Upload file: "Chapter_1_Notes.pdf"
7. ✅ File appears immediately for students!
```

### Student Workflow:
```bash
1. Go to Section 5 page
2. Click on course (e.g., CSE-319)
3. See materials grouped by category:
   📚 Notes
     - Chapter 1 Notes [View] [Download]
     - Chapter 2 Notes [View] [Download]
4. Click "View" → Opens PDF in modal
5. Click "Download" → Downloads file
```

## 🔧 Troubleshooting

### If files don't appear for students:
1. Check Supabase database - is the material saved?
   ```sql
   SELECT * FROM materials ORDER BY created_at DESC LIMIT 10;
   ```
2. Check if file is public in Google Drive
3. Verify embed URL format: `https://drive.google.com/file/d/FILE_ID/preview`
4. Check browser console for errors

### If upload fails:
1. Ensure Google Drive API is enabled
2. Check OAuth consent screen has test users added
3. Verify API key is correct in `.env`
4. Check browser console for detailed error messages

## 📊 Current Implementation Status

✅ **Completed:**
- Google Drive API integration
- OAuth authentication
- File upload with folder organization
- Auto-make files public
- Generate embed/download URLs
- Supabase database integration
- Auto-save uploaded files to database
- Student view displays files from database
- PDF viewer with Google Drive embeds

⏳ **Optional Enhancements:**
- Bulk file upload
- File search within Drive
- File deletion from Drive
- Storage usage tracking
- Upload progress indicator
- File type validation
- Thumbnail generation

## 🎓 Summary

**Flow:** Admin uploads → Google Drive → Supabase DB → Student views

**Data Sources:**
1. Google Drive - File storage
2. Supabase - Metadata (course, title, category, URLs)
3. Config files - Static course structure

**Access:**
- Admins: Full control (upload, organize, delete)
- Students: Read-only (view, download)
- Public: Anyone with link can view (but link not shared publicly)

This hybrid approach gives you the best of both worlds: unlimited storage from Google Drive and structured data management from Supabase! 🚀
