"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Check,
  Crown,
  Sparkles,
  HelpCircle,
  FileText,
  ShieldCheck,
  ChevronDown,
  MessageCircle,
  Phone,
  ArrowRight,
  Info,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { PaymentCheckoutModal } from "@/components/modals/payment-checkout-modal";
import { PlanCard } from "./PlanCard";
import { PlanStatusCard } from "./PlanStatusCard";
import { VatInvoiceModal } from "./VatInvoiceModal";
import { RefundPolicyModal } from "./RefundPolicyModal";
import {
  BillingCycle,
  getUserPlanState,
  trackPlanEvent,
} from "@/lib/payment/plan-status";

export function PlanTab() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const paymentStatus = searchParams?.get("status");
  const cycleParam = searchParams?.get("cycle");

  const { profile, user, refreshWallet } = useAuth();
  const userPlanState = getUserPlanState(profile, user);

  // Cycle state: monthly | semester (sync with URL ?cycle=term or ?cycle=semester)
  const initialCycle: BillingCycle =
    cycleParam === "term" || cycleParam === "semester" ? "semester" : "monthly";

  const [billingCycle, setBillingCycle] = useState<BillingCycle>(initialCycle);
  const [checkoutPlan, setCheckoutPlan] = useState<{
    credits: number;
    price: string;
    amount: number;
    isPro: boolean;
    tier: "pro" | "max";
    name: string;
  } | null>(null);

  const [isVatModalOpen, setIsVatModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const pricingSectionRef = useRef<HTMLDivElement>(null);

  // Sync state when URL cycle changes
  useEffect(() => {
    if (cycleParam === "term" || cycleParam === "semester") {
      setBillingCycle("semester");
    } else if (cycleParam === "monthly") {
      setBillingCycle("monthly");
    }
  }, [cycleParam]);

  // Track plan view
  useEffect(() => {
    trackPlanEvent("plan_view", { userState: userPlanState, billingCycle });
  }, []);

  // Payment status notification
  useEffect(() => {
    if (paymentStatus === "PAID") {
      setSuccessToast(
        "Chúc mừng Thầy Cô đã kích hoạt gói thành công! Đặc quyền đã được mở khóa ngay lập tức."
      );
      refreshWallet?.();
      const timer = setTimeout(() => setSuccessToast(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [paymentStatus, refreshWallet]);

  const handleCycleChange = (newCycle: BillingCycle) => {
    setBillingCycle(newCycle);
    trackPlanEvent("plan_cycle_toggle", { cycle: newCycle });

    // Update URL query ?cycle=
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("tab", "plan");
    params.set("cycle", newCycle === "semester" ? "term" : "monthly");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleOpenCheckout = (
    tier: "pro" | "max",
    name: string,
    amount: number,
    credits: number,
    price: string
  ) => {
    setCheckoutPlan({
      tier,
      name,
      amount,
      credits,
      price,
      isPro: true,
    });
  };

  const handlePaymentSuccess = () => {
    setCheckoutPlan(null);
    setSuccessToast(
      "Chúc mừng Thầy Cô đã kích hoạt gói thành công! Đặc quyền đã được mở khóa ngay lập tức."
    );
    refreshWallet?.();
    setTimeout(() => setSuccessToast(null), 8000);
  };

  const handleScrollToPlans = () => {
    pricingSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const toggleFaq = (index: number) => {
    const nextIndex = openFaqIndex === index ? null : index;
    setOpenFaqIndex(nextIndex);
    if (nextIndex !== null) {
      trackPlanEvent("faq_expand", { faqIndex: index });
    }
  };

  const isCurrentMax = userPlanState === "max-paid" || userPlanState === "max-beta";
  const isCurrentPro = userPlanState === "pro";
  const isCurrentFree = userPlanState === "free";

  return (
    <div className="space-y-10">
      {/* 1. HERO HEADER */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-700 dark:text-indigo-300">
          <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" />
          <span>Trợ lý soạn đề, chấm bài và dạy thêm cho giáo viên Việt Nam</span>
        </div>

        {/* Tiêu đề chuẩn R1 */}
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground tracking-tight">
          Gói dịch vụ dành riêng cho Giáo viên Việt Nam
        </h2>

        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          Tiết kiệm thời gian soạn đề, chấm bài và chăm sóc phụ huynh. Kích hoạt tự động ngay sau khi thanh toán qua VietQR Napas247.
        </p>

        {/* Success toast message */}
        {successToast && (
          <div className="p-4 rounded-2xl bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 animate-in fade-in">
            <Check className="w-5 h-5 text-amber-300 shrink-0" aria-hidden="true" />
            <span>{successToast}</span>
          </div>
        )}

        {/* 2. TOGGLE CHU KỲ THANH TOÁN (CĂN GIỮA NGAY DƯỚI TIÊU ĐỀ) */}
        <div className="pt-2 flex flex-col items-center justify-center gap-2">
          <div
            role="tablist"
            aria-label="Chu kỳ thanh toán"
            className="bg-muted/70 p-1 rounded-2xl inline-flex items-center border border-border shadow-2xs"
          >
            <button
              type="button"
              role="tab"
              id="cycle-tab-monthly"
              aria-controls="pricing-cards-panel"
              aria-selected={billingCycle === "monthly"}
              onClick={() => handleCycleChange("monthly")}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                billingCycle === "monthly"
                  ? "bg-card text-foreground shadow-xs font-black"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Gói 1 Tháng
            </button>

            <button
              type="button"
              role="tab"
              id="cycle-tab-semester"
              aria-controls="pricing-cards-panel"
              aria-selected={billingCycle === "semester"}
              onClick={() => handleCycleChange("semester")}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                billingCycle === "semester"
                  ? "bg-card text-emerald-600 dark:text-emerald-400 shadow-xs font-black"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>Gói Học Kỳ (5 Tháng)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                -20%
              </span>
            </button>
          </div>

          <p className="text-[11px] text-muted-foreground">
            {billingCycle === "semester"
              ? "Tiết kiệm tới 246.000đ khi thanh toán trọn vẹn một học kỳ 5 tháng"
              : "Linh hoạt từng tháng, chủ động gia hạn không ràng buộc"}
          </p>
        </div>

        {/* 3. STATUS CARD - Thẻ trạng thái gói cước hiện tại */}
        <div className="pt-3 text-left">
          <PlanStatusCard
            variant="compact"
            onNavigateToPlan={handleScrollToPlans}
          />
        </div>
      </div>

      {/* 4. 2-TIER PRICING CARDS - CHỈ HIỂN THỊ 2 THẺ: PRO VÀ MAX */}
      <div
        ref={pricingSectionRef}
        id="pricing-cards-panel"
        role="region"
        aria-labelledby={billingCycle === "semester" ? "cycle-tab-semester" : "cycle-tab-monthly"}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch max-w-5xl mx-auto"
      >
        {/* THẺ 1: GÓI GIÁO VIÊN PRO (149.000đ/tháng) */}
        <PlanCard
          tier="pro"
          userState={userPlanState}
          billingCycle={billingCycle}
          expiresAt={profile?.subscription_expires_at}
          onSelectPlan={handleOpenCheckout}
        />

        {/* THẺ 2: GÓI LUYỆN THI MAX (229.000đ/tháng) */}
        <PlanCard
          tier="max"
          userState={userPlanState}
          billingCycle={billingCycle}
          expiresAt={profile?.subscription_expires_at}
          onSelectPlan={handleOpenCheckout}
        />
      </div>

      {/* 5. PAYMENT & RENEWAL POLICY BLOCK */}
      <div className="max-w-5xl mx-auto rounded-3xl bg-muted/30 border border-border p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
              <ShieldCheck className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-foreground">
                Cách thức Thanh toán & Chính sách Gia hạn
              </h3>
              <p className="text-xs text-muted-foreground">
                Minh bạch tài chính 100% · Cổng thanh toán VietQR Napas247 bảo mật
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsVatModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-border bg-card text-foreground hover:bg-muted transition cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
              <span>Yêu cầu hóa đơn VAT</span>
            </button>

            <button
              type="button"
              onClick={() => setIsRefundModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-border bg-card text-foreground hover:bg-muted transition cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
              <span>Chính sách hoàn tiền</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
          <div className="space-y-1">
            <strong className="text-foreground block text-xs">
              1. Tự động gia hạn:
            </strong>
            <p className="leading-relaxed">
              <strong>Không tự động trừ tiền.</strong> EduTest AI sử dụng thanh toán VietQR từng lần, không lưu thông tin thẻ ngân hàng. Chúng tôi gửi thông báo nhắc trước 7 ngày khi gói sắp hết hạn.
            </p>
          </div>

          <div className="space-y-1">
            <strong className="text-foreground block text-xs">
              2. Đổi gói giữa kỳ:
            </strong>
            <p className="leading-relaxed">
              Nâng cấp từ PRO lên MAX sẽ được tính bù ngày còn lại theo giá trị tương đương (cộng dồn thời hạn). Khi hết hạn gói, tài khoản tự động chuyển về Gói Miễn Phí nếu không gia hạn.
            </p>
          </div>

          <div className="space-y-1">
            <strong className="text-foreground block text-xs">
              3. Bảo vệ & Hoàn tiền:
            </strong>
            <p className="leading-relaxed">
              Cam kết hoàn tiền trong 3 ngày nếu chuyển nhầm hoặc có sự cố kỹ thuật (chưa sử dụng quá 500 credits). Dữ liệu đề thi đã tạo của Thầy Cô luôn được lưu giữ an toàn.
            </p>
          </div>
        </div>
      </div>

      {/* 6. FEATURE COMPARISON MATRIX TABLE */}
      <div className="max-w-5xl mx-auto rounded-3xl bg-card border border-border p-5 sm:p-8 shadow-xs space-y-6">
        <div className="text-center space-y-1">
          <h3 className="text-xl sm:text-2xl font-black text-foreground">
            Bảng So Sánh Chi Tiết Tính Năng
          </h3>
          <p className="text-xs text-muted-foreground">
            So sánh quyền lợi theo từng nhóm nghiệp vụ sư phạm
          </p>
        </div>

        <div className="overflow-x-auto relative rounded-2xl border border-border">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            {/* Header Sticky */}
            <thead className="sticky top-0 z-30 bg-muted/95 backdrop-blur-xs border-b border-border shadow-2xs">
              <tr className="text-muted-foreground">
                <th className="py-3.5 px-4 font-bold sticky left-0 z-40 bg-muted/95 min-w-[200px] sm:min-w-[240px]">
                  Tính năng sư phạm
                </th>
                <th
                  className={`py-3.5 px-4 font-bold text-center min-w-[120px] ${
                    isCurrentFree
                      ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                      : "text-foreground"
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span>Miễn Phí</span>
                    {isCurrentFree && (
                      <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Gói của bạn
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className={`py-3.5 px-4 font-bold text-center min-w-[140px] ${
                    isCurrentPro
                      ? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                      : "text-indigo-600 dark:text-indigo-400"
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span>Giáo Viên PRO</span>
                    {isCurrentPro && (
                      <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                        Gói của bạn
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className={`py-3.5 px-4 font-bold text-center min-w-[150px] ${
                    isCurrentMax
                      ? "bg-purple-500/10 text-purple-700 dark:text-purple-300"
                      : "text-purple-600 dark:text-purple-400"
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span>Luyện Thi MAX</span>
                    {isCurrentMax && (
                      <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                        Gói của bạn
                      </span>
                    )}
                  </div>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {/* GROUP 1: SOẠN ĐỀ */}
              <tr className="bg-muted/40 font-bold text-xs uppercase tracking-wider text-muted-foreground">
                <td colSpan={4} className="py-2 px-4 sticky left-0 bg-muted/40 z-20">
                  1. Soạn đề & Tài nguyên
                </td>
              </tr>

              <tr>
                <td className="py-3 px-4 font-medium text-foreground sticky left-0 bg-card z-20 shadow-2xs">
                  Credits AI
                </td>
                <td className={`py-3 px-4 text-center ${isCurrentFree ? "bg-emerald-500/5 font-semibold" : ""}`}>
                  5.000 (một lần khi đăng ký)
                </td>
                <td className={`py-3 px-4 text-center font-bold text-indigo-600 dark:text-indigo-400 ${isCurrentPro ? "bg-indigo-500/5" : ""}`}>
                  {billingCycle === "semester" ? "+150.000 / kỳ" : "+30.000 / tháng"}
                </td>
                <td className={`py-3 px-4 text-center font-black text-purple-600 dark:text-purple-400 ${isCurrentMax ? "bg-purple-500/5" : ""}`}>
                  {billingCycle === "semester" ? "+500.000 / kỳ" : "+100.000 / tháng"}
                </td>
              </tr>

              <tr>
                <td className="py-3 px-4 font-medium text-foreground sticky left-0 bg-card z-20 shadow-2xs">
                  Chế độ AI thông minh
                </td>
                <td className={`py-3 px-4 text-center text-muted-foreground ${isCurrentFree ? "bg-emerald-500/5" : ""}`}>
                  Cơ bản
                </td>
                <td className={`py-3 px-4 text-center font-medium ${isCurrentPro ? "bg-indigo-500/5" : ""}`}>
                  Tiêu chuẩn sư phạm
                </td>
                <td className={`py-3 px-4 text-center font-bold text-purple-600 dark:text-purple-400 ${isCurrentMax ? "bg-purple-500/5" : ""}`}>
                  AI suy luận nâng cao (Gemini Thinking)
                </td>
              </tr>

              <tr>
                <td className="py-3 px-4 font-medium text-foreground sticky left-0 bg-card z-20 shadow-2xs">
                  Kho Thí nghiệm 3D STEM
                </td>
                <td className={`py-3 px-4 text-center text-muted-foreground ${isCurrentFree ? "bg-emerald-500/5" : ""}`}>
                  1 lab mẫu / môn
                </td>
                <td className={`py-3 px-4 text-center font-bold text-emerald-600 ${isCurrentPro ? "bg-indigo-500/5" : ""}`}>
                  Trọn bộ 54+ Labs & Kính vẽ
                </td>
                <td className={`py-3 px-4 text-center font-bold text-emerald-600 ${isCurrentMax ? "bg-purple-500/5" : ""}`}>
                  Trọn bộ 54+ Labs & Kính vẽ
                </td>
              </tr>

              <tr>
                <td className="py-3 px-4 font-medium text-foreground sticky left-0 bg-card z-20 shadow-2xs">
                  Xuất file Word (.docx) sạch
                </td>
                <td className={`py-3 px-4 text-center text-muted-foreground ${isCurrentFree ? "bg-emerald-500/5" : ""}`}>
                  Watermark web
                </td>
                <td className={`py-3 px-4 text-center font-bold text-emerald-600 ${isCurrentPro ? "bg-indigo-500/5" : ""}`}>
                  Sạch 100%
                </td>
                <td className={`py-3 px-4 text-center font-bold text-emerald-600 ${isCurrentMax ? "bg-purple-500/5" : ""}`}>
                  Sạch 100%
                </td>
              </tr>

              <tr>
                <td className="py-3 px-4 font-medium text-foreground sticky left-0 bg-card z-20 shadow-2xs">
                  Trộn mã đề thi trắc nghiệm
                </td>
                <td className={`py-3 px-4 text-center text-muted-foreground ${isCurrentFree ? "bg-emerald-500/5" : ""}`}>
                  <span aria-label="Không">—</span>
                </td>
                <td className={`py-3 px-4 text-center font-semibold ${isCurrentPro ? "bg-indigo-500/5" : ""}`}>
                  Tối đa 4 mã đề
                </td>
                <td className={`py-3 px-4 text-center font-bold text-purple-600 dark:text-purple-400 ${isCurrentMax ? "bg-purple-500/5" : ""}`}>
                  8 - 12 mã đề công nghiệp
                </td>
              </tr>

              {/* GROUP 2: CHẤM & BÁO CÁO */}
              <tr className="bg-muted/40 font-bold text-xs uppercase tracking-wider text-muted-foreground">
                <td colSpan={4} className="py-2 px-4 sticky left-0 bg-muted/40 z-20">
                  2. Chấm & Báo cáo
                </td>
              </tr>

              <tr>
                <td className="py-3 px-4 font-medium text-foreground sticky left-0 bg-card z-20 shadow-2xs">
                  Chấm OMR & lịch sử lớp
                </td>
                <td className={`py-3 px-4 text-center text-muted-foreground ${isCurrentFree ? "bg-emerald-500/5" : ""}`}>
                  <span aria-label="Không">—</span>
                </td>
                <td className={`py-3 px-4 text-center text-emerald-600 font-bold ${isCurrentPro ? "bg-indigo-500/5" : ""}`}>
                  <Check className="w-4 h-4 mx-auto" aria-label="Có" />
                </td>
                <td className={`py-3 px-4 text-center text-emerald-600 font-bold ${isCurrentMax ? "bg-purple-500/5" : ""}`}>
                  <Check className="w-4 h-4 mx-auto" aria-label="Có" />
                </td>
              </tr>

              <tr>
                <td className="py-3 px-4 font-medium text-foreground sticky left-0 bg-card z-20 shadow-2xs">
                  Xuất bảng điểm Excel & thống kê câu sai nhiều
                </td>
                <td className={`py-3 px-4 text-center text-muted-foreground ${isCurrentFree ? "bg-emerald-500/5" : ""}`}>
                  <span aria-label="Không">—</span>
                </td>
                <td className={`py-3 px-4 text-center text-emerald-600 font-bold ${isCurrentPro ? "bg-indigo-500/5" : ""}`}>
                  <Check className="w-4 h-4 mx-auto" aria-label="Có" />
                </td>
                <td className={`py-3 px-4 text-center text-emerald-600 font-bold ${isCurrentMax ? "bg-purple-500/5" : ""}`}>
                  <Check className="w-4 h-4 mx-auto" aria-label="Có" />
                </td>
              </tr>

              <tr>
                <td className="py-3 px-4 font-medium text-foreground sticky left-0 bg-card z-20 shadow-2xs">
                  Giao đề Online qua Magic Link / QR
                </td>
                <td className={`py-3 px-4 text-center text-muted-foreground ${isCurrentFree ? "bg-emerald-500/5" : ""}`}>
                  <span aria-label="Không">—</span>
                </td>
                <td className={`py-3 px-4 text-center text-muted-foreground ${isCurrentPro ? "bg-indigo-500/5" : ""}`}>
                  <span aria-label="Không">—</span>
                </td>
                <td className={`py-3 px-4 text-center text-emerald-600 font-bold ${isCurrentMax ? "bg-purple-500/5" : ""}`}>
                  <Check className="w-4 h-4 mx-auto" aria-label="Có" />
                </td>
              </tr>

              <tr>
                <td className="py-3 px-4 font-medium text-foreground sticky left-0 bg-card z-20 shadow-2xs">
                  Báo Cáo Zalo Magic Link & Phiếu nhận xét AI
                </td>
                <td className={`py-3 px-4 text-center ${isCurrentFree ? "bg-emerald-500/5" : ""}`}>
                  2 link mẫu
                </td>
                <td className={`py-3 px-4 text-center font-semibold text-emerald-600 ${isCurrentPro ? "bg-indigo-500/5" : ""}`}>
                  Không giới hạn
                </td>
                <td className={`py-3 px-4 text-center font-bold text-emerald-600 ${isCurrentMax ? "bg-purple-500/5" : ""}`}>
                  Không giới hạn + Phiếu AI
                </td>
              </tr>

              <tr>
                <td className="py-3 px-4 font-medium text-foreground sticky left-0 bg-card z-20 shadow-2xs">
                  AI Luyện Bù Lỗ Hổng Kiến Thức
                </td>
                <td className={`py-3 px-4 text-center text-muted-foreground ${isCurrentFree ? "bg-emerald-500/5" : ""}`}>
                  <span aria-label="Không">—</span>
                </td>
                <td className={`py-3 px-4 text-center text-muted-foreground ${isCurrentPro ? "bg-indigo-500/5" : ""}`}>
                  <span aria-label="Không">—</span>
                </td>
                <td className={`py-3 px-4 text-center font-bold text-emerald-600 ${isCurrentMax ? "bg-purple-500/5" : ""}`}>
                  Sinh câu tương tự số đẹp
                </td>
              </tr>

              {/* GROUP 3: CHỢ ĐỀ THI */}
              <tr className="bg-muted/40 font-bold text-xs uppercase tracking-wider text-muted-foreground">
                <td colSpan={4} className="py-2 px-4 sticky left-0 bg-muted/40 z-20">
                  3. Chợ đề thi (Marketplace)
                </td>
              </tr>

              <tr>
                <td className="py-3 px-4 font-medium text-foreground sticky left-0 bg-card z-20 shadow-2xs">
                  Phí sàn Chợ đề thi
                </td>
                <td className={`py-3 px-4 text-center text-muted-foreground ${isCurrentFree ? "bg-emerald-500/5" : ""}`}>
                  15%
                </td>
                <td className={`py-3 px-4 text-center font-semibold ${isCurrentPro ? "bg-indigo-500/5" : ""}`}>
                  15%
                </td>
                <td className={`py-3 px-4 text-center font-black text-purple-600 dark:text-purple-400 ${isCurrentMax ? "bg-purple-500/5" : ""}`}>
                  Chỉ 5%
                </td>
              </tr>

              <tr>
                <td className="py-3 px-4 font-medium text-foreground sticky left-0 bg-card z-20 shadow-2xs">
                  Giảm credits khi mua đề VIP
                </td>
                <td className={`py-3 px-4 text-center text-muted-foreground ${isCurrentFree ? "bg-emerald-500/5" : ""}`}>
                  0%
                </td>
                <td className={`py-3 px-4 text-center text-muted-foreground ${isCurrentPro ? "bg-indigo-500/5" : ""}`}>
                  0%
                </td>
                <td className={`py-3 px-4 text-center font-black text-purple-600 dark:text-purple-400 ${isCurrentMax ? "bg-purple-500/5" : ""}`}>
                  Giảm 50%
                </td>
              </tr>

              {/* GROUP 4: THƯƠNG HIỆU */}
              <tr className="bg-muted/40 font-bold text-xs uppercase tracking-wider text-muted-foreground">
                <td colSpan={4} className="py-2 px-4 sticky left-0 bg-muted/40 z-20">
                  4. Thương hiệu
                </td>
              </tr>

              <tr>
                <td className="py-3 px-4 font-medium text-foreground sticky left-0 bg-card z-20 shadow-2xs">
                  Watermark Thương Hiệu Riêng
                </td>
                <td className={`py-3 px-4 text-center text-muted-foreground ${isCurrentFree ? "bg-emerald-500/5" : ""}`}>
                  <span aria-label="Không">—</span>
                </td>
                <td className={`py-3 px-4 text-center text-muted-foreground ${isCurrentPro ? "bg-indigo-500/5" : ""}`}>
                  <span aria-label="Không">—</span>
                </td>
                <td className={`py-3 px-4 text-center font-bold text-purple-600 dark:text-purple-400 ${isCurrentMax ? "bg-purple-500/5" : ""}`}>
                  Logo + Tên + SĐT
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. FAQ ACCORDION SECTION */}
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="text-center space-y-1">
          <h3 className="text-xl sm:text-2xl font-black text-foreground">
            Câu Hỏi Thường Gặp Của Thầy Cô
          </h3>
          <p className="text-xs text-muted-foreground">
            Giải đáp chi tiết về thanh toán, quyền lợi credits và chính sách dữ liệu
          </p>
        </div>

        <div className="space-y-3">
          {/* FAQ 1 */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <button
              type="button"
              onClick={() => toggleFaq(0)}
              aria-expanded={openFaqIndex === 0}
              className="w-full p-4 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-foreground hover:bg-muted/50 transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                <span>Sau khi thanh toán qua VietQR bao lâu thì tài khoản được kích hoạt?</span>
              </span>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                  openFaqIndex === 0 ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>
            {openFaqIndex === 0 && (
              <div className="px-4 pb-4 pt-1 text-xs text-muted-foreground pl-10 leading-relaxed border-t border-border/50 animate-in fade-in">
                Hệ thống kết nối trực tiếp với cổng PayOS qua mạng Napas247. Ngay khi Thầy Cô chuyển khoản thành công trên app ngân hàng, hệ thống tự động kích hoạt tính năng thường trong vài giây mà không cần chụp màn hình đối soát.
              </div>
            )}
          </div>

          {/* FAQ 2 */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <button
              type="button"
              onClick={() => toggleFaq(1)}
              aria-expanded={openFaqIndex === 1}
              className="w-full p-4 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-foreground hover:bg-muted/50 transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                <span>Credits khi hết gói có bị mất đi không và thứ tự trừ credits thế nào?</span>
              </span>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                  openFaqIndex === 1 ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>
            {openFaqIndex === 1 && (
              <div className="px-4 pb-4 pt-1 text-xs text-muted-foreground pl-10 leading-relaxed border-t border-border/50 animate-in fade-in space-y-1.5">
                <p>
                  Toàn bộ Credits được cộng vào tài khoản là tài sản của Thầy Cô và được cộng dồn tích lũy vĩnh viễn, <strong>không bị reset về 0</strong> khi hết chu kỳ gói cước.
                </p>
                <p>
                  <strong>Thứ tự cấn trừ:</strong> Hệ thống tự động trừ <em>Credits thưởng (Promotional)</em> trước để tiết kiệm cho Thầy Cô, sau đó mới trừ tới <em>Credits nạp (Purchased)</em>.
                </p>
              </div>
            )}
          </div>

          {/* FAQ 3 */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <button
              type="button"
              onClick={() => toggleFaq(2)}
              aria-expanded={openFaqIndex === 2}
              className="w-full p-4 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-foreground hover:bg-muted/50 transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                <span>Tôi nâng cấp hoặc hạ cấp gói giữa chừng thì tính thế nào?</span>
              </span>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                  openFaqIndex === 2 ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>
            {openFaqIndex === 2 && (
              <div className="px-4 pb-4 pt-1 text-xs text-muted-foreground pl-10 leading-relaxed border-t border-border/50 animate-in fade-in space-y-1.5">
                <p>
                  <strong>Nâng cấp:</strong> Khi Thầy Cô đang dùng gói PRO và nâng cấp lên MAX, thời hạn sử dụng sẽ được cộng nối tiếp tương đương với giá trị còn lại, và nhận ngay trọn vẹn credits gói MAX mới.
                </p>
                <p>
                  <strong>Hạ cấp:</strong> Áp dụng từ kỳ tiếp theo. Khi chu kỳ hiện tại kết thúc, nếu Thầy Cô không gia hạn, tài khoản sẽ tự động chuyển về Gói Miễn Phí.
                </p>
              </div>
            )}
          </div>

          {/* FAQ 4 */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <button
              type="button"
              onClick={() => toggleFaq(3)}
              aria-expanded={openFaqIndex === 3}
              className="w-full p-4 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-foreground hover:bg-muted/50 transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                <span>Gói có tự động gia hạn trừ tiền không? Làm sao để hủy?</span>
              </span>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                  openFaqIndex === 3 ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>
            {openFaqIndex === 3 && (
              <div className="px-4 pb-4 pt-1 text-xs text-muted-foreground pl-10 leading-relaxed border-t border-border/50 animate-in fade-in">
                <strong>Hoàn toàn không tự trừ tiền.</strong> EduTest AI tôn trọng quyền tự chủ của Thầy Cô: chúng tôi chỉ gửi thông báo nhắc trước 7 ngày khi gói sắp hết hạn. Nếu Thầy Cô không có nhu cầu dùng tiếp, chỉ cần không quét mã thanh toán thì gói sẽ tự động dừng mà không phát sinh bất kỳ khoản phí nào.
              </div>
            )}
          </div>

          {/* FAQ 5 */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <button
              type="button"
              onClick={() => toggleFaq(4)}
              aria-expanded={openFaqIndex === 4}
              className="w-full p-4 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-foreground hover:bg-muted/50 transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                <span>Hoàn tiền ra sao nếu tôi chuyển khoản nhầm hoặc trùng lệnh?</span>
              </span>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                  openFaqIndex === 4 ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>
            {openFaqIndex === 4 && (
              <div className="px-4 pb-4 pt-1 text-xs text-muted-foreground pl-10 leading-relaxed border-t border-border/50 animate-in fade-in space-y-2">
                <p>
                  Nếu chuyển khoản nhầm số tiền hoặc chuyển trùng hai lần, hệ thống sẽ tự động hoàn tiền hoặc nhân viên kỹ thuật đối soát và hoàn tiền 100% trong vòng 24–48 giờ làm việc về chính tài khoản ngân hàng của Thầy Cô.
                </p>
                <button
                  type="button"
                  onClick={() => setIsRefundModalOpen(true)}
                  className="font-bold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Xem chi tiết Chính sách hoàn tiền</span>
                  <ArrowRight className="w-3 h-3" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>

          {/* FAQ 6 */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <button
              type="button"
              onClick={() => toggleFaq(5)}
              aria-expanded={openFaqIndex === 5}
              className="w-full p-4 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-foreground hover:bg-muted/50 transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                <span>Dữ liệu đề thi và bảng điểm của tôi khi hạ xuống Miễn phí có bị khóa không?</span>
              </span>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                  openFaqIndex === 5 ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>
            {openFaqIndex === 5 && (
              <div className="px-4 pb-4 pt-1 text-xs text-muted-foreground pl-10 leading-relaxed border-t border-border/50 animate-in fade-in">
                <strong>Tuyệt đối không bị khóa hay xóa bỏ.</strong> Toàn bộ ngân hàng câu hỏi, đề thi, bảng điểm học sinh và báo cáo đã tạo vẫn được bảo lưu vĩnh viễn trên tài khoản của Thầy Cô. Khi về gói Miễn Phí, chỉ các quyền hạn cao cấp (như tạo thêm đề không watermark, trộn 12 mã đề) sẽ tạm dừng chờ lần gia hạn tiếp theo.
              </div>
            )}
          </div>

          {/* FAQ 7 */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <button
              type="button"
              onClick={() => toggleFaq(6)}
              aria-expanded={openFaqIndex === 6}
              className="w-full p-4 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-foreground hover:bg-muted/50 transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                <span>Trường học hoặc trung tâm mua nhiều tài khoản thì liên hệ thế nào?</span>
              </span>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                  openFaqIndex === 6 ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>
            {openFaqIndex === 6 && (
              <div className="px-4 pb-4 pt-1 text-xs text-muted-foreground pl-10 leading-relaxed border-t border-border/50 animate-in fade-in space-y-2">
                <p>
                  Với đơn vị Trường học, Tổ chuyên môn hoặc Trung tâm mua từ 5 tài khoản trở lên, chúng tôi áp dụng chính sách chiết khấu đối tác giáo dục từ <strong>25% đến 40%</strong>, kèm phân quyền Quản lý tổ bộ môn và hỗ trợ cài đặt biểu mẫu đề theo barem riêng của trường.
                </p>
                <p>
                  Vui lòng bấm nút Chat hỗ trợ hoặc gọi Hotline để nhận báo giá chi tiết và hợp đồng mẫu.
                </p>
              </div>
            )}
          </div>

          {/* FAQ 8 */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <button
              type="button"
              onClick={() => toggleFaq(7)}
              aria-expanded={openFaqIndex === 7}
              className="w-full p-4 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-foreground hover:bg-muted/50 transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                <span>EduTest AI có hỗ trợ xuất hóa đơn điện tử VAT cho Trường học không?</span>
              </span>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                  openFaqIndex === 7 ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>
            {openFaqIndex === 7 && (
              <div className="px-4 pb-4 pt-1 text-xs text-muted-foreground pl-10 leading-relaxed border-t border-border/50 animate-in fade-in space-y-2">
                <p>
                  Có. EduTest AI xuất Hóa đơn điện tử VAT hợp pháp cho mọi giao dịch phục vụ thanh quyết toán ngân sách nhà trường hoặc quỹ trung tâm.
                </p>
                <button
                  type="button"
                  onClick={() => setIsVatModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Điền thông tin Yêu cầu hóa đơn VAT</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Support Help Banner */}
        <div className="rounded-2xl bg-linear-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/20 border border-indigo-200 dark:border-indigo-900/40 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <MessageCircle className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">
                Thầy Cô cần tư vấn thêm về gói cước?
              </p>
              <p className="text-xs text-muted-foreground">
                Đội ngũ sư phạm & kỹ thuật trực tuyến 24/7 qua Zalo Official Account.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <a
              href="https://zalo.me"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-xs cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Chat Zalo hỗ trợ</span>
            </a>
            <a
              href="tel:19000000"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-card text-foreground hover:bg-muted font-semibold text-xs transition cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Hotline 24/7</span>
            </a>
          </div>
        </div>
      </div>

      {/* 8. MODALS */}
      {checkoutPlan && (
        <PaymentCheckoutModal
          isOpen={Boolean(checkoutPlan)}
          onClose={() => setCheckoutPlan(null)}
          selectedPlan={checkoutPlan}
          onSuccess={handlePaymentSuccess}
        />
      )}

      <VatInvoiceModal
        isOpen={isVatModalOpen}
        onClose={() => setIsVatModalOpen(false)}
      />

      <RefundPolicyModal
        isOpen={isRefundModalOpen}
        onClose={() => setIsRefundModalOpen(false)}
      />
    </div>
  );
}

export default PlanTab;
