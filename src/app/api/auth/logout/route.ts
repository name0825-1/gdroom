/**
 * 관리자 로그아웃 API
 *
 * [개요]
 * 관리자 세션을 파괴하여 로그아웃 처리합니다.
 * session.destroy()는 iron-session의 암호화된 쿠키를 삭제하여
 * 이후 요청에서 인증 상태가 해제됩니다.
 *
 * [호출 위치]
 * - admin/page.tsx의 로그아웃 버튼 클릭 시 호출
 * - POST 메서드만 허용 (GET으로 실수로 호출되는 것 방지)
 */
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function POST() {
    const session = await getSession();
    session.destroy();
    return NextResponse.json({ success: true });
}
