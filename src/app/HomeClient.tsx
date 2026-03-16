/**
 * HomeClient 컴포넌트
 * 
 * [개요]
 * 메인 페이지의 레벨 리스트를 렌더링하는 클라이언트 컴포넌트입니다.
 * 서버 컴포넌트(page.tsx)에서 Prisma로 조회한 레벨 데이터를 props로 전달받아 표시합니다.
 * 
 * [리스트 분류 규칙]
 * - Main List: rank 1~25 (이미지 표시, 핵심 난이도 레벨)
 * - Extended List: rank 26~50 (이미지 표시, 확장 리스트)
 * - Legacy List: rank 51~100 (이미지 미표시, 간소화된 카드)
 * - rank 101~200: 화면에 표시하지 않음 (관리자용 예비 슬롯)
 * 
 * [필터링 규칙]
 * - name이 "--" 또는 "진행 중"인 플레이스홀더 레벨은 모두 필터링하여 표시하지 않음
 * 
 * [LevelCard ID 배지 위치]
 * - 모바일: 카드 우측 하단(bottom-right)
 * - 데스크탑: 카드 우측 상단(top-right)
 * - 배지 클릭 시 Level ID가 클립보드에 복사됨
 */
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Image as ImageIcon, Loader2 } from "lucide-react";

interface Level {
    id: number;
    rank: number;
    name: string;
    creator: string;
    verifier: string;
    imageUrl: string | null;
}

/**
 * 섹션 구분선 컴포넌트
 * - 리스트 간 시각적 구분을 위한 가로선 + 텍스트 라벨
 * - id 속성으로 앵커 링크(#main, #extended, #legacy) 대상이 됨
 * - scroll-mt-20으로 스크롤 이동 시 헤더에 가리지 않도록 오프셋 적용
 */
function SectionDivider({ title, id }: { title: string; id: string }) {
    return (
        <div id={id} className="scroll-mt-20 my-10">
            <div className="flex items-center gap-4">
                <div className="section-divider flex-grow" />
                <span className="text-sm font-bold tracking-[0.2em] uppercase text-zinc-400">
                    {title}
                </span>
                <div className="section-divider flex-grow" />
            </div>
        </div>
    );
}

/**
 * 개별 레벨 카드 컴포넌트
 * 
 * [표시 모드]
 * - showImage=true: 좌측에 썸네일 이미지가 포함된 큰 카드 (Main/Extended List용)
 * - showImage=false: 텍스트 정보만 표시하는 간소화된 카드 (Legacy List용)
 * 
 * [순위별 특수 스타일]
 * - 1위: rank-1-style (골드 테두리/그라데이션)
 * - 2위: rank-2-style (실버 테두리/그라데이션)
 * - 3위: rank-3-style (브론즈 테두리/그라데이션)
 * 
 * [ID 배지 복사 기능]
 * - verifier 필드에 Level ID가 저장됨 (GD 게임 내 레벨 고유 식별자)
 * - 배지 클릭 시 navigator.clipboard.writeText()로 복사
 * - 복사 후 2초간 "COPIED!" 텍스트로 전환되는 시각적 피드백
 * - 이벤트 버블링 방지(stopPropagation)로 카드 자체의 클릭 이벤트와 분리
 */
