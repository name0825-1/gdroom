"use client";

import { useEffect } from "react";
import { RefreshCcw, AlertTriangle } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // 에러 로깅 (가급적 서버로 전송하는 로직을 추가하는 것이 좋음)
        console.error("Runtime Error:", error);
    }, [error]);

    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center">
            <div className="mb-6 rounded-full bg-red-500/10 p-4 border border-red-500/20">
                <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>
            <h2 className="mb-2 text-2xl font-black text-white italic uppercase tracking-tight">
                Something went wrong!
            </h2>
            <p className="mb-8 max-w-md text-sm text-zinc-500">
                데이터베이스 연결이나 일시적인 서버 오류로 인해 페이지를 불러올 수 없습니다.
                잠시 후 다시 시도해 주세요.
            </p>
            <button
                onClick={() => reset()}
                className="flex items-center gap-2 rounded-xl bg-zinc-800 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-zinc-700 active:scale-95"
            >
                <RefreshCcw className="h-4 w-4" />
                다시 시도하기
            </button>
        </div>
    );
}
