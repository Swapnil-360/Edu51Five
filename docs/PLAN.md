# Project Plan — Edu51Portal

**Last updated:** June 17, 2026  
**Live:** edu51portal.live

---

## Current Status

The app is live and in active use by BUBT Intake 51 – Section 5 students.  
All Phase 1 social/team features are shipped. The WC2026 live event is running.

---

## Completed

### Core Platform
- [x] Student dashboard (course browser, PDF viewer, file delivery)
- [x] Semester tracker (progress bar, timeline, exam countdown)
- [x] Custom routine builder
- [x] Admin dashboard (course manager, file upload, Drive integration)
- [x] Dark / light mode
- [x] Push notifications (VAPID + service worker)

### V2 Social Features (Phase 1)
- [x] LinkedIn-style profiles (avatar, cover, headline, education, experience, skills)
- [x] Connections (request / accept / discover)
- [x] Team Building (create / discover teams, roles, invitations, join requests, announcements)
- [x] Alumni Hub (directory, admin-verified)

### World Cup 2026 Event
- [x] `wc26_matches` table with full 104-match schedule
- [x] Edge function syncing live scores from football-data.org every 60 s during matches
- [x] Pick-your-team feature (48 teams, grouped A–L, local PNG logos)
- [x] Points leaderboard (win=3, draw=1, +1/goal)
- [x] Match center with live score display
- [x] Intro modal (shown once per device post-login)
- [x] WC26 badge on profile (team logo beside name, hover animation)
- [x] WC26 pinned to top of sidebar with pulsing LIVE badge

### Infrastructure
- [x] Custom domain: edu51portal.live (Vercel A record)
- [x] Supabase migrations for all schema changes in `supabase/migrations/`
- [x] Codebase cleaned — no debug scripts or one-off SQL at root

---

## In Progress / Next

### WC2026 Event — Polish
- [ ] Migrate users who picked old team codes (SAU→KSA, URU→URY) before tournament progresses further
- [ ] Rotate the football-data.org API key (was shared in plaintext; regenerate and update Supabase secret)
- [ ] Show points breakdown per match on leaderboard hover/expand
- [ ] Group stage standings table in Match Center

### V2 Phase 2 (Collaboration)
- [ ] **Team Chat** — realtime messages, replies, reactions (`team_messages` table)
- [ ] **Kanban Board** — per-team task board with drag-and-drop (`@dnd-kit`)
- [ ] **Team Files** — upload/download per team (private Supabase Storage bucket)
- [ ] **Notification Bell** — in-app notification center, realtime badge count

### Quality
- [ ] Add proper TypeScript types for all API responses (eliminate `any`)
- [ ] Error boundary wrappers on heavy pages (ProfilePage, WorldCupPage)
- [ ] Lighthouse audit pass on mobile — target 90+ performance

---

## Scoring Logic Reference

```
FINISHED match where user's team played:
  win  → +3 points
  draw → +1 point
  goal scored by team → +1 per goal

Status categories:
  SCHEDULED / TIMED → upcoming
  IN_PLAY / PAUSED / HALFTIME → live (60s refresh)
  FINISHED → settled
```

---

## Edge Function Secrets Required

| Secret | Where to set |
|--------|-------------|
| `FOOTBALL_API_KEY` | Supabase Dashboard → Edge Functions → Secrets |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-injected by Supabase |
| `VAPID_PRIVATE_KEY` | Supabase Dashboard → Edge Functions → Secrets |
| `VAPID_PUBLIC_KEY` | Supabase Dashboard → Edge Functions → Secrets |

---

## Domain & Hosting

| Service | Value |
|---------|-------|
| Vercel project | `edu51five` |
| Primary domain | `edu51portal.live` (A record → 216.198.79.1) |
| Fallback domain | `edu51five.vercel.app` |
| DNS registrar | name.com |
