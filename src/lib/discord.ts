/**
 * Discord Webhook 유틸리티 모듈
 * 
 * [개요]
 * 리더보드에 레벨이 삽입/수정/삭제될 때 Discord 채널에 자동으로 알림을 전송하는 유틸리티입니다.
 * Discord의 Embed(리치 텍스트) 형식을 사용하여 보기 좋은 카드 형태의 알림을 보냅니다.
 * 
 * [AI ANALYSIS NOTE - CRITICAL: Vercel 서버리스 환경 주의사항]
 * 이 함수를 호출할 때는 반드시 `await sendDiscordWebhook(...)` 형태로 사용해야 합니다.
 * Vercel의 서버리스 함수는 HTTP Response(NextResponse.json)가 클라이언트에 반환되는 즉시
 * 모든 백그라운드 프로세스를 동결(Freeze)/종료합니다.
 * 
 * 만약 `await` 없이 Fire-and-Forget 방식으로 호출하면:
 * 1. Cold Start 시 네트워크 지연으로 인해 Discord API 요청이 완료되기 전에 프로세스가 죽음
 * 2. 알림이 간헐적으로 전송되지 않는 "유령 버그" 발생
 * 이 버그는 로컬 개발 환경에서는 재현되지 않아 디버깅이 매우 어렵습니다.
 * 
 * [환경 변수]
 * - DISCORD_WEBHOOK_URL: Discord Webhook URL (순수 URL 문자열, 따옴표/공백 금지)
 *   Vercel 대시보드에서 설정할 때 따옴표나 공백이 포함되면 401 Unauthorized 에러 발생.
 * 
 * [색상 코딩 규칙 (호출하는 쪽에서 지정)]
 * - 0x06b6d4 (Cyan-500): 새 레벨 등재
 * - 0xf59e0b (Amber-500): 레벨 수정/순위 이동
 * - 0xef4444 (Red-500): 레벨 삭제
 */

// Discord Embed 객체의 타입 정의
// Discord API의 Embed 스펙을 TypeScript 인터페이스로 정의한 것
export interface DiscordEmbed {
    title?: string;        // 임베드 제목 (예: "🎉 새로운 레벨이 등재되었습니다!")
    description?: string;  // 본문 텍스트 (Markdown 지원)
    url?: string;          // 제목 클릭 시 이동할 URL
    color?: number;        // 왼쪽 색상 바 (16진수 정수, 예: 0x06b6d4)
    fields?: { name: string; value: string; inline?: boolean }[]; // 정보 필드 배열
    thumbnail?: { url: string };  // 우측 상단 작은 이미지
    image?: { url: string };      // 본문 하단 큰 이미지
    author?: { name: string; icon_url?: string; url?: string };  // 작성자 정보
    footer?: { text: string; icon_url?: string };  // 하단 푸터 텍스트
    timestamp?: string;    // ISO 8601 형식 타임스탬프 (예: "2024-01-01T00:00:00.000Z")
}

/**
 * Discord Webhook으로 메시지를 전송합니다.
 * 
 * @param content - 선택적 일반 텍스트 메시지 (Embed 없이 단독 사용 가능)
 * @param embeds - Discord Embed 객체 배열 (리치 텍스트 카드)
 * @returns 전송 성공 시 true, 실패 시 에러를 throw
 * 
 * @throws Discord API 에러 또는 네트워크 에러 발생 시 throw
 * 
 * [사용 예시]
 * ```ts
 * // 반드시 await 사용!
 * await sendDiscordWebhook({
 *     embeds: [{
 *         title: "🎉 새로운 레벨이 등재되었습니다!",
 *         description: "**레벨명** 레벨이 **#1** 순위에 등록되었습니다.",
 *         color: 0x06b6d4, // Cyan
 *     }]
 * });
 * ```
 */
export async function sendDiscordWebhook(
    { content, embeds }: { content?: string; embeds?: DiscordEmbed[] }
): Promise<boolean> {
    // 환경 변수에서 Webhook URL 로드
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    // URL이 설정되지 않았으면 경고만 출력하고 조용히 실패 (앱 크래시 방지)
    if (!webhookUrl) {
        console.warn("[Discord Webhook] DISCORD_WEBHOOK_URL is not set.");
        return false;
    }

    try {
        // Discord API에 전송할 페이로드 구성
        const payload = {
            content: content || null,  // 일반 텍스트 (없으면 null)
            embeds: embeds || [],      // Embed 배열 (없으면 빈 배열)
        };

        // Discord Webhook API에 POST 요청 전송
        // Content-Type을 application/json으로 명시해야 Discord가 올바르게 파싱함
        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        // HTTP 응답 코드가 2xx가 아니면 에러 처리
        // 일반적인 에러 원인:
        // - 401: DISCORD_WEBHOOK_URL에 따옴표/공백이 포함됨
        // - 400: Embed 형식이 Discord 스펙에 맞지 않음
        // - 429: Discord API Rate Limit 초과 (짧은 시간에 너무 많은 요청)
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Discord Webhook] Failed to send message: ${response.status} ${response.statusText}`, errorText);
            throw new Error(`Discord API Error: ${response.status} - ${errorText}`);
        }

        return true;
    } catch (error) {
        console.error("[Discord Webhook] Error sending message:", error);
        throw error; // 호출자(API 라우트)에서 catch하여 사용자에게는 영향 없이 로깅만 수행
    }
}
