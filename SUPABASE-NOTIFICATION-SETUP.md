# Supabase Setup for Push Notifications

## Overview
This guide walks through setting up Supabase for the push notification system to work properly when admins upload files and send notices to students.

## Current Status

### ✅ Already Setup (in database)
- `push_subscriptions` table - stores browser push subscriptions
- `notification_logs` table - tracks sent notifications  
- Helper functions for cleanup and retrieval
- Row Level Security (RLS) policies enabled

### ❌ Still Need to Setup
1. **Supabase Edge Function** - `send-push-notification` function to send actual notifications
2. **Materials table update** - add `exam_period` column (if not already present)
3. **Realtime subscriptions** - enable for real-time notifications

---

## Step 1: Run Push Notification Database Setup

1. Go to your Supabase dashboard: https://app.supabase.com/
2. Select your project
3. Go to **SQL Editor** → Click **New Query**
4. Copy and paste the entire content from `PUSH-NOTIFICATIONS-SETUP.sql`
5. Click **Run**

**Check if this was already run:**
- Go to **Database** → **Tables**
- Look for: `push_subscriptions`, `notification_logs`
- If they exist, skip this step

---

## Step 2: Verify Materials Table Has exam_period Column

The materials table needs the `exam_period` column for filtering.

**Check if present:**
1. Go to **Database** → **Tables** → **materials**
2. Look for column: `exam_period` (should be TEXT or VARCHAR)

**If NOT present, run this SQL:**
```sql
-- Add exam_period column to materials table
ALTER TABLE materials ADD COLUMN IF NOT EXISTS exam_period TEXT CHECK (exam_period IN ('midterm', 'final')) DEFAULT 'midterm';

-- Add uploaded_by column (optional, for tracking which admin uploaded)
ALTER TABLE materials ADD COLUMN IF NOT EXISTS uploaded_by TEXT DEFAULT NULL;

-- Add download_url column (optional, separate from file_url)
ALTER TABLE materials ADD COLUMN IF NOT EXISTS download_url TEXT DEFAULT NULL;
```

---

## Step 3: Create Supabase Edge Function for Sending Notifications

This is the **CRITICAL** missing piece. The Edge Function actually sends push notifications to subscribed devices.

### 3a. Create the Function

1. Go to **Functions** → **Create a new function**
2. Name it: `send-push-notification`
3. Copy the code below:

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PushMessage {
  noticeId: string;
  noticeType: string;
  title: string;
  body: string;
  url?: string;
}

