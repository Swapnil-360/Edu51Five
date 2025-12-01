# Real-Time User Tracking Setup Guide

## ✅ What's Been Implemented:

### 1. **Database Setup** (`REALTIME-USER-TRACKING.sql`)
- Creates `active_users` table to track sessions
- Automatic cleanup of stale sessions (>2 minutes old)
- RPC function to get active user count
- Realtime subscription enabled

### 2. **Client-Side Tracking** (App.tsx)
- Tracks user sessions on student pages (home, section5, course)
- Updates presence every 30 seconds
- Automatically removes session on page leave
- Real-time subscription for admin panel

### 3. **Admin Dashboard Display** (AdminDashboard.tsx)
- Live "Online Users" card with pulsing indicator
- "LIVE" badge showing real-time status
- Updates every 10 seconds
- Visual pulse animation

## 🚀 How to Enable:

### Step 1: Run SQL Setup
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy and paste `REALTIME-USER-TRACKING.sql`
3. Click **Run**

### Step 2: Verify Setup
Check that the table was created:
```sql
SELECT * FROM active_users;
```

### Step 3: Test It!
1. Open your site in one browser (student view)
2. Open admin panel in another browser
3. Watch the "Online Users" count update in real-time! 🎉

## 📊 How It Works:

**Student Side:**
- Every user on student pages gets a unique session ID
- Session updates every 30 seconds with "heartbeat"
- Session removed when leaving page

**Admin Side:**
- Subscribes to `active_users` table changes
- Counts sessions active in last 1 minute
- Updates automatically via Realtime
- Refreshes every 10 seconds as backup

**Cleanup:**
- Stale sessions (>2 minutes) automatically deleted
- Keeps database lean and accurate

## 🔧 Configuration:

**Adjust Tracking Frequency:**
- User heartbeat: Line ~270 in App.tsx (currently 30s)
- Admin refresh: Line ~300 in App.tsx (currently 10s)
- Stale session threshold: Line 33 in SQL (currently 2 minutes)

**Track Different Pages:**
Change the page parameter in `trackUserPresence()`:
```typescript
trackUserPresence('admin') // Track admin users
trackUserPresence('exam') // Track exam dashboard users
```

## 🎯 Features:

✅ Real-time updates (no page refresh needed)
✅ Automatic cleanup of old sessions
✅ Works across multiple tabs/devices
✅ Graceful fallback if table doesn't exist
✅ Live indicator with pulse animation
✅ Minimal database impact

## 📝 Notes:

- Count represents users active in the **last 1 minute**
- Multiple tabs from same user = counted separately
- Only tracks student pages by default
- Admin panel not tracked (can be added if needed)

## 🐛 Troubleshooting:

**Count shows 0:**
- Check if SQL was run successfully
- Verify Realtime is enabled for `active_users` table
- Check browser console for errors

**Stale count (not updating):**
- Refresh admin page
- Check Supabase Realtime status
- Verify subscription is active in Network tab

---

**Need more features?**
- Track page-specific counts
- Add user demographics
- Session duration tracking
- Peak usage analytics
