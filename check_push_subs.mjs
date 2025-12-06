// Quick script to check push_subscriptions table via anon key
const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.38.4')

const url = 'https://aljnyhxthmwgesnkqwzu.supabase.co'
const anon = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsam55aHh0aG13Z2Vzbmtxd3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MDAyODEsImV4cCI6MjA3MzE3NjI4MX0.410cD_I6gSYfi0k9-A5JyFLGqg-Kf06Byk4RfvmR16k'
const supabase = createClient(url, anon)

try {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('id, session_id, endpoint, updated_at, created_at')
    .order('updated_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Query error:', error)
    process.exit(1)
  }

  console.log('Found rows:', data?.length || 0)
  console.log(data)
} catch (err) {
  console.error(err)
  process.exit(1)
}
