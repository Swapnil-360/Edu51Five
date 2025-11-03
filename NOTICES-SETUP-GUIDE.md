# 🔔 Notices System Setup Guide

## Quick Start: Enable Notices Sync Across All Devices

### Problem
Notices are only showing 2 old notices and not syncing across devices.

### Solution
The notices need to be stored in **Supabase Database** instead of just localStorage.

---

## ✅ Step 1: Run the SQL Setup

1. **Go to Supabase Console**
   - Login to https://supabase.com
   - Select your Edu51Five project
   - Go to **SQL Editor**

2. **Create New Query**
   - Click "New Query"
   - Copy-paste the entire content from `NOTICES-TABLE-SETUP.sql`
   - Click "Run" (blue button)

3. **Verify Success**
   - You should see:
     ```
     "Notices table setup complete!"
     total_notices: 1
     active_notices: 1
     ```

---

## 📝 How to Use

### For Admins (Add/Edit/Delete Notices)

1. **Open Admin Panel**
   - Click "Admin Logout" button (if already logged in)
   - Or click "Admin" button → enter password: `edu51five2025`

2. **Go to Notice Management**
   - Find the "📌 Notice Management" section
   - Click "Add Notice" button

3. **Fill the Form**
   - **Title**: Notice title (e.g., "Important Announcement")
   - **Content**: Notice details
   - **Type**: info / warning / success / error
   - **Category**: exam / event / academic / announcement
   - **Priority**: low / normal / high
   - **Active**: Toggle on/off

4. **Save Notice**
   - Click "Create Notice" button
   - Notice is **instantly saved to database** and appears in all devices

5. **Delete Notice**
   - Click the red trash icon next to the notice
   - Confirm deletion
   - Notice is removed from database and all devices

### For Users (View Notices)

1. **Click Bell Icon** 🔔 in top right corner
2. **See All Active Notices**
   - Up to 5 most recent notices
   - Includes regular notices, emergency alerts, and emergency links
3. **Notices auto-refresh every 30 seconds**

---

## 🔄 How Syncing Works

### Flow Diagram:
```
Admin Creates Notice
    ↓
Saved to Supabase Database
    ↓
Broadcast to all active tabs/devices
    ↓
User Panel Shows Notice Instantly
```

### Timeline:
- **Same Tab**: Instant (same-window custom event)
- **Different Tab**: Within 1 second (storage event)
- **Different Device**: Instant (database sync)
- **Auto-Refresh**: Every 30 seconds (fallback)

---

## 📊 Database Schema

```sql
Table: notices
├── id (TEXT) - Unique identifier
├── title (TEXT) - Notice title
├── content (TEXT) - Notice content
├── type (TEXT) - info/warning/success/error
├── category (TEXT) - exam/event/academic/announcement
├── priority (TEXT) - low/normal/high
├── exam_type (TEXT) - midterm/final (optional)
├── event_date (TEXT) - Date string (optional)
├── is_active (BOOLEAN) - Active/Inactive status
├── created_at (TIMESTAMP) - Creation time
└── updated_at (TIMESTAMP) - Last update time
```

---

## 🚀 Features

✅ **Add unlimited notices** (displays up to 5 most recent)
✅ **Delete notices** with confirmation
✅ **Edit notices** (coming soon with modal)
✅ **Real-time sync** across all devices
✅ **Instant updates** in user notification panel
✅ **Offline support** with localStorage fallback
✅ **Dark mode support** for all notices

---

## ⚠️ Troubleshooting

### Issue: Still showing only 2 old notices

**Solution:**
1. Verify Supabase table was created:
   ```sql
   SELECT COUNT(*) FROM notices;
   ```
   Should return: `1` (or more if you added notices)

2. Check browser console for errors:
   - Open DevTools (F12)
   - Go to Console tab
   - Look for red errors about "notices" table

3. Clear localStorage and refresh:
   - Open DevTools (F12)
   - Go to Application → LocalStorage
   - Delete `edu51five_notices` entry
   - Refresh page

### Issue: Notice not saving to database

**Solution:**
1. Check Supabase API keys are correct in `.env`
2. Verify RLS policies are enabled (should allow all operations)
3. Check Supabase project status (not in maintenance mode)

### Issue: Notices not syncing to other device

**Solution:**
1. Wait 30 seconds for auto-refresh
2. Or manually refresh the page
3. Check both devices are accessing the same Supabase project

---

## 📱 Testing Multi-Device Sync

1. **Open Two Browser Windows**
   - Window A: Admin panel with Add Notice form
   - Window B: User notification panel (bell icon)

2. **Test Add Notice**
   - In Window A: Click "Add Notice"
   - Fill form and click "Create Notice"
   - In Window B: Should see new notice within 1 second

3. **Test Delete Notice**
   - In Window A: Click red trash icon on any notice
   - Confirm deletion
   - In Window B: Notice should disappear within 1 second

4. **Test Different Device**
   - Open on phone/tablet/different computer
   - Log in to same Edu51Five instance
   - Should see same notices within 30 seconds

---

## 🔗 Related Files

- `src/App.tsx` - Notice management logic
- `src/components/Admin/AdminDashboard.tsx` - Admin UI
- `NOTICES-TABLE-SETUP.sql` - Database setup

---

**Last Updated:** November 3, 2025
**Status:** ✅ Ready for Production
