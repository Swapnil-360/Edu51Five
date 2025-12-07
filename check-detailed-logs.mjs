// Invoke function and check for detailed error messages
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

console.log('🔍 Checking detailed error logs...\n');
console.log('Please check the Supabase Dashboard for detailed logs:');
console.log('https://supabase.com/dashboard/project/aljnyhxthmwgesnkqwzu/logs/edge-functions');
console.log('\nInvoking function to generate new logs...\n');

const response = await fetch(`${SUPABASE_URL}/functions/v1/send-push-notification`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Detailed Test',
    body: 'Checking which subscriptions fail',
    broadcast: true
  })
});

const result = await response.json();
console.log('Result:', JSON.stringify(result, null, 2));
console.log('\n✨ Check the Supabase Dashboard logs link above to see:');
console.log('   - Which session IDs succeeded');
console.log('   - Which session IDs failed');
console.log('   - Exact FCM error codes (410=expired, 404=not found, 401=auth error)');
