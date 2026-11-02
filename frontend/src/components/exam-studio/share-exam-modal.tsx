"use client";

import React, { useState } from "react";
import {
  Share2,
  X,
  Copy,
  Check,
  ExternalLink,
  Users,
  GraduationCap,
  Globe,
  QrCode,
  FileText,
} from "lucide-react";
import { APP_URL } from "@/lib/constants";

interface ShareExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  examId: string | null;
  examTitle: string;
  questionCount: number;
}

export function ShareExamModal({
  isOpen,
  onClose,
  examId,
  examTitle,
  questionCount,
}: ShareExamModalProps) {
  const [activeTab, setActiveTab] = useState<"teacher" | "student">("student");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  if (!isOpen) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : APP_URL;
  const teacherShareUrl = examId
    ? `${origin}/exams/${examId}`
    : `${origin}/exams`;
  const studentExamUrl = examId
    ? `${origin}/student/exams/${examId}`
    : `${origin}/student/exams`;

  const currentUrl = activeTab === "student" ? studentExamUrl : teacherShareUrl;

  const handleCopy = (url: string, label: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(label);
    setTimeout(() => {
      setCopiedLink(null);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-slate-800 dark:text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Share2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Chia sẻ Đề thi đang soạn
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-sm">
              {examTitle || "Đề thi mới"} ({questionCount} câu hỏi)
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80">
          <button
            type="button"
            onClick={() => setActiveTab("student")}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition cursor-pointer ${
              activeTab === "student"
                ? "bg-white text-blue-600 shadow-xs dark:bg-slate-900 dark:text-blue-400"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            <span>Cho Học Sinh Làm Bài</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("teacher")}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition cursor-pointer ${
              activeTab === "teacher"
                ? "bg-white text-blue-600 shadow-xs dark:bg-slate-900 dark:text-blue-400"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Cho Giáo Viên Đồng Nghiệp</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-4 space-y-4">
          {activeTab === "student" ? (
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
              <div className="flex items-start gap-2.5">
                <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-blue-900 dark:text-blue-200">
                    Phòng thi trực tuyến & Nộp bài tự động
                  </p>
                  <p className="text-blue-700/80 dark:text-blue-300/80 leading-relaxed text-[11px]">
                    Học sinh mở liên kết này để làm bài trắc nghiệm tính giờ, xem biểu đồ Radar năng lực và nhận giải thích chi tiết ngay khi nộp.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
              <div className="flex items-start gap-2.5">
                <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-indigo-900 dark:text-indigo-200">
                    Chia sẻ tài nguyên chuyên môn
                  </p>
                  <p className="text-indigo-700/80 dark:text-indigo-300/80 leading-relaxed text-[11px]">
                    Đồng nghiệp có thể xem cấu trúc ma trận chuẩn GDPT 2025, tải file Word (.docx) sạch hoặc sao chép đề thi về Studio cá nhân.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* URL Box & Copy */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
              Đường dẫn chia sẻ trực tiếp:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => handleCopy(currentUrl, activeTab)}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition cursor-pointer shadow-xs shrink-0"
              >
                {copiedLink === activeTab ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Đã chép!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Sao chép</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Actions Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Mở xem thử trong tab mới</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
