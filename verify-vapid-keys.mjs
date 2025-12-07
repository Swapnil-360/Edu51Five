// Verify VAPID keys match between frontend and backend

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

console.log('🔑 VAPID Key Verification\n')
console.log('Frontend (from .env):')
console.log('  VITE_VAPID_PUBLIC_KEY:', envVars.VITE_VAPID_PUBLIC_KEY?.substring(0, 20) + '...')

console.log('\nBackend Supabase Secrets:')
console.log('  Run this command to check:')
console.log('  npx supabase secrets list --project-ref aljnyhxthmwgesnkqwzu')
console.log('\n  Look for: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL')

console.log('\n⚠️ IMPORTANT: The VAPID_PUBLIC_KEY in Supabase MUST match VITE_VAPID_PUBLIC_KEY')
console.log('   If they don\'t match, notifications will fail with 403 Forbidden')

console.log('\n📝 Current frontend public key:')
console.log('  ', envVars.VITE_VAPID_PUBLIC_KEY)
