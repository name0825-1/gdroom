/**
 * Prisma 클라이언트 싱글톤 모듈
 * 
 * [개요]
 * 애플리케이션 전체에서 사용되는 단일 Prisma 인스턴스를 관리합니다.
 * Next.js의 개발 모드에서는 Hot Module Replacement(HMR) 때문에 파일이 변경될 때마다
 * 모듈이 다시 로드되어 PrismaClient가 무한히 생성될 수 있습니다.
 * 이를 방지하기 위해 globalThis에 인스턴스를 캐싱합니다.
 * 
 * [왜 싱글톤이 필요한가?]
 * - 각 PrismaClient 인스턴스는 DB에 대한 연결 풀(Connection Pool)을 유지합니다.
 * - 인스턴스가 무한히 생성되면 연결 풀이 고갈되어 DB 접속 불가 에러가 발생합니다.
 * - 특히 Supabase 무료 티어는 동시 연결 수가 제한되어 있어 이 문제가 더욱 심각합니다.
 * 
 * [환경별 동작]
 * - 개발(development): globalThis에 인스턴스 캐싱, 쿼리/에러/경고 로그 출력
 * - 프로덕션(production): 매번 새 인스턴스 생성 (서버리스는 요청마다 새 프로세스), 에러만 로깅
 * 
 * [DB 연결 관련 환경 변수]
 * - DATABASE_URL: Supabase PostgreSQL 연결 문자열 (pgbouncer 사용, 일반 쿼리용)
 * - DIRECT_URL: Supabase PostgreSQL 직접 연결 (Prisma 마이그레이션 전용)
 */

import { PrismaClient } from "@prisma/client";

// Next.js의 Hot Reloading 과정에서 PrismaClient 인스턴스가 무한 증식하는 것을 방지하기 위한 전역 변수 설정
// globalThis를 사용하여 Node.js 런타임 전체에서 단일 인스턴스를 공유합니다.
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

// 재사용 가능한 글로벌 Prisma 인스턴스 내보내기
// ?? (Nullish Coalescing): globalForPrisma.prisma가 없을 때만 새로 생성
export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        // 개발 환경에서는 실행되는 SQL 쿼리를 콘솔에 출력하여 디버깅 용이
        // 프로덕션에서는 에러만 출력하여 성능 최적화
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });

// 개발 환경에서는 글로벌 인스턴스를 유지하여 HMR 시 재생성 방지
// 프로덕션(Vercel 서버리스)에서는 각 요청이 독립된 프로세스이므로 캐싱 불필요
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
