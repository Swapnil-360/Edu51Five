// Test with detailed results showing which subscriptions succeed/fail
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

console.log('🧪 Testing with detailed results...\n');

const response = await fetch(`${SUPABASE_URL}/functions/v1/send-push-notification`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Detailed Test',
    body: 'Testing which subscriptions work',
    broadcast: true
  })
});

const result = await response.json();

console.log('📊 Overall Results:');
console.log(`   Sent: ${result.sent}`);
console.log(`   Failed: ${result.failed}`);
console.log(`   Total: ${result.total}`);
console.log('\n📋 Individual Results:');

if (result.results) {
  result.results.forEach((r, i) => {
    const emoji = r.status === 'success' ? '✅' : r.status === 'expired' ? '🗑️' : '❌';
    console.log(`\n${i + 1}. ${emoji} ${r.session_id}`);
    console.log(`   Status: ${r.status}`);
    if (r.error) {
      console.log(`   Error: ${r.error}`);
    }
  });
}
