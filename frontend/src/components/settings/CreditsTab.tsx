"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Wallet as WalletIcon,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  Loader2,
  Sparkles,
  ShieldCheck,
  Check,
  Crown,
  Layers,
  Coins,
  Gift,
  Building2,
  Lock,
  ArrowRight,
} from "lucide-react";
import { getUserWallet, getWalletTransactions, Wallet, WalletTxn } from "@/lib/api/wallet";
import { PaymentCheckoutModal } from "@/components/modals/payment-checkout-modal";
import { useAuth } from "@/context/auth-context";
import {
  PRO_MONTHLY,
  PRO_SEMESTER,
  MAX_MONTHLY,
  MAX_SEMESTER,
  CREDIT_PACKS,
  isProUser,
  isMaxUser,
  isRealPayingUser,
  IS_BETA_ALL_FEATURES_UNLOCKED,
  getTierName,
} from "@/lib/payment/plans";

export function CreditsTab() {
  const searchParams = useSearchParams();
  const paymentStatus = searchParams?.get("status");
  const tierParam = searchParams?.get("tier");
  const planParam = searchParams?.get("plan");

  const { user, profile, refreshProfile } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [txns, setTxns] = useState<WalletTxn[]>([]);
  const [loading, setLoading] = useState(true);

  // Billing cycle: "monthly" | "semester"
  const [billingCycle, setBillingCycle] = useState<"monthly" | "semester">("monthly");
  const [selectedCreditPackIndex, setSelectedCreditPackIndex] = useState(1);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutTargetPlan, setCheckoutTargetPlan] = useState<any>(PRO_MONTHLY);
  const [showSuccessBanner, setShowSuccessBanner] = useState(paymentStatus === "PAID");

  const isUserMax = isMaxUser(profile) || isMaxUser(user);
  const isUserPro = isProUser(profile) || isProUser(user);

  const activeProPlan = billingCycle === "semester" ? PRO_SEMESTER : PRO_MONTHLY;
  const activeMaxPlan = billingCycle === "semester" ? MAX_SEMESTER : MAX_MONTHLY;

  async function loadData() {
    try {
      const [w, t] = await Promise.all([
        getUserWallet(),
        getWalletTransactions(20, 0),
      ]);
      setWallet(w);
      setTxns(t.transactions);
      await refreshProfile();
    } catch (err) {
      console.error("Failed to load wallet data", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    if (paymentStatus === "PAID") {
      setShowSuccessBanner(true);
      setTimeout(() => {
        loadData();
        refreshProfile();
      }, 2000);
    }
  }, [paymentStatus]);

  // URL query trigger for ?plan=pro or ?plan=max
  useEffect(() => {
    if (planParam === "max" && !isUserMax) {
      setCheckoutTargetPlan(activeMaxPlan);
      setIsCheckoutOpen(true);
    } else if (planParam === "pro" && !isUserPro) {
      setCheckoutTargetPlan(activeProPlan);
      setIsCheckoutOpen(true);
    }
  }, [planParam, isUserMax, isUserPro]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const balance = wallet?.balance ?? 0;
  const promoBal = wallet?.promotional_balance ?? 0;
  const purchasedBal = wallet?.purchased_balance ?? 0;
  const withdrawableVnd = wallet?.withdrawable_revenue_vnd ?? 0;
  const escrowVnd = wallet?.escrow_balance_vnd ?? 0;

  return (
    <div className="space-y-8">
      {/* Banner PayOS thanh toán thành công */}
      {showSuccessBanner && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/20 p-4 text-emerald-800 dark:text-emerald-300 flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">
                {tierParam === "max"
                  ? "Thanh toán thành công! Chúc mừng bạn đã nâng cấp GÓI LUYỆN THI MAX VIP."
                  : tierParam === "pro"
                  ? "Thanh toán thành công! Chúc mừng bạn đã lên GÓI GIÁO VIÊN PRO."
                  : "Thanh toán PayOS thành công!"}
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Giao dịch của bạn đã được xác nhận tự động. Hạn mức và các đặc quyền VIP đã kích hoạt ngay lập tức.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSuccessBanner(false)}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white dark:bg-card border border-emerald-200 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Ví Credits & Nạp Điểm</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quản lý số dư, mở khóa đặc quyền Gói PRO / Gói MAX và nạp credits tự động 24/7 qua VietQR PayOS.
          </p>
        </div>

        {/* Cycle Toggle */}
        <div className="inline-flex items-center rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100/70 dark:bg-muted/40 p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={`px-4 py-2 min-h-[36px] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
              billingCycle === "monthly"
                ? "bg-white dark:bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Gói 1 Tháng
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("semester")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              billingCycle === "semester"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Gói Học Kỳ (5 Tháng)</span>
            <span className="rounded-full bg-amber-400 text-amber-950 px-1.5 py-0.2 text-[9px] font-black">
              -20%
            </span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-3">
              <WalletIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Số dư hiện tại</p>
              <p className="text-2xl font-black text-foreground">{balance.toLocaleString()} credits</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
          <div className="flex items-center gap-3">
            <div
              className={`rounded-xl p-3 ${
                isUserMax
                  ? "bg-amber-500/10 text-amber-600"
                  : isUserPro
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isUserMax ? <Crown className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Hạng tài khoản</p>
              <div className="flex flex-wrap items-center gap-2">
                <p
                  className={`text-xl font-black ${
                    isUserMax
                      ? "text-amber-600"
                      : isUserPro
                      ? "text-primary"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {getTierName(profile || user)}
                </p>
                {isUserMax ? (
                  <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-black text-white">
                    MAX VIP
                  </span>
                ) : isUserPro ? (
                  <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[9px] font-bold text-white">
                    PRO
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-500 px-2 py-0.5 text-[9px] font-bold text-white">
                    MIỄN PHÍ
                  </span>
                )}
              </div>
              {IS_BETA_ALL_FEATURES_UNLOCKED && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
                  {isRealPayingUser(profile)
                    ? "Tài khoản Giáo viên PRO được mở khóa thêm toàn bộ tính năng Gói MAX trong giai đoạn Beta."
                    : "Tài khoản đang được kích hoạt dùng thử 100% tính năng Gói MAX trong giai đoạn Beta."}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Cổng thanh toán tự động</p>
              <p className="text-2xl font-black text-emerald-600">VietQR 24/7</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Bucket Wallet Breakdown */}
      <div className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" />
              Chi tiết cấu trúc Ví 3 Ngăn (3-Bucket Economics)
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Phân định minh bạch giữa Credits tiêu dùng (Mua vs Thưởng), Tiền mặt rút về ngân hàng và Quỹ ký quỹ Escrow bảo đảm.
            </p>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary self-start sm:self-auto">
            Chuẩn Kinh tế Minh bạch 2026
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Bucket 1: Purchased Balance */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 dark:border-blue-900/30 dark:bg-blue-950/10 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Credits Nạp / Mua</span>
              <Coins className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-xl font-black text-blue-900 dark:text-blue-100">
              {purchasedBal.toLocaleString()} <span className="text-xs font-medium">credits</span>
            </p>
            <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80 leading-snug">
              Dùng để sinh đề AI & mua tài liệu tác quyền trên Marketplace.
            </p>
          </div>

          {/* Bucket 2: Promotional Balance */}
          <div className="rounded-2xl border border-purple-100 bg-purple-50/50 dark:border-purple-900/30 dark:bg-purple-950/10 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">Credits Thưởng / Promo</span>
              <Gift className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-xl font-black text-purple-900 dark:text-purple-100">
              {promoBal.toLocaleString()} <span className="text-xs font-medium">credits</span>
            </p>
            <p className="text-[11px] text-purple-700/80 dark:text-purple-300/80 leading-snug">
              Thưởng eKYC & Giới thiệu. Ưu tiên tự động cấn trừ trước khi tạo đề.
            </p>
          </div>

          {/* Bucket 3: Withdrawable Cash */}
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-950/10 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Doanh thu Rút tiền</span>
              <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-xl font-black text-emerald-900 dark:text-emerald-100">
              {withdrawableVnd.toLocaleString("vi-VN")} <span className="text-xs font-medium">VNĐ</span>
            </p>
            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 leading-snug">
              Hoa hồng & bán đề đã giải tỏa. Rút về ngân hàng (Sàn tối thiểu 200.000đ).
            </p>
          </div>

          {/* Bucket 4: Escrow Hold */}
          <div className="rounded-2xl border border-amber-100 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-950/10 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Ký quỹ Escrow (Tạm giữ)</span>
              <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-xl font-black text-amber-900 dark:text-amber-100">
              {escrowVnd.toLocaleString("vi-VN")} <span className="text-xs font-medium">VNĐ</span>
            </p>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 leading-snug">
              Tạm giữ 14 ngày bảo đảm bản quyền. Tự động chuyển sang khả dụng sau 14 ngày.
            </p>
          </div>
        </div>
      </div>

      {/* Main Pricing Cards Grid (PRO vs MAX) */}
      <div className="space-y-4">
        <div className="text-center max-w-xl mx-auto mb-2">
          <h2 className="text-xl font-bold tracking-tight">Gói dịch vụ dành riêng cho Giáo viên Việt Nam</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Thiết kế tối ưu theo nghiệp vụ thực tế: Không watermark, tráo mã đề chuẩn Bộ GD&ĐT 2025 và chấm tự động.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Card 1: GÓI PRO */}
          <div
            className={`rounded-3xl border p-6 sm:p-7 transition-all flex flex-col justify-between relative bg-card ${
              isUserPro && !isUserMax
                ? "border-primary ring-2 ring-primary/40 shadow-md"
                : "border-border shadow-xs hover:border-primary/50"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-bold">
                  {activeProPlan.badge}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {activeProPlan.period}
                </span>
              </div>

              <h3 className="text-2xl font-black text-foreground">{activeProPlan.name}</h3>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-primary">{activeProPlan.price}</span>
                <span className="text-xs text-muted-foreground">{activeProPlan.period}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                {activeProPlan.description}
              </p>

              <hr className="my-5 border-border" />

              <div className="space-y-2.5 text-xs">
                <p className="font-bold text-foreground">Đặc quyền nổi bật:</p>
                {activeProPlan.features.map((feat, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-neutral-700 dark:text-neutral-300 leading-snug">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setCheckoutTargetPlan(activeProPlan);
                setIsCheckoutOpen(true);
              }}
              disabled={isUserPro}
              className={`mt-6 w-full py-3.5 rounded-2xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5 ${
                isUserPro && !isUserMax
                  ? "bg-emerald-600 text-white opacity-90 cursor-default"
                  : isUserMax
                  ? "bg-muted text-muted-foreground cursor-default"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {isUserPro && !isUserMax
                  ? "Đang sử dụng Gói PRO"
                  : isUserMax
                  ? "Bạn đã có đặc quyền MAX cao hơn"
                  : `Nâng cấp Gói PRO (${activeProPlan.price})`}
              </span>
            </button>
          </div>

          {/* Card 2: GÓI MAX (HIGHLIGHTED) */}
          <div className="rounded-3xl border-2 border-amber-400 bg-linear-to-b from-amber-500/10 via-amber-500/5 to-transparent p-6 sm:p-7 shadow-lg flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-12 -top-12 w-36 h-36 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="rounded-full bg-linear-to-r from-amber-500 to-amber-600 px-3.5 py-1 text-xs font-black text-white shadow-xs flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5" />
                  {activeMaxPlan.badge}
                </span>
                <span className="text-xs font-bold text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-md">
                  {activeMaxPlan.period}
                </span>
              </div>

              <h3 className="text-2xl font-black text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                {activeMaxPlan.name}
              </h3>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-amber-600 dark:text-amber-400">{activeMaxPlan.price}</span>
                <span className="text-xs text-neutral-500">{activeMaxPlan.period}</span>
              </div>
              <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                {activeMaxPlan.description}
              </p>

              <hr className="my-5 border-amber-200/60 dark:border-amber-800/40" />

              <div className="space-y-2.5 text-xs">
                <p className="font-bold text-amber-900 dark:text-amber-300">Toàn bộ quyền lợi PRO cộng thêm:</p>
                {activeMaxPlan.features.map((feat, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <span className="text-neutral-800 dark:text-neutral-200 font-medium leading-snug">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setCheckoutTargetPlan(activeMaxPlan);
                setIsCheckoutOpen(true);
              }}
              disabled={isUserMax}
              className={`mt-6 w-full py-3.5 rounded-2xl text-xs font-black transition shadow-md cursor-pointer flex items-center justify-center gap-2 ${
                isUserMax
                  ? "bg-emerald-600 text-white opacity-90 cursor-default"
                  : "bg-linear-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white shadow-amber-500/25"
              }`}
            >
              <Crown className="w-4 h-4" />
              <span>
                {isUserMax ? "Bạn đang sở hữu Gói MAX VIP" : `Nâng cấp Gói MAX ngay (${activeMaxPlan.price})`}
              </span>
              {!isUserMax && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Credit Packs & Transaction history */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Transaction History */}
        <div className="rounded-2xl border border-border bg-card lg:col-span-2 shadow-xs">
          <div className="flex items-center justify-between border-b border-border p-5">
            <h2 className="font-semibold text-base">Lịch sử giao dịch ví</h2>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Gần đây nhất
            </span>
          </div>
          <div className="overflow-x-auto divide-y divide-border">
            {txns.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">Chưa có giao dịch nào</p>
            ) : (
              txns.map((txn) => (
                <div key={txn.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-full p-2 ${
                        txn.amount < 0
                          ? "bg-red-50 text-red-600 dark:bg-red-950/50"
                          : "bg-green-50 text-green-600 dark:bg-green-950/50"
                      }`}
                    >
                      {txn.amount < 0 ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownLeft className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{txn.description || txn.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(txn.created_at).toLocaleDateString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-mono text-sm font-bold ${
                      txn.amount < 0 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {txn.amount < 0 ? `${txn.amount}` : `+${txn.amount}`} credits
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Nạp thêm credits lẻ */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
          <div>
            <h2 className="font-semibold text-base">Nạp thêm Credits lẻ</h2>
            <p className="text-xs text-muted-foreground">Dành cho nhu cầu sinh thêm đề thi tức thời.</p>
          </div>

          <div className="space-y-2.5">
            {CREDIT_PACKS.map((plan, idx) => {
              const isSelected = selectedCreditPackIndex === idx;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedCreditPackIndex(idx);
                    setCheckoutTargetPlan(plan);
                  }}
                  className={`relative rounded-xl border p-3 transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-2.5 right-4 rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold text-primary-foreground">
                      Phổ biến
                    </span>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm">{plan.credits.toLocaleString()} Credits</p>
                      <p className="text-[11px] text-muted-foreground">{plan.perCredit}/credit</p>
                    </div>
                    <span className="text-sm font-bold text-primary">{plan.price}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              setCheckoutTargetPlan(CREDIT_PACKS[selectedCreditPackIndex]);
              setIsCheckoutOpen(true);
            }}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Nạp {CREDIT_PACKS[selectedCreditPackIndex].credits.toLocaleString()} Credits ({CREDIT_PACKS[selectedCreditPackIndex].price})</span>
          </button>
        </div>
      </div>

      {/* PayOS / VietQR Checkout Modal */}
      <PaymentCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        selectedPlan={checkoutTargetPlan}
        onSuccess={(newBal) => {
          setWallet((prev) => (prev ? { ...prev, balance: newBal } : prev));
          loadData();
          refreshProfile();
        }}
      />
    </div>
  );
}

export default CreditsTab;
