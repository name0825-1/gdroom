import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { uploadToImgBB } from "@/lib/imgbb";

export const dynamic = "force-dynamic";

// GET: 모든 레벨 가져오기 (공개 API / Public API to fetch all levels)
// 순위(rank) 오름차순으로 정렬하여 반환합니다.
export async function GET() {
    try {
        const levels = await prisma.level.findMany({
            orderBy: { rank: "asc" }, // 1위부터 올림차순 정렬 (Sort ascending by rank)
        });
        return NextResponse.json(levels);
    } catch {
        return NextResponse.json({ error: "데이터를 불러올 수 없습니다." }, { status: 500 });
    }
}

// POST: 새로운 레벨 중간 삽입 (관리자 전용 / Admin only: Insert new level at specific rank)
export async function POST(req: Request) {
    try {
        // 관리자 권한 검증 (Verify admin role)
        const session = await getSession();
        if (!session.isAdmin) {
            return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
        }

        const body = await req.json();
        const { name, creator, verifier, rank, imageUrl } = body;
        const targetRank = parseInt(rank);

        // 유효성 검사 (Validation: Rank must be 1~200)
        if (isNaN(targetRank) || targetRank < 1 || targetRank > 200) {
            return NextResponse.json({ error: "유효하지 않은 순위입니다. (1~200)" }, { status: 400 });
        }

        let finalImageUrl = imageUrl || null;

        // Base64 데이터면 ImgBB에 업로드
        if (imageUrl && imageUrl.startsWith("data:image/")) {
            const uploadedUrl = await uploadToImgBB(imageUrl);
            if (!uploadedUrl) {
                return NextResponse.json(
                    { error: "이미지 서버 업로드에 실패했습니다." },
                    { status: 500 }
                );
            }
            finalImageUrl = uploadedUrl;
        }

        // 트랜잭션 처리 (Transaction: Ensure atomic rank shifting and insertion)
        return await prisma.$transaction(async (tx: any) => {
            // STEP 1. 200위 레벨을 삭제하여 공간 확보 (최대 200개 유지 / Maintain max 200 cap limits)
            const levelAt200 = await tx.level.findUnique({ where: { rank: 200 } });
            if (levelAt200) {
                await tx.level.delete({ where: { id: levelAt200.id } });
            }

            // STEP 2. 삽입할 위치부터 199위까지의 레벨들을 한 칸씩 뒤로 밀기 (Push Down Shift logic)
            // 충돌 방지를 위해 역순(desc)으로 업데이트
            const affectedLevels = await tx.level.findMany({
                where: { rank: { gte: targetRank, lt: 200 } },
                orderBy: { rank: "desc" },
            });

            for (const level of affectedLevels) {
                await tx.level.update({
                    where: { id: level.id },
                    data: { rank: level.rank + 1 },
                });
            }

            // 3. 비어있는 순위에 새 레벨 생성
            const newLevel = await tx.level.create({
                data: {
                    rank: targetRank,
                    name: name || "--",
                    creator: creator || "--",
                    verifier: verifier || "--",
                    imageUrl: finalImageUrl,
                },
            });

            return NextResponse.json(newLevel, { status: 201 });
        });
    } catch (error) {
        console.error("POST Insert Error:", error);
        return NextResponse.json({ error: "레벨 추가에 실패했습니다." }, { status: 500 });
    }
}
