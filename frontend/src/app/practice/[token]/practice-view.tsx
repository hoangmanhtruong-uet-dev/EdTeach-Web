"use client";

import React, { useState, useEffect } from "react";
import {
  RemediationSheetData,
  ClonedQuestion,
} from "@/lib/remediation/remediation-store";
import { useConfirm } from "@/context/confirm-dialog-context";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Award,
  Clock,
  Send,
  RotateCcw,
  BookOpen,
  User,
  GraduationCap,
  ShieldCheck,
  Check,
  Share2,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Brain,
  Calculator,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";
import { PedagogicalViralFooter } from "@/components/public/pedagogical-viral-footer";

interface PracticeViewProps {
  initialSheet: RemediationSheetData;
}

export function PracticeView({ initialSheet }: PracticeViewProps) {
  const { confirm } = useConfirm();
  const [sheet, setSheet] = useState<RemediationSheetData>(initialSheet);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  const isCompleted = sheet.status === "completed";
  const questions = sheet.clonedQuestions || [];
  const totalQuestions = questions.length;

  // Restore saved in-progress answers from localStorage if not completed
  useEffect(() => {
    if (!isCompleted && typeof window !== "undefined") {
      const saved = localStorage.getItem(`practice_answers_${sheet.token}`);
      if (saved) {
        try {
          setAnswers(JSON.parse(saved));
        } catch {
          // ignore
        }
      }
    } else if (isCompleted && sheet.submissionData?.studentAnswers) {
      setAnswers(sheet.submissionData.studentAnswers);
    }
  }, [sheet.token, isCompleted]);

  // Timer while not completed
  useEffect(() => {
    if (isCompleted) return;
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isCompleted]);

  const handleSelectOption = (questionIndex: number, optionKey: "A" | "B" | "C" | "D") => {
    if (isCompleted) return;
    const key = (questionIndex + 1).toString();
    const updated = { ...answers, [key]: optionKey };
    setAnswers(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(`practice_answers_${sheet.token}`, JSON.stringify(updated));
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const answeredCount = Object.keys(answers).length;

  const handleSubmit = async () => {
    if (isCompleted || submitting) return;

    if (answeredCount < totalQuestions) {
      const confirmSubmit = await confirm({
        title: "Xác nhận nộp bài thi",
        message: `Bạn mới làm ${answeredCount}/${totalQuestions} câu hỏi. Bạn có chắc chắn muốn nộp bài ngay bây giờ?`,
        confirmText: "Nộp bài ngay",
        cancelText: "Làm tiếp",
        variant: "warning",
      });
      if (!confirmSubmit) return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/practice/${sheet.token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentAnswers: answers }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Không thể nộp bài.");
      }

      const data = await res.json();
      if (data.sheet) {
        setSheet(data.sheet);
        if (typeof window !== "undefined") {
          localStorage.removeItem(`practice_answers_${sheet.token}`);
        }
        // Smooth scroll to top to see score
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err: any) {
      console.error("Submission error:", err);
      setErrorMsg(err.message || "Đã xảy ra lỗi khi nộp bài.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-slate-950 text-neutral-900 dark:text-slate-100 font-sans pb-24 selection:bg-blue-500 selection:text-white">
      {/* 1. TOP BRANDING BAR */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-neutral-200 dark:border-slate-800 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-black text-sm shadow-xs shrink-0">
              ⚡
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-neutral-900 dark:text-white">
                  EduTest
                </span>
                <span className="text-[10px] uppercase font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded">
                  Remediation
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-slate-400 truncate">
                Phiếu Luyện Bù Lỗ Hổng Kiến Thức
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {!isCompleted ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 dark:bg-slate-800 text-neutral-700 dark:text-slate-300 font-mono text-xs font-bold border border-neutral-200 dark:border-slate-700">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>{formatTimer(secondsElapsed)}</span>
              </div>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-900">
                <Check className="w-3.5 h-3.5" />
                <span>Đã nộp bài</span>
              </span>
            )}

            <button
              onClick={handleCopyShare}
              className="p-1.5 rounded-lg border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-neutral-100 text-neutral-600 dark:text-slate-300 transition cursor-pointer"
              title="Chia sẻ liên kết"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-3xl mx-auto px-4 pt-6 space-y-5">
        {/* 2. STUDENT & EXAM HEADER BANNER */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-neutral-200 dark:border-slate-800 p-5 shadow-xs relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs font-bold mb-2">
                <Brain className="w-3.5 h-3.5" />
                <span>Môn {sheet.subject} · Lớp {sheet.grade}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                Phiếu Củng Cố Kiến Thức — {sheet.studentName}
              </h1>
              <p className="text-xs text-neutral-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                {sheet.studentCode && <span>SBD: <strong>{sheet.studentCode}</strong></span>}
                {sheet.className && <span>Lớp: <strong>{sheet.className}</strong></span>}
                <span>Bài thi gốc: <strong>{sheet.examTitle}</strong></span>
              </p>
            </div>

            {/* Custom Tutor Branding (MAX tier perk) */}
            {sheet.customBranding && (sheet.customBranding.tutorName || sheet.customBranding.centerName) && (
              <div className="bg-neutral-50 dark:bg-slate-800/80 border border-neutral-200 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:max-w-xs shrink-0 self-start">
                <div className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-white">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>{sheet.customBranding.tutorName || sheet.customBranding.centerName}</span>
                </div>
                {sheet.customBranding.phone && (
                  <p className="text-[11px] text-neutral-500 dark:text-slate-400 mt-0.5">
                    Hotline: {sheet.customBranding.phone}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* 3. SCORE RESULT BANNER (If completed) */}
        {isCompleted && (
          <section className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl p-5 shadow-md animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Award className="w-6 h-6 text-emerald-200" />
                  <h2 className="text-lg font-black tracking-tight">
                    Kết Quả Luyện Bù Kiến Thức
                  </h2>
                </div>
                <p className="text-xs text-emerald-100 mt-1">
                  Chúc mừng em đã hoàn thành bài củng cố kiến thức! Dưới đây là barem giải 3 bước và mẹo Casio chi tiết.
                </p>
              </div>

              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2.5 text-center shrink-0 border border-white/30">
                <div className="text-2xl sm:text-3xl font-black">
                  {sheet.score?.toFixed(1)} <span className="text-sm font-normal text-emerald-100">/ 10</span>
                </div>
                <div className="text-[11px] font-bold text-emerald-100 mt-0.5">
                  Đúng {sheet.submissionData?.correctCount}/{totalQuestions} câu ({sheet.submissionData?.accuracyPercent}%)
                </div>
              </div>
            </div>

            {sheet.reportToken && (
              <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs">
                <span>Tiến độ đã được tự động đồng bộ vào phiếu báo cáo của Phụ huynh:</span>
                <a
                  href={`/report/${sheet.reportToken}`}
                  className="font-bold underline hover:text-emerald-100 inline-flex items-center gap-1"
                >
                  <span>Xem phiếu báo cáo</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </section>
        )}

        {/* 4. PROGRESS BAR (If not completed) */}
        {!isCompleted && (
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-neutral-200 dark:border-slate-800 p-3.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="text-neutral-700 dark:text-slate-300">
                Tiến độ làm bài: {answeredCount} / {totalQuestions} câu
              </span>
              <span className="text-amber-600 dark:text-amber-400">
                {Math.round((answeredCount / totalQuestions) * 100)}%
              </span>
            </div>
            <div className="w-full h-2 bg-neutral-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-300"
                style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
              />
            </div>
          </section>
        )}

        {/* 5. QUESTION LIST */}
        <section className="space-y-4">
          {questions.map((q, idx) => {
            const qNum = idx + 1;
            const qKey = qNum.toString();
            const studentSelected = answers[qKey];
            const isCorrect = isCompleted && studentSelected === q.correctAnswer;
            const isWrong = isCompleted && studentSelected && studentSelected !== q.correctAnswer;
            const isUnattempted = isCompleted && !studentSelected;

            return (
              <div
                key={q.id || idx}
                id={`q_${qNum}`}
                className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-xs transition ${
                  isCompleted
                    ? isCorrect
                      ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/20"
                      : "border-rose-300 dark:border-rose-800 bg-rose-50/20"
                    : "border-neutral-200 dark:border-slate-800"
                }`}
              >
                {/* Question Header */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-slate-800 text-neutral-800 dark:text-slate-200 font-black text-xs flex items-center justify-center">
                      {qNum}
                    </span>
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900">
                      Tương tự Câu {q.originalQuestionNumber}
                    </span>
                    <span className="text-[11px] text-neutral-500 dark:text-slate-400">
                      [{q.cognitiveLabel || "Thông hiểu"}]
                    </span>
                  </div>

                  {isCompleted && (
                    <div>
                      {isCorrect ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đúng
                        </span>
                      ) : isWrong ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-100 dark:bg-rose-950 px-2 py-0.5 rounded">
                          <XCircle className="w-3.5 h-3.5" /> Sai
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-neutral-500 bg-neutral-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          <HelpCircle className="w-3.5 h-3.5" /> Chưa làm
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Question Content */}
                <div className="text-xs sm:text-sm text-neutral-900 dark:text-slate-100 leading-relaxed font-medium mb-4 whitespace-pre-wrap">
                  {q.content}
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(["A", "B", "C", "D"] as const).map((optKey) => {
                    const optText = q.options ? q.options[optKey] : "";
                    const isSelected = studentSelected === optKey;
                    const isActualCorrect = isCompleted && q.correctAnswer === optKey;

                    let btnStyle = "border-neutral-200 dark:border-slate-800 bg-neutral-50/60 dark:bg-slate-800/40 hover:bg-neutral-100 text-neutral-800 dark:text-slate-200";

                    if (!isCompleted) {
                      if (isSelected) {
                        btnStyle = "border-amber-500 bg-amber-50 dark:bg-amber-950 text-amber-950 dark:text-amber-200 ring-2 ring-amber-500/50 font-bold";
                      }
                    } else {
                      if (isActualCorrect) {
                        btnStyle = "border-emerald-500 bg-emerald-100 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500 font-bold";
                      } else if (isSelected && !isActualCorrect) {
                        btnStyle = "border-rose-500 bg-rose-100 dark:bg-rose-950 text-rose-950 dark:text-rose-200 ring-2 ring-rose-500 line-through opacity-80";
                      }
                    }

                    return (
                      <button
                        key={optKey}
                        type="button"
                        disabled={isCompleted}
                        onClick={() => handleSelectOption(idx, optKey)}
                        className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition cursor-pointer disabled:cursor-default ${btnStyle}`}
                      >
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-black shrink-0 ${
                            isSelected
                              ? "bg-amber-600 text-white"
                              : isActualCorrect
                              ? "bg-emerald-600 text-white"
                              : "bg-neutral-200 dark:bg-slate-700 text-neutral-700 dark:text-slate-300"
                          }`}
                        >
                          {optKey}
                        </span>
                        <span className="text-xs leading-relaxed flex-1">
                          {optText}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Post-submission: Detailed Explanation & Casio Tip */}
                {isCompleted && (
                  <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-slate-800 space-y-3">
                    {/* 3-Step Explanation */}
                    <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-300 mb-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                        <span>Lời giải chi tiết 3 bước:</span>
                      </div>
                      <p className="text-xs text-blue-950 dark:text-blue-200 leading-relaxed whitespace-pre-wrap">
                        {q.explanation}
                      </p>
                    </div>

                    {/* Casio fx-580 Tip (if present) */}
                    {q.casioTip && (
                      <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 dark:text-purple-300 mb-1">
                          <Calculator className="w-3.5 h-3.5 text-purple-600" />
                          <span>Tuyệt kỹ bấm máy Casio fx-580VNX:</span>
                        </div>
                        <p className="text-xs text-purple-950 dark:text-purple-200 leading-relaxed font-mono">
                          {q.casioTip}
                        </p>
                      </div>
                    )}

                    {/* Concept Note / Pitfall Warning */}
                    {q.conceptNote && (
                      <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-amber-900 dark:text-amber-300">
                            Bẫy sai lầm cần lưu ý:
                          </p>
                          <p className="text-xs text-amber-950 dark:text-amber-200 mt-0.5">
                            {q.conceptNote}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* Error message if any */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 font-bold">
            {errorMsg}
          </div>
        )}

        {/* PEDAGOGICAL VIRAL FOOTER */}
        <PedagogicalViralFooter
          teacherName={sheet.customBranding?.tutorName || "Thầy Cô Gia Sư"}
          teacherSchool={sheet.customBranding?.centerName}
          teacherSubject={sheet.subject}
          isVerified={sheet.customBranding?.isVerified ?? true}
          referralCode={sheet.customBranding?.referralCode || "EDUTEST2026"}
        />
      </main>

      {/* 6. STICKY SUBMIT FOOTER BAR (If not completed) */}
      {!isCompleted && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-neutral-200 dark:border-slate-800 p-3 sm:p-4 shadow-lg">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
            <div className="text-xs text-neutral-600 dark:text-slate-400">
              Đã trả lời: <strong className="text-neutral-900 dark:text-white font-bold">{answeredCount}</strong> / {totalQuestions} câu
            </div>

            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs sm:text-sm font-black shadow-md transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang chấm bài...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Nộp bài & Tự chấm ngay</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
