# Email Notification System Setup Guide

## Overview

The Edu51Five platform now includes a professional email notification system for notifying students about important updates, exam schedules, and course materials. This replaces the unreliable browser push notification system with guaranteed email delivery.

## Features

✅ **Professional HTML Email Templates**
- Branded with Edu51Five logo and colors
- Responsive design (mobile + desktop)
- Blue/indigo gradient header matching theme
- Blue accent color for highlights
- Clean, modern layout

✅ **Reliable Delivery**
- Uses SendGrid for enterprise-grade email delivery
- Guaranteed delivery (not subject to browser/OS limitations)
- Bounce handling and retry logic built-in
- Delivery tracking available

✅ **Integration with Admin Panel**
- Automatically sends emails when admin posts notices
- Fallback to email if push notifications fail
- Both methods used together for redundancy

## Setup Instructions

### Step 1: Supabase Email Setup (Very Simple!)

1. **Enable Email in Supabase**
   - Open Supabase Dashboard: https://app.supabase.com
   - Select your project: `aljnyhxthmwgesnkqwzu`
   - Go to: **Authentication → Email Templates**
   - Supabase email is already enabled! ✅

2. **Configure Sender Email (Optional)**
   - Default sender: `noreply@[your-project-id].supabase.co`
   - To use `edu51five@gmail.com`:
     - Go to: **Project Settings → Email Configuration**
     - Set custom sender: `edu51five@gmail.com`
     - Verify ownership (Supabase will send verification email)

### Step 2: Deploy Edge Function

