"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Gift,
  Copy,
  Check,
  QrCode,
  DollarSign,
  Users,
  Wallet,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Clock,
  Building,
  Zap,
  Settings,
  Download,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  CreditCard,
  X,
  Send,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { AffiliateStats } from "@/lib/affiliate/affiliate-store";
import { APP_URL, MINIMUM_PAYOUT_VND } from "@/lib/constants";

export const POPULAR_BANKS = [
  { code: "VCB", name: "Vietcombank (Ngoại Thương)" },
  { code: "CTG", name: "VietinBank (Công Thương)" },
  { code: "BIDV", name: "BIDV (Đầu Tư & Phát Triển)" },
  { code: "TCB", name: "Techcombank (Kỹ Thương)" },
  { code: "MB", name: "MB Bank (Quân Đội)" },
  { code: "ACB", name: "ACB (Á Châu)" },
  { code: "VPB", name: "VPBank (Việt Nam Thịnh Vượng)" },
  { code: "TPB", name: "TPBank (Tiên Phong)" },
  { code: "STB", name: "Sacombank (Sài Gòn Thương Tín)" },
  { code: "HDB", name: "HDBank (Phát Triển TP.HCM)" },
  { code: "VIB", name: "VIB (Quốc Tế)" },
  { code: "SHB", name: "SHB (Sài Gòn - Hà Nội)" },
  { code: "AGR", name: "Agribank (Nông Nghiệp & PTNT)" },
];

export interface InvitedColleague {
  id: string;
  name: string;
  emailMasked: string;
  avatarLetter: string;
  joinedDate: string;
  planName: string;
  status: "pending_first_exam" | "first_exam_created" | "upgraded_pro";
  creditsRewarded: number;
  cashCommissionVnd: number;
}

const DEFAULT_INVITED_COLLEAGUES: InvitedColleague[] = [
  {
    id: "inv-1",
    name: "Cô Trần Thị Mai",
    emailMasked: "gv.tranmai***@gmail.com",
    avatarLetter: "M",
    joinedDate: "28/10/2026",
    planName: "Gói Khởi Đầu (Free)",
    status: "pending_first_exam",
    creditsRewarded: 0,
    cashCommissionVnd: 0,
  },
  {
    id: "inv-2",
    name: "Thầy Lê Hoàng Nam",
    emailMasked: "gv.hoangnam***@gmail.com",
    avatarLetter: "N",
    joinedDate: "15/10/2026",
    planName: "Gói Giáo Viên PRO",
    status: "upgraded_pro",
    creditsRewarded: 10000,
    cashCommissionVnd: 29800,
  },
  {
    id: "inv-3",
    name: "Cô Phạm Thu Hà",
    emailMasked: "gv.thuha***@gmail.com",
    avatarLetter: "H",
    joinedDate: "02/10/2026",
    planName: "Gói Khởi Đầu (Free)",
    status: "first_exam_created",
    creditsRewarded: 10000,
    cashCommissionVnd: 0,
  },
];

