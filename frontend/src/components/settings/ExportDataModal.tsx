"use client";

import React, { useState, useEffect } from "react";
import {
  Download,
  FileSpreadsheet,
  FileCode2,
  X,
  AlertCircle,
  Clock,
  CheckCircle2,
  Lock,
} from "lucide-react";

export interface ExportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExport: (format: "csv" | "json") => void;
}

const COOLDOWN_SECONDS = 60;
const STORAGE_KEY = "edutest_last_data_export_ts";

export function ExportDataModal({
  isOpen,
  onClose,
  onConfirmExport,
}: ExportDataModalProps) {
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) return;

    const checkCooldown = () => {
      try {
        const lastExportStr = localStorage.getItem(STORAGE_KEY);
        if (lastExportStr) {
          const lastTs = parseInt(lastExportStr, 10);
          const elapsed = Math.floor((Date.now() - lastTs) / 1000);
          if (elapsed < COOLDOWN_SECONDS) {
            setSecondsRemaining(COOLDOWN_SECONDS - elapsed);
            return;
          }
        }
        setSecondsRemaining(0);
      } catch {
        setSecondsRemaining(0);
      }
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearInterval(interval);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleProceed = () => {
    if (secondsRemaining > 0) return;
    try {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    } catch {
      // ignore
    }
    onConfirmExport(format);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-start justify-between gap-3 pb-2 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Yêu cầu xuất dữ liệu cá nhân
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Quyền truy xuất & bản sao dữ liệu (Nghị định 13/2023/NĐ-CP)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Thầy/Cô có thể tải về bản sao đầy đủ hồ sơ sư phạm, ngân hàng đề thi đã tạo và lịch sử biến động ví credits:
        </p>

        {/* Format Selection Cards */}
        <div className="space-y-2.5">
          <label className="block text-xs font-bold text-foreground">
            Chọn định dạng tệp tải về:
          </label>

          <div
            role="button"
            tabIndex={0}
            aria-label="Chọn định dạng Bảng tính Excel CSV"
            onClick={() => setFormat("csv")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setFormat("csv");
              }
            }}
            className={`rounded-xl border p-3.5 cursor-pointer transition flex items-start gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              format === "csv"
                ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                : "border-border hover:bg-muted/50"
            }`}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0 mt-0.5">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Bảng tính Excel / CSV (.csv)</span>
                <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                  Khuyên dùng cho GV
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Mở trực tiếp trên Microsoft Excel, Google Sheets. Thống kê rõ ràng hồ sơ, mã đề thi, lịch sử nạp/trừ credits.
              </p>
            </div>
          </div>

          <div
            role="button"
            tabIndex={0}
            aria-label="Chọn định dạng Tệp Kỹ thuật JSON"
            onClick={() => setFormat("json")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setFormat("json");
              }
            }}
            className={`rounded-xl border p-3.5 cursor-pointer transition flex items-start gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              format === "json"
                ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs"
                : "border-border hover:bg-muted/50"
            }`}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 shrink-0 mt-0.5">
              <FileCode2 className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Tệp Kỹ thuật JSON (.json)</span>
                <span className="text-[10px] text-muted-foreground">Chuẩn NĐ 13/2023/NĐ-CP</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Cấu trúc dữ liệu máy đọc (Machine-readable) chứa trọn vẹn toàn bộ thuộc tính cơ sở dữ liệu và cấu hình hệ thống.
              </p>
            </div>
          </div>
        </div>

        {/* Cooldown notice if active */}
        {secondsRemaining > 0 ? (
          <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300 border border-amber-500/20">
            <Clock className="w-4 h-4 shrink-0" />
            <span>
              Để tránh quá tải hệ thống, vui lòng chờ <strong>{secondsRemaining}s</strong> trước khi yêu cầu xuất lần tiếp theo.
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border">
            <Lock className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>Hệ thống sẽ yêu cầu xác thực mật khẩu hiện tại trước khi tạo tệp tải xuống.</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted transition cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleProceed}
            disabled={secondsRemaining > 0}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tiếp tục tải xuống</span>
          </button>
        </div>
      </div>
    </div>
  );
}
