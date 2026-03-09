# GDRMCL (GDROOM Challenge List) - Master AI Context

Welcome, AI Assistant! This document provides crucial context about the GDRMCL project. Read this file before attempting any complex debugging or feature additions.

## 1. Tech Stack
- **Framework:** Next.js 16.1.6 (App Router)
- **Language:** TypeScript, React 19
- **Database:** PostgreSQL (Hosted on Supabase) accessed via **Prisma ORM**
- **Authentication:** `iron-session` (Cookie-based, Admin only)
- **Styling:** Tailwind CSS v4, Framer Motion for animations
- **Deployment:** Vercel (Serverless architecture)

## 2. Core Features & Business Logic
This is a community-driven "Geometry Dash" Challenge List.
- **Top 200 Ranking:** The core feature is maintaining exactly 200 ranked slots (1 to 200). Levels can be inserted between existing ranks.
- **Rank Shifting Algorithm:** When a new level is inserted at rank `N` (e.g., POST `/api/levels`), all existing levels from `N` to 199 are shifted down by 1 (+1 rank). Rank 200 is deleted.
- **Two-Phase Raw SQL Shift:** Due to PostgreSQL's `Unique Constraint` on `rank` and Vercel Serverless timeout constraints (P2028 errors), **DO NOT USE `for` loops or `updateMany` for rank shifting**. We use a `Two-Phase Raw SQL` approach:
  1. Add `+10000` to affected ranks (moves them to a safe temporary range).
  2. Subtract `10000` and add/subtract `1` as needed to shift them to their final ranks.
- **Image Uploads:** Thumbnails are converted to Base64 in the client, but sent to the server which uploads them to **ImgBB** via API, storing only the ImgBB URL in the database. (Previously, Base64 strings were stored directly in DB, causing massive DB bloat and Neon quota limits).

## 3. Key Files & Structure
- `src/app/page.tsx` & `HomeClient.tsx`: Public facing level list. Renders top 200 levels. Levels with `name === "--"` are hidden empty slots.
- **Admin Dashboard (`src/app/admin/page.tsx`):** The main management UI. Includes a "Copy Info" button in the Submissions tab that populates the "Insert Level" modal automatically.
- `src/app/api/levels/route.ts`: `GET` all levels, `POST` a new level (handles the Two-Phase Insert Shift logic).
- `src/app/api/levels/[id]/route.ts`: `PUT` modify details/rank (handles Two-Phase Up/Down Shift logic), `DELETE` level (pulls ranks up).
- `src/app/api/auth/login/route.ts`: Password-based admin login with IP-based rate limiting.
- `prisma/schema.prisma`: The source of truth for the database schema.

## 4. Known Oddities & Constraints
1. **Empty Slots:** The database is seeded with exactly 200 rows having `name: "--", creator: "--", verifier: "--"`. **Never delete these rows** unless you're explicitly removing a level and shifting ranks.
2. **Serverless Limits:** Never use long loops for DB transactions. Use bulk Raw SQL via `tx.$executeRawUnsafe`.
3. **Frontend Slot Logic:** In `HomeClient.tsx`, slots with `--` are conditionally not rendered to keep the UI clean.
4. **Vercel Env:** `DATABASE_URL` (Connection pooling/transactional) and `DIRECT_URL` (Session/direct) must be configured correctly for Prisma.
5. **[URGENT: SERVER ACTIVITY]**: **FREE TIER SUPABASE PROJECTS PAUSE AFTER 1 WEEK OF INACTIVITY.** To prevent this, a **"Bot Clicker" (UptimeRobot, etc.)** MUST be configured to ping the site regularly. **!!! THIS IS MANDATORY FOR SERVER PERSISTENCE !!!**

## 5. Typical Workflows for AI
- **Modifying Schema:** Run `npx prisma db push` (not `migrate dev` as the user prefers direct push).
- **Adding Admin Routes:** Always check `getSession()` for authentication.
- **Troubleshooting Images:** Check `src/lib/imgbb.ts` for API key integration and `src/app/api/upload/route.ts` for the server handler.

## 6. Important: Deployment & Communication Protocol
- **[CRITICAL RULE] Manual Deployment Alert:** This project is deployed on **Vercel via GitHub**. As an AI, I only have access to the local filesystem. I **CANNOT** deploy changes directly to the live site.
- **Action Required:** Whenever a code change is made, the AI **MUST** explicitly inform the USER that they need to **manually Commit and Push to GitHub** to see the changes on the live website.

*End of Context.*
