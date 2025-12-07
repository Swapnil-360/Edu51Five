// Check which subscriptions succeeded vs failed
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read from .env file
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

console.log('📊 Analyzing push subscriptions...\n');

const { data: subscriptions, error } = await supabase
  .from('push_subscriptions')
  .select('*')
  .order('created_at', { ascending: false });

if (error) {
  console.error('Error:', error);
  process.exit(1);
}

console.log(`Total subscriptions: ${subscriptions.length}\n`);

subscriptions.forEach((sub, index) => {
  const endpoint = sub.endpoint;
  const provider = endpoint.includes('fcm.googleapis.com') ? 'FCM' :
                   endpoint.includes('updates.push.services.mozilla.com') ? 'Firefox' :
                   endpoint.includes('push.apple.com') ? 'Safari' :
                   'Unknown';
  
  console.log(`${index + 1}. Session: ${sub.session_id}`);
  console.log(`   Provider: ${provider}`);
  console.log(`   Endpoint: ${endpoint.substring(0, 70)}...`);
  console.log(`   Created: ${new Date(sub.created_at).toLocaleString()}`);
  console.log(`   Updated: ${new Date(sub.updated_at).toLocaleString()}`);
  console.log('');
});
