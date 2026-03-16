/**
 * iron-session 세션 관리 모듈
 * 
 * [개요]
 * 관리자 인증 상태를 쿠키 기반으로 안전하게 관리하는 유틸리티입니다.
 * iron-session은 세션 데이터를 서버 측에서 암호화하여 HTTP-only 쿠키에 저장합니다.
 * 
 * [보안 아키텍처]
 * - 세션 데이터(isAdmin 플래그)는 SESSION_SECRET 키로 AES-256 암호화됨
 * - 쿠키는 httpOnly=true 설정으로 클라이언트 JavaScript에서 접근 불가 (XSS 공격 방어)
 * - sameSite="lax" 설정으로 CSRF(교차 사이트 요청 위조) 공격 방어
 * - 프로덕션에서는 secure=true 설정으로 HTTPS 연결에서만 쿠키 전송
 * 
 * [세션 흐름]
 * 1. 로그인 성공: session.isAdmin = true → session.save() → 암호화된 쿠키가 브라우저에 저장
 * 2. 인증 확인: getSession() → 쿠키에서 세션 복호화 → isAdmin 값 확인
 * 3. 로그아웃: session.destroy() → 쿠키 삭제
 * 
 * [환경 변수]
 * - SESSION_SECRET: 세션 암호화 키 (32자 이상의 랜덤 문자열 필수)
 *   짧은 키를 사용하면 iron-session이 런타임 에러를 발생시킵니다.
 * 
 * [주의사항]
 * - fallback-secret-key는 개발 환경 전용입니다. 프로덕션에서는 반드시 환경변수를 설정하세요.
 * - 쿠키명 "gdrmcl-admin-session"은 브라우저 DevTools > Application > Cookies에서 확인 가능합니다.
 */

import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";

// 세션에 저장되는 데이터의 타입 정의
export interface SessionData {
    isAdmin: boolean; // 관리자 여부를 판단하는 핵심 플래그
}

/**
 * 현재 요청의 세션을 가져오는 유틸리티 함수
 * 
 * Next.js의 `cookies()` API를 사용하여 요청에 포함된 쿠키를 읽고,
 * iron-session이 해당 쿠키를 복호화하여 세션 객체를 반환합니다.
 * 
 * @returns IronSession<SessionData> - 세션 객체 (isAdmin 등의 데이터 포함)
 * 
 * [사용 예시]
 * ```ts
 * const session = await getSession();
 * if (!session.isAdmin) {
 *     return NextResponse.json({ error: "권한 없음" }, { status: 403 });
 * }
 * ```
 */
export async function getSession(): Promise<IronSession<SessionData>> {
    const cookieStore = await cookies();
    return getIronSession<SessionData>(cookieStore, {
        // 세션 암호화 비밀 키 - 32자 이상이어야 iron-session이 정상 작동
        // 환경변수 미설정 시 fallback 키를 사용하되, 프로덕션에서는 절대 사용 금지
        password: process.env.SESSION_SECRET || "fallback-secret-key-that-is-at-least-32-characters-long",
        // 쿠키 이름 - 브라우저에 저장되는 실제 쿠키명
        cookieName: "gdrmcl-admin-session",
        cookieOptions: {
            secure: process.env.NODE_ENV === "production", // HTTPS에서만 쿠키 전송 (프로덕션)
            httpOnly: true,          // 클라이언트 JS에서 document.cookie로 접근 차단 (XSS 방어)
            sameSite: "lax",         // 같은 사이트 요청에서만 쿠키 전송 (CSRF 방어)
            maxAge: 60 * 60 * 24 * 7, // 세션 만료 시간: 7일 (7 * 24시간 * 60분 * 60초)
        },
    });
}
