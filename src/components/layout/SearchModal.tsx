"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2, ImageIcon } from "lucide-react";

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
    const [searchQuery, setSearchQuery] = useState("");
    const [levels, setLevels] = useState<Level[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // 모달이 열릴 때 데이터 fetching 및 포커스
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
                    console.error("Failed to fetch levels for search:", err);
                    setIsLoading(false);
                });

            // 입력창 자동 포커스
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    // 검색 로직 (이름 포함 & 랭크 오름차순)
    const filteredLevels = levels
        .filter((level) => level.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => a.rank - b.rank);

    // 스크롤 이동 함수
    const handleResultClick = (id: number) => {
        onClose();
        // UI가 닫힐 시간을 주기 위해 약간 지연
        setTimeout(() => {
            const targetElement = document.getElementById(`level-${id}`);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
                // 선택된 느낌을 주도록 잠깐 하이라이트 효과
                targetElement.style.transition = "all 0.5s ease";
                const originalShadow = targetElement.style.boxShadow;
                targetElement.style.boxShadow = "0 0 30px rgba(14, 165, 233, 0.6)";
                setTimeout(() => {
                    targetElement.style.boxShadow = originalShadow;
                }, 1500);
            }
        }, 300);
    };

    // ESC 키로 닫기
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] sm:pt-[20vh] px-4 backdrop-blur-md bg-black/50">
            {/* 오버레이 클릭 시 닫기 */}
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
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* 결과 리스트 영역 */}
                <div className="max-h-[50vh] overflow-y-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
                            <Loader2 className="w-8 h-8 animate-spin mb-4 text-cyan-500" />
                            <p className="text-sm font-bold tracking-widest uppercase">데이터 불러오는 중...</p>
                        </div>
                    ) : searchQuery.length > 0 && filteredLevels.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
                            <p className="text-lg">결과가 없습니다.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col p-2 space-y-1">
                            {searchQuery.length > 0 ? (
                                filteredLevels.map((level) => (
                                    <button
                                        key={level.id}
                                        onClick={() => handleResultClick(level.id)}
                                        className="flex items-center gap-4 w-full p-3 text-left rounded-xl hover:bg-zinc-800/80 transition-colors group"
                                    >
                                        <div className="w-12 h-8 rounded border border-zinc-700 overflow-hidden shrink-0 bg-zinc-900 flex items-center justify-center relative">
                                            {level.imageUrl ? (
                                                <img src={level.imageUrl} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                <ImageIcon className="w-4 h-4 text-zinc-700" />
                                            )}
                                        </div>
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
                                <div className="py-8 px-4 text-center">
                                    <p className="text-sm text-zinc-600 font-medium">검색어 입력</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 하단 단축키 가이드 */}
                <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-950 text-xs text-zinc-500 flex justify-start items-center">
                    <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 rounded-sm bg-zinc-800 border border-zinc-700 font-mono text-[10px]">ESC</kbd> 닫기
                    </span>
                </div>
            </div>
        </div>
    );
}
