# Google Drive Setup for Midterm/Final Separation

## Structure Overview

The Google Drive configuration has been updated to support separate folders for Midterm and Final exam materials.

## Folder Structure

For each course, you need to create TWO main sections:
```
Course Name/
  ├── Midterm/
  │   ├── CT Questions/
  │   ├── Notes/
  │   ├── Slides/
  │   ├── Suggestions/
  │   ├── Super Tips/
  │   └── Videos/
  └── Final/
      ├── CT Questions/
      ├── Notes/
      ├── Slides/
      ├── Suggestions/
      ├── Super Tips/
      └── Videos/
```

## Update Instructions

### Step 1: Update Google Drive Links in `googleDrive.ts`

Replace the placeholder links (FINAL_CSE###_CATEGORY) with your actual Google Drive folder links for Final exam materials:

**CSE-319-20 (Networking):**
- CT Questions: `FINAL_CSE319_CT` → Your link
- Notes: `FINAL_CSE319_NOTES` → Your link
- Slides: `FINAL_CSE319_SLIDES` → Your link
- Suggestions: `FINAL_CSE319_SUGGESTIONS` → Your link
- Super Tips: `FINAL_CSE319_SUPERTIPS` → Your link
- Videos: `FINAL_CSE319_VIDEOS` → Your link

**CSE-327 (Software Development):**
- CT Questions: `FINAL_CSE327_CT` → Your link
- Notes: `FINAL_CSE327_NOTES` → Your link
- Slides: `FINAL_CSE327_SLIDES` → Your link
- Suggestions: `FINAL_CSE327_SUGGESTIONS` → Your link
- Super Tips: `FINAL_CSE327_SUPERTIPS` → Your link
- Videos: `FINAL_CSE327_VIDEOS` → Your link

**CSE-407 (Project Management):**
- CT Questions: `FINAL_CSE407_CT` → Your link
- Notes: `FINAL_CSE407_NOTES` → Your link
- Slides: `FINAL_CSE407_SLIDES` → Your link
- Suggestions: `FINAL_CSE407_SUGGESTIONS` → Your link
- Super Tips: `FINAL_CSE407_SUPERTIPS` → Your link
- Videos: `FINAL_CSE407_VIDEOS` → Your link

**CSE-417 (Distributed Database):**
- CT Questions: `FINAL_CSE417_CT` → Your link
- Notes: `FINAL_CSE417_NOTES` → Your link
- Slides: `FINAL_CSE417_SLIDES` → Your link
- Suggestions: `FINAL_CSE417_SUGGESTIONS` → Your link
- Super Tips: `FINAL_CSE417_SUPERTIPS` → Your link
- Videos: `FINAL_CSE417_VIDEOS` → Your link

**CSE-351 (Artificial Intelligence):**
- CT Questions: `FINAL_CSE351_CT` → Your link
- Notes: `FINAL_CSE351_NOTES` → Your link
- Slides: `FINAL_CSE351_SLIDES` → Your link
- Suggestions: `FINAL_CSE351_SUGGESTIONS` → Your link
- Super Tips: `FINAL_CSE351_SUPERTIPS` → Your link
- Videos: `FINAL_CSE351_VIDEOS` → Your link

### Step 2: Upload Final Exam Materials

1. Go to Admin Panel
2. Click "Upload Material"
3. Select the course
4. **Important:** Select "Final Exam" from the "Exam Period" dropdown
5. Fill in material details
6. Upload the file

### Step 3: Update File Previews (Optional)

For file previews in the `getCourseFiles` function, add final exam files similar to midterm structure.

## Features

✅ **Automatic Filtering:** Materials are automatically filtered based on selected exam period
✅ **Tab Switching:** Beautiful tabs to switch between Midterm and Final materials
✅ **Google Drive Integration:** Separate folders for each exam period
✅ **Admin Upload:** Can specify exam period when uploading materials
✅ **Backward Compatible:** All existing materials default to Midterm

## Current Status

- ✅ Midterm folders configured with existing links
- ⚠️ Final folders need Google Drive links (currently placeholders)
- ⚠️ File list data needs to be added for Final exam materials

## Next Steps

1. Create Final exam folders in Google Drive
2. Get shareable links for each category folder
3. Replace placeholder links in `googleDrive.ts`
4. Start uploading Final exam materials through admin panel
