# Push Notifications Setup Guide for Edu51Five

## Overview
This guide will help you set up browser push notifications so users get notified on their devices when admin posts new notices or alerts.

## 🎯 Features
- **Browser Push Notifications**: Users receive notifications even when not on the site
- **Click to Open**: Clicking notification opens website in browser
- **Enable/Disable Toggle**: Users control their notification preferences
- **Auto-subscription**: Service worker handles subscription management
- **Admin Trigger**: Notifications sent automatically when admin creates notices

## 📋 Prerequisites
1. Supabase account with project created
2. HTTPS website (required for push notifications) - Vercel provides this
3. Node.js installed for generating VAPID keys

## 🚀 Setup Steps

### Step 1: Generate VAPID Keys
VAPID keys are required for secure push notifications.

```powershell
# Install web-push library globally
npm install -g web-push

# Generate VAPID keys
npx web-push generate-vapid-keys
```

You'll get output like:
```
=======================================
Public Key:
BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBrXhqRaMIvymowNDWBA

Private Key:
p6YH7EJDfFg_qGrxzqpGpM5X4VnFdWqAKUGvUgCsQGU
=======================================
```

**IMPORTANT**: Save these keys securely! You'll need them for the next steps.

### Step 2: Update Frontend VAPID Public Key

Edit `src/lib/pushNotifications.ts` and replace the placeholder:

```typescript
// Line 8: Replace with your actual public key
const VAPID_PUBLIC_KEY = 'YOUR_ACTUAL_PUBLIC_KEY_HERE';
```

Example:
```typescript
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBrXhqRaMIvymowNDWBA';
```

### Step 3: Run Database Setup SQL

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the entire contents of `PUSH-NOTIFICATIONS-SETUP.sql`
6. Click **Run**

This creates:
- `push_subscriptions` table - Stores user subscription data
- `notification_logs` table - Tracks sent notifications
- Helper functions for cleanup and counting
- RLS policies for security
- Realtime subscriptions

### Step 4: Set Up Supabase Edge Function

#### 4.1 Install Supabase CLI
```powershell
npm install -g supabase
```

#### 4.2 Login to Supabase
```powershell
supabase login
```

#### 4.3 Link Your Project
```powershell
# Get your project ref from Supabase dashboard URL
# Example: https://supabase.com/dashboard/project/aljnyhxthmwgesnkqwzu
# Project ref is: aljnyhxthmwgesnkqwzu

supabase link --project-ref YOUR_PROJECT_REF
```

#### 4.4 Set VAPID Keys as Secrets
```powershell
supabase secrets set VAPID_PUBLIC_KEY="YOUR_PUBLIC_KEY"
supabase secrets set VAPID_PRIVATE_KEY="YOUR_PRIVATE_KEY"
```

#### 4.5 Deploy Edge Function
```powershell
supabase functions deploy send-push-notification
```

### Step 5: Test Notifications

#### 5.1 Enable Notifications (Student Side)
1. Open your website (as a student, not admin)
2. Click the hamburger menu (mobile) or settings
3. Click "Enable Notifications"
4. Allow notifications when browser prompts
5. You should see "Notifications On" with green indicator

#### 5.2 Send Test Notification (Admin Side)
1. Login as admin
2. Go to Admin Dashboard
3. Click "Create Notice"
4. Fill in notice details
5. Click "Create Notice"

All subscribed users should receive a browser notification!

## 🔧 Configuration Options

### Notification Frequency
Edit `src/lib/pushNotifications.ts` to customize:

```typescript
// Line 98-100: Change subscription options
subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true, // Always show notification to user
  applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
});
```

### Notification Appearance
Edit `public/sw.js` to customize notification display:

```javascript
// Lines 36-54: Customize notification options
const options = {
  body: data.body || 'New notification from Edu51Five',
  icon: '/cover.jpg', // Change to your logo
  badge: '/cover.jpg', // Small icon for notification tray
  vibrate: [200, 100, 200], // Vibration pattern (ms)
  requireInteraction: false, // Auto-dismiss after ~5 seconds
  // ... more options
};
```

### Auto-Cleanup Period
Edit `PUSH-NOTIFICATIONS-SETUP.sql` (line 60):

```sql
-- Clean up subscriptions older than 30 days (change this value)
WHERE updated_at < NOW() - INTERVAL '30 days';
```

## 🧪 Testing

### Test Service Worker Registration
Open browser console (F12) and run:
```javascript
navigator.serviceWorker.getRegistrations().then(regs => console.log(regs));
```

Should show registered service worker at `/sw.js`.

### Test Push Subscription
```javascript
navigator.serviceWorker.ready.then(reg => 
  reg.pushManager.getSubscription().then(sub => console.log(sub))
);
```

Should show subscription object with endpoint and keys.

### Test Edge Function Manually
```powershell
# Replace with your project details
curl -i --location --request POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-push-notification' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "noticeId": "test-123",
    "noticeType": "welcome-notice",
    "title": "Test Notification",
    "body": "This is a test push notification from Edu51Five"
  }'
```

