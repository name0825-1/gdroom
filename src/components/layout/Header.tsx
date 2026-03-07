"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, Search, User, X, Trophy, LayoutList, History, Send } from "lucide-react";
import { SearchModal } from "./SearchModal";

export function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:px-8">
          {/* 로고 */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-cyan-500 to-purple-600 text-sm font-bold text-white shadow-[0_0_12px_rgba(14,165,233,0.4)]">
                G
              </div>
              <span className="text-lg font-extrabold tracking-tight text-white">
                GDRMCL
              </span>
            </Link>
          </div>

          {/* 데스크탑 네비게이션 */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <a href="/#main" className="rounded-md px-3 py-2 text-zinc-400 transition-colors hover:text-white hover:bg-zinc-800/60">
              Main List
            </a>
            <a href="/#extended" className="rounded-md px-3 py-2 text-zinc-400 transition-colors hover:text-white hover:bg-zinc-800/60">
              Extended List
            </a>
            <a href="/#legacy" className="rounded-md px-3 py-2 text-zinc-400 transition-colors hover:text-white hover:bg-zinc-800/60">
              Legacy List
            </a>
            <a href="/submit" className="rounded-md px-3 py-2 text-zinc-400 transition-colors hover:text-white hover:bg-zinc-800/60">
              Submit Record
            </a>
          </nav>

          {/* 액션 */}
          <div className="flex items-center gap-3 text-zinc-400">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3.5 py-1.5 text-sm transition-all hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="text-zinc-500">검색...</span>
            </button>

            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900/80 transition-colors hover:bg-zinc-800 hover:text-white sm:hidden"
            >
              <Search className="h-4 w-4" />
            </button>

            <Link href="/admin" className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/80 transition-colors hover:border-zinc-700 hover:bg-zinc-800 hover:text-white">
              <User className="h-3.5 w-3.5" />
            </Link>

            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg md:hidden hover:bg-zinc-800"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 모바일 메뉴 오버레이 */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[100] flex flex-col bg-zinc-950/95 backdrop-blur-xl md:hidden animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="flex shrink-0 h-14 items-center justify-between px-4 sm:px-8 border-b border-zinc-800/80 bg-zinc-950">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-cyan-500 to-purple-600 text-sm font-bold text-white">
                  G
                </div>
                <span className="text-lg font-extrabold tracking-tight text-white">
                  GDRMCL
                </span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-zinc-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500 px-2">Navigation</h3>
              <nav className="flex flex-col gap-3">
                <a
                  href="/#main"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-4 rounded-xl p-4 text-zinc-300 hover:text-white transition-all border border-zinc-800/50 bg-zinc-900/40 hover:bg-zinc-800/80 hover:border-zinc-700/50"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-950 border border-zinc-800/80 shadow-sm">
                    <Trophy className="h-6 w-6 text-yellow-500" />
                  </div>
                  <span className="text-xl font-bold tracking-tight">Main List</span>
                </a>

                <a
                  href="/#extended"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-4 rounded-xl p-4 text-zinc-300 hover:text-white transition-all border border-zinc-800/50 bg-zinc-900/40 hover:bg-zinc-800/80 hover:border-zinc-700/50"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-950 border border-zinc-800/80 shadow-sm">
                    <Trophy className="h-6 w-6 text-zinc-300" />
                  </div>
                  <span className="text-xl font-bold tracking-tight">Extended List</span>
                </a>

                <a
                  href="/#legacy"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-4 rounded-xl p-4 text-zinc-300 hover:text-white transition-all border border-zinc-800/50 bg-zinc-900/40 hover:bg-zinc-800/80 hover:border-zinc-700/50"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-950 border border-zinc-800/80 shadow-sm">
                    <Trophy className="h-6 w-6 text-amber-600" />
                  </div>
                  <span className="text-xl font-bold tracking-tight">Legacy List</span>
                </a>

                <a
                  href="/submit"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-4 rounded-xl p-4 text-zinc-300 hover:text-white transition-all border border-zinc-800/50 bg-zinc-900/40 hover:bg-zinc-800/80 hover:border-zinc-700/50 mt-2"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-950 border border-zinc-800/80 shadow-sm">
                    <Send className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold tracking-tight">Submit Record</span>
                    <span className="text-sm text-zinc-500 mt-1">자신의 클리어 기록 제출하기</span>
                  </div>
                </a>
              </nav>
            </div>
          </div>
        )}
      </header>
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
