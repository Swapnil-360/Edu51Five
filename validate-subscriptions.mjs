import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env');
  console.error('Please check your environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function validateAndRepairSubscriptions() {
  console.log('🔍 Validating and repairing push subscriptions...\n');

  // Get all subscriptions
  const { data: subs, error: listError } = await supabase
    .from('push_subscriptions')
    .select('*')
    .order('updated_at', { ascending: false });

  if (listError) {
    console.error('❌ Error fetching subscriptions:', listError.message);
    return;
  }

  if (!subs || subs.length === 0) {
    console.log('⚠️  No subscriptions found in database');
    return;
  }

  console.log(`📊 Found ${subs.length} subscriptions\n`);

  // Validate each subscription
  let validCount = 0;
  let invalidCount = 0;

  for (const sub of subs) {
    console.log(`\n📋 Checking: ${sub.session_id}`);
    console.log(`   Endpoint: ${sub.endpoint.substring(0, 60)}...`);
    
    // Check if subscription has required keys
    const hasP256dh = !!sub.subscription?.keys?.p256dh;
    const hasAuth = !!sub.subscription?.keys?.auth;
    
    console.log(`   p256dh present: ${hasP256dh}`);
    console.log(`   auth present: ${hasAuth}`);
    
    if (hasP256dh && hasAuth) {
      console.log(`   ✅ Valid subscription`);
      validCount++;
    } else {
      console.log(`   ❌ Invalid subscription (missing encryption keys)`);
      invalidCount++;
      
      // Mark for update
      console.log(`   💡 This subscription needs to be re-registered by the client`);
    }
  }

  console.log(`\n\n📊 VALIDATION RESULTS:`);
  console.log(`✅ Valid subscriptions: ${validCount}`);
  console.log(`❌ Invalid subscriptions: ${invalidCount}`);
  console.log(`📈 Total subscriptions: ${subs.length}`);

  if (invalidCount > 0) {
    console.log(`\n⚠️  Found ${invalidCount} subscriptions with missing encryption keys`);
    console.log(`\n💡 SOLUTION:`);
    console.log(`1. These clients will automatically re-register when they visit the site`);
    console.log(`2. The app will detect missing encryption keys and request fresh subscription`);
    console.log(`3. New subscriptions will have valid encryption keys`);
  }

  console.log(`\n\n✨ NEXT STEPS:`);
  console.log(`1. Have users visit http://localhost:5174/ (or your production URL)`);
  console.log(`2. They will automatically re-register if keys are invalid`);
  console.log(`3. Or manually: Users can disable and re-enable notifications`);
  console.log(`4. Test sending notification again from admin panel`);
}

validateAndRepairSubscriptions().catch(console.error);
