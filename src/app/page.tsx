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