function LevelCard({
    level,
    showImage = false,
    priority = false,
}: {
    level: Level;
    showImage?: boolean;
    priority?: boolean;
}) {
    const [copied, setCopied] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    const handleCopyId = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (level.verifier && level.verifier !== "--") {
            navigator.clipboard.writeText(level.verifier);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    let rankStyle = "";
    let borderClass = "";
    if (level.rank === 1) { rankStyle = "rank-1-style"; borderClass = "border-2"; }
    else if (level.rank === 2) { rankStyle = "rank-2-style"; borderClass = "border-2"; }
    else if (level.rank === 3) { rankStyle = "rank-3-style"; borderClass = "border-2"; }

    return (
        <Link
            href={`#`} // 상세 페이지가 없으므로 앵커 처리 (사용자 요청 시 추후 구현)
            onClick={(e) => e.preventDefault()}
            id={`level-${level.id}`}
            className={`level-card group relative flex flex-col sm:flex-row items-start sm:items-center overflow-hidden rounded-lg p-4 sm:p-5 gap-5 sm:gap-6 cursor-default scroll-mt-24 ${rankStyle} ${borderClass}`}
        >
            {/* 썸네일 (이미지 표시 옵션) */}
            {showImage && (
                <div className="shrink-0 flex items-center justify-center bg-zinc-900 border border-zinc-800/80 rounded-md overflow-hidden aspect-video w-full sm:w-48 md:w-56 relative shadow-md group-hover:border-cyan-500/30 transition-colors">
                    {level.imageUrl ? (
                        <>
                            {/* 로딩 스피너: 이미지가 로드되기 전까지 표시 */}
                            {!imageLoaded && (
                                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-10">
                                    <Loader2 className="h-6 w-6 text-cyan-500 animate-spin" />
                                </div>
                            )}
                            <Image
                                src={level.imageUrl}
                                alt={level.name || "Level Thumbnail"}
                                fill
                                sizes="(max-width: 640px) 100vw, (max-width: 768px) 192px, 224px"
                                className={`object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                                priority={priority}
                                unoptimized={level.imageUrl.endsWith('.gif')}
                                onLoad={() => setImageLoaded(true)}
                            />
                        </>
                    ) : (
                        <>
                            <ImageIcon className="h-8 w-8 text-zinc-700" />
                            <span className="absolute bottom-2 right-2 text-[10px] font-medium text-zinc-600 bg-zinc-950/80 px-2 py-0.5 rounded uppercase tracking-wider">
                                No Image
                            </span>
                        </>
                    )}
                </div>
            )}

            {/* 레벨 정보 (공통) */}
            <div className="flex flex-col gap-1 w-full justify-center">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-lg sm:text-xl font-bold tracking-normal text-zinc-100 group-hover:text-cyan-400 transition-colors">
                        #{level.rank} &ndash; {level.name}
                    </h3>
                </div>
                <p className="text-sm sm:text-base text-zinc-400 font-normal tracking-tight">
                    Published by <span className="text-zinc-300">{level.creator}</span>
                </p>
            </div>

            {/* ID 복사 버튼 (우측 상단 절대 위치) */}
            {level.verifier && level.verifier !== "--" && (
                <button
                    onClick={handleCopyId}
                    className={`absolute bottom-4 right-4 sm:bottom-auto sm:top-5 sm:right-5 flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-black transition-all border ${copied
                        ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                        : "bg-zinc-800/50 border-zinc-700/50 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
                        }`}
                >
                    {copied ? "COPIED!" : `ID: ${level.verifier}`}
                </button>
            )}
        </Link>
    );
}

/**
 * 메인 홈 클라이언트 컴포넌트
 * 
 * [AI ANALYSIS NOTE - 데이터 필터링 로직]
 * 서버에서 전달받은 200개의 레벨 데이터를 3개의 섹션으로 분류합니다.
 * - DB에서는 항상 정확히 200개의 행(rank 1~200)을 유지하지만,
 *   name이 "--"인 플레이스홀더와 "진행 중"인 미완성 레벨은 화면에서 제외합니다.
 * - rank 101~200 범위의 레벨은 어떤 리스트에도 포함되지 않아 화면에 표시되지 않습니다.
 *   이 범위는 관리자가 자유롭게 예비 데이터를 관리하는 용도로 사용됩니다.
 */
export default function HomeClient({ levels }: { levels: Level[] }) {
    // Main List: 상위 25개 레벨 (핵심 챌린지, 이미지 포함)
    const mainLevels = levels.filter((l) => l.rank >= 1 && l.rank <= 25 && l.name !== "--" && l.name !== "진행 중");
    // Extended List: 26~50위 레벨 (확장 챌린지, 이미지 포함)
    const extendedLevels = levels.filter((l) => l.rank >= 26 && l.rank <= 50 && l.name !== "--" && l.name !== "진행 중");
    // Legacy List: 51~100위 레벨 (레거시 챌린지, 이미지 미표시)
    const legacyLevels = levels.filter((l) => l.rank >= 51 && l.rank <= 100 && l.name !== "--" && l.name !== "진행 중");

    return (
        <div className="relative isolate z-0">
            <div className="container mx-auto px-4 sm:px-8 relative z-10">
                {/* 히어로 섹션 */}
                <section className="py-6 flex flex-col items-center text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="mb-2 text-5xl font-extrabold tracking-tight sm:text-7xl lg:text-8xl text-transparent bg-clip-text bg-gradient-to-br from-blue-500 to-purple-500"
                    >
                        GDRMCL
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                        className="max-w-xl text-sm tracking-normal text-zinc-400 sm:text-base uppercase"
                    >
                        GDRMCL Challenge List
                    </motion.p>
                </section>

                {/* 전체 리스트 */}
                <section className="mx-auto max-w-3xl pb-20">
                    {/* Main List */}
                    <SectionDivider title="Main List" id="main" />
                    <div className="flex flex-col gap-3">
                        {mainLevels.map((level, index) => (
                            <LevelCard 
                                key={level.id} 
                                level={level} 
                                showImage={true} 
                                priority={index < 3} // 상위 3개 카드는 LCP(Largest Contentful Paint)를 위해 우선 로드
                            />
                        ))}
                    </div>

                    {/* Extended List */}
                    <SectionDivider title="Extended List" id="extended" />
                    <div className="flex flex-col gap-3">
                        {extendedLevels.map((level) => (
                            <LevelCard key={level.id} level={level} showImage={true} />
                        ))}
                    </div>

                    {/* Legacy List */}
                    <SectionDivider title="Legacy List" id="legacy" />
                    <div className="flex flex-col gap-2">
                        {legacyLevels.map((level) => (
                            <LevelCard key={level.id} level={level} showImage={false} />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
