// Check most recent Edge Function execution logs
const SUPABASE_PROJECT_REF = 'aljnyhxthmwgesnkqwzu';
const SUPABASE_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co`;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/send-push-notification`;

console.log('🧪 Invoking function to generate fresh logs...\n');

const response = await fetch(FUNCTION_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Test from log checker',
    body: 'Checking logs'
  })
});

const result = await response.json();
console.log('📊 Result:', JSON.stringify(result, null, 2));
console.log('\n📝 Check logs in Supabase Dashboard:');
console.log(`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/logs/edge-functions`);
console.log('\nLook for the most recent execution and check the error details.');
