"use client";

import React from "react";
import { CheckCircle2, Sparkles, Download, X } from "lucide-react";
import { MarketplaceItem } from "@/types/marketplace";

interface MarketplaceSuccessModalProps {
  item: MarketplaceItem;
  onClose: () => void;
  onCloneToStudio: (item: MarketplaceItem) => void;
  onDownloadDocx: (item: MarketplaceItem) => void;
}

export function MarketplaceSuccessModal({
  item,
  onClose,
  onCloneToStudio,
  onDownloadDocx,
}: MarketplaceSuccessModalProps) {
  const isFree = item.price_credits === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-card text-card-foreground rounded-3xl max-w-md w-full p-6 shadow-2xl border border-border text-center space-y-4 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <h3 className="text-lg font-black text-card-foreground">
            {isFree ? "Nhận đề thành công!" : "Mở khóa bản quyền thành công!"}
          </h3>
          <p className="text-xs text-muted-foreground mt-1.5 max-w-xs mx-auto leading-relaxed">
            Bộ đề <strong className="text-foreground">{item.title}</strong> đã được lưu trữ trong thư viện cá nhân của Thầy/Cô.
          </p>
        </div>

        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={() => onCloneToStudio(item)}
            className="w-full min-h-[42px] py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Sao chép & Mở chỉnh sửa trong Studio</span>
          </button>

          <button
            type="button"
            onClick={() => onDownloadDocx(item)}
            className="w-full min-h-[40px] py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-card-foreground font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Download className="w-4 h-4 text-primary" />
            <span>Tải file Word (.docx) kèm lời giải</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-xs text-muted-foreground hover:text-foreground font-medium cursor-pointer transition"
          >
            Tiếp tục khám phá các đề khác
          </button>
        </div>
      </div>
    </div>
  );
}
