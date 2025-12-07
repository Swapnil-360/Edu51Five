#!/usr/bin/env node
// Trigger a test notification and check if Service Worker receives it in real-time

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

async function triggerTestAndMonitor() {
  console.log('\n🔬 PUSH NOTIFICATION TEST & SERVICE WORKER MONITORING\n');
  console.log('═'.repeat(70) + '\n');

  console.log('📋 INSTRUCTIONS:\n');
  console.log('1. BEFORE running this script:');
  console.log('   ✅ Open your app in browser');
  console.log('   ✅ Go to STUDENT VIEW (not admin dashboard)');
  console.log('   ✅ Enable notifications via Bell icon');
  console.log('   ✅ Open DevTools (F12)');
  console.log('   ✅ Go to: Application → Service Workers');
  console.log('   ✅ Open "Inspect" window for Service Worker\n');

  console.log('2. Run this script (start typing "node trigger-and-monitor.mjs")\n');

  console.log('3. WATCH THE CONSOLE:\n');
  console.log('   Look for these logs in Service Worker console:');
  console.log('   ════════════════════════════════════════════');
  console.log('   📨 [SW] Push event received');
  console.log('   📨 [SW] Event has data: true');
  console.log('   📨 [SW] Got text, length: XXX');
  console.log('   📨 [SW] Parsed JSON, keys: title,body,url');
  console.log('   📨 [SW] Ready to show: { title: "...", body: "..." }');
  console.log('   📨 [SW] Calling showNotification...');
  console.log('   📨 [SW] ✅ Notification shown!');
  console.log('   ════════════════════════════════════════════\n');

  console.log('═'.repeat(70));
  console.log('\n🚀 SENDING TEST NOTIFICATION NOW...\n');

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: '🧪 TEST NOTIFICATION',
        body: 'This is a test. If you see this, the push system is working! Check DevTools Console.',
        broadcast: true,
        url: '/'
      })
    });

    const result = await response.json();

    console.log('📊 EDGE FUNCTION RESPONSE:\n');
    console.log(`   Success: ${result.success ? '✅' : '❌'}`);
    console.log(`   Sent to: ${result.sent}/${result.total} subscriptions`);
    console.log(`   Message: ${result.message}\n`);

    if (result.results && result.results.length > 0) {
      console.log('   Individual Results:');
      result.results.forEach((r, idx) => {
        const status = r.status === 'success' ? '✅' : '❌';
        console.log(`      [${idx + 1}] ${status} ${r.session_id}`);
        if (r.error) console.log(`          Error: ${r.error.substring(0, 50)}...`);
      });
    }

    console.log('\n═'.repeat(70));
    console.log('\n⏱️  WAIT 3-5 SECONDS...\n');
    console.log('Then check:\n');
    console.log('1️⃣  Service Worker console (DevTools → Application → Service Workers)');
    console.log('   ❓ Do you see "📨 [SW] Push event received"?\n');
    
    console.log('2️⃣  Your device notification area');
    console.log('   ❓ Do you see a notification popup?\n');

    console.log('3️⃣  Browser console (DevTools → Console tab)');
    console.log('   ❓ Any errors about Push or Service Worker?\n');

    console.log('═'.repeat(70));
    console.log('\n🔍 WHAT THIS TEST TELLS US:\n');

    console.log('✅ If you see "Push event received" in SW console:');
    console.log('   → Service Worker IS receiving push events');
    console.log('   → Issue is: Service Worker NOT showing notification\n');

    console.log('❌ If you DON\'T see "Push event received":');
    console.log('   → Service Worker NOT receiving push events');
    console.log('   → Issue is: Browser push service rejecting delivery\n');

    console.log('🎉 If notification appears on device:');
    console.log('   → EVERYTHING IS WORKING!\n');

    console.log('═'.repeat(70) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

triggerTestAndMonitor();
