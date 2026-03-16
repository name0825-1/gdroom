/**
 * ImgBB 이미지 업로드 유틸리티 모듈
 * 
 * [개요]
 * Supabase DB의 무료 티어 용량/전송량 제한을 우회하기 위해,
 * 레벨 썸네일 이미지를 DB에 직접 저장하지 않고 외부 이미지 호스팅 서비스(ImgBB)에 업로드합니다.
 * 업로드 후 반환된 `i.ibb.co` URL만 DB의 imageUrl 필드에 문자열로 저장합니다.
 * 
 * [데이터 흐름]
 * 1. 클라이언트 → Base64 인코딩된 이미지 데이터를 API 라우트로 전송
 * 2. API 라우트 → 이 함수를 호출하여 ImgBB API에 프록시 업로드
 * 3. ImgBB → 업로드된 이미지의 다이렉트 URL 반환 (예: https://i.ibb.co/abc123/image.jpg)
 * 4. 반환된 URL → DB의 imageUrl 컬럼에 저장
 * 
 * [호출 위치]
 * - src/app/api/levels/route.ts (POST - 새 레벨 삽입 시)
 * - src/app/api/levels/[id]/route.ts (PUT - 레벨 수정 시)
 * - src/app/api/upload/route.ts (관리자 이미지 직접 업로드)
 * - src/app/api/submissions/route.ts (유저 제출 시 썸네일 업로드)
 * - src/app/api/submissions/upload/route.ts (유저 썸네일 전용 업로드)
 * 
 * [환경 변수]
 * - IMGBB_API_KEY: ImgBB API 키. Vercel 대시보드와 로컬 .env 파일에 모두 설정 필요.
 * 
 * @param base64Data - Base64 인코딩된 이미지 데이터
 *   "data:image/jpeg;base64,/9j/4..." 형식(Data URL) 또는 순수 Base64 문자열 모두 허용
 * @returns 성공 시 ImgBB 이미지 URL (예: "https://i.ibb.co/..."), 실패 시 null
 */
export async function uploadToImgBB(base64Data: string): Promise<string | null> {
    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) {
        console.error("IMGBB_API_KEY is not set.");
        return null;
    }

    // Data URL 형식(data:image/jpeg;base64,...)이 들어올 경우
    // "base64," 이후의 순수 Base64 데이터만 추출합니다.
    // ImgBB API는 Data URL 프리픽스를 포함하면 업로드에 실패할 수 있습니다.
    const base64String = base64Data.includes("base64,") ? base64Data.split("base64,")[1] : base64Data;

    try {
        // ImgBB API는 FormData 형식으로 전송해야 합니다.
        // - key: API 인증 키
        // - image: Base64 인코딩된 이미지 데이터 (순수 문자열)
        const formData = new FormData();
        formData.append("key", apiKey);
        formData.append("image", base64String);

        // ImgBB v1 Upload API 엔드포인트에 POST 요청
        const res = await fetch("https://api.imgbb.com/1/upload", {
            method: "POST",
            body: formData,
        });

        const data = await res.json();
        if (res.ok && data.success) {
            // 업로드 성공: 이미지 다이렉트 URL 반환 (예: https://i.ibb.co/abc123/image.jpg)
            return data.data.url;
        } else {
            // API 응답은 왔지만 업로드 실패 (잘못된 키, 이미지 형식 오류 등)
            console.error("ImgBB Upload Failed:", data);
            return null;
        }
    } catch (error) {
        // 네트워크 에러 등 예외 처리 (ImgBB 서버 다운, 타임아웃 등)
        console.error("ImgBB Upload Exception:", error);
        return null;
    }
}
