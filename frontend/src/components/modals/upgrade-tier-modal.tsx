"use client";

import React from "react";
import { Sparkles, Crown, Check, X, Zap, ArrowRight } from "lucide-react";
import { PRO_MONTHLY, MAX_MONTHLY, PricingPlan } from "@/lib/payment/plans";

interface UpgradeTierModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredTier?: "pro" | "max";
  featureTitle?: string;
  featureDesc?: string;
  onSelectPlan: (plan: PricingPlan) => void;
}

export function UpgradeTierModal({
  isOpen,
  onClose,
  requiredTier = "pro",
  featureTitle = "Tính năng nâng cao dành cho Giáo viên",
  featureDesc = "Mở khóa trọn bộ công cụ giảng dạy, soạn đề và chấm thi tự động chuẩn Bộ GD&ĐT 2025.",
  onSelectPlan,
}: UpgradeTierModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-card rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 dark:border-neutral-800 relative text-left overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-primary/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            {requiredTier === "max" ? <Crown className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
                {requiredTier === "max" ? "Yêu cầu Gói MAX VIP" : "Yêu cầu Gói PRO"}
              </span>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mt-0.5">
              {featureTitle}
            </h3>
          </div>
        </div>

        <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">
          {featureDesc}
        </p>

        {/* 2 Plan Cards */}
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          {/* Card GÓI PRO */}
          <div
            className={`rounded-2xl border p-4 transition-all relative ${
              requiredTier === "pro"
                ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary"
                : "border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-muted/20 opacity-80"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-primary">Gói Giáo Viên PRO</span>
              <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                149.000đ/tháng
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mb-3">
              Chuẩn mực cho giáo viên trường THCS / THPT:
            </p>
            <ul className="text-xs space-y-1.5 text-neutral-700 dark:text-neutral-300">
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>+30.000 Credits soạn đề AI</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Trộn 4 mã đề chuẩn Bộ GD&ĐT 2025</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Xuất Word (.docx) sạch không watermark</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Top câu hỏi học sinh sai nhiều nhất</span>
              </li>
            </ul>

            <button
              type="button"
              onClick={() => {
                onSelectPlan(PRO_MONTHLY);
                onClose();
              }}
              className="mt-4 w-full py-2.5 rounded-xl border border-primary text-primary hover:bg-primary hover:text-white text-xs font-bold transition cursor-pointer"
            >
              Chọn Gói PRO (149k)
            </button>
          </div>

          {/* Card GÓI MAX */}
          <div className="rounded-2xl border-2 border-amber-400 bg-linear-to-b from-amber-500/10 via-amber-500/5 to-transparent p-4 shadow-xs relative">
            <span className="absolute -top-2.5 right-4 rounded-full bg-linear-to-r from-amber-500 to-amber-600 px-2.5 py-0.5 text-[9px] font-black text-white shadow-xs">
              VŨ KHÍ LUYỆN THI
            </span>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-600" />
                Gói Luyện Thi MAX
              </span>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
                229.000đ/tháng
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mb-3">
              Dành riêng cho giáo viên dạy thêm & ôn thi:
            </p>
            <ul className="text-xs space-y-1.5 text-neutral-700 dark:text-neutral-300">
              <li className="flex items-center gap-1.5 font-medium">
                <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>+100.000 Credits AI Gemini 2.0 Thinking</span>
              </li>
              <li className="flex items-center gap-1.5 font-medium">
                <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Bóc tách PDF & Nhân bản đề tương tự</span>
              </li>
              <li className="flex items-center gap-1.5 font-medium">
                <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Trộn 8 - 12 mã đề công nghiệp</span>
              </li>
              <li className="flex items-center gap-1.5 font-medium">
                <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Tạo phiếu nhận xét gửi Zalo Phụ huynh</span>
              </li>
            </ul>

            <button
              type="button"
              onClick={() => {
                onSelectPlan(MAX_MONTHLY);
                onClose();
              }}
              className="mt-4 w-full py-2.5 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1"
            >
              <span>Nâng cấp Gói MAX ngay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-muted-foreground">
          Thanh toán tức thì 24/7 qua <strong>VietQR / PayOS</strong> (chuyển khoản quét mã nhận hạn mức tự động trong 3 giây).
        </p>
      </div>
    </div>
  );
}
