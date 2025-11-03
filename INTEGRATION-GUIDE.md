# 🎯 Quick Integration Guide

## ✅ What's Done

1. ✅ **DirectDriveUpload.tsx** - Admin uploads to Drive (OAuth auth)
2. ✅ **StudentDriveView.tsx** - Students view files from Drive (no auth)
3. ✅ **App.tsx** - Admin panel using DirectDriveUpload

## 🔧 What's Left: Integrate Student View

### Option 1: Replace Existing Material View

In your course detail view, replace the current Supabase materials list with Drive API:

**Find this in App.tsx:**
```typescript
// Current code (reading from Supabase):
{materials.filter(m => m.course_code === selectedCourse.code).map((material) => (
  // ... material display
))}
```

**Replace with:**
```typescript
<StudentDriveView 
  courseCode={selectedCourse.code}
  examPeriod={selectedExamPeriod}
  onFileClick={(fileId, fileName) => {
    setSelectedPDF({
      url: `https://drive.google.com/file/d/${fileId}/preview`,
      title: fileName
    });
  }}
/>
```

### Option 2: Add Tab Switcher (Use Both)

Add a toggle to switch between database files and Drive files:

```typescript
const [viewMode, setViewMode] = useState<'database' | 'drive'>('drive');

// UI:
<div className="flex gap-4 mb-6">
  <button
    onClick={() => setViewMode('database')}
    className={viewMode === 'database' ? 'active' : ''}
  >
    📦 Database Files
  </button>
  <button
    onClick={() => setViewMode('drive')}
    className={viewMode === 'drive' ? 'active' : ''}
  >
    ☁️ Google Drive Files
  </button>
</div>

{viewMode === 'database' ? (
  // Current Supabase material view
) : (
  <StudentDriveView 
    courseCode={selectedCourse.code}
    examPeriod={selectedExamPeriod}
  />
)}
```

---

## 🚀 Recommended: Complete Migration to Drive

Since you want **no Supabase**, here's the complete replacement:

### Step 1: Find Course View Section
Search for where materials are displayed (around line 2400-2500 in App.tsx)

### Step 2: Replace Material List
```typescript
// OLD:
{materials.filter(m => m.course_code === selectedCourse.code).map(...)}

// NEW:
<StudentDriveView 
  courseCode={selectedCourse.code}
  examPeriod={selectedExamPeriod}
  onFileClick={(fileId, fileName) => {
    setSelectedPDF({
      url: `https://drive.google.com/file/d/${fileId}/preview`,
      title: fileName
    });
    setShowPDFViewer(true);
  }}
/>
```

### Step 3: Add Exam Period Toggle
```typescript
const [selectedExamPeriod, setSelectedExamPeriod] = useState<'midterm' | 'final'>('midterm');

// UI:
<div className="flex gap-4 mb-6">
  <button
    onClick={() => setSelectedExamPeriod('midterm')}
    className={selectedExamPeriod === 'midterm' ? 'active-button' : 'inactive-button'}
  >
    📚 Midterm
  </button>
  <button
    onClick={() => setSelectedExamPeriod('final')}
    className={selectedExamPeriod === 'final' ? 'active-button' : 'inactive-button'}
  >
    📖 Final
  </button>
</div>
```

---

## 📝 Complete Example

Here's a full student course view with Drive integration:

```typescript
// In course detail view:
{currentView === 'course' && selectedCourse && (
  <div className="max-w-7xl mx-auto px-4 py-8">
    {/* Header */}
    <div className="mb-8">
      <h1 className="text-3xl font-bold">{selectedCourse.name}</h1>
      <p className="text-gray-600">{selectedCourse.code}</p>
    </div>

    {/* Exam Period Toggle */}
    <div className="flex gap-4 mb-6">
      <button
        onClick={() => setSelectedExamPeriod('midterm')}
        className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
          selectedExamPeriod === 'midterm'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        📚 Midterm Materials
      </button>
      <button
        onClick={() => setSelectedExamPeriod('final')}
        className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
          selectedExamPeriod === 'final'
            ? 'bg-purple-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        📖 Final Exam Materials
      </button>
    </div>

    {/* Files from Google Drive */}
    <StudentDriveView 
      courseCode={selectedCourse.code}
      examPeriod={selectedExamPeriod}
      onFileClick={(fileId, fileName) => {
        setSelectedPDF({
          url: `https://drive.google.com/file/d/${fileId}/preview`,
          title: fileName
        });
        setShowPDFViewer(true);
      }}
    />
  </div>
)}
```

---

## 🎯 Testing Checklist

### Admin Side:
- [ ] Go to admin panel
- [ ] Sign in with @cse.bubt.edu.bd email
- [ ] Select course CSE-319-20
- [ ] Select category "notes"
- [ ] Upload test PDF
- [ ] Verify file appears in "Files in This Folder"
- [ ] Check file is in Google Drive

### Student Side:
- [ ] Go to course page (CSE-319-20)
- [ ] Select "Midterm"
- [ ] See "Notes" category
- [ ] Verify uploaded file appears
- [ ] Click "Preview" button
- [ ] PDF viewer opens
- [ ] Click "Download" button
- [ ] File downloads

---

## 🐛 Common Issues & Fixes

### Issue: "Failed to load files"
```
Solution:
1. Check .env has VITE_GOOGLE_API_KEY
2. Check Drive API is enabled in Google Cloud
3. Check folder IDs are correct
4. Check files are set to public
```

### Issue: Admin can't sign in
```
Solution:
1. Must use @cse.bubt.edu.bd email
2. Check OAuth consent screen has test user
3. Check CLIENT_ID is correct in .env
```

### Issue: Files don't appear after upload
```
Solution:
1. Wait 2-3 seconds for Drive indexing
2. Click refresh button
3. Check file is in correct folder in Drive
4. Check file is set to "Anyone with link"
```

---

## 🎨 UI Customization

### Change Colors:
```typescript
// In StudentDriveView.tsx, find category colors:
const getCategoryColor = (category: string) => {
  const colors = {
    'notes': 'blue',
    'slides': 'green',
    'ct-questions': 'red',
    'suggestions': 'yellow',
    'super-tips': 'purple',
    'videos': 'pink',
  };
  return colors[category] || 'gray';
};
```

### Add Loading Skeleton:
```typescript
// While loading files:
{isLoading && (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="animate-pulse">
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    ))}
  </div>
)}
```

---

## 📊 Folder IDs Reference

**You already have Midterm folder IDs.**

**For Final exams**, you need to:
1. Create Final folders in Drive
2. Get folder IDs
3. Update `FOLDER_IDS` in both:
   - `DirectDriveUpload.tsx`
   - `StudentDriveView.tsx`

**Example:**
```javascript
'CSE-319-20': {
  midterm: { /* existing */ },
  final: {
    'notes': 'FOLDER_ID_HERE',
    'slides': 'FOLDER_ID_HERE',
    'ct-questions': 'FOLDER_ID_HERE',
    // ... etc
  }
}
```

---

## ✅ Final Checklist

- [ ] Admin panel has DirectDriveUpload
- [ ] Student view has StudentDriveView
- [ ] Exam period toggle added
- [ ] PDF viewer modal works with Drive files
- [ ] Both components have correct folder IDs
- [ ] .env has API_KEY and CLIENT_ID
- [ ] OAuth consent screen configured
- [ ] Test upload/view workflow
- [ ] Deploy to production

---

**Want me to integrate StudentDriveView into your App.tsx now?**  
I can find the exact location and add the code! 🚀
