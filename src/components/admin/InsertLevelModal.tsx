import { X, ClipboardPaste, ImageIcon } from "lucide-react";

interface NewLevelData {
    name: string;
    creator: string;
    verifier: string;
    rank: number;
    imageUrl: string;
    sendNotification: boolean;
}

interface InsertLevelModalProps {
    newLevelData: NewLevelData;
    saving: number | null;
    copiedSubmissionData: { levelName: string; publisher: string; levelId: string } | null;
    onClose: () => void;
    onInsert: () => void;
    onUpdateField: (field: keyof NewLevelData, value: string | number) => void;
    onPasteSubmission: () => void;
    onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function InsertLevelModal({
    newLevelData,
    saving,
    copiedSubmissionData,
    onClose,
    onInsert,
    onUpdateField,
    onPasteSubmission,
    onImageChange
}: InsertLevelModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-black italic text-cyan-400">ADD NEW LEVEL</h2>
                    <button type="button" onClick={onClose} className="text-zinc-500 hover:text-white">
                        <X className="h-6 w-6" />
                    </button>
                </div>
                {/* 복사한 제출 데이터 자동 채우기 버튼 */}
                {copiedSubmissionData && (
                    <button
                        type="button"
                        onClick={onPasteSubmission}
                        className="mb-4 w-full flex items-center justify-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 py-3 text-sm font-bold text-green-400 transition-all hover:bg-green-500/20"
                    >
                        <ClipboardPaste className="h-4 w-4" />
                        복사한 제출 정보 붙여넣기
                    </button>
                )}
                <div className="space-y-4">
                    <div className="flex flex-col items-center gap-2">
                        <label className="w-full text-xs font-bold text-zinc-500">Thumbnail Image</label>
                        <div className="group relative h-32 w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 flex items-center justify-center">
                            {newLevelData.imageUrl ? (
                                <img src={newLevelData.imageUrl} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex flex-col items-center text-zinc-600">
                                    <ImageIcon className="h-8 w-8 mb-1" />
                                    <span className="text-[10px] uppercase font-bold tracking-wider">NO IMAGE</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <label className="cursor-pointer rounded-lg bg-cyan-600/80 hover:bg-cyan-500 px-4 py-2 text-xs font-bold text-white shadow-lg transition-all">
                                    {newLevelData.imageUrl ? "CHANGE" : "UPLOAD IMAGE"}
                                    <input type="file" className="hidden" accept="image/*" onChange={onImageChange} />
                                </label>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-bold text-zinc-500">INSERT RANK (1 ~ 200)</label>
                        <input
                            type="number"
                            value={newLevelData.rank}
                            onChange={(e) => onUpdateField("rank", parseInt(e.target.value) || 1)}
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-lg font-bold text-cyan-400 outline-none focus:border-cyan-500/50"
                            min={1} max={200}
                        />
                        <p className="mt-1 text-[10px] text-zinc-600">※ 해당 순위부터의 기존 맵들은 모두 한 칸씩 아래로 밀려납니다.</p>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-bold text-zinc-500">Level Name</label>
                        <input
                            value={newLevelData.name}
                            onChange={(e) => onUpdateField("name", e.target.value)}
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-zinc-100 outline-none focus:border-cyan-500/50"
                            placeholder="Daybreak"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-xs font-bold text-zinc-500">Published by</label>
                            <input
                                value={newLevelData.creator}
                                onChange={(e) => onUpdateField("creator", e.target.value)}
                                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-cyan-500/50"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-bold text-zinc-500">Level ID</label>
                            <input
                                value={newLevelData.verifier}
                                onChange={(e) => onUpdateField("verifier", e.target.value)}
                                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-cyan-500/50"
                                placeholder="ex: 12345678"
                            />
                        </div>
                    </div>
                    {/* Discord Notification Toggle */}
                    <div className="flex items-center gap-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
                         <input 
                             type="checkbox" 
                             id="discordNotificationInsert" 
                             className="h-4 w-4 cursor-pointer accent-cyan-500"
                             checked={newLevelData.sendNotification}
                             onChange={(e) => onUpdateField("sendNotification", e.target.checked ? "true" : "false")}
                         />
                         <label htmlFor="discordNotificationInsert" className="cursor-pointer text-xs font-bold text-cyan-400">
                             디스코드 채널에 등재 알림 전송하기
                         </label>
                    </div>
                    <button
                        type="button"
                        onClick={onInsert}
                        disabled={saving === -1}
                        className="mt-4 w-full rounded-lg bg-cyan-600 py-4 font-black transition-all hover:bg-cyan-500 disabled:opacity-50 shadow-xl shadow-cyan-900/20"
                    >
                        {saving === -1 ? "INSERTING..." : "INSERT LEVEL & SHIFT OTHERS"}
                    </button>
                </div>
            </div>
        </div>
    );
}
