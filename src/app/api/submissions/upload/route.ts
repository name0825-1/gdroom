import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

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

        // uploads 디렉토리 생성
        const uploadDir = path.join(process.cwd(), "public", "uploads", "submissions");
        await mkdir(uploadDir, { recursive: true });

        // 파일 저장
        const ext = file.name.split(".").pop() || "jpg";
        const fileName = `sub-${Date.now()}.${ext}`;
        const filePath = path.join(uploadDir, fileName);

        const bytes = await file.arrayBuffer();
        await writeFile(filePath, Buffer.from(bytes));

        const imageUrl = `/uploads/submissions/${fileName}`;
        return NextResponse.json({ imageUrl });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "업로드에 실패했습니다." }, { status: 500 });
    }
}