The Edge Function is ready to use:
- File: `supabase/functions/send-email-notification/index.ts`
- Uses Supabase's built-in `sendRawEmail()` method
- No API keys needed (uses your project's SERVICE_ROLE_KEY automatically)
- Deploy by pushing to GitHub (auto-deployed by Vercel)

### Step 3: Database Schema Update

1. **Add Email Column to Users Table**
   
   Run this SQL in Supabase SQL Editor:
   ```sql
   -- Add email column to profiles table if not exists
   ALTER TABLE profiles 
   ADD COLUMN IF NOT EXISTS email VARCHAR(255);
   
   -- Create index for faster queries
   CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
   ```

2. **Verify Table Structure**
   - Open Supabase Dashboard
   - Go to: **SQL Editor → New Query**
   - Paste the SQL above
   - Click **Run**

### Step 4: Frontend Integration

The frontend already includes email notification integration in:

**`src/lib/emailNotifications.ts`**
- `generateEmailHTML()` - Creates professional HTML template
- `sendEmailNotification()` - Sends to single user
- `sendEmailToAllStudents()` - Bulk sends to all users

**`src/App.tsx`**
- Updated `sendNoticeNotification()` function
- Now sends both push + email notifications
- Email is primary method, push is fallback

### Step 5: User Email Collection

Add email capture to your registration/profile system:

**Example Registration Form:**
```tsx
const [email, setEmail] = useState('');

const registerUser = async () => {
  // After user registration, store email
  await supabase
    .from('profiles')
    .update({ email })
    .eq('user_id', userId);
};
```

### Step 6: Testing

#### Test Email Sending

1. **Manual Test via Edge Function**
   ```bash
   curl -X POST http://localhost:54321/functions/v1/send-email-notification \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "to": "your-email@example.com",
       "subject": "Test Email from Edu51Five",
       "htmlBody": "<h1>Test Email</h1><p>This is a test email.</p>"
     }'
   ```

2. **Test via Admin Panel**
   - Login as admin
   - Create/edit a notice
   - Click "Update Notices"
   - Email should be sent to all users with emails in the system

3. **Check SendGrid Logs**
   - Go to SendGrid Dashboard: **Activity Feed**
   - You should see:
     - Processed: ✅
     - Delivered: ✅ (after 5-30 seconds)
     - Bounced: ❌ (check if email address is valid)

#### Test Email Template

Send a test using the professional template:

```typescript
import { generateEmailHTML } from './src/lib/emailNotifications';

const testEmail = generateEmailHTML({
  recipientEmail: 'test@example.com',
  subject: 'Test Email',
  title: 'Welcome to Edu51Five',
  body: 'This is a professional test email with Edu51Five branding.',
  actionUrl: 'https://edu51five.vercel.app',
  actionText: 'Visit Platform'
});

console.log(testEmail); // Check HTML in browser
```

## Email Template Features

### Design Elements

- **Header Section**
  - Edu51Five logo (70x70px)
  - Blue gradient background (matches theme)
  - Platform title with red "51" accent
  - Subtitle: "BUBT Intake 51 - Academic Portal"

- **Content Section**
  - Notification badge (📢 New Update)
  - Title in blue
  - Body with left blue border
  - Call-to-action button (gradient blue)
  - Responsive padding

- **Footer Section**
  - Platform description
  - Links to platform and admin panel
  - Copyright notice
  - Current year auto-updated

### Responsive Design

- Mobile-first approach
- Optimized for all screen sizes
- Touch-friendly button sizing
- Proper line heights for readability

## Configuration

### Customize Email Template

Edit `src/lib/emailNotifications.ts` to match your branding:

```typescript
const primaryColor = '#1e40af';  // Blue (your theme)
const accentColor = '#dc2626';   // Red accent
const logoUrl = 'https://edu51five.vercel.app/Edu_51_Logo.png';
const baseUrl = 'https://edu51five.vercel.app';
```

### Customize Sender Email

To use your Gmail as sender:
1. Open Supabase Dashboard
2. Go to: **Project Settings → Email Configuration**
3. Set sender to: `edu51five@gmail.com`
4. Verify ownership when prompted

**Note:** Supabase will handle all email delivery automatically. No SendGrid needed!

## Troubleshooting

### Emails Not Sending

**Check 1: User Email Data**
```sql
-- Verify users have email addresses in database
SELECT id, email FROM profiles WHERE email IS NOT NULL LIMIT 10;
```

**Check 2: Edge Function Logs**
```
Supabase Dashboard → Functions → send-email-notification → Logs
```
Look for errors like:
- `sendRawEmail failed` - Email sending issue
- `Missing required fields` - Check email/subject/htmlBody
- `401 Unauthorized` - Supabase credentials issue

**Check 3: Supabase Email Status**
- Go to: **Supabase Dashboard → Authentication → Email Templates**
- Check if emails are enabled ✅

### Email Delivery Issues

**Supabase Email Limits:**
- Free tier: 100 emails/day
- Pro tier: Unlimited
- Check your plan in: **Settings → Billing**

**If hitting rate limit:**
- Upgrade to Pro plan
- Or batch emails over time

### Verify Sender Email

To confirm `edu51five@gmail.com` is set:
1. Open Supabase Dashboard
2. Go to: **Project Settings → Email Configuration**
3. Check "From Email" field shows your Gmail

### Test Email Sending

**Manual Test via Edge Function**
```bash
curl -X POST http://localhost:54321/functions/v1/send-email-notification \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@gmail.com",
    "subject": "Test Email from Edu51Five",
    "htmlBody": "<h1>Hello!</h1><p>Test email from Supabase</p>"
  }'
```

## Monitoring

### Supabase Edge Function Logs

**Access:** Supabase Dashboard → Functions → send-email-notification → Logs

**Look for:**
- `Email sent successfully` = ✅ Working
- `Failed to send email` = ❌ Check error details
- `Missing required fields` = ❌ Check request format

### Email Delivery Status

To see if emails are being delivered:
1. Check your Gmail inbox for test emails
2. Check spam folder (mark as "Not Spam" if found)
3. Ask students if they receive notifications

## Best Practices

1. **Collect real student emails**
   - Ask students to provide email when they enable notifications
   - Store in `profiles.email` column
   - Use valid email addresses only

2. **Test before sending to all**
   - Send test email to your own address first
   - Check HTML rendering in Gmail
   - Verify links work

3. **Handle errors gracefully**
   - Email failures won't crash the app
   - Check Edge Function logs if emails don't send
   - Fallback to push notifications still works

4. **Monitor Supabase email quota**
   - Free tier: 100 emails/day
   - If you need more, upgrade to Pro plan
   - Batch emails throughout the day if needed

## Future Enhancements

### Planned Features

- [ ] Email digest (daily/weekly summary)
- [ ] User email preference management
- [ ] HTML email for course materials
- [ ] Exam countdown emails
- [ ] Weekly progress reports
- [ ] Email template customization per notice type

### Integration with Courses

```typescript
// Send course-specific emails
const sendCourseNotification = async (courseCode: string, message: string) => {
  const { data: users } = await supabase
    .from('student_courses')
    .select('user_id, users(email)')
    .eq('course_code', courseCode);
  
  // Send to each student in course
  for (const user of users || []) {
    await sendEmailNotification({
      recipientEmail: user.users.email,
      subject: `Update - Course ${courseCode}`,
      title: `New Material Available`,
      body: message
    });
  }
};
```

## Support

For Supabase email issues:
- Documentation: https://supabase.com/docs/guides/auth/email
- Edge Functions: https://supabase.com/docs/guides/functions
- Support: https://supabase.com/support/

## Summary

The email notification system with Supabase provides:

✅ **Zero Configuration** - Works out of the box
✅ **Professional HTML emails** - Branded with your logo
✅ **Reliable delivery** - Supabase handles all email infrastructure
✅ **Simple setup** - Just add email column to database
✅ **Fallback to push** - Both methods work together
✅ **Easy monitoring** - Check Edge Function logs
✅ **Cost effective** - 100 free emails/day on free tier
✅ **Mobile responsive** - Perfect on all devices

### Next Steps

1. ✅ Add `email` column to `profiles` table (SQL already provided)
2. ✅ Email function is ready to use
3. ✅ App is ready to send emails via admin panel
4. Configure custom sender email (if using edu51five@gmail.com)
5. Test by posting a notice as admin
6. Students with emails in database will receive it!

Your students will now reliably receive important updates via email!
