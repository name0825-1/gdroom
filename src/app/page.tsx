import { prisma } from "@/lib/prisma";
import HomeClient from "./HomeClient";

export default async function Home() {
  const levels = await prisma.level.findMany({
    orderBy: { rank: "asc" },
  });

  return <HomeClient levels={levels} />;
}
