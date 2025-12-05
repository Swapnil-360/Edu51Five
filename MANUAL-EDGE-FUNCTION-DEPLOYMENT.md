# Manual Edge Function Deployment Guide

## Since Supabase CLI isn't installed, use the web dashboard instead

### Step 1: Go to Your Supabase Dashboard
1. Open https://app.supabase.com/
2. Select your Edu51Five project
3. Go to **Functions** in the left sidebar

### Step 2: Create or Update the Function

#### Option A: If function doesn't exist yet
1. Click **Create a new function**
2. Name: `send-push-notification`
3. Select **TypeScript**
4. Click **Create function**

#### Option B: If function already exists
1. Click **send-push-notification** in the list
2. Click **Edit** button
3. Clear all existing code

### Step 3: Copy the New Function Code

Copy the ENTIRE content from the file:
```
supabase/functions/send-push-notification/index.ts
```

Replace everything in the editor with this code.

### Step 4: Deploy

1. Click **Deploy** button (top right)
2. Wait for "Function deployed successfully" message
3. Note the function URL displayed

### Step 5: Test the Function

1. Click **Test** or **Invocations** tab
2. Use this test payload:

```json
{
  "noticeId": "test-123",
  "noticeType": "welcome-notice",
  "title": "Test Notification",
  "body": "This is a test notification from Edu51Five",
  "url": "/"
}
```

3. Click **Send**
4. Check the response - should show `"success": true`

### Step 6: Check Logs

1. Click **Invocations** tab
2. Look for your test request
3. Should see logs with:
   - 📡 Fetching active push subscriptions...
   - 📬 Found X subscriptions
   - ✅ Notifications sent

---

## Function File Content

The function code is located at:
**`supabase/functions/send-push-notification/index.ts`**

### Key Features
- ✅ Sends push notifications to all subscribed users
- ✅ Auto-cleans invalid subscriptions (410, 404 errors)
- ✅ Batch processing (10 at a time) to avoid rate limits
- ✅ Detailed logging for debugging
- ✅ Error handling and validation
- ❌ NO VAPID keys needed
- ❌ NO web-push library needed

---

## After Deployment - What Happens

### When Admin Uploads File:

```
1. Admin logs in → Uploads file
   ↓
2. File saved to Supabase Storage
   ↓
3. App calls sendNoticeNotification()
   ↓
4. Edge Function invoked automatically
   ↓
5. Function fetches all push subscriptions
   ↓
6. Sends notification to each browser endpoint
   ↓
7. Service Worker receives push event
   ↓
8. Browser shows notification (even if app closed!)
   ↓
9. Event logged to notification_logs table
```

---

## Testing the Full Flow

### 1. Enable Notifications (as Student)
- Open app as student
- Click Bell icon 🔔
- Click "Enable Notifications"
- Grant browser permission
- Check Supabase → **push_subscriptions** table
- Should see new row with your subscription

### 2. Upload a File (as Admin)
- Login as admin (password: `edu51five2025`)
- Upload a new material file
- Check browser console - should see:
  ```
  ✅ Push notification sent for new material
  ```

### 3. Receive Notification
- If notifications enabled, you'll see browser notification
- Check Supabase → **notification_logs** table
- Should see log entry with:
  - recipients_count: number of subscribed users
  - success_count: how many got the notification
  - failure_count: how many failed

---

## Troubleshooting

### "Function not found" Error
- Check function is deployed and status shows "Active"
- Verify function name is exactly: `send-push-notification`

### "Missing required fields" Error
- Make sure test payload has: `noticeId`, `title`, `body`
- Check for typos in field names

### "No active subscriptions" Response
- This is OK! Just means no one enabled notifications yet
- Try enabling notifications first

### Notifications Not Arriving
1. Check push_subscriptions table has data
2. Check notification_logs table for failure_count
3. Check browser permission is granted
4. Check Service Worker is registered:
   - DevTools → Application → Service Workers

---

## File Locations

```
supabase/
└── functions/
    └── send-push-notification/
        └── index.ts  ← The Edge Function code
```

---

## Next Steps

1. ✅ Go to Supabase web dashboard
2. ✅ Create/Update the function
3. ✅ Deploy it
4. ✅ Test with sample data
5. ✅ Enable notifications as student
6. ✅ Upload file as admin
7. ✅ Receive push notification!

**Estimated time: 5 minutes**
