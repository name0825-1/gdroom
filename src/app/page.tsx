/**
 * 메인 페이지 서버 컴포넌트 (page.tsx)
 * 
 * [개요]
 * Next.js App Router의 서버 컴포넌트로, Prisma를 통해 DB에서 레벨 데이터를 직접 조회합니다.
 * 조회된 데이터는 HomeClient(클라이언트 컴포넌트)에 props로 전달하여 렌더링합니다.
 * 
 * [AI ANALYSIS NOTE - ISR (Incremental Static Regeneration) 전략]
 * revalidate = 60은 Vercel에서 이 페이지를 60초마다 재생성하도록 지시합니다.
 * 이를 통해:
 * - 사용자 100명이 1분 안에 접속해도 DB 쿼리는 1번만 실행됨
 * - Supabase 무료 티어의 데이터 전송량(월 500MB)을 대폭 절약
 * - 관리자가 데이터를 수정하면 최대 60초 안에 메인 페이지에 반영됨
 * 
 * [에러 핸들링]
 * DB 연결 실패(예: Supabase 일시정지) 시 빈 배열을 전달하여
 * 오류 폭포(Error Cascade)로 전체 페이지가 다운되는 것을 방지합니다.
 * 사용자에게는 빈 리스트가 표시되고, error.tsx 바운더리가 잡습니다.
 */
import { prisma } from "@/lib/prisma";
import HomeClient from "./HomeClient";

// ISR: 60초마다 데이터를 갱신 (DB 쿼리를 매 요청마다 하지 않아 전송량 절약)
export const revalidate = 60;

export default async function Home() {
  try {
    const levels = await prisma.level.findMany({
      orderBy: { rank: "asc" },
    });

    return <HomeClient levels={levels} />;
  } catch (error) {
    console.error("Database connection or query failed:", error);
    // 데이터베이스 에러 발생 시 전체 페이지 다운을 막기 위해 빈 데이터 전달
    return <HomeClient levels={[]} />;
  }
}
