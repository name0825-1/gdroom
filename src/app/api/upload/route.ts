import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session.isAdmin) {
            return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const levelId = formData.get("levelId") as string | null;

        if (!file || !levelId) {
            return NextResponse.json({ error: "파일과 levelId가 필요합니다." }, { status: 400 });
        }

        // 파일 크기 제한 (5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: "파일 크기는 5MB 이하여야 합니다." }, { status: 400 });
        }

        // 허용 확장자 검증
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: "JPG, PNG, WebP, GIF만 업로드 가능합니다." }, { status: 400 });
        }

        // Vercel(서버리스) 환경을 위해 이미지를 Base64로 즉시 변환하여 저장
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Data = buffer.toString("base64");

        // Base64 Data URL 생성
        const imageUrl = `data:${file.type};base64,${base64Data}`;

        // DB 업데이트
        await prisma.level.update({
            where: { id: parseInt(levelId) },
            data: { imageUrl },
        });

        return NextResponse.json({ imageUrl });
    } catch {
        return NextResponse.json({ error: "업로드에 실패했습니다." }, { status: 500 });
    }
}
