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
  noticeType: string; // 'welcome-notice' or 'exam-routine-notice'
  title: string;
  body: string;
  url?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get payload from request
    const payload: PushPayload = await req.json()
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all active push subscriptions
    const { data: subscriptions, error: subError } = await supabaseClient
      .rpc('get_active_push_subscriptions')

    if (subError) {
      throw new Error(`Failed to get subscriptions: ${subError.message}`)
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No active subscriptions found')
      return new Response(
        JSON.stringify({ success: true, message: 'No active subscriptions', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${subscriptions.length} active subscriptions`)

    // VAPID keys (set these in your Supabase Edge Function secrets)
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error('VAPID keys not configured')
    }

    // Send push notification to all subscriptions
    let successCount = 0
    let failureCount = 0

    const notificationData = {
      title: payload.title,
      body: payload.body,
      url: payload.url || '/',
      noticeId: payload.noticeId,
      tag: payload.noticeType
    }

    // Use web-push library to send notifications
    // Note: You'll need to import and use the web-push library
    // For now, this is a placeholder showing the structure
    const sendPromises = subscriptions.map(async (sub: any) => {
      try {
        // Send push notification using Web Push Protocol
        const response = await fetch(sub.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'TTL': '86400', // 24 hours
            'Urgency': 'normal',
            'Authorization': `vapid t=${generateVAPIDToken(vapidPublicKey, vapidPrivateKey, sub.endpoint)}, k=${vapidPublicKey}`
          },
          body: JSON.stringify(notificationData)
        })

        if (response.ok) {
          successCount++
          return { success: true, endpoint: sub.endpoint }
        } else {
          failureCount++
          console.error(`Failed to send to ${sub.endpoint}: ${response.status}`)
          
          // If subscription is invalid (410 Gone), remove it
          if (response.status === 410) {
            await supabaseClient
              .from('push_subscriptions')
              .delete()
              .eq('endpoint', sub.endpoint)
          }
          
          return { success: false, endpoint: sub.endpoint, status: response.status }
        }
      } catch (error) {
        failureCount++
        console.error(`Error sending to ${sub.endpoint}:`, error)
        return { success: false, endpoint: sub.endpoint, error: String(error) }
      }
    })

    await Promise.all(sendPromises)

    // Log the notification send
    await supabaseClient.rpc('log_notification_send', {
      p_notice_id: payload.noticeId,
      p_notice_type: payload.noticeType,
      p_title: payload.title,
      p_body: payload.body,
      p_recipients_count: subscriptions.length,
      p_success_count: successCount,
      p_failure_count: failureCount
    })

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failureCount,
        total: subscriptions.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: String(error) }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Helper function to generate VAPID authorization token
function generateVAPIDToken(publicKey: string, privateKey: string, endpoint: string): string {
  // This is a simplified placeholder
  // In production, use a proper JWT library to generate VAPID tokens
  // See: https://github.com/web-push-libs/web-push
  
  // For now, return a placeholder token
  // You'll need to implement proper VAPID token generation
  return 'PLACEHOLDER_TOKEN'
}

/* 
DEPLOYMENT INSTRUCTIONS:
========================

1. Install Supabase CLI:
   npm install -g supabase

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
