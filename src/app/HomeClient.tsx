"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Image as ImageIcon } from "lucide-react";

interface Level {
    id: number;
    rank: number;
    name: string;
    creator: string;
    verifier: string;
    imageUrl: string | null;
}

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

function LevelCard({
    level,
    showImage = false,
}: {
    level: Level;
    showImage?: boolean;
}) {
    const [copied, setCopied] = useState(false);

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
                        <img
                            src={level.imageUrl}
                            alt={level.name}
                            className="h-full w-full object-cover"
                        />
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

export default function HomeClient({ levels }: { levels: Level[] }) {
    const mainLevels = levels.filter((l) => l.rank >= 1 && l.rank <= 25 && l.name !== "--" && l.name !== "진행 중");
    const extendedLevels = levels.filter((l) => l.rank >= 26 && l.rank <= 50 && l.name !== "--" && l.name !== "진행 중");
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
                        {mainLevels.map((level) => (
                            <LevelCard key={level.id} level={level} showImage={true} />
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
