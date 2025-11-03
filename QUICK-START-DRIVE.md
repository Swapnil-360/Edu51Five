# 🎯 Quick Start Guide - Simple Google Drive Integration

## 📋 What You Need

1. **Google Drive Account**: 22235103183@cse.bubt.edu.bd (centralized storage)
2. **Admin Email**: Any @cse.bubt.edu.bd email for verification
3. **Supabase Access**: To run the SQL setup
4. **Files to Upload**: PDFs, videos, or other course materials

---

## 🚀 Setup (5 Minutes)

### Step 1: Database Setup
```sql
-- In Supabase SQL Editor, paste and run:
-- File: SIMPLE-DRIVE-SETUP.sql

ALTER TABLE materials ADD COLUMN exam_period TEXT DEFAULT 'midterm';
ALTER TABLE materials ADD COLUMN uploaded_by TEXT;
ALTER TABLE materials ADD COLUMN download_url TEXT;
```

### Step 2: Create Drive Folders
Login to **22235103183@cse.bubt.edu.bd**, create:

```
📁 CSE-319-20/
  ├── 📁 Midterm/
  │   ├── 📁 Notes/
  │   ├── 📁 Slides/
  │   ├── 📁 CT-Questions/
  │   ├── 📁 Suggestions/
  │   ├── 📁 Super-Tips/
  │   └── 📁 Videos/
  └── 📁 Final/
      └── (same structure)

📁 CSE-327/ (same structure)
📁 CSE-407/ (same structure)
📁 CSE-417/ (same structure)
📁 CSE-351/ (same structure)
```

### Step 3: Test Upload
1. Upload a test PDF to `CSE-319-20/Midterm/Notes/`
2. Right-click → **Share** → **Change to "Anyone with the link"**
3. Copy the link

### Step 4: Add to Portal
1. Go to admin panel: https://edu51five.vercel.app/admin
2. Enter password: `edu51five2025`
3. Scroll to "Google Drive File Manager"
4. Enter your @cse.bubt.edu.bd email
5. Click "Verify Email"
6. Fill the form and paste embed URL
7. Click "Add File to Student Portal"

✅ **Done!** Students can now see the file.

---

## 📤 How to Upload Files (Daily Workflow)

### Upload to Drive
```
1. Login: 22235103183@cse.bubt.edu.bd
2. Navigate: CSE-319-20 → Midterm → Notes
3. Upload: "Chapter 1 Notes.pdf"
4. Share: Right-click → "Anyone with the link"
5. Copy link: https://drive.google.com/file/d/1abc123XYZ/view
```

### Convert URL
```
Original:  https://drive.google.com/file/d/1abc123XYZ/view?usp=sharing
           👇 Change /view to /preview
Embed:     https://drive.google.com/file/d/1abc123XYZ/preview
```

### Add to Portal
```
Admin Panel → Google Drive File Manager
├── Email: yourname@cse.bubt.edu.bd
├── Course: CSE-319-20
├── Period: Midterm
├── Category: Notes
├── File Name: Chapter 1 Notes.pdf
├── Embed URL: https://drive.google.com/.../preview
└── Click: "Add File to Student Portal"
```

---

## 👀 Student View

Students see files organized like this:

```
📚 Course: CSE-319-20 (Networking)

🔘 Midterm  ⚪ Final

📝 Notes (3 files)
  ├── Chapter 1 Notes.pdf [Preview] [Download]
  ├── Chapter 2 Notes.pdf [Preview] [Download]
  └── Chapter 3 Notes.pdf [Preview] [Download]

📊 Slides (2 files)
  ├── Lecture 1 Slides.pdf [Preview] [Download]
  └── Lecture 2 Slides.pdf [Preview] [Download]

❓ CT Questions (4 files)
  └── ...

💡 Suggestions (0 files)
⚡ Super Tips (0 files)
🎥 Videos (0 files)
```

---

## 🎨 UI Preview

### Admin Panel
```
┌───────────────────────────────────────────────────┐
│ 📤 Google Drive File Manager                      │
│ Centralized storage: 22235103183@cse.bubt.edu.bd  │
├───────────────────────────────────────────────────┤
│                                                   │
│ ⚠️ Admin Email Verification Required             │
│                                                   │
│ [yourname@cse.bubt.edu.bd] [Verify Email]        │
│                                                   │
└───────────────────────────────────────────────────┘

After verification:

┌───────────────────────────────────────────────────┐
│ 📁 How to Upload Files                            │
│                                                   │
│ 1. Upload to Drive (22235103183@cse.bubt.edu.bd) │
│ 2. Organize in: Course > Midterm/Final > Category│
│ 3. Right-click → Get link → "Anyone with link"   │
│ 4. Convert to embed URL (/preview)               │
│ 5. Paste below to make visible to students       │
├───────────────────────────────────────────────────┤
│ 📁 Target Folder Path:                            │
│ Drive Storage > CSE-319-20 > MIDTERM > notes     │
├───────────────────────────────────────────────────┤
│ Course:        [CSE-319-20 - Networking ▼]       │
│ Exam Period:   [Midterm ▼]                       │
│ Category:      [Notes ▼]                         │
│ File Name:     [Chapter 1 Notes.pdf]             │
│ Embed URL:     [https://drive.google.com/...   ] │
│ Download URL:  [https://drive.google.com/...   ] │
│                                                   │
│ [✅ Add File to Student Portal]                   │
└───────────────────────────────────────────────────┘
```

---

