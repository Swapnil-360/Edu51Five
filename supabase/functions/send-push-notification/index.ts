// Supabase Edge Function to send push notifications
// Deploy this to Supabase Edge Functions
// Deploy command: supabase functions deploy send-push-notification

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import webpush from 'npm:web-push'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushPayload {
  noticeId?: string;
  noticeType?: string;
  title: string;
  body: string;
  url?: string;
  broadcast?: boolean; // Flag for admin broadcast messages
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
    if (!payload.title || !payload.body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: title, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // For non-broadcast mode, noticeId is required
    if (!payload.broadcast && !payload.noticeId) {
      return new Response(
        JSON.stringify({ error: 'noticeId required for non-broadcast notifications' }),
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

    // Configure VAPID for Web Push
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error('Missing VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY in environment')
    }

    webpush.setVapidDetails('mailto:admin@example.com', vapidPublicKey, vapidPrivateKey)

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
      // Use branded logo for both icon and badge so notifications look consistent across OS trays
      icon: '/Edu_51_Logo.png',
      badge: '/Edu_51_Logo.png',
      tag: payload.broadcast ? 'broadcast' : payload.noticeType,
      requireInteraction: false,
      vibrate: [200, 100, 200],
      data: {
        url: payload.url || '/',
        noticeId: payload.noticeId || null,
        broadcast: payload.broadcast || false,
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
          // Send push via Web Push protocol (encrypted, VAPID-signed)
          await webpush.sendNotification(sub.subscription, JSON.stringify(notificationPayload))
          successCount++
          console.log(`✅ Notification sent to ${sub.session_id}`)
          return { success: true, endpoint: sub.endpoint }
        } catch (error: any) {
          failureCount++
          const status = error?.statusCode
          console.warn(`⚠️ Failed to send to ${sub.session_id}: ${status ?? error}`)

          // Remove invalid subscriptions (410 Gone = unsubscribed, 404 = endpoint invalid)
          if (status === 410 || status === 404) {
            console.log(`🗑️ Removing invalid subscription: ${sub.session_id}`)
            await supabaseClient
              .from('push_subscriptions')
              .delete()
              .eq('id', sub.id)
              .catch((err) => console.error('Failed to delete subscription:', err))
          }

          return { success: false, endpoint: sub.endpoint, status }
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
     return new Response(
      JSON.stringify({
        success: true,
        message: 'Push notifications sent',
        sent: successCount,
        failed: failureCount,
        total: subscriptions.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     )

    } catch (error) {
     console.error('❌ Function error:', error)
     return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
     )
    }
  })

  /*
  DEPLOYMENT (CLI):
  1) supabase login
  2) supabase link --project-ref YOUR_PROJECT_REF
  3) supabase functions deploy send-push-notification

  TEST (curl):
  curl -i --location --request POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-push-notification' \
    --header 'Authorization: Bearer YOUR_ANON_KEY' \
    --header 'Content-Type': 'application/json' \
    --data '{"noticeId":"test-123","noticeType":"welcome-notice","title":"Test","body":"Hello","url":"/"}'
  */
