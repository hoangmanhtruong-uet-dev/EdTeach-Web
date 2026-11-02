"use client";

import React from "react";
import Link from "next/link";
import {
  FileEdit,
  Shuffle,
  Presentation,
  ScanLine,
  BarChart3,
  Download,
  ChevronRight,
  Sparkles,
  Printer,
} from "lucide-react";

interface TeachingStepperBarProps {
  examId: string;
  examName?: string;
  questionCount?: number;
  onOpenShuffleModal?: () => void;
  onExportDualTeaching?: () => void;
  isExporting?: boolean;
}

export function TeachingStepperBar({
  examId,
  examName = "Đề thi",
  questionCount = 0,
  onOpenShuffleModal,
  onExportDualTeaching,
  isExporting = false,
}: TeachingStepperBarProps) {
  return (
    <div className="w-full border-b border-border bg-card/95 backdrop-blur-md px-3 sm:px-6 py-2 shadow-2xs select-none">
      <div className="mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Journey Title & Question count badge */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-md bg-primary/10 text-primary font-bold px-2 py-0.5 text-[11px] tracking-wide uppercase">
            <Sparkles className="w-3 h-3" aria-hidden="true" />
            Hành Trình Tiết Dạy 360°
          </span>
          <span className="text-muted-foreground hidden md:inline">•</span>
          <span className="text-muted-foreground font-medium hidden md:inline truncate max-w-xs" title={examName}>
            {examName}
          </span>
          <span className="rounded-full bg-muted px-2 py-0.2 text-[10px] font-semibold text-muted-foreground tabular-nums">
            {questionCount} câu hỏi
          </span>
        </div>

        {/* Center: 5 Interactive Steps */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
          {/* Bước 1: Soạn & Duyệt đề (Active) */}
          <div
            className="flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-2.5 py-1.5 font-bold shadow-2xs shrink-0"
            title="Bước 1: Soạn và tinh chỉnh nội dung đề thi chuẩn ma trận GDPT 2025"
          >
            <FileEdit className="w-3.5 h-3.5" aria-hidden="true" />
            <span>1. Soạn & Duyệt</span>
          </div>

          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" aria-hidden="true" />

          {/* Bước 2: In Word kép cho học sinh & giáo viên */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onExportDualTeaching}
              disabled={isExporting}
              title="Bước 2: In Bộ Đề Kép Word (.docx) - 1 Bản Học Sinh (dòng chấm chép bài) & 1 Bản Giáo Viên (kèm lời giải)"
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2.5 py-1.5 font-semibold transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-emerald-500"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <span>2. In Word kép</span>
            </button>
          </div>

          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" aria-hidden="true" />

          {/* Bước 3: Chiếu Bục Giảng Số 4.0 */}
          <Link
            href={`/teach/${examId}`}
            title="Bước 3: Chiếu chữa đề chia đôi màn hình Split-Screen kết hợp Bảng nháp Excalidraw và Đẻ câu tương tự"
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 dark:border-blue-800/80 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-2.5 py-1.5 font-bold transition-colors shadow-2xs shrink-0 cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-blue-500"
          >
            <Presentation className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            <span>3. Bục Giảng</span>
          </Link>

          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" aria-hidden="true" />

          {/* Bước 4: Quét Chấm OMR */}
          <Link
            href={`/grading?examId=${examId}&autoScan=true`}
            title="Bước 4: Mở máy chấm trắc nghiệm OpenCV, tự động nạp đáp án chuẩn của đề thi này"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground px-2.5 py-1.5 font-medium transition-colors shrink-0 cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary"
          >
            <ScanLine className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
            <span>4. Chấm OMR</span>
          </Link>

          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" aria-hidden="true" />

          {/* Bước 5: Bảng Điểm & Báo Cáo */}
          <Link
            href={`/grading?examId=${examId}&tab=history`}
            title="Bước 5: Xem bảng điểm cả lớp, xuất file Excel và sao chép nhận xét cá nhân hóa gửi Zalo phụ huynh"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground px-2.5 py-1.5 font-medium transition-colors shrink-0 cursor-pointer focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary"
          >
            <BarChart3 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            <span>5. Báo cáo</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
