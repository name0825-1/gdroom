"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Send, Loader2, ExternalLink, ImageIcon, X } from "lucide-react";

// 유효성 검사 정규식
const LEVEL_ID_REGEX = /^\d{8,}$/;
const VIDEO_URL_REGEX = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be|drive\.google\.com)\//;

export default function SubmitPage() {
    const [formData, setFormData] = useState({
        levelName: "",
        publisher: "",
        levelId: "",
        videoUrl: "",
    });
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cooldownRemaining, setCooldownRemaining] = useState<number | null>(null);
    const thumbnailInputRef = useRef<HTMLInputElement>(null);

    // [AI ANALYSIS NOTE - 쿨다운 방어 로직]
    // 악성 유저가 제출 폼을 프로그램 매크로를 돌려 도배하는 것을 1차적으로 방지하기 위한
    // 로컬 스토리지 기반 클라이언트 측 5분(300,000ms) 대기 타이머입니다.
    // 제출 직후 localStorage에 타임스탬프를 기입하고, 시간이 지날 때까지 UI 자체를 차단합니다.
    useEffect(() => {
        const checkCooldown = () => {
            const lastSubmitTime = localStorage.getItem("lastSubmitTime");
            if (lastSubmitTime) {
                const elapsed = Date.now() - parseInt(lastSubmitTime, 10);
                const cooldownMs = 5 * 60 * 1000;
                if (elapsed < cooldownMs) {
                    setCooldownRemaining(cooldownMs - elapsed);
                } else {
                    setCooldownRemaining(null);
                    localStorage.removeItem("lastSubmitTime");
                }
            }
        };

        checkCooldown();
        const interval = setInterval(checkCooldown, 1000);
        return () => clearInterval(interval);
    }, []);

    const rules = [
        "GDRMCL의 인원이 손수 만든 맵이여야 한다.",
        "정직하게 베리파이된 맵만 등재될 수 있으며, 베리파이핵 등의 핵을 통하여 베리파이된 맵은 등재되지 않는다.",
        "영상 등의 자료가 불충분한 경우 등재가 되지 않을 수 있다.",
        "자신이 만든 맵을 복사 및 수정 후 등재는 최대 2회까지 가능하다.",
    ];

    const isFormValid =
        formData.levelName.trim() !== "" &&
        formData.publisher.trim() !== "" &&
        formData.levelId.trim() !== "" &&
        formData.videoUrl.trim() !== "";

    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            setError("썸네일 이미지는 2MB 이하여야 합니다.");
            return;
        }

        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            setError("JPG, PNG, WebP 형식만 업로드 가능합니다.");
            return;
        }

        setThumbnailFile(file);
        setThumbnailPreview(URL.createObjectURL(file));
        setError(null);
    };

    const removeThumbnail = () => {
        setThumbnailFile(null);
        setThumbnailPreview(null);
        if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
    };

    const handleSubmit = async () => {
        if (!isFormValid) {
            setError("모든 필수 항목을 빠짐없이 입력해주세요.");
            return;
        }

        // Level ID 검증: 숫자 8자리 이상
        if (!LEVEL_ID_REGEX.test(formData.levelId.trim())) {
            setError("잘못된 아이디입니다");
            return;
        }

        // Video URL 검증: YouTube 또는 Google Drive만 허용
        if (!VIDEO_URL_REGEX.test(formData.videoUrl.trim())) {
            setError("영상 URL은 YouTube(youtube.com, youtu.be) 또는 Google Drive(drive.google.com) 링크만 허용됩니다.");
            return;
        }

        setError(null);
        setIsSubmitting(true);

        try {
            let imageUrl: string | null = null;

            // [AI ANALYSIS NOTE - 클라이언트 이미지 최적화]
            // DB 부하 및 ImgBB API 전송량 초과를 막기 위하여, 유저가 업로드한 이미지를 브라우저 내부(Canvas)에서
            // 가로세로 최대 800px 사이즈로 압축한 후 Base64로 인코딩합니다. 이 과정은 서버리스 자원을 소모하지 않습니다.
            // 1단계: 브라우저에서 직접 이미지를 안전한 크기로 압축 및 Base64 변환
            if (thumbnailFile) {
                imageUrl = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(thumbnailFile);
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
                            resolve(canvas.toDataURL("image/jpeg", 0.7));
                        };
                        img.onerror = (e) => reject(e);
                    };
                    reader.onerror = (e) => reject(e);
                });
            }

            // 2단계: 제출 데이터 전송
            const res = await fetch("/api/submissions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, imageUrl }),
            });

            if (res.ok) {
                setIsSubmitted(true);
                setFormData({ levelName: "", publisher: "", levelId: "", videoUrl: "" });
                removeThumbnail();
                localStorage.setItem("lastSubmitTime", Date.now().toString());
                setCooldownRemaining(5 * 60 * 1000);
            } else {
                const data = await res.json();
                setError(data.error || "제출에 실패했습니다.");
            }
        } catch (err: any) {
            console.error("Submission error:", err);
            setError("제출 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12 sm:px-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-auto max-w-3xl"
            >
                <div className="mb-12 text-center">
                    <h1 className="mb-4 text-4xl font-black tracking-tighter text-white sm:text-5xl">
                        SUBMIT RECORD
                    </h1>
                    <p className="text-zinc-500 font-medium tracking-wide uppercase text-sm">
                        기록 등재 신청 전 아래 규정을 반드시 확인해주세요.
                    </p>
                </div>

                {/* 규정 섹션 */}
                <div className="mb-12 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8 backdrop-blur-md">
                    <div className="mb-6 flex items-center gap-3 text-cyan-400">
                        <AlertCircle className="h-6 w-6" />
                        <h2 className="text-xl font-bold italic uppercase tracking-tight">Submission Rules</h2>
                    </div>

                    <div className="space-y-4">
                        {rules.map((rule, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-start gap-4 rounded-xl border border-zinc-800/50 bg-zinc-950/30 p-4 transition-colors hover:border-zinc-700"
                            >
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-xs font-black text-cyan-400">
                                    {index + 1}
                                </div>
                                <p className="text-base leading-relaxed text-zinc-300">
                                    {rule}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* 안내 문구 */}
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 text-center">
                    <p className="text-sm font-medium text-amber-400/80 italic">
                        ※ 규정을 위반한 신청은 예고 없이 반려될 수 있습니다.
                    </p>
                </div>

                {/* 제출 성공 화면 */}
                {isSubmitted ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-12 flex flex-col items-center gap-6 py-16 border-t border-zinc-800"
                    >
                        <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/30">
                            <CheckCircle2 className="h-10 w-10 text-green-400" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-2xl font-black text-white mb-2">제출 완료!</h3>
                            <p className="text-zinc-400 text-sm">
                                기록이 관리자에게 전송되었습니다.<br />
                                검토 후 리스트에 반영됩니다.
                            </p>
                        </div>
                        <button
                            onClick={() => setIsSubmitted(false)}
                            className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/80 px-8 py-3 text-sm font-bold text-zinc-400 transition-all hover:border-zinc-700 hover:text-white"
                        >
                            새 기록 제출하기
                        </button>
                    </motion.div>
                ) : cooldownRemaining !== null ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-12 flex flex-col items-center gap-6 py-16 border-t border-zinc-800"
                    >
                        <div className="h-20 w-20 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/30">
                            <Loader2 className="h-10 w-10 text-cyan-400 animate-spin" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-2xl font-black text-white mb-2">재제출 대기 중</h3>
                            <p className="text-zinc-400 text-sm leading-relaxed">
                                무분별한 제출을 방지하기 위해 5분의 대기 시간이 적용됩니다.<br />
                                <span className="font-bold text-cyan-400">
                                    {Math.floor(cooldownRemaining / 60000)}분 {Math.floor((cooldownRemaining % 60000) / 1000)}초
                                </span> 뒤에 다시 시도해주세요.
                            </p>
                        </div>
                    </motion.div>
                ) : (
                    /* 제출 폼 */
                    <div className="mt-12 border-t border-zinc-800 pt-10">
                        <h2 className="mb-8 text-xl font-black italic text-cyan-400 uppercase tracking-tight">
                            Submit Your Record
                        </h2>

                        <div className="space-y-5">
                            {/* 레벨 이름 */}
                            <div>
                                <label className="mb-2 block text-xs font-bold text-zinc-500 tracking-wider">
                                    Level Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.levelName}
                                    onChange={(e) => setFormData({ ...formData, levelName: e.target.value })}
                                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-5 py-4 text-sm font-bold text-white placeholder-zinc-600 outline-none transition-colors focus:border-cyan-500/50"
                                    placeholder=""
                                />
                            </div>

                            {/* PUBLISHED BY & LEVEL ID */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="mb-2 block text-xs font-bold text-zinc-500 tracking-wider">
                                        Published by <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.publisher}
                                        onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-5 py-4 text-sm font-bold text-white placeholder-zinc-600 outline-none transition-colors focus:border-cyan-500/50"
                                        placeholder=""
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-xs font-bold text-zinc-500 tracking-wider">
                                        Level ID <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.levelId}
                                        onChange={(e) => {
                                            // 숫자만 입력 허용
                                            const val = e.target.value.replace(/\D/g, "");
                                            setFormData({ ...formData, levelId: val });
                                        }}
                                        className={`w-full rounded-xl border bg-zinc-900/50 px-5 py-4 text-sm font-bold text-white placeholder-zinc-600 outline-none transition-colors focus:border-cyan-500/50 ${formData.levelId && !LEVEL_ID_REGEX.test(formData.levelId)
                                            ? "border-red-500/50"
                                            : "border-zinc-800"
                                            }`}
                                        placeholder=""
                                    />
                                    {formData.levelId && !LEVEL_ID_REGEX.test(formData.levelId) && (
                                        <p className="mt-1 text-[11px] text-red-400">잘못된 아이디입니다</p>
                                    )}
                                </div>
                            </div>

                            {/* 영상 자료 */}
                            <div>
                                <label className="mb-2 block text-xs font-bold text-zinc-500 tracking-wider">
                                    Video URL <span className="text-red-400">*</span>
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="url"
                                        value={formData.videoUrl}
                                        onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                                        className={`w-full rounded-xl border bg-zinc-900/50 px-5 py-4 text-sm font-bold text-white placeholder-zinc-600 outline-none transition-colors focus:border-cyan-500/50 ${formData.videoUrl && !VIDEO_URL_REGEX.test(formData.videoUrl)
                                            ? "border-red-500/50"
                                            : "border-zinc-800"
                                            }`}
                                        placeholder="https://youtube.com/watch?v=..."
                                    />
                                    {formData.videoUrl && VIDEO_URL_REGEX.test(formData.videoUrl) && (
                                        <a
                                            href={formData.videoUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="shrink-0 rounded-lg border border-zinc-800 bg-zinc-900/80 p-3 text-zinc-400 hover:text-white transition-colors"
                                        >
                                            <ExternalLink className="h-5 w-5" />
                                        </a>
                                    )}
                                </div>
                                {formData.videoUrl && !VIDEO_URL_REGEX.test(formData.videoUrl) && (
                                    <p className="mt-1 text-[11px] text-red-400">YouTube 또는 Google Drive 링크만 허용됩니다.</p>
                                )}
                                <p className="mt-2 text-[11px] text-zinc-600">
                                    YouTube(youtube.com, youtu.be) 또는 Google Drive(drive.google.com) 링크만 입력 가능합니다.
                                </p>
                            </div>

                            {/* 썸네일 (선택 사항) */}
                            <div>
                                <label className="mb-2 block text-xs font-bold text-zinc-500 tracking-wider">
                                    Thumbnail
                                </label>
                                <input
                                    type="file"
                                    ref={thumbnailInputRef}
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleThumbnailChange}
                                    className="hidden"
                                />
                                {thumbnailPreview ? (
                                    <div className="relative group rounded-xl border border-zinc-800 overflow-hidden">
                                        <img src={thumbnailPreview} alt="썸네일 미리보기" className="w-full h-40 object-cover" />
                                        <button
                                            onClick={removeThumbnail}
                                            className="absolute top-2 right-2 rounded-lg bg-black/70 p-1.5 text-zinc-400 hover:text-red-400 transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => thumbnailInputRef.current?.click()}
                                        className="w-full rounded-xl border border-dashed border-zinc-700 bg-zinc-900/30 p-6 flex flex-col items-center gap-2 text-zinc-600 hover:border-zinc-500 hover:text-zinc-400 transition-colors"
                                    >
                                        <ImageIcon className="h-8 w-8" />
                                        <span className="text-xs font-bold">맵 썸네일 이미지 업로드 (JPG, PNG, WebP / 2MB 이하)</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 에러 메시지 */}
                        {error && (
                            <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm font-bold text-red-400">
                                {error}
                            </div>
                        )}

                        {/* 제출 버튼 */}
                        <button
                            onClick={handleSubmit}
                            disabled={!isFormValid || isSubmitting}
                            className="mt-8 w-full rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 py-5 font-black text-lg text-white shadow-xl shadow-cyan-900/20 transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    제출 중...
                                </>
                            ) : (
                                <>
                                    <Send className="h-5 w-5" />
                                    기록 제출하기
                                </>
                            )}
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
