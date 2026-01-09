# 📁 New Course Management System - Google Drive Folders

## Overview
Courses are now managed entirely through **Google Drive folders** instead of the database. This gives you more flexibility and direct file management.

## Structure

### 4 Main Folder Links:
1. **Common Folder** - Courses visible to ALL majors (AI, Software Engineering, Networking)
2. **AI Folder** - Courses visible ONLY to AI major students
3. **Software Engineering Folder** - Courses visible ONLY to Software Engineering major students
4. **Networking Folder** - Courses visible ONLY to Networking major students

## How It Works

### For Students:
When a student logs in and selects their major:
- They see all courses from the **Common folder**
- They see all courses from their **major-specific folder**

Example:
- **AI Student** sees: Common courses + AI courses
- **Software Student** sees: Common courses + Software Engineering courses
- **Networking Student** sees: Common courses + Networking courses

### For Admins:
To add a new course:

1. **Common Course** (all majors see it):
   - Upload the course folder/files to the **Common Drive folder**
   - Automatically visible to AI, Software, and Networking majors

2. **AI-Only Course**:
   - Upload to the **AI Drive folder**
   - Only AI major students see it

3. **Software Engineering-Only Course**:
   - Upload to the **Software Engineering Drive folder**
   - Only Software Engineering major students see it

4. **Networking-Only Course**:
   - Upload to the **Networking Drive folder**
   - Only Networking major students see it

## Setup Instructions

### 1. Create Google Drive Folders
Create 4 new folders in your Google Drive:
- `Edu51Five - Common Courses`
- `Edu51Five - AI Courses`
- `Edu51Five - Software Engineering Courses`
- `Edu51Five - Networking Courses`

### 2. Update Folder Links
Edit [src/config/courseFolders.ts](../src/config/courseFolders.ts) and replace:
```typescript
'Common': {
  folderId: 'YOUR_COMMON_FOLDER_ID_HERE',
  shareLink: 'https://drive.google.com/drive/folders/YOUR_COMMON_FOLDER_ID_HERE?usp=drive_link'
},
'AI': {
  folderId: 'YOUR_AI_FOLDER_ID_HERE',
  shareLink: 'https://drive.google.com/drive/folders/YOUR_AI_FOLDER_ID_HERE?usp=drive_link'
},
// ... etc
```

### 3. Find Folder IDs
To get folder IDs from Drive URLs:
- Open the folder in Google Drive
- Copy the URL: `https://drive.google.com/drive/folders/FOLDER_ID_HERE?usp=drive_link`
- Extract the `FOLDER_ID_HERE` part

### 4. Deactivate Old Database Courses
Run this SQL in Supabase to clean up:
```sql
UPDATE courses SET is_active = false WHERE is_active = true;
```

Or run the provided: [DEACTIVATE-ALL-COURSES.sql](./DEACTIVATE-ALL-COURSES.sql)

## Example Setup

Let's say you have:
- Common: `1abc2def3ghi4jkl5mno`
- AI: `1xyz9abc8def7ghi6jkl`
- Software: `1pqr5stu4vwx3yz2abc1`
- Networking: `1def6ghi5jkl4mno3pqr`

Update [src/config/courseFolders.ts](../src/config/courseFolders.ts):

```typescript
'Common': {
  folderId: '1abc2def3ghi4jkl5mno',
  shareLink: 'https://drive.google.com/drive/folders/1abc2def3ghi4jkl5mno?usp=drive_link'
},
'AI': {
  folderId: '1xyz9abc8def7ghi6jkl',
  shareLink: 'https://drive.google.com/drive/folders/1xyz9abc8def7ghi6jkl?usp=drive_link'
},
// ... and so on
```

Save the file and refresh the app - courses will load from the folders!

## Adding a New Course

### Example: Add "Machine Learning" for AI major only

1. Go to your **AI Drive folder**
2. Create a subfolder: `CSE-402 Machine Learning`
3. Upload course materials (PDFs, slides, etc.)
4. Share the Google Drive folder link with students (or the student portal shows it automatically)

### Result:
- **AI students** see "Machine Learning" when they log in ✅
- **Software students** do NOT see it ✅
- **Networking students** do NOT see it ✅

### Example: Add "Capstone Project" for all majors

1. Go to your **Common Drive folder**
2. Create a subfolder: `CSE-498 Capstone Project`
3. Upload course materials
4. **Share the folder link** with the course link in the app

### Result:
- **All 3 majors** (AI, Software, Networking) see "Capstone Project" ✅

## Files to Edit

- [src/config/courseFolders.ts](../src/config/courseFolders.ts) - Replace with your Google Drive folder IDs
- Run [DEACTIVATE-ALL-COURSES.sql](./DEACTIVATE-ALL-COURSES.sql) in Supabase to disable old database courses

## Benefits

✅ **Direct file management** - No database needed for course uploads  
✅ **Unlimited storage** - Google Drive is free and unlimited  
✅ **Easy to share** - Just share Drive folders with guest lecturers  
✅ **Version control** - Google Drive tracks file changes automatically  
✅ **Real-time updates** - New files appear instantly for students  

## Troubleshooting

**Q: Courses not showing?**
A: Check that the folder ID in courseFolders.ts is correct and the folder is shared with your account.

**Q: Students can't access courses?**
A: Make sure the Google Drive folder has proper sharing settings (at minimum "Viewer" access for link sharing).

**Q: How to add materials to existing courses?**
A: Just upload to the course subfolder in the appropriate Drive folder - students will see them immediately!
