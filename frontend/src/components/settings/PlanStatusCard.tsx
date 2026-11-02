"use client";

import React from "react";
import Link from "next/link";
import { Crown, Sparkles, Shield, ArrowRight, Calendar } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import {
  isMaxUser,
  isProUser,
  IS_BETA_ALL_FEATURES_UNLOCKED,
} from "@/lib/payment/plans";

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

  const isMax = isMaxUser(profile) || isMaxUser(user);
  const isPro = isProUser(profile) || isProUser(user);

  let tierName = "Gói Miễn Phí";
  let tierBadge = "Free";
  let tierColor = "slate";
  let TierIcon = Shield;

  if (isMax) {
    tierName = "Gói Luyện Thi MAX";
    tierBadge = "MAX VIP";
    tierColor = "amber";
    TierIcon = Crown;
  } else if (isPro) {
    tierName = "Gói Giáo Viên PRO";
    tierBadge = "PRO";
    tierColor = "blue";
    TierIcon = Sparkles;
  }

  // Nguồn (Trả phí / Thử nghiệm Beta / Mặc định)
  const isBeta = IS_BETA_ALL_FEATURES_UNLOCKED && !profile?.tier;
  const sourceLabel = isBeta
    ? "Thử nghiệm (Beta)"
    : isMax || isPro
    ? "Trả phí"
    : "Mặc định";

  // Ngày hết hạn
  const rawExpires = profile?.subscription_expires_at || (profile as any)?.subscriptionExpiresAt;
  let expiryText = "Không thời hạn";
  if (rawExpires) {
    try {
      const d = new Date(rawExpires);
      if (!isNaN(d.getTime())) {
        expiryText = d.toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      }
    } catch {
      // fallback
    }
  } else if (isBeta) {
    expiryText = "Theo lộ trình Beta GDPT 2025";
  }

  if (variant === "compact") {
    return (
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border ${
          isMax
            ? "border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20 text-amber-950 dark:text-amber-100"
            : isPro
            ? "border-blue-200 bg-blue-50/60 dark:border-blue-900/40 dark:bg-blue-950/20 text-blue-950 dark:text-blue-100"
            : "border-border bg-muted/30 text-foreground"
        } ${className}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isMax
                ? "bg-amber-500 text-white shadow-2xs"
                : isPro
                ? "bg-blue-600 text-white shadow-2xs"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <TierIcon className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold truncate">{tierName}</span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  isBeta
                    ? "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800"
                    : isMax || isPro
                    ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                    : "bg-muted text-muted-foreground border-border"
                }`}
              >
                {sourceLabel}
              </span>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <Calendar className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Hết hạn: {expiryText}</span>
            </p>
          </div>
        </div>

        <Link
          href="/settings?tab=plan"
          onClick={onNavigateToPlan}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-border bg-card text-foreground hover:bg-muted hover:border-muted-foreground/30 transition shadow-2xs shrink-0 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span>Quản lý gói</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border p-5 shadow-xs ${
        isMax
          ? "border-amber-300 bg-linear-to-br from-amber-50 to-orange-50 dark:border-amber-900/60 dark:from-amber-950/30 dark:to-orange-950/20"
          : isPro
          ? "border-blue-300 bg-linear-to-br from-blue-50 to-indigo-50 dark:border-blue-900/60 dark:from-blue-950/30 dark:to-indigo-950/20"
          : "border-border bg-card"
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <TierIcon className="w-6 h-6 text-primary" aria-hidden="true" />
          <h3 className="text-base font-bold text-foreground">{tierName}</h3>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
          {tierBadge}
        </span>
      </div>
      <div className="text-xs text-muted-foreground space-y-1 mb-4">
        <p>Nguồn cấp: <strong className="text-foreground">{sourceLabel}</strong></p>
        <p>Thời hạn: <strong className="text-foreground">{expiryText}</strong></p>
      </div>
      <Link
        href="/settings?tab=plan"
        onClick={onNavigateToPlan}
        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-xs cursor-pointer"
      >
        <span>Nâng cấp & Quản lý gói cước</span>
        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
      </Link>
    </div>
  );
}

export default PlanStatusCard;
