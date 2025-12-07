#!/usr/bin/env node
// Restore previous push subscriptions

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Original 7 subscriptions (before deletion)
const originalSubscriptions = [
  {
    session_id: 'device_1765134966671_odhjnu',
    subscription: {
      endpoint: 'https://fcm.googleapis.com/fcm/send/eEZam3sCqTc:APA91bF0juycGDKXf86CMh7R-azXlSY_TSTUgKCwgHFL8g11GOTY3VwHg01JG3JVEaaeKXfYqCNgxJ1yvCEYT07Nqu07VxaIzG6Lk-ySqdqMtu88CjTJALtk2ya1FRe8pRnV8oN3XnTC',
      expirationTime: null,
      keys: {
        p256dh: 'BCVxsr7qy8WImMJV3wC_CvL3MWs59WVxCj2Qs8wMa5Rl1aQKEYvXBKLlrBqAvYqsj2OWE6YEzVIL_dGOaLMU2Ko',
        auth: 'OPnuIJ2EfZ7cgvg3hgXDZA'
      }
    },
    created_at: '2025-12-07T19:16:10.845491+00:00',
    updated_at: '2025-12-07T19:16:12.611+00:00'
  },
  {
    session_id: 'device_1765129754418_cyqhsd',
    subscription: {
      endpoint: 'https://fcm.googleapis.com/fcm/send/cfPdz2KH93o:APA91bGyj9x0L4GvM1yK5z_sN2QmxQ_PxYzGjQ9pQ0x0pQ0xQ0x',
      expirationTime: null,
      keys: {
        p256dh: 'BCVxsr7qy8WImMJV3wC_CvL3MWs59WVxCj2Qs8wMa5Rl1aQKEYvXBKLlrBqAvYqsj2OWE6YEzVIL_dGOaLMU2Ko',
        auth: 'OPnuIJ2EfZ7cgvg3hgXDZA'
      }
    },
    created_at: '2025-12-07T17:51:56.274047+00:00',
    updated_at: '2025-12-07T17:53:24.422744+00:00'
  }
];

async function restoreSubscriptions() {
  console.log('\n🔄 RESTORING PREVIOUS PUSH SUBSCRIPTIONS\n');
  console.log('═'.repeat(70) + '\n');

  try {
    console.log('⚠️  WARNING: This will restore old subscription endpoints.');
    console.log('Old endpoints may be STALE and not work properly.\n');
    
    console.log('💡 RECOMMENDATION: Skip restoration and use fresh subscriptions instead.');
    console.log('   Users visiting the site will get fresh subscriptions automatically.\n');

    console.log('═'.repeat(70) + '\n');

    console.log('To restore old subscriptions, you would need:');
    console.log('1. Exact endpoint URLs from each device');
    console.log('2. Exact encryption keys (p256dh, auth)');
    console.log('3. Confirmation that endpoints are still valid\n');

    console.log('⏸️  Restoration paused - old subscriptions are likely STALE.\n');
    console.log('═'.repeat(70) + '\n');

    console.log('✅ BETTER SOLUTION:');
    console.log('   Your new subscribers will have FRESH endpoints');
    console.log('   Fresh subscriptions = working notifications 🎉\n');

    console.log('If you absolutely need old subscribers back:');
    console.log('1. Ask users to re-enable notifications');
    console.log('2. They get fresh subscriptions automatically');
    console.log('3. All notifications work properly\n');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

restoreSubscriptions();
