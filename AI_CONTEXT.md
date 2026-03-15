# GDRMCL (GDRMCL Challenge List) - Master AI Context

Welcome, AI Assistant! This document is the ultimate source of truth for the GDRMCL project. It contains deep technical knowledge, business logic constraints, and operational protocols. **Read this carefully before making any changes.**

**[CRITICAL INSTRUCTION - 언어 규칙]**  
앞으로 작성하는 모든 계획서(implementation_plan), 작업 목록(task), 설명서(walkthrough), 코드 주석, 커밋 메시지, 유저 응답 등은 **무조건 한국어로 작성**해야 합니다. 영어로 된 문서를 생성하지 마세요.

---

## 1. 프로젝트 개요 & 기술 스택

GDRMCL은 "Geometry Dash" 챌린지에 특화된 리더보드로, 가장 어려운 레벨 상위 200개를 엄격하게 관리합니다.

| 항목 | 기술 |
|---|---|
| **프레임워크** | Next.js (App Router, v16.1.6) |
| **런타임** | React 19, Node.js |
| **데이터베이스** | PostgreSQL (Supabase 호스팅) |
| **ORM** | Prisma (스키마 마이그레이션 & 타입 안전 쿼리) |
| **배포** | Vercel (서버리스 함수 아키텍처) |
| **인증** | `iron-session` (암호화된 쿠키 기반 관리자 세션) |
| **이미지 호스팅** | ImgBB (무료 이미지 업로드 API) |
| **알림** | Discord Webhook (Embed 형식) |
| **모니터링** | UptimeRobot (DB 휴면 방지용 핑) |
| **도메인** | `https://gdrmcl.vercel.app` |

---

## 2. 기술 아키텍처 & 핵심 로직

### 2.1 "Top 200" 제약 조건
데이터베이스는 **항상 정확히 200개의 행(rank 1~200)**을 유지해야 합니다.
- **빈 슬롯:** `name: "--"`인 행은 아직 등재되지 않은 순위의 플레이스홀더입니다.
- **화면 표시:** `HomeClient.tsx`에서 `--` 플레이스홀더를 필터링하여 사용자에게는 실제 등재된 레벨만 보여줍니다.

### 2.2 순위 이동 (Two-Phase SQL 전략)
삽입/삭제 시 하위 순위를 모두 이동시켜야 합니다. PostgreSQL의 `rank` 컬럼에 걸린 `@unique` 제약 조건 때문에 일반적인 `updateMany`나 for-loop는 실패합니다.

- **문제점:** Vercel 서버리스 함수는 10~60초 타임아웃이 있어 순차 업데이트 시 `P2028 Transaction Timeout` 발생.
- **해결책:** **Two-Phase Raw SQL Shifting (임시 공간 대피 전략)**
  1. **Phase A (Safety Buffer):** 대상 행들의 rank에 `+10000`을 더해 1~200 범위 밖으로 대피시킴 → Unique 충돌 방지.
  2. **Phase B (Re-entry):** 대피한 행들을 `rank - 10000 + 1` (삽입) 또는 `rank - 10000 - 1` (삭제)로 최종 위치에 복귀.
- **구현 위치:** `src/app/api/levels/route.ts` (POST), `[id]/route.ts` (PUT/DELETE) — `prisma.$executeRawUnsafe` 사용.

### 2.3 이미지 처리 (ImgBB 연동)
Supabase 무료 티어 용량 제한을 지키기 위해 **대용량 Base64 문자열을 DB에 직접 저장하지 않습니다.**
1. 관리자 UI에서 이미지 파일/URL을 입력받음.
2. 파일이면 클라이언트에서 Base64로 변환 후 API에 전송.
3. 서버에서 `uploadToImgBB` (`src/lib/imgbb.ts`)를 호출하여 ImgBB에 업로드.
4. 반환된 `i.ibb.co` URL만 DB의 `imageUrl` 컬럼에 저장.

---

## 3. Discord Webhook 알림 시스템

