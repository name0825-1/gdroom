import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
    isAdmin: boolean; // 관리자 여부를 판단하는 핵심 플래그 (Core flag to determine if the user is an admin)
}

// 쿠키 기반 서버사이드 세션을 가져오는 유틸리티 함수 (Utility function to get cookie-based server-side session)
// iron-session을 사용하여 관리자 인증 상태를 암호화하여 저장합니다.
export async function getSession(): Promise<IronSession<SessionData>> {
    const cookieStore = await cookies();
    return getIronSession<SessionData>(cookieStore, {
        // 환경 변수 기반 비밀번호 사용 (중요: 운영에서는 무조건 환경변수 사용 권장)
        password: process.env.SESSION_SECRET || "fallback-secret-key-that-is-at-least-32-characters-long",
        cookieName: "gdrmcl-admin-session",
        cookieOptions: {
            secure: process.env.NODE_ENV === "production", // HTTPS 환경에서만 쿠키 전송 (Production)
            httpOnly: true, // 클라이언트 JS에서 쿠키 접근 차단 (XSS 방어)
            sameSite: "lax", // CSRF 방어
            maxAge: 60 * 60 * 24 * 7, // 세션 만료 시간: 7일 (7 days expiration)
        },
    });
}
