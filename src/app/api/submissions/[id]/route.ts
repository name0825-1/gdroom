/**
 * 제출 기록 개별 관리 API (PATCH / DELETE)
 *
 * [개요]
 * 관리자가 제출된 기록을 관리하는 API입니다.
 * - PATCH: 제출을 "읽음" 상태로 변경 (대시보드에서 미읽음 뱃지 표시 제거)
 * - DELETE: 처리 완료된 제출 기록을 DB에서 영구 삭제
 *
 * [호출 위치]
 * - admin/page.tsx의 handleCopyInfo() → PATCH 호출 (정보 복사 시 자동 읽음 처리)
 * - admin/page.tsx의 handleDeleteSubmission() → DELETE 호출 (삭제 버튼 클릭)
 *
 * [보안]
 * 두 메서드 모두 관리자 세션 인증 필수 (getSession().isAdmin)
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// PATCH: 제출 기록 읽음 처리 (관리자가 "정보 복사" 버튼을 누르면 자동 호출)
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // 관리자 권한 검증 (Admin authentication check)
        const session = await getSession();
        if (!session.isAdmin) {
            return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
        }

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
        // 관리자 권한 검증 (Admin authentication check)
        const session = await getSession();
        if (!session.isAdmin) {
            return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
        }

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
