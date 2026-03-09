"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    LogOut,
    Save,
    Trash2,
    ImageIcon,
    X,
    Eraser,
    RefreshCcw,
    Bell,
    ExternalLink,
    Copy,
    Check,
    Inbox,
    ClipboardPaste,
    Download,
} from "lucide-react";

interface Level {
    id: number;
    rank: number;
    name: string;
    creator: string;
    verifier: string;
    imageUrl: string | null;
}

interface Submission {
    id: number;
    levelName: string;
    publisher: string;
    levelId: string;
    videoUrl: string;
    imageUrl: string | null;
    isRead: boolean;
    createdAt: string;
}

/**
 * [AI ANALYSIS NOTE - ADMIN DASHBOARD OVERVIEW]
 * 
 * 이 파일은 GDRMCL의 핵심 관리 시스템인 Admin Dashboard입니다 (800+ 라인).
 * AI 분석 시 다음 기능들을 유의해서 관찰하십시오:
 * 
 * 1. 인증 로직 (Auth): useEffect 안의 checkAuth()를 통해 세션을 검증하며, 실패 시 로그인 페이지로 강제 리다이렉션합니다.
 * 2. 탭 시스템: '레벨 관리(levels)'와 '제출된 기록(submissions)' 두 개의 탭으로 나뉩니다.
 * 3. 제출 데이터 연동 (Workflow): 
 *    - 사용자는 'submissions' 탭에서 유저들이 올린 기록을 확인하고 '정보 복사(handleCopyInfo)' 버튼을 누를 수 있습니다.
 *    - 복사한 후 'levels' -> '레벨 추가' 모달을 열면, '복사한 제출 정보 붙여넣기' 버튼이 활성화되어 
 *      이름, 배포자, 맵 ID를 일일이 타이핑하지 않고 한 번에 채울 수 있습니다.
 * 4. 이미지 프로세싱: 이미지를 업로드할 때 클라이언트 사이드에서 리사이징(HTML5 Canvas)한 뒤 
 *    Base64 형식으로 서버 API에 전송하여 ImgBB에 저장합니다.
 */