### 3.1 구현 상세
리더보드가 변경될 때마다 Discord 커뮤니티에 자동 알림을 보냅니다.
- **유틸리티:** `src/lib/discord.ts` → `sendDiscordWebhook` 함수.
- **형식:** Discord Embed (리치 텍스트) 사용.
  - **색상 코딩:** Cyan(삽입), Gold/Amber(수정/이동), Red(삭제).

### 3.2 [CRITICAL] 서버리스 실행 규칙
Vercel은 응답이 전송되는 **즉시** 모든 백그라운드 프로세스를 종료합니다.
- **규칙:** `sendDiscordWebhook` 호출 시 **반드시 `await`를 사용**해야 합니다.
- **이유:** `await` 없이 비동기로 보내면, Vercel 서버리스 함수가 Discord 요청이 완료되기 전에 종료되어 **알림이 전송되지 않습니다.**

### 3.3 환경 변수 설정
`DISCORD_WEBHOOK_URL`에 저장된 URL은 순수한 URL 문자열이어야 합니다. Vercel 대시보드에서 **따옴표나 공백을 포함하지 마세요** — Discord API에서 `401 Unauthorized` 에러가 발생합니다.

---

## 4. 관리자 대시보드 보안
- **접근:** `ADMIN_PASSWORD` 환경 변수에 저장된 비밀번호로 보호.
- **Rate Limiting:** `/api/auth/login` 라우트에 IP 기반 속도 제한 적용.
- **추적:** Prisma의 `RateLimit` 테이블에서 실패한 시도를 추적하여 무차별 대입 공격 방어.
- **잠금:** 5회 실패 시 10분간 해당 IP 잠금.
- **비밀번호 보기:** 로그인 페이지에 Eye/EyeOff 토글 버튼이 있어 입력한 비밀번호를 확인할 수 있음.

---

## 5. UI/UX 아키텍처

### 5.1 레이아웃 구조
- **Header (`src/components/layout/Header.tsx`):** 상단 고정(sticky) 네비게이션. 로고, 데스크탑 메뉴, 검색 버튼, 관리자 링크, 모바일 햄버거 메뉴 포함.
- **Footer (`src/components/layout/Footer.tsx`):** 하단 링크 모음, 저작권 표시.
- **Layout (`src/app/layout.tsx`):** 전체 페이지 구조. Header와 Footer를 감싸는 루트 레이아웃.

### 5.2 모바일 메뉴 (햄버거 메뉴)
- **구현 방식:** 모달 오버레이 형태. `<header>` 요소 **바깥**에 위치하여 `backdrop-filter` 스태킹 컨텍스트 문제를 방지.
- **배경:** `backdrop-blur-md bg-black/50`로 블러 처리된 반투명 배경.
- **닫기:** X 버튼 클릭 또는 배경 오버레이 클릭 시 닫힘.
- **주의사항:** 모달이 `<header>` 안에 있으면 `backdrop-blur`로 인한 CSS stacking context 문제로 전체 화면을 덮지 못함. 반드시 `<header>` 바깥에 렌더링해야 함.

### 5.3 검색 모달 (`src/components/layout/SearchModal.tsx`)
- **기능:** 레벨 이름으로 검색 → 결과 클릭 시 해당 레벨 카드로 스크롤 이동 + 하이라이트 애니메이션.
- **ESC 키로 닫기:** `useEffect` 내에서 키보드 이벤트 리스너 등록.
- **데이터 로딩:** 모달이 열릴 때 `/api/levels`에서 데이터를 가져옴.

### 5.4 배경 스크롤 잠금 (Body Scroll Lock)
- **중요:** 모바일 메뉴 또는 검색 모달이 열려있는 동안 배경 페이지의 스크롤을 차단함.
- **구현 위치:** `Header.tsx`의 단일 `useEffect`에서 `isMobileMenuOpen`과 `isSearchOpen` 두 상태를 **함께 감시**.
- **주의사항:** 두 곳(Header + SearchModal)에서 각각 `document.body.style.overflow`를 제어하면 **레이스 컨디션**이 발생하여 모달을 닫아도 스크롤이 영구적으로 잠기는 버그가 생김. 반드시 **한 곳에서만 통합 관리**해야 함.
- **복원값:** `""` (빈 문자열)을 사용. `"unset"` 대신 빈 문자열을 써야 브라우저 기본값으로 정상 복원됨.

