import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

// IP 기반 실패 횟수 추적 맵 (메모리 저장소)
const failedAttempts = new Map<string, { count: number; lockedUntil: number | null }>();
const MAX_ATTEMPTS = 5; // 최대 실패 허용 횟수
const LOCK_TIME_MS = 10 * 60 * 1000; // 10분 잠금

export async function POST(req: Request) {
    try {
        const { password } = await req.json();

        // 클라이언트 IP 암묵적 추출 (보안 방어용)
        const forwardedFor = req.headers.get("x-forwarded-for");
        const realIp = req.headers.get("x-real-ip");
        const ip = forwardedFor ? forwardedFor.split(',')[0] : (realIp || "unknown_ip");

        // IP 잠금 상태 확인
        const attemptRecord = failedAttempts.get(ip);
        const now = Date.now();

        if (attemptRecord) {
            if (attemptRecord.lockedUntil && attemptRecord.lockedUntil > now) {
                const remainingMinutes = Math.ceil((attemptRecord.lockedUntil - now) / 60000);
                return NextResponse.json({
                    error: `로그인 시도가 너무 많습니다. 보안을 위해 ${remainingMinutes}분 후 다시 시도해주세요.`
                }, { status: 429 });
            }
            // 잠금 시간이 지났으면 초기화
            if (attemptRecord.lockedUntil && attemptRecord.lockedUntil <= now) {
                failedAttempts.delete(ip);
            }
        }

        if (!password) {
            return NextResponse.json({ error: "비밀번호를 입력하세요." }, { status: 400 });
        }

        const adminPassword = process.env.ADMIN_PASSWORD;
        if (!adminPassword) {
            return NextResponse.json({ error: "서버 설정 오류" }, { status: 500 });
        }

        if (password !== adminPassword) {
            // 실패 카운트 증가 로직
            const currentRecord = failedAttempts.get(ip) || { count: 0, lockedUntil: null };
            currentRecord.count += 1;

            if (currentRecord.count >= MAX_ATTEMPTS) {
                currentRecord.lockedUntil = now + LOCK_TIME_MS;
                failedAttempts.set(ip, currentRecord);
                return NextResponse.json({
                    error: "5회 이상 틀려 보안 잠금이 활성화되었습니다. 10분 후 다시 시도해주세요."
                }, { status: 429 });
            }

            failedAttempts.set(ip, currentRecord);
            return NextResponse.json({
                error: `비밀번호가 일치하지 않습니다. (남은 시도 횟수: ${MAX_ATTEMPTS - currentRecord.count}회)`
            }, { status: 401 });
        }

        // 로그인 성공 시 해당 IP의 실패 기록 삭제
        failedAttempts.delete(ip);

        const session = await getSession();
        session.isAdmin = true;
        await session.save();

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
    }
}