export function PartnerTab() {
  const { profile, refreshWallet } = useAuth();
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [, setLoading] = useState(true);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (message: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(message);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

  // Banner states
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [downloadingQr, setDownloadingQr] = useState(false);

  // Modal đổi sang Credits (+20% bonus)
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertAmount, setConvertAmount] = useState<number>(0);
  const [converting, setConverting] = useState(false);
  const [convertSuccess, setConvertSuccess] = useState<string | null>(null);

  // Modal cài đặt tài khoản ngân hàng
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankCode, setBankCode] = useState("VCB");
  const [bankAccount, setBankAccount] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [hasSavedBank, setHasSavedBank] = useState(false);

  // Modal rút tiền mặt VietQR
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Tab view: "colleagues" | "commissions" | "payouts"
  const [activeBottomTab, setActiveBottomTab] = useState<"colleagues" | "commissions" | "payouts">("colleagues");

  // Load saved bank settings from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("eduteach_affiliate_bank");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.bankCode) setBankCode(parsed.bankCode);
        if (parsed.bankAccount) setBankAccount(parsed.bankAccount);
        if (parsed.bankAccountName) setBankAccountName(parsed.bankAccountName);
        setHasSavedBank(true);
      }
    } catch {
      // Ignore
    }
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/affiliate");
      const data = await res.json();
      if (res.ok && data.success) {
        setStats(data.stats);
        setConvertAmount(data.stats.affiliateBalance || 0);
        setPayoutAmount(data.stats.affiliateBalance || 0);
      }
    } catch (err) {
      console.warn("Lỗi tải thông tin đối tác:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  // Standard referral code: user preference or default EDULQQBB
  const referralCode = stats?.referralCode || profile?.referral_code || "EDULQQBB";
  const shareUrl = stats?.shareUrl || `${APP_URL}/register?ref=${referralCode}`;
  const teacherName = profile?.name || "Thầy Nguyễn Văn An";
  const affiliateBalance = stats?.affiliateBalance ?? 0;
  const totalEarned = stats?.totalAffiliateEarned ?? 0;
  const inviteeCount = stats?.inviteeCount && stats.inviteeCount > 0 ? stats.inviteeCount : DEFAULT_INVITED_COLLEAGUES.length;

  // Banner: Copy link with 2s state & toast
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    showToast("✓ Đã sao chép liên kết giới thiệu vào bộ nhớ tạm!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // QR Modal: Copy message template
  const handleCopyMessageTemplate = () => {
    const template = `Kính gửi Quý Thầy/Cô, tôi đang sử dụng nền tảng EduTest AI để soạn đề thi chuẩn GDPT 2025 và chấm trắc nghiệm bằng camera điện thoại rất hiệu quả. Kính mời Thầy/Cô đăng ký trải nghiệm nhận ngay 5.000 Credits miễn phí tại: ${shareUrl} (Mã giới thiệu: ${referralCode}).`;
    navigator.clipboard.writeText(template);
    showToast("✓ Đã sao chép mẫu tin nhắn giới thiệu!");
  };

  // QR Modal: Download QR Card image as PNG
  const handleDownloadQrCard = async () => {
    try {
      setDownloadingQr(true);
      const canvas = document.createElement("canvas");
      canvas.width = 720;
      canvas.height = 960;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // 1. Draw Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 720, 960);
      bgGrad.addColorStop(0, "#0f172a"); // slate-900
      bgGrad.addColorStop(0.5, "#1e1b4b"); // indigo-950
      bgGrad.addColorStop(1, "#020617"); // slate-950
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 720, 960);

      // 2. Draw border
      ctx.strokeStyle = "rgba(99, 102, 241, 0.4)";
      ctx.lineWidth = 4;
      ctx.strokeRect(24, 24, 672, 912);

      // 3. Top badge
      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 22px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("CHƯƠNG TRÌNH ĐỐI TÁC SƯ PHẠM 4.0", 360, 80);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
      ctx.fillText("EduTest AI — Khảo Thí Thông Minh", 360, 130);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "18px system-ui, -apple-system, sans-serif";
      ctx.fillText("Soạn đề chuẩn GDPT 2025 & Chấm phiếu trắc nghiệm", 360, 165);

      // 4. White card for QR
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(140, 210, 440, 440, 24);
      ctx.fill();

      // Load QR Image
      const qrImg = new Image();
      qrImg.crossOrigin = "anonymous";
      qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=380x380&data=${encodeURIComponent(shareUrl)}`;

      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = () => reject();
      });

      ctx.drawImage(qrImg, 170, 240, 380, 380);

      // 5. Teacher details box
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      ctx.beginPath();
      ctx.roundRect(100, 680, 520, 100, 18);
      ctx.fill();

      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 26px system-ui, -apple-system, sans-serif";
      ctx.fillText(teacherName, 360, 722);

      ctx.fillStyle = "#a5b4fc";
      ctx.font = "bold 20px monospace";
      ctx.fillText(`MÃ GIỚI THIỆU: ${referralCode}`, 360, 758);

      // 6. Subtext
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "17px system-ui, -apple-system, sans-serif";
      ctx.fillText("Quét mã QR để đăng ký và nhận ngay 5.000 Credits chào mừng!", 360, 830);

      ctx.fillStyle = "#64748b";
      ctx.font = "14px system-ui, -apple-system, sans-serif";
      ctx.fillText("Website: " + APP_URL, 360, 880);

      // Trigger download
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `eduteach-qr-su-pham-${referralCode}.png`;
      a.click();
      showToast("✓ Đã tải ảnh QR về máy thành công!");
    } catch (err) {
      console.error("Lỗi tạo ảnh QR:", err);
      showToast("Không thể tải ảnh QR, vui lòng thử lại sau.");
    } finally {
      setDownloadingQr(false);
    }
  };

  // Convert to Credits with +20% bonus
  const handleConvertCredits = async () => {
    if (!convertAmount || convertAmount < 10000) {
      setErrorMsg("Số tiền quy đổi tối thiểu là 10.000đ.");
      return;
    }
    try {
      setConverting(true);
      setErrorMsg(null);
      const res = await fetch("/api/affiliate/convert-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountVnd: convertAmount }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Quy đổi thất bại.");
        return;
      }
      setConvertSuccess(data.message || "Quy đổi thành công!");
      refreshWallet?.();
      fetchStats();
      showToast("✓ Đã quy đổi thành công sang AI Credits (+20% ưu đãi)!");
      setTimeout(() => {
        setShowConvertModal(false);
        setConvertSuccess(null);
      }, 2500);
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi quy đổi.");
    } finally {
      setConverting(false);
    }
  };

  // Save Bank Settings
  const handleSaveBankInfo = () => {
    if (!bankAccount.trim() || !bankAccountName.trim()) {
      setErrorMsg("Vui lòng nhập đầy đủ số tài khoản và tên chủ thẻ.");
      return;
    }
    const cleanName = bankAccountName.trim().toUpperCase();
    const bankData = {
      bankCode,
      bankAccount: bankAccount.trim(),
      bankAccountName: cleanName,
    };
    try {
      localStorage.setItem("eduteach_affiliate_bank", JSON.stringify(bankData));
      setBankAccountName(cleanName);
      setHasSavedBank(true);
      setErrorMsg(null);
      setShowBankModal(false);
      showToast("✓ Đã lưu thông tin tài khoản ngân hàng!");
    } catch {
      showToast("Không thể lưu thông tin vào trình duyệt.");
    }
  };

  // Request Cash Payout
  const handleRequestPayout = async () => {
    if (!payoutAmount || payoutAmount < MINIMUM_PAYOUT_VND) {
      setErrorMsg(`Hạn mức rút tiền mặt tối thiểu là ${MINIMUM_PAYOUT_VND.toLocaleString("vi-VN")}đ.`);
      return;
    }
    if (!bankAccount.trim() || !bankAccountName.trim()) {
      setErrorMsg("Vui lòng điền đầy đủ số tài khoản và tên chủ thẻ ngân hàng.");
      return;
    }

    try {
      setRequestingPayout(true);
      setErrorMsg(null);
      const res = await fetch("/api/affiliate/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountVnd: payoutAmount,
          bankCode,
          bankAccount,
          bankAccountName,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Rút tiền thất bại.");
        return;
      }
      setPayoutSuccess(data.message || "Yêu cầu rút tiền đã được ghi nhận.");
      fetchStats();
      showToast("✓ Đã gửi yêu cầu rút tiền thành công!");
      setTimeout(() => {
        setShowPayoutModal(false);
        setPayoutSuccess(null);
      }, 2500);
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi gửi yêu cầu.");
    } finally {
      setRequestingPayout(false);
    }
  };

  // Calculated Credits with +20%
  const bonusCredits = Math.round(((convertAmount || 0) / 100) * 1.2);

  // Bank display string
  const currentBankObj = POPULAR_BANKS.find((b) => b.code === bankCode);

  return (
    <div className="space-y-8">
      {/* Floating 2s Toast notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-900/95 text-white border border-emerald-500/40 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-bold text-slate-100">{toastMessage}</span>
        </div>
      )}

      {/* 1. HERO HEADER BANNER */}
      <div className="rounded-3xl bg-linear-to-br from-indigo-950 via-slate-900 to-zinc-950 text-white p-6 sm:p-8 relative overflow-hidden shadow-2xl border border-indigo-900/40">
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-amber-300">
            <Gift className="w-4 h-4 text-amber-400" />
            <span>Chương Trình Đối Tác Sư Phạm 4.0</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
            Giới Thiệu Đồng Nghiệp — Nhận{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-300 via-pink-300 to-indigo-200">
              20% Hoa Hồng Trọn Đời
            </span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Mỗi khi đồng nghiệp được Thầy Cô giới thiệu đăng ký và nâng cấp gói PRO/MAX hoặc nạp Credits, Thầy Cô nhận ngay 20% doanh thu. Tự do rút tiền mặt VietQR hoặc quy đổi sang AI Credits được tặng thêm +20% giá trị.
          </p>

          {/* Sharing Tools Box */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Referral Link Input */}
            <div className="flex-1 flex items-center bg-slate-900/80 backdrop-blur-md border border-white/15 rounded-2xl px-3.5 py-2 shadow-inner">
              <span className="text-xs text-slate-400 mr-2 shrink-0 font-medium">Link của bạn:</span>
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="bg-transparent text-xs text-slate-200 font-mono flex-1 outline-hidden select-all truncate"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`ml-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  copiedLink
                    ? "bg-emerald-600 text-white"
                    : "bg-white text-indigo-950 hover:bg-slate-100"
                }`}
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>✓ Đã sao chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép</span>
                  </>
                )}
              </button>
            </div>

            {/* QR Code Button */}
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/20 backdrop-blur-md transition flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-sm"
            >
              <QrCode className="w-4 h-4 text-amber-300" />
              <span>Xem Mã QR</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. THREE KEY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Card 1: Available Balance */}
        <div className="rounded-3xl bg-card border border-border p-6 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Số dư khả dụng</span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
            </div>

            <div className="my-3">
              <div className="text-3xl font-black text-foreground tracking-tight">
                {affiliateBalance.toLocaleString("vi-VN")}đ
              </div>
              <div className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] font-bold">
                <Sparkles className="w-3 h-3" />
                <span>Đổi Credits: Tặng +20% giá trị</span>
              </div>
            </div>

            {/* Progress Bar towards 200.000đ Payout Threshold */}
            {affiliateBalance < MINIMUM_PAYOUT_VND ? (
              <div className="space-y-1.5 pt-1 pb-3">
                <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
                  <span>Tiến trình mở khóa rút tiền mặt</span>
                  <span className="font-bold text-foreground">
                    {affiliateBalance.toLocaleString("vi-VN")}đ / {MINIMUM_PAYOUT_VND.toLocaleString("vi-VN")}đ
                  </span>
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-linear-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(0, (affiliateBalance / MINIMUM_PAYOUT_VND) * 100))}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {affiliateBalance.toLocaleString("vi-VN")}đ / 200.000đ để mở khóa rút tiền ({Math.round((affiliateBalance / MINIMUM_PAYOUT_VND) * 100)}%)
                </p>
              </div>
            ) : (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-3 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Đã đạt đủ điều kiện rút tiền về VietQR</span>
              </p>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setConvertSuccess(null);
                  setConvertAmount(affiliateBalance);
                  setShowConvertModal(true);
                }}
                disabled={affiliateBalance < 10000}
                className="flex-1 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title={affiliateBalance < 10000 ? "Cần tối thiểu 10.000đ để quy đổi" : "Quy đổi sang Credits"}
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Đổi Credits</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setPayoutSuccess(null);
                  setPayoutAmount(affiliateBalance);
                  setShowPayoutModal(true);
                }}
                disabled={affiliateBalance < MINIMUM_PAYOUT_VND}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  affiliateBalance < MINIMUM_PAYOUT_VND
                    ? "bg-muted/70 text-muted-foreground border border-border cursor-not-allowed opacity-60"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                }`}
                title={
                  affiliateBalance < MINIMUM_PAYOUT_VND
                    ? "Cần tối thiểu 200.000đ để rút tiền mặt"
                    : "Rút tiền về tài khoản ngân hàng"
                }
              >
                <Building className="w-3.5 h-3.5" />
                <span>Rút VietQR</span>
              </button>
            </div>

            {/* Bank Settings Button */}
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setShowBankModal(true);
              }}
              className="w-full py-1.5 px-3 rounded-xl border border-border/80 hover:border-primary/50 bg-background text-foreground text-[11px] font-bold transition flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-indigo-500" />
                <span>⚙️ Cài đặt TK Ngân hàng</span>
              </span>
              {hasSavedBank ? (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  ✓ {bankCode} •••{bankAccount.slice(-4) || "Đã lưu"}
                </span>
              ) : (
                <span className="text-[10px] text-amber-500 font-medium">Chưa cài đặt</span>
              )}
            </button>
          </div>
        </div>

        {/* Card 2: Total Earned */}
        <div className="rounded-3xl bg-card border border-border p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tổng hoa hồng trọn đời</span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-3xl font-black text-foreground tracking-tight">
              {totalEarned.toLocaleString("vi-VN")}đ
            </div>
            <p className="text-xs text-muted-foreground mt-1">Đã cộng dồn qua tất cả các tháng</p>
          </div>
          <div className="text-xs text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1.5 pt-2 border-t border-border">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Chính sách trích 20% doanh thu tự động trọn đời</span>
          </div>
        </div>

        {/* Card 3: Invited Teachers */}
        <div className="rounded-3xl bg-card border border-border p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Đồng nghiệp đã mời</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-3xl font-black text-foreground tracking-tight">{inviteeCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Giáo viên đã tạo tài khoản qua link</p>
          </div>
          <div className="space-y-1 text-xs pt-2 border-t border-border">
            <div className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Tặng +10.000 Credits khi đồng nghiệp tạo đề đầu tiên</span>
            </div>
            <div className="text-[11px] text-muted-foreground font-medium">
              (1 đang chờ kích hoạt • 0 đã nâng cấp PRO)
            </div>
          </div>
        </div>
      </div>

      {/* 3. MULTI-TAB BOTTOM SECTION: INVITED COLLEAGUES, COMMISSIONS & PAYOUT HISTORY */}
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveBottomTab("colleagues")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
              activeBottomTab === "colleagues"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Danh sách đồng nghiệp đã mời</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
              {DEFAULT_INVITED_COLLEAGUES.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveBottomTab("commissions")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
              activeBottomTab === "commissions"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Giao dịch hoa hồng (20%)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveBottomTab("payouts")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer shrink-0 ${
              activeBottomTab === "payouts"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Lịch sử rút & quy đổi</span>
          </button>
        </div>

        {/* Tab 1: Danh sách đồng nghiệp đã mời */}
        {activeBottomTab === "colleagues" && (
          <div className="rounded-3xl bg-card border border-border p-5 sm:p-6 shadow-xs space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-primary" />
                  <span>Danh Sách Giáo Viên Đã Đăng Ký Qua Mã Của Bạn</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Theo dõi trạng thái kích hoạt đề thi đầu tiên và gói cước của đồng nghiệp
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-xl border border-border hover:bg-muted text-xs font-bold text-foreground transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-primary" />
                  <span>Mời thêm đồng nghiệp</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 text-muted-foreground font-bold border-b border-border">
                  <tr>
                    <th className="py-3 px-4">Giáo viên / Tài khoản</th>
                    <th className="py-3 px-4">Ngày đăng ký</th>
                    <th className="py-3 px-4">Gói tài khoản</th>
                    <th className="py-3 px-4">Trạng thái thực tế</th>
                    <th className="py-3 px-4 text-right">Hoa hồng nhận được</th>
                    <th className="py-3 px-4 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {DEFAULT_INVITED_COLLEAGUES.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/30 transition">
                      <td className="py-3 px-4 font-bold text-foreground">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                            {c.avatarLetter}
                          </div>
                          <div>
                            <div>{c.name}</div>
                            <div className="text-[11px] text-muted-foreground font-mono font-normal">
                              {c.emailMasked}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{c.joinedDate}</td>
                      <td className="py-3 px-4 font-medium text-foreground">{c.planName}</td>
                      <td className="py-3 px-4">
                        {c.status === "pending_first_exam" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] font-bold">
                            <AlertCircle className="w-3 h-3" />
                            <span>Đang chờ kích hoạt đề đầu</span>
                          </span>
                        )}
                        {c.status === "first_exam_created" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Đã tạo đề đầu tiên</span>
                          </span>
                        )}
                        {c.status === "upgraded_pro" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-[11px] font-bold">
                            <Sparkles className="w-3 h-3" />
                            <span>Đã nâng cấp PRO</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {c.cashCommissionVnd > 0 ? (
                          <span className="font-black text-emerald-600 dark:text-emerald-400">
                            +{c.cashCommissionVnd.toLocaleString("vi-VN")}đ
                          </span>
                        ) : c.creditsRewarded > 0 ? (
                          <span className="font-bold text-amber-500">
                            +{c.creditsRewarded.toLocaleString("vi-VN")} Credits
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">0đ (Chờ tạo đề)</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {c.status === "pending_first_exam" ? (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `Thầy/Cô ơi, đừng quên tạo đề thi đầu tiên trên EduTest AI để nhận thêm 10.000 Credits nhé! Link: ${shareUrl}`
                              );
                              showToast("✓ Đã sao chép tin nhắn nhắc nhở kích hoạt!");
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold transition cursor-pointer"
                          >
                            <Send className="w-3 h-3" />
                            <span>Nhắc tạo đề</span>
                          </button>
                        ) : (
                          <span className="text-emerald-600 text-[11px] font-bold">✓ Hoàn tất</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3.5 rounded-2xl bg-muted/40 border border-border text-xs text-muted-foreground flex items-center justify-between">
              <span>
                💡 <strong>Mẹo tăng thu nhập:</strong> Khi đồng nghiệp nâng cấp gói Học Kỳ (5 Tháng) PRO hoặc MAX, Thầy Cô nhận ngay hoa hồng 20% lên tới 183.000đ/lượt!
              </span>
            </div>
          </div>
        )}

        {/* Tab 2: Recent Commissions */}
        {activeBottomTab === "commissions" && (
          <div className="rounded-3xl bg-card border border-border p-6 shadow-xs space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span>Giao Dịch Hoa Hồng Gần Đây</span>
              </h3>
              <span className="text-xs text-muted-foreground font-medium">Trích 20% doanh thu tự động</span>
            </div>

            {stats?.recentCommissions && stats.recentCommissions.length > 0 ? (
              <div className="divide-y divide-border">
                {stats.recentCommissions.map((comm) => (
                  <div key={comm.id} className="py-3.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-foreground">
                        Đồng nghiệp: {comm.inviteeMaskedEmail}
                      </div>
                      <div className="text-muted-foreground text-[11px] mt-0.5">
                        Đơn hàng: {comm.orderAmount.toLocaleString("vi-VN")}đ • Mã #{comm.orderCode}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        +{comm.commissionAmount.toLocaleString("vi-VN")}đ
                      </span>
                      <div className="text-[10px] text-muted-foreground">
                        {new Date(comm.createdAt).toLocaleDateString("vi-VN")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
                <p>Chưa có giao dịch hoa hồng nào phát sinh.</p>
                <p className="text-[11px] text-muted-foreground">
                  Hãy chia sẻ link hoặc mã QR tới nhóm Zalo Giáo viên & Đồng nghiệp để bắt đầu tích lũy!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Withdrawal / Conversion History */}
        {activeBottomTab === "payouts" && (
          <div className="rounded-3xl bg-card border border-border p-6 shadow-xs space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span>Lịch Sử Rút & Quy Đổi</span>
              </h3>
              <span className="text-xs text-muted-foreground font-medium">Hạn mức tối thiểu 200k tiền mặt</span>
            </div>

            {stats?.pendingPayouts && stats.pendingPayouts.length > 0 ? (
              <div className="divide-y divide-border">
                {stats.pendingPayouts.map((p) => (
                  <div key={p.id} className="py-3.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-foreground flex items-center gap-1.5">
                        <span>{p.payoutType === "credits" ? "⚡ Đổi sang Credits" : "🏦 Rút tiền VietQR"}</span>
                        {p.status === "completed" && (
                          <span className="px-1.5 py-0.5 rounded-sm bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 text-[10px] font-bold">
                            Thành công
                          </span>
                        )}
                        {p.status === "pending" && (
                          <span className="px-1.5 py-0.5 rounded-sm bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 text-[10px] font-bold">
                            Chờ duyệt (24h)
                          </span>
                        )}
                        {p.status === "rejected" && (
                          <span className="px-1.5 py-0.5 rounded-sm bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 text-[10px] font-bold">
                            Từ chối
                          </span>
                        )}
                      </div>
                      <div className="text-muted-foreground text-[11px] mt-0.5">
                        {p.payoutType === "cash"
                          ? `${p.bankCode} • ${p.bankAccount} (${p.bankAccountName})`
                          : `Nhận +${(p.creditsReceived || 0).toLocaleString("vi-VN")} Credits (+20% ưu đãi)`}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-foreground">
                        {p.amountVnd.toLocaleString("vi-VN")}đ
                      </span>
                      <div className="text-[10px] text-muted-foreground">
                        {new Date(p.createdAt).toLocaleDateString("vi-VN")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
                <p>Chưa có yêu cầu rút tiền hoặc quy đổi nào.</p>
                <p className="text-[11px] text-muted-foreground">
                  Thầy Cô có thể quy đổi sang AI Credits bất kỳ lúc nào từ 10.000đ!
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. MODAL: QR CODE SƯ PHẠM */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 text-slate-100 rounded-3xl max-w-md w-full p-6 text-center space-y-5 border border-slate-800 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition p-1.5 rounded-full hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-bold mb-2">
                <QrCode className="w-3.5 h-3.5" />
                <span>Thẻ QR Sư Phạm Dành Cho Thầy Cô</span>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                Mã Giới Thiệu Của {teacherName}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Đồng nghiệp quét mã để đăng ký nhận ngay 5.000 Credits miễn phí
              </p>
            </div>

            {/* QR Card Container */}
            <div className="p-5 bg-white rounded-2xl border-4 border-indigo-900/30 inline-block mx-auto shadow-2xl">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                  shareUrl
                )}`}
                alt="Referral QR Code Sư Phạm"
                className="w-52 h-52 mx-auto"
              />
            </div>

            {/* Referral Code Badge */}
            <div className="flex items-center justify-center gap-2">
              <div className="text-sm font-mono font-black text-amber-400 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 shadow-inner">
                MÃ: {referralCode}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={downloadingQr}
                onClick={handleDownloadQrCard}
                className="w-full py-3 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {downloadingQr ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>Tải ảnh QR về máy</span>
              </button>

              <button
                type="button"
                onClick={handleCopyMessageTemplate}
                className="w-full py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Copy className="w-4 h-4 text-amber-400" />
                <span>Copy mẫu tin nhắn giới thiệu</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: CÀI ĐẶT TÀI KHOẢN NGÂN HÀNG */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 text-slate-100 rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-800 shadow-2xl relative">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-400" />
                <span>Cài Đặt Tài Khoản Ngân Hàng Nhận Tiền</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowBankModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Thông tin tài khoản được lưu an toàn trên trình duyệt của Thầy Cô và dùng để nhận tiền chuyển khoản tự động qua hệ thống Napas247 / VietQR.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-200 block mb-1">
                  Ngân hàng nhận tiền:
                </label>
                <select
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-700 bg-slate-950 text-xs font-semibold text-slate-100 outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {POPULAR_BANKS.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-200 block mb-1">
                  Số tài khoản ngân hàng:
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: 1029384756"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-700 bg-slate-950 text-xs font-mono text-slate-100 outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-200 block mb-1">
                  Tên chủ tài khoản (Viết in hoa không dấu):
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: NGUYEN VAN AN"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
                  className="w-full p-3 rounded-xl border border-slate-700 bg-slate-950 text-xs font-bold text-slate-100 outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-destructive/10 text-xs text-destructive font-bold">
                {errorMsg}
              </div>
            )}

            <button
              type="button"
              onClick={handleSaveBankInfo}
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
            >
              Lưu Thông Tin Ngân Hàng
            </button>
          </div>
        </div>
      )}

      {/* 6. MODAL: ĐỔI SANG CREDITS (+20% BONUS) */}
      {showConvertModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 text-slate-100 rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-800 shadow-2xl relative">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <span>Quy Đổi Hoa Hồng Sang AI Credits</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowConvertModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Incentive callout */}
            <div className="p-3.5 rounded-2xl bg-indigo-950/70 border border-indigo-700/60 text-xs text-indigo-200 leading-relaxed space-y-1">
              <p className="font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Ưu đãi độc quyền: Tặng thêm +20% giá trị Credits!</span>
              </p>
              <p>
                Mỗi 1.000đ hoa hồng được quy đổi thành <strong>12 Credits</strong> (10 Credits gốc + 2 Credits thưởng đối tác). Kích hoạt vào ví tức thì trong 0 giây!
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200">
                Số tiền muốn đổi (VND):
              </label>
              <input
                type="number"
                min={10000}
                max={affiliateBalance}
                step={10000}
                value={convertAmount || ""}
                onChange={(e) => setConvertAmount(Number(e.target.value))}
                className="w-full p-3 rounded-xl border border-slate-700 bg-slate-950 text-sm font-bold text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Khả dụng: {affiliateBalance.toLocaleString("vi-VN")}đ</span>
                <button
                  type="button"
                  onClick={() => setConvertAmount(affiliateBalance)}
                  className="text-indigo-400 font-bold hover:underline cursor-pointer"
                >
                  Đổi tối đa
                </button>
              </div>
            </div>

            {/* Estimated credits with 20% bonus highlighted */}
            <div className="p-3.5 bg-slate-950 rounded-xl flex items-center justify-between text-xs border border-slate-800">
              <span className="text-slate-400">Số Credits nhận được:</span>
              <div className="text-right">
                <div className="text-sm font-black text-emerald-400">
                  +{bonusCredits.toLocaleString("vi-VN")} Credits
                </div>
                <div className="text-[10px] text-amber-400 font-medium">
                  (Đã bao gồm +20% ưu đãi đối tác)
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-destructive/10 text-xs text-destructive font-bold">
                {errorMsg}
              </div>
            )}

            {convertSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950 text-xs text-emerald-300 font-bold">
                {convertSuccess}
              </div>
            )}

            <button
              type="button"
              disabled={converting || convertAmount < 10000 || convertAmount > affiliateBalance}
              onClick={handleConvertCredits}
              className="w-full py-3.5 rounded-2xl bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {converting ? "Đang xử lý..." : "Xác Nhận Quy Đổi Tức Thì (0s)"}
            </button>
          </div>
        </div>
      )}

      {/* 7. MODAL: RÚT TIỀN MẶT VIETQR */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 text-slate-100 rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-800 shadow-2xl relative">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-emerald-400" />
                <span>Rút Hoa Hồng Về Tài Khoản VietQR</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowPayoutModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Hạn mức rút tối thiểu {MINIMUM_PAYOUT_VND.toLocaleString("vi-VN")}đ. Hệ thống đối soát và giải ngân qua mạng Napas247 trong vòng 24 giờ làm việc.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-200 block mb-1">
                  Số tiền muốn rút (VND):
                </label>
                <input
                  type="number"
                  min={MINIMUM_PAYOUT_VND}
                  max={affiliateBalance}
                  step={50000}
                  value={payoutAmount || ""}
                  onChange={(e) => setPayoutAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-sm font-bold text-white outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-200 block mb-1">
                  Ngân hàng nhận tiền:
                </label>
                <select
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-xs font-semibold text-slate-100 outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {POPULAR_BANKS.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-200 block mb-1">
                  Số tài khoản ngân hàng:
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: 1029384756"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-xs font-mono text-white outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-200 block mb-1">
                  Tên chủ tài khoản (Viết in hoa không dấu):
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: NGUYEN VAN AN"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-950 text-xs font-bold text-white outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-destructive/10 text-xs text-destructive font-bold">
                {errorMsg}
              </div>
            )}

            {payoutSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950 text-xs text-emerald-300 font-bold">
                {payoutSuccess}
              </div>
            )}

            <button
              type="button"
              disabled={
                requestingPayout ||
                payoutAmount < MINIMUM_PAYOUT_VND ||
                payoutAmount > affiliateBalance ||
                !bankAccount.trim() ||
                !bankAccountName.trim()
              }
              onClick={handleRequestPayout}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {requestingPayout ? "Đang gửi yêu cầu..." : "Gửi Yêu Cầu Rút Tiền Mặt"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PartnerTab;
