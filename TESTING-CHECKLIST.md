# 🧪 Quick Testing Checklist

Before committing, test these features:

## ✅ Pre-Deployment Testing (Local)

### 1. Service Worker Registration
- [ ] Open browser DevTools Console
- [ ] Navigate to `http://localhost:5174`
- [ ] Look for: "Service Worker registered"
- [ ] Go to DevTools > Application > Service Workers
- [ ] Verify `sw.js` is active

### 2. Check Code Compilation
```powershell
npm run build
```
- [ ] No TypeScript errors
- [ ] No build errors
- [ ] Check dist/ folder created

### 3. Check Files Created
- [ ] `public/sw.js` exists
- [ ] `src/lib/pushNotifications.ts` exists
- [ ] `PUSH-NOTIFICATIONS-SETUP.sql` exists
- [ ] `supabase/functions/send-push-notification/index.ts` exists
- [ ] `PUSH-NOTIFICATIONS-GUIDE.md` exists

### 4. Dev Server Test
```powershell
npm run dev
```
- [ ] Server starts without errors
- [ ] Navigate to student page
- [ ] Check console for push notification initialization message
- [ ] No JavaScript errors in console

### 5. Admin Panel Test
- [ ] Login as admin (password: edu51five2025)
- [ ] Click "Create Notice"
- [ ] Fill in notice details
- [ ] Submit form
- [ ] Verify success message includes "Push notifications sent"
- [ ] Check console for notification send confirmation

---

## 🔧 Database Setup (Do Before Full Testing)

### Step 1: Generate VAPID Keys
```powershell
npx web-push generate-vapid-keys
```
**Save the output!**

### Step 2: Update Frontend Code
Open `src/lib/pushNotifications.ts`, line 7:
```typescript
const VAPID_PUBLIC_KEY = 'YOUR_GENERATED_PUBLIC_KEY_HERE';
```

### Step 3: Run Database Script
1. Go to Supabase Dashboard
2. SQL Editor > New Query
3. Paste contents of `PUSH-NOTIFICATIONS-SETUP.sql`
4. Click Run
5. Verify tables created:
   ```sql
   SELECT * FROM push_subscriptions;
   SELECT * FROM notification_logs;
   ```

### Step 4: Deploy Edge Function
```powershell
# Link project
supabase link --project-ref aljnyhxthmwgesnkqwzu

# Set secrets
supabase secrets set VAPID_PUBLIC_KEY="your_public_key"
supabase secrets set VAPID_PRIVATE_KEY="your_private_key"

# Deploy
supabase functions deploy send-push-notification
```

---

## 🧪 Full Feature Testing

### Test 1: Manual Notification (Browser Only)
Open browser console and run:
```javascript
navigator.serviceWorker.ready.then(reg => {
  reg.showNotification('Test', {
    body: 'Testing notifications',
    icon: '/cover.jpg'
  });
});
```
**Expected:** Notification appears on screen

---

### Test 2: Permission Request
In browser console:
```javascript
Notification.requestPermission().then(p => console.log('Permission:', p));
```
**Expected:** Browser shows permission prompt

---

### Test 3: Check Subscription
In browser console:
```javascript
navigator.serviceWorker.ready.then(reg =>
  reg.pushManager.getSubscription().then(sub => 
    console.log('Subscribed:', sub !== null)
  )
);
```
**Expected:** `Subscribed: true` if user allowed notifications

---

### Test 4: Database Subscription Check
Run in Supabase SQL Editor:
```sql
SELECT 
  session_id,
  endpoint,
  created_at,
  updated_at
FROM push_subscriptions
ORDER BY created_at DESC;
```
**Expected:** At least one row if you're subscribed

---

### Test 5: Full Flow (Admin → User)
1. **Student Device:**
   - Open website
   - Allow notifications when prompted
   - Keep browser open or close it

2. **Admin Device:**
   - Login to admin panel
   - Click "Create Notice"
   - Fill in:
     - Title: "Test Push Notification"
     - Content: "This is a test"
     - Type: Info
   - Click Submit

3. **Check Student Device:**
   - Should receive notification
   - Click notification
   - Should open website

4. **Verify in Database:**
   ```sql
   SELECT * FROM notification_logs 
   ORDER BY sent_at DESC LIMIT 1;
   ```
   Should show the notification you just sent.

