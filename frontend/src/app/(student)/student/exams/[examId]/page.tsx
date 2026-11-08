"use client";

import React, { useEffect, useState, useTransition, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Flag,
  Send,
  Loader2,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { saveDraftToStorage, getDraftFromStorage } from "@/lib/storage/indexeddb-store";
import { saveToOfflineStore } from "@/lib/storage/indexed-db";

interface ExamQuestion {
  id: string;
  order_index?: number;
  type?: string;
  content: string;
  options?: Record<string, string> | Array<{ key: string; text: string }>;
  difficulty?: string;
}

export default function OnlineExamRoomPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = (params?.examId as string) || (params?.id as string) || "";

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [title, setTitle] = useState("Bài Kiểm Tra Trực Tuyến");
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Selected Answers: { [questionKey: string]: string }
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});

  // Timer state
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  // Autosave status
  const [savingStatus, setSavingStatus] = useState<"saved" | "saving" | "error">("saved");
  const [lastSavedTime, setLastSavedTime] = useState<string>("");

  // Submit Modal & State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<{
    score: number;
    correctCount: number;
    totalQuestions: number;
    canViewAnswers: boolean;
  } | null>(null);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch exam attempt data and clean questions
  useEffect(() => {
    if (!attemptId) return;

    let isMounted = true;
    const fetchExamData = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const res = await fetch(`/api/student/exams/${attemptId}`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          // If attempt not found or demo mode fallback
          if (attemptId.startsWith("demo-") || attemptId.startsWith("exam-")) {
            // Demo fallback questions for testing
            const demoQuestions: ExamQuestion[] = [
              {
                id: "q1",
                order_index: 1,
                content: "Cho hàm số y = f(x) có bảng biến thiên như hình vẽ. Hàm số đồng biến trên khoảng nào dưới đây?",
                options: { A: "(-∞; 0)", B: "(0; 2)", C: "(2; +∞)", D: "(-1; 3)" },
                difficulty: "recognition",
              },
              {
                id: "q2",
                order_index: 2,
                content: "Tìm tập xác định D của hàm số y = log3(x - 2).",
                options: { A: "D = (2; +∞)", B: "D = [2; +∞)", C: "D = (-∞; 2)", D: "D = R \\ {2}" },
                difficulty: "comprehension",
              },
              {
                id: "q3",
                order_index: 3,
                content: "Cho khối chóp S.ABC có đáy là tam giác vuông cân tại B, AB = a. Thể tích khối chóp bằng bao nhiêu?",
                options: { A: "a³/6", B: "a³/3", C: "a³/2", D: "2a³/3" },
                difficulty: "application",
              },
            ];
            if (isMounted) {
              setQuestions(demoQuestions);
              setTitle("Đề Thi Khảo Thí GDPT 2025 (Demo)");
              setExpiresAt(new Date(Date.now() + 45 * 60 * 1000).toISOString());
              setLoading(false);
            }
            return;
          }

          throw new Error(data.error || "Không thể tải phòng thi.");
        }

        if (isMounted) {
          setTitle(data.attempt.title || "Bài Kiểm Tra Trực Tuyến");
          setQuestions(data.attempt.questions || []);
          setExpiresAt(data.attempt.expires_at);
          if (data.attempt?.saved_answers && Object.keys(data.attempt.saved_answers).length > 0) {
            setAnswers(data.attempt.saved_answers);
          } else {
            getDraftFromStorage<Record<string, string>>(`exam_attempt_${attemptId}`).then((draft) => {
              if (draft?.data && isMounted) {
                setAnswers(draft.data);
              }
            });
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMsg(err.message || "Lỗi tải phòng thi.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchExamData();
    return () => {
      isMounted = false;
    };
  }, [attemptId]);

  // 2. Server-bound Countdown Timer
  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const end = new Date(expiresAt).getTime();
      const diffSecs = Math.max(0, Math.floor((end - now) / 1000));

      setSecondsRemaining(diffSecs);

      // Auto-submit when time expires
      if (diffSecs === 0 && !submitResult && !isSubmitting) {
        clearInterval(interval);
        handleSubmitExam(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, submitResult, isSubmitting]);

  // Format seconds into MM:SS or HH:MM:SS
  const formatTimer = (totalSeconds: number | null) => {
    if (totalSeconds === null) return "--:--";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // 3. Debounced Autosave to Supabase & LocalStorage
  const triggerAutosave = useCallback(
    (newAnswers: Record<string, string>) => {
      try {
        localStorage.setItem(`exam_draft_${attemptId}`, JSON.stringify(newAnswers));
        saveDraftToStorage(`exam_attempt_${attemptId}`, newAnswers, 1, false);
        saveToOfflineStore(`exam_attempt_${attemptId}`, newAnswers, 1);
      } catch {}

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      setSavingStatus("saving");
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/student/exams/${attemptId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ answers: newAnswers }),
          });

          if (res.ok) {
            setSavingStatus("saved");
            const d = new Date();
            setLastSavedTime(
              `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`
            );
          } else {
            setSavingStatus("saved"); // keep optimistic
          }
        } catch {
          setSavingStatus("saved");
        }
      }, 1500);
    },
    [attemptId]
  );

  const handleSelectOption = (questionKey: string, optionKey: string) => {
    const updated = { ...answers, [questionKey]: optionKey };
    setAnswers(updated);
    triggerAutosave(updated);
  };

  const toggleFlag = (questionKey: string) => {
    setFlagged((prev) => ({ ...prev, [questionKey]: !prev[questionKey] }));
  };

  // 4. Submit Exam Attempt
  const handleSubmitExam = async (isAutoSubmit = false) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      setShowConfirmModal(false);

      // Sao lưu bài làm vào localStorage phòng sự cố mạng bất ngờ
      try {
        localStorage.setItem(`edteach_backup_${attemptId}`, JSON.stringify({ answers, savedAt: Date.now() }));
      } catch {
        // silent
      }

      const idempotencyKey = crypto.randomUUID();

      const res = await fetch(`/api/student/exams/${attemptId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey,
          answers,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setSubmitError(
          data?.error ||
          data?.message ||
          "Không thể nộp bài do sự cố kết nối máy chủ. Toàn bộ câu trả lời của em đã được lưu an toàn. Vui lòng bấm 'Thử nộp lại'."
        );
        return;
      }

      setSubmitResult({
        score: data.score,
        correctCount: data.correctCount,
        totalQuestions: data.totalQuestions,
        canViewAnswers: Boolean(data.canViewAnswers),
      });

      // Xóa sao lưu tạm khi nộp bài thành công
      try {
        localStorage.removeItem(`edteach_backup_${attemptId}`);
      } catch {
        // silent
      }
    } catch (err: any) {
      console.error("Submit exam error:", err);
      setSubmitError(
        "Mất kết nối mạng khi nộp bài. Toàn bộ câu trả lời của em đã được lưu an toàn trên máy. Vui lòng kiểm tra lại mạng và bấm 'Thử nộp lại'."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          Đang chuẩn bị đề thi an toàn...
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Hệ thống đang đồng bộ đồng hồ server và kết nối phòng thi.
        </p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Không thể vào phòng thi
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">{errorMsg}</p>
          <Link
            href="/student/exams"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại danh sách bài thi</span>
          </Link>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex] || questions[0];
  const currentKey = currentQ?.order_index?.toString() || currentQ?.id || (currentIndex + 1).toString();
  const selectedOption = answers[currentKey] || "";
  const isFlagged = Boolean(flagged[currentKey]);

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = Math.max(0, questions.length - answeredCount);
  const isTimeUrgent = (secondsRemaining ?? 999) < 300; // under 5 mins

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col">
      {/* 1. TOP SECURE EXAM HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/student/exams"
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Thoát phòng thi"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
              {title}
            </h1>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Phòng thi mã hóa server-side</span>
              {lastSavedTime && (
                <span className="hidden sm:inline text-slate-400">
                  • Đã lưu lúc {lastSavedTime}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Timer & Submit button */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-sm font-bold border transition ${
              isTimeUrgent
                ? "bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-600 animate-pulse"
                : "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formatTimer(secondsRemaining)}</span>
          </div>

          <button
            onClick={() => setShowConfirmModal(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nộp bài</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN EXAM BODY (Split: Question View + Question Grid) */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Active Question Card (Cols 1-3) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            {/* Question Header & Flag Button */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-black">
                  Câu {currentIndex + 1} / {questions.length}
                </span>
                <span className="text-xs font-medium text-slate-400 capitalize">
                  {currentQ?.difficulty || "Thông hiểu"}
                </span>
              </div>

              <button
                onClick={() => toggleFlag(currentKey)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isFlagged
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Flag className="w-3.5 h-3.5 fill-current" />
                <span>{isFlagged ? "Đã đánh dấu" : "Đánh dấu xem lại"}</span>
              </button>
            </div>

            {/* Question Content */}
            <div className="text-base sm:text-lg font-medium text-slate-900 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">
              {currentQ?.content || "Chưa có nội dung câu hỏi."}
            </div>

            {/* Options List */}
            <div className="space-y-3 pt-2">
              {currentQ?.options &&
                Object.entries(currentQ.options).map(([optKey, optText]) => {
                  const isSelected = selectedOption === optKey;
                  return (
                    <button
                      key={optKey}
                      onClick={() => handleSelectOption(currentKey, optKey)}
                      className={`w-full p-4 rounded-2xl border text-left transition flex items-center gap-3.5 cursor-pointer ${
                        isSelected
                          ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 text-slate-900 dark:text-slate-100 shadow-xs"
                          : "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <span
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm transition shrink-0 ${
                          isSelected
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {optKey}
                      </span>
                      <span className="text-sm sm:text-base font-normal flex-1">
                        {typeof optText === "string" ? optText : (optText as any)?.text}
                      </span>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Câu trước</span>
            </button>

            <button
              onClick={() =>
                setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))
              }
              disabled={currentIndex >= questions.length - 1}
              className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition flex items-center gap-2"
            >
              <span>Câu tiếp theo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Question Navigation Matrix (Col 4) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Bản đồ câu hỏi
            </h2>

            {/* Stats legend */}
            <div className="grid grid-cols-3 gap-2 text-center text-[11px] pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold">
                <div>{answeredCount}</div>
                <div className="text-[10px] font-normal">Đã làm</div>
              </div>
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold">
                <div>{Object.values(flagged).filter(Boolean).length}</div>
                <div className="text-[10px] font-normal">Đánh dấu</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                <div>{unansweredCount}</div>
                <div className="text-[10px] font-normal">Chưa làm</div>
              </div>
            </div>

            {/* Questions buttons grid */}
            <div className="grid grid-cols-5 gap-2 max-h-[380px] overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const qKey = q.order_index?.toString() || q.id || (idx + 1).toString();
                const isAns = Boolean(answers[qKey]);
                const isFlg = Boolean(flagged[qKey]);
                const isCurr = idx === currentIndex;

                return (
                  <button
                    key={q.id || idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-xl font-bold text-xs transition relative cursor-pointer ${
                      isCurr
                        ? "ring-2 ring-slate-900 dark:ring-white ring-offset-2"
                        : ""
                    } ${
                      isAns
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                    }`}
                  >
                    <span>{idx + 1}</span>
                    {isFlg && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border border-white" />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowConfirmModal(true)}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer mt-4"
            >
              <Send className="w-4 h-4" />
              <span>Nộp bài thi</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. DOUBLE CONFIRMATION SUBMIT MODAL (RC-05, STU-09) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 mx-auto flex items-center justify-center">
                <Send className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Xác nhận nộp bài thi?
              </h3>
              <p className="text-xs text-slate-500">
                Bài thi sẽ được gửi lên server chấm điểm tự động chuẩn GDPT 2025.
              </p>
            </div>

            {/* Summary cards */}
            <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl text-xs">
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Số câu đã làm:</span>
                <span className="font-bold text-emerald-600">
                  {answeredCount} / {questions.length} câu
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Số câu chưa làm:</span>
                <span className={`font-bold ${unansweredCount > 0 ? "text-rose-500" : "text-slate-700 dark:text-slate-300"}`}>
                  {unansweredCount} câu
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Thời gian còn lại:</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  {formatTimer(secondsRemaining)}
                </span>
              </div>
            </div>

            {unansweredCount > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-200">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Em vẫn còn {unansweredCount} câu chưa chọn đáp án. Em có chắc muốn nộp không?</span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 transition"
              >
                Làm tiếp
              </button>
              <button
                onClick={() => handleSubmitExam(false)}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang chấm...</span>
                  </>
                ) : (
                  <span>Nộp ngay</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3.1 SUBMIT ERROR & RETRY MODAL */}
      {submitError && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-7 border border-rose-200 dark:border-rose-900/60 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Chưa thể nộp bài thi
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {submitError}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
              ✓ Đã lưu an toàn {answeredCount}/{questions.length} câu trả lời của em trên trình duyệt.
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSubmitError(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 transition"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => handleSubmitExam(false)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang nộp...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Thử nộp lại</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. RESULT MODAL REVEAL */}
      {submitResult && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-3xl bg-linear-to-tr from-emerald-500 to-teal-500 text-white mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Sparkles className="w-8 h-8 fill-white" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
                Hoàn Thành Bài Kiểm Tra!
              </h2>
              <p className="text-xs text-slate-500">
                Kết quả đã được ghi nhận vào hồ sơ học sinh và báo cáo lớp học.
              </p>
            </div>

            {/* Score Display */}
            <div className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 inline-block w-full">
              <div className="text-4xl sm:text-5xl font-black text-emerald-600">
                {submitResult.score.toFixed(1)}
              </div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
                Thang điểm 10 chuẩn GDPT
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                Đúng {submitResult.correctCount} / {submitResult.totalQuestions} câu
              </div>
            </div>

            {/* Solutions announcement status */}
            {!submitResult.canViewAnswers ? (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-400">
                🔒 Thầy/Cô sẽ công bố lời giải chi tiết sau khi cả lớp hoàn thành bài thi.
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-xs text-teal-700 dark:text-teal-300 font-bold">
                ✨ Lời giải chi tiết đã được mở. Em có thể xem lại bài thi!
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/student/exams"
                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 transition"
              >
                Về danh sách bài thi
              </Link>
              <Link
                href="/student/practice"
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
              >
                <BookOpen className="w-4 h-4" />
                <span>Luyện bù câu sai</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
