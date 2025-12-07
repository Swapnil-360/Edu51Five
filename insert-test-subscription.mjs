// Script to insert test push subscription into Supabase
// This helps verify the push notification system works

// Read .env file manually
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
  console.error('❌ Missing Supabase credentials in .env')
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? 'found' : 'missing')
  console.error('   VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'found' : 'missing')
  process.exit(1)
}

async function insertTestSubscription() {
  try {
    console.log('📝 Inserting test push subscription...')
    console.log('   Supabase URL:', supabaseUrl)

    const testSubscription = {
      endpoint: `https://fcm.googleapis.com/fcm/send/test-endpoint-${Math.random().toString(36).substring(7)}`,
      expirationTime: null,
      keys: {
        p256dh: 'BCVxsr7qy8WImMJV3wC_CvL3MWs59WVxCj2Qs8wMa5Rl1aQKEYvXBKLlrBqAvYqsj2OWE6YEzVIL_dGOaLMU2Ko',
        auth: 'OPnuIJ2EfZ7cgvg3hgXDZA'
      }
    }

    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/push_subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        session_id: `test-session-${Date.now()}`,
        subscription: testSubscription,
        endpoint: testSubscription.endpoint,
        updated_at: new Date().toISOString()
      })
    })

    if (!insertResponse.ok) {
      const errorText = await insertResponse.text()
      throw new Error(`Insert failed (${insertResponse.status}): ${errorText}`)
    }

    const text = await insertResponse.text()
    console.log('Response text:', text)
    
    if (!text) {
      console.log('Empty response - subscription may have been inserted but RLS policies prevented SELECT')
      // Try to fetch to verify
    } else {
      const data = JSON.parse(text)
      console.log('✅ Test subscription inserted successfully!')
      console.log('   Session ID:', data[0]?.session_id)
      console.log('   Endpoint:', data[0]?.endpoint.substring(0, 60) + '...')
    }

    // Now show all subscriptions
    const fetchResponse = await fetch(
      `${supabaseUrl}/rest/v1/push_subscriptions?select=id,session_id,endpoint,updated_at&order=updated_at.desc&limit=5`,
      {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    )

    if (!fetchResponse.ok) {
      const errorText = await fetchResponse.text()
      throw new Error(`Fetch failed (${fetchResponse.status}): ${errorText}`)
    }

    const allSubs = await fetchResponse.json()

    console.log(`\n📊 Total subscriptions in database: ${allSubs.length}`)
    allSubs.forEach((sub, idx) => {
      console.log(`   ${idx + 1}. ${sub.session_id} - ${sub.endpoint.substring(0, 50)}...`)
    })

    console.log('\n✨ Now try sending a broadcast notification from the admin panel!')
  } catch (error) {
    console.error('❌ Script error:', error.message)
    process.exit(1)
  }
}

insertTestSubscription()
