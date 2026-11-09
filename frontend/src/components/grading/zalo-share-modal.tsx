"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  MessageSquare,
  ShieldCheck,
  User,
  GraduationCap,
  Loader2,
  Share2,
} from "lucide-react";
import { GradedStudent, ExamSession } from "./session-detail-view";

interface ZaloShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: GradedStudent | null;
  session: ExamSession;
  teacherName?: string;
  isTeacherVerified?: boolean;
}

export function ZaloShareModal({
  isOpen,
  onClose,
  student,
  session,
  teacherName = "Thầy/Cô EduTest",
  isTeacherVerified = false,
}: ZaloShareModalProps) {
  const [loading, setLoading] = useState(false);
  const [reportUrl, setReportUrl] = useState("");
  const [token, setToken] = useState("");
  const [zaloText, setZaloText] = useState("");
  const [teacherNote, setTeacherNote] = useState("");
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Compute student rank
  const calculateRank = (targetStudent: GradedStudent): { rank: number; total: number } => {
    const list = session.gradedStudents || [];
    if (list.length === 0) return { rank: 1, total: 1 };
    const sorted = [...list].sort((a, b) => b.score - a.score);
    const index = sorted.findIndex((s) => s.id === targetStudent.id);
    return {
      rank: index >= 0 ? index + 1 : 1,
      total: list.length,
    };
  };

  const generateReport = async (customNote?: string) => {
    if (!student) return;
    setLoading(true);
    setError(null);

    const { rank, total } = calculateRank(student);

    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          sessionName: session.name,
          subject: session.subject,
          grade: session.grade,
          sheetType: session.sheetType,
          questionCount: session.questionCount,
          answerKey: session.answerKey,
          student,
          totalStudents: total,
          rank,
          teacherName,
          isTeacherVerified,
          teacherNote: customNote !== undefined ? customNote : teacherNote,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Không thể tạo báo cáo.");
      }

      const data = await res.json();
      setToken(data.token);
      setReportUrl(data.reportUrl);
      setZaloText(data.zaloShareText || data.zaloMessage || "");
    } catch (err: any) {
      console.error("Zalo report generation failed:", err);
      setError(err.message || "Đã xảy ra lỗi khi kết nối tới máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && student) {
      setTeacherNote("");
      generateReport("");
    }
  }, [isOpen, student?.id]);

  if (!isOpen || !student) return null;

  const { rank, total } = calculateRank(student);

  const handleCopyText = () => {
    if (!zaloText) return;
    navigator.clipboard.writeText(zaloText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleCopyLink = () => {
    if (!reportUrl) return;
    navigator.clipboard.writeText(reportUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-neutral-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-50/60 to-indigo-50/60 dark:from-slate-900 dark:to-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white">
                  Gửi Báo Cáo Zalo Phụ Huynh
                </h3>
                <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  Sprint 1
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-slate-400">
                Phiếu báo cáo phân tích ma trận năng lực GDPT & Magic Link
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
          {/* Student quick recap banner */}
          <div className="bg-neutral-50 dark:bg-slate-800/60 rounded-xl p-3 border border-neutral-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>{student.studentName}</span>
                {student.className && <span className="text-neutral-500 font-normal">({student.className})</span>}
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-slate-400 mt-0.5">
                SBD: {student.studentCode || "Chưa có"} · Bài: {session.name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                {student.score} điểm · Hạng #{rank}/{total}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-xs font-semibold text-neutral-700 dark:text-slate-300">
                AI đang tổng hợp ma trận GDPT & soạn tin nhắn Zalo...
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-slate-400">
                Tự động nhận diện ưu/nhược điểm từng câu làm bài
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300">
              <p className="font-bold">Không thể tạo báo cáo:</p>
              <p className="mt-1">{error}</p>
              <button
                onClick={() => generateReport()}
                className="mt-2 px-3 py-1 bg-rose-600 text-white rounded font-bold cursor-pointer hover:bg-rose-700"
              >
                Thử lại
              </button>
            </div>
          ) : (
            <>
              {/* Report Webview Link */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-slate-300 mb-1">
                  Đường dẫn xem báo cáo trực tuyến (Magic Link):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={reportUrl}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-800 text-neutral-800 dark:text-slate-200 font-mono truncate select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-slate-700 hover:bg-neutral-100 dark:hover:bg-slate-800 text-xs font-bold transition cursor-pointer flex items-center gap-1 shrink-0"
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
                    href={reportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs font-bold transition flex items-center gap-1 shrink-0 border border-blue-200 dark:border-blue-900"
                  >
                    <span>Xem trước</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Pre-formatted Message Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-neutral-700 dark:text-slate-300 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                    <span>Nội dung tin nhắn mẫu gửi Phụ huynh:</span>
                  </label>
                  <button
                    onClick={handleCopyText}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedText ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600">Đã copy tin nhắn</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Sao chép toàn bộ tin nhắn</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={zaloText}
                  onChange={(e) => setZaloText(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-neutral-800 dark:text-slate-200 leading-relaxed font-sans focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Optional Teacher Custom Note */}
              <div className="p-3 bg-neutral-50 dark:bg-slate-800/40 rounded-xl border border-neutral-200 dark:border-slate-700">
                <label className="block text-[11px] font-bold text-neutral-700 dark:text-slate-300 mb-1">
                  Lời dặn riêng của Thầy/Cô gửi vào trang báo cáo (Tùy chọn):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="VD: Em cần chú ý làm lại bài tập hình học trang 45..."
                    value={teacherNote}
                    onChange={(e) => setTeacherNote(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-neutral-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => generateReport(teacherNote)}
                    disabled={loading}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg text-xs font-bold transition cursor-pointer shrink-0"
                  >
                    Cập nhật
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-100 dark:border-slate-800 bg-neutral-50 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-[11px] text-neutral-500 dark:text-slate-400">
            Mở Zalo và dán tin nhắn trực tiếp vào khung chat của Phụ huynh.
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleCopyText}
              disabled={loading || !zaloText}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              {copiedText ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Đã sao chép!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy tin nhắn</span>
                </>
              )}
            </button>

            <a
              href="https://zalo.me"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition inline-flex items-center gap-1.5 shadow-xs"
            >
              <span>Mở Zalo Web</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