---

## 🚨 Common Issues to Check

### Issue: Service Worker Not Registering
**Check:**
- [ ] File exists: `public/sw.js`
- [ ] No syntax errors in `sw.js`
- [ ] Browser supports service workers (Chrome, Firefox, Edge - all modern versions)

**Fix:** Check browser console for specific error message

---

### Issue: No Notification Permission Prompt
**Check:**
- [ ] Browser notifications not blocked
- [ ] Running on localhost or HTTPS
- [ ] `Notification` API available in browser

**Test:**
```javascript
console.log('Notification' in window); // Should be true
```

---

### Issue: "VAPID_PUBLIC_KEY" Error
**Check:**
- [ ] VAPID keys generated
- [ ] Public key updated in `pushNotifications.ts`
- [ ] No typos in key (starts with "BN" or "BP")

---

### Issue: Edge Function Not Found (404)
**Check:**
- [ ] Function deployed: `supabase functions list`
- [ ] Project linked correctly
- [ ] Using correct project URL

**Deploy again:**
```powershell
supabase functions deploy send-push-notification
```

---

### Issue: Database Table Not Found
**Check:**
- [ ] SQL script executed successfully
- [ ] No errors in SQL Editor
- [ ] Tables visible in Supabase Dashboard > Table Editor

**Verify:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('push_subscriptions', 'notification_logs');
```
Should return 2 rows.

---

## 📱 Mobile Testing (After Vercel Deploy)

### iOS Safari
- [ ] Open website
- [ ] Allow notifications
- [ ] Add to Home Screen (optional)
- [ ] Lock phone
- [ ] Create notice from admin
- [ ] Check notification appears on lock screen

### Android Chrome
- [ ] Open website
- [ ] Allow notifications
- [ ] Close browser
- [ ] Create notice from admin
- [ ] Check notification appears in notification tray

---

## ✅ Ready to Commit Checklist

- [ ] All files created successfully
- [ ] No TypeScript errors (`npm run build`)
- [ ] Dev server runs without errors (`npm run dev`)
- [ ] Service worker registers in browser
- [ ] Console shows "Push notifications initialized"
- [ ] VAPID keys generated (saved securely)
- [ ] Database script ready to run
- [ ] Edge function code ready to deploy
- [ ] Documentation complete

---

## 🎯 What Happens After Commit

1. **Push to GitHub:** All code synced
2. **Vercel Auto-Deploy:** New version deployed automatically
3. **HTTPS Active:** Push notifications work in production
4. **You Still Need To:**
   - [ ] Update VAPID public key in code
   - [ ] Run database SQL script
   - [ ] Deploy Edge Function
   - [ ] Test on production URL

---

## 📝 Testing Log Template

Use this to track your testing:

```
Date: ___________
Tested By: ___________

✅ Service Worker: [ ] Pass [ ] Fail
   Notes: _________________________________

✅ Permission Prompt: [ ] Pass [ ] Fail
   Notes: _________________________________

✅ Subscription: [ ] Pass [ ] Fail
   Notes: _________________________________

✅ Database Save: [ ] Pass [ ] Fail
   Notes: _________________________________

✅ Notice Creation: [ ] Pass [ ] Fail
   Notes: _________________________________

✅ Notification Received: [ ] Pass [ ] Fail
   Notes: _________________________________

✅ Click to Open: [ ] Pass [ ] Fail
   Notes: _________________________________

Overall Status: [ ] Ready to Deploy [ ] Needs Fixes
```

---

## 🚀 After Testing Successfully

1. **Review Changes:**
   ```powershell
   git status
   git diff
   ```

2. **Stage Changes:**
   ```powershell
   git add .
   ```

3. **Commit:**
   ```powershell
   git commit -m "Add browser push notifications system

   - Service worker for push notification handling
   - Push notification subscription management
   - Database schema for subscriptions and logs
   - Edge function to send notifications to all subscribers
   - Auto-send notifications when admin creates notices
   - Complete setup guide and documentation"
   ```

4. **Push:**
   ```powershell
   git push origin main
   ```

5. **Deploy Backend:**
   - Update VAPID public key
   - Run database script
   - Deploy Edge Function
   - Test on production

---

**Current Status:** 🟡 Code ready, waiting for your testing confirmation!
