// Supabase Edge Function: exam-reminder
// Sends exam reminder push notifications ~12 hours before each scheduled exam

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExamEvent {
  id: string
  title: string
  courseCode: string
  examType: 'midterm' | 'final' | 'ct'
  examDateTime: string // ISO string with timezone, e.g. '2025-12-04T09:00:00+06:00'
}

// TODO: Update with the real routine times (Asia/Dhaka) for your section
const EXAM_EVENTS: ExamEvent[] = [
  {
    id: 'midterm-start',
    title: 'Mid-term Examinations begin',
    courseCode: 'ALL',
    examType: 'midterm',
    examDateTime: '2025-09-14T09:00:00+06:00',
  },
  {
    id: 'final-start',
    title: 'Final Examinations begin',
    courseCode: 'ALL',
    examType: 'final',
    examDateTime: '2025-12-04T09:00:00+06:00',
  },
]

// Friendly message builder
const buildMessage = (event: ExamEvent) => {
  const when = new Date(event.examDateTime).toLocaleString('en-US', { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit' })
  return {
    title: `Edu51Five • ${event.examType === 'midterm' ? 'Mid-term' : 'Final'} Reminder`,
    body: `${event.title} at ${when}. Take your essentials, revise key topics, and best of luck!`,
    url: '/exam-materials'
  }
}

// Send push via existing send-push-notification Edge Function to avoid code duplication
async function sendBroadcastNotice(payload: { title: string; body: string; url: string }) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')

  const invokeUrl = `${supabaseUrl}/functions/v1/send-push-notification`
  const resp = await fetch(invokeUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url,
      broadcast: true
    })
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Failed to send broadcast: ${resp.status} ${text}`)
  }

  return await resp.json()
}

// Use notification_logs to avoid duplicate sends
async function hasSentToday(eventId: string) {
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.38.4')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceKey) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  const client = createClient(supabaseUrl, serviceKey)

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data, error } = await client
    .from('notification_logs')
    .select('id')
    .eq('notice_id', `exam-reminder-${eventId}`)
    .gte('created_at', startOfDay.toISOString())
    .limit(1)

  if (error) throw error
  return (data ?? []).length > 0
}

async function logSend(eventId: string, title: string, body: string, total: number, sent: number, failed: number) {
  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.38.4')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !serviceKey) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    const client = createClient(supabaseUrl, serviceKey)

    await client.from('notification_logs').insert({
      notice_id: `exam-reminder-${eventId}`,
      notice_type: 'exam-reminder',
      title,
      body,
      recipients_count: total,
      success_count: sent,
      failure_count: failed,
    })
  } catch (err) {
    console.error('Failed to log exam reminder:', err)
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  try {
    const now = new Date()

    // Build reminders for events occurring ~12 hours from now
    const dueEvents = EXAM_EVENTS.filter((event) => {
      const examTime = new Date(event.examDateTime)
      const diffMs = examTime.getTime() - now.getTime()
      const diffHours = diffMs / (1000 * 60 * 60)
      return diffHours <= 12 && diffHours >= 11; // within the 11-12 hour window
    })

    if (dueEvents.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No exams within the 12h window' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const results = [] as Array<{ eventId: string; sent: number; failed: number; total: number }>

    for (const event of dueEvents) {
      const alreadySent = await hasSentToday(event.id)
      if (alreadySent) {
        results.push({ eventId: event.id, sent: 0, failed: 0, total: 0 })
        continue
      }

      const msg = buildMessage(event)
      const resp = await sendBroadcastNotice(msg)
      await logSend(event.id, msg.title, msg.body, resp.total ?? 0, resp.sent ?? 0, resp.failed ?? 0)
      results.push({ eventId: event.id, sent: resp.sent ?? 0, failed: resp.failed ?? 0, total: resp.total ?? 0 })
    }

    return new Response(JSON.stringify({ success: true, results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error('❌ Exam reminder error:', error)
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

/*
DEPLOY:
  npx supabase functions deploy exam-reminder

SCHEDULE (Supabase dashboard):
  Functions -> exam-reminder -> Schedule -> Cron: 0 * * * *  (run hourly)
  This will catch the 11-12h window before each exam.

TEST (manual invoke):
  curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/exam-reminder" \
    -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json"

CONFIGURE EXAMS:
  Update EXAM_EVENTS above with real date-times in Asia/Dhaka (UTC+06:00).
*/