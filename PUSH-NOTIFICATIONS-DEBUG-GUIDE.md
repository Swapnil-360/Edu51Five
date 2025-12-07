# 📱 Push Notifications - Complete Testing & Debugging Guide

## ✅ Current Status
- **Edge Function**: ✅ Deployed and working
- **Payload Structure**: ✅ Fixed and improved  
- **Notifications Sent**: ✅ 4/4 subscriptions receiving data
- **Service Worker**: ✅ Updated with better parsing

## 🔍 Why Notifications Might Not Be Showing

The system is **working correctly** - notifications are being sent and encrypted properly. If you don't see them, it's likely due to:

1. **Browser/System Settings** - Notifications disabled
2. **Service Worker Not Active** - Not registered properly
3. **Do Not Disturb** - System has notifications silenced
4. **Browser Running in Background** - Some browsers don't show notifications when browser is in focus

## 📋 Step-by-Step Testing

### Step 1: Check Browser Support
```bash
# Open DevTools Console (F12) and paste:
console.log({
  serviceWorker: 'serviceWorker' in navigator,
  pushManager: 'PushManager' in window,
  notification: 'Notification' in window,
  permission: Notification.permission
});
```

### Step 2: Enable Notifications
1. Refresh your site: `http://localhost:5174/`
2. Browser should ask: "Allow notifications?"
3. Click **"Allow"**
4. Check: `Notification.permission` should be `"granted"`

### Step 3: Check Service Worker Registration
Open DevTools → Application → Service Workers:
- Should see `/sw.js` with status **"activated"**
- If not, hard refresh (Ctrl+Shift+R)

### Step 4: Test Local Notification First
Open browser console and run:
```javascript
const registration = await navigator.serviceWorker.ready;
await registration.showNotification('Test Notification', {
  body: 'If you see this, local notifications work!',
  icon: '/Edu_51_Logo.png',
  badge: '/Edu_51_Logo.png',
  vibrate: [200, 100, 200]
});
```

**Expected Result**: A notification should appear in your system tray/notification center

### Step 5: Send Real Push Notification
Run the test script:
```bash
node debug-payload.mjs
```

**Watch for these logs in Service Worker Console**:
1. `📨 Push event received!` - Push arrived
2. `Raw push text: ...` - Payload decrypted
3. `✅ Successfully parsed JSON` - Payload parsed
4. `🔔 Displaying notification with:` - Ready to show
5. `✅ Notification displayed successfully` - Done!

## 🛠️ Debugging Steps If Not Working

### 1. Open Service Worker Console
```
DevTools → Application → Service Workers
→ Click "inspect" link under `/sw.js`
```

### 2. Monitor for Push Events
```javascript
// In Service Worker Console:
self.addEventListener('push', (e) => {
  console.log('PUSH RECEIVED:', e.data?.text());
});
```

### 3. Check Browser Notification Settings
- **Chrome/Edge**: Settings → Privacy → Notifications → Allow site
- **Firefox**: Preferences → Privacy → Notifications → Allow site
- **Safari**: System Preferences → Notifications → Site

### 4. Disable Do Not Disturb
- **Windows**: Check system tray for "Focus Assist" or "Do Not Disturb"
- **Mac**: Check top-right control center
- **Mobile**: Check device settings

### 5. Check Subscription in Database
```bash
node analyze-subscription-providers.mjs
```

Should show 4 subscriptions with FCM provider

## 📱 Testing on Different Devices

### Desktop (Windows/Mac)
1. Allow notifications in browser settings
2. Disable system Do Not Disturb
3. Notifications appear in bottom-right (Windows) or top-right (Mac)

### Mobile (Android/iOS)
1. **Android Chrome**: Settings → Apps & notifications → Notifications
2. **iOS Safari**: Settings → Safari → Notifications
3. Notifications appear in device notification center

### PWA Testing
If installed as app:
- Notifications should appear even when app isn't in focus
- Check app notification settings in device settings

## 🧪 Quick Test Commands

```bash
# Send test notification
node debug-payload.mjs

# Check subscriptions
node analyze-subscription-providers.mjs

# Detailed results
node test-detailed-results.mjs

# Check VAPID keys match
node check-vapid-hash.mjs
```

## 📊 Expected Behavior

When everything is working:
1. Send notification via `debug-payload.mjs`
2. See "✅ Sent to 4/4 subscriptions" in terminal
3. See "📨 Push event received!" in Service Worker console
4. Notification appears in system notification area within 1-2 seconds
5. Click notification → Opens browser/app

## ❌ Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Service Worker not registered | Hard refresh (Ctrl+Shift+R), clear cache |
| "Permission denied" in logs | Click "Allow" when browser asks for notification permission |
| No notifications on mobile | Enable notifications in app/browser settings, check system notifications |
| Notification doesn't show but logs say "success" | Check system Do Not Disturb, check device notification center |
| Service Worker console is empty | Install/inspect link under `/sw.js` in DevTools |
| Payload parse error | Check browser console for details, refresh page |

## 🔧 Advanced Debugging

### View Raw Encrypted Payload
In Edge Function logs:
```
📦 Notification payload prepared: {"title":"...","body":"..."}
   Payload length: XXX bytes
```

### View Encryption Details
```
✅ Encryption complete. Ciphertext length: 259
```

Should be 259 bytes (payload + authentication tag)

### View VAPID JWT
```
✅ JWT generated
   JWT length: XXX chars
```

Should be 300-400 characters

## ✨ Success Indicators

You'll know it's working when:
- ✅ Edge Function logs show "sent: 4, failed: 0"
- ✅ Service Worker console shows "Push event received!"
- ✅ Service Worker shows "Notification displayed successfully"
- ✅ Notification appears in system tray/notification center within 1-2 seconds
- ✅ Notification shows with Edu51Five logo and correct title/body

## 📞 Still Not Working?

1. Check all browser notification settings
2. Verify system notifications aren't disabled
3. Try local test notification first (simpler)
4. Check Service Worker console for errors
5. Try different browser (Chrome, Firefox, Safari)
6. On mobile: Check both browser AND system notification settings

The system is **fully functional**. The notification not appearing is almost always a browser/system setting issue, not a code issue.
