// Test script to verify the push notification Edge Function works
// This calls the function with a test message

import fs from 'fs'
import path from 'path'

const envPath = path.join(process.cwd(), '.env')
const envContent = fs.readFileSync(envPath, 'utf-8')
const envVars = {}

envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim()
  }
})

const supabaseUrl = envVars.VITE_SUPABASE_URL
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

async function testPushNotification() {
  try {
    console.log('🧪 Testing push notification Edge Function...\n')

    const functionUrl = `${supabaseUrl}/functions/v1/send-push-notification`

    console.log('📤 Sending test notification to Edge Function...')
    console.log('   URL:', functionUrl)

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        title: '🧪 Test Notification',
        body: 'This is a test message from the Node.js script',
        broadcast: true
      })
    })

    console.log('\n📊 Response Status:', response.status, response.statusText)

    const responseText = await response.text()
    console.log('📄 Response Body:', responseText)

    if (!response.ok) {
      console.error('\n❌ Function returned an error!')
      process.exit(1)
    }

    if (!responseText) {
      console.error('\n❌ Empty response from function')
      process.exit(1)
    }

    const data = JSON.parse(responseText)

    console.log('\n✅ Edge Function Response:')
    console.log('   Success:', data.success)
    console.log('   Message:', data.message)
    console.log('   Sent:', data.sent)
    console.log('   Failed:', data.failed)
    console.log('   Total Subscribers:', data.total)

    if (data.sent > 0) {
      console.log('\n🎉 SUCCESS! Push notifications were sent to', data.sent, 'subscriber(s)!')
    } else if (data.total === 0) {
      console.log('\n⚠️ No subscribers found. Have users enabled notifications yet?')
    } else {
      console.log('\n⚠️ Subscribers exist but notifications failed to send')
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    process.exit(1)
  }
}

testPushNotification()
