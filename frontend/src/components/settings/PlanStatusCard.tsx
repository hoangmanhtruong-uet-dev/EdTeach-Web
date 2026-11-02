"use client";

import React from "react";
import Link from "next/link";
import { Crown, Sparkles, Shield, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import {
  isMaxUser,
  isProUser,
} from "@/lib/payment/plans";
import { getUserPlanState } from "@/lib/payment/plan-status";

interface PlanStatusCardProps {
  variant?: "compact" | "full";
  className?: string;
  onNavigateToPlan?: () => void;
}

export function PlanStatusCard({
  variant = "compact",
  className = "",
  onNavigateToPlan,
}: PlanStatusCardProps) {
  const { user, profile } = useAuth();

  const userPlanState = getUserPlanState(profile, user);
  const isMax = userPlanState === "max-paid" || userPlanState === "max-beta" || isMaxUser(profile);
  const isPro = userPlanState === "pro" || isProUser(profile);

  let tierName = "Gói Miễn Phí";
  let tierBadge = "Free";
  let TierIcon = Shield;

  if (isMax) {
    tierName = "Luyện thi MAX";
    tierBadge = "MAX";
    TierIcon = Crown;
  } else if (isPro) {
    tierName = "Giáo Viên PRO";
    tierBadge = "PRO";
    TierIcon = Sparkles;
  }

  // Nguồn (Trả phí / Thử nghiệm Beta / Mặc định)
  const isBeta = userPlanState === "max-beta";
  const sourceLabel = isBeta
    ? "Đang dùng thử Beta đến 31/12/2026"
    : isMax || isPro
    ? "Trả phí"
    : "Mặc định";

  // Ngày hết hạn / Gia hạn lần tới
  const rawExpires = profile?.subscription_expires_at || (profile as any)?.subscriptionExpiresAt;
  let expiryText = "Không thời hạn";
  let renewalLabel = "Thời hạn:";

  if (rawExpires) {
    try {
      const d = new Date(rawExpires);
      if (!isNaN(d.getTime())) {
        const diffMs = d.getTime() - Date.now();
        const remainingDays = diffMs > 0 ? Math.ceil(diffMs / (1000 * 60 * 60 * 24)) : 0;
        const formattedDate = d.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
        renewalLabel = "Hết hạn:";
        expiryText = `${formattedDate}${remainingDays > 0 ? ` (Còn ${remainingDays} ngày)` : " (Đã hết hạn)"}`;
      }
    } catch {
      // fallback
    }
  } else if (isBeta) {
    const betaEnd = new Date("2026-12-31T23:59:59Z");
    const diffMs = betaEnd.getTime() - Date.now();
    const remainingDays = diffMs > 0 ? Math.ceil(diffMs / (1000 * 60 * 60 * 24)) : 58;
    renewalLabel = "Hết hạn:";
    expiryText = `31/12/2026 (Còn ${remainingDays} ngày)`;
  }

  // Chu kỳ thanh toán
  const cycleText = (profile as any)?.subscription_cycle === "semester"
    ? "Theo học kỳ (5 tháng)"
    : isMax || isPro
    ? "Hàng tháng"
    : "Mặc định";

  const isFree = !isMax && !isPro && !isBeta;
  const buttonLabel = isFree ? "Nâng cấp gói" : "Quản lý gói";

  if (variant === "compact") {
    return (
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-4 rounded-2xl border ${
          isMax
            ? "border-amber-300/80 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/20 text-amber-950 dark:text-amber-100 shadow-2xs"
            : isPro
            ? "border-blue-300/80 bg-blue-50/70 dark:border-blue-900/50 dark:bg-blue-950/20 text-blue-950 dark:text-blue-100 shadow-2xs"
            : "border-border bg-muted/30 text-foreground"
        } ${className}`}
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isMax
                ? "bg-amber-500 text-white shadow-xs"
                : isPro
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-muted text-muted-foreground border border-border"
            }`}
          >
            <TierIcon className="w-5 h-5" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-black truncate">{tierName}</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isBeta
                    ? "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800"
                    : isMax || isPro
                    ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                    : "bg-muted text-muted-foreground border-border"
                }`}
              >
                {tierBadge}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                · {renewalLabel} {expiryText}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
              <span>Chu kỳ: <strong>{cycleText}</strong></span>
              <span>· Tự động gia hạn: <strong className="text-emerald-700 dark:text-emerald-400">Tắt (nhắc trước 7 ngày)</strong></span>
            </div>
          </div>
        </div>

        <Link
          href="/settings?tab=plan"
          onClick={onNavigateToPlan}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border border-border bg-card text-foreground hover:bg-muted hover:border-muted-foreground/30 transition shadow-2xs shrink-0 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary self-start sm:self-auto"
        >
          <span>{buttonLabel}</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  // Full Variant
  return (
    <div
      className={`rounded-3xl border p-6 shadow-xs ${
        isMax
          ? "border-amber-300/80 bg-linear-to-br from-amber-50 to-orange-50/50 dark:border-amber-900/60 dark:from-amber-950/30 dark:to-orange-950/20"
          : isPro
          ? "border-blue-300/80 bg-linear-to-br from-blue-50 to-indigo-50/50 dark:border-blue-900/60 dark:from-blue-950/30 dark:to-indigo-950/20"
          : "border-border bg-card"
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isMax
                ? "bg-amber-500 text-white"
                : isPro
                ? "bg-blue-600 text-white"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <TierIcon className="w-5 h-5 text-current" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-black text-foreground">{tierName}</h3>
            <p className="text-xs text-muted-foreground">
              {renewalLabel} {expiryText}
            </p>
          </div>
        </div>

        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
          {tierBadge}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground mb-4 p-3.5 rounded-2xl bg-background/60 border border-border/70">
        <div>
          <span className="block text-[11px] font-medium">Chu kỳ gói:</span>
          <strong className="text-foreground">{cycleText}</strong>
        </div>
        <div>
          <span className="block text-[11px] font-medium">Tự động trừ tiền:</span>
          <strong className="text-emerald-700 dark:text-emerald-400">Không (Napas247 từng lần)</strong>
        </div>
        <div>
          <span className="block text-[11px] font-medium">Thông báo gia hạn:</span>
          <strong className="text-foreground">Nhắc trước 7 ngày khi sắp hết hạn</strong>
        </div>
        <div>
          <span className="block text-[11px] font-medium">Nguồn cấp:</span>
          <strong className="text-foreground">{sourceLabel}</strong>
        </div>
      </div>

      <Link
        href="/settings?tab=plan"
        onClick={onNavigateToPlan}
        className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-xs cursor-pointer"
      >
        <span>{buttonLabel}</span>
        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
      </Link>
    </div>
  );
}

export default PlanStatusCard;
