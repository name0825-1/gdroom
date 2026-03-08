import { PrismaClient } from "@prisma/client";

// Prevents PrismaClient from instantiating multiple times during Next.js Hot Reloading
const globalForPrisma = globalThis as unknown as {
        prisma: PrismaClient | undefined;
};

// Export reusable global Prisma instance with logging configuration
export const prisma =
        globalForPrisma.prisma ??
        new PrismaClient({
                    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
        });

// Keep the global instance in dev environment
if (process.env.NODE_ENV !== "production") {
        globalForPrisma.prisma = prisma;
}
