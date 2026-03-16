/**
 * 기록 제출(Submissions) API 라우트
 * 
 * [개요]
 * 일반 사용자가 자신의 클리어 기록을 관리자에게 제출하는 API입니다.
 * GET은 관리자만 접근 가능하고, POST는 누구나 사용 가능하지만 서버측 Rate Limit이 적용됩니다.
 * 
 * [보안 다층 방어 구조]
 * 1층: 클라이언트 측 - localStorage 기반 5분 쿨다운 (submit/page.tsx)
 * 2층: 서버 측 - IP 기반 5분 쿨다운 + 일일 10회 제한 (이 파일의 checkRateLimit)
 * 3층: DB 중복 검증 - 같은 Video URL로 중복 제출 차단
 * 
 * [AI ANALYSIS NOTE]
 * 클라이언트 측 쿨다운은 localStorage를 지우면 우회 가능하므로,
 * 서버 측에서도 반드시 독립적인 Rate Limit을 적용해야 합니다.
 * 로그인 API의 Rate Limit과 같은 RateLimit 테이블을 공유하지만,
 * IP 키에 "submit:" 프리픽스를 붙여 로그인 시도와 구분합니다.
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { uploadToImgBB } from "@/lib/imgbb";

// Next.js ISR 캐싱 비활성화 (삭제 후 목록 즉시 갱신을 위해)
export const dynamic = "force-dynamic";

// 유효성 검사 헬퍼
const LEVEL_ID_REGEX = /^\d{8,}$/;
const VIDEO_URL_REGEX = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be|drive\.google\.com)\//;

const COOLDOWN_MS = 5 * 60 * 1000; // 5분
const DAILY_LIMIT = 10;
const ONE_DAY_MS = 24 * 60 * 60 * 1000; // 1일

/**
 * 서버 측 Rate Limit 검증 함수
 * 
 * [AI ANALYSIS NOTE - 서버측 제출 방어 로직]
 * 클라이언트 측 쿨다운(localStorage)만으로는 악성 유저가 우회할 수 있으므로,
 * DB의 RateLimit 테이블을 사용하여 서버에서도 독립적으로 IP 기반 제한을 적용합니다.
 * 
 * [제한 규칙]
 * 1. 5분 쿨다운: 마지막 제출로부터 5분 이내 재제출 차단 (429 Too Many Requests)
 * 2. 일일 10회 제한: 24시간 내 10회 초과 시 차단 (403 Forbidden)
 *    - errorMessage를 일반적인 오류 메시지로 위장하여 공격자에게 힌트를 주지 않음
 * 3. 24시간 경과 시 시도 횟수 자동 리셋
 * 
 * @param ip - 클라이언트 IP 주소 (x-forwarded-for 또는 x-real-ip에서 추출)
 * @returns { allowed: boolean, error?: string, status?: number }
 */
async function checkRateLimit(ip: string): Promise<{ allowed: boolean; error?: string; status?: number }> {
    const now = new Date();
    // "submit:" 프리픽스로 로그인 Rate Limit("login:")과 구분
    const ipKey = `submit:${ip}`;

    let record = await prisma.rateLimit.findUnique({ where: { ip: ipKey } });

    if (!record) {
        await prisma.rateLimit.create({
            data: { ip: ipKey, attempts: 1, lastReset: now, updatedAt: now }
        });
        return { allowed: true };
    }

    // 일일 카운트 리셋 (24시간 경과 시)
    if (now.getTime() - record.lastReset.getTime() > ONE_DAY_MS) {
        record = await prisma.rateLimit.update({
            where: { ip: ipKey },
            data: { attempts: 0, lastReset: now }
        });
    }

    // 1. 일일 10회 제한
    if (record.attempts >= DAILY_LIMIT) {
        return { allowed: false, error: "제출 처리 중 오류가 발생했습니다.", status: 403 };
    }

    // 2. 5분 쿨다운 제한 (마지막 수정 시간으로 계산)
    if (now.getTime() - record.updatedAt.getTime() < COOLDOWN_MS) {
        const remainingMinutes = Math.ceil((COOLDOWN_MS - (now.getTime() - record.updatedAt.getTime())) / 60000);
        return { allowed: false, error: `너무 잦은 요청입니다. ${remainingMinutes}분 후에 다시 시도해주세요.`, status: 429 };
    }

    // 통과 시 기록 업데이트
    await prisma.rateLimit.update({
        where: { ip: ipKey },
        data: { attempts: record.attempts + 1, updatedAt: now }
    });

    return { allowed: true };
}

