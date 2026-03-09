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

                if (newRank < oldRank) {
                    // [순위 상승] 목표 맵이 위로 감 -> 중간 맵들은 한 칸씩 아래로 밀려남
                    const affectedLevels = await tx.level.findMany({
                        where: { rank: { gte: newRank, lt: oldRank } },
                        orderBy: { rank: "desc" },
                    });

                    for (const level of affectedLevels) {
                        await tx.level.update({
                            where: { id: level.id },
                            data: { rank: level.rank + 1 },
                        });
                    }
                } else if (newRank > oldRank) {
                    // [순위 하락] 목표 맵이 아래로 감 -> 중간 맵들은 한 칸씩 위로 당겨짐
                    const affectedLevels = await tx.level.findMany({
                        where: { rank: { gt: oldRank, lte: newRank } },
                        orderBy: { rank: "asc" },
                    });

                    for (const level of affectedLevels) {
                        await tx.level.update({
                            where: { id: level.id },
                            data: { rank: level.rank - 1 },
                        });
                    }
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
