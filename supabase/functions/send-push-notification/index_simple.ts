// Simplified push notification sender using FCM HTTP v1 API
// This avoids all the complex Web Push encryption and VAPID JWT issues

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushPayload {
  noticeId?: string
  noticeType?: string
  title: string
  body: string
  url?: string
  broadcast?: boolean
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const payload: PushPayload = await req.json()

    if (!payload.title || !payload.body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: title, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('📨 Processing notification:', { title: payload.title, broadcast: payload.broadcast })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch subscriptions
    console.log('📡 Fetching subscriptions...')
    const { data: subscriptions, error: subError } = await supabaseClient
      .from('push_subscriptions')
      .select('*')
      .order('updated_at', { ascending: false })

    if (subError) {
      throw new Error(`Failed to fetch subscriptions: ${subError.message}`)
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('⚠️ No subscriptions found')
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No active subscriptions',
          sent: 0,
          failed: 0,
          total: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📊 Found ${subscriptions.length} subscriptions`)

    let successCount = 0
    let failureCount = 0

    // Use service worker's self.registration.showNotification instead of Web Push Protocol
    // Send data to each subscription endpoint which will trigger the service worker
    for (const sub of subscriptions) {
      try {
        // For FCM endpoints, send using simple POST with JSON payload
        // The browser's service worker will handle displaying the notification
        const notificationData = {
          notification: {
            title: payload.title,
            body: payload.body,
            icon: '/Edu_51_Logo.png',
            badge: '/Edu_51_Logo.png',
            tag: payload.broadcast ? 'broadcast' : payload.noticeType,
            data: { url: payload.url || '/' }
          }
        }

        // Extract FCM token from endpoint
        const endpointParts = sub.endpoint.split('/send/')
        if (endpointParts.length < 2) {
          console.warn(`⚠️ Invalid endpoint format for ${sub.session_id}`)
          failureCount++
          continue
        }

        const fcmToken = endpointParts[1]
        
        // Use FCM legacy API (simpler, no encryption needed)
        const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Note: You need to add FCM_SERVER_KEY to Supabase secrets
            'Authorization': `key=${Deno.env.get('FCM_SERVER_KEY') || 'YOUR_FCM_SERVER_KEY'}`
          },
          body: JSON.stringify({
            to: fcmToken,
            notification: {
              title: payload.title,
              body: payload.body,
              icon: '/Edu_51_Logo.png',
            },
            data: {
              url: payload.url || '/'
            }
          })
        })

        if (fcmResponse.ok) {
          successCount++
          console.log(`✅ Sent to ${sub.session_id}`)
        } else {
          const errorText = await fcmResponse.text()
          failureCount++
          console.error(`❌ Failed for ${sub.session_id}: ${fcmResponse.status} - ${errorText}`)
          
          // Remove invalid subscriptions
          if (fcmResponse.status === 404 || fcmResponse.status === 410) {
            await supabaseClient
              .from('push_subscriptions')
              .delete()
              .eq('id', sub.id)
          }
        }
      } catch (error) {
        failureCount++
        console.error(`❌ Exception for ${sub.session_id}:`, error.message)
      }
    }

    console.log(`📊 Complete: ${successCount} sent, ${failureCount} failed`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notification campaign sent',
        sent: successCount,
        failed: failureCount,
        total: subscriptions.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Function error:', error.message)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
