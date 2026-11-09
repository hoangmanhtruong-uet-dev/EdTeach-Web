"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Zap,
  Check,
  Copy,
  ExternalLink,
  Printer,
  Share2,
  Brain,
  BookOpen,
  User,
  ShieldCheck,
  Loader2,
  AlertCircle,
  CheckSquare,
  CheckCircle2,
  Square,
} from "lucide-react";
import { GradedStudent, ExamSession } from "./session-detail-view";
import { RemediationSheetData } from "@/lib/remediation/remediation-store";
import { scoreStudentAnswers } from "@/lib/grading/omr-template-resolver";
// remediation docx exporter loaded dynamically on demand

interface RemediationModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: GradedStudent | null;
  session: ExamSession;
  teacherName?: string;
  isTeacherVerified?: boolean;
}

export function RemediationModal({
  isOpen,
  onClose,
  student,
  session,
  teacherName = "Thầy/Cô EduTest",
  isTeacherVerified = false,
}: RemediationModalProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sheet, setSheet] = useState<RemediationSheetData | null>(null);
  const [practiceUrl, setPracticeUrl] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedZalo, setCopiedZalo] = useState(false);

  // Selected wrong questions to clone
  const [selectedQuestionNums, setSelectedQuestionNums] = useState<number[]>([]);

  // Tutor branding form (MAX Tier)
  const [tutorBrandName, setTutorBrandName] = useState(teacherName || "");
  const [tutorPhone, setTutorPhone] = useState("");

  // Extract all wrong questions for this student (hỗ trợ cả ABCD, Đúng/Sai GDPT 2025 & Điền số)
  const wrongQuestions = React.useMemo(() => {
    if (!student) return [];
    const scored = scoreStudentAnswers({
      sheetType: session.sheetType,
      subject: session.subject,
      questionCount: session.questionCount || 40,
      answerKey: session.answerKey || {},
      studentAnswers: student.studentAnswers || {},
    });
    const totalQ = scored.totalQuestions || session.questionCount || 40;

    return scored.details
      .filter((d) => !d.isCorrect)
      .map((d) => {
        const ratio = totalQ > 0 ? d.questionNumber / totalQ : 0;
        const cog =
          ratio <= 0.4
            ? "Nhận biết"
            : ratio <= 0.7
            ? "Thông hiểu"
            : ratio <= 0.9
            ? "Vận dụng"
            : "Vận dụng cao";

        return {
          questionNumber: d.questionNumber,
          cognitiveLevel: cog,
          studentAnswer: d.studentAnswer || "Chưa điền",
          correctAnswer: d.correctAnswer || "",
        };
      });
  }, [student, session]);

  // Default select all wrong questions when opening
  useEffect(() => {
    if (isOpen && student) {
      setSheet(null);
      setErrorMsg(null);
      setSelectedQuestionNums(wrongQuestions.map((w) => w.questionNumber));
    }
  }, [isOpen, student?.id, wrongQuestions]);

  if (!isOpen || !student) return null;

  const toggleSelectQuestion = (qNum: number) => {
    if (selectedQuestionNums.includes(qNum)) {
      setSelectedQuestionNums(selectedQuestionNums.filter((n) => n !== qNum));
    } else {
      setSelectedQuestionNums([...selectedQuestionNums, qNum]);
    }
  };

  const handleGenerateSheet = async () => {
    if (selectedQuestionNums.length === 0) {
      setErrorMsg("Vui lòng chọn ít nhất 1 câu hỏi để tạo bài luyện bù.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const questionsToClone = wrongQuestions.filter((w) =>
      selectedQuestionNums.includes(w.questionNumber)
    );

    try {
      const res = await fetch("/api/remediation/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          studentId: student.id,
          studentName: student.studentName,
          studentCode: student.studentCode,
          className: student.className || session.grade,
          subject: session.subject || "Toán",
          grade: session.grade || "12",
          examTitle: session.name,
          wrongQuestions: questionsToClone,
          customBranding: {
            tutorName: tutorBrandName || undefined,
            phone: tutorPhone || undefined,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Không thể tạo phiếu luyện bù.");
      }

      const data = await res.json();
      setSheet(data.sheet);
      setPracticeUrl(data.practiceUrl);
    } catch (err: any) {
      console.error("Remediation generate failed:", err);
      setErrorMsg(err.message || "Đã xảy ra lỗi khi tạo phiếu luyện bù AI.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!practiceUrl) return;
    navigator.clipboard.writeText(practiceUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyZaloMessage = () => {
    if (!practiceUrl) return;
    const count = sheet?.clonedQuestions?.length || selectedQuestionNums.length;
    const text =
      `Kính gửi Phụ huynh em ${student.studentName}:\n\n` +
      `Thầy/Cô đã tạo phiếu củng cố kiến thức (${count} câu tương tự các lỗi sai trong bài kiểm tra "${session.name}").\n` +
      `👉 Kính mời Phụ huynh cho em mở điện thoại làm bài trực tuyến tại:\n${practiceUrl}\n\n` +
      `Hệ thống sẽ tự động chấm điểm và cung cấp lời giải 3 bước chi tiết ngay sau khi em nộp bài!`;

    navigator.clipboard.writeText(text);
    setCopiedZalo(true);
    setTimeout(() => setCopiedZalo(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-neutral-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-50/70 to-orange-50/70 dark:from-slate-900 dark:to-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-xs">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white">
                  Tạo Phiếu Luyện Bù Lỗ Hổng Kiến Thức
                </h3>
                <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                  Sprint 2
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-slate-400">
                AI tự động sinh câu hỏi đồng dạng số đẹp khắc phục đúng điểm yếu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Student quick recap */}
          <div className="bg-neutral-50 dark:bg-slate-800/60 rounded-xl p-3 border border-neutral-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-600" />
                <span>{student.studentName}</span>
                {student.className && <span className="text-neutral-500 font-normal">({student.className})</span>}
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-slate-400 mt-0.5">
                SBD: {student.studentCode || "Chưa có"} · Điểm bài thi gốc: <strong>{student.score}/10</strong>
              </p>
            </div>
            <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
              Làm sai {wrongQuestions.length} câu
            </span>
          </div>

          {!sheet ? (
            <>
              {/* Question selection list */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-neutral-800 dark:text-slate-200">
                    Chọn các câu sai cần AI sinh đề đồng dạng:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedQuestionNums.length === wrongQuestions.length) {
                        setSelectedQuestionNums([]);
                      } else {
                        setSelectedQuestionNums(wrongQuestions.map((w) => w.questionNumber));
                      }
                    }}
                    className="text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                  >
                    {selectedQuestionNums.length === wrongQuestions.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                  </button>
                </div>

                {wrongQuestions.length === 0 ? (
                  <p className="text-xs text-emerald-600 font-semibold p-4 text-center bg-emerald-50 rounded-xl">
                    Học sinh đạt điểm tuyệt đối 10/10, không có câu nào làm sai!
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 border border-neutral-100 dark:border-slate-800 rounded-xl">
                    {wrongQuestions.map((w) => {
                      const isSelected = selectedQuestionNums.includes(w.questionNumber);
                      return (
                        <button
                          key={w.questionNumber}
                          type="button"
                          onClick={() => toggleSelectQuestion(w.questionNumber)}
                          className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? "border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200 font-bold"
                              : "border-neutral-200 dark:border-slate-700 hover:bg-neutral-50 text-neutral-600 dark:text-slate-400"
                          }`}
                        >
                          <div>
                            <span>Câu {w.questionNumber}</span>
                            <span className="block text-[10px] font-normal opacity-70">
                              {w.cognitiveLevel}
                            </span>
                          </div>
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-neutral-300 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Custom Branding (Gia sư / Trung tâm) */}
              <div className="p-3 bg-neutral-50 dark:bg-slate-800/40 rounded-xl border border-neutral-200 dark:border-slate-700 space-y-2">
                <p className="text-[11px] font-bold text-neutral-700 dark:text-slate-300">
                  Thông tin thương hiệu Gia sư (Tùy chọn):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Tên Thầy/Cô hoặc Trung tâm"
                    value={tutorBrandName}
                    onChange={(e) => setTutorBrandName(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-neutral-900 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Số điện thoại / Zalo"
                    value={tutorPhone}
                    onChange={(e) => setTutorPhone(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-neutral-900 dark:text-white"
                  />
                </div>
              </div>
            </>
          ) : (
            /* Created sheet success state */
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Đã tạo thành công {sheet.clonedQuestions.length} câu luyện bù số đẹp!</span>
                </div>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1">
                  Mỗi câu hỏi đều kèm lời giải chi tiết 3 bước và mẹo bấm máy Casio fx-580VNX.
                </p>
              </div>

              {/* Practice Magic Link Box */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-slate-300 mb-1">
                  Đường dẫn làm bài trực tuyến (Gửi cho Học sinh / Phụ huynh):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={practiceUrl}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800 font-mono truncate select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-slate-700 hover:bg-neutral-100 text-xs font-bold transition cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Đã copy</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                  <a
                    href={practiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950 hover:bg-amber-100 text-amber-800 dark:text-amber-300 text-xs font-bold transition flex items-center gap-1 shrink-0 border border-amber-200 dark:border-amber-900"
                  >
                    <span>Mở làm thử</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCopyZaloMessage}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {copiedZalo ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
                  <span>{copiedZalo ? "Đã copy tin nhắn Zalo!" : "Copy tin nhắn mẫu gửi Zalo"}</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const { exportRemediationToDocx } = await import("@/lib/remediation/remediation-docx");
                    exportRemediationToDocx(sheet, true);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-slate-700 hover:bg-neutral-100 text-neutral-800 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Tải file Word (.docx) sạch 100% kèm barem lời giải & mẹo Casio"
                >
                  <Printer className="w-4 h-4 text-amber-600" />
                  <span>Tải file Word (.docx)</span>
                </button>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-100 dark:border-slate-800 bg-neutral-50 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="text-[11px] text-neutral-500 dark:text-slate-400">
            {!sheet
              ? `Đã chọn ${selectedQuestionNums.length}/${wrongQuestions.length} câu hỏi`
              : "Phiếu luyện bù đã sẵn sàng cho học sinh làm online"}
          </div>

          {!sheet ? (
            <button
              type="button"
              disabled={loading || selectedQuestionNums.length === 0}
              onClick={handleGenerateSheet}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI đang sinh đề số đẹp...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Sinh phiếu luyện bù AI ({selectedQuestionNums.length} câu)</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-bold hover:bg-neutral-800 transition cursor-pointer"
            >
              Đóng
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
