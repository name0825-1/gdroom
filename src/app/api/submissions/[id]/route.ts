import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH: 제출 기록 읽음 처리
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);
        if (isNaN(id)) {
            return NextResponse.json({ error: "유효하지 않은 ID" }, { status: 400 });
        }

        const body = await request.json();
        const submission = await prisma.submission.update({
            where: { id },
            data: { isRead: body.isRead ?? true },
        });

        return NextResponse.json(submission);
    } catch (error) {
        console.error("Failed to update submission:", error);
        return NextResponse.json(
            { error: "업데이트에 실패했습니다." },
            { status: 500 }
        );
    }
}

// DELETE: 제출 기록 삭제 (처리 완료 후)
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);
        if (isNaN(id)) {
            return NextResponse.json({ error: "유효하지 않은 ID" }, { status: 400 });
        }

        await prisma.submission.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete submission:", error);
        return NextResponse.json(
            { error: "삭제에 실패했습니다." },
            { status: 500 }
        );
    }
}
