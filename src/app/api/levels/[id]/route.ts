import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { uploadToImgBB } from "@/lib/imgbb";

export const dynamic = "force-dynamic";

// PUT: 레벨 정보 또는 순위 수정 (Rank 이동 처리 포함)
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session.isAdmin) {
            return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
        }

        const { id } = await params;
        const levelId = parseInt(id);
        const body = await req.json();
        const { name, creator, verifier, rank, imageUrl } = body;

        const result = await prisma.$transaction(async (tx: any) => {
            const targetLevel = await tx.level.findUnique({ where: { id: levelId } });
            if (!targetLevel) {
                throw new Error("Target level not found");
            }

            let finalImageUrl = imageUrl;
            // Base64 데이터면 ImgBB에 업로드
            if (imageUrl && imageUrl.startsWith("data:image/")) {
                const uploadedUrl = await uploadToImgBB(imageUrl);
                if (!uploadedUrl) {
                    throw new Error("이미지 서버 업로드에 실패했습니다.");
                }
                finalImageUrl = uploadedUrl;
            }

            // 0. 정보 비우기(Clear) 액션 처리
            if (body.action === "clear") {
                const cleared = await tx.level.update({
                    where: { id: levelId },
                    data: {
                        name: "--",
                        creator: "--",
                        verifier: "--",
                        imageUrl: null,
                    },
                });
                return cleared;
            }

            const oldRank = targetLevel.rank;

            // 1. 순위 변경이 발생하는 경우 (Shift 알고리즘)
            if (rank !== undefined && rank !== oldRank) {
                const newRank = Math.max(1, Math.min(200, rank)); // 1~200 제한

                // 1) 목표 맵을 임시로 제외 (Unique 제약 우회)
                await tx.level.update({
                    where: { id: levelId },
                    data: { rank: -999 },
                });

                // [AI ANALYSIS NOTE - CRITICAL ARCHITECTURE]
                // 특정 레벨의 순위를 변경할 때 나머지 레벨들의 순위를 연쇄적으로 당기거나 미는 로직입니다.
                // POST의 중간 삽입과 마찬가지로 PostgreSQL의 Unique 제약 조건을 피하기 위해 TEMP_OFFSET을 통한 
                // Two-Phase Shift 방식을 사용해야만 Transaction Error(P2028 및 P2002)를 방지할 수 있습니다.
                const TEMP_OFFSET = 10000;

                if (newRank < oldRank) {
                    // [순위 상승] 목표 맵이 위로 감 -> 기존에 위에 있던 맵들은 아래로 한 칸씩 밀려남 (+1)
                    // Two-Phase Shift: 임시로 10000을 더해 대피시킨 후, 본래 위치에서 +1로 복귀 처리
                    await tx.$executeRawUnsafe(
                        `UPDATE "Level" SET rank = rank + $1 WHERE rank >= $2 AND rank < $3`,
                        TEMP_OFFSET, newRank, oldRank
                    );
                    await tx.$executeRawUnsafe(
                        `UPDATE "Level" SET rank = rank - $1 + 1 WHERE rank >= $2 AND rank < $3`,
                        TEMP_OFFSET, TEMP_OFFSET + newRank, TEMP_OFFSET + oldRank
                    );
                } else if (newRank > oldRank) {
                    // [순위 하락] 목표 맵이 아래로 감 -> 기존에 아래에 있던 맵들은 위로 한 칸씩 당겨짐 (-1)
                    // Two-Phase Shift: 임시로 10000을 더해 대피시킨 후, 본래 위치에서 -1로 복귀 처리
                    await tx.$executeRawUnsafe(
                        `UPDATE "Level" SET rank = rank + $1 WHERE rank > $2 AND rank <= $3`,
                        TEMP_OFFSET, oldRank, newRank
                    );
                    await tx.$executeRawUnsafe(
                        `UPDATE "Level" SET rank = rank - $1 - 1 WHERE rank > $2 AND rank <= $3`,
                        TEMP_OFFSET, TEMP_OFFSET + oldRank, TEMP_OFFSET + newRank
                    );
                }

                const updated = await tx.level.update({
                    where: { id: levelId },
                    data: {
                        rank: newRank,
                        name: name !== undefined ? name : targetLevel.name,
                        creator: creator !== undefined ? creator : targetLevel.creator,
                        verifier: verifier !== undefined ? verifier : targetLevel.verifier,
                        imageUrl: finalImageUrl !== undefined ? finalImageUrl : targetLevel.imageUrl,
                    },
                });
                return updated;
            }

            // 2. 순위 변경이 없는 일반 수정
            const updateData: any = {};
            if (name !== undefined) updateData.name = name;
            if (creator !== undefined) updateData.creator = creator;
            if (verifier !== undefined) updateData.verifier = verifier;
            if (finalImageUrl !== undefined) updateData.imageUrl = finalImageUrl;

            const updated = await tx.level.update({
                where: { id: levelId },
                data: updateData,
            });
            return updated;
        });

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("PUT Error:", error);
        if (error.message === "Target level not found") {
            return NextResponse.json({ error: "레벨을 찾을 수 없습니다." }, { status: 404 });
        }
        return NextResponse.json({ error: error.message || "레벨 수정에 실패했습니다." }, { status: 500 });
    }
}

// DELETE: 레벨 영구 삭제 후 하위 순위 연쇄적으로 당겨오기
export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session.isAdmin) {
            return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
        }

        const { id } = await params;
        const levelId = parseInt(id);

        await prisma.$transaction(async (tx: any) => {
            const targetLevel = await tx.level.findUnique({ where: { id: levelId } });
            if (!targetLevel) {
                throw new Error("Delete target not found");
            }

            const deletedRank = targetLevel.rank;

            // 1. 삭제
            await tx.level.delete({ where: { id: levelId } });

            // 2. 당기기
            const affectedLevels = await tx.level.findMany({
                where: { rank: { gt: deletedRank } },
                orderBy: { rank: "asc" },
            });

            for (const level of affectedLevels) {
                await tx.level.update({
                    where: { id: level.id },
                    data: { rank: level.rank - 1 },
                });
            }

            // 3. 200위 채우기
            await tx.level.create({
                data: {
                    rank: 200,
                    name: "--",
                    creator: "--",
                    verifier: "--",
                    imageUrl: null,
                },
            });
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("DELETE Error:", error);
        if (error.message === "Delete target not found") {
            return NextResponse.json({ error: "삭제할 레벨이 없습니다." }, { status: 404 });
        }
        return NextResponse.json({ error: error.message || "레벨 삭제에 실패했습니다." }, { status: 500 });
    }
}
