"use client";

import { Inter } from "next/font/google";
import "@/app/globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="ko" className="dark">
            <body className={`${inter.className} bg-zinc-950 text-white`}>
                <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
                    <h2 className="mb-4 text-4xl font-black italic uppercase tracking-tighter">
                        Critical Error
                    </h2>
                    <p className="mb-8 text-zinc-500">
                        앱의 핵심 시스템에 문제가 발생했습니다.
                    </p>
                    <button
                        onClick={() => reset()}
                        className="rounded-xl bg-cyan-600 px-8 py-4 font-black text-white transition-all hover:bg-cyan-500 shadow-xl shadow-cyan-900/20"
                    >
                        앱 새로고침
                    </button>
                </div>
            </body>
        </html>
    );
}
