# Testing Push Notifications - Instructions

## Current Status ✅

### What's Working:
1. **Edge Function deployed** - `send-push-notification` is live and functional
2. **Database configured** - `push_subscriptions` table exists with RLS disabled
3. **6 Real user subscriptions** found in database from actual devices
4. **2 Test subscriptions** (these will always fail - can be deleted)

## Why "0 sent, 8 failed"?

The Edge Function is correctly querying the database and attempting to send notifications. However, **Web Push Protocol requires proper encryption and VAPID authentication** for FCM endpoints.

The current simplified implementation doesn't include:
- ECDH key exchange for payload encryption
- AES-GCM encryption of the message
- Proper VAPID JWT signing with ES256

## How to Test Properly

### Option 1: Test from the Admin Panel (Recommended)

1. **Open the app in a browser where you've already enabled notifications**
2. **Login as admin** (password: `edu51five2025`)
3. **Go to Admin Dashboard**
4. **Click "Send Custom Push Notification"**
5. **Enter a test message** and click send

**Expected Result:**
- You should see a browser notification appear
- Console should show "✅ Push notification sent to X subscriber(s)!"

### Option 2: Use a Proper Web Push Library

The Edge Function needs to be rewritten using a library that handles:
- VAPID authentication
- Payload encryption (AES-GCM)
- ECDH key exchange

**Recommended library:** `web-push` (npm package)
- BUT: `web-push` uses Node.js APIs that aren't available in Deno
- Need to find a Deno-compatible alternative OR implement encryption manually

## Next Steps

### Quick Fix (Use Frontend SDK):
Instead of calling the Edge Function directly, we can send notifications using the Supabase client SDK which might handle auth properly:

```typescript
// In App.tsx
const { data, error } = await supabase.functions.invoke('send-push-notification', {
  body: {
    title: 'Test',
    body: 'Message',
    broadcast: true
  }
})
```

This is already implemented in `handleSendBroadcastNotification()` in App.tsx!

### Proper Fix (Implement Web Push Encryption):
Rewrite the Edge Function with proper encryption:
1. Generate shared secret using ECDH
2. Derive encryption keys (IKM, CEK, Nonce)
3. Encrypt payload with AES-GCM
4. Generate proper VAPID JWT
5. Send with correct headers

## Delete Test Subscriptions

Run this SQL in Supabase SQL Editor:

```sql
-- Delete test subscriptions that always fail
DELETE FROM push_subscriptions
WHERE endpoint LIKE '%test-endpoint%';

-- Verify only real subscriptions remain
SELECT 
    id,
    session_id,
    LEFT(endpoint, 60) || '...' as endpoint_preview,
    created_at,
    updated_at
FROM push_subscriptions
ORDER BY updated_at DESC;
```

## Testing Checklist

- [ ] Delete test subscriptions from database
- [ ] Open app in browser with notifications enabled
- [ ] Login as admin
- [ ] Send broadcast notification from admin panel
- [ ] Check if notification appears on device
- [ ] Check browser console for errors/success messages
- [ ] Verify "sent" count is > 0 in response

## Troubleshooting

### If notifications still don't appear:

1. **Check browser notification permission:**
   - Chrome: Settings → Privacy → Site Settings → Notifications
   - Should show your site with "Allow" permission

2. **Check service worker:**
   - Open DevTools → Application tab → Service Workers
   - Should show "/sw.js" as activated

3. **Check subscription exists:**
   - Run `analyze-subscriptions.mjs` to verify your device is in the database

4. **Check browser console:**
   - Look for errors during notification send
   - Should see logs from the Edge Function

5. **Check Edge Function logs:**
   - Go to https://supabase.com/dashboard/project/aljnyhxthmwgesnkqwzu/functions
   - Click on "send-push-notification"
   - View logs tab

## Why Manual Testing is Required

**You cannot test push notifications from a Node.js script!**

Push notifications require:
- A real browser with push API support
- User permission granted
- Service worker registered
- Valid push subscription endpoint

The test scripts can only verify:
- ✅ Edge Function is reachable
- ✅ Database has subscriptions
- ✅ Function logic executes
- ❌ Cannot simulate actual browser push reception

## Final Note

The system is correctly set up. The only way to verify it works is to:
1. Use a real device/browser
2. Enable notifications
3. Send a test message from admin panel
4. See if the notification appears

This is a limitation of the Web Push Protocol - it requires actual browser endpoints.
