"use client";

import React, { useState, useEffect } from "react";
import { Gift, Award, Building, X, ChevronRight, Info } from "lucide-react";
import { MARKETPLACE_COMMISSION_TIERS } from "@/lib/constants";

interface MarketplaceInfoCardsProps {
  userTier?: "free" | "pro" | "max" | string;
}

const STORAGE_KEY = "marketplace_hide_info_cards_v1";

export function MarketplaceInfoCards({ userTier = "free" }: MarketplaceInfoCardsProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "true") {
        setIsDismissed(true);
      }
    } catch {
      // Ignore localStorage read errors
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Ignore localStorage write errors
    }
  };

  const handleRestore = () => {
    setIsDismissed(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore localStorage write errors
    }
  };

  if (!isMounted) return null;

  if (isDismissed) {
    return (
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={handleRestore}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1 px-2 rounded-lg hover:bg-muted cursor-pointer"
          title="Xem lại chính sách chia sẻ và rút tiền"
        >
          <Info className="w-3.5 h-3.5 text-primary" />
          <span>Xem chính sách & tỷ lệ doanh thu</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Normalize current user tier
  const normalizedTier = userTier === "max" ? "max" : userTier === "pro" ? "pro" : "free";

  return (
    <div className="relative">
      {/* Dismiss button */}
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute -top-2.5 right-1 z-10 p-1 rounded-full bg-muted text-muted-foreground hover:text-foreground hover:bg-accent border border-border shadow-xs cursor-pointer transition"
        title="Đóng phần hướng dẫn"
        aria-label="Đóng bảng thông tin chính sách"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Card 1: Chia Sẻ Miễn Phí */}
        <div className="bg-card rounded-2xl p-4 border border-border shadow-xs flex items-start gap-3.5 transition-all hover:border-primary/40">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xs sm:text-[13px] font-bold text-card-foreground">
              Chia Sẻ Miễn Phí (0 Credits)
            </h2>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 leading-relaxed">
              Đề thi, đề kiểm tra định kỳ được giáo viên tự nguyện chia sẻ hoàn toàn miễn phí cho cộng đồng.
            </p>
          </div>
        </div>

        {/* Card 2: Bản Quyền & Thu Nhập Tác Giả */}
        <div className="bg-card rounded-2xl p-4 border border-border shadow-xs flex items-start gap-3.5 transition-all hover:border-primary/40">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xs sm:text-[13px] font-bold text-card-foreground">
              Bản Quyền Tác Giả Tới 95%
            </h2>
            <div className="flex flex-wrap items-center gap-1 text-[11px] font-semibold mt-1">
              <span className="text-muted-foreground">Tác giả nhận:</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  normalizedTier === "free"
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "text-muted-foreground bg-muted"
                }`}
                title={normalizedTier === "free" ? "Gói tài khoản hiện tại của Thầy/Cô" : undefined}
              >
                Free {MARKETPLACE_COMMISSION_TIERS.free.authorPercent}
                {normalizedTier === "free" && " ✓"}
              </span>
              <span className="text-muted-foreground/60">·</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  normalizedTier === "pro"
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "text-muted-foreground bg-muted"
                }`}
                title={normalizedTier === "pro" ? "Gói tài khoản hiện tại của Thầy/Cô" : undefined}
              >
                PRO {MARKETPLACE_COMMISSION_TIERS.pro.authorPercent}
                {normalizedTier === "pro" && " ✓"}
              </span>
              <span className="text-muted-foreground/60">·</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  normalizedTier === "max"
                    ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                    : "text-muted-foreground bg-muted"
                }`}
                title={normalizedTier === "max" ? "Gói tài khoản hiện tại của Thầy/Cô" : undefined}
              >
                MAX {MARKETPLACE_COMMISSION_TIERS.max.authorPercent}
                {normalizedTier === "max" && " ✓"}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 leading-relaxed">
              Tự do đặt giá credits cho đề sáng tạo. Thu nhập ghi nhận minh bạch vào ví.
            </p>
          </div>
        </div>

        {/* Card 3: Rút Tiền VietQR 24/7 */}
        <div className="bg-card rounded-2xl p-4 border border-border shadow-xs flex items-start gap-3.5 transition-all hover:border-primary/40">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
            <Building className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xs sm:text-[13px] font-bold text-card-foreground">
              Rút Tiền Về VietQR 24/7
            </h2>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 leading-relaxed">
              Quy đổi 1 Credit = 100 VNĐ. Rút tiền tự động về tài khoản mọi ngân hàng từ 200.000 VNĐ.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
