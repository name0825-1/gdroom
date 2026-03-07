import Link from "next/link";

export function Footer() {
    return (
        <footer className="w-full border-t border-zinc-800/80 bg-zinc-950 py-10">
            <div className="container mx-auto px-4 sm:px-8">
                <div className="grid gap-8 md:grid-cols-4">
                    <div className="md:col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-3">
                            <div className="flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br from-cyan-500 to-purple-600 text-[10px] font-bold text-white">
                                G
                            </div>
                            <span className="text-base font-bold text-white">GDRMCL</span>
                        </Link>
                    </div>

                    <div>
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">탐색</h3>
                        <ul className="space-y-2 text-sm text-zinc-500">
                            <li><a href="/#main" className="hover:text-white transition-colors">Main List</a></li>
                            <li><a href="/#extended" className="hover:text-white transition-colors">Extended List</a></li>
                            <li><a href="/#legacy" className="hover:text-white transition-colors">Legacy List</a></li>
                            <li><a href="/submit" className="hover:text-white transition-colors">Submit Record</a></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">리소스</h3>
                        <ul className="space-y-2 text-sm text-zinc-500">
                            <li><Link href="/admin" className="hover:text-white transition-colors">관리자 로그인</Link></li>
                        </ul>
                    </div>
                </div>

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
