# Push Notification Setup Guide

## Overview
Admin can now send broadcast push notifications to all users who have enabled notifications.

## Features Added
1. **Broadcast Push Notification Card** in Admin Dashboard
   - Input fields for Title, Message Body, and URL
   - Send button to trigger notifications
   - Theme-aware design (light/dark mode support)

2. **Edge Function Support** for broadcast mode
   - Updated `send-push-notification` Edge Function
   - Supports both notice-based and broadcast notifications
   - Uses web-push library with VAPID authentication

## Deployment Steps

### 1. Generate VAPID Keys (if not done already)
```bash
npx web-push generate-vapid-keys
```

This will output:
```
Public Key: BFx...abc
Private Key: dGV...xyz
```

### 2. Set Supabase Edge Function Secrets
```bash
# Navigate to your project directory
cd d:/Edu51Five

# Set VAPID keys as secrets
supabase secrets set VAPID_PUBLIC_KEY="your_public_key_here"
supabase secrets set VAPID_PRIVATE_KEY="your_private_key_here"
```

### 3. Deploy Edge Function
```bash
supabase functions deploy send-push-notification
```

### 4. Update Public VAPID Key in Frontend
Update `/d:/Edu51Five/src/lib/pushNotifications.ts`:
```typescript
const publicVapidKey = 'BFx...abc'; // Your VAPID public key
```

### 5. Test Database Schema
Ensure `push_subscriptions` table exists in Supabase:
```sql
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT UNIQUE NOT NULL,
  endpoint TEXT NOT NULL,
  subscription JSONB NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_push_subscriptions_session ON push_subscriptions(session_id);
CREATE INDEX idx_push_subscriptions_updated ON push_subscriptions(updated_at);
```

## Usage

### Admin Workflow
1. Login to Admin Dashboard (`edu51five2025`)
2. Scroll to "Broadcast Push Notification" section
3. Fill in:
   - **Notification Title**: e.g., "New Study Material Uploaded"
   - **Message Body**: e.g., "Check out the new CSE-319 notes in the Notes section!"
   - **Open URL** (optional): e.g., `/course/CSE-319` or `/`
4. Click "🚀 Send to All Subscribers"
5. System sends push notification to all users with notifications enabled

### Student Experience
1. User must enable notifications (bell icon in header)
2. Browser requests permission
3. When admin sends broadcast:
   - User receives browser notification
   - Clicking notification opens the specified URL

## Edge Function API

### Endpoint
`POST https://your-project.supabase.co/functions/v1/send-push-notification`

### Request Body (Broadcast Mode)
```json
{
  "title": "New Material Uploaded",
  "body": "CSE-319 notes are now available!",
  "url": "/course/CSE-319",
  "broadcast": true
}
```

### Request Body (Notice Mode)
```json
{
  "noticeId": "notice-123",
  "noticeType": "exam",
  "title": "Exam Schedule Update",
  "body": "Mid-term exams start Sep 14",
  "url": "/"
}
```

### Response
```json
{
  "success": true,
  "message": "Push notifications sent",
  "sent": 42,
  "failed": 0,
  "total": 42
}
```

## Troubleshooting

### No notifications received
- Check browser notification permissions
- Verify VAPID keys are set correctly
- Check Edge Function logs: `supabase functions logs send-push-notification`
- Ensure users have subscribed (check `push_subscriptions` table)

### "VAPID keys not configured" error
- Set secrets: `supabase secrets set VAPID_PUBLIC_KEY=...`
- Redeploy function after setting secrets

### Subscriptions not saving
- Check network tab for `savePushSubscription` calls
- Verify Supabase URL and keys in `.env`
- Check `push_subscriptions` table exists

## Files Modified
- `src/App.tsx`: Added broadcast UI and handler
- `supabase/functions/send-push-notification/index.ts`: Added broadcast support
- This guide: `PUSH-NOTIFICATION-GUIDE.md`

## Security Notes
- VAPID private key must remain secret (never commit to git)
- Edge Function uses service role key (has full database access)
- Subscriptions are device-specific (identified by session_id)
- Expired subscriptions (HTTP 410) are automatically cleaned up

## Next Steps
- [ ] Deploy Edge Function with VAPID keys
- [ ] Test broadcast from admin dashboard
- [ ] Monitor Edge Function logs
- [ ] Add analytics tracking for notification engagement
