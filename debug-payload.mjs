// Debug script to check the exact payload structure being sent
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

console.log('🔍 Debugging Push Notification Payload\n');

async function testPayload() {
  try {
    console.log('📤 Sending debug notification...\n');

    const testPayload = {
      title: '🧪 Debug Test Notification',
      body: 'This is a test to debug the payload structure. If you see this, the notification system is working!',
      broadcast: true,
      url: '/'
    };

    console.log('📦 Payload being sent:');
    console.log(JSON.stringify(testPayload, null, 2));

    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-push-notification`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });

    const result = await response.json();

    console.log('\n📊 Response from Edge Function:');
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      console.log(`\n✅ Sent to ${result.sent}/${result.total} subscriptions`);
      console.log('\n📝 What should happen next:');
      console.log('1. Service Worker receives the push event');
      console.log('2. "📨 Push event received!" log should appear in DevTools');
      console.log('3. Service Worker decrypts and parses the payload');
      console.log('4. Notification displays in system notification area');
      console.log('\n🔧 To debug:');
      console.log('1. Open DevTools (F12)');
      console.log('2. Go to Application → Service Workers');
      console.log('3. Open DevTools for the service worker');
      console.log('4. Trigger this script again');
      console.log('5. Watch the console logs');
    } else {
      console.log(`\n❌ Error: ${result.error}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPayload();
