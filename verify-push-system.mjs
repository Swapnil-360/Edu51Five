#!/usr/bin/env node

// Complete Push Notification System Verification
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

const SUPABASE_URL = envVars.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = envVars.VITE_SUPABASE_ANON_KEY;

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║     🔔 PUSH NOTIFICATION SYSTEM - VERIFICATION REPORT       ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

async function verify() {
  let allGood = true;

  // 1. Check Supabase connection
  console.log('1️⃣  Checking Supabase Connection...');
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
      }
    });
    
    if (response.ok) {
      console.log('   ✅ Supabase connection: OK\n');
    } else {
      console.log('   ❌ Supabase connection: FAILED\n');
      allGood = false;
    }
  } catch (error) {
    console.log('   ❌ Supabase connection: ERROR -', error.message, '\n');
    allGood = false;
  }

  // 2. Check subscriptions
  console.log('2️⃣  Checking Push Subscriptions...');
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/push_subscriptions?select=count`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );
    
    const data = await response.json();
    const count = data.length > 0 ? data.length : 0;
    
    if (count > 0) {
      console.log(`   ✅ Active subscriptions: ${count}\n`);
    } else {
      console.log('   ⚠️  No active subscriptions. Users need to enable notifications.\n');
      allGood = false;
    }
  } catch (error) {
    console.log('   ❌ Could not fetch subscriptions:', error.message, '\n');
    allGood = false;
  }

  // 3. Check Edge Function
  console.log('3️⃣  Checking Edge Function...');
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-push-notification`, {
      method: 'OPTIONS'
    });
    
    if (response.ok || response.status === 200 || response.status === 401) {
      console.log('   ✅ Edge Function: DEPLOYED\n');
    } else {
      console.log(`   ❌ Edge Function: NOT FOUND (${response.status})\n`);
      allGood = false;
    }
  } catch (error) {
    console.log('   ❌ Edge Function check failed:', error.message, '\n');
    allGood = false;
  }

  // 4. Test notification send
  console.log('4️⃣  Testing Notification Send...');
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-push-notification`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: '✅ System Verification Test',
        body: 'All systems operational',
        broadcast: true
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log(`   ✅ Notification sent: ${result.sent}/${result.total} subscriptions\n`);
    } else {
      console.log('   ❌ Failed to send notification:', result.error, '\n');
      allGood = false;
    }
  } catch (error) {
    console.log('   ❌ Notification send failed:', error.message, '\n');
    allGood = false;
  }

  // 5. Check VAPID keys
  console.log('5️⃣  Checking VAPID Keys...');
  const vapidPublic = envVars.VITE_VAPID_PUBLIC_KEY;
  if (vapidPublic && vapidPublic.trim().length >= 80) {
    console.log(`   ✅ VAPID Public Key: SET (${vapidPublic.trim().substring(0, 20)}...)\n`);
  } else if (vapidPublic) {
    console.log(`   ⚠️  VAPID Public Key: SET but may be truncated (${vapidPublic.length} chars)\n`);
  } else {
    console.log('   ⚠️  VAPID Public Key: Not in .env (but may be set in Supabase)\n');
  }

  // Summary
  console.log('╔════════════════════════════════════════════════════════════════╗');
  if (allGood) {
    console.log('║                  ✅ ALL SYSTEMS OPERATIONAL!                   ║');
  } else {
    console.log('║              ⚠️  SOME ISSUES DETECTED - SEE ABOVE            ║');
  }
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log('📱 NEXT STEPS:');
  console.log('1. Open http://localhost:5174/ in your browser');
  console.log('2. Allow notifications when prompted');
  console.log('3. Run: node debug-payload.mjs');
  console.log('4. Check system notification area (bottom-right Windows, top-right Mac)');
  console.log('5. Check Service Worker console in DevTools (F12)\n');

  console.log('📖 For more help, read: PUSH-NOTIFICATIONS-DEBUG-GUIDE.md\n');

  process.exit(allGood ? 0 : 1);
}

verify();