### 5.5 레벨 카드 (`HomeClient.tsx`)
- **모드 1 (리스트 뷰):** 이미지 왼쪽, 텍스트 오른쪽 배치. ID 배지는 우측 상단에 위치.
- **모드 2 (대형 카드 뷰):** 이미지가 크게 중앙 배치, 텍스트는 하단. ID 배지는 우측 하단에 위치.
- **ID 복사 기능:** 레벨 ID 배지 클릭 시 클립보드에 복사되며 시각적 피드백 제공.

---

## 6. 기록 제출 시스템 (`src/app/submit/page.tsx`)
- **기능:** 일반 사용자가 자신의 클리어 기록을 관리자에게 제출할 수 있는 폼.
- **필수 입력:** 레벨 이름, Publisher, Level ID (숫자 8자리 이상), Video URL (YouTube/Google Drive만 허용).
- **선택 입력:** 썸네일 이미지 (JPG/PNG/WebP, 2MB 이하).
- **쿨다운:** 제출 후 5분간 재제출 방지 (localStorage 기반 클라이언트 측 제한).
- **제출 데이터 흐름:** 클라이언트 → `/api/submissions` → DB 저장 → 관리자 대시보드에서 확인.

---

## 7. 유지보수 프로토콜

### 7.1 Supabase 비활성화 방지 (중요)
Supabase 무료 티어 프로젝트는 **7일간 비활성 시 자동 일시정지**됩니다.
- **예방:** UptimeRobot 등의 외부 모니터링 서비스로 `https://gdrmcl.vercel.app`에 수분마다 핑을 보내 DB를 활성 상태로 유지.

### 7.2 배포 워크플로우
- **코드 접근:** AI는 로컬 파일만 볼 수 있음.
- **[CRITICAL INSTRUCTION] 배포 방식:** 이 프로젝트는 Vercel에 연동되어 자동 배포되지만, 로컬 환경에서 직접 `git push`를 사용하지 않습니다.
- **Protocol:** 코드를 수정한 후 AI는 사용자에게 다음 방식으로 배포하도록 안내해야 합니다:
  1. 깃허브(GitHub) 웹사이트의 해당 저장소로 이동합니다.
  2. "Add file" -> "Upload files" 메뉴를 클릭합니다.
  3. 로컬에서 변경된 파일(`C:\Users\user\Desktop\gdroom\...`)을 드래그 앤 드롭하여 깃허브 웹에서 직접 업로드 및 커밋(Commit)합니다.
- **Vercel Sync:** 깃허브 웹에서 파일 업로드가 완료되면 Vercel이 이를 감지하여 라이브 사이트에 자동 배포합니다. 환경변수 변경 시에만 Vercel 대시보드에서 수동 재배포가 필요합니다.

### 7.3 도메인 관리
- **현재 도메인:** `https://gdrmcl.vercel.app`
- **이전 도메인:** `https://gdroom.vercel.app` (삭제됨, 더 이상 사용하지 않음)
- **Vercel 도메인 설정:** Vercel 대시보드 → Settings → Domains에서 관리.
- **UptimeRobot 주소도 새 도메인으로 업데이트 필요.**

---

## 8. 환경 변수 목록

| 변수명 | 설명 | 위치 |
|---|---|---|
| `ADMIN_PASSWORD` | 관리자 로그인 비밀번호 | Vercel + .env |
| `SESSION_SECRET` | iron-session 암호화 키 (32자 이상) | Vercel + .env |
| `DATABASE_URL` | Supabase PostgreSQL 연결 문자열 (pgbouncer) | Vercel + .env |
| `DIRECT_URL` | Supabase PostgreSQL 직접 연결 (마이그레이션용) | Vercel + .env |
| `IMGBB_API_KEY` | ImgBB 이미지 업로드 API 키 | Vercel + .env |
| `DISCORD_WEBHOOK_URL` | Discord 알림 Webhook URL | Vercel + .env |

---

## 9. 주요 파일 인덱스

