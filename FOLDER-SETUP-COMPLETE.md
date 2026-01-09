# 🎯 Your Google Drive Folders - Setup Complete!

## ✅ Configuration Active

All Google Drive folder links have been updated in your app!

### Folder Structure:

#### 📂 Common Folder (All Majors See)
- **ID:** `1ZlnWXpA2pH8l5X1jfwWjHmnacIj2jxgp`
- **Link:** https://drive.google.com/drive/folders/1ZlnWXpA2pH8l5X1jfwWjHmnacIj2jxgp?usp=drive_link
- **Visible to:** AI, Software Engineering, Networking
- **Use for:** Courses shared by all majors

#### 🤖 AI Folder (AI Major Only)
- **ID:** `1UvxprKhePf6gUWxtSExfg9ik6ncSp54y`
- **Link:** https://drive.google.com/drive/folders/1UvxprKhePf6gUWxtSExfg9ik6ncSp54y?usp=drive_link
- **Visible to:** AI major students only
- **Use for:** AI-specific courses

#### 💻 Software Engineering Folder (SE Major Only)
- **ID:** `1oYAa0bSu8SbOtfkWl8uiH4rcRqyVqxV6`
- **Link:** https://drive.google.com/drive/folders/1oYAa0bSu8SbOtfkWl8uiH4rcRqyVqxV6?usp=drive_link
- **Visible to:** Software Engineering major students only
- **Use for:** SE-specific courses

#### 🌐 Networking Folder (Networking Major Only)
- **ID:** `1O67pRRZhqGq2YZ6lgYl245QUG5NQeJne`
- **Link:** https://drive.google.com/drive/folders/1O67pRRZhqGq2YZ6lgYl245QUG5NQeJne?usp=drive_link
- **Visible to:** Networking major students only
- **Use for:** Networking-specific courses

#### 🔧 Admin Panel Uploads
- **ID:** `1lFktSbOz-voVmiSnYJzuHbtSfpeqsuAx`
- **Link:** https://drive.google.com/drive/folders/1lFktSbOz-voVmiSnYJzuHbtSfpeqsuAx?usp=drive_link
- **For:** Admin panel to upload and manage files

---

## 🚀 How To Use

### For Adding Courses to Common Folder (All Majors See):
1. Open: https://drive.google.com/drive/folders/1ZlnWXpA2pH8l5X1jfwWjHmnacIj2jxgp?usp=drive_link
2. Create a folder for the course (e.g., `CSE-498A Capstone Project`)
3. Upload course materials inside
4. **All students see it automatically!**

### For Adding AI-Only Courses:
1. Open: https://drive.google.com/drive/folders/1UvxprKhePf6gUWxtSExfg9ik6ncSp54y?usp=drive_link
2. Create a folder (e.g., `CSE-402 Machine Learning`)
3. Upload materials
4. **Only AI students see it!**

### For Adding Software-Only Courses:
1. Open: https://drive.google.com/drive/folders/1oYAa0bSu8SbOtfkWl8uiH4rcRqyVqxV6?usp=drive_link
2. Create a folder (e.g., `CSE-301 Web Development`)
3. Upload materials
4. **Only Software Engineering students see it!**

### For Adding Networking-Only Courses:
1. Open: https://drive.google.com/drive/folders/1O67pRRZhqGq2YZ6lgYl245QUG5NQeJne?usp=drive_link
2. Create a folder (e.g., `CSE-310 Network Security`)
3. Upload materials
4. **Only Networking students see it!**

---

## 📋 Next Steps

### For Students:
- ✅ Refresh localhost
- ✅ Sign in and select major
- ✅ They will see Common folder courses + their major folder courses
- ✅ Click "Access Materials" to browse Google Drive

### For Admin:
- ✅ Run [DEACTIVATE-ALL-COURSES.sql](./DEACTIVATE-ALL-COURSES.sql) in Supabase to remove old database courses
- ✅ Use the Admin Panel uploads folder to manage files
- ✅ Add courses by creating folders in the respective Google Drive folders

---

## 📁 Folder Hierarchy Example

```
📂 Common Folder (All majors)
   └── CSE-498A - Capstone Project
       ├── Notes.pdf
       ├── Slides.pptx
       └── Exam Questions.pdf

📂 AI Folder (AI only)
   ├── CSE-402 - Machine Learning
   │   └── ML Notes.pdf
   └── CSE-403 - Deep Learning
       └── DL Slides.pdf

📂 Software Engineering Folder (SE only)
   ├── CSE-301 - Web Development
   │   └── Web Dev Guide.pdf
   └── CSE-302 - Mobile Apps
       └── Mobile Tutorial.pdf

📂 Networking Folder (Networking only)
   ├── CSE-310 - Network Security
   │   └── Security Notes.pdf
   └── CSE-311 - Wireless Networks
       └── Wireless Guide.pdf
```

---

## ✨ Benefits

✅ **No database management** - All courses in Google Drive  
✅ **Real-time updates** - New files appear instantly  
✅ **Easy to share** - Share folders with guest lecturers  
✅ **Unlimited storage** - Google Drive is free  
✅ **Version control** - Google Drive tracks all changes  
✅ **Direct access** - Students can download/view directly from Drive  

---

## 🔗 File Reference

Updated: [src/config/courseFolders.ts](../src/config/courseFolders.ts)

All folder IDs and links are configured and ready to go!
