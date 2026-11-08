"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[EdTeach Global Error Caught]:", error);
  }, [error]);

  return (
    <html lang="vi">
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center shadow-md shadow-rose-500/10">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">
              Đã Xảy Ra Sự Cố Bất Ngờ
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Hệ thống EduTest đã ghi nhận lỗi để đội ngũ kỹ thuật xử lý. Dữ liệu của bạn luôn được bảo vệ an toàn.
            </p>
          </div>

          {error?.digest && (
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-[11px] font-mono text-slate-500">
              Mã lỗi hệ thống: {error.digest}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => reset()}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Thử tải lại trang</span>
            </button>
            <Link
              href="/"
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Về Trang chủ</span>
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
