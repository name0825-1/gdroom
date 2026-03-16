/**
 * 유저 썸네일 업로드 API 라우트
 *
 * [개요]
 * 일반 사용자가 기록 제출 시 첨부하는 썸네일 이미지를 ImgBB에 업로드합니다.
 * 관리자 인증이 필요하지 않으므로 누구나 접근 가능합니다.
 *
 * [AI ANALYSIS NOTE - 보안 제한]
 * - 관리자 업로드(api/upload)보다 제한이 엄격: 2MB, GIF 불허
 * - 인증 없이 접근 가능하므로 파일 크기/타입 검증이 더욱 중요
 * - Rate Limiting은 submissions/route.ts POST에서 IP 기반으로 별도 처리
 */
import { NextResponse } from "next/server";
import { uploadToImgBB } from "@/lib/imgbb";

// 유저 썸네일 업로드 API (관리자 권한 불필요)
export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "파일이 필요합니다." }, { status: 400 });
        }

        // 파일 크기 제한 (2MB)
        if (file.size > 2 * 1024 * 1024) {
            return NextResponse.json({ error: "파일 크기는 2MB 이하여야 합니다." }, { status: 400 });
        }

        // 허용 확장자 검증
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: "JPG, PNG, WebP만 업로드 가능합니다." }, { status: 400 });
        }

        // ImgBB API를 통해 외부 서버에 업로드
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Data = buffer.toString("base64");

        const imageUrl = await uploadToImgBB(base64Data);
        if (!imageUrl) {
            return NextResponse.json({ error: "이미지 서버 업로드에 실패했습니다." }, { status: 500 });
        }

        return NextResponse.json({ imageUrl });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "업로드에 실패했습니다." }, { status: 500 });
    }
}
