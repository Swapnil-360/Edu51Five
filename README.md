# Edu51Five — BUBT CSE Student Platform

[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat&logo=vite)](https://vitejs.dev)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat&logo=supabase)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000?style=flat&logo=vercel)](https://edu51five.vercel.app)

---

## Why We're Building This

BUBT CSE students had no central place to access course materials, track the semester, coordinate on projects, or stay connected with peers. Resources were scattered across WhatsApp groups, Google Drive links shared in chats, and manually maintained spreadsheets.

**Edu51Five** solves this by giving every CSE student a single platform that handles academics (files, schedules, semester tracking), social networking (connections, profiles, team building), and eventually alumni career visibility — all within a private, university-scoped community.

The app is intentionally kept within the BUBT CSE ecosystem: sign-up requires a `@cse.bubt.edu.bd` email, which acts as both validation and community gate.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript, Vite 5 |
| UI | Tailwind CSS 3.4, daisyUI 5.5, lucide-react |
| Backend / DB | Supabase (PostgreSQL, Auth, RLS, Realtime) |
| Storage | Supabase Storage (avatars, team-assets, exam-routines) |
| Hosting | Vercel |
| Image handling | Client-side canvas → WebP compression before upload |

---

## What's Been Built

### V1 — Academic Core

| Feature | Details |
|---|---|
| **Student Dashboard** | Browse courses by intake and section, view course details |
| **Admin Dashboard** | Manage courses, upload/delete study materials, manage users |
| **Semester Tracker** | Live progress bar, milestone timeline, countdown to next exam; Spring 2026 calendar built in |
| **Custom Routine** | Personal weekly schedule builder with Supabase persistence |
| **File Delivery** | Direct upload via admin panel OR embedded Google Drive folder links; PDF viewer modal with fullscreen support |
| **Push Notifications** | Web Push (VAPID) for admin broadcast to all subscribers |
| **Active User Tracking** | Real-time presence counter in admin dashboard (session-ID based, Supabase Realtime) |
| **Dark / Light Mode** | Full theme support across all views |
| **Search & Filter** | Course and file search across the dashboard |

### V2 Phase 1 — Social Platform

| Feature | Details |
|---|---|
| **Supabase Auth** | Sign up / sign in / forgot password / reset password flow; `@cse.bubt.edu.bd` domain gate; DB trigger auto-confirms accounts so SMTP delivery to university mail is never required |
| **LinkedIn-style Profiles** | Avatar + cover photo (Supabase Storage, client-side WebP compression), headline, about, education history, work experience, skills, interests, social links |
| **Connections / Network** | Send / accept / reject / cancel connection requests; incoming + outgoing request management; discover and search users by name, skills, section, or major |
| **Team Building** | Create teams (category, required skills, max 2–7 members); discover teams; team roles: owner / admin / member; join requests + invitations with approve/reject; announcements board; team settings (rename, description, delete); team logo + cover photo upload |
| **Profile picture fallback** | Users who uploaded via the old base64 system still see their photo in team member lists and network cards while they migrate to Storage-backed avatars |
| **RLS hardening** | Fixed silent failures on connection accept/reject, upload policies for avatars and team-assets buckets, email auto-confirm trigger, retroactive confirmation of stuck accounts |

---

## What's Coming Next

### V2 Phase 2 — Collaboration

- **Team Chat** — real-time messaging inside each team (Supabase Realtime channels), message replies, @mentions, emoji reactions, typing indicator
- **Kanban Board** — per-team task board (columns + cards with assignee, due date, labels); drag-and-drop ordering via `@dnd-kit`
- **Team File Sharing** — upload and browse shared files within a team; signed URL download; role-based delete
- **Notification Center** — in-app notification bell for connection requests, team invites, join approvals, and announcements; Supabase Realtime badge updates

### V2 Phase 3 — Alumni & Moderation

- **Alumni Hub** — verified BUBT alumni directory; self-identification flow (admin approves); searchable by intake, department, company, role
- **Admin Moderation** — alumni verification panel, feedback/report management
- **Feedback System** — students can submit feedback or bug reports; admin reviews in dashboard

---

## Repository

| Remote | URL |
|---|---|
| Primary | https://github.com/Swapnil-360/Edu51Five |
| Mirror | https://github.com/3D-Escape-Room-Game/Edu51Portal |

Live app: **https://edu51five.vercel.app**
