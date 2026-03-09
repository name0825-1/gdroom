"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, RefreshCw, ShieldAlert, FileText, LayoutList, Plus } from "lucide-react";
import { LevelsTab, Level } from "@/components/admin/LevelsTab";
import { SubmissionsTab, Submission } from "@/components/admin/SubmissionsTab";
import { EditLevelModal } from "@/components/admin/EditLevelModal";
import { InsertLevelModal } from "@/components/admin/InsertLevelModal";

interface NewLevelData {
    name: string;
    creator: string;
    verifier: string;
    rank: number;
    imageUrl: string;
}

export default function AdminDashboard() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [levels, setLevels] = useState<Level[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [activeTab, setActiveTab] = useState<"levels" | "submissions">("levels");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Modal states
    const [editingLevel, setEditingLevel] = useState<Level | null>(null);
    const [isInsertModalOpen, setIsInsertModalOpen] = useState(false);
    const [newLevelData, setNewLevelData] = useState<NewLevelData>({
        name: "", creator: "", verifier: "", rank: 1, imageUrl: ""
    });

    // Submissions
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [copiedSubmissionData, setCopiedSubmissionData] = useState<{ levelName: string, publisher: string, levelId: string } | null>(null);

    // Confirm clicks
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [clearConfirm, setClearConfirm] = useState<number | null>(null);

    const router = useRouter();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const res = await fetch("/api/auth/check");
            const data = await res.json();
            if (data.isAdmin) {
                setIsAuthenticated(true);
                fetchData();
            } else {
                router.push("/admin/login");
            }
        } catch {
            router.push("/admin/login");
        }
    };

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
    };

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [levelsRes, subRes] = await Promise.all([
                fetch("/api/levels", { cache: "no-store" }),
                fetch("/api/submissions", { cache: "no-store" })
            ]);

            if (!levelsRes.ok || !subRes.ok) throw new Error("Failed to fetch data");

            const [levelsData, subData] = await Promise.all([
                levelsRes.json(),
                subRes.json()
            ]);

            setLevels(levelsData.levels || []);
            setSubmissions(subData.submissions || []);
        } catch (err) {
            setError("데이터를 불러오는데 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    // Submissions Handlers
    const handleCopyInfo = (sub: Submission) => {
        setCopiedSubmissionData({
            levelName: sub.levelName,
            publisher: sub.publisher,
            levelId: sub.levelId
        });
        setCopiedId(sub.id);

        // Mark as read
        if (!sub.isRead) {
            fetch(`/api/submissions/${sub.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isRead: true })
            }).then(() => fetchData());
        }

        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDeleteSubmission = async (id: number) => {
        if (!confirm("이 제출 기록을 삭제하시겠습니까? (DB에서 완전히 삭제됩니다)")) return;

        try {
            const res = await fetch(`/api/submissions/${id}`, { method: "DELETE" });
            if (res.ok) fetchData();
            else alert("삭제 실패");
        } catch (error) {
            alert("서버 오류");
        }
    };

    // Images Handlers
    const uploadImageToImgbb = async (file: File): Promise<string | null> => {
        try {
            const formData = new FormData();
            formData.append("image", file);
            const res = await fetch("/api/upload", { method: "POST", body: formData });
            if (!res.ok) throw new Error("Upload failed");
            const data = await res.json();
            return data.url;
        } catch (e) {
            alert("이미지 업로드에 실패했습니다.");
            return null;
        }
    };

    // Levels Handlers
    const handleSaveList = async (level: Level) => {
        setSaving(level.id);
        try {
            const res = await fetch(`/api/levels/${level.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(level),
            });
            if (res.ok) {
                setEditingLevel(null);
                fetchData();
            } else {
                const data = await res.json();
                alert(data.error || "수정 실패");
            }
        } catch (error) {
            alert("서버 연결 실패");
        } finally {
            setSaving(null);
            setDeleteConfirm(null);
            setClearConfirm(null);
        }
    };

    const handleDeleteLevel = async (level: Level) => {
        setSaving(level.id);
        try {
            const res = await fetch(`/api/levels/${level.id}`, { method: "DELETE" });
            if (res.ok) {
                setEditingLevel(null);
                fetchData();
            } else alert("삭제 실패");
        } catch (e) { alert("서버 오류"); }
        finally { setSaving(null); setDeleteConfirm(null); }
    };

    const handleClearLevel = async (level: Level) => {
        const clearedLevel = { ...level, name: "--", creator: "--", verifier: "--", imageUrl: null };
        handleSaveList(clearedLevel);
    };

    const handleInsertLevel = async () => {
        setSaving(-1); // Insert indicator
        try {
            const res = await fetch("/api/levels", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newLevelData),
            });
            if (res.ok) {
                setIsInsertModalOpen(false);
                setNewLevelData({ name: "", creator: "", verifier: "", rank: 1, imageUrl: "" });
                fetchData();
            } else {
                const data = await res.json();
                alert(data.error || "삽입 실패");
            }
        } catch (e) {
            alert("서버 오류");
        } finally {
            setSaving(null);
        }
    };

    if (isAuthenticated === null) return <div className="flex min-h-screen items-center justify-center"><RefreshCw className="h-6 w-6 animate-spin text-cyan-500" /></div>;

    return (
        <div className="min-h-screen bg-black pb-20 pt-[72px]">
            <div className="container mx-auto px-4 max-w-4xl pt-8">

                {/* Header */}
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl bg-zinc-900 p-6 border border-zinc-800 shadow-xl shadow-cyan-900/10">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10">
                            <ShieldAlert className="h-6 w-6 text-cyan-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">GDRMCL Admin</h1>
                            <p className="text-xs text-zinc-500">Geometry Dash Room Challenge List</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={fetchData} className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-500 transition-all">
                            <span className="sr-only">새로고침</span>
                            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        </button>
                        <button onClick={handleLogout} className="flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2.5 text-xs font-bold text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all">
                            <LogOut className="h-4 w-4" /> 로그아웃
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-6 flex gap-2 border-b border-zinc-800 pb-px">
                    <button
                        onClick={() => setActiveTab("levels")}
                        className={`group relative flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === "levels" ? "text-cyan-400" : "text-zinc-500 hover:text-zinc-300"}`}
                    >
                        <LayoutList className="h-4 w-4" />
                        레벨 관리
                        {activeTab === "levels" && <span className="absolute bottom-0 left-0 h-0.5 w-full bg-cyan-500 lg:shadow-[0_0_10px_rgba(6,182,212,0.5)]" />}
                    </button>
                    <button
                        onClick={() => setActiveTab("submissions")}
                        className={`group relative flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === "submissions" ? "text-cyan-400" : "text-zinc-500 hover:text-zinc-300"}`}
                    >
                        <div className="relative">
                            <FileText className="h-4 w-4" />
                            {submissions.filter(s => !s.isRead).length > 0 && (
                                <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500"></span>
                                </span>
                            )}
                        </div>
                        제출된 기록
                        {activeTab === "submissions" && <span className="absolute bottom-0 left-0 h-0.5 w-full bg-cyan-500 lg:shadow-[0_0_10px_rgba(6,182,212,0.5)]" />}
                    </button>
                </div>

                {/* Content */}
                {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-500">{error}</div>}

                {loading && levels.length === 0 ? (
                    <div className="flex h-40 items-center justify-center">
                        <Loader />
                    </div>
                ) : (
                    <>
                        {activeTab === "levels" && (
                            <div>
                                <button
                                    onClick={() => {
                                        setNewLevelData({ ...newLevelData, rank: 1 });
                                        setIsInsertModalOpen(true);
                                    }}
                                    className="group mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-cyan-500/30 bg-cyan-500/5 p-4 transition-all hover:border-cyan-500/60 hover:bg-cyan-500/10"
                                >
                                    <Plus className="h-5 w-5 text-cyan-500 group-hover:scale-125 transition-transform" />
                                    <span className="text-sm font-bold text-cyan-400">새로운 레벨 중간 삽입 (Insert)</span>
                                </button>

                                <LevelsTab levels={levels} onEdit={setEditingLevel} />
                            </div>
                        )}

                        {activeTab === "submissions" && (
                            <SubmissionsTab
                                submissions={submissions}
                                copiedId={copiedId}
                                onDelete={handleDeleteSubmission}
                                onCopy={handleCopyInfo}
                            />
                        )}
                    </>
                )}
            </div>

            {/* Modals */}
            {editingLevel && (
                <EditLevelModal
                    editingLevel={editingLevel}
                    saving={saving}
                    deleteConfirm={deleteConfirm}
                    clearConfirm={clearConfirm}
                    onClose={() => { setEditingLevel(null); setDeleteConfirm(null); setClearConfirm(null); }}
                    onSave={handleSaveList}
                    onClear={() => clearConfirm === editingLevel.id ? handleClearLevel(editingLevel) : setClearConfirm(editingLevel.id)}
                    onDelete={() => deleteConfirm === editingLevel.id ? handleDeleteLevel(editingLevel) : setDeleteConfirm(editingLevel.id)}
                    onUpdateField={(field, value) => setEditingLevel({ ...editingLevel, [field]: value })}
                    onImageUpload={async (file) => {
                        const url = await uploadImageToImgbb(file);
                        if (url) setEditingLevel({ ...editingLevel, imageUrl: url });
                    }}
                />
            )}

            {isInsertModalOpen && (
                <InsertLevelModal
                    newLevelData={newLevelData}
                    saving={saving}
                    copiedSubmissionData={copiedSubmissionData}
                    onClose={() => setIsInsertModalOpen(false)}
                    onInsert={handleInsertLevel}
                    onUpdateField={(field, value) => setNewLevelData({ ...newLevelData, [field]: value })}
                    onPasteSubmission={() => {
                        if (copiedSubmissionData) {
                            setNewLevelData({
                                ...newLevelData,
                                name: copiedSubmissionData.levelName,
                                creator: copiedSubmissionData.publisher,
                                verifier: copiedSubmissionData.levelId,
                            });
                        }
                    }}
                    onImageChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const url = await uploadImageToImgbb(file);
                        if (url) setNewLevelData({ ...newLevelData, imageUrl: url });
                    }}
                />
            )}
        </div>
    );
}

function Loader() {
    return <RefreshCw className="h-8 w-8 animate-spin text-cyan-500" />;
}
