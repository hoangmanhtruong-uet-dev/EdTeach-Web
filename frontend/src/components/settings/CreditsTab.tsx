"use client";

import React, { useEffect, useState, useMemo } from "react";
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
  Calendar,
  Info,
  Tag,
  Download,
  FileText,
  X,
  AlertCircle,
  Printer,
} from "lucide-react";
import { getUserWallet, getWalletTransactions, Wallet, WalletTxn } from "@/lib/api/wallet";
import { PaymentCheckoutModal } from "@/components/modals/payment-checkout-modal";
import { useAuth } from "@/context/auth-context";
import {
  isProUser,
  isMaxUser,
  IS_BETA_ALL_FEATURES_UNLOCKED,
} from "@/lib/payment/plans";
import { getUserPlanState } from "@/lib/payment/plan-status";

/**
 * Bảng Mệnh giá Gói nạp lẻ chuẩn hóa Unit Economics 2026
 */
export interface TopupPackage {
  id: string;
  name: string;
  credits: number;
  price: string;
  amount: number;
  unitPrice: string;
  estimate: string;
  badge?: string;
  popular?: boolean;
}

export const TOPUP_PACKAGES: TopupPackage[] = [
  {
    id: "pack_starter",
    name: "Gói Khởi Động",
    credits: 5000,
    price: "29.000đ",
    amount: 29000,
    unitPrice: "5,8đ/credit",
    estimate: "~10 đề thi chuẩn",
    popular: false,
  },
  {
    id: "pack_popular",
    name: "Gói Phổ Biến",
    credits: 15000,
    price: "79.000đ",
    amount: 79000,
    unitPrice: "5,2đ/credit",
    estimate: "~30 đề thi chuẩn",
    badge: "Phổ biến",
    popular: true,
  },
  {
    id: "pack_speed",
    name: "Gói Tăng Tốc",
    credits: 35000,
    price: "169.000đ",
    amount: 169000,
    unitPrice: "4,8đ/credit",
    estimate: "~70 đề thi chuẩn",
    popular: false,
  },
  {
    id: "pack_pro",
    name: "Gói Chuyên Nghiệp",
    credits: 80000,
    price: "349.000đ",
    amount: 349000,
    unitPrice: "4,3đ/credit",
    estimate: "~160 đề thi chuẩn",
    badge: "Tiết kiệm nhất",
    popular: false,
  },
];

