# Edge Function & VAPID Keys Setup Guide

## Problem
Error: "Failed to send notification. Make sure the Edge Function is deployed with VAPID keys configured."

This means:
1. The Edge Function `send-push-notification` may not be deployed, OR
2. VAPID keys are missing from Supabase environment variables

## Solution

### Step 1: Generate VAPID Keys (if you don't have them)

Run this in your terminal:

```powershell
npm install -g web-push
web-push generate-vapid-keys
```

This will output:
```
Public Key: BEx...
Private Key: abc...
```

**Save these values - you'll need them in Step 3.**

---

### Step 2: Deploy the Edge Function

Make sure you have Supabase CLI installed:

```powershell
npm install -g supabase
```

Then deploy the function:

```powershell
cd d:\Edu51Five
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy send-push-notification
```

**To find YOUR_PROJECT_REF:**
- Go to https://supabase.com
- Click your project
- Look at the URL or Settings → Project settings → Project Reference ID

---

### Step 3: Set VAPID Keys in Supabase

1. Go to your **Supabase project dashboard**
2. Click **Settings** (bottom left) → **Edge Functions**
3. Look for your function `send-push-notification`
4. Click it and find **Secrets** section
5. Add these environment variables:

| Key | Value |
|-----|-------|
| `VAPID_PUBLIC_KEY` | Your public key from Step 1 |
| `VAPID_PRIVATE_KEY` | Your private key from Step 1 |

---

### Step 4: Update Frontend VAPID Key

The public VAPID key must also be in your frontend environment:

1. Go to your **Vercel project** or local `.env` file
2. Add:
```env
VITE_VAPID_PUBLIC_KEY=BEx...  # Same public key from Step 1
```

3. Redeploy frontend:
```powershell
npm run build
git add .
git commit -m "Add VAPID public key to frontend"
git push
```

---

### Step 5: Test the Setup

Try sending a broadcast notification from the admin panel.

**If it still fails, check:**

1. **Is the Edge Function deployed?**
   - Go to Supabase → Functions
   - You should see `send-push-notification` listed
   - Check the deployment logs if it shows an error

2. **Are VAPID keys set correctly?**
   - Go to Function → Settings
   - Verify the environment variables are there
   - Check for typos

3. **Do you have active subscriptions?**
   - Go to Supabase → SQL Editor
   - Run: `SELECT COUNT(*) FROM push_subscriptions WHERE updated_at > NOW() - INTERVAL '30 days';`
   - Must have at least 1 active subscription to send notifications

4. **Check Edge Function logs:**
   - Supabase → Functions → send-push-notification → Logs
   - Look for error messages

---

### Troubleshooting

**Error: "Failed to get subscriptions"**
- Verify `push_subscriptions` table exists
- Check table has RLS disabled or proper policies

**Error: "Missing SUPABASE_URL"**
- Edge Function didn't deploy properly
- Redeploy: `supabase functions deploy send-push-notification`

**Error: "No active subscriptions"**
- No users have enabled push notifications
- Go to student dashboard, enable notifications
- Wait a few seconds, then try sending

---

### Manual Testing (cURL)

If you want to test directly:

```powershell
$body = @{
    noticeId = "test"
    noticeType = "test"
    title = "Test Notification"
    body = "This is a test"
    url = "/"
    broadcast = $true
} | ConvertTo-Json

curl -X POST `
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-push-notification `
  -H "Authorization: Bearer YOUR_ANON_KEY" `
  -H "Content-Type: application/json" `
  -d $body
```

Replace:
- `YOUR_PROJECT_REF` - From your Supabase project settings
- `YOUR_ANON_KEY` - From your Supabase project settings → API keys

---

## Reference Files
- Edge Function: `supabase/functions/send-push-notification/index.ts`
- Frontend notification handler: `src/App.tsx` (line ~1680-1714)
- Broadcast UI: `src/components/Admin/AdminDashboard.tsx`
