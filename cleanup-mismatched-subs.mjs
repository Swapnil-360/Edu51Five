// Remove subscriptions with mismatched VAPID keys
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

console.log('🗑️  Removing subscriptions with mismatched VAPID keys...\n');

const sessionIdsToDelete = [
  'device_1764881055114_89gyya',
  'device_1764971806293_1yq5gp'
];

for (const sessionId of sessionIdsToDelete) {
  console.log(`Deleting ${sessionId}...`);
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('session_id', sessionId);
  
  if (error) {
    console.error(`   ❌ Error:`, error.message);
  } else {
    console.log(`   ✅ Deleted successfully`);
  }
}

console.log('\n✨ Done! These users will be prompted to re-subscribe when they visit the site.');
console.log('The new subscriptions will use the correct VAPID keys.');
