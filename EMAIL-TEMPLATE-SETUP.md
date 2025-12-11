# Supabase Email Template Configuration

## How to Add Custom Confirmation Email

### Step 1: Access Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project: `aljnyhxthmwgesnkqwzu`
3. Navigate to **Authentication** → **Email Templates**

### Step 2: Configure Confirmation Email
1. Click on **"Confirm signup"** template
2. Copy the HTML content from `email-templates/confirm-signup.html`
3. Paste it into the template editor

### Step 3: Template Variables
The template uses Supabase variables that will be automatically replaced:
- `{{ .ConfirmationURL }}` - Auto-generated confirmation link
- `{{ .Email }}` - User's email (optional, not used in current template)
- `{{ .Token }}` - Confirmation token (optional)
- `{{ .TokenHash }}` - Token hash (optional)

### Step 4: Subject Line
Update the email subject to:
```
Welcome to Edu51Five - Confirm Your Email 🎓
```

### Step 5: Test the Email
1. Create a new test account from your app
2. Check the email inbox for the new styled confirmation
3. Verify the button and link work correctly

### Step 6: Customize Further (Optional)
You can customize:
- **Colors**: Change the gradient colors in the header and button
- **Logo**: Replace the text logo with an actual image:
  ```html
  <img src="https://your-domain.com/logo.png" alt="Edu51Five" style="width: 150px;">
  ```
- **Features List**: Modify the bullet points to match your latest features
- **Footer Links**: Add social media links or additional contact info

## Other Email Templates

You can also customize these templates in the same way:

### 1. Magic Link Email
Template for passwordless login (if you enable it later)

### 2. Change Email Address
When users update their email

### 3. Reset Password
Password recovery emails

## Email Service Configuration

Current setup uses Supabase's default email service. For production:

### Option 1: Custom SMTP (Recommended)
1. Go to **Project Settings** → **Auth** → **SMTP Settings**
2. Configure with services like:
   - **SendGrid**
   - **Mailgun**
   - **AWS SES**
   - **Gmail** (for testing only)

### Option 2: Upgrade Supabase Plan
Pro plan includes:
- Custom domain for emails
- Higher email limits
- Better deliverability

## Testing Tips

1. **Use Temp Email Services**: Test with services like temp-mail.org before sending to real users
2. **Check Spam Folder**: Ensure emails don't land in spam
3. **Mobile Testing**: Preview on mobile devices (Gmail app, Outlook app)
4. **Dark Mode**: Test appearance in dark mode email clients

## Current Email Configuration

**From Name**: Edu51Five  
**From Email**: noreply@mail.app.supabase.io (default)  
**Rate Limit**: 4 emails/hour (free tier)

For production deployment, consider:
- Custom domain email (yourname@edu51five.com)
- Increased rate limits
- SPF/DKIM/DMARC records for better deliverability

## Troubleshooting

### Email Not Received
1. Check spam folder
2. Verify email rate limits not exceeded
3. Check Supabase dashboard logs
4. Ensure email confirmation is enabled

### Styling Issues
1. Test in multiple email clients
2. Use inline CSS (email clients don't support external stylesheets)
3. Use tables for layout (email-safe approach)
4. Avoid advanced CSS (flexbox, grid)

### Link Not Working
1. Verify redirect URLs configured in Supabase:
   - `http://localhost:5173`
   - `https://edu51five.vercel.app`
2. Check token expiry settings
3. Test confirmation URL manually

## Next Steps

After configuring the confirmation email:
1. Create templates for password reset
2. Add magic link template (optional)
3. Set up custom SMTP for production
4. Monitor email delivery rates
