// Add Final Exam Notice to Supabase (or write fallback JSON)
// Usage (PowerShell):
// $env:VITE_SUPABASE_URL='https://xyz.supabase.co'; $env:VITE_SUPABASE_ANON_KEY='anon...'; node scripts/add_final_notice.js

const fs = require('fs');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('Supabase env vars not set. The script will write a fallback JSON file instead.');
}

const notice = {
  id: 'exam-routine-final-2025',
  title: '📅 Final Exam Routine - Section 5 (Dec 04–14, 2025)',
  content: `Final examination schedule for Section 5 (Computer Science & Engineering).

📋 **Exam Information (Finals - Dec 04 to Dec 14, 2025):**
• 04/12/2025 (Thursday) — 09:45 AM to 11:45 AM • CSE 319 • SHB • Room 2710
• 07/12/2025 (Sunday)   — 09:45 AM to 11:45 AM • CSE 327 • DMAa • Room 2710
• 09/12/2025 (Tuesday)  — 09:45 AM to 11:45 AM • CSE 407 • NB   • Room 2710
• 11/12/2025 (Thursday) — 09:45 AM to 11:45 AM • CSE 351 • SHD  • Room 2710
• 14/12/2025 (Sunday)   — 09:45 AM to 11:45 AM • CSE 417 • TAB  • Room 2710

• Arrive 15 minutes early for each exam
• Carry your student ID and necessary materials

⚠️ **Admin Notice:** Use the admin panel to upload the official routine image if available. This notice can be updated from Admin → Notices.

For queries, contact course instructors or the department.
`,
  type: 'warning',
  category: 'exam',
  priority: 'high',
  exam_type: 'final',
  event_date: '',
  is_active: true,
  created_at: new Date().toISOString()
};

async function writeFallback() {
  const outDir = 'data';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(`${outDir}/final_notice.json`, JSON.stringify(notice, null, 2), 'utf8');
  console.log('Wrote fallback file: data/final_notice.json');
}

async function insertToSupabase() {
  const url = SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/notices';
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: 'return=representation'
      },
      body: JSON.stringify([notice])
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('Supabase responded with error:', res.status, text);
      await writeFallback();
      return;
    }

    const data = await res.json();
    console.log('Inserted notice to Supabase:', data);
  } catch (err) {
    console.error('Error inserting to Supabase:', err.message || err);
    await writeFallback();
  }
}

(async () => {
  if (SUPABASE_URL && SUPABASE_KEY) {
    await insertToSupabase();
  } else {
    await writeFallback();
  }
})();
