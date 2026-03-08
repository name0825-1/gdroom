import { prisma } from "@/lib/prisma";
import HomeClient from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function Home() {
      try {
                const levels = await prisma.level.findMany({
                              orderBy: { rank: "asc" },
                });

          return <HomeClient levels={levels} />;
      } catch (error) {
                console.error("Database connection or query failed:", error);
                return <HomeClient levels={[]} />;
      }
}
