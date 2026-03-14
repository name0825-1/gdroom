import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { uploadToImgBB } from "@/lib/imgbb";
import { sendDiscordWebhook } from "@/lib/discord";

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
        const { name, creator, verifier, rank, imageUrl, sendNotification } = body;
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

            // STEP 2. 삽입할 위치부터 199위까지의 레벨들을 안전하게 한 칸씩 뒤로 밀기 (Two-Phase Raw SQL Shift)
            // [AI ANALYSIS NOTE - CRITICAL ARCHITECTURE]
            // 이 부분은 레벨 중간 삽입 시 하위 순위들을 모두 +1 처리하는 핵심 로직입니다.
            // Prisma의 updateMany()나 for-loop 업데이트를 사용하지 않는 이유는 다음과 같습니다:
            // 1. for-loop: 199번의 개별 쿼리가 발생하여 Vercel Serverless 환경에서 P2028 Transaction Timeout 유발.
            // 2. updateMany: 단일 쿼리로 최적화되지만, PostgreSQL의 rank 컬럼에 걸린 @unique 제약 조건 때문에
            //    순차 업데이트 도중 일시적으로 순위가 겹치는 현상(Collision)이 발생하여 에러 통과 불가.
            // 
            // 해결책으로 'Two-Phase Shift (임시 공간 대피)' 전략을 사용합니다:
            // Phase A: 변경될 맵들의 순위에 임의의 아주 큰 수(+10000)를 더해 기존 1~200위 범위 밖으로 완전히 피신시킵니다.
            //          이렇게 하면 업데이트 중에 절대 기존 맵들과 Unique 제약 조건 충돌이 일어나지 않습니다.
            const TEMP_OFFSET = 10000;

            // Phase A: 대상 맵들을 안전한 곳(10000 밖)으로 임시 대피
            await tx.$executeRawUnsafe(
                `UPDATE "Level" SET rank = rank + $1 WHERE rank >= $2 AND rank < 200`,
                TEMP_OFFSET, targetRank
            );

            // Phase B: 피신해 있던 맵들의 임시 값을 빼줌과 동시에, 원래 맵이 이동했어야 할 목표지점(+1)으로 되돌려 놓습니다.
            // 공식: rank = rank - TEMP_OFFSET + 1
            await tx.$executeRawUnsafe(
                `UPDATE "Level" SET rank = rank - $1 + 1 WHERE rank >= $2 AND rank < $3`,
                TEMP_OFFSET,
                TEMP_OFFSET + targetRank,
                TEMP_OFFSET + 200
            );

            // STEP 3. 비어있는 순위에 새 레벨 생성
            const newLevel = await tx.level.create({
                data: {
                    rank: targetRank,
                    name: name || "--",
                    creator: creator || "--",
                    verifier: verifier || "--",
                    imageUrl: finalImageUrl,
                },
            });

            // 디스코드 알림 전송 (옵션 체크 시에만)
            if (sendNotification) {
                try {
                    // 비동기로 전송 (응답 지연 방지)
                    sendDiscordWebhook({
                        embeds: [{
                            title: `🎉 새로운 레벨이 등재되었습니다!`,
                            description: `**${newLevel.name}** 레벨이 **#${newLevel.rank}** 순위에 등록되었습니다.`,
                            color: 0x06b6d4, // Cyan-500
                            fields: [
                                { name: "Level ID", value: String(newLevel.verifier), inline: true },
                                { name: "Publisher", value: String(newLevel.creator), inline: true }
                            ],
                            thumbnail: newLevel.imageUrl ? { url: newLevel.imageUrl } : undefined,
                            footer: { text: "GDRMCL 등록 알림" },
                            timestamp: new Date().toISOString()
                        }]
                    }).catch(console.error); // 내부 에러 발생 시 로그만 남김 (클라이언트 응답에는 영향 없음)
                } catch (e) {
                    console.error("Discord notification error:", e);
                }
            }

            return NextResponse.json(newLevel, { status: 201 });
        });
    } catch (error) {
        console.error("POST Insert Error:", error);
        return NextResponse.json({ error: "레벨 추가에 실패했습니다." }, { status: 500 });
    }
}
