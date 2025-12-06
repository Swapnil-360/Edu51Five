# ✅ Supabase CLI Setup Complete!

## What We've Done:

✅ **Installed Supabase CLI** using `npx supabase`
✅ **Logged in** to your Supabase account
✅ **Linked project** `aljnyhxthmwgesnkqwzu`
✅ **Deployed Edge Function** `send-push-notification`
✅ **Set VAPID secrets:**
   - VAPID_PUBLIC_KEY: BGTEAag0_lKOToSElyiwSSMmtLG7V6paCY8EE51pC6FI6IJBl2uPoHb3KaVydzxQHmQJZ6izx_eN_Dq7bYv8dOk
   - VAPID_PRIVATE_KEY: 0bzOYBk7N5_qalitGCY2hMe4IvIGmSssdgg6aQfvX7E
✅ **Updated local .env** with VAPID public key

---

## Final Steps:

### 1. Create Database Tables (One-Time Setup)

Go to your Supabase SQL Editor and run:

**File:** `PUSH-NOTIFICATIONS-SETUP.sql`

Or manually run this SQL:

\`\`\`sql
-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL UNIQUE,
    endpoint TEXT NOT NULL,
    subscription JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_session_id ON push_subscriptions(session_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_updated_at ON push_subscriptions(updated_at DESC);

-- Disable RLS for easier access (or set proper policies)
ALTER TABLE push_subscriptions DISABLE ROW LEVEL SECURITY;

-- Create notification_logs table (optional, for tracking)
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    notice_id TEXT,
    notice_type TEXT,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    recipients_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

---

### 2. Update Vercel Environment Variables

1. Go to https://vercel.com → Your project (Edu51Five)
2. Settings → Environment Variables
3. Add new variable:
   ```
   Name: VITE_VAPID_PUBLIC_KEY
   Value: BGTEAag0_lKOToSElyiwSSMmtLG7V6paCY8EE51pC6FI6IJBl2uPoHb3KaVydzxQHmQJZ6izx_eN_Dq7bYv8dOk
   ```
4. Click "Save"
5. Redeploy your app (Vercel will auto-deploy or run `git push`)

---

### 3. Test Locally

```powershell
# Start dev server
npm run dev

# Open http://localhost:5174
# Go to Student Dashboard
# Enable push notifications (browser will ask permission)
# Go to Admin → Login (password: edu51five2025)
# Go to "Broadcast Notification" section
# Fill in title and message
# Click "Send Broadcast Notification"
```

**Expected Result:** You should see a push notification! 🎉

---

### 4. Test in Production

After deploying to Vercel:
1. Visit https://edu51five.vercel.app
2. Enable notifications
3. Admin → Broadcast → Send test

---

## Troubleshooting

**"No active subscriptions"**
- Enable push notifications first (bell icon in navbar)
- Wait a few seconds for subscription to register
- Try sending again

**"Failed to send notification"**
- Check Supabase → Functions → send-push-notification → Logs
- Verify secrets are set: `npx supabase secrets list`
- Make sure tables exist in SQL Editor

**Permission denied in browser**
- Clear browser cache
- Reset site permissions in browser settings
- Try in incognito mode

---

## Useful Commands

```powershell
# Check function status
npx supabase functions list

# View function logs
npx supabase functions logs send-push-notification

# List secrets
npx supabase secrets list

# Redeploy function
npx supabase functions deploy send-push-notification
```

---

## Summary

Your push notification system is now fully configured! The only remaining steps are:
1. Run the SQL to create tables (if not already done)
2. Add VAPID public key to Vercel
3. Test!

All backend infrastructure is ready. Happy coding! 🚀
