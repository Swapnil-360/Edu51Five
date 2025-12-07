#!/usr/bin/env node
// Force refresh all subscriptions by deleting stale ones and requiring users to re-enable

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

async function refreshAllSubscriptions() {
  console.log('\n🔄 FORCE REFRESH ALL PUSH SUBSCRIPTIONS\n');
  console.log('═'.repeat(70));
  
  try {
    // Get all subscriptions
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (error) {
      console.error('❌ Error fetching subscriptions:', error);
      return;
    }

    if (!subs || subs.length === 0) {
      console.log('❌ No subscriptions found to refresh\n');
      return;
    }

    console.log(`\n📋 Found ${subs.length} subscriptions to refresh:\n`);
    
    subs.forEach((sub, idx) => {
      console.log(`   [${idx + 1}] ${sub.session_id}`);
      console.log(`       Endpoint: ${sub.subscription?.endpoint?.substring(0, 60)}...`);
    });

    console.log('\n' + '═'.repeat(70));
    console.log('\n⚠️  ACTION: Delete ALL subscriptions to force refresh\n');
    console.log('When users visit the site next, they will be prompted to:');
    console.log('   1. See browser permission request');
    console.log('   2. Get NEW fresh subscriptions with VALID endpoints');
    console.log('   3. Receive push notifications successfully\n');

    console.log('═'.repeat(70));
    console.log('\n🗑️  DELETING ALL SUBSCRIPTIONS...\n');

    // Delete all subscriptions
    const { error: deleteError, count } = await supabase
      .from('push_subscriptions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all

    if (deleteError) {
      console.error('❌ Error deleting subscriptions:', deleteError);
      return;
    }

    console.log(`✅ Deleted ${subs.length} subscriptions\n`);
    console.log('═'.repeat(70));
    console.log('\n📢 NEXT STEPS:\n');
    console.log('1. Users will be asked to re-enable notifications on next visit');
    console.log('2. App will create FRESH subscriptions with VALID endpoints');
    console.log('3. Push notifications will work properly 🎉\n');
    console.log('Timeline:');
    console.log('   ⏱️  Immediate: Subscriptions cleared');
    console.log('   ⏱️  On next visit: New subscriptions created');
    console.log('   ⏱️  After 1 minute: Users get working push notifications\n');
    console.log('═'.repeat(70) + '\n');

  } catch (error) {
    console.error('❌ Exception:', error.message);
  }
}

// Confirm before deleting
const args = process.argv.slice(2);
if (args.includes('--confirm')) {
  refreshAllSubscriptions();
} else {
  console.log('\n⚠️  This will DELETE ALL subscriptions and require users to re-enable\n');
  console.log('Run again with: node force-refresh-subscriptions.mjs --confirm\n');
}
