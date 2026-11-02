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
        {/* Plan Header + Right Top Price Corner */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
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
                  ? "Gói Giáo Viên PRO"
                  : "Gói Luyện Thi MAX"}
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

          {/* Góc trên bên phải: Xóa chữ '/tháng' thừa, khi bật Học kỳ (-20%) hiển thị giá gốc gạch ngang và giá chính giảm 20% */}
          <div className="text-right shrink-0 pt-0.5">
            {tier === "free" ? (
              <div className="flex items-baseline justify-end gap-1">
                <span className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">0đ</span>
                <span className="text-xs font-medium text-muted-foreground">/mãi mãi</span>
              </div>
            ) : billingCycle === "semester" ? (
              <div className="space-y-0.5">
                {/* Giá gốc gạch ngang */}
                <div className="text-xs font-semibold text-muted-foreground/70 line-through">
                  {tier === "pro" ? "149.000đ/tháng" : "229.000đ/tháng"}
                </div>
                {/* Giá chính sau khi giảm 20% */}
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                    {tier === "pro" ? "119.200đ" : "179.800đ"}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">/tháng</span>
                </div>
                {/* Badge giảm 20% & Tổng thanh toán kỳ */}
                <div className="flex items-center justify-end gap-1.5 pt-0.5">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    -20%
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground hidden sm:inline">
                    {tier === "pro" ? "599.000đ / 5 tháng" : "899.000đ / 5 tháng"}
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                    {tier === "pro" ? "149.000đ" : "229.000đ"}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">/tháng</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Thanh toán từng tháng</p>
              </div>
            )}
          </div>
        </div>

        {/* Credits Summary Banner */}
        {tier !== "free" && (
          <div
            className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-between ${
              isMaxTier
                ? "bg-purple-500/10 border-purple-500/20 text-purple-700 dark:text-purple-300"
                : "bg-indigo-500/10 border-indigo-500/20 text-indigo-700 dark:text-indigo-300"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" aria-hidden="true" />
              <span>Cộng vào ví khi kích hoạt:</span>
            </span>
            <strong className="text-sm font-black">
              +{billingCycle === "semester"
                ? (tier === "pro" ? "150.000" : "500.000")
                : (tier === "pro" ? "30.000" : "100.000")}{" "}
              Credits
            </strong>
          </div>
        )}

        {/* Feature List */}
        <div className="space-y-3 pt-2 border-t border-border">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Đặc quyền sư phạm bao gồm:
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
                    Tối đa <strong>3 lượt tạo đề/ngày</strong> (Gemini Flash cơ bản)
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Trộn tối đa <strong>2 mã đề</strong> kiểm tra</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Nhập điểm thủ công bằng tay (<strong>Chấm OMR tự động yêu cầu PRO</strong>)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>1 bài thí nghiệm 3D mẫu / mỗi môn học (4 bài)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Xuất file Word & PDF có Watermark mờ chân trang</span>
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
                    <strong>Mở khóa Chấm OMR tự động không giới hạn</strong> (2 camera cùng lúc)
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 font-bold" aria-hidden="true" />
                  <span>
                    Kích hoạt <strong>Gemini Vision Fallback</strong> khi cắt góc lỗi ≥ 3 lần
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 font-bold" aria-hidden="true" />
                  <span>
                    Tạo đề trắc nghiệm AI không giới hạn chuẩn GDPT & Số hóa đề từ URL Web
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 font-bold" aria-hidden="true" />
                  <span>
                    <strong>Xuất file Word & PDF sạch 100%</strong> (Không watermark hệ thống)
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
                  <span>
                    <strong>Mở khóa trọn bộ 54+ Labs 3D</strong> & Kính vẽ Neon bục giảng
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 font-bold" aria-hidden="true" />
                  <span>Báo cáo Zalo Magic Link không giới hạn & Phí sàn Chợ đề 15%</span>
                </li>
              </>
            )}

            {tier === "max" && (
              <>
                <li className="flex items-start gap-2.5 font-bold text-purple-950 dark:text-purple-200">
                  <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Toàn bộ đặc quyền của Gói Giáo Viên PRO</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    <strong>AI suy luận nâng cao (Gemini Thinking / DeepSeek R1)</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    <strong>Bóc tách PDF/Ảnh đề cũ</strong> & Nhân bản đề tương tự
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    <strong>Bộ công cụ sư phạm:</strong> Live Clone biến thể, Scaffold gợi ý giải & Đa phương pháp
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    <strong>⚡ Tự động sinh bài Bù lỗ hổng kiến thức</strong> & Báo cáo AI gửi Zalo PH
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    <strong>Đóng dấu Watermark thương hiệu riêng:</strong> Tên GV, Logo & Hotline trung tâm
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    <strong>Trộn đề công nghiệp từ 8 đến 12 mã đề</strong> độc lập chống quay cóp
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    Chấm OMR không giới hạn thiết bị & Tự khớp danh sách lớp (Roster import)
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    Phòng học Whiteboard tương tác 2 chiều (HS vẽ trực tiếp & Live Poll)
                  </span>
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

      {/* CTA Button at bottom */}
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