export default function AdminDashboard() {
    const [levels, setLevels] = useState<Level[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<number | null>(null);
    const [editingLevel, setEditingLevel] = useState<Level | null>(null);
    const [isInserting, setIsInserting] = useState(false); // 레벨 추가 모달 상태
    const [newLevelData, setNewLevelData] = useState({
        name: "",
        creator: "",
        verifier: "",
        rank: 1,
        imageUrl: "",
    });
    const [activeTab, setActiveTab] = useState<"levels" | "submissions">("levels");
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [copiedSubmissionData, setCopiedSubmissionData] = useState<{ levelName: string; publisher: string; levelId: string } | null>(null);
    const [message, setMessage] = useState<{
        text: string;
        type: "success" | "error";
    } | null>(null);
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        checkAuth();
        fetchLevels();
        fetchSubmissions();
    }, []);

    const checkAuth = async () => {
        try {
            const res = await fetch("/api/auth/check");
            const data = await res.json();
            if (!data.isAdmin) {
                router.push("/admin/login");
            }
        } catch {
            router.push("/admin/login");
        }
    };

    const fetchLevels = async () => {
        try {
            const res = await fetch("/api/levels");
            const data = await res.json();
            setLevels(data);
        } catch {
            showMessage("데이터를 불러올 수 없습니다.", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchSubmissions = async () => {
        try {
            const res = await fetch("/api/submissions");
            const data = await res.json();
            setSubmissions(data);
        } catch {
            console.error("Failed to fetch submissions");
        }
    };

    const unreadCount = submissions.filter((s) => !s.isRead).length;

    const handleCopyInfo = async (sub: Submission) => {
        const text = `${sub.levelName}\n${sub.publisher}\n${sub.levelId}`;
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(sub.id);
            setCopiedSubmissionData({ levelName: sub.levelName, publisher: sub.publisher, levelId: sub.levelId });
            setTimeout(() => setCopiedId(null), 2000);
            showMessage("정보가 복사되었습니다! '레벨 추가' 모달에서 붙여넣기할 수 있습니다.", "success");
        } catch {
            showMessage("복사에 실패했습니다.", "error");
        }
    };

    const handleDeleteSubmission = async (id: number) => {
        try {
            const res = await fetch(`/api/submissions/${id}`, { method: "DELETE" });
            if (res.ok) {
                showMessage("제출 기록을 삭제했습니다.", "success");
                fetchSubmissions();
            } else {
                showMessage("삭제에 실패했습니다.", "error");
            }
        } catch {
            showMessage("서버 오류가 발생했습니다.", "error");
        }
    };

    const handleMarkAsRead = async (id: number) => {
        try {
            await fetch(`/api/submissions/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isRead: true }),
            });
            fetchSubmissions();
        } catch {
            console.error("Failed to mark as read");
        }
    };

    const showMessage = (text: string, type: "success" | "error") => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 3000);
    };

    // 레벨 중간 삽입 (POST)
    const handleInsert = async () => {
        if (!newLevelData.name) {
            showMessage("레벨 이름을 입력해주세요.", "error");
            return;
        }
        setSaving(-1); // 임시 ID
        try {
            const res = await fetch("/api/levels", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newLevelData),
            });

            if (res.ok) {
                showMessage(`신규 레벨 #${newLevelData.rank} 삽입 완료!`, "success");
                setIsInserting(false);
                setNewLevelData({ name: "", creator: "", verifier: "", rank: 1, imageUrl: "" });
                fetchLevels();
            } else {
                const data = await res.json();
                showMessage(data.error || "추가 실패", "error");
            }
        } catch {
            showMessage("서버 오류가 발생했습니다.", "error");
        } finally {
            setSaving(null);
        }
    };

    const handleNewLevelImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let { width, height } = img;
                const MAX_SIZE = 800;
                if (width > height && width > MAX_SIZE) {
                    height *= MAX_SIZE / width;
                    width = MAX_SIZE;
                } else if (height > MAX_SIZE) {
                    width *= MAX_SIZE / height;
                    height = MAX_SIZE;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx?.drawImage(img, 0, 0, width, height);
                setNewLevelData({ ...newLevelData, imageUrl: canvas.toDataURL("image/jpeg", 0.7) });
            };
        };
    };

    // PUT: 순위 변경 및 텍스트 데이터 덮어쓰기
    const handleSave = async (level: Level) => {
        setSaving(level.id);
        try {
            const res = await fetch(`/api/levels/${level.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: level.name,
                    creator: level.creator,
                    verifier: level.verifier,
                    rank: level.rank,
                }),
            });

            if (res.ok) {
                showMessage(`저장 완료! 순위가 업데이트되었습니다.`, "success");
                setEditingLevel(null);
                fetchLevels();
            } else {
                showMessage("저장에 실패했습니다.", "error");
            }
        } catch {
            showMessage("서버 오류가 발생했습니다.", "error");
        } finally {
            setSaving(null);
        }
    };

    const handleImageUpload = async (levelId: number, file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("levelId", levelId.toString());

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                showMessage("이미지 업로드 완료!", "success");
                fetchLevels();
            } else {
                const data = await res.json();
                showMessage(data.error || "업로드 실패", "error");
            }
        } catch {
            showMessage("업로드 중 오류가 발생했습니다.", "error");
        }
    };

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/admin/login");
    };

    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [clearConfirm, setClearConfirm] = useState<number | null>(null);

    // DELETE: 완전 삭제 및 아래 맵 당겨오기
    const handleDelete = async (level: Level | null) => {
        if (!level || !level.id) {
            console.error("Delete attempt with null level/id");
            showMessage("유효하지 않은 레벨 데이터입니다.", "error");
            return;
        }

        // 2단계 확인 로직 (Custom Confirm)
        if (deleteConfirm !== level.id) {
            setDeleteConfirm(level.id);
            setClearConfirm(null);
            setTimeout(() => setDeleteConfirm(null), 3000); // 3초 후 취소
            return;
        }

        try {
            console.log(`[EXEC] Deleting level ID: ${level.id} at rank: ${level.rank}`);
            setSaving(level.id);
            const res = await fetch(`/api/levels/${level.id}`, { method: "DELETE" });
            const data = await res.json();

            if (res.ok) {
                showMessage(`#${level.rank} 삭제 및 순위 당김 완료!`, "success");
                setEditingLevel(null);
                setDeleteConfirm(null);
                fetchLevels();
            } else {
                showMessage(data.error || "삭제에 실패했습니다.", "error");
            }
        } catch (err) {
            console.error("Delete Fetch Error:", err);
            showMessage("서버 오류가 발생했습니다.", "error");
        } finally {
            setSaving(null);
        }
    };

    // PUT with action: clear
    const handleClear = async (level: Level | null) => {
        if (!level || !level.id) {
            console.error("Clear attempt with null level/id");
            showMessage("유효하지 않은 레벨 데이터입니다.", "error");
            return;
        }

        // 2단계 확인 로직 (Custom Confirm)
        if (clearConfirm !== level.id) {
            setClearConfirm(level.id);
            setDeleteConfirm(null);
            setTimeout(() => setClearConfirm(null), 3000); // 3초 후 취소
            return;
        }

        try {
            console.log(`[EXEC] Clearing level ID: ${level.id} at rank: ${level.rank}`);
            setSaving(level.id);
            const res = await fetch(`/api/levels/${level.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "clear" }),
            });
            const data = await res.json();

            if (res.ok) {
                showMessage(`#${level.rank} 정보 초기화 완료!`, "success");
                setEditingLevel(null);
                setClearConfirm(null);
                fetchLevels();
            } else {
                showMessage(data.error || "초기화에 실패했습니다.", "error");
            }
        } catch (err) {
            console.error("Clear Fetch Error:", err);
            showMessage("서버 오류가 발생했습니다.", "error");
        } finally {
            setSaving(null);
        }
    };

    const updateEditingField = (field: keyof Level, value: string | number) => {
        if (!editingLevel) return;
        setEditingLevel({ ...editingLevel, [field]: value });
    };

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="text-zinc-500 italic">연결 중...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 sm:px-8">
            {/* 상단 헤더 */}
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black tracking-tighter text-zinc-100 italic">ADMIN DASHBOARD</h1>
                    <p className="text-xs font-medium text-zinc-500">
                        RANK 1 ~ 200 SLOTS MANAGEMENT
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            console.log("Insert modal opened");
                            setIsInserting(true);
                        }}
                        className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-cyan-500 shadow-lg shadow-cyan-900/20"
                    >
                        <Save className="h-4 w-4" />
                        레벨 추가 (중간 삽입)
                    </button>
                    <button
                        type="button"
                        onClick={() => fetchLevels()}
                        className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-2 text-zinc-400 hover:text-white"
                        title="새로고침"
                    >
                        <RefreshCcw className="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/80 px-4 py-2 text-sm text-zinc-400 transition-all hover:border-red-500/50 hover:text-red-400"
                    >
                        <LogOut className="h-4 w-4" />
                        로그아웃
                    </button>
                </div>
            </div>

            {/* 탭 전환 */}
            <div className="mb-6 flex items-center gap-2 border-b border-zinc-800 pb-4">
                <button
                    onClick={() => setActiveTab("levels")}
                    className={`rounded-lg px-5 py-2.5 text-sm font-bold transition-all ${activeTab === "levels"
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-500 hover:text-zinc-300"
                        }`}
                >
                    레벨 관리
                </button>
                <button
                    onClick={() => {
                        setActiveTab("submissions");
                        // 탭 클릭 시 모든 미열람 알림 읽음 처리
                        submissions.filter(s => !s.isRead).forEach(s => handleMarkAsRead(s.id));
                    }}
                    className={`relative flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition-all ${activeTab === "submissions"
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-500 hover:text-zinc-300"
                        }`}
                >
                    <Bell className="h-4 w-4" />
                    제출된 기록
                    {unreadCount > 0 && (
                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-black text-white animate-pulse">
                            {unreadCount}
                        </span>
                    )}
                </button>
            </div>

            {/* 알림 메시지 */}
            {message && (
                <div
                    className={`fixed top-6 right-6 z-[100] rounded-xl border px-6 py-4 shadow-2xl backdrop-blur-md ${message.type === "success"
                        ? "border-green-500/30 bg-green-500/10 text-green-400"
                        : "border-red-500/30 bg-red-500/10 text-red-400"
                        }`}
                >
                    <p className="font-bold">{message.text}</p>
                </div>
            )}

            {/* 레벨 삽입 모달 */}
            {isInserting && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-xl font-black italic text-cyan-400">ADD NEW LEVEL</h2>
                            <button type="button" onClick={() => setIsInserting(false)} className="text-zinc-500 hover:text-white">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        {/* 복사한 제출 데이터 자동 채우기 버튼 */}
                        {copiedSubmissionData && (
                            <button
                                type="button"
                                onClick={() => {
                                    setNewLevelData({
                                        ...newLevelData,
                                        name: copiedSubmissionData.levelName,
                                        creator: copiedSubmissionData.publisher,
                                        verifier: copiedSubmissionData.levelId,
                                    });
                                    showMessage("복사한 제출 데이터가 채워졌습니다!", "success");
                                }}
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
                                            <input type="file" className="hidden" accept="image/*" onChange={handleNewLevelImage} />
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-bold text-zinc-500">INSERT RANK (1 ~ 200)</label>
                                <input
                                    type="number"
                                    value={newLevelData.rank}
                                    onChange={(e) => setNewLevelData({ ...newLevelData, rank: parseInt(e.target.value) || 1 })}
                                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-lg font-bold text-cyan-400 outline-none focus:border-cyan-500/50"
                                    min={1} max={200}
                                />
                                <p className="mt-1 text-[10px] text-zinc-600">※ 해당 순위부터의 기존 맵들은 모두 한 칸씩 아래로 밀려납니다.</p>
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-bold text-zinc-500">Level Name</label>
                                <input
                                    value={newLevelData.name}
                                    onChange={(e) => setNewLevelData({ ...newLevelData, name: e.target.value })}
                                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-zinc-100 outline-none focus:border-cyan-500/50"
                                    placeholder="Daybreak"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1 block text-xs font-bold text-zinc-500">Published by</label>
                                    <input
                                        value={newLevelData.creator}
                                        onChange={(e) => setNewLevelData({ ...newLevelData, creator: e.target.value })}
                                        className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-cyan-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-bold text-zinc-500">Level ID</label>
                                    <input
                                        value={newLevelData.verifier}
                                        onChange={(e) => setNewLevelData({ ...newLevelData, verifier: e.target.value })}
                                        className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-cyan-500/50"
                                        placeholder="ex: 12345678"
                                    />
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleInsert}
                                disabled={saving === -1}
                                className="mt-4 w-full rounded-lg bg-cyan-600 py-4 font-black transition-all hover:bg-cyan-500 disabled:opacity-50 shadow-xl shadow-cyan-900/20"
                            >
                                {saving === -1 ? "INSERTING..." : "INSERT LEVEL & SHIFT OTHERS"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 숨겨진 파일 인풋 */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && editingLevel) handleImageUpload(editingLevel.id, file);
                    e.target.value = "";
                }}
            />

            {/* 편집 모달 */}
            {editingLevel && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-xl font-black italic text-zinc-100">EDIT RANK #{editingLevel.rank}</h2>
                            <button type="button" onClick={() => setEditingLevel(null)} className="text-zinc-500 hover:text-white">
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
                                            onChange={(e) => updateEditingField("rank", parseInt(e.target.value) || 1)}
                                            className="w-full rounded-lg border border-cyan-500/30 bg-zinc-900 px-3 py-3 text-lg font-black text-cyan-400 outline-none focus:border-cyan-500"
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <label className="mb-1 block text-[10px] font-black text-zinc-600">Level Name</label>
                                        <input
                                            value={editingLevel.name}
                                            onChange={(e) => updateEditingField("name", e.target.value)}
                                            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-3 text-sm font-bold text-zinc-100 outline-none focus:border-cyan-500/50"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="mb-1 block text-[10px] font-black text-zinc-600">Published by</label>
                                        <input
                                            value={editingLevel.creator}
                                            onChange={(e) => updateEditingField("creator", e.target.value)}
                                            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-3 text-sm font-bold text-zinc-100 outline-none focus:border-cyan-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-[10px] font-black text-zinc-600">Level ID</label>
                                        <input
                                            value={editingLevel.verifier}
                                            onChange={(e) => updateEditingField("verifier", e.target.value)}
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
                                onClick={() => {
                                    console.log("Save clicked");
                                    handleSave(editingLevel);
                                }}
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
                                        console.log("Clear button click");
                                        handleClear(editingLevel);
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
                                        console.log("Delete button click");
                                        handleDelete(editingLevel);
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
            )}

            {/* 레벨 리스트 (탭: levels) */}
            {activeTab === "levels" && (
                <div className="grid grid-cols-1 gap-2">
                    {levels.map((level) => (
                        <button
                            key={level.id}
                            onClick={() => setEditingLevel({ ...level })}
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
                                    <div className="flex h-full w-full items-center justify-center"><ImageIcon className="h-4 w-4 text-zinc-800" /></div>
                                )}
                            </div>

                            <div className="flex-grow min-w-0">
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
            )}

            {/* 제출된 기록 리스트 (탭: submissions) */}
            {activeTab === "submissions" && (
                <div className="space-y-4">
                    {submissions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
                            <Inbox className="h-16 w-16 mb-4" />
                            <p className="text-sm font-bold uppercase tracking-widest">제출된 기록이 없습니다</p>
                        </div>
                    ) : (
                        submissions.map((sub) => (
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
                                        onClick={() => handleDeleteSubmission(sub.id)}
                                        className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-2 text-zinc-500 hover:text-red-400 hover:border-red-500/30 transition-all"
                                        title="삭제"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {/* 썸네일 미리보기 (있을 경우) */}
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
                                        {/* 썸네일 다운로드 (있을 경우) */}
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
                                            onClick={() => handleCopyInfo(sub)}
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
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
