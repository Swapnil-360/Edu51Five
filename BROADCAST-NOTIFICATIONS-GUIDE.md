# 📢 Broadcast Push Notifications Guide

## Overview

The Edu51Five admin panel includes a **Broadcast Push Notification** feature that sends instant notifications to all registered students who have:
1. Created an account via Sign-Up/Register
2. Provided a **Notification Email** during registration
3. Have notifications enabled

## How It Works

### Architecture

```
Admin Panel
    ↓
[Broadcast Form] → Title, Message, Optional URL
    ↓
Database Query (Supabase)
    ├─→ Get all users with notifications enabled
    └─→ Fetch email and name for each
    ↓
Email Service (Supabase Edge Function)
    ├─→ Generate HTML email template
    ├─→ Send to each student's notification email
    └─→ Track success/failure
    ↓
Report Results to Admin
    └─→ "✅ Emails: X delivered, Push: Y sent"
```

### Email System Flow

1. **Registration**: Students sign up with their `BUBT ID @cse.bubt.edu.bd` email + separate notification email
2. **Storage**: Data saved in Supabase `users` table:
   - `email` - BUBT email (account identifier)
   - `notification_email` - Where broadcasts are sent ⭐
   - `enable_notifications` - Boolean flag (default: true)
3. **Broadcast**: Admin sends notification → System queries all users with `enable_notifications = true` → Sends emails to their `notification_email` addresses

## Using the Broadcast Feature

### Step-by-Step

#### 1️⃣ **Access Admin Panel**
- Click menu → "Admin" button
- Enter password: `edu51five2025`

#### 2️⃣ **Find Broadcast Section**
- Scroll to "📢 Broadcast Push Notification" section
- You'll see a form with three fields

#### 3️⃣ **Fill the Form**

| Field | Description | Example |
|-------|-------------|---------|
| **Notification Title** | What appears in the email subject | "New CSE-319 Study Materials" |
| **Message Body** | The main content of the notification | "Check out the newly uploaded notes in the Notes section!" |
| **Open URL (optional)** | Where users are directed when they click | `/course/CSE-319` or `/` (homepage) |

#### 4️⃣ **Send**
- Click **"🚀 Send to All Subscribers"**
- System will:
  - Query Supabase for all users with notifications enabled
  - Send formatted HTML emails to each student's notification email
  - Show results: `✅ Emails: 45 delivered, Push: 12 sent, Total: 57 notifications`

### Example Broadcast

**Scenario**: New exam schedule is available

```
Title: "Final Exam Schedule Released"

Message: 
"The final exam schedule for Intake 51 has been released! 
Check the Semester Tracker for dates and times. Study hard! 💪"

URL: /  (opens homepage where users can see tracker)
```

**Result**: All 57 registered students receive an email that looks like:

```
┌─────────────────────────────────────────────────┐
│  Edu51Five Academic Portal                      │
│                                                 │
│  📢 Final Exam Schedule Released                │
│                                                 │
│  The final exam schedule for Intake 51 has      │
│  been released! Check the Semester Tracker      │
│  for dates and times. Study hard! 💪            │
│                                                 │
│  [View on Edu51Five Button]                     │
└─────────────────────────────────────────────────┘
```

## Email Template Features

The emails are professionally formatted with:
- ✅ Edu51Five branding (logo, colors)
- ✅ Subject line: `Edu51Five • [Your Title]`
- ✅ Body with footer tagline: "Stay ahead with Edu51Five."
- ✅ Call-to-action button with custom URL
- ✅ Footer with unsubscribe info (optional)
- ✅ Mobile-responsive design
- ✅ Professional typography and spacing

## Database Configuration

### Required Tables

```sql
-- users table (handles broadcasts)
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,           -- BUBT email (22235103183@cse.bubt.edu.bd)
    notification_email VARCHAR(255),               -- Where broadcasts are sent ⭐
    phone VARCHAR(20),
    major VARCHAR(50),
    enable_notifications BOOLEAN DEFAULT true,     -- Controls who receives broadcasts
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_users_notifications ON users(enable_notifications);
```

### Data Flow Diagram

```
User Registration (SignUpModal.tsx)
    ├─ BUBT Email: 22235103183@cse.bubt.edu.bd → users.email
    └─ Notification Email: personal@gmail.com → users.notification_email
                                                        ↓
                        Admin Broadcast → sendEmailToAllStudents()
                                              ↓
                        Query: SELECT email, name FROM users 
                               WHERE enable_notifications = true
                                              ↓
                        Send HTML email to users.notification_email
                                              ↓
                        Student inbox receives beautiful email ✉️
```

## Troubleshooting

### "No users found with notifications enabled"

**Cause**: No students have registered yet, or all have notifications disabled.

**Fix**:
1. Share the sign-up link: Direct students to click "Register" on homepage
2. Ensure they:
   - Enter BUBT email (22xxxxxxx@cse.bubt.edu.bd)
   - Provide a notification email (Gmail, Outlook, etc.)
   - Keep "Enable Notifications" checkbox checked

**Check registration status**:
```sql
-- In Supabase SQL Editor
SELECT COUNT(*) as total_users,
       COUNT(CASE WHEN enable_notifications = true THEN 1 END) as notifications_enabled
FROM users;
```

