import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma"; // Added prisma

const MAX_ATTEMPTS = 5; // 최대 실패 허용 횟수
const LOCK_TIME_MS = 10 * 60 * 1000; // 10분 잠금

export async function POST(req: Request) {
    try {
        const { password } = await req.json();

        // [AI ANALYSIS NOTE - Rate Limiting 메커니즘]
        // 해커의 Brute-force 공격(무차별 대입)을 방어하기 위한 Rate Limit 로직입니다.
        // x-forwarded-for 또는 x-real-ip 헤더로 접속자의 원본 IP를 검출한 뒤,
        // Prisma DB(RateLimit 테이블)에 시도 횟수를 지속적으로 기록합니다.
        // 클라이언트 IP 암묵적 추출 (보안 방어용)
        const forwardedFor = req.headers.get("x-forwarded-for");
        const realIp = req.headers.get("x-real-ip");
        const baseIp = forwardedFor ? forwardedFor.split(',')[0] : (realIp || "unknown_ip");
        const ipKey = `login:${baseIp}`; // 프리픽스 추가

        const now = new Date();

        // DB에서 해당 IP의 로그인 시도 기록 조회
        let attemptRecord = await prisma.rateLimit.findUnique({
            where: { ip: ipKey }
        });

        if (attemptRecord) {
            if (attemptRecord.lockedUntil && attemptRecord.lockedUntil > now) {
                const remainingMinutes = Math.ceil((attemptRecord.lockedUntil.getTime() - now.getTime()) / 60000);
                return NextResponse.json({
                    error: `로그인 시도가 너무 많습니다. 보안을 위해 ${remainingMinutes}분 후 다시 시도해주세요.`
                }, { status: 429 });
            }
            // 잠금 시간이 지났으면 데이터 갱신 준비 (오류에서 DB 초기화로 변경)
            if (attemptRecord.lockedUntil && attemptRecord.lockedUntil <= now) {
                attemptRecord = await prisma.rateLimit.update({
                    where: { ip: ipKey },
                    data: { attempts: 0, lockedUntil: null }
                });
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
            // 실패 카운트 증가 처리
            if (!attemptRecord) {
                attemptRecord = await prisma.rateLimit.create({
                    data: { ip: ipKey, attempts: 1 }
                });
            } else {
                attemptRecord = await prisma.rateLimit.update({
                    where: { ip: ipKey },
                    data: { attempts: attemptRecord.attempts + 1 }
                });
            }

            if (attemptRecord.attempts >= MAX_ATTEMPTS) {
                const lockTime = new Date(now.getTime() + LOCK_TIME_MS);
                await prisma.rateLimit.update({
                    where: { ip: ipKey },
                    data: { lockedUntil: lockTime }
                });

                return NextResponse.json({
                    error: "5회 이상 틀려 보안 잠금이 활성화되었습니다. 10분 후 다시 시도해주세요."
                }, { status: 429 });
            }

            return NextResponse.json({
                error: `비밀번호가 일치하지 않습니다. (남은 시도 횟수: ${MAX_ATTEMPTS - attemptRecord.attempts}회)`
            }, { status: 401 });
        }

        // 로그인 성공 시 해당 IP의 실패 기록 삭제
        if (attemptRecord) {
            await prisma.rateLimit.delete({ where: { ip: ipKey } });
        }

        const session = await getSession();
        session.isAdmin = true;
        await session.save();

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
    }
}
