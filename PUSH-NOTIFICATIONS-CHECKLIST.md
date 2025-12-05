# Push Notifications Setup Checklist

## Quick Summary
**Status:** ⚠️ Partially Complete
- ✅ Frontend code: Ready (notification trigger added for file uploads)
- ✅ Database schema: Ready (tables exist in setup file)
- ⚠️ **PENDING: Supabase Edge Function** - Must create `send-push-notification`
- ⚠️ **PENDING: Run database setup SQL**

---

## What Needs to Be Done in Supabase

### 1. Run Database Setup SQL (5 minutes)
**File:** `PUSH-NOTIFICATIONS-SETUP.sql`
1. Open Supabase SQL Editor
2. Copy entire content of `PUSH-NOTIFICATIONS-SETUP.sql`
3. Click **Run**
4. Verify tables created: `push_subscriptions`, `notification_logs`

**Status:** ◻️ Not Done Yet

---

### 2. Create Edge Function (10 minutes)
**Function Name:** `send-push-notification`
**Purpose:** Sends browser push notifications to all subscribed devices when admin uploads files

**Steps:**
1. Supabase Dashboard → **Functions** → **Create New Function**
2. Name: `send-push-notification`
3. Copy code from `SUPABASE-NOTIFICATION-SETUP.md` Section 3a
4. Click **Deploy**
5. Verify function URL appears and is accessible

**Status:** ◻️ Not Done Yet

---

### 3. Verify Materials Table (2 minutes)
**Check if `exam_period` column exists**
1. Go to **Database** → **Tables** → **materials**
2. Look for column: `exam_period`

**If NOT present:**
- Run SQL from `SUPABASE-NOTIFICATION-SETUP.md` Section 2

**Status:** ◻️ Check Required

---

### 4. Enable Realtime (Optional, 2 minutes)
**Purpose:** Live monitoring and instant updates

1. **Database** → **Publications** → **supabase_realtime**
2. Enable:
   - `push_subscriptions`
   - `notification_logs`
   - `materials`

**Status:** ◻️ Optional but Recommended

---

## How It Works (After Setup)

```
1. User opens app → clicks Bell icon → Enables Notifications
   └─→ Browser push subscription created
   └─→ Saved to push_subscriptions table

2. Admin uploads new file
   └─→ File uploaded to Supabase Storage
   └─→ Record inserted to materials table
   └─→ App calls sendNoticeNotification()
   └─→ Calls Edge Function: send-push-notification
   └─→ Function fetches all subscriptions from DB
   └─→ Sends HTTP POST to each browser endpoint
   └─→ Service Worker receives push event
   └─→ Shows browser notification with icon + vibration
   └─→ Logged to notification_logs table
```

---

## Testing Steps

### Before Setup (Current State)
```
Admin: Upload file ✅
Student: Enable notifications ✅
System: Triggers notification code ✅
Issue: Edge Function doesn't exist ❌
Result: Error in console, no push sent ❌
```

### After Complete Setup
```
Admin: Upload file ✅
Student: Enable notifications ✅
System: Triggers notification code ✅
Edge Function: Receives request ✅
Edge Function: Fetches subscriptions ✅
Browser: Receives push ✅
Browser: Shows notification ✅
Logged: Recorded in notification_logs ✅
```

---

## Files to Review

| File | Purpose | Status |
|------|---------|--------|
| `PUSH-NOTIFICATIONS-SETUP.sql` | Database schema & functions | ✅ Ready to run |
| `SUPABASE-NOTIFICATION-SETUP.md` | Complete setup guide | ✅ Complete |
| `src/App.tsx` | Frontend trigger logic | ✅ Updated |
| `src/lib/pushNotifications.ts` | Browser API utilities | ✅ Complete |
| `public/sw.js` | Service Worker | ✅ Complete |

---

## Common Issues After Setup

| Issue | Solution |
|-------|----------|
| "Failed to invoke function" | Edge Function not deployed yet |
| "No subscriptions found" | Users haven't enabled notifications |
| "Permission denied" | RLS policies preventing access - run setup SQL |
| "Invalid endpoint" | Old subscriptions - auto-cleaned after 30 days |

---

## Next Steps

1. ⏳ **Go to Supabase Dashboard**
2. ⏳ **Run the SQL setup from `PUSH-NOTIFICATIONS-SETUP.sql`**
3. ⏳ **Create the Edge Function** (see guide)
4. ⏳ **Deploy and test**
5. ✅ **Done! Notifications will work**

---

**Estimated total time:** ~20-30 minutes
**Difficulty:** Easy (copy-paste + clicks)
