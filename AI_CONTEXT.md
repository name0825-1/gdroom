# GDRMCL (GDRMCL Challenge List) - Master AI Context

Welcome, AI Assistant! This document is the ultimate source of truth for the GDRMCL project. It contains deep technical knowledge, business logic constraints, and operational protocols. **Read this carefully before making any changes.**

**[CRITICAL INSTRUCTION]** 
앞으로 작성하는 모든 계획서(implementation_plan), 작업 목록(task), 설명서 등은 **무조건 한국어로 작성**해야 합니다.

## 1. Project Overview & Tech Stack
GDRMCL is a specialized leaderboard for "Geometry Dash" challenges, focusing on a strictly maintained list of the top 200 hardest levels.
- **Framework:** Next.js (App Router, current version 16.1.6)
- **Runtime:** React 19, Node.js environment
- **Database:** PostgreSQL (Hosted on **Supabase**)
- **ORM:** Prisma (Handles schema migrations and typesafe queries)
- **Deployment:** Vercel (Serverless Function architecture)
- **Auth:** `iron-session` (Encrypted cookies) for Admin Dashboard access

## 2. Technical Architecture & Core Logic

### 2.1 The "Top 200" Constraint
The database MUST always maintain exactly 200 rows representing ranks 1 to 200. 
- **Empty Slots:** Rows with `name: "--"` are placeholders for unpopulated ranks.
- **Visuals:** The `HomeClient.tsx` filters out these `--` placeholders to provide a clean list for public users, but the database keeps them to maintain sequence integrity.

### 2.2 Rank Shifting (The Two-Phase SQL Strategy)
Insertion and deletion require shifting all subsequent ranks. Due to PostgreSQL's `Unique` constraint on the `rank` column, a standard `updateMany` or simple loop will fail because multiple rows would temporarily share the same rank during the process.
- **Problem:** Vercel serverless functions have a 10s-60s timeout. Sequential updates in a loop cause `P2028 Transaction Timeout`.
- **Solution:** **Two-Phase Raw SQL Shifting**.
  1. **Phase A (Safety Buffer):** Affected rows are updated with `rank = rank + 10000`. This moves them into a safe zone beyond the 1-200 range, avoiding unique constraint collisions.
  2. **Phase B (Re-entry):** Rows are then updated back using `rank = rank - 10000 + 1` (for insertion) or `rank - 10000 - 1` (for deletion) to land in their final correct positions.
- **Usage:** This logic is implemented in `src/app/api/levels/route.ts` (POST) and `[id]/route.ts` (PUT/DELETE) using `prisma.$executeRawUnsafe`.

### 2.3 Image Handling (ImgBB Integration)
To keep the database size within Supabase free-tier limits, we **never store large Base64 strings** in the Postgres database.
- **Workflow:** 
  1. The Admin UI accepts an image file or URL.
  2. If it's a file, it's converted to Base64 in the client and sent to the API.
  3. The server handler calls `uploadToImgBB` (defined in `src/lib/imgbb.ts`) using the key in `IMGBB_API_KEY`.
  4. Only the resulting `i.ibb.co` URL is saved in the database `imageUrl` column.

## 3. Discord Webhook Notification System

### 3.1 Implementation Details
The site notifies a Discord community whenever the leaderboard changes.
- **Utility:** `src/lib/discord.ts` wraps the Webhook logic into `sendDiscordWebhook`.
- **Format:** Uses **Discord Embeds** (Rich text).
  - **Color Coding:** Cyan (Insert), Gold/Amber (Update/Shift), Red (Delete).

### 3.2 [CRITICAL] Serverless Execution Rules
Vercel terminates all background processes **the moment the response is sent**. 
- **Rule:** Every call to `sendDiscordWebhook` **MUST be awaited** (`await sendDiscordWebhook(...)`). 
- **Why?** If you send it asynchronously without `await`, the Vercel serverless function will close before the network request to Discord finishes, resulting in **no notification**.

### 3.3 Environment Setup
The URL stored in `DISCORD_WEBHOOK_URL` must be a clean URL string. **Do not include wrapping quotes or spaces** in the Vercel dashboard, as this will lead to a `401 Unauthorized` error from Discord's API.

## 4. Admin Dashboard Security
- **Access:** Protected by a password stored in `ADMIN_PASSWORD`.
- **Rate Limiting:** IP-based rate limiting is applied to the `/api/auth/login` route. 
- **Tracking:** The `RateLimit` table in Prisma tracks failed attempts to prevent brute-force attacks.

## 5. Maintenance Protocols

### 5.1 Supabase Inactivity (Important)
Supabase free tier projects are **paused after 7 days of inactivity**. 
- **Prevention:** An external uptime monitor (like UptimeRobot) should be configured to ping `https://gdrmcl.vercel.app` every few minutes to keep the database alive.

### 5.2 Deployment Workflow
- **Code Access:** As an AI, you only see the local files.
- **[CRITICAL INSTRUCTION] 배포 방식:** 이 프로젝트는 Vercel에 연동되어 자동 배포되지만, 로컬 환경에서 직접 `git push`를 사용하지 않습니다.
- **Protocol:** 코드를 수정한 후 AI는 사용자에게 다음 방식으로 배포하도록 안내해야 합니다:
  1. 깃허브(GitHub) 웹사이트의 해당 저장소로 이동합니다.
  2. "Add file" -> "Upload files" 메뉴를 클릭합니다.
  3. 로컬에서 변경된 파일(`C:\Users\user\Desktop\gdroom\...`)을 드래그 앤 드롭하여 깃허브 웹에서 직접 업로드 및 커밋(Commit)합니다.
- **Vercel Sync:** 깃허브 웹에서 파일 업로드가 완료되면 Vercel이 이를 감지하여 라이브 사이트에 자동 배포합니다. 환경변수 변경 시에만 Vercel 대시보드에서 수동 재배포가 필요합니다.

## 6. Key File Index for Quick Reference
- `src/app/HomeClient.tsx`: Main public list viewing logic.
- `src/app/admin/page.tsx`: Admin dashboard orchestration.
- `src/app/api/levels/route.ts`: Core POST logic for rank-shifting insertion.
- `src/app/api/levels/[id]/route.ts`: Core PUT/DELETE logic for rank modification.
- `src/lib/discord.ts`: Discord notification utility.
- `prisma/schema.prisma`: Database model definition.

*This guide ensures high-quality code and system stability. Follow these patterns strictly.*
