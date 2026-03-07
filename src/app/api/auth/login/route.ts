import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function POST(req: Request) {
    try {
        const { password } = await req.json();

        if (!password) {
            return NextResponse.json({ error: "비밀번호를 입력하세요." }, { status: 400 });
        }

        const adminPassword = process.env.ADMIN_PASSWORD;
        if (!adminPassword) {
            return NextResponse.json({ error: "서버 설정 오류" }, { status: 500 });
        }

        if (password !== adminPassword) {
            return NextResponse.json({ error: "비밀번호가 일치하지 않습니다." }, { status: 401 });
        }

        const session = await getSession();
        session.isAdmin = true;
        await session.save();

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
    }
}
