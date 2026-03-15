/**
 * Footer 컴포넌트
 * - 페이지 하단 푸터 영역
 * - 사이트 로고, 네비게이션 링크, 관리자 로그인 링크, 저작권 정보 표시
 * - 모든 링크는 상대 경로 사용 (도메인 변경에 영향받지 않음)
 */
import Link from "next/link";

export function Footer() {
    return (
        <footer className="w-full border-t border-zinc-800/80 bg-zinc-950 py-10">
            <div className="container mx-auto px-4 sm:px-8">
                <div className="grid gap-8 md:grid-cols-4">
                    {/* 로고 영역 - 클릭 시 메인 페이지로 이동 */}
                    <div className="md:col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-transparent">
                                <img src="/logo.png" alt="Logo" className="h-full w-full object-cover" />
                            </div>
                            <span className="text-base font-bold text-white">GDRMCL</span>
                        </Link>
                    </div>

                    {/* 탐색 링크 - 메인 페이지 섹션별 앵커 링크 */}
                    <div>
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">탐색</h3>
                        <ul className="space-y-2 text-sm text-zinc-500">
                            <li><a href="/#main" className="hover:text-white transition-colors">Main List</a></li>
                            <li><a href="/#extended" className="hover:text-white transition-colors">Extended List</a></li>
                            <li><a href="/#legacy" className="hover:text-white transition-colors">Legacy List</a></li>
                            <li><a href="/submit" className="hover:text-white transition-colors">Submit Record</a></li>
                        </ul>
                    </div>

                    {/* 리소스 링크 - 관리자 로그인 */}
                    <div>
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">리소스</h3>
                        <ul className="space-y-2 text-sm text-zinc-500">
                            <li><Link href="/admin" className="hover:text-white transition-colors">관리자 로그인</Link></li>
                        </ul>
                    </div>
                </div>

                {/* 하단 저작권 & 크레딧 영역 */}
                <div className="mt-8 border-t border-zinc-800/60 pt-6 flex flex-col items-center justify-between sm:flex-row">
                    <p className="text-xs text-zinc-600 font-medium">
                        {new Date().getFullYear()} GDRMCL
                    </p>
                    <div className="mt-3 flex flex-col text-right gap-0.5 sm:mt-0">
                        <span className="text-zinc-500 text-xs">Created by Google Antigravity</span>
                        <span className="text-zinc-500 text-xs">name0825</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
