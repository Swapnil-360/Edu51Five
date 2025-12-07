#!/usr/bin/env node
// Check which device is currently subscribed in browser

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

async function findLatestSubscription() {
  console.log('\n📱 FINDING YOUR CURRENT DEVICE SUBSCRIPTION\n');
  console.log('═'.repeat(70) + '\n');

  try {
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    if (!subs || subs.length === 0) {
      console.log('❌ No subscriptions found\n');
      console.log('Steps to create one:');
      console.log('  1. Open: http://localhost:5174');
      console.log('  2. Go to Student View (NOT Admin)');
      console.log('  3. Click Bell icon 🔔 in top right');
      console.log('  4. Click "Enable Notifications"');
      console.log('  5. Grant browser permission');
      console.log('\n');
      return;
    }

    const sub = subs[0];
    console.log('✅ FOUND YOUR DEVICE SUBSCRIPTION:\n');
    console.log(`   Device ID: ${sub.session_id}`);
    console.log(`   Created: ${sub.created_at}`);
    console.log(`   Last Updated: ${sub.updated_at}`);
    console.log(`\n   Age: ${calculateAge(new Date(sub.created_at))}\n`);

    const keys = sub.subscription?.keys || {};
    console.log('   Encryption Keys:');
    console.log(`      p256dh: ${keys.p256dh ? '✅ Present' : '❌ Missing'}`);
    console.log(`      auth:   ${keys.auth ? '✅ Present' : '❌ Missing'}\n`);

    const endpoint = sub.subscription?.endpoint || '';
    console.log('   Endpoint Status:');
    if (endpoint.includes('fcm.googleapis.com')) {
      console.log('      Provider: Firebase Cloud Messaging (FCM)');
    } else if (endpoint.includes('mozilla')) {
      console.log('      Provider: Mozilla Firefox');
    } else if (endpoint.includes('apple')) {
      console.log('      Provider: Apple Safari');
    } else if (endpoint.includes('windows')) {
      console.log('      Provider: Windows Push Service');
    } else {
      console.log('      Provider: Unknown');
    }
    
    console.log(`\n   Full Endpoint:\n      ${endpoint}\n`);

    // Determine health
    const daysSinceCreated = Math.floor((Date.now() - new Date(sub.created_at).getTime()) / (1000 * 60 * 60 * 24));
    const health = daysSinceCreated > 7 ? '⚠️  LIKELY STALE' : '✅ FRESH';
    
    console.log('═'.repeat(70));
    console.log(`\n📊 HEALTH CHECK: ${health}\n`);

    if (daysSinceCreated > 7) {
      console.log('   ⏰ This subscription is older than 7 days');
      console.log('   🔄 Endpoints expire gradually over time');
      console.log('   💡 Solution: Force refresh subscriptions\n');
      console.log('   Run: node force-refresh-subscriptions.mjs --confirm\n');
    } else {
      console.log('   ✨ This subscription is relatively fresh');
      console.log('   🔍 But it still might be stale at the push service level\n');
    }

    console.log('═'.repeat(70) + '\n');

  } catch (error) {
    console.error('❌ Exception:', error.message);
  }
}

function calculateAge(date) {
  const now = new Date();
  const days = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  const hours = Math.floor(((now - date) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor(((now - date) % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

findLatestSubscription();
