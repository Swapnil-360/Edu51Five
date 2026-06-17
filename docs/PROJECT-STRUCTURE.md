# Project Structure

Feature → file → approximate line numbers.

---

## Routing & App Shell

| What | File | Lines |
|------|------|-------|
| View union type & state | `src/App.tsx` | 134–151 |
| URL → view parser | `src/App.tsx` | 152–170 |
| `goToView` (push history) | `src/App.tsx` | 186–230 |
| Popstate listener | `src/App.tsx` | 250–285 |
| Sidebar menu | `src/App.tsx` | 3374–3550 |
| Fullscreen render branches | `src/App.tsx` | 8550–8630 |
| Header / layout | `src/components/Layout/Header.tsx` | — |

---

## Auth

| What | File | Lines |
|------|------|-------|
| Sign-in modal | `src/components/SignInModal.tsx` | — |
| Sign-up modal | `src/components/SignUpModal.tsx` | — |
| Reset password modal | `src/components/ResetPasswordModal.tsx` | — |
| Set new password modal | `src/components/SetNewPasswordModal.tsx` | — |
| Change email modal | `src/components/ChangeEmailModal.tsx` | — |
| Register modal (legacy) | `src/components/RegisterModal.tsx` | — |
| Auth session listener | `src/App.tsx` | 530–660 |

---

## Profiles (Social)

| What | File | Lines |
|------|------|-------|
| Profile page (main) | `src/components/Profile/ProfilePage.tsx` | — |
| Edit basic info modal | `src/components/Profile/EditBasicInfoModal.tsx` | — |
| Education section | `src/components/Profile/EducationSection.tsx` | — |
| Experience section | `src/components/Profile/ExperienceSection.tsx` | — |
| Skills editor | `src/components/Profile/SkillsEditor.tsx` | — |
| Profile API | `src/lib/api/profileApi.ts` | — |
| Social types | `src/types/social.ts` | — |
| Supabase client | `src/lib/supabase.ts` | — |
| Storage helpers | `src/lib/storage.ts` | — |

---

## Connections (Network)

| What | File | Lines |
|------|------|-------|
| Network page (tabs: Connections / Requests / Discover) | `src/components/Network/NetworkPage.tsx` | — |
| User card | `src/components/Network/UserCard.tsx` | — |
| Connections API | `src/lib/api/connectionsApi.ts` | — |

---

## Team Building

| What | File | Lines |
|------|------|-------|
| Teams list page (Discover / My Teams) | `src/components/Teams/TeamsPage.tsx` | — |
| Team detail page (Overview / Members) | `src/components/Teams/TeamPage.tsx` | — |
| Team card | `src/components/Teams/TeamCard.tsx` | — |
| Create team modal | `src/components/Teams/CreateTeamModal.tsx` | — |
| Invite members modal | `src/components/Teams/InviteMembersModal.tsx` | — |
| Teams API | `src/lib/api/teamsApi.ts` | — |

---

## World Cup 2026 (Live Event)

| What | File | Lines |
|------|------|-------|
| WC26 page (Pick Team / Leaderboard / Matches tabs) | `src/components/WorldCup/WorldCupPage.tsx` | — |
| Intro modal (one-time, post-login) | `src/components/WorldCup/WC26IntroModal.tsx` | — |
| 48 teams data + logo helpers | `src/lib/wc26Teams.ts` | — |
| Sync + leaderboard API | `src/lib/api/worldCupApi.ts` | — |
| Edge function: sync matches from football-data.org | `supabase/functions/sync-wc26-matches/index.ts` | — |
| App: intro modal trigger (SIGNED_IN) | `src/App.tsx` | 562, 645 |
| App: render branch | `src/App.tsx` | 8600–8621 |

**Database:** `wc26_matches` table — home/away team TLA codes, scores, status, stage, group  
**Scoring:** win = 3 pts, draw = 1 pt, +1 per goal scored by picked team  
**Throttle:** 5 min normal · 60 s during live matches (IN_PLAY / PAUSED / HALFTIME)

---

## Student / Academic Features

| What | File | Lines |
|------|------|-------|
| Home dashboard | `src/components/Student/IntakeView.tsx` | — |
| Section view | `src/components/Student/SectionView.tsx` | — |
| Course view | `src/components/Student/CourseView.tsx` | — |
| Semester tracker | `src/components/SemesterTracker.tsx` | — |
| Custom routine | `src/components/Student/CustomRoutine.tsx` | — |
| Exam materials dashboard | `src/components/Student/ExamMaterialsDashboard.tsx` | — |
| PDF viewer | `src/components/PDFViewer.tsx` | — |
| Search | `src/components/Search/` | — |

---

## Admin

| What | File | Lines |
|------|------|-------|
| Admin dashboard | `src/components/Admin/AdminDashboard.tsx` | — |
| Broadcast composer + live email preview | `src/components/Admin/AdminDashboard.tsx` | ~288–435 |
| Broadcast send handler (push + email) | `src/App.tsx` | ~2442 |
| Course manager | `src/components/Admin/CourseManager.tsx` | — |
| File upload | `src/components/Admin/FileUpload.tsx` | — |
| Drive manager | `src/components/Admin/DriveManager.tsx` | — |

---

## Email & Push Notifications

| What | File | Lines |
|------|------|-------|
| Broadcast email HTML template (recipient-facing, no admin link) | `src/lib/emailNotifications.ts` | ~18 (`generateEmailHTML`) |
| Send email to all students | `src/lib/emailNotifications.ts` | ~349 (`sendEmailToAllStudents`) |
| Email content templates | `src/lib/emailTemplates.ts` | — |
| Push API helpers | `src/lib/pushNotifications.ts` | — |
| VAPID / subscription logic | `supabase/functions/send-push-notification/` | — |
| Service worker | `public/sw.js` | — |

---

## Database Migrations

All migrations in chronological order under `supabase/migrations/`. Key ones:

| Migration | Purpose |
|-----------|---------|
| `20260210_profiles_social.sql` | Social columns on profiles (avatar_url, headline, skills…) |
| `20260210_connections.sql` | Connections table |
| `20260210_teams.sql` | Teams + team_members + invitations + join requests |
| `20260210_storage_buckets.sql` | avatars + team-assets buckets |
| `20260616_wc26.sql` | wc26_matches table + wc26_team on profiles |
| `wc26_matches_nullable_teams` | Allow NULL home/away for knockout TBD rounds |

---

## Supabase Edge Functions

| Function | Trigger | Purpose |
|----------|---------|---------|
| `sync-wc26-matches` | On-demand (client throttled) | Fetch & upsert WC2026 matches from football-data.org |
| `send-push-notification` | DB trigger / admin action | Send Web Push to subscribed users |

---

## Key Conventions

- **Routing:** state-based (`currentView` string union), no react-router at runtime
- **Dark mode:** `isDarkMode: boolean` prop passed down to every page/modal
- **Images:** `avatar_url` (Supabase Storage) with legacy `profile_pic` (base64) fallback
- **Team logos:** `/public/world-cup-2026-logos/{team-name}.png` via `teamLogoUrl()` helper
- **Tailwind + daisyUI 5.5** for all UI; lucide-react for icons
- **Realtime:** `supabase.channel().on("postgres_changes", …).subscribe()` pattern (see App.tsx ~1107)