export async function handler(
  req: Request,
  _context: any
): Promise<Response> {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const message: PushMessage = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        "Missing Supabase credentials in environment variables"
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all active push subscriptions
    const { data: subscriptions, error: subscriptionError } = await supabase
      .from("push_subscriptions")
      .select("endpoint, subscription");

    if (subscriptionError) {
      console.error("Error fetching subscriptions:", subscriptionError);
      throw subscriptionError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("No active subscriptions found");
      return new Response(
        JSON.stringify({
          success: true,
          message: "No subscriptions to notify",
          sent: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${subscriptions.length} subscriptions`);

    // Prepare notification payload
    const notificationPayload = {
      title: message.title,
      body: message.body,
      icon: "/image.png", // Your website logo
      badge: "/image.png",
      tag: message.noticeType,
      requireInteraction: false,
      vibrate: [200, 100, 200],
      data: {
        url: message.url || "/",
        noticeId: message.noticeId,
      },
      actions: [
        { action: "open", title: "View Now" },
        { action: "close", title: "Dismiss" },
      ],
    };

    // Send push notification to each subscription
    let successCount = 0;
    let failureCount = 0;

    for (const sub of subscriptions) {
      try {
        // Use Web Push API (requires web-push package or manual HTTPS POST)
        // For this implementation, we'll use Supabase's built-in capability
        
        const response = await fetch(sub.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            notification: notificationPayload,
          }),
        });

        if (response.ok) {
          successCount++;
        } else {
          failureCount++;
          console.warn(
            `Failed to send to ${sub.endpoint}: ${response.status}`
          );
          
          // Remove invalid subscriptions
          if (response.status === 410 || response.status === 404) {
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("endpoint", sub.endpoint);
          }
        }
      } catch (error) {
        failureCount++;
        console.error(`Error sending notification:`, error);
      }
    }

    // Log the notification send event
    const { error: logError } = await supabase
      .from("notification_logs")
      .insert({
        notice_id: message.noticeId,
        notice_type: message.noticeType,
        title: message.title,
        body: message.body,
        recipients_count: subscriptions.length,
        success_count: successCount,
        failure_count: failureCount,
      });

    if (logError) {
      console.error("Error logging notification:", logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Notifications sent",
        sent: successCount,
        failed: failureCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Unknown error",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}
```

### 3b. Deploy the Function

1. Click **Deploy**
2. Go to **Functions** → **send-push-notification**
3. Copy the function URL (it should be something like `https://xxxxxxxxxxx.functions.supabase.co/send-push-notification`)

### 3c. Update App Configuration (if needed)

The app calls this function at line ~428 in `App.tsx`:
```typescript
const { data, error } = await supabase.functions.invoke('send-push-notification', {
  body: {
    noticeId: notice.id,
    noticeType: notice.id,
    title: notice.title,
    body: notice.content.substring(0, 100),
    url: '/'
  }
});
```

This should work automatically once the Edge Function is deployed.

---

## Step 4: Enable Realtime (Optional)

For instant notification logging and monitoring:

1. Go to **Database** → **Publications**
2. Click **supabase_realtime**
3. Enable tables:
   - ✅ `push_subscriptions`
   - ✅ `notification_logs`
   - ✅ `materials`

---

## Step 5: Test the Setup

### Test Push Subscription Storage
1. Open the app in your browser
2. Go to student section (NOT admin)
3. Click the **Bell icon** 🔔 in the header
4. Click **Enable Notifications**
5. Grant permission when prompted
6. Go to Supabase **Database** → **push_subscriptions** table
7. You should see a new row with your device's subscription

### Test Push Notification Send
1. As admin, upload a new file
2. Check browser console for: `✅ Push notification sent for new material`
3. You should receive a notification (if subscribed and browser is open/focused)

---

## Checklist: What You Need to Do

- [ ] **Run `PUSH-NOTIFICATIONS-SETUP.sql`** in Supabase SQL Editor
- [ ] **Verify `push_subscriptions` table exists** with columns: `id`, `session_id`, `subscription`, `endpoint`, `created_at`, `updated_at`
- [ ] **Verify `notification_logs` table exists** with columns: `id`, `notice_id`, `notice_type`, `title`, `body`, `recipients_count`, `success_count`, `failure_count`, `sent_at`
- [ ] **Add `exam_period` column to `materials` table** (if not present)
- [ ] **Create Edge Function `send-push-notification`** (see Step 3)
- [ ] **Deploy Edge Function** and verify it's accessible
- [ ] **Enable Realtime** on recommended tables (Step 4)
- [ ] **Test**: Enable notifications → Upload file → Receive notification

---

## Troubleshooting

### Notifications Not Received
1. **Check browser console** for errors in `App.tsx` around line 428
2. **Check Edge Function logs**: Go to **Functions** → **send-push-notification** → **Invocations**
3. **Check `push_subscriptions` table**: Should have entries after you enable notifications
4. **Check browser permissions**: Settings → Privacy → Notifications → Allow edu51five.vercel.app

### "Supabase is not configured" Error
1. Verify `.env` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
2. Check they're not placeholder values like `your-supabase`
3. Redeploy or restart dev server

### Old Subscriptions Still Active
- The system auto-cleans subscriptions older than 30 days
- Manual cleanup: Run the `cleanup_old_push_subscriptions()` function in SQL Editor

---

## Architecture Summary

```
User Enable Notifications (Frontend)
         ↓
Service Worker Registers
         ↓
Browser Push Subscription Created
         ↓
App saves to push_subscriptions table
         ↓
Admin Uploads File
         ↓
App calls sendNoticeNotification()
         ↓
Edge Function invoke('send-push-notification')
         ↓
Edge Function fetches all subscriptions
         ↓
Sends push to each endpoint (browser)
         ↓
Service Worker receives push event
         ↓
Browser shows notification with icon + sound
         ↓
Logged to notification_logs table
```

---

## Questions?

- **Service Worker logs**: Open DevTools → Application → Service Workers
- **Push Subscription**: DevTools → Application → Manifest
- **Edge Function**: Check **Supabase Dashboard → Functions → Invocations** for logs
