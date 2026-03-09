import { ImageIcon } from "lucide-react";

export interface Level {
    id: number;
    rank: number;
    name: string;
    creator: string;
    verifier: string;
    imageUrl: string | null;
}

interface LevelsTabProps {
    levels: Level[];
    onEdit: (level: Level) => void;
}

export function LevelsTab({ levels, onEdit }: LevelsTabProps) {
    return (
        <div className="grid grid-cols-1 gap-2">
            {levels.map((level) => (
                <button
                    key={level.id}
                    onClick={() => onEdit({ ...level })}
                    className={`group flex w-full items-center gap-4 rounded-xl border border-zinc-900 bg-zinc-900/30 p-4 transition-all hover:border-zinc-700 hover:bg-zinc-800/50 ${level.rank > 100 ? "opacity-50 contrast-75" : ""
                        }`}
                >
                    <div className="flex w-12 shrink-0 flex-col items-center">
                        <span className="text-sm font-black italic text-zinc-500 group-hover:text-cyan-400">#{level.rank}</span>
                    </div>

                    <div className="h-10 w-16 shrink-0 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50">
                        {level.imageUrl ? (
                            <img src={level.imageUrl} className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center">
                                <ImageIcon className="h-4 w-4 text-zinc-800" />
                            </div>
                        )}
                    </div>

                    <div className="flex-grow min-w-0 text-left">
                        <h3 className="truncate text-sm font-black text-zinc-200 group-hover:text-white tracking-tight">{level.name}</h3>
                        <p className="truncate text-[10px] font-bold text-zinc-500 tracking-tight">
                            Published by <span className="text-zinc-400">{level.creator}</span>
                            {level.verifier && level.verifier !== "--" && (
                                <span className="ml-2 text-zinc-600">ID: {level.verifier}</span>
                            )}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {level.rank > 100 && (
                            <span className="rounded bg-zinc-800 px-2 py-0.5 text-[8px] font-black text-zinc-500 italic tracking-widest uppercase">HIDDEN</span>
                        )}
                        <span className="text-[10px] font-black text-zinc-800 group-hover:text-zinc-600 transition-colors">OPEN ➔</span>
                    </div>
                </button>
            ))}
        </div>
    );
}
