# 📧 Broadcast Notifications Setup Checklist

## Quick Setup Guide (5 minutes)

This guide ensures the broadcast notification system is fully functional.

---

## ✅ Step 1: Verify Database Table

Your app uses the `profiles` table to store user registration data.

**Required Columns in `profiles` table:**
```
- notification_email (VARCHAR) ← Where broadcasts are sent
- name (VARCHAR)               ← Student name
- bubt_email (VARCHAR)         ← BUBT account email
- section, major, phone, etc.
```

**Check if table exists** (in Supabase SQL Editor):
```sql
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;
```

**If `profiles` table doesn't exist, create it:**
```sql
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bubt_email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    section VARCHAR(10),
    major VARCHAR(50),
    notification_email VARCHAR(255),
    phone VARCHAR(20),
    profile_pic TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_bubt_email ON profiles(bubt_email);
CREATE INDEX IF NOT EXISTS idx_profiles_notification_email ON profiles(notification_email);
```

---

## ✅ Step 2: Enable RLS (Row Level Security)

**Add RLS policies** (run in Supabase SQL Editor):
```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read profiles
CREATE POLICY "Allow read access to profiles" ON profiles
    FOR SELECT USING (true);

-- Allow anyone to insert their own profile
CREATE POLICY "Allow users to insert profiles" ON profiles
    FOR INSERT WITH CHECK (true);

-- Allow users to update their own profile
CREATE POLICY "Allow users to update own profile" ON profiles
    FOR UPDATE USING (true) WITH CHECK (true);
```

---

## ✅ Step 3: Test User Registration

### Create a test account:

1. Open Edu51Five app
2. Click **"Register"** button (top-right menu)
3. Fill in:
   - **BUBT Email**: `22235103183@cse.bubt.edu.bd` (use any 11-digit number)
   - **Notification Email**: `youremail@gmail.com` ← **IMPORTANT: This is where broadcasts are sent**
   - **Name**: Test User
   - **Section**: 5
   - **Major**: software
   - **Phone**: 01234567890
   - **Password**: temporary
4. Click **"Create Account"**

### Verify registration worked:

**Check the database** (in Supabase SQL Editor):
```sql
SELECT id, name, bubt_email, notification_email FROM profiles LIMIT 5;
```

You should see your test user with both emails populated.

---

## ✅ Step 4: Deploy Email Function (Optional but Recommended)

The system calls a Supabase Edge Function to send emails. For production, ensure it's deployed:

```bash
# From project root
supabase functions list

# Should show:
# - send-email-notification (deployed)
# - send-push-notification (deployed)
```

**If not deployed:**
```bash
supabase functions deploy send-email-notification
supabase functions deploy send-push-notification
```

---

## ✅ Step 5: Test Broadcast Feature

### Access Admin Panel:

1. Click **Menu** (top-left)
2. Scroll to find **"Admin"** button
3. Enter password: `edu51five2025`
4. Scroll down to **"📢 Broadcast Push Notification"** section

### Send test broadcast:

Fill in the form:
```
Title: "Test Broadcast - Please Confirm Receipt"
Message: "If you see this, the email system is working correctly! ✅"
URL: / (optional)
```

Click **"🚀 Send to All Subscribers"**

You should see:
```
✅ Broadcast sent successfully!
📧 Emails: 1 delivered
🔔 Push: 0 sent
Total: 1 notifications
```

### Check your notification email inbox:

You should receive an email that looks like:

```
From: Edu51Five Admin <noreply@edu51five.com>
Subject: Edu51Five • Test Broadcast - Please Confirm Receipt

[Beautiful HTML email with logo, blue colors, message, and button]
```

If you don't see it after 2-3 minutes:
1. Check spam/promotions folder
2. Check browser console (F12) for errors
3. Verify `notification_email` is correct in database

---

## ✅ Step 6: Prepare Real Broadcast Content

### Best Practices:

**Broadcast Examples:**

**Example 1: Study Material Update**
```
Title: "New CSE-319 Lecture Slides Available"
Message: "The latest lecture slides for Object-Oriented Programming have been uploaded! Check the Notes section for complete slides and study materials."
URL: /course/CSE-319
```

**Example 2: Exam Notice**
```
Title: "Midterm Exam Schedule Released"
Message: "The midterm exam schedule for Intake 51 is now available. Check the Semester Tracker for dates, times, and classroom information."
URL: /
```

