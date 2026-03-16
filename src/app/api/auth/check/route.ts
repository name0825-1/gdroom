/**
 * 관리자 인증 상태 확인 API
 *
 * [개요]
 * 클라이언트(admin/page.tsx)가 페이지 로드 시 이 API를 호출하여
 * 현재 세션이 관리자 인증 상태인지 확인합니다.
 * isAdmin이 false이면 로그인 페이지(/admin/login)로 리다이렉트됩니다.
 *
 * [AI ANALYSIS NOTE]
 * session.isAdmin === true로 명시적 비교하는 이유:
 * iron-session이 빈 세션을 반환할 때 isAdmin이 undefined일 수 있으므로
 * 단순 truthy 체크가 아닌 엄격한 비교를 사용합니다.
 */
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
    const session = await getSession();
    return NextResponse.json({ isAdmin: session.isAdmin === true });
}
