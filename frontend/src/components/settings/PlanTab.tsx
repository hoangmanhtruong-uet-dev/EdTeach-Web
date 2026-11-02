"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Check,
  Crown,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { isProUser, isMaxUser } from "@/lib/payment/plans";
import { PaymentCheckoutModal } from "@/components/modals/payment-checkout-modal";

export function PlanTab() {
  const searchParams = useSearchParams();
  const paymentStatus = searchParams?.get("status");
  const { profile, refreshWallet } = useAuth();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "semester">("monthly");
  const [checkoutPlan, setCheckoutPlan] = useState<{
    credits: number;
    price: string;
    amount: number;
    isPro: boolean;
    tier: "pro" | "max";
    name: string;
  } | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    if (paymentStatus === "PAID") {
      setSuccessToast("Chúc mừng Thầy Cô đã kích hoạt gói thành công! Đặc quyền đã được mở khóa ngay lập tức.");
      refreshWallet?.();
      const timer = setTimeout(() => setSuccessToast(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [paymentStatus, refreshWallet]);

  const hasMax = isMaxUser(profile);
  const hasPro = isProUser(profile);

  const isSemester = billingCycle === "semester";

  // Thông tin gói PRO
  const proPrice = isSemester ? "599.000đ" : "149.000đ";
  const proAmount = isSemester ? 599000 : 149000;
  const proCredits = isSemester ? 150000 : 30000;
  const proPeriod = isSemester ? "/học kỳ (5 tháng)" : "/tháng";

  // Thông tin gói MAX
  const maxPrice = isSemester ? "899.000đ" : "229.000đ";
  const maxAmount = isSemester ? 899000 : 229000;
  const maxCredits = isSemester ? 500000 : 100000;
  const maxPeriod = isSemester ? "/học kỳ (5 tháng)" : "/tháng";

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
    setSuccessToast("Chúc mừng Thầy Cô đã kích hoạt gói thành công! Đặc quyền đã được mở khóa ngay lập tức.");
    refreshWallet?.();
    setTimeout(() => setSuccessToast(null), 8000);
  };

  return (
    <div className="space-y-10">
      {/* 1. HERO HEADER */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-700 dark:text-indigo-300">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Hệ Điều Hành Dạy Thêm & Khảo Thí Sư Phạm Số 1 Việt Nam</span>
        </div>

        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Gói Cước & Đặc Quyền{" "}
          <span className="bg-linear-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            EduTest AI
          </span>
        </h2>

        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Đầu tư một khoản nhỏ mỗi tháng để giải phóng 15+ giờ soạn đề, chấm bài và chăm sóc phụ huynh. Kích hoạt tự động qua VietQR trong 2 giây.
        </p>

        {/* Current status banner if already upgraded */}
        {(hasMax || hasPro) && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300">
            <Crown className="w-4 h-4 text-amber-500" />
            <span>
              Tài khoản của Thầy Cô hiện đang kích hoạt đặc quyền:{" "}
              <strong>{hasMax ? "GÓI LUYỆN THI MAX (VIP)" : "GÓI GIÁO VIÊN PRO"}</strong>
            </span>
          </div>
        )}

        {/* Success toast message */}
        {successToast && (
          <div className="p-4 rounded-2xl bg-emerald-600 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2">
            <Check className="w-5 h-5 text-amber-300" />
            <span>{successToast}</span>
          </div>
        )}

        {/* 2. BILLING CYCLE TOGGLE (Month vs Semester) */}
        <div className="pt-2 flex items-center justify-center">
          <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl inline-flex items-center border border-slate-200 dark:border-slate-700 shadow-inner">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                billingCycle === "monthly"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Thanh toán Hàng Tháng
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("semester")}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                billingCycle === "semester"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>Theo Học Kỳ (5 Tháng)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800">
                Tiết kiệm đến 20%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. 3-TIER PRICING CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch max-w-6xl mx-auto">
        {/* PLAN 1: FREE */}
        <div className="rounded-3xl bg-card border border-border p-6 sm:p-7 flex flex-col justify-between shadow-xs hover:shadow-md transition">
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Khởi đầu</span>
              <h3 className="text-2xl font-black text-foreground">Gói Miễn Phí</h3>
              <p className="text-xs text-muted-foreground">Trải nghiệm các tính năng sư phạm cơ bản</p>
            </div>

            <div className="flex items-baseline gap-1 py-2">
              <span className="text-4xl font-black text-foreground">0đ</span>
              <span className="text-xs text-muted-foreground">/ mãi mãi</span>
            </div>

            <ul className="space-y-3 text-xs sm:text-sm text-muted-foreground pt-2 border-t border-border">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Tặng <strong>5.000 Credits</strong> khởi tạo tài khoản</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Tối đa <strong>3 lượt tạo đề/ngày</strong></span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Chấm trắc nghiệm OMR cơ bản qua camera</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>1 bài thí nghiệm 3D mẫu / mỗi môn học</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Trải nghiệm 2 link Báo cáo Zalo mẫu</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <button
              disabled
              className="w-full py-3 rounded-2xl bg-muted text-muted-foreground text-xs font-bold text-center cursor-not-allowed"
            >
              Gói Tiêu Chuẩn Hiện Tại
            </button>
          </div>
        </div>

        {/* PLAN 2: GIÁO VIÊN PRO */}
        <div className="rounded-3xl bg-card border-2 border-indigo-500 dark:border-indigo-500 p-6 sm:p-7 flex flex-col justify-between shadow-xl shadow-indigo-500/10 relative">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-linear-to-r from-indigo-600 to-purple-600 text-white text-xs font-extrabold uppercase tracking-wide shadow-md whitespace-nowrap">
            Phổ biến nhất cho Giáo viên
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Tiêu chuẩn giảng dạy
              </span>
              <h3 className="text-2xl font-black text-foreground flex items-center gap-2">
                <span>Giáo Viên PRO</span>
                <Sparkles className="w-5 h-5 text-amber-500" />
              </h3>
              <p className="text-xs text-muted-foreground">
                Dành cho Giáo viên trường THCS / THPT đứng lớp tiêu chuẩn
              </p>
            </div>

            <div className="py-2">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-foreground">{proPrice}</span>
                <span className="text-xs text-muted-foreground">{proPeriod}</span>
              </div>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
                Cộng ngay <strong>+{proCredits.toLocaleString()} Credits</strong> vào ví
              </p>
            </div>

            <ul className="space-y-3 text-xs sm:text-sm text-muted-foreground pt-2 border-t border-border">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 font-bold" />
                <span>
                  <strong>Mở khóa trọn bộ 54+ Lab 3D</strong> & Kính vẽ Neon
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 font-bold" />
                <span>
                  <strong>Xuất file Word kép sạch 100%</strong> (Không watermark)
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 font-bold" />
                <span>
                  <strong>Báo cáo Zalo Magic Link KHÔNG GIỚI HẠN</strong>
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 font-bold" />
                <span>Trộn tối đa <strong>4 mã đề</strong> chuẩn GDPT kèm Barem</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 font-bold" />
                <span>Chấm OMR lưu lịch sử lớp & xuất bảng điểm Excel</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <button
              type="button"
              onClick={() =>
                handleOpenCheckout(
                  "pro",
                  isSemester ? "Gói PRO Học Kỳ (5 Tháng)" : "Gói Giáo Viên PRO",
                  proAmount,
                  proCredits,
                  proPrice
                )
              }
              className="w-full py-3.5 rounded-2xl bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              {hasPro && !hasMax ? "Gia Hạn Gói PRO" : "Nâng Cấp PRO Ngay"}
            </button>
          </div>
        </div>

        {/* PLAN 3: LUYỆN THI MAX (VIP) */}
        <div className="rounded-3xl bg-linear-to-b from-purple-900/10 via-slate-900/5 to-purple-950/10 dark:from-purple-950/40 dark:via-slate-900 dark:to-purple-900/20 border-2 border-purple-500/80 dark:border-purple-500 p-6 sm:p-7 flex flex-col justify-between shadow-2xl shadow-purple-500/15 relative">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-linear-to-r from-purple-600 via-pink-600 to-amber-500 text-white text-xs font-black uppercase tracking-wide shadow-md flex items-center gap-1 whitespace-nowrap">
            <Crown className="w-3.5 h-3.5 text-amber-300" />
            <span>Vũ khí VIP cho Gia sư & Trung tâm</span>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-pink-600 dark:text-pink-400">
                Toàn năng sư phạm & Dạy thêm
              </span>
              <h3 className="text-2xl font-black text-foreground flex items-center gap-2">
                <span>Luyện Thi MAX</span>
                <Crown className="w-5 h-5 text-amber-500" />
              </h3>
              <p className="text-xs text-muted-foreground">
                Dành cho Gia sư, Giáo viên dạy thêm chuyên nghiệp và Trung tâm luyện thi
              </p>
            </div>

            <div className="py-2">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-foreground">{maxPrice}</span>
                <span className="text-xs text-muted-foreground">{maxPeriod}</span>
              </div>
              <p className="text-xs text-pink-600 dark:text-pink-400 font-semibold mt-1">
                Cộng ngay <strong>+{maxCredits.toLocaleString()} Credits</strong> (Gemini 2.0 Thinking & Deep Reasoning)
              </p>
            </div>

            <ul className="space-y-3 text-xs sm:text-sm text-foreground/80 pt-2 border-t border-border">
              <li className="flex items-center gap-2.5 font-bold text-indigo-900 dark:text-indigo-300">
                <Check className="w-4 h-4 text-pink-500 shrink-0 font-black" />
                <span>Toàn bộ đặc quyền của Gói PRO</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-pink-500 shrink-0 font-black" />
                <span>
                  <strong>⚡ AI Luyện Bù Lỗ Hổng Kiến Thức:</strong> Tự đẻ câu tương tự số đẹp từ câu sai
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-pink-500 shrink-0 font-black" />
                <span>
                  <strong>Đóng dấu Watermark thương hiệu riêng:</strong> Tên Gia sư, SĐT & Logo trung tâm
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-pink-500 shrink-0 font-black" />
                <span>
                  <strong>Trộn đề công nghiệp từ 8 đến 12 mã đề:</strong> Chống quay cóp cho lớp đông
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-pink-500 shrink-0 font-black" />
                <span>AI giải 3 cách & Tuyệt kỹ bấm máy Casio fx-580</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-pink-500 shrink-0 font-black" />
                <span>Phí sàn Chợ đề thi chỉ 5% (thay vì 15%)</span>
              </li>
            </ul>
          </div>

          <div className="pt-8">
            <button
              type="button"
              onClick={() =>
                handleOpenCheckout(
                  "max",
                  isSemester ? "Gói MAX Học Kỳ (5 Tháng)" : "Gói Luyện Thi MAX",
                  maxAmount,
                  maxCredits,
                  maxPrice
                )
              }
              className="w-full py-3.5 rounded-2xl bg-linear-to-r from-purple-600 via-pink-600 to-amber-600 hover:from-purple-500 hover:to-amber-500 text-white font-black text-sm shadow-xl shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              {hasMax ? "Gia Hạn Gói MAX VIP" : "Nâng Cấp MAX VIP Ngay"}
            </button>
          </div>
        </div>
      </div>

      {/* 4. COMPARISON MATRIX TABLE */}
      <div className="max-w-5xl mx-auto rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-xs space-y-6">
        <h3 className="text-xl font-black text-foreground text-center">
          Bảng So Sánh Chi Tiết Tính Năng
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-3 px-4 font-bold">Tính năng sư phạm</th>
                <th className="py-3 px-4 font-bold text-center">Miễn Phí</th>
                <th className="py-3 px-4 font-bold text-center text-indigo-600 dark:text-indigo-400">Giáo Viên PRO</th>
                <th className="py-3 px-4 font-bold text-center text-pink-600 dark:text-pink-400">Luyện Thi MAX</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="py-3.5 px-4 font-medium text-foreground">Credits AI cấp hàng tháng</td>
                <td className="py-3.5 px-4 text-center">5.000 (khởi đầu)</td>
                <td className="py-3.5 px-4 text-center font-bold text-indigo-600 dark:text-indigo-400">+30.000 / tháng</td>
                <td className="py-3.5 px-4 text-center font-black text-pink-600 dark:text-pink-400">+100.000 / tháng</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-medium text-foreground">Phòng Thí Nghiệm 3D tương tác</td>
                <td className="py-3.5 px-4 text-center">1 lab mẫu / môn</td>
                <td className="py-3.5 px-4 text-center font-bold text-emerald-600">Trọn bộ 54+ Labs & Kính vẽ</td>
                <td className="py-3.5 px-4 text-center font-bold text-emerald-600">Trọn bộ 54+ Labs & Kính vẽ</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-medium text-foreground">Xuất file Word (.docx) sạch</td>
                <td className="py-3.5 px-4 text-center text-muted-foreground">Dính Watermark web</td>
                <td className="py-3.5 px-4 text-center font-bold text-emerald-600">Sạch 100%</td>
                <td className="py-3.5 px-4 text-center font-bold text-emerald-600">Sạch 100%</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-medium text-foreground">Báo Cáo Học Tập Zalo Magic Link</td>
                <td className="py-3.5 px-4 text-center">2 link mẫu</td>
                <td className="py-3.5 px-4 text-center font-bold text-emerald-600">Không giới hạn</td>
                <td className="py-3.5 px-4 text-center font-bold text-emerald-600">Không giới hạn</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-medium text-foreground">Trộn mã đề thi trắc nghiệm</td>
                <td className="py-3.5 px-4 text-center text-muted-foreground">Không</td>
                <td className="py-3.5 px-4 text-center font-semibold">Tối đa 4 mã đề</td>
                <td className="py-3.5 px-4 text-center font-black text-pink-600 dark:text-pink-400">8 - 12 mã đề công nghiệp</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-medium text-foreground">AI Luyện Bù Lỗ Hổng Kiến Thức</td>
                <td className="py-3.5 px-4 text-center text-muted-foreground">Không</td>
                <td className="py-3.5 px-4 text-center text-muted-foreground">Không</td>
                <td className="py-3.5 px-4 text-center font-black text-emerald-600">Tự động sinh online & Word</td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-medium text-foreground">Watermark Thương Hiệu Gia Sư Riêng</td>
                <td className="py-3.5 px-4 text-center text-muted-foreground">Không</td>
                <td className="py-3.5 px-4 text-center text-muted-foreground">Không</td>
                <td className="py-3.5 px-4 text-center font-black text-purple-600 dark:text-purple-400">Logo + Tên + Hotline</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. FAQ SECTION */}
      <div className="max-w-3xl mx-auto space-y-4">
        <h3 className="text-xl font-bold text-foreground text-center">
          Câu Hỏi Thường Gặp Của Thầy Cô
        </h3>

        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-card border border-border">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-500" />
              <span>Sau khi thanh toán qua VietQR bao lâu thì tài khoản được kích hoạt?</span>
            </h4>
            <p className="text-xs text-muted-foreground mt-1.5 pl-6 leading-relaxed">
              Hệ thống kết nối trực tiếp với cổng PayOS qua mạng Napas247. Ngay khi Thầy Cô chuyển khoản thành công trên app ngân hàng, hệ thống tự động kích hoạt tính năng trong vòng <strong>dưới 2 giây</strong> mà không cần chụp màn hình đối soát.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-500" />
              <span>Credits được cấp có bị mất đi khi hết tháng không?</span>
            </h4>
            <p className="text-xs text-muted-foreground mt-1.5 pl-6 leading-relaxed">
              Không. Toàn bộ Credits được cộng vào tài khoản là của Thầy Cô và được cộng dồn tích lũy vĩnh viễn, không bị reset về 0 khi hết chu kỳ gói cước.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-500" />
              <span>EduTest AI có hỗ trợ xuất hóa đơn điện tử cho Trường học không?</span>
            </h4>
            <p className="text-xs text-muted-foreground mt-1.5 pl-6 leading-relaxed">
              Có. Với các đơn hàng từ 500.000đ trở lên hoặc gói trường học, Thầy Cô vui lòng liên hệ hotline/Zalo hỗ trợ để được xuất Hóa đơn điện tử VAT hợp lệ phục vụ thanh quyết toán nhà trường.
            </p>
          </div>
        </div>
      </div>

      {/* 6. MODAL CHECKOUT PAYOS VIETQR */}
      {checkoutPlan && (
        <PaymentCheckoutModal
          isOpen={Boolean(checkoutPlan)}
          onClose={() => setCheckoutPlan(null)}
          selectedPlan={checkoutPlan}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}

export default PlanTab;
