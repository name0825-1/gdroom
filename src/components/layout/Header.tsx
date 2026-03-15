/**
 * Header 컴포넌트
 * - 상단 고정(sticky) 네비게이션 바
 * - 로고, 데스크탑 메뉴, 검색 버튼, 관리자 링크, 모바일 햄버거 메뉴 포함
 * - 모바일 메뉴와 검색 모달의 배경 스크롤 잠금을 통합 관리
 * 
 * [주의] 모바일 메뉴 오버레이는 반드시 <header> 요소 바깥에 렌더링해야 합니다.
 * backdrop-blur가 적용된 <header> 안에 넣으면 CSS stacking context 문제로
 * fixed 포지셔닝이 전체 화면을 덮지 못합니다.
 */
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, Search, User, X, Trophy, Send } from "lucide-react";
import { SearchModal } from "./SearchModal";

export function Header() {
  // 검색 모달 열림/닫힘 상태
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // 모바일 햄버거 메뉴 열림/닫힘 상태
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  /**
   * 배경 스크롤 잠금 (Body Scroll Lock)
   * - 모바일 메뉴 또는 검색 모달이 열려있는 동안 배경 페이지 스크롤 차단
   * - 두 상태를 함께 감시하여 둘 다 닫혔을 때만 스크롤 복원
   * 
   * [주의] 이 로직은 반드시 한 곳에서만 관리해야 합니다.
   * Header와 SearchModal에서 각각 overflow를 제어하면 레이스 컨디션이 발생하여
   * 모달을 닫아도 스크롤이 영구적으로 잠기는 버그가 생깁니다.
   */
  useEffect(() => {
    if (isMobileMenuOpen || isSearchOpen) {
      document.body.style.overflow = "hidden"; // 스크롤 차단
    } else {
      document.body.style.overflow = ""; // 빈 문자열로 브라우저 기본값 복원
    }

    return () => {
      document.body.style.overflow = ""; // 컴포넌트 언마운트 시 안전하게 복원
    };
  }, [isMobileMenuOpen, isSearchOpen]);

  return (
    <>
      {/* ===== 상단 고정 헤더 바 ===== */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:px-8">
          {/* 로고 - 클릭 시 메인 페이지로 이동 */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-transparent">
                <img src="/logo.png" alt="Logo" className="h-full w-full object-cover" />
              </div>
              <span className="text-lg font-extrabold tracking-tight text-white">
                GDRMCL
              </span>
            </Link>
          </div>

          {/* 데스크탑 네비게이션 (md 이상에서만 표시) */}
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

          {/* 우측 액션 버튼 영역 */}
          <div className="flex items-center gap-3 text-zinc-400">
            {/* 데스크탑 검색 버튼 (sm 이상에서 표시) */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3.5 py-1.5 text-sm transition-all hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="text-zinc-500">검색...</span>
            </button>

            {/* 모바일 검색 버튼 (sm 미만에서 표시) */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900/80 transition-colors hover:bg-zinc-800 hover:text-white sm:hidden"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* 관리자 페이지 링크 */}
            <Link href="/admin" className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/80 transition-colors hover:border-zinc-700 hover:bg-zinc-800 hover:text-white">
              <User className="h-3.5 w-3.5" />
            </Link>

            {/* 모바일 햄버거 메뉴 버튼 (md 미만에서 표시) */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg md:hidden hover:bg-zinc-800"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

      </header>

      {/* ===== 모바일 메뉴 오버레이 (모달 방식) ===== */}
      {/* [중요] <header> 바깥에 위치해야 backdrop-blur stacking context 문제 방지 */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4 backdrop-blur-md bg-black/50 md:hidden animate-in fade-in slide-in-from-top-4 duration-200">
          {/* 배경 오버레이 클릭 시 메뉴 닫기 */}
          <div
            className="absolute inset-0"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>

          {/* 모달 팝업 컨테이너 */}
          <div className="relative w-full max-w-sm bg-zinc-950/90 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* 모달 헤더 - 로고 + 닫기 버튼 */}
            <div className="flex shrink-0 h-14 items-center justify-between px-5 border-b border-zinc-800/80 bg-zinc-950">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-transparent">
                  <img src="/logo.png" alt="Logo" className="h-full w-full object-cover" />
                </div>
                <span className="text-lg font-extrabold tracking-tight text-white">
                  GDRMCL
                </span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors -mr-1.5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 모달 본문 - 네비게이션 링크 목록 */}
            <div className="flex-1 overflow-y-auto px-5 py-6 max-h-[70vh]">
              <nav className="flex flex-col gap-3">
                {/* Main List 링크 */}
                <a
                  href="/#main"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-4 rounded-xl p-3.5 text-zinc-300 hover:text-white transition-all border border-zinc-800/50 bg-zinc-900/40 hover:bg-zinc-800/80 hover:border-zinc-700/50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-950 border border-zinc-800/80 shadow-sm">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                  </div>
                  <span className="text-lg font-bold tracking-tight">Main List</span>
                </a>

                {/* Extended List 링크 */}
                <a
                  href="/#extended"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-4 rounded-xl p-3.5 text-zinc-300 hover:text-white transition-all border border-zinc-800/50 bg-zinc-900/40 hover:bg-zinc-800/80 hover:border-zinc-700/50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-950 border border-zinc-800/80 shadow-sm">
                    <Trophy className="h-5 w-5 text-zinc-300" />
                  </div>
                  <span className="text-lg font-bold tracking-tight">Extended List</span>
                </a>

                {/* Legacy List 링크 */}
                <a
                  href="/#legacy"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-4 rounded-xl p-3.5 text-zinc-300 hover:text-white transition-all border border-zinc-800/50 bg-zinc-900/40 hover:bg-zinc-800/80 hover:border-zinc-700/50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-950 border border-zinc-800/80 shadow-sm">
                    <Trophy className="h-5 w-5 text-amber-600" />
                  </div>
                  <span className="text-lg font-bold tracking-tight">Legacy List</span>
                </a>

                {/* Submit Record 링크 */}
                <a
                  href="/submit"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-4 rounded-xl p-3.5 text-zinc-300 hover:text-white transition-all border border-zinc-800/50 bg-zinc-900/40 hover:bg-zinc-800/80 hover:border-zinc-700/50 mt-2"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-950 border border-zinc-800/80 shadow-sm">
                    <Send className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-bold tracking-tight">Submit Record</span>
                  </div>
                </a>
              </nav>
            </div>
          </div>
        </div>
      )}
      {/* 검색 모달 컴포넌트 - 스크롤 잠금은 위의 useEffect에서 통합 관리 */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
