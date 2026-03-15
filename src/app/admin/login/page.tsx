/**
 * 관리자 로그인 페이지
 * - 비밀번호 입력 후 /api/auth/login에 POST 요청
 * - 성공 시 /admin 대시보드로 리다이렉트
 * - 실패 시 남은 시도 횟수 표시 (5회 초과 시 10분 잠금)
 * - Eye/EyeOff 토글 버튼으로 입력한 비밀번호 확인 가능
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff } from "lucide-react";

export default function AdminLogin() {
    const [password, setPassword] = useState(""); // 입력된 비밀번호
    const [showPassword, setShowPassword] = useState(false); // 비밀번호 표시 여부
    const [error, setError] = useState(""); // 에러 메시지
    const [loading, setLoading] = useState(false); // 로딩 상태
    const router = useRouter();

    /**
     * 로그인 폼 제출 핸들러
     * - /api/auth/login에 비밀번호를 POST로 전송
     * - 성공하면 관리자 대시보드(/admin)로 이동
     * - 실패하면 서버에서 반환한 에러 메시지 표시
     */
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });

            const data = await res.json();

            if (res.ok) {
                router.push("/admin"); // 로그인 성공 → 대시보드 이동
            } else {
                setError(data.error || "로그인에 실패했습니다.");
            }
        } catch {
            setError("서버와 연결할 수 없습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-[60vh] items-center justify-center px-4">
            <div className="w-full max-w-sm">
                {/* 로그인 헤더 - 자물쇠 아이콘 + 제목 */}
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 shadow-lg shadow-cyan-500/20">
                        <Lock className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-zinc-100">Admin Login</h1>
                    <p className="mt-1 text-sm text-zinc-500">관리자 비밀번호를 입력하세요</p>
                </div>

                {/* 로그인 폼 */}
                <form onSubmit={handleLogin} className="space-y-4">
                    {/* 비밀번호 입력 영역 (보기 토글 버튼 포함) */}
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="비밀번호"
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-4 py-3 pr-10 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
                            autoFocus
                        />
                        {/* 비밀번호 보기/숨기기 토글 버튼 */}
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                        >
                            {showPassword ? (
                                <EyeOff className="h-5 w-5" />
                            ) : (
                                <Eye className="h-5 w-5" />
                            )}
                        </button>
                    </div>

                    {/* 에러 메시지 표시 */}
                    {error && (
                        <p className="text-sm text-red-400">{error}</p>
                    )}

                    {/* 로그인 버튼 */}
                    <button
                        type="submit"
                        disabled={loading || !password}
                        className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/30 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "로그인 중..." : "로그인"}
                    </button>
                </form>
            </div>
        </div>
    );
}