## 🐛 Troubleshooting

### Notifications Not Appearing

**1. Check Browser Support**
```javascript
console.log('Push supported:', 'PushManager' in window);
console.log('Notifications supported:', 'Notification' in window);
console.log('Service Worker supported:', 'serviceWorker' in navigator);
```

All should be `true`. If not, browser doesn't support push notifications.

**2. Check Notification Permission**
```javascript
console.log('Permission:', Notification.permission);
```

Should be `"granted"`. If `"denied"`, user must manually enable in browser settings.

**3. Check Service Worker**
```javascript
navigator.serviceWorker.ready.then(reg => console.log('SW ready:', reg));
```

Should show service worker registration.

**4. Check Subscription in Database**
Go to Supabase Dashboard → Table Editor → `push_subscriptions` table. Should have rows with subscription data.

**5. Check Edge Function Logs**
Supabase Dashboard → Edge Functions → `send-push-notification` → Logs tab

### Common Issues

**Issue**: "Push notifications not supported"
- **Solution**: Ensure website is HTTPS (HTTP doesn't support push)

**Issue**: "Service Worker registration failed"
- **Solution**: Check that `public/sw.js` exists and is accessible at `/sw.js`

**Issue**: "VAPID keys not configured"
- **Solution**: Run `supabase secrets set` commands again with correct keys

**Issue**: Notifications sent but not received
- **Solution**: 
  1. Check browser notification settings
  2. Ensure notifications aren't blocked for the site
  3. Check if device is on Do Not Disturb mode

**Issue**: Edge function returns 401 Unauthorized
- **Solution**: Check that `SUPABASE_ANON_KEY` is correct in request header

## 📊 Monitoring

### Check Active Subscriptions
```sql
SELECT COUNT(*) as active_subscriptions
FROM push_subscriptions
WHERE updated_at > NOW() - INTERVAL '7 days';
```

### Check Notification Delivery Stats
```sql
SELECT 
  notice_type,
  COUNT(*) as total_sent,
  AVG(success_count) as avg_success,
  AVG(failure_count) as avg_failures
FROM notification_logs
WHERE sent_at > NOW() - INTERVAL '7 days'
GROUP BY notice_type;
```

### Get Recent Notifications
```sql
SELECT * FROM notification_logs
ORDER BY sent_at DESC
LIMIT 10;
```

## 🔒 Security Notes

1. **VAPID Keys**: Keep private key secret! Never commit to Git or expose in client code.
2. **RLS Policies**: Already configured in SQL setup for secure access.
3. **Subscription Storage**: Encrypted and stored securely in Supabase.
4. **HTTPS Only**: Push notifications only work on HTTPS sites.

## 🎨 Customization

### Change Notification Icon
Replace `/cover.jpg` in `public/sw.js` with your logo path:
```javascript
icon: '/your-logo.png',
badge: '/your-badge.png',
```

### Add Custom Actions
Edit `public/sw.js` (lines 51-58):
```javascript
actions: [
  { action: 'open', title: 'View Now' },
  { action: 'close', title: 'Dismiss' },
  { action: 'custom', title: 'Custom Action' } // Add custom actions
]
```

### Change Notification Sound
Browsers use system sounds. You can add custom vibration pattern:
```javascript
vibrate: [100, 50, 100, 50, 100], // Custom vibration
```

## 📱 Platform Support

### Desktop Browsers
- ✅ Chrome/Edge 42+
- ✅ Firefox 44+
- ✅ Opera 37+
- ❌ Safari (requires different setup with APNs)

### Mobile Browsers
- ✅ Chrome Android 42+
- ✅ Firefox Android 48+
- ✅ Samsung Internet 4+
- ❌ iOS Safari (Apple restriction)
- ⚠️ iOS Chrome/Firefox (use WebKit, limited support)

## 🔄 Maintenance

### Clean Up Old Subscriptions (Auto-runs)
The database has an auto-cleanup function that runs before fetching subscriptions. Removes subscriptions older than 30 days.

### Manual Cleanup
```sql
SELECT cleanup_old_push_subscriptions();
```

### Reset All Subscriptions (if needed)
```sql
-- CAUTION: This removes all subscriptions!
TRUNCATE TABLE push_subscriptions;
```

## 📚 Additional Resources

- [Web Push API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker Cookbook](https://serviceworke.rs/)
- [Supabase Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [VAPID Specification](https://datatracker.ietf.org/doc/html/draft-ietf-webpush-vapid)

## 🎉 Success Checklist

- [ ] Generated VAPID keys
- [ ] Updated `VAPID_PUBLIC_KEY` in frontend
- [ ] Ran `PUSH-NOTIFICATIONS-SETUP.sql` in Supabase
- [ ] Installed Supabase CLI
- [ ] Linked to Supabase project
- [ ] Set VAPID secrets in Supabase
- [ ] Deployed Edge Function
- [ ] Tested notification enable/disable
- [ ] Sent test notification from admin panel
- [ ] Verified notification received on device

---

**Questions?** Check the troubleshooting section or open an issue on GitHub.

**Last Updated**: December 2025
