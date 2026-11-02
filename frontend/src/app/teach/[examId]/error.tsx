"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, ArrowLeft } from "lucide-react";

export default function TeachingStudioError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[TeachingStudioError]", error);
  }, [error]);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 p-6 text-center text-white">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-4">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-bold text-slate-100">Không thể tải Bục Giảng Số</h2>
      <p className="mt-2 text-sm text-slate-400 max-w-md">
        {error?.message || "Đã xảy ra sự cố khi tải không gian Bục Giảng Số. Vui lòng thử lại hoặc quay lại danh sách đề thi."}
      </p>
      {error?.digest && (
        <span className="mt-2 text-[11px] font-mono text-slate-500">Mã tham chiếu: {error.digest}</span>
      )}
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-md transition cursor-pointer"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Thử lại</span>
        </button>
        <Link
          href="/exams"
          className="flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại danh sách đề</span>
        </Link>
      </div>
    </div>
  );
}
