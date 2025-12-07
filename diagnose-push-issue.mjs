// Check subscription health and diagnose why push isn't working
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

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

async function diagnoseSubscriptions() {
  console.log('\n🔍 DIAGNOSING PUSH SUBSCRIPTION ISSUES\n');
  console.log('=' .repeat(70) + '\n');

  try {
    // Get all subscriptions
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching subscriptions:', error);
      return;
    }

    if (!subs || subs.length === 0) {
      console.log('❌ NO SUBSCRIPTIONS FOUND\n');
      return;
    }

    console.log(`📊 Found ${subs.length} subscriptions\n`);

    subs.forEach((sub, idx) => {
      console.log(`\n[${idx + 1}] Session: ${sub.session_id}`);
      console.log(`    Created: ${sub.created_at}`);
      console.log(`    Updated: ${sub.updated_at}`);
      
      const keys = sub.subscription?.keys || {};
      const hasP256dh = !!keys.p256dh;
      const hasAuth = !!keys.auth;
      
      console.log(`    Encryption Keys:`);
      console.log(`      - p256dh: ${hasP256dh ? '✅' : '❌'} ${hasP256dh ? '(present)' : '(MISSING!)'}`);
      console.log(`      - auth: ${hasAuth ? '✅' : '❌'} ${hasAuth ? '(present)' : '(MISSING!)'}`);

      const endpoint = sub.subscription?.endpoint || 'N/A';
      const provider = endpoint.includes('fcm.googleapis.com') ? 'FCM' : 
                      endpoint.includes('mozilla') ? 'Firefox' : 
                      endpoint.includes('apple') ? 'Safari' :
                      endpoint.includes('windows') ? 'Windows' : 'Unknown';
      
      console.log(`    Provider: ${provider}`);
      console.log(`    Endpoint: ${endpoint.substring(0, 50)}...`);

      // Health check
      const isHealthy = hasP256dh && hasAuth && endpoint.length > 20;
      console.log(`    Health: ${isHealthy ? '✅ GOOD' : '❌ PROBLEMATIC'}`);

      if (!isHealthy) {
        console.log(`    🔴 ISSUE: This subscription may not receive push events`);
        if (!hasP256dh || !hasAuth) {
          console.log(`    💡 FIX: Encryption keys are missing. The auto-repair function should detect this.`);
        }
      }
    });

    // Summary
    console.log('\n' + '=' .repeat(70));
    const healthy = subs.filter(s => s.subscription?.keys?.p256dh && s.subscription?.keys?.auth);
    console.log(`\n📈 SUMMARY:`);
    console.log(`   Total subscriptions: ${subs.length}`);
    console.log(`   Healthy (have keys): ${healthy.length} ✅`);
    console.log(`   Problematic (missing keys): ${subs.length - healthy.length} ❌`);

    if (subs.length - healthy.length > 0) {
      console.log(`\n⚠️  ACTION NEEDED:`);
      console.log(`   Problematic subscriptions detected. When users visit the site,`);
      console.log(`   validateCurrentSubscription() should auto-repair them.`);
      console.log(`   Or manually run: node PUSH-NOTIFICATION-FIX.ps1`);
    }

    console.log('\n');

  } catch (error) {
    console.error('❌ Exception:', error);
  }
}

diagnoseSubscriptions();
