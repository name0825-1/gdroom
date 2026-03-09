import { PrismaClient } from "@prisma/client";

// Next.js의 Hot Reloading 과정에서 PrismaClient 인스턴스가 무한 증식하는 것을 방지하기 위한 전역 변수 설정
// Prevents PrismaClient from instantiating multiple times during Next.js Hot Reloading in development mode.
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

// 재사용 가능한 글로벌 Prisma 인스턴스 내보내기
export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });

// 개발 환경에서는 글로벌 인스턴스를 유지하여 재생성 방지 (Keep the global instance in dev environment)
if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
