import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { uploadToImgBB } from "@/lib/imgbb";

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

        // ImgBB API를 통해 외부 서버에 업로드
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Data = buffer.toString("base64");

        const imageUrl = await uploadToImgBB(base64Data);

        if (!imageUrl) {
            return NextResponse.json({ error: "이미지 서버 업로드에 실패했습니다." }, { status: 500 });
        }

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
