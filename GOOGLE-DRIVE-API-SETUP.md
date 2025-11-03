# Google Drive API Setup Guide

## Prerequisites
You already have OAuth credentials configured. Now you need to enable the Drive API and get an API key.

## Step 1: Enable Google Drive API
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project: `avid-grid-468419-u6`
3. Navigate to **APIs & Services** > **Library**
4. Search for "Google Drive API"
5. Click **Enable**

## Step 2: Create API Key
1. Go to **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS**
3. Select **API Key**
4. Copy the generated API key
5. Click **Restrict Key** (recommended)
6. Under **API restrictions**, select "Restrict key"
7. Choose "Google Drive API" from the dropdown
8. Save

## Step 3: Add to .env file
Add this line to your `.env` file:
```bash
VITE_GOOGLE_API_KEY=your_api_key_here
```

## Current Configuration Status

✅ OAuth Client ID configured
✅ OAuth Client Secret configured
✅ Redirect URIs configured (production + localhost)
✅ JavaScript origins configured
⏳ API Key needed (create using steps above)
⏳ Drive API needs to be enabled

## Testing the Integration

Once you add the API key:

1. Start dev server: `npm run dev`
2. Go to Admin Panel
3. Look for "Google Drive Upload" section
4. Click "Sign In with Google"
5. Grant permissions
6. Upload files and they'll be organized by course/category
7. Files are automatically made public with shareable links

## Features Implemented

- ✅ OAuth 2.0 authentication
- ✅ File upload to Drive
- ✅ Automatic folder creation (Course/Category structure)
- ✅ Make files public automatically
- ✅ Generate embed URLs for preview
- ✅ Generate download URLs
- ✅ Copy URLs to clipboard
- ✅ List uploaded files
- ✅ Search files
- ✅ Delete files
- ✅ Full TypeScript support

## Security Notes

⚠️ **IMPORTANT**: Your `.env` file should NEVER be committed to Git
- `.env` is already in `.gitignore`
- Only commit `.env.example` (without real credentials)
- Use Vercel environment variables for production deployment
