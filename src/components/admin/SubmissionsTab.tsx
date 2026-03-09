import { Trash2, Inbox, ExternalLink, Download, Check, Copy } from "lucide-react";

export interface Submission {
    id: number;
    levelName: string;
    publisher: string;
    levelId: string;
    videoUrl: string;
    imageUrl: string | null;
    isRead: boolean;
    createdAt: string;
}

interface SubmissionsTabProps {
    submissions: Submission[];
    copiedId: number | null;
    onDelete: (id: number) => void;
    onCopy: (sub: Submission) => void;
}

export function SubmissionsTab({ submissions, copiedId, onDelete, onCopy }: SubmissionsTabProps) {
    if (submissions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
                <Inbox className="h-16 w-16 mb-4" />
                <p className="text-sm font-bold uppercase tracking-widest">제출된 기록이 없습니다</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {submissions.map((sub) => (
                <div
                    key={sub.id}
                    className={`rounded-xl border p-5 transition-all ${!sub.isRead
                        ? "border-cyan-500/40 bg-cyan-500/5"
                        : "border-zinc-800 bg-zinc-900/30"
                        }`}
                >
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                            {!sub.isRead && (
                                <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
                            )}
                            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                                {new Date(sub.createdAt).toLocaleString("ko-KR")}
                            </span>
                        </div>
                        <button
                            onClick={() => onDelete(sub.id)}
                            className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-2 text-zinc-500 hover:text-red-400 hover:border-red-500/30 transition-all"
                            title="삭제"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {/* 썸네일 미리보기 */}
                        {sub.imageUrl && (
                            <div className="rounded-lg overflow-hidden border border-zinc-800/50 h-32">
                                <img src={sub.imageUrl} alt="썸네일" className="w-full h-full object-cover" />
                            </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="rounded-lg border border-zinc-800/50 bg-zinc-950/50 p-3">
                                <span className="text-[10px] font-black text-zinc-600 block mb-1">Level Name</span>
                                <span className="text-sm font-bold text-white">{sub.levelName}</span>
                            </div>
                            <div className="rounded-lg border border-zinc-800/50 bg-zinc-950/50 p-3">
                                <span className="text-[10px] font-black text-zinc-600 block mb-1">Published by</span>
                                <span className="text-sm font-bold text-white">{sub.publisher}</span>
                            </div>
                            <div className="rounded-lg border border-zinc-800/50 bg-zinc-950/50 p-3">
                                <span className="text-[10px] font-black text-zinc-600 block mb-1">Level ID</span>
                                <span className="text-sm font-bold text-white">{sub.levelId}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <a
                                href={sub.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2.5 text-xs font-bold text-cyan-400 transition-all hover:bg-zinc-700 hover:text-cyan-300"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                                영상 보기
                            </a>
                            {sub.imageUrl && (
                                <a
                                    href={sub.imageUrl}
                                    download
                                    className="flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2.5 text-xs font-bold text-cyan-400 transition-all hover:bg-zinc-700 hover:text-cyan-300"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    썸네일 다운
                                </a>
                            )}
                            <button
                                onClick={() => onCopy(sub)}
                                className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-bold transition-all ${copiedId === sub.id
                                    ? "border-green-500/50 bg-green-500/10 text-green-400"
                                    : "border-zinc-700 bg-zinc-900/80 text-zinc-400 hover:text-white hover:border-zinc-600"
                                    }`}
                            >
                                {copiedId === sub.id ? (
                                    <><Check className="h-3.5 w-3.5" /> 복사됨!</>
                                ) : (
                                    <><Copy className="h-3.5 w-3.5" /> 정보 복사</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
