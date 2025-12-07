// Quick check of what's in the subscription data structure

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

async function checkSubscriptionStructure() {
  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/push_subscriptions?select=*&limit=1`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      }
    )

    const subs = await response.json()
    
    if (subs.length > 0) {
      console.log('Sample subscription from database:')
      console.log(JSON.stringify(subs[0], null, 2))
      
      console.log('\nChecking structure:')
      console.log('- Has subscription field:', !!subs[0].subscription)
      console.log('- Has keys:', !!subs[0].subscription?.keys)
      console.log('- Has p256dh:', !!subs[0].subscription?.keys?.p256dh)
      console.log('- Has auth:', !!subs[0].subscription?.keys?.auth)
      
      if (subs[0].subscription?.keys) {
        console.log('\nKeys structure:')
        console.log('- p256dh length:', subs[0].subscription.keys.p256dh?.length || 0)
        console.log('- auth length:', subs[0].subscription.keys.auth?.length || 0)
      }
    }
  } catch (error) {
    console.error('Error:', error.message)
  }
}

checkSubscriptionStructure()
