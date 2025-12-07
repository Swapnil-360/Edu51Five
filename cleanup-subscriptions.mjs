import { createClient } from '@supabase/supabase-js';

// **YOU MUST FILL THESE IN FROM YOUR .env FILE**
const supabaseUrl = 'YOUR_SUPABASE_URL'; // Replace with your URL from .env
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your key from .env

// For now, try to get from environment
const url = process.env.VITE_SUPABASE_URL || supabaseUrl;
const key = process.env.VITE_SUPABASE_ANON_KEY || supabaseKey;

if (!url || !key || url === 'YOUR_SUPABASE_URL') {
  console.error('❌ Missing Supabase credentials');
  console.error('\nTo fix: Open cleanup-subscriptions.mjs and fill in your credentials from .env\n');
  process.exit(1);
}

const supabase = createClient(url, key);

async function cleanupAndTest() {
  console.log('🧹 Cleaning up stale push subscriptions...\n');

  // Get all subscriptions
  const { data: allSubs, error: listError } = await supabase
    .from('push_subscriptions')
    .select('id, session_id, created_at, updated_at');

  if (listError) {
    console.error('❌ Error fetching subscriptions:', listError.message);
    return;
  }

  console.log(`📊 Total subscriptions in database: ${allSubs.length}`);
  
  if (allSubs.length > 0) {
    console.log('\nSubscriptions to delete:');
    allSubs.forEach(sub => {
      console.log(`  - ${sub.session_id} (created: ${sub.created_at})`);
    });
    
    console.log('\n🗑️  Deleting all subscriptions...');
    
    // Delete each subscription
    for (const sub of allSubs) {
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('id', sub.id);
      
      if (error) {
        console.error(`❌ Error deleting ${sub.session_id}:`, error.message);
      }
    }
    
    console.log(`✅ Deleted ${allSubs.length} subscriptions\n`);
  } else {
    console.log('✅ No subscriptions to delete\n');
  }

  console.log('📝 NEXT STEPS:');
  console.log('1. Refresh your browser (Ctrl+F5)');
  console.log('2. Click the bell icon (Enable Notifications)');
  console.log('3. Allow notifications when browser prompts');
  console.log('4. A fresh subscription will be created');
  console.log('5. Go to Admin → Broadcast Push Notification');
  console.log('6. Fill in a test notification and click "Send to All Subscribers"');
  console.log('7. MINIMIZE the browser and check notification panel');
}

cleanupAndTest().catch(console.error);