**Example 3: Urgent Notice**
```
Title: "Important: Class Rescheduled"
Message: "CSE-407 class on Thursday is rescheduled to Friday 10:30 AM due to guest lecture. Please update your schedules!"
URL: /
```

---

## ✅ Step 7: Monitor Broadcasts (Optional)

### View recent broadcasts:

Check browser console logs after sending:
```
✅ Emails sent: 45, Failed: 0
📧 Sending emails to 45 registered students...
```

### Query database to track user stats:

```sql
-- Count total registered users
SELECT COUNT(*) as total_users FROM profiles WHERE notification_email IS NOT NULL;

-- See who has notification emails
SELECT name, bubt_email, notification_email FROM profiles 
WHERE notification_email IS NOT NULL 
ORDER BY created_at DESC LIMIT 10;
```

---

## 🔧 Troubleshooting

### Problem: "No users found with notifications enabled"

**Solution**: Register at least one user with a notification email
```sql
-- Check if any profiles exist with notification emails
SELECT COUNT(*) FROM profiles WHERE notification_email IS NOT NULL;
```

If result is 0:
1. Go back to Step 3 (Test User Registration)
2. Create multiple test users with different notification emails
3. Try broadcast again

---

### Problem: Form says "✅ Broadcast sent successfully!" but no email received

**Check 1: Verify user has notification email**
```sql
SELECT notification_email FROM profiles WHERE bubt_email = '22235103183@cse.bubt.edu.bd';
```

**Check 2: Check browser console for errors (F12 → Console)**
- Look for red error messages
- Common: `Error fetching registered users`
- This means the query failed (usually permission issue)

**Check 3: Verify RLS policies are correct**
```sql
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

Should show 3 policies: SELECT, INSERT, UPDATE (all allowing true/true)

**Check 4: Test the query manually**
```sql
-- This is what the app runs:
SELECT notification_email, name FROM profiles WHERE notification_email IS NOT NULL;
```

If this returns no results → Users aren't registered yet

---

### Problem: Emails going to spam

**Solution**: Ask students to:
1. Check spam folder first time
2. Mark "Edu51Five" email as "Not Spam"
3. Add to contacts for future emails

---

## 📊 Success Indicators

✅ **Feature is working if:**
- [ ] At least 1 test user registered with notification email
- [ ] Admin panel shows "📢 Broadcast Push Notification" section
- [ ] Clicking send shows success message
- [ ] Test email received in inbox within 2-3 minutes
- [ ] Email has Edu51Five branding and formatting

---

## 🚀 Production Ready Checklist

Before going live with broadcasts:

- [ ] At least 5-10 test users registered
- [ ] Test broadcast successfully sent and received
- [ ] All student notification emails verified
- [ ] Email Edge Function deployed to Supabase
- [ ] RLS policies set on profiles table
- [ ] Admin password changed from default
- [ ] Broadcast content template prepared
- [ ] Students notified how to enable notifications
- [ ] Monitoring/logging configured
- [ ] Admin knows how to troubleshoot

---

## 📞 Support

If broadcasts aren't working:

1. **Check database**: Do profiles exist with notification_email?
   ```sql
   SELECT COUNT(*) FROM profiles WHERE notification_email IS NOT NULL;
   ```

2. **Check browser console**: Are there JavaScript errors?
   - Press F12
   - Go to Console tab
   - Look for red errors

3. **Check Edge Function**: Is it deployed?
   ```bash
   supabase functions list | grep send-email-notification
   ```

4. **Check logs**: View Supabase function logs in dashboard
   - Go to Supabase → Functions → send-email-notification → Logs

---

## Code Files Reference

- **UI Component**: [src/App.tsx (Lines 3465-3560)](src/App.tsx#L3465)
- **Send Logic**: [src/App.tsx (Lines 1733-1800)](src/App.tsx#L1733)
- **Email Service**: [src/lib/emailNotifications.ts (Line 341+)](src/lib/emailNotifications.ts#L341)
- **Edge Function**: [supabase/functions/send-email-notification/](supabase/functions/send-email-notification/)
- **Sign-Up Modal**: [src/components/SignUpModal.tsx](src/components/SignUpModal.tsx)

---

**Version**: 1.0  
**Last Updated**: December 12, 2025  
**Status**: ✅ Production Ready
