"use client";

import React from "react";
import { Check, Crown, Sparkles, Shield, Loader2 } from "lucide-react";
import {
  PlanTier,
  UserPlanState,
  BillingCycle,
  getPlanCta,
  getPlanPricing,
  trackPlanEvent,
} from "@/lib/payment/plan-status";

export interface PlanCardProps {
  tier: PlanTier;
  userState: UserPlanState;
  billingCycle: BillingCycle;
  expiresAt?: string | null;
  isLoadingCheckout?: boolean;
  onSelectPlan?: (
    tier: "pro" | "max",
    name: string,
    amount: number,
    credits: number,
    price: string
  ) => void;
}

export function PlanCard({
  tier,
  userState,
  billingCycle,
  expiresAt,
  isLoadingCheckout,
  onSelectPlan,
}: PlanCardProps) {
  const cta = getPlanCta(tier, userState, expiresAt);
  const pricing = getPlanPricing(tier, billingCycle);

  const isCurrentPlan =
    (userState === "free" && tier === "free") ||
    (userState === "pro" && tier === "pro") ||
    (userState === "max-paid" && tier === "max") ||
    (userState === "max-beta" && tier === "max");

  const isPopular = tier === "pro";
  const isMaxTier = tier === "max";

  const handleCtaClick = () => {
    trackPlanEvent("plan_cta_click", { tier, billingCycle, ctaLabel: cta.label });
    if (cta.disabled || cta.actionType !== "checkout" || !onSelectPlan) return;
    if (tier === "pro" || tier === "max") {
      onSelectPlan(
        tier,
        pricing.name,
        pricing.rawAmount,
        pricing.credits,
        pricing.displayPrice
      );
    }
  };

  return (
    <div
      className={`rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all relative ${
        isMaxTier
          ? "bg-linear-to-b from-purple-950/20 via-card to-purple-900/10 dark:from-purple-950/40 dark:via-slate-900 dark:to-purple-900/20 border-2 border-purple-500/80 dark:border-purple-500 shadow-xl shadow-purple-500/10"
          : isPopular
          ? "bg-card border-2 border-indigo-500 dark:border-indigo-500 shadow-xl shadow-indigo-500/10"
          : "bg-card border border-border shadow-xs hover:border-border/80"
      }`}
    >
      {/* Top Badge */}
      {isPopular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-linear-to-r from-indigo-600 to-purple-600 text-white text-[11px] font-extrabold uppercase tracking-wide shadow-md whitespace-nowrap">
          Phổ biến
        </div>
      )}

      {isMaxTier && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-linear-to-r from-amber-600 via-orange-600 to-purple-700 text-white text-[11px] font-black uppercase tracking-wide shadow-md flex items-center gap-1.5 whitespace-nowrap">
          <Crown className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
          <span>Dành cho gia sư & trung tâm</span>
        </div>
      )}

      <div className="space-y-5">
        {/* Plan Header */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                isMaxTier
                  ? "text-purple-600 dark:text-purple-400"
                  : isPopular
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-muted-foreground"
              }`}
            >
              {tier === "free"
                ? "Khởi đầu"
                : tier === "pro"
                ? "Tiêu chuẩn giảng dạy"
                : "Toàn năng sư phạm & dạy thêm"}
            </span>

            {isCurrentPlan && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                Gói của bạn
              </span>
            )}
          </div>

          <h3 className="text-2xl font-black text-foreground flex items-center gap-2">
            <span>
              {tier === "free"
                ? "Gói Miễn Phí"
                : tier === "pro"
                ? "Giáo Viên PRO"
                : "Luyện Thi MAX"}
            </span>
            {tier === "free" && <Shield className="w-5 h-5 text-muted-foreground" aria-hidden="true" />}
            {tier === "pro" && <Sparkles className="w-5 h-5 text-amber-500" aria-hidden="true" />}
            {tier === "max" && <Crown className="w-5 h-5 text-amber-500" aria-hidden="true" />}
          </h3>

          <p className="text-xs text-muted-foreground min-h-[32px] leading-relaxed">
            {tier === "free" && "Trải nghiệm các tính năng soạn đề & khảo thí sư phạm cơ bản"}
            {tier === "pro" && "Dành cho Giáo viên trường THCS / THPT đứng lớp tiêu chuẩn"}
            {tier === "max" && "Dành cho Gia sư, Giáo viên dạy thêm chuyên nghiệp và Trung tâm luyện thi"}
          </p>
        </div>

        {/* Price Block */}
        <div className="py-2 space-y-1 border-t border-border pt-4">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
              {pricing.displayPrice}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {pricing.periodLabel}
            </span>

            {pricing.originalPriceText && (
              <span className="text-xs line-through text-muted-foreground/70">
                {pricing.originalPriceText}
              </span>
            )}

            {pricing.savingsBadge && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {pricing.savingsBadge}
              </span>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            {pricing.totalPriceText}
          </p>

          {/* Credits summary note */}
          {tier !== "free" && (
            <p
              className={`text-xs font-semibold pt-1 ${
                isMaxTier
                  ? "text-purple-600 dark:text-purple-400"
                  : "text-indigo-600 dark:text-indigo-400"
              }`}
            >
              Cộng ngay{" "}
              <strong>+{pricing.credits.toLocaleString("vi-VN")} Credits</strong> vào ví
            </p>
          )}
        </div>

        {/* Feature List */}
        <div className="space-y-3 pt-3 border-t border-border">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Quyền lợi bao gồm:
          </p>

          <ul className="space-y-2.5 text-xs text-foreground/90">
            {tier === "free" && (
              <>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    Tặng <strong>5.000 Credits</strong> khởi tạo tài khoản (một lần)
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    Tối đa <strong>3 lượt tạo đề/ngày</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Chấm trắc nghiệm OMR cơ bản qua camera</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>1 bài thí nghiệm 3D mẫu / mỗi môn học</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Trải nghiệm 2 link Báo cáo Zalo mẫu</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Lưu trữ & quản lý thư viện đề thi cá nhân</span>
                </li>
              </>
            )}

            {tier === "pro" && (
              <>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 font-bold" aria-hidden="true" />
                  <span>
                    <strong>Mở khóa trọn bộ 54+ Labs</strong> & Kính vẽ Neon
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 font-bold" aria-hidden="true" />
                  <span>
                    <strong>Xuất file Word & PDF sạch 100%</strong> (Không watermark)
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 font-bold" aria-hidden="true" />
                  <span>
                    <strong>Báo cáo Zalo Magic Link KHÔNG GIỚI HẠN</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 font-bold" aria-hidden="true" />
                  <span>
                    Trộn tối đa <strong>4 mã đề</strong> chuẩn GDPT kèm Barem đặc tả
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 font-bold" aria-hidden="true" />
                  <span>Chấm OMR lưu lịch sử lớp & xuất bảng điểm Excel</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 font-bold" aria-hidden="true" />
                  <span>Phí sàn Chợ đề thi ưu đãi 15%</span>
                </li>
              </>
            )}

            {tier === "max" && (
              <>
                <li className="flex items-start gap-2.5 font-bold text-purple-950 dark:text-purple-200">
                  <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Toàn bộ đặc quyền của Gói PRO</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    <strong>AI suy luận nâng cao (chế độ Thinking)</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    <strong>⚡ AI Luyện Bù Lỗ Hổng Kiến Thức:</strong> Tự đẻ câu tương tự số đẹp từ câu sai
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    <strong>Đóng dấu Watermark thương hiệu riêng:</strong> Tên Gia sư, SĐT & Logo trung tâm
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    <strong>Trộn đề công nghiệp từ 8 đến 12 mã đề</strong> chống quay cóp
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Giao đề Online qua Magic Link/QR tự chấm & nhận xét AI gửi Zalo</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Phí sàn Chợ đề thi chỉ 5% & Giảm 50% credits mua đề VIP</span>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>

      {/* CTA Button at bottom (using mt-auto for equal balance) */}
      <div className="pt-6 mt-auto">
        {cta.helperText && (
          <p className="text-[11px] text-center font-medium text-muted-foreground mb-2">
            {cta.helperText}
          </p>
        )}

        <button
          type="button"
          onClick={handleCtaClick}
          disabled={cta.disabled || isLoadingCheckout}
          aria-label={`${cta.label} - ${pricing.name}`}
          className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            cta.disabled
              ? "bg-muted text-muted-foreground cursor-not-allowed border border-border"
              : isMaxTier
              ? "bg-linear-to-r from-amber-600 via-orange-600 to-purple-700 hover:from-amber-500 hover:via-orange-500 hover:to-purple-600 text-white shadow-xl shadow-amber-600/20 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              : "bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/25 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          }`}
        >
          {isLoadingCheckout ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>Đang tạo mã VietQR...</span>
            </>
          ) : (
            <span>{cta.label}</span>
          )}
        </button>
      </div>
    </div>
  );
}

export default PlanCard;
