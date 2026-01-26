# Production Empty Page Fix Guide

## Problem
Your app works fine in `localhost` but shows an empty white page when deployed to Vercel.

## Root Causes & Solutions

### 1. **Environment Variables Not Set in Vercel**
**Most Common Issue** - Vercel needs all `VITE_*` environment variables configured.

#### ✅ Solution:
Go to your Vercel project dashboard:

1. **Navigate to**: Project Settings → Environment Variables
2. **Add these variables** (copy from `.env.production`):

```env
VITE_GOOGLE_API_KEY=AIzaSyAOLcGs9fA3B6hLer1zbI3XEvWZWhtSOfA
VITE_GOOGLE_CLIENT_ID=81000657312-kn330hect3htlho09cbcjsil5ke9hlik.apps.googleusercontent.com
VITE_GOOGLE_REDIRECT_URI=https://edu51five.vercel.app/oauth2callback
VITE_SUPABASE_URL=https://aljnyhxthmwgesnkqwzu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsam55aHh0aG13Z2Vzbmtxd3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MDAyODEsImV4cCI6MjA3MzE3NjI4MX0.410cD_I6gSYfi0k9-A5JyFLGqg-Kf06Byk4RfvmR16k
```

3. **Make sure**: Set environment for **Production**, **Preview**, and **Development**
4. **Redeploy** after adding variables

---

### 2. **Check Browser Console for Errors**

#### How to Check:
1. Open your deployed site: `https://edu51five.vercel.app`
2. Press **F12** (or Right-click → Inspect)
3. Go to **Console** tab
4. Look for **red error messages**

#### Common Errors:
- `Uncaught ReferenceError: process is not defined` → Environment variable issue
- `Failed to load module` → Build/import issue
- `Cannot read property of undefined` → Data initialization issue

---

### 3. **Verify Build Output**

Your `dist/` folder should have:
```
dist/
├── index.html        ✅ (11.25 kB)
├── assets/
│   ├── index-xxx.css  ✅ (229.85 kB)
│   └── index-xxx.js   ✅ (617.31 kB)
├── Edu_51_Logo.png
├── image.png
└── ... (other static assets)
```

If any of these are missing, your build failed.

---

### 4. **Fallback to Test Mode (Without Supabase)**

If the issue persists, try **disabling Supabase** temporarily:

#### Update `src/lib/supabase.ts`:
```typescript
// Force mock mode for testing
const supabaseUrl = ''; // Empty to force mock
const supabaseKey = ''; // Empty to force mock

export const supabase = (!supabaseUrl || !supabaseKey)
  ? createMockClient()
  : createClient(supabaseUrl, supabaseKey);
```

This will use **Google Drive only** (no database), which should work.

---

### 5. **Vercel Deployment Settings**

#### Build Command:
```bash
npm run build
```

#### Output Directory:
```
dist
```

#### Install Command:
```bash
npm install
```

#### Node Version:
```
18.x or 20.x
```

---

### 6. **Check Vercel Build Logs**

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on the **latest deployment**
3. Check the **Build Logs** tab
4. Look for errors like:
   - `Module not found`
   - `Cannot find module`
   - `Build failed`

---

### 7. **Test Production Build Locally**

Before deploying, always test locally:

```bash
# Build production version
npm run build

# Preview production build
npm run preview

# Open http://localhost:4173/
```

If it works locally but not on Vercel → **Environment variables issue**

---

### 8. **Quick Fix: Force Redeploy**

Sometimes Vercel cache causes issues:

1. Go to Vercel Dashboard → Settings → General
2. Scroll to **Dangerous** section
3. Click **Redeploy** → Check "Use existing build cache" → **Uncheck it**
4. Deploy again

---

## Debugging Checklist

- [ ] Environment variables added to Vercel (Production + Preview)
- [ ] Checked browser console for errors
- [ ] Verified `dist/` folder has all files
- [ ] Tested `npm run preview` locally (works?)
- [ ] Checked Vercel build logs (no errors?)
- [ ] Redeployed without cache

---

## If Still Empty...

### Check Network Tab (F12 → Network):
1. Look for **failed requests** (red entries)
2. Check if `index-xxx.js` is loading (200 status)
3. Check if API calls are failing (check Supabase/Google Drive URLs)

### Common Network Issues:
- **CORS errors** → Check Supabase/Google API settings
- **404 on assets** → Base path issue (check `vite.config.ts`)
- **401/403 errors** → Authentication/API key issue

---

## Updated Files

I've already updated your `vite.config.ts` with proper production settings:

```typescript
export default defineConfig({
  plugins: [react()],
  base: '/',  // ✅ Correct for Vercel
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
});
```

---

## Next Steps

1. **Add environment variables to Vercel** (highest priority)
2. **Redeploy** your project
3. **Check browser console** on the live site
4. **Reply with any error messages** you see

Let me know what you find, and I'll help you fix it! 🚀
