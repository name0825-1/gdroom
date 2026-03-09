import { useState, useRef } from "react";
import { X, ImageIcon, Trash2, Eraser } from "lucide-react";
import { Level } from "./LevelsTab";

interface EditLevelModalProps {
    editingLevel: Level;
    saving: number | null;
    deleteConfirm: number | null;
    clearConfirm: number | null;
    onClose: () => void;
    onSave: (level: Level) => void;
    onClear: (level: Level) => void;
    onDelete: (level: Level) => void;
    onUpdateField: (field: keyof Level, value: string | number) => void;
    onImageUpload: (file: File) => void;
}

export function EditLevelModal({
    editingLevel,
    saving,
    deleteConfirm,
    clearConfirm,
    onClose,
    onSave,
    onClear,
    onDelete,
    onUpdateField,
    onImageUpload
}: EditLevelModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
                <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-xl font-black italic text-zinc-100">EDIT RANK #{editingLevel.rank}</h2>
                    <button type="button" onClick={onClose} className="text-zinc-500 hover:text-white">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="flex flex-col items-center gap-3">
                        <div className="group relative h-40 w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
                            {editingLevel.imageUrl ? (
                                <img src={editingLevel.imageUrl} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-zinc-700">
                                    <ImageIcon className="h-10 w-10" />
                                    <span className="text-[10px] font-bold tracking-widest uppercase">NO RECORD IMAGE</span>
                                </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-lg bg-cyan-600/80 hover:bg-cyan-500 transition-all px-4 py-2 text-xs font-bold text-white shadow-lg shadow-cyan-900/50">
                                    업로드 / 변경 (Upload Image)
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) onImageUpload(file);
                                        e.target.value = "";
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="grid grid-cols-4 gap-3">
                            <div className="col-span-1">
                                <label className="mb-1 block text-[10px] font-black text-zinc-600">RANK</label>
                                <input
                                    type="number"
                                    value={editingLevel.rank}
                                    onChange={(e) => onUpdateField("rank", parseInt(e.target.value) || 1)}
                                    className="w-full rounded-lg border border-cyan-500/30 bg-zinc-900 px-3 py-3 text-lg font-black text-cyan-400 outline-none focus:border-cyan-500"
                                />
                            </div>
                            <div className="col-span-3">
                                <label className="mb-1 block text-[10px] font-black text-zinc-600">Level Name</label>
                                <input
                                    value={editingLevel.name}
                                    onChange={(e) => onUpdateField("name", e.target.value)}
                                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-3 text-sm font-bold text-zinc-100 outline-none focus:border-cyan-500/50"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="mb-1 block text-[10px] font-black text-zinc-600">Published by</label>
                                <input
                                    value={editingLevel.creator}
                                    onChange={(e) => onUpdateField("creator", e.target.value)}
                                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-3 text-sm font-bold text-zinc-100 outline-none focus:border-cyan-500/50"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-[10px] font-black text-zinc-600">Level ID</label>
                                <input
                                    value={editingLevel.verifier}
                                    onChange={(e) => onUpdateField("verifier", e.target.value)}
                                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-3 text-sm font-bold text-zinc-100 outline-none focus:border-cyan-500/50"
                                    placeholder="GD Level ID (ex: 12345678)"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 space-y-3">
                    <button
                        type="button"
                        onClick={() => onSave(editingLevel)}
                        disabled={saving === editingLevel.id}
                        className="w-full rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-500 py-4 font-black text-white shadow-xl shadow-cyan-900/20 transition-all hover:brightness-110 disabled:opacity-50"
                    >
                        {saving === editingLevel.id ? "SAVING..." : "APPLY CHANGES & SHIFT"}
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                onClear(editingLevel);
                            }}
                            className={`flex items-center justify-center gap-2 rounded-lg border py-3 text-xs font-black transition-all ${clearConfirm === editingLevel.id
                                ? "border-orange-500 bg-orange-600 text-white animate-pulse"
                                : "border-orange-500/30 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20"
                                }`}
                        >
                            <Eraser className="h-4 w-4" />
                            {clearConfirm === editingLevel.id ? "CONFIRM CLEAR?" : "CLEAR INFO"}
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                onDelete(editingLevel);
                            }}
                            className={`flex items-center justify-center gap-2 rounded-lg border py-3 text-xs font-black transition-all ${deleteConfirm === editingLevel.id
                                ? "border-red-500 bg-red-600 text-white animate-pulse"
                                : "border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                }`}
                        >
                            <Trash2 className="h-4 w-4" />
                            {deleteConfirm === editingLevel.id ? "CONFIRM DELETE?" : "DELETE & PULL"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
