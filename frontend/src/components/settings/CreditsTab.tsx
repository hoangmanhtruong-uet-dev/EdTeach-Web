"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
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
  CREDIT_PACKS,
  isProUser,
  isMaxUser,
  isRealPayingUser,
  IS_BETA_ALL_FEATURES_UNLOCKED,
  getTierName,
} from "@/lib/payment/plans";
import { getUserPlanState } from "@/lib/payment/plan-status";
import { PlanStatusCard } from "./PlanStatusCard";

export function CreditsTab() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentStatus = searchParams?.get("status");
  const tierParam = searchParams?.get("tier");
  const planParam = searchParams?.get("plan");

  const { user, profile, refreshProfile } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [txns, setTxns] = useState<WalletTxn[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCreditPackIndex, setSelectedCreditPackIndex] = useState(1);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutTargetPlan, setCheckoutTargetPlan] = useState<any>(CREDIT_PACKS[1]);
  const [showSuccessBanner, setShowSuccessBanner] = useState(paymentStatus === "PAID");

  const userPlanState = getUserPlanState(profile, user);
  const isUserMax = userPlanState === "max-paid" || userPlanState === "max-beta" || isMaxUser(profile);
  const isUserPro = userPlanState === "pro" || isProUser(profile);

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

  // URL query trigger for ?plan=pro or ?plan=max -> redirect to plan tab
  useEffect(() => {
    if (planParam === "max" || planParam === "pro") {
      router.push(`/settings?tab=plan&plan=${planParam}`);
    }
  }, [planParam, router]);

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
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-bold text-sm">
                {tierParam === "max"
                  ? "Thanh toán thành công! Chúc mừng bạn đã kích hoạt GÓI LUYỆN THI MAX."
                  : tierParam === "pro"
                  ? "Thanh toán thành công! Chúc mừng bạn đã lên GÓI GIÁO VIÊN PRO."
                  : "Thanh toán PayOS thành công!"}
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Giao dịch của bạn đã được xác nhận tự động. Hạn mức và các đặc quyền đã kích hoạt ngay lập tức.
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
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Ví Credits & Nạp Điểm</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quản lý số dư, theo dõi lịch sử và nạp credits tự động 24/7 qua VietQR Napas247.
          </p>
        </div>

        <Link
          href="/settings?tab=plan"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Crown className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Xem bảng Gói cước</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-3">
              <WalletIcon className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Số dư hiện tại</p>
              <p className="text-2xl font-black text-foreground">{balance.toLocaleString("vi-VN")} credits</p>
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
              {isUserMax ? (
                <Crown className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Sparkles className="h-6 w-6" aria-hidden="true" />
              )}
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
                  {isUserMax ? "Luyện thi MAX" : isUserPro ? "Giáo viên PRO" : "Miễn Phí"}
                </p>
                {isUserMax ? (
                  <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-black text-white">
                    MAX
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
              {IS_BETA_ALL_FEATURES_UNLOCKED && !profile?.tier && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
                  Tài khoản đang được dùng thử 100% tính năng Gói MAX trong giai đoạn Beta.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Cổng thanh toán tự động</p>
              <p className="text-2xl font-black text-emerald-600">VietQR 24/7</p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Plan Status Card - Replacing duplicate PRO/MAX cards (P4 & P1) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">Gói cước & Đặc quyền tài khoản</h3>
          <Link
            href="/settings?tab=plan"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span>Đổi gói cước</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>

        <PlanStatusCard
          variant="compact"
          onNavigateToPlan={() => router.push("/settings?tab=plan")}
        />
      </div>

      {/* 3-Bucket Wallet Breakdown */}
      <div className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" aria-hidden="true" />
              <span>Cấu trúc Ví 3 Ngăn (3-Bucket Economics)</span>
            </h3>
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
              <Coins className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            </div>
            <p className="text-xl font-black text-blue-900 dark:text-blue-100">
              {purchasedBal.toLocaleString("vi-VN")} <span className="text-xs font-medium">credits</span>
            </p>
            <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80 leading-snug">
              Dùng để sinh đề AI & mua tài liệu tác quyền trên Marketplace.
            </p>
          </div>

          {/* Bucket 2: Promotional Balance */}
          <div className="rounded-2xl border border-purple-100 bg-purple-50/50 dark:border-purple-900/30 dark:bg-purple-950/10 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">Credits Thưởng / Promo</span>
              <Gift className="w-4 h-4 text-purple-600 dark:text-purple-400" aria-hidden="true" />
            </div>
            <p className="text-xl font-black text-purple-900 dark:text-purple-100">
              {promoBal.toLocaleString("vi-VN")} <span className="text-xs font-medium">credits</span>
            </p>
            <p className="text-[11px] text-purple-700/80 dark:text-purple-300/80 leading-snug">
              Thưởng eKYC & Giới thiệu. Ưu tiên tự động cấn trừ trước khi tạo đề.
            </p>
          </div>

          {/* Bucket 3: Withdrawable Cash */}
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-950/10 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Doanh thu Rút tiền</span>
              <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
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
              <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
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

      {/* Credit Packs & Transaction history */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Transaction History */}
        <div className="rounded-2xl border border-border bg-card lg:col-span-2 shadow-xs">
          <div className="flex items-center justify-between border-b border-border p-5">
            <h3 className="font-semibold text-base text-foreground">Lịch sử giao dịch ví</h3>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" /> Gần đây nhất
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
                        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <ArrowDownLeft className="h-4 w-4" aria-hidden="true" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{txn.description || txn.type}</p>
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
            <h3 className="font-semibold text-base text-foreground">Nạp thêm Credits lẻ</h3>
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
                      <p className="font-bold text-sm text-foreground">{plan.credits.toLocaleString("vi-VN")} Credits</p>
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
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>
              Nạp {CREDIT_PACKS[selectedCreditPackIndex].credits.toLocaleString("vi-VN")} Credits ({CREDIT_PACKS[selectedCreditPackIndex].price})
            </span>
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
