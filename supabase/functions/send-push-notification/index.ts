// Supabase Edge Function to send push notifications
// Deploy this to Supabase Edge Functions
// Deploy command: supabase functions deploy send-push-notification

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { encrypt, uint8ArrayToBase64Url, base64UrlToUint8Array } from './webpush-encrypt.ts'
import { generateVapidAuthToken } from './vapid-jwt-jose.ts'

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
  broadcast?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
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

    // Validate payload
    if (!payload.title || !payload.body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: title, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('📨 Processing notification request:', { title: payload.title, broadcast: payload.broadcast })

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
    const vapidEmail = Deno.env.get('VAPID_EMAIL') || 'mailto:admin@example.com'

    // Validate environment variables
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase env vars')
      throw new Error('Missing Supabase environment variables')
    }

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('❌ Missing VAPID keys:', { hasPublic: !!vapidPublicKey, hasPrivate: !!vapidPrivateKey })
      throw new Error('Missing VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY in Supabase secrets')
    }

    console.log('✅ Environment variables validated')

    // Initialize Supabase client
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch active subscriptions
    console.log('📡 Fetching push subscriptions...')
    
    const { data: subscriptions, error: subError } = await supabaseClient
      .from('push_subscriptions')
      .select('id, session_id, endpoint, subscription, updated_at')
      .order('updated_at', { ascending: false })

    if (subError) {
      console.error('❌ Database error:', subError.message)
      throw new Error(`Failed to fetch subscriptions: ${subError.message}`)
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('⚠️ No active subscriptions found')
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

    console.log(`📊 Found ${subscriptions.length} active subscriptions`)
    
    // Log first subscription structure for debugging
    if (subscriptions.length > 0) {
      console.log('Sample subscription structure:', JSON.stringify(subscriptions[0], null, 2))
    }

    let successCount = 0
    let failureCount = 0
    const results: Array<{session_id: string, status: string, error?: string}> = []

    // Prepare notification payload - MUST be valid JSON that service worker can parse
    // The Web Push encryption will handle the encryption, this is just the content
    const notificationPayload = JSON.stringify({
      title: payload.title || 'Edu51Five',
      body: payload.body || 'New notification',
      icon: '/Edu_51_Logo.png',
      badge: '/Edu_51_Logo.png',
      tag: payload.broadcast ? 'broadcast' : payload.noticeType || 'notification',
      url: payload.url || '/',
      noticeId: payload.noticeId || null
    })

    console.log('📦 Notification payload prepared:', notificationPayload.substring(0, 100) + '...')
    console.log('   Payload length:', notificationPayload.length, 'bytes')

    // Send to each subscription with proper Web Push encryption
    for (const sub of subscriptions) {
      try {
        console.log(`\n📤 Processing ${sub.session_id}...`)
        
        const userPublicKey = sub.subscription?.keys?.p256dh
        const userAuth = sub.subscription?.keys?.auth

        console.log(`   Keys present: p256dh=${!!userPublicKey}, auth=${!!userAuth}`)

        if (!userPublicKey || !userAuth) {
          console.warn(`⚠️ Missing encryption keys for ${sub.session_id}`)
          failureCount++
          continue
        }

        console.log(`   p256dh length: ${userPublicKey.length}`)
        console.log(`   auth length: ${userAuth.length}`)
        console.log(`   Endpoint: ${sub.endpoint.substring(0, 60)}...`)

        // Encrypt the payload
        console.log(`   🔐 Starting encryption...`)
        const encrypted = await encrypt(userPublicKey, userAuth, notificationPayload)
        console.log(`   ✅ Encryption complete. Ciphertext length: ${encrypted.ciphertext.length}`)

        // Generate VAPID JWT for authorization
        const url = new URL(sub.endpoint)
        const audience = `${url.protocol}//${url.hostname}`
        
        console.log(`   🔑 Generating VAPID JWT...`)
        const vapidJwt = await generateVapidAuthToken(audience, vapidEmail, vapidPrivateKey, vapidPublicKey)
        console.log(`   ✅ JWT generated`)

        // Send encrypted notification to FCM
        console.log(`   📡 Sending to FCM...`)
        const response = await fetch(sub.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Encoding': 'aesgcm',
            'Encryption': `salt=${uint8ArrayToBase64Url(encrypted.salt)}`,
            'Crypto-Key': `dh=${uint8ArrayToBase64Url(encrypted.serverPublicKey)};p256ecdsa=${vapidPublicKey}`,
            'Authorization': `vapid t=${vapidJwt}, k=${vapidPublicKey}`,
            'TTL': '86400'
          },
          body: encrypted.ciphertext
        })

        console.log(`   📊 FCM Response: ${response.status} ${response.statusText}`)

        if (response.ok || response.status === 201) {
          successCount++
          console.log(`   ✅ SUCCESS for ${sub.session_id}`)
          results.push({ session_id: sub.session_id, status: 'success' })
        } else if (response.status === 410 || response.status === 404) {
          failureCount++
          console.log(`   🗑️ Expired subscription, removing ${sub.session_id}`)
          results.push({ session_id: sub.session_id, status: 'expired', error: `${response.status}: ${response.statusText}` })
          await supabaseClient
            .from('push_subscriptions')
            .delete()
            .eq('id', sub.id)
        } else {
          failureCount++
          const errorBody = await response.text()
          console.error(`   ❌ FAILED for ${sub.session_id}`)
          console.error(`   Status: ${response.status}`)
          console.error(`   Error body: ${errorBody}`)
          results.push({ session_id: sub.session_id, status: 'failed', error: `${response.status}: ${errorBody}` })
        }
      } catch (error: any) {
        failureCount++
        console.error(`   ❌ EXCEPTION for ${sub.session_id}`)
        console.error(`   Error: ${error.message}`)
        console.error(`   Stack: ${error.stack}`)
        results.push({ session_id: sub.session_id, status: 'error', error: error.message })
      }
    }

    console.log(`📊 Send complete: ${successCount} succeeded, ${failureCount} failed`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notification campaign sent',
        sent: successCount,
        failed: failureCount,
        total: subscriptions.length,
        results: results
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
