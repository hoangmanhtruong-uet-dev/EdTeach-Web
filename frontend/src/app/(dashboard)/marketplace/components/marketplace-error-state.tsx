"use client";

import React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

interface MarketplaceErrorStateProps {
  message?: string;
  onRetry: () => void;
}

export function MarketplaceErrorState({
  message = "Không thể tải danh sách đề thi từ máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.",
  onRetry,
}: MarketplaceErrorStateProps) {
  return (
    <div
      role="alert"
      className="rounded-3xl border border-destructive/30 bg-card p-10 sm:p-14 text-center max-w-lg mx-auto shadow-xs space-y-4"
    >
      <div className="mx-auto w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
        <AlertCircle className="w-6 h-6" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base font-bold text-card-foreground">
          Đã xảy ra lỗi khi tải chợ đề thi
        </h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
          {message}
        </p>
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-[38px] items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Thử lại ngay</span>
        </button>
      </div>
    </div>
  );
}