### 프론트엔드 (클라이언트)
| 파일 | 역할 |
|---|---|
| `src/app/layout.tsx` | 루트 레이아웃 (Header + Footer 감싸기, 메타데이터) |
| `src/app/page.tsx` | 서버 컴포넌트. Prisma로 DB 조회 후 HomeClient에 전달 (ISR 60초) |
| `src/app/HomeClient.tsx` | 메인 공개 리스트 UI. LevelCard, SectionDivider 포함 |
| `src/app/submit/page.tsx` | 기록 제출 폼 (유효성 검사, 쿨다운, 이미지 압축) |
| `src/app/admin/page.tsx` | 관리자 대시보드 메인 (레벨 관리, 제출 기록 확인) |
| `src/app/admin/login/page.tsx` | 관리자 로그인 페이지 (비밀번호 보기 토글 포함) |

### 레이아웃 컴포넌트
| 파일 | 역할 |
|---|---|
| `src/components/layout/Header.tsx` | 상단 네비게이션, 모바일 메뉴, 스크롤 잠금 통합 관리 |
| `src/components/layout/Footer.tsx` | 하단 푸터 (링크, 저작권) |
| `src/components/layout/SearchModal.tsx` | 레벨 검색 모달 (ESC 닫기, 스크롤 이동) |

### 관리자 컴포넌트
| 파일 | 역할 |
|---|---|
| `src/components/admin/LevelsTab.tsx` | 레벨 목록 탭 UI |
| `src/components/admin/SubmissionsTab.tsx` | 제출 기록 탭 UI |
| `src/components/admin/EditLevelModal.tsx` | 레벨 수정 모달 |
| `src/components/admin/InsertLevelModal.tsx` | 레벨 삽입 모달 |

### API 라우트 (서버)
| 파일 | 역할 |
|---|---|
| `src/app/api/levels/route.ts` | GET(전체 조회), POST(중간 삽입 + Two-Phase Shift) |
| `src/app/api/levels/[id]/route.ts` | PUT(수정), DELETE(삭제 + Two-Phase Shift) |
| `src/app/api/auth/login/route.ts` | 로그인 처리 + Rate Limiting |
| `src/app/api/auth/check/route.ts` | 인증 상태 확인 |
| `src/app/api/auth/logout/route.ts` | 로그아웃 처리 |
| `src/app/api/submissions/route.ts` | 기록 제출 처리 |
| `src/app/api/upload/route.ts` | 이미지 업로드 처리 |

### 유틸리티 & 설정
| 파일 | 역할 |
|---|---|
| `src/lib/prisma.ts` | Prisma 클라이언트 싱글톤 |
| `src/lib/session.ts` | iron-session 세션 설정 (쿠키명: `gdrmcl-admin-session`) |
| `src/lib/discord.ts` | Discord Webhook 전송 유틸리티 |
| `src/lib/imgbb.ts` | ImgBB 이미지 업로드 유틸리티 |
| `prisma/schema.prisma` | 데이터베이스 모델 정의 |

---

## 10. 알려진 주의사항 & 과거 버그

### 10.1 CSS 스태킹 컨텍스트 (Stacking Context)
`backdrop-blur`가 적용된 요소 내부에 `position: fixed` 요소를 넣으면, fixed 포지셔닝이 해당 요소 기준으로 동작하여 전체 화면을 덮지 못함. 모바일 메뉴 오버레이가 `<header>` 밖에 있어야 하는 이유.

### 10.2 Body Scroll Lock 레이스 컨디션
두 개의 독립된 `useEffect`에서 각각 `document.body.style.overflow`를 제어하면, 한쪽의 cleanup 함수가 다른 쪽의 설정을 덮어써서 스크롤이 영구적으로 잠기는 버그 발생. **반드시 한 곳에서 통합 관리할 것.**

### 10.3 Rate Limit 잠금
관리자 비밀번호를 5회 이상 틀리면 10분간 해당 IP가 잠김. DB의 `RateLimit` 테이블에서 해당 레코드를 삭제하면 즉시 해제 가능.

---

*이 가이드는 코드 품질과 시스템 안정성을 보장합니다. 위 패턴을 엄격히 따르세요.*
