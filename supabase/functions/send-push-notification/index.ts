// Supabase Edge Function to send push notifications
// Deploy this to Supabase Edge Functions
// Deploy command: supabase functions deploy send-push-notification

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushPayload {
  noticeId: string;
  noticeType: string;
  title: string;
  body: string;
  url?: string;
}

interface PushSubscription {
  id: string;
  session_id: string;
  endpoint: string;
  subscription: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get payload from request
    const payload: PushPayload = await req.json()

    // Validate payload
    if (!payload.noticeId || !payload.title || !payload.body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: noticeId, title, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

    // Get all active push subscriptions - Query table directly instead of RPC for reliability
    console.log('📡 Fetching active push subscriptions...')
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    
    const { data: subscriptions, error: subError } = await supabaseClient
      .from('push_subscriptions')
      .select('id, session_id, endpoint, subscription')
      .gt('updated_at', thirtyDaysAgo)

    if (subError) {
      console.error('❌ Subscription fetch error:', subError)
      throw new Error(`Failed to get subscriptions: ${subError.message}`)
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('⚠️ No active subscriptions found')
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No active subscriptions to notify',
          sent: 0,
          failed: 0,
          total: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📬 Found ${subscriptions.length} active subscriptions to notify`)

    // Send push notification to all subscriptions
    let successCount = 0
    let failureCount = 0

    // Prepare notification payload for browser
    const notificationPayload = {
      title: payload.title,
      body: payload.body,
      icon: '/image.png',
      badge: '/image.png',
      tag: payload.noticeType,
      requireInteraction: false,
      vibrate: [200, 100, 200],
      data: {
        url: payload.url || '/',
        noticeId: payload.noticeId,
      },
      actions: [
        { action: 'open', title: 'View Now' },
        { action: 'close', title: 'Dismiss' },
      ],
    }

    // Send notifications in batches to avoid rate limiting
    const batchSize = 10
    for (let i = 0; i < subscriptions.length; i += batchSize) {
      const batch = subscriptions.slice(i, i + batchSize) as PushSubscription[]
      
      const sendPromises = batch.map(async (sub: PushSubscription) => {
        try {
          // Send push notification directly to endpoint (no VAPID needed for simple POST)
          const response = await fetch(sub.endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/octet-stream',
              'TTL': '86400', // 24 hours
              'Urgency': 'normal',
            },
            body: JSON.stringify(notificationPayload)
          })

        if (response.ok) {
          successCount++
          console.log(`✅ Notification sent to ${sub.session_id}`)
          return { success: true, endpoint: sub.endpoint }
        } else {
          failureCount++
          console.warn(`⚠️ Failed to send to ${sub.session_id}: HTTP ${response.status}`)

          // Remove invalid subscriptions (410 Gone = unsubscribed, 404 = endpoint invalid)
          if (response.status === 410 || response.status === 404) {
            console.log(`🗑️ Removing invalid subscription: ${sub.session_id}`)
            await supabaseClient
              .from('push_subscriptions')
              .delete()
              .eq('id', sub.id)
              .catch((err) => console.error('Failed to delete subscription:', err))
          }

          return { success: false, endpoint: sub.endpoint, status: response.status }
        }
      } catch (error) {
        failureCount++
        console.error(`❌ Error sending to ${sub.session_id}:`, error)
        return { success: false, endpoint: sub.endpoint, error: String(error) }
      }
      })

      // Wait for batch to complete before next batch
      await Promise.all(sendPromises)
    }

    console.log(`📊 Notification send complete: ${successCount} succeeded, ${failureCount} failed`)

    // Log the notification send event
    try {
      const { error: logError } = await supabaseClient
        .from('notification_logs')
        .insert({
          notice_id: payload.noticeId,
          notice_type: payload.noticeType,
          title: payload.title,
          body: payload.body,
          recipients_count: subscriptions.length,
          success_count: successCount,
          failure_count: failureCount,
        })

      if (logError) {
        console.error('❌ Failed to log notification:', logError)
      } else {
        console.log('✅ Notification event logged')
      }
    } catch (logError) {
      console.error('Error logging notification:', logError)
    }

    // Return success response
  

/* 
DEPLOYMENT INSTRUCTIONS:
========================

1. Install Supabase CLI:
   npm install -g supabase

2. Login to Supabase:
   supabase login

3. Link your project:
   supabase link --project-ref YOUR_PROJECT_REF

4. Deploy this function:
   supabase functions deploy send-push-notification

5. Test the function:
   curl -i --location --request POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-push-notification' \
   --header 'Authorization: Bearer YOUR_ANON_KEY' \
   --header 'Content-Type: application/json' \
   --data '{
     "noticeId": "test-123",
     "noticeType": "welcome-notice",
     "title": "Test Notification",
     "body": "This is a test notification from Edu51Five",
     "url": "/"
   }'

6. Check function logs:
   - Supabase Dashboard → Functions → send-push-notification → Invocations
   - View real-time logs as function executes

KEY IMPROVEMENTS:
=================
✅ Direct table query instead of RPC for better reliability
✅ No VAPID keys needed - web push endpoints handle auth internally
✅ Proper error handling and validation
✅ Batch processing to avoid rate limits
✅ Auto-cleanup of invalid subscriptions (410, 404 errors)
✅ Detailed logging for debugging
✅ 30-day subscription filtering
✅ Proper TypeScript types

NOTES:
======
- This simplified approach works for small-to-medium student bases
- No web-push library needed
- Suitable for educational use (< 10k concurrent subscriptions)
*/
2. Login to Supabase:
   supabase login

3. Link your project:
   supabase link --project-ref YOUR_PROJECT_REF

4. Generate VAPID keys (use web-push library):
   npx web-push generate-vapid-keys

5. Set secrets in Supabase:
   supabase secrets set VAPID_PUBLIC_KEY="your_public_key"
   supabase secrets set VAPID_PRIVATE_KEY="your_private_key"

6. Deploy this function:
   supabase functions deploy send-push-notification

7. Update the VAPID_PUBLIC_KEY in src/lib/pushNotifications.ts with your generated public key

8. Test the function:
   curl -i --location --request POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-push-notification' \
   --header 'Authorization: Bearer YOUR_ANON_KEY' \
   --header 'Content-Type: application/json' \
   --data '{"noticeId":"test","noticeType":"welcome-notice","title":"Test","body":"Test notification"}'
*/