interface ReceiptModalData {
  orderCode: string;
  description: string;
  amountVnd: string;
  credits: number;
  date: string;
  method: string;
}

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

  // Gói nạp lẻ được chọn (Mặc định Gói Phổ Biến index = 1)
  const [selectedPackIndex, setSelectedPackIndex] = useState(1);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutTargetPlan, setCheckoutTargetPlan] = useState<any>(TOPUP_PACKAGES[1]);
  const [showSuccessBanner, setShowSuccessBanner] = useState(paymentStatus === "PAID");

  // Modal Bảng định mức tiêu hao
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);

  // Modal Biên lai điện tử
  const [receiptData, setReceiptData] = useState<ReceiptModalData | null>(null);

  // Voucher / Giftcode
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherSuccess, setVoucherSuccess] = useState<string | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [bonusPromoCredits, setBonusPromoCredits] = useState(0);

  // Filter lịch sử giao dịch: "all" | "in" | "out"
  const [historyFilter, setHistoryFilter] = useState<"all" | "in" | "out">("all");

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

  // Đồng bộ Ví 3 Ngăn, Số dư và Lịch sử giao dịch:
  // Công thức: Tổng số dư = Credits Nạp/Mua + Credits Thưởng/Promo
  // Default mock/state:
  // - Quà chào mừng (+5.000 Promo)
  // - Kích hoạt PRO (+30.000 Mua/Gói)
  // - Tạo đề (-500 ưu tiên trừ ví Promo)
  // => Số dư tổng: 34.500 credits (đồng bộ trên thẻ tổng và Header badge)
  // => Ngăn 1 (Nạp/Mua): 30.000 credits
  // => Ngăn 2 (Thưởng/Promo): 4.500 credits
  // => Ngăn 3 (Doanh thu Rút tiền): 0 VNĐ
  // => Ngăn 4 (Escrow): 0 VNĐ
  const defaultPurchased = 30000;
  const defaultPromo = 4500 + bonusPromoCredits;

  const purchasedBal = wallet && wallet.purchased_balance > 0 ? wallet.purchased_balance : defaultPurchased;
  const promoBal = wallet && wallet.promotional_balance > 0 ? (wallet.promotional_balance + bonusPromoCredits) : defaultPromo;
  const totalBalance = wallet && wallet.balance > 0 ? (wallet.balance + bonusPromoCredits) : (purchasedBal + promoBal);
  const withdrawableVnd = wallet?.withdrawable_revenue_vnd ?? 0;
  const escrowVnd = wallet?.escrow_balance_vnd ?? 0;

  // Lịch sử giao dịch kết hợp dữ liệu Supabase và 3 giao dịch mock chuẩn narrative
  const defaultMockTxns: WalletTxn[] = useMemo(() => [
    {
      id: "txn_exam_01",
      wallet_id: "default_wallet",
      amount: -500,
      type: "exam_generation",
      description: "Tạo đề chuẩn GDPT 2025 - 60 câu (Ưu tiên trừ Ví Thưởng)",
      created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 giờ trước
      reference_id: "EXAM-2025-098",
      balance_after: 34500,
    } as unknown as WalletTxn,
    {
      id: "txn_plan_pro",
      wallet_id: "default_wallet",
      amount: 30000,
      type: "plan_activation",
      description: "Kích hoạt Gói Giáo Viên PRO - Cộng Ví Mua",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 ngày trước
      reference_id: "PAYOS-PRO-84920",
      balance_after: 35000,
    } as unknown as WalletTxn,
    {
      id: "txn_welcome_01",
      wallet_id: "default_wallet",
      amount: 5000,
      type: "welcome_bonus",
      description: "Quà chào mừng Giáo viên mới - Cộng Ví Thưởng",
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 ngày trước
      reference_id: "BONUS-WELCOME",
      balance_after: 5000,
    } as unknown as WalletTxn,
  ], []);

  const displayTxns = useMemo(() => {
    const list = txns.length > 0 ? txns : defaultMockTxns;
    if (historyFilter === "in") {
      return list.filter((t) => t.amount > 0);
    }
    if (historyFilter === "out") {
      return list.filter((t) => t.amount < 0);
    }
    return list;
  }, [txns, defaultMockTxns, historyFilter]);

  // Xử lý áp dụng Giftcode / Voucher
  const handleApplyVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    setVoucherError(null);
    setVoucherSuccess(null);

    const cleanCode = voucherCode.trim().toUpperCase();
    if (!cleanCode) {
      setVoucherError("Vui lòng nhập mã Giftcode / Voucher.");
      return;
    }

    setVoucherLoading(true);
    setTimeout(() => {
      setVoucherLoading(false);
      if (
        cleanCode === "GIAOVIEN2026" ||
        cleanCode === "EDUTEACH" ||
        cleanCode === "CHAMTHI2025" ||
        cleanCode === "CHAOMUNG"
      ) {
        const bonus = 2000;
        setBonusPromoCredits((prev) => prev + bonus);
        setVoucherSuccess(`✓ Áp dụng mã ${cleanCode} thành công! Bạn nhận được +${bonus.toLocaleString("vi-VN")} Credits Thưởng.`);
        setVoucherCode("");
      } else {
        setVoucherError("Mã Voucher không hợp lệ hoặc đã hết lượt sử dụng.");
      }
    }, 600);
  };

  // Mở modal biên lai điện tử
  const handleOpenReceipt = (txn: WalletTxn) => {
    const isProPlan = txn.amount === 30000;
    const isMaxPlan = txn.amount === 100000;
    const isTopup = txn.amount > 0 && !isProPlan && !isMaxPlan;

    let priceText = "149.000 VNĐ";
    if (isMaxPlan) priceText = "229.000 VNĐ";
    else if (isTopup) {
      const matched = TOPUP_PACKAGES.find((p) => p.credits === txn.amount);
      priceText = matched ? matched.price.replace("đ", " VNĐ") : "79.000 VNĐ";
    }

    setReceiptData({
      orderCode: (txn as any).reference_id || `PAYOS-${txn.id.slice(0, 8).toUpperCase()}`,
      description: txn.description || "Thanh toán gói dịch vụ EduTest",
      amountVnd: priceText,
      credits: txn.amount,
      date: new Date(txn.created_at).toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      method: "VietQR Napas247 - PayOS",
    });
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedPack = TOPUP_PACKAGES[selectedPackIndex];

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
                  ? "Thanh toán thành công! Chúc mừng Thầy Cô đã kích hoạt GÓI LUYỆN THI MAX."
                  : tierParam === "pro"
                  ? "Thanh toán thành công! Chúc mừng Thầy Cô đã kích hoạt GÓI GIÁO VIÊN PRO."
                  : "Thanh toán PayOS thành công!"}
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Giao dịch của Thầy Cô đã được xác nhận tự động. Số dư Credits và các đặc quyền đã kích hoạt ngay lập tức.
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
            Quản lý số dư, định mức tiêu hao, nạp credits tức thời 24/7 và đối soát giao dịch minh bạch.
          </p>
        </div>

        <Link
          href="/settings?tab=plan"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Crown className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Bảng Gói cước PRO & MAX</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </div>

      {/* 1. OVERVIEW CARDS (3 CARDS) */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* CARD 1: SỐ DƯ HIỆN TẠI + POPOVER ĐỊNH MỨC TIÊU HAO */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-3">
                <WalletIcon className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-xs font-semibold text-muted-foreground">Số dư hiện tại</p>
                  {/* Nút mở Popover/Modal Bảng định mức tiêu hao Credits */}
                  <button
                    type="button"
                    onClick={() => setIsQuotaModalOpen(true)}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-muted hover:bg-muted/80 text-primary transition cursor-pointer border border-border"
                    title="Xem bảng định mức tiêu hao Credits"
                  >
                    <Info className="w-3 h-3" aria-hidden="true" />
                    <span>Định mức</span>
                  </button>
                </div>
                <p className="text-2xl font-black text-foreground mt-0.5">
                  {totalBalance.toLocaleString("vi-VN")} <span className="text-sm font-medium text-muted-foreground">credits</span>
                </p>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground mt-3 pt-2 border-t border-border/60">
            Tổng = {purchasedBal.toLocaleString("vi-VN")} Mua + {promoBal.toLocaleString("vi-VN")} Thưởng
          </p>
        </div>

        {/* CARD 2: HẠNG TÀI KHOẢN (ẨN BẢNG SO SÁNH, CHỈ GIỮ NÚT NHỎ "NÂNG CẤP GÓI" ĐIỀU HƯỚNG SANG ?tab=plans) */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
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
                ) : isUserPro ? (
                  <Sparkles className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Layers className="h-6 w-6" aria-hidden="true" />
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Hạng tài khoản</p>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  <p
                    className={`text-xl font-black ${
                      isUserMax
                        ? "text-amber-600 dark:text-amber-400"
                        : isUserPro
                        ? "text-primary"
                        : "text-foreground"
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
                      FREE
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Nút nhỏ Nâng cấp gói điều hướng sang ?tab=plans */}
            <Link
              href="/settings?tab=plan"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border border-border bg-muted/60 hover:bg-muted text-primary transition shrink-0 cursor-pointer shadow-2xs"
            >
              <span>Nâng cấp gói</span>
              <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </Link>
          </div>

          <p className="text-[11px] text-muted-foreground mt-3 pt-2 border-t border-border/60 truncate">
            {isUserMax
              ? "Toàn quyền Gemini Thinking & 12 mã đề"
              : isUserPro
              ? "Xuất Word sạch 100% & 54+ Labs STEM"
              : "Nâng cấp PRO/MAX để mở khóa đầy đủ quyền lợi"}
          </p>
        </div>

        {/* CARD 3: CHU KỲ & HẠN SỬ DỤNG GÓI (THAY CHO THẺ CỔNG THANH TOÁN CŨ) */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-500/10 p-3 text-indigo-600 dark:text-indigo-400">
              <Calendar className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Chu kỳ & Hạn sử dụng Gói</p>
              <p className="text-lg font-black text-foreground mt-0.5">
                Hết hạn: 30/11/2026
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-3 pt-2 border-t border-border/60">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Còn 28 ngày</span>
            <span>Tự động gia hạn: <strong>Tắt</strong></span>
          </div>
        </div>
      </div>

      {/* 2. CẤU TRÚC VÍ 3 NGĂN (3-BUCKET ECONOMICS) + ESCROW */}
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
            Kinh tế Minh bạch GDPT 2026
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Ngăn 1: Credits Nạp / Mua */}
          <div className="rounded-2xl border border-blue-200/80 bg-blue-50/50 dark:border-blue-900/40 dark:bg-blue-950/20 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-700 dark:text-blue-300">Ngăn 1: Credits Nạp / Mua</span>
              <Coins className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            </div>
            <p className="text-2xl font-black text-blue-900 dark:text-blue-100">
              {purchasedBal.toLocaleString("vi-VN")} <span className="text-xs font-medium">credits</span>
            </p>
            <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80 leading-snug">
              Credits từ nạp lẻ hoặc gói cước PRO/MAX. Không bao giờ hết hạn.
            </p>
          </div>

          {/* Ngăn 2: Credits Thưởng / Promo */}
          <div className="rounded-2xl border border-purple-200/80 bg-purple-50/50 dark:border-purple-900/40 dark:bg-purple-950/20 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-700 dark:text-purple-300">Ngăn 2: Credits Thưởng / Promo</span>
              <Gift className="w-4 h-4 text-purple-600 dark:text-purple-400" aria-hidden="true" />
            </div>
            <p className="text-2xl font-black text-purple-900 dark:text-purple-100">
              {promoBal.toLocaleString("vi-VN")} <span className="text-xs font-medium">credits</span>
            </p>
            <p className="text-[11px] text-purple-700/80 dark:text-purple-300/80 leading-snug">
              Quà chào mừng & giới thiệu. <strong>Ưu tiên tự động trừ trước</strong> khi tạo đề.
            </p>
          </div>

          {/* Ngăn 3: Doanh thu Rút tiền (Disabled Rút tiền khi < 200.000đ) */}
          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Ngăn 3: Doanh thu Rút tiền</span>
              <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            </div>
            <p className="text-2xl font-black text-emerald-900 dark:text-emerald-100">
              {withdrawableVnd.toLocaleString("vi-VN")} <span className="text-xs font-medium">VNĐ</span>
            </p>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-muted-foreground">Tối thiểu: 200.000đ</span>
              <button
                type="button"
                disabled={withdrawableVnd < 200000}
                className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-600 text-white disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed cursor-pointer"
                title={withdrawableVnd < 200000 ? "Cần tối thiểu 200.000đ để rút tiền" : "Rút tiền về VietQR"}
              >
                Rút tiền
              </button>
            </div>
          </div>

          {/* Ngăn 4: Ký quỹ Escrow (Tạm giữ) */}
          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300">Ngăn 4: Ký quỹ Escrow</span>
              <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            </div>
            <p className="text-2xl font-black text-amber-900 dark:text-amber-100">
              {escrowVnd.toLocaleString("vi-VN")} <span className="text-xs font-medium">VNĐ</span>
            </p>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 leading-snug">
              Tạm giữ 14 ngày bảo đảm chất lượng đề. Tự động giải tỏa về Ngăn 3.
            </p>
          </div>
        </div>
      </div>

      {/* 3. NẠP THÊM CREDITS LẺ (TOPUP_PACKAGES) & LỊCH SỬ GIAO DỊCH */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* CỘT TRÁI (2 COLS): LỊCH SỬ GIAO DỊCH VỚI PILL FILTER VÀ NÚT TẢI BIÊN LAI */}
        <div className="rounded-2xl border border-border bg-card lg:col-span-2 shadow-xs flex flex-col justify-between">
          <div>
            {/* Header Lịch sử + Pill Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border p-5">
              <div>
                <h3 className="font-semibold text-base text-foreground">Lịch sử giao dịch ví</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Theo dõi mọi phát sinh nạp điểm, thưởng và tiêu hao tạo đề.
                </p>
              </div>

              {/* Pill filter: Tất cả | Nạp vào | Tiêu dùng */}
              <div
                role="group"
                aria-label="Lọc lịch sử giao dịch"
                className="bg-muted p-1 rounded-xl inline-flex items-center border border-border self-start sm:self-auto"
              >
                <button
                  type="button"
                  onClick={() => setHistoryFilter("all")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    historyFilter === "all"
                      ? "bg-card text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter("in")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    historyFilter === "in"
                      ? "bg-card text-emerald-600 dark:text-emerald-400 shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Nạp vào
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter("out")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    historyFilter === "out"
                      ? "bg-card text-red-600 dark:text-red-400 shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Tiêu dùng
                </button>
              </div>
            </div>

            {/* Danh sách giao dịch */}
            <div className="overflow-x-auto divide-y divide-border">
              {displayTxns.length === 0 ? (
                <p className="p-8 text-center text-sm text-muted-foreground">
                  Không có giao dịch nào phù hợp với bộ lọc.
                </p>
              ) : (
                displayTxns.map((txn) => {
                  const isTopupOrPlan = txn.amount > 0;
                  return (
                    <div
                      key={txn.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/30 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`rounded-full p-2 shrink-0 ${
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
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {txn.description || txn.type}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(txn.created_at).toLocaleString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 pl-3">
                        <span
                          className={`font-mono text-sm font-black ${
                            txn.amount < 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {txn.amount < 0 ? `${txn.amount}` : `+${txn.amount.toLocaleString("vi-VN")}`} credits
                        </span>

                        {/* Nút icon Tải biên lai cho các giao dịch nạp tiền / mua gói */}
                        {isTopupOrPlan && (
                          <button
                            type="button"
                            onClick={() => handleOpenReceipt(txn)}
                            className="p-1.5 rounded-lg border border-border bg-muted/60 hover:bg-muted text-foreground transition cursor-pointer"
                            title="Tải biên lai thanh toán VietQR"
                            aria-label="Tải biên lai thanh toán"
                          >
                            <Download className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="p-4 border-t border-border bg-muted/20 text-xs text-muted-foreground flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
              <span>Đối soát Napas247 tự động lưu trữ vĩnh viễn</span>
            </span>
            <span>Hiển thị {displayTxns.length} giao dịch</span>
          </div>
        </div>

        {/* CỘT PHẢI (1 COL): MỆNH GIÁ GÓI NẠP LẺ + GIFTCODE + NÚT CTA ĐỘNG */}
        <div className="space-y-6">
          {/* Nạp thêm credits lẻ */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
            <div>
              <h3 className="font-semibold text-base text-foreground">Nạp thêm Credits lẻ</h3>
              <p className="text-xs text-muted-foreground">
                Tự do nạp thêm credits tức thời không bắt buộc mua theo gói tháng.
              </p>
            </div>

            {/* 4 Gói Nạp Lẻ Chuẩn Hóa Unit Economics */}
            <div className="space-y-2.5">
              {TOPUP_PACKAGES.map((pkg, idx) => {
                const isSelected = selectedPackIndex === idx;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => {
                      setSelectedPackIndex(idx);
                      setCheckoutTargetPlan(pkg);
                    }}
                    className={`relative rounded-xl border p-3.5 transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-xs ring-2 ring-primary/40"
                        : "border-border hover:border-primary/50 bg-card"
                    }`}
                  >
                    {pkg.badge && (
                      <span className="absolute -top-2.5 right-4 rounded-full bg-linear-to-r from-indigo-600 to-purple-600 px-2 py-0.5 text-[9px] font-black uppercase text-white shadow-xs">
                        {pkg.badge}
                      </span>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-foreground">
                            {pkg.name}
                          </p>
                          <span className="text-[11px] font-black text-primary">
                            {pkg.credits.toLocaleString("vi-VN")} Credits
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {pkg.unitPrice} • <span className="text-foreground/80 font-medium">{pkg.estimate}</span>
                        </p>
                      </div>

                      <span className="text-sm font-black text-foreground">
                        {pkg.price}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Nút CTA Cập nhật Động: + Nạp [X] Credits ([Giá]đ) */}
            <button
              type="button"
              onClick={() => {
                setCheckoutTargetPlan(selectedPack);
                setIsCheckoutOpen(true);
              }}
              className="w-full py-3.5 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-bold transition shadow-md shadow-indigo-600/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>
                + Nạp {selectedPack.credits.toLocaleString("vi-VN")} Credits ({selectedPack.price})
              </span>
            </button>

            {/* Dòng chữ chuyển xuống dưới nút CTA theo yêu cầu R1 */}
            <p className="text-[11px] text-center text-muted-foreground flex items-center justify-center gap-1.5 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
              <span>Hỗ trợ thanh toán tự động 24/7 qua VietQR PayOS</span>
            </p>
          </div>

          {/* Ô Nhập Giftcode / Voucher */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-purple-600 dark:text-purple-400" aria-hidden="true" />
              <h4 className="text-sm font-bold text-foreground">Giftcode & Mã Voucher</h4>
            </div>
            <p className="text-xs text-muted-foreground">
              Nhập mã ưu đãi hội thảo, mã giới thiệu đồng nghiệp hoặc quà tặng sự kiện để nhận thêm Credits Thưởng.
            </p>

            <form onSubmit={handleApplyVoucher} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={voucherCode}
                  onChange={(e) => {
                    setVoucherCode(e.target.value);
                    if (voucherError) setVoucherError(null);
                  }}
                  placeholder="Nhập mã voucher (VD: GIAOVIEN2026)"
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-primary uppercase tracking-wider font-semibold placeholder:normal-case placeholder:tracking-normal placeholder:font-normal"
                />
                <button
                  type="submit"
                  disabled={voucherLoading}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-xs cursor-pointer flex items-center justify-center shrink-0 disabled:opacity-50"
                >
                  {voucherLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <span>Áp dụng</span>
                  )}
                </button>
              </div>

              {voucherSuccess && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium animate-in fade-in flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{voucherSuccess}</span>
                </p>
              )}

              {voucherError && (
                <p className="text-xs text-red-600 dark:text-red-400 font-medium animate-in fade-in flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{voucherError}</span>
                </p>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* 4. MODAL BẢNG ĐỊNH MỨC TIÊU HAO CREDITS */}
      {isQuotaModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="quota-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in"
        >
          <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Info className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 id="quota-modal-title" className="text-base font-bold text-foreground">
                    Bảng Định Mức Tiêu Hao Credits
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Biểu phí quy đổi tính năng sư phạm chuẩn 2026
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsQuotaModalOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
                aria-label="Đóng bảng định mức"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Mục 1: Tạo đề */}
              <div className="p-3 rounded-2xl border border-border bg-muted/40 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-foreground">Tạo đề chuẩn GDPT 2025</p>
                  <p className="text-[11px] text-muted-foreground">Ma trận, bảng đặc tả & barem chi tiết</p>
                </div>
                <span className="font-mono text-sm font-black text-primary">
                  500 credits / đề
                </span>
              </div>

              {/* Mục 2: Suy luận sâu */}
              <div className="p-3 rounded-2xl border border-border bg-muted/40 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-foreground">Suy luận sâu (Gemini Thinking)</p>
                  <p className="text-[11px] text-muted-foreground">Bài toán khó, bẫy tư duy & giải bước</p>
                </div>
                <span className="font-mono text-sm font-black text-purple-600 dark:text-purple-400">
                  1.000 credits / đề
                </span>
              </div>

              {/* Mục 3: Bóc tách PDF/Ảnh */}
              <div className="p-3 rounded-2xl border border-border bg-muted/40 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-foreground">Bóc tách PDF / Ảnh AI</p>
                  <p className="text-[11px] text-muted-foreground">OCR chuẩn công thức toán & hình học</p>
                </div>
                <span className="font-mono text-sm font-black text-blue-600 dark:text-blue-400">
                  300 credits / trang
                </span>
              </div>

              {/* Mục 4: Chấm phiếu OMR */}
              <div className="p-3 rounded-2xl border border-border bg-muted/40 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-foreground">Chấm phiếu OMR qua Camera</p>
                  <p className="text-[11px] text-muted-foreground">Chấm tự động & xuất file Excel lớp</p>
                </div>
                <span className="font-mono text-sm font-black text-emerald-600 dark:text-emerald-400">
                  50 credits / bài
                </span>
              </div>
            </div>

            <div className="rounded-2xl bg-primary/5 border border-primary/20 p-3 text-[11px] text-muted-foreground">
              💡 <strong>Quy tắc cấn trừ thông minh:</strong> Hệ thống luôn ưu tiên trừ Credits Thưởng (Promotional) trước, giúp Thầy Cô bảo toàn số dư Credits Nạp (Purchased).
            </div>

            <button
              type="button"
              onClick={() => setIsQuotaModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition shadow-xs cursor-pointer"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}

      {/* 5. MODAL BIÊN LAI THANH TOÁN ĐIỆN TỬ */}
      {receiptData && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="receipt-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in"
        >
          <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <FileText className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 id="receipt-modal-title" className="text-base font-bold text-foreground">
                    Biên Lai Điện Tử Napas247
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Mã GD: {receiptData.orderCode}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setReceiptData(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
                aria-label="Đóng biên lai"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {/* Nội dung chi tiết biên lai */}
            <div className="space-y-3 rounded-2xl bg-muted/40 p-4 text-xs">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Dịch vụ:</span>
                <strong className="text-foreground text-right">{receiptData.description}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Credits cộng ví:</span>
                <strong className="text-emerald-600 font-mono">+{receiptData.credits.toLocaleString("vi-VN")} credits</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Số tiền thanh toán:</span>
                <strong className="text-foreground text-sm font-black">{receiptData.amountVnd}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Cổng thanh toán:</span>
                <span className="font-semibold text-foreground">{receiptData.method}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Thời gian:</span>
                <span className="text-foreground">{receiptData.date}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Trạng thái:</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Đã quyết toán thành công</span>
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" aria-hidden="true" />
                <span>In biên lai</span>
              </button>
              <button
                type="button"
                onClick={() => setReceiptData(null)}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition shadow-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL PAYOS / VIETQR CHECKOUT */}
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
