# Deploy Edge Function - Manual Steps (No CLI)

Your VAPID keys are ready:
```
Public Key: BGTEAag0_lKOToSElyiwSSMmtLG7V6paCY8EE51pC6FI6IJBl2uPoHb3KaVydzxQHmQJZ6izx_eN_Dq7bYv8dOk
Private Key: 0bzOYBk7N5_qalitGCY2hMe4IvIGmSssdgg6aQfvX7E
```

## Option 1: Deploy via Supabase Web Dashboard (Easiest)

1. Go to https://supabase.com and sign in
2. Select your project
3. Click **Functions** on the left sidebar
4. Click **+ Create a new function**
5. Name it: `send-push-notification`
6. Replace the template code with the content from: `supabase/functions/send-push-notification/index.ts`
7. Click **Save**
8. In the same function page, scroll to **Secrets** section
9. Click **+ Add a new secret**
10. Add two secrets:

```
Name: VAPID_PUBLIC_KEY
Value: BGTEAag0_lKOToSElyiwSSMmtLG7V6paCY8EE51pC6FI6IJBl2uPoHb3KaVydzxQHmQJZ6izx_eN_Dq7bYv8dOk

Name: VAPID_PRIVATE_KEY
Value: 0bzOYBk7N5_qalitGCY2hMe4IvIGmSssdgg6aQfvX7E
```

11. Click **Save secrets**
12. The function should now be deployed!

---

## Option 2: Deploy via Supabase Docker (Alternative)

If you have Docker installed, you can use:

```powershell
# Install Supabase locally first
npm install -g @supabase/cli --force

# Login
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
supabase functions deploy send-push-notification
```

**To find YOUR_PROJECT_REF:**
- Go to https://supabase.com → Your project
- Settings (bottom left) → Project settings
- Copy the "Project Reference ID" (looks like: `abcdefghijklmnop`)

---

## Option 3: Deploy via GitHub (If Connected)

If your Supabase project is connected to GitHub:

1. Push your changes to GitHub:
```powershell
git add supabase/
git commit -m "Add send-push-notification Edge Function with VAPID keys"
git push
```

2. Supabase will auto-detect and deploy the function

---

## Step 2: Add VAPID Public Key to Frontend

After the function is deployed, update your frontend environment:

### For Local Development:
Create/edit `d:\Edu51Five\.env.local`:
```env
VITE_VAPID_PUBLIC_KEY=BGTEAag0_lKOToSElyiwSSMmtLG7V6paCY8EE51pC6FI6IJBl2uPoHb3KaVydzxQHmQJZ6izx_eN_Dq7bYv8dOk
```

### For Vercel Deployment:
1. Go to https://vercel.com → Your project settings
2. Click **Environment Variables**
3. Add:
```
VITE_VAPID_PUBLIC_KEY=BGTEAag0_lKOToSElyiwSSMmtLG7V6paCY8EE51pC6FI6IJBl2uPoHb3KaVydzxQHmQJZ6izx_eN_Dq7bYv8dOk
```
4. Redeploy: `npm run build && git push`

---

## Step 3: Test the Setup

1. Start your local dev server: `npm run dev`
2. Go to http://localhost:5174
3. Enable push notifications (browser should ask for permission)
4. Go to Admin → Broadcast Notification
5. Send a test notification

**Expected result:** You should see a notification popup!

---

## Troubleshooting

**If the function doesn't work after deployment:**

1. Check Supabase → Functions → send-push-notification → **Logs**
2. Look for error messages like:
   - "Missing VAPID_PUBLIC_KEY" → Secrets not set properly
   - "Failed to get subscriptions" → No active subscribers
   - "No active subscriptions found" → Enable notifications first

3. Make sure at least one user has:
   - Enabled push notifications on the student dashboard
   - Browser permission granted
   - Been on the site within the last 30 days

---

## Reference
- Full setup guide: `EDGE-FUNCTION-SETUP.md`
- Edge Function code: `supabase/functions/send-push-notification/index.ts`
- Frontend notification setup: `src/lib/pushNotifications.ts`