### Emails not being received

**Check 1**: Verify users exist in database
```sql
SELECT email, notification_email, enable_notifications 
FROM users 
LIMIT 5;
```

**Check 2**: Check browser console for errors
- Press F12 → Console tab
- Look for error messages when clicking "Send to All Subscribers"
- Common errors:
  - `Error fetching registered users` → Database query failed
  - `Email Edge Function error` → Supabase function not deployed

**Check 3**: Verify Email Edge Function is deployed
```bash
# In terminal, from project root:
supabase functions list

# Should show "send-email-notification" in list
```

**Check 4**: Test with a single user query (manually in Supabase console)
```sql
SELECT email, notification_email FROM users WHERE email = 'admin@example.com';
```

### How to opt students out of notifications

**Via Admin Panel**: (Future feature) Add toggle in user management

**Via SQL** (if needed):
```sql
UPDATE users SET enable_notifications = false WHERE email = 'student@cse.bubt.edu.bd';
```

## Email Content Best Practices

### ✅ Do
- **Keep titles short** (40-60 chars): "New Study Materials Released"
- **Include call-to-action**: "Check CSE-319 notes" not just "Update"
- **Use time-sensitive language**: "Due tomorrow!" "Just released!"
- **Emojis for visual appeal**: 📢 📚 ⏰ 💪 🎓
- **Provide actionable URL**: `/course/CSE-319` instead of just `/`

### ❌ Don't
- **Avoid generic messages**: "Hello" or "Update"
- **Don't leave message blank**: Body is required
- **Long-winded subjects**: Keep under 80 chars
- **URLs that don't exist**: Test URL paths before sending
- **All caps or multiple exclamation marks**: Looks spammy!!!

## Monitoring & Analytics

### View Broadcast History

In future versions, tracking will show:
- ✅ Total emails sent
- ✅ Success/failure rates
- ✅ User opt-in/opt-out trends
- ✅ Click-through rates (if tracking added)

### Current Workaround
Check admin panel console logs (F12 → Console):
```
📧 Sending emails to 45 registered students...
✅ Emails sent: 45, Failed: 0
```

## Integration Points

### Broadcast Feature Uses

1. **Database**: Supabase `users` table
2. **Query**: `sendEmailToAllStudents()` in `emailNotifications.ts`
3. **Email**: Supabase Edge Function `send-email-notification`
4. **Template**: Professional HTML with branding
5. **UI**: Admin panel "Broadcast Push Notification" section

### Related Features

- **User Registration**: [SignUpModal.tsx](src/components/SignUpModal.tsx) - Collects notification email
- **Email System**: [emailNotifications.ts](src/lib/emailNotifications.ts) - Manages all email logic
- **Edge Function**: [supabase/functions/send-email-notification/](supabase/functions/send-email-notification/) - Sends emails
- **Admin Panel**: [App.tsx Lines 1733-1800](src/App.tsx#L1733) - Broadcast handler

## Setup Checklist

- [ ] Supabase project created with `users` table
- [ ] `users` table has columns: `email`, `notification_email`, `enable_notifications`
- [ ] Edge Function `send-email-notification` deployed to Supabase
- [ ] Students registered with sign-up form
- [ ] At least one student has `enable_notifications = true`
- [ ] Admin can access admin panel with password
- [ ] Test broadcast sent successfully
- [ ] Emails received in student inboxes

## FAQ

**Q: Can I send to specific majors only?**
A: Not yet. Current system broadcasts to ALL students. Future enhancement could add filters by major/course.

**Q: Can students opt out?**
A: Yes. They can uncheck "Enable Notifications" during registration. You can also disable from admin via SQL.

**Q: How often can I broadcast?**
A: As often as needed. There's no rate limiting. (Consider adding practical limits like max 3/day to avoid spam)

**Q: Do broadcasts go to every email, or just notification email?**
A: Only the `notification_email` address. BUBT email (`email` field) is for account login only.

**Q: What if the Edge Function fails?**
A: System returns "Email queued for delivery" anyway. In production, emails will be sent once the function is properly configured with an SMTP provider.

**Q: How do I verify broadcasts worked?**
A: 
1. Check admin alert message for count
2. Ask students if they received emails
3. Check browser console (F12) for logs
4. Query database: `SELECT COUNT(*) FROM users WHERE enable_notifications = true;`

## Production Deployment

When moving to production, ensure:

1. **Email Service Configured**:
   - Edge Function uses SendGrid, Resend, or similar
   - SMTP credentials set in environment variables
   - API keys secured

2. **Database Security**:
   - Row-level security (RLS) policies configured
   - Only admins can query user data
   - Student data encrypted in transit

3. **Email Deliverability**:
   - Domain SPF/DKIM/DMARC configured
   - Unsubscribe links functional
   - Email list hygiene maintained

4. **Notifications Monitoring**:
   - Track delivery rates
   - Monitor bounce/failure rates
   - Log all broadcasts for audit trail

---

**Version**: 1.0  
**Last Updated**: December 12, 2025  
**Maintainer**: Edu51Five Admin System