## 🔧 Troubleshooting

### Problem: Email verification fails
```
❌ Error: "Only @cse.bubt.edu.bd emails can upload files"

✅ Solution:
- Must use email ending with @cse.bubt.edu.bd
- Example: miftahur@cse.bubt.edu.bd ✓
- Example: admin@gmail.com ✗
```

### Problem: File not showing for students
```
❌ Students can't see the file

✅ Check:
1. File set to "Anyone with the link" in Drive?
2. Embed URL correct format (/preview)?
3. Course code matches exactly (CSE-319-20)?
4. Exam period set correctly (midterm/final)?
5. File saved to database? (check Supabase)
```

### Problem: Preview shows "Access Denied"
```
❌ "You need access" message

✅ Solution:
- File must be PUBLIC in Google Drive
- Right-click file → Share → General access → "Anyone with the link"
- Change permission to "Viewer"
```

### Problem: Wrong folder path
```
❌ File uploaded to wrong folder

✅ Fix:
1. Move file in Drive to correct folder:
   CSE-319-20 → Midterm → Notes
2. Update folder path if structure changed
3. Keep folder names consistent (Notes, not notes)
```

---

## 📊 Exam Period Toggle

Students can switch between midterm and final materials:

```
┌─────────────────────────────────┐
│ Exam Period:                    │
│ ● Midterm  ○ Final              │
│                                 │
│ Showing midterm materials...    │
│ ✓ Notes (3 files)               │
│ ✓ Slides (2 files)              │
│ ✓ CT Questions (4 files)        │
└─────────────────────────────────┘

Click "Final":

┌─────────────────────────────────┐
│ Exam Period:                    │
│ ○ Midterm  ● Final              │
│                                 │
│ Showing final materials...      │
│ ✓ Notes (0 files)               │
│ ✓ Slides (0 files)              │
│ ✓ CT Questions (0 files)        │
└─────────────────────────────────┘
```

---

## 🎓 Categories Explained

| Icon | Category | Description | Example Files |
|------|----------|-------------|---------------|
| 📝 | **Notes** | Study notes, summaries | Chapter 1 Notes.pdf |
| 📊 | **Slides** | Lecture slides, presentations | Lecture 1.pptx |
| ❓ | **CT Questions** | Class test questions | CT-1 Questions.pdf |
| 💡 | **Suggestions** | Study suggestions | Exam Suggestions.pdf |
| ⚡ | **Super Tips** | Last-minute tips | One Night Before Exam.pdf |
| 🎥 | **Videos** | Video lectures, tutorials | Tutorial 1.mp4 |

---

## 📝 URL Formats

### View URL (original from Drive)
```
https://drive.google.com/file/d/1abc123XYZ456/view?usp=sharing
```
**Use for**: Download links

### Embed URL (for preview)
```
https://drive.google.com/file/d/1abc123XYZ456/preview
```
**Use for**: Embedded viewer in student panel

### Conversion Rule
```
Replace:  /view
With:     /preview

Remove:   ?usp=sharing (optional, but cleaner)
```

---

## ✅ Pre-Flight Checklist

Before adding a file, verify:

- [ ] File uploaded to correct Drive folder
- [ ] File is set to PUBLIC ("Anyone with the link")
- [ ] Embed URL uses `/preview` endpoint
- [ ] Course code matches database (CSE-319-20)
- [ ] Category selected correctly
- [ ] File name is descriptive
- [ ] Admin email verified (@cse.bubt.edu.bd)

After adding:

- [ ] Success message appears
- [ ] File visible in student panel (check course page)
- [ ] Embed preview works
- [ ] Download button works

---

## 🎯 Quick Reference Card

```
┌─────────────────────────────────────────────────┐
│ GOOGLE DRIVE FILE MANAGER - QUICK REFERENCE     │
├─────────────────────────────────────────────────┤
│                                                 │
│ 📧 Drive Account:                                │
│    22235103183@cse.bubt.edu.bd                  │
│                                                 │
│ 🔑 Admin Email:                                  │
│    Must end with @cse.bubt.edu.bd               │
│                                                 │
│ 📁 Folder Structure:                             │
│    Course > Midterm/Final > Category            │
│                                                 │
│ 🔗 URL Format:                                   │
│    .../file/d/FILE_ID/preview                   │
│                                                 │
│ 🎓 Categories:                                   │
│    notes | slides | ct-questions |              │
│    suggestions | super-tips | videos            │
│                                                 │
│ 📅 Exam Periods:                                 │
│    midterm | final                              │
│                                                 │
│ ⏱️  Time to Add File:                            │
│    ~30 seconds                                  │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🔗 Important Links

- **Admin Panel**: https://edu51five.vercel.app/admin
- **Google Drive**: https://drive.google.com/ (login: 22235103183@cse.bubt.edu.bd)
- **Supabase**: https://supabase.com/dashboard
- **Documentation**: SIMPLE-DRIVE-INSTRUCTIONS.md
- **Setup SQL**: SIMPLE-DRIVE-SETUP.sql

---

## 📞 Support

If you encounter issues:

1. **Check this guide**: Most issues covered in Troubleshooting section
2. **Verify setup**: Ensure SQL migration ran successfully
3. **Test with sample file**: Upload test PDF first
4. **Check browser console**: Look for error messages
5. **Contact developer**: If problem persists

---

**Last Updated**: November 2, 2025  
**Version**: 1.0  
**Project**: Edu51Five - Simple Drive Integration  
