/**
 * SearchModal 컴포넌트
 * - 레벨 이름으로 검색하는 팝업 모달
 * - 모달이 열리면 /api/levels에서 데이터를 가져와 실시간 필터링
 * - 검색 결과 클릭 시 해당 레벨 카드로 스크롤 이동 + 하이라이트 애니메이션
 * - ESC 키로 닫기 지원
 * 
 * [주의] 배경 스크롤 잠금(body overflow)은 이 컴포넌트가 아닌
 * Header.tsx에서 통합 관리합니다. 여기서 별도로 overflow를 건드리지 마세요.
 */
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Search, X, Loader2, ImageIcon } from "lucide-react";

// 레벨 데이터 타입 정의
interface Level {
    id: number;
    rank: number;
    name: string;
    creator: string;
    verifier: string;
    imageUrl: string | null;
}

export function SearchModal({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    const [searchQuery, setSearchQuery] = useState(""); // 검색어 상태
    const [levels, setLevels] = useState<Level[]>([]); // 전체 레벨 데이터
    const [isLoading, setIsLoading] = useState(false); // 로딩 상태
    const inputRef = useRef<HTMLInputElement>(null); // 검색 입력창 참조

    /**
     * 모달 열림 시 데이터 로딩 & 입력창 자동 포커스
     * - 모달이 열릴 때마다 API에서 최신 레벨 데이터를 가져옴
     * - 검색어 초기화 후 입력창에 자동 포커스
     */
    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            setSearchQuery("");
            // 레벨 데이터 로드
            fetch("/api/levels")
                .then((res) => res.json())
                .then((data) => {
                    setLevels(data);
                    setIsLoading(false);
                })
                .catch((err) => {
                    console.error("검색 데이터 로딩 실패:", err);
                    setIsLoading(false);
                });

            // 100ms 지연 후 입력창 자동 포커스 (모달 애니메이션 완료 대기)
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    /**
     * 검색 로직
     * - 레벨 이름에 검색어가 포함되는지 대소문자 무시하고 필터링
     * - 결과를 순위(rank) 오름차순으로 정렬
     */
    const filteredLevels = levels
        .filter((level) => level.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => a.rank - b.rank);

    /**
     * 검색 결과 클릭 시 해당 레벨 카드로 스크롤 이동
     * - 모달을 먼저 닫고 300ms 후 스크롤 이동 (UI 전환 시간 확보)
     * - 대상 카드에 일시적인 cyan 글로우 하이라이트 효과 적용 (1.5초간)
     */
    const handleResultClick = (id: number) => {
        onClose();
        setTimeout(() => {
            const targetElement = document.getElementById(`level-${id}`);
            if (targetElement) {
                // 부드러운 스크롤로 해당 카드 위치로 이동
                targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
                // 하이라이트 효과로 선택된 느낌 부여
                targetElement.style.transition = "all 0.5s ease";
                const originalShadow = targetElement.style.boxShadow;
                targetElement.style.boxShadow = "0 0 30px rgba(14, 165, 233, 0.6)";
                setTimeout(() => {
                    targetElement.style.boxShadow = originalShadow;
                }, 1500);
            }
        }, 300);
    };

    /**
     * ESC 키 이벤트 리스너
     * - 모달이 열려있을 때만 키보드 이벤트 감지
     * - ESC 키 누르면 모달 닫기
     */
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
        }

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen, onClose]);

    // 모달이 닫혀있으면 아무것도 렌더링하지 않음
    if (!isOpen) return null;

    return (
        // 전체 화면 오버레이 (블러 배경)
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] sm:pt-[20vh] px-4 backdrop-blur-md bg-black/50">
            {/* 배경 오버레이 클릭 시 모달 닫기 */}
            <div
                className="absolute inset-0"
                onClick={onClose}
            ></div>

            {/* 모달 컨테이너 */}
            <div className="relative w-full max-w-2xl bg-zinc-950/90 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-10 duration-200">

                {/* 검색 입력창 영역 */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800/80 bg-zinc-950">
                    <Search className="w-6 h-6 text-zinc-400 shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="레벨 이름 검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-grow bg-transparent text-xl font-medium text-white placeholder-zinc-500 outline-none"
                    />
                    {/* 모달 닫기 버튼 (X) */}
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* 검색 결과 리스트 영역 */}
                <div className="max-h-[50vh] overflow-y-auto">
                    {isLoading ? (
                        // 데이터 로딩 중 표시
                        <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
                            <Loader2 className="w-8 h-8 animate-spin mb-4 text-cyan-500" />
                            <p className="text-sm font-bold tracking-widest uppercase">데이터 불러오는 중...</p>
                        </div>
                    ) : searchQuery.length > 0 && filteredLevels.length === 0 ? (
                        // 검색 결과 없음 표시
                        <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
                            <p className="text-lg">결과가 없습니다.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col p-2 space-y-1">
                            {searchQuery.length > 0 ? (
                                // 검색 결과 목록 렌더링
                                filteredLevels.map((level) => (
                                    <button
                                        key={level.id}
                                        onClick={() => handleResultClick(level.id)}
                                        className="flex items-center gap-4 w-full p-3 text-left rounded-xl hover:bg-zinc-800/80 transition-colors group"
                                    >
                                        {/* 레벨 썸네일 이미지 */}
                                        <div className="w-12 h-8 rounded border border-zinc-700 overflow-hidden shrink-0 bg-zinc-900 flex items-center justify-center relative">
                                            {level.imageUrl ? (
                                                <Image 
                                                    src={level.imageUrl} 
                                                    alt={level.name || "Level Thumbnail"}
                                                    fill
                                                    sizes="48px"
                                                    className="object-cover" 
                                                    unoptimized={level.imageUrl.endsWith('.gif')}
                                                />
                                            ) : (
                                                <ImageIcon className="w-4 h-4 text-zinc-700" />
                                            )}
                                        </div>
                                        {/* 레벨 정보 (순위, 이름, 제작자) */}
                                        <div className="flex-grow min-w-0">
                                            <h4 className="font-bold text-zinc-200 group-hover:text-cyan-400 truncate flex items-center gap-2">
                                                <span className="text-zinc-500 text-sm">#{level.rank}</span>
                                                {level.name}
                                            </h4>
                                            <p className="text-xs text-zinc-500 truncate uppercase mt-0.5">
                                                BY {level.creator}
                                            </p>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                // 검색어 미입력 시 안내 문구
                                <div className="py-8 px-4 text-center">
                                    <p className="text-sm text-zinc-600 font-medium">검색어 입력</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 하단 단축키 안내 */}
                <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-950 text-xs text-zinc-500 flex justify-start items-center">
                    <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 rounded-sm bg-zinc-800 border border-zinc-700 font-mono text-[10px]">ESC</kbd> 닫기
                    </span>
                </div>
            </div>
        </div>
    );
}
