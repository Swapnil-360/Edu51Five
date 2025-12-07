// Delete test subscriptions from the database

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

async function cleanupTestSubscriptions() {
  try {
    console.log('🧹 Cleaning up test subscriptions...\n')

    // Get all subscriptions
    const getAllResponse = await fetch(
      `${supabaseUrl}/rest/v1/push_subscriptions?select=id,session_id,endpoint`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    )

    const allSubs = await getAllResponse.json()
    console.log(`📊 Total subscriptions before cleanup: ${allSubs.length}`)

    const testSubs = allSubs.filter(sub => sub.endpoint.includes('test-endpoint'))
    const realSubs = allSubs.filter(sub => !sub.endpoint.includes('test-endpoint'))

    console.log(`   Test subscriptions: ${testSubs.length}`)
    console.log(`   Real subscriptions: ${realSubs.length}\n`)

    if (testSubs.length === 0) {
      console.log('✅ No test subscriptions to delete!')
      return
    }

    // Delete test subscriptions
    console.log(`🗑️ Deleting ${testSubs.length} test subscription(s)...`)

    for (const sub of testSubs) {
      const deleteResponse = await fetch(
        `${supabaseUrl}/rest/v1/push_subscriptions?id=eq.${sub.id}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        }
      )

      if (deleteResponse.ok || deleteResponse.status === 204) {
        console.log(`   ✅ Deleted: ${sub.session_id}`)
      } else {
        console.log(`   ❌ Failed to delete: ${sub.session_id}`)
      }
    }

    // Verify cleanup
    const verifyResponse = await fetch(
      `${supabaseUrl}/rest/v1/push_subscriptions?select=id,session_id,endpoint`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    )

    const remainingSubs = await verifyResponse.json()
    console.log(`\n✅ Cleanup complete!`)
    console.log(`   Remaining subscriptions: ${remainingSubs.length}`)
    console.log(`   All should be real user devices.\n`)

    // List remaining
    console.log('📱 Remaining subscriptions:')
    remainingSubs.forEach((sub, idx) => {
      console.log(`   ${idx + 1}. ${sub.session_id}`)
      console.log(`      ${sub.endpoint.substring(0, 70)}...`)
    })

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

cleanupTestSubscriptions()
