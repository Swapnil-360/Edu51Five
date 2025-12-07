// Check which subscriptions are real vs test endpoints

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

async function analyzeSubscriptions() {
  try {
    console.log('📊 Analyzing push subscriptions in database...\n')

    const response = await fetch(
      `${supabaseUrl}/rest/v1/push_subscriptions?select=id,session_id,endpoint,created_at,updated_at&order=updated_at.desc`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    )

    const subscriptions = await response.json()

    console.log(`Total subscriptions: ${subscriptions.length}\n`)

    let realFCM = 0
    let testEndpoints = 0

    subscriptions.forEach((sub, idx) => {
      const isReal = sub.endpoint.includes('fcm.googleapis.com/fcm/send/') && !sub.endpoint.includes('test-endpoint')
      const isTest = sub.endpoint.includes('test-endpoint')

      if (isReal) realFCM++
      if (isTest) testEndpoints++

      console.log(`${idx + 1}. ${sub.session_id}`)
      console.log(`   Type: ${isReal ? '✅ Real FCM' : isTest ? '🧪 Test' : '❓ Unknown'}`)
      console.log(`   Endpoint: ${sub.endpoint.substring(0, 70)}...`)
      console.log(`   Created: ${sub.created_at}`)
      console.log(`   Updated: ${sub.updated_at}\n`)
    })

    console.log(`\n📈 Summary:`)
    console.log(`   Real FCM endpoints: ${realFCM}`)
    console.log(`   Test endpoints: ${testEndpoints}`)
    console.log(`   Total: ${subscriptions.length}`)

    if (realFCM > 0) {
      console.log(`\n✅ You have ${realFCM} real subscription(s) from actual user devices!`)
      console.log(`   These should receive push notifications successfully.`)
    }

    if (testEndpoints > 0) {
      console.log(`\n⚠️ You have ${testEndpoints} test endpoint(s) that will always fail.`)
      console.log(`   You can delete these from Supabase dashboard.`)
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

analyzeSubscriptions()