// GET: 모든 제출 기록 조회 (관리자용 - 인증 필요)
export async function GET() {
    try {
        // 관리자 인증 확인 (Admin authentication check)
        const session = await getSession();
        if (!session.isAdmin) {
            return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
        }

        const submissions = await prisma.submission.findMany({
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(submissions);
    } catch (error) {
        console.error("Failed to fetch submissions:", error);
        return NextResponse.json(
            { error: "제출 기록을 불러올 수 없습니다." },
            { status: 500 }
        );
    }
}

// POST: 새 기록 제출 (누구나 접근 가능, Rate Limit 적용)
// [데이터 흐름] 클라이언트 폼 → Rate Limit 검증 → 필드 유효성 검사 → 중복 URL 체크 → ImgBB 업로드 → DB 저장
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { levelName, publisher, levelId, videoUrl, imageUrl } = body;

        // IP 추출 (간단한 레이트 리밋 용)
        const forwardedFor = request.headers.get("x-forwarded-for");
        const realIp = request.headers.get("x-real-ip");
        const ip = forwardedFor ? forwardedFor.split(',')[0] : (realIp || "unknown_ip");

        // 레이트 리밋 확인
        const limitCheck = await checkRateLimit(ip);
        if (!limitCheck.allowed) {
            return NextResponse.json(
                { error: limitCheck.error },
                { status: limitCheck.status }
            );
        }

        // 필수 필드 검증
        if (!levelName || !publisher || !levelId || !videoUrl) {
            return NextResponse.json(
                { error: "모든 항목을 입력해주세요." },
                { status: 400 }
            );
        }

        // Level ID 검증: 숫자 8자리 이상
        if (!LEVEL_ID_REGEX.test(levelId.trim())) {
            return NextResponse.json(
                { error: "Level ID는 숫자 8자리 이상이어야 합니다." },
                { status: 400 }
            );
        }

        // Video URL 검증: YouTube 또는 Google Drive만 허용
        if (!VIDEO_URL_REGEX.test(videoUrl.trim())) {
            return NextResponse.json(
                { error: "영상 URL은 YouTube 또는 Google Drive 링크만 허용됩니다." },
                { status: 400 }
            );
        }

        // [AI ANALYSIS NOTE - 중복 Video URL 방어]
        // 같은 영상 URL로 중복 제출하는 것을 DB 레벨에서 차단합니다.
        // 이 검증이 없으면 같은 기록이 관리자 대시보드에 수십 개 쌓일 수 있습니다.
        // HTTP 409 Conflict를 반환하여 클라이언트에서 적절한 에러 메시지를 표시합니다.
        const existingSubmission = await prisma.submission.findFirst({
            where: { videoUrl: videoUrl.trim() },
        });

        if (existingSubmission) {
            return NextResponse.json(
                { error: "이미 제출 및 대기 중인 영상 링크입니다. 중복 제출은 불가능합니다." },
                { status: 409 }
            );
        }

        let finalImageUrl = imageUrl || null;

        // Base64 데이터면 ImgBB에 업로드
        if (imageUrl && imageUrl.startsWith("data:image/")) {
            const uploadedUrl = await uploadToImgBB(imageUrl);
            if (!uploadedUrl) {
                return NextResponse.json(
                    { error: "이미지 서버 업로드에 실패했습니다." },
                    { status: 500 }
                );
            }
            finalImageUrl = uploadedUrl;
        }

        const submission = await prisma.submission.create({
            data: {
                levelName: levelName.trim(),
                publisher: publisher.trim(),
                levelId: levelId.trim(),
                videoUrl: videoUrl.trim(),
                imageUrl: finalImageUrl,
            },
        });

        return NextResponse.json(submission, { status: 201 });
    } catch (error) {
        console.error("Failed to create submission:", error);
        return NextResponse.json(
            { error: "제출에 실패했습니다." },
            { status: 500 }
        );
    }
}
