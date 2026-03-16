/**
 * 관리자 대시보드 메인 페이지
 *
 * [개요]
 * 레벨 관리(삽입/수정/삭제)와 유저 제출 기록 확인을 담당하는 관리자 전용 페이지입니다.
 * 페이지 로드 시 /api/auth/check로 관리자 인증 여부를 확인하고,
 * 비인증 상태면 로그인 페이지로 리다이렉트합니다.
 *
 * [핵심 아키텍처 - 더블 클릭 방지]
 * 모든 데이터 변이(Mutation) 핸들러는 `saving` 상태로 중복 실행을 차단합니다.
 * saving !== null이면 모든 변이 핸들러가 즉시 return하며, UI 버튼도 disabled 처리됩니다.
 * Two-Phase Raw SQL Shifting이 진행 중일 때 중복 요청이 들어오면
 * 데이터 행이 +10000 영역에 유실되는 치명적 버그가 발생하기 때문입니다.
 *
 * [탭 구조]
 * - 레벨 관리 탭: 200개 레벨 목록 + 삽입/수정/삭제 모달
 * - 제출된 기록 탭: 유저 제출 목록 + 읽음/삭제/정보복사 기능
 *
 * [제출 정보 복사 → 레벨 삽입 워크플로우]
 * 1. 제출된 기록 탭에서 "정보 복사" 클릭 → copiedSubmissionData에 저장
 * 2. 레벨 관리 탭에서 "새로운 레벨 중간 삽입" 클릭 → InsertLevelModal 열림
 * 3. "복사한 제출 정보 붙여넣기" 버튼 클릭 → 폼에 자동 채우기
 * 이 워크플로우로 관리자가 제출 → 등재 과정을 빠르게 처리할 수 있습니다.
 */
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
    sendNotification: boolean;
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
        name: "", creator: "", verifier: "", rank: 1, imageUrl: "", sendNotification: true
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

    // [AI ANALYSIS NOTE - 인증 가드]
    // 페이지 로드 시 세션 쿠키의 유효성을 서버에 확인합니다.
    // iron-session 쿠키가 만료되었거나 변조되었으면 로그인 페이지로 리다이렉트합니다.
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

    // [AI ANALYSIS NOTE - 병렬 데이터 패치]
    // 레벨 목록과 제출 기록을 Promise.all로 동시에 가져와 네트워크 대기 시간을 절반으로 줄입니다.
    // cache: "no-store"로 ISR 캐시를 우회하여 항상 최신 데이터를 보장합니다.
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

            setLevels(Array.isArray(levelsData) ? levelsData : []);
            setSubmissions(Array.isArray(subData) ? subData : []);
        } catch (err) {
            setError("데이터를 불러오는데 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    // [AI ANALYSIS NOTE - 제출 → 등재 브릿지 기능]
    // 제출 기록의 핵심 정보(레벨명, 퍼블리셔, 레벨ID)를 copiedSubmissionData 상태에 저장합니다.
    // 이후 InsertLevelModal에서 "복사한 제출 정보 붙여넣기" 버튼으로 폼에 자동 채울 수 있습니다.
    // 동시에 해당 제출을 "읽음" 상태로 전환하여 미읽음 뱃지를 제거합니다.
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
    const uploadImageToImgbb = async (file: File, levelId: number): Promise<string | null> => {
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("levelId", levelId.toString());
            const res = await fetch("/api/upload", { method: "POST", body: formData });
            if (!res.ok) throw new Error("Upload failed");
            const data = await res.json();
            return data.imageUrl;
        } catch (e) {
            alert("이미지 업로드에 실패했습니다.");
            return null;
        }
    };

    // Levels Handlers
    // [AI ANALYSIS NOTE - RACE CONDITION 방지 (더블클릭 캐치 로직)]
    // 레벨 삽입/수정 시 백엔드에서는 Two-Phase Raw SQL Shifting을 수행합니다.
    // 만약 관리자가 폼 제출 버튼을 1초 안에 2번 눌러 API Request가 2번 날아가면,
    // 첫 번째 요청이 DB Lock을 걸기 전에 두 번째 요청이 임시 대피(+10000)를 중복 실행하게 되어
    // 수많은 데이터 행(rank)이 증발하거나 10000위 밖으로 유실되는 치명적 버그가 발생할 수 있습니다.
    // 따라서 `if (saving !== null) return;` 구문을 통해 프론트엔드 레벨에서 API가 종료될 때까지 
    // 하위 버튼과 상태 변이를 강제로 차단(disabled)해야 합니다.
    const handleSaveList = async (level: Level, sendNotification: boolean = true) => {
        if (saving !== null) return; // [CRITICAL] 더블 클릭 방지 방화벽
        setSaving(level.id);
        try {
            const payload = { ...level, sendNotification };
            const res = await fetch(`/api/levels/${level.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
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

    // [AI ANALYSIS NOTE - 레벨 삭제 + Two-Phase 당기기]
    // 삭제 시 백엔드에서 해당 rank 아래의 모든 레벨을 -1씩 당기고,
    // 빈 200위에 새 플레이스홀더("--")를 생성합니다.
    // saving 가드로 더블 클릭 방지 필수.
    const handleDeleteLevel = async (level: Level, sendNotification: boolean = true) => {
        if (saving !== null) return; // [CRITICAL] 더블 클릭 방지
        setSaving(level.id);
        try {
            const res = await fetch(`/api/levels/${level.id}?sendNotification=${sendNotification}`, { method: "DELETE" });
            if (res.ok) {
                setEditingLevel(null);
                fetchData();
            } else alert("삭제 실패");
        } catch (e) { alert("서버 오류"); }
        finally { setSaving(null); setDeleteConfirm(null); }
    };

    const handleClearLevel = async (level: Level) => {
        if (saving !== null) return;
        const clearedLevel = { ...level, name: "--", creator: "--", verifier: "--", imageUrl: null };
        handleSaveList(clearedLevel);
    };

    const handleInsertLevel = async () => {
        if (saving !== null) return;
        setSaving(-1); // Insert indicator
        try {
            const res = await fetch("/api/levels", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newLevelData),
            });
            if (res.ok) {
                setIsInsertModalOpen(false);
                setNewLevelData({ name: "", creator: "", verifier: "", rank: 1, imageUrl: "", sendNotification: true });
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
                    onSave={(level, notify) => handleSaveList(level, notify)}
                    onClear={() => clearConfirm === editingLevel.id ? handleClearLevel(editingLevel) : setClearConfirm(editingLevel.id)}
                    onDelete={(level, notify) => deleteConfirm === editingLevel.id ? handleDeleteLevel(editingLevel, notify) : setDeleteConfirm(editingLevel.id)}
                    onUpdateField={(field, value) => setEditingLevel({ ...editingLevel, [field]: value })}
                    onImageUpload={async (file) => {
                        const url = await uploadImageToImgbb(file, editingLevel.id);
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
                    onUpdateField={(field, value) => setNewLevelData({ ...newLevelData, [field]: value === "true" ? true : value === "false" ? false : value })}
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
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            const dataUrl = reader.result as string;
                            setNewLevelData({ ...newLevelData, imageUrl: dataUrl });
                        };
                        reader.readAsDataURL(file);
                    }}
                />
            )}
        </div>
    );
}

function Loader() {
    return <RefreshCw className="h-8 w-8 animate-spin text-cyan-500" />;
}
