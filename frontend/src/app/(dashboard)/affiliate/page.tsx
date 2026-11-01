"use client";

import React, { useState, useEffect } from "react";
import {
  Gift,
  Copy,
  Check,
  QrCode,
  DollarSign,
  Users,
  Wallet,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Clock,
  Building,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Zap,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { AffiliateStats } from "@/lib/affiliate/affiliate-store";

const POPULAR_BANKS = [
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
];

export default function AffiliatePage() {
  const { profile, refreshWallet } = useAuth();
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Modal đổi sang Credits
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertAmount, setConvertAmount] = useState<number>(0);
  const [converting, setConverting] = useState(false);
  const [convertSuccess, setConvertSuccess] = useState<string | null>(null);

  // Modal rút tiền mặt VietQR
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [bankCode, setBankCode] = useState("VCB");
  const [bankAccount, setBankAccount] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
  }, []);

  const handleCopyLink = () => {
    if (!stats?.shareUrl) return;
    navigator.clipboard.writeText(stats.shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    if (!stats?.referralCode) return;
    navigator.clipboard.writeText(stats.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

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
      setConvertSuccess(data.message);
      refreshWallet?.();
      fetchStats();
      setTimeout(() => {
        setShowConvertModal(false);
        setConvertSuccess(null);
      }, 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi quy đổi.");
    } finally {
      setConverting(false);
    }
  };

  const handleRequestPayout = async () => {
    if (!payoutAmount || payoutAmount < 100000) {
      setErrorMsg("Hạn mức rút tiền mặt tối thiểu là 100.000đ.");
      return;
    }
    if (!bankAccount.trim() || !bankAccountName.trim()) {
      setErrorMsg("Vui lòng điền đầy đủ số tài khoản và tên chủ thẻ.");
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
      setPayoutSuccess(data.message);
      fetchStats();
      setTimeout(() => {
        setShowPayoutModal(false);
        setPayoutSuccess(null);
      }, 3500);
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi gửi yêu cầu.");
    } finally {
      setRequestingPayout(false);
    }
  };

  const referralCode = stats?.referralCode || profile?.referral_code || "EDUTESTVIP";
  const shareUrl = stats?.shareUrl || `https://edutest.ai/register?ref=${referralCode}`;
  const affiliateBalance = stats?.affiliateBalance ?? 0;
  const totalEarned = stats?.totalAffiliateEarned ?? 0;
  const inviteeCount = stats?.inviteeCount ?? 0;

  return (
    <div className="min-h-screen pb-16 pt-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* 1. HERO HEADER */}
      <div className="rounded-3xl bg-linear-to-br from-indigo-900 via-purple-900 to-slate-900 text-white p-6 sm:p-10 relative overflow-hidden shadow-xl">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-amber-300">
            <Gift className="w-4 h-4" />
            <span>Chương Trình Đối Tác Sư Phạm 4.0</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            Giới Thiệu Đồng Nghiệp — Nhận{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-amber-300 via-pink-300 to-indigo-200">
              20% Hoa Hồng Trọn Đời
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-2xl">
            Mỗi khi đồng nghiệp được Thầy Cô giới thiệu nâng cấp gói PRO/MAX hoặc mua Credits, Thầy Cô nhận ngay 20% doanh thu. Tự do rút tiền mặt VietQR hoặc nhân 1.5x quy đổi sang AI Credits.
          </p>

          {/* Sharing Tools Box */}
          <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Referral Link Input */}
            <div className="flex-1 flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-3.5 py-2">
              <span className="text-xs text-slate-300 mr-2 shrink-0 font-medium">Link của bạn:</span>
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="bg-transparent text-xs text-white font-mono flex-1 outline-hidden select-all truncate"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="ml-2 px-3 py-1.5 rounded-xl bg-white text-indigo-900 text-xs font-bold hover:bg-slate-100 transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Đã chép</span>
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
              className="px-4 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold border border-white/30 backdrop-blur-md transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
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
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Số dư khả dụng</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              {affiliateBalance.toLocaleString()}đ
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Sẵn sàng để rút hoặc quy đổi</p>
          </div>
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setConvertSuccess(null);
                setConvertAmount(affiliateBalance);
                setShowConvertModal(true);
              }}
              disabled={affiliateBalance < 10000}
              className="flex-1 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Đổi Credits (x1.5)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setPayoutSuccess(null);
                setPayoutAmount(affiliateBalance);
                setShowPayoutModal(true);
              }}
              disabled={affiliateBalance < 100000}
              className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer shadow-xs"
            >
              <Building className="w-3.5 h-3.5" />
              <span>Rút VietQR</span>
            </button>
          </div>
        </div>

        {/* Card 2: Total Earned */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tổng hoa hồng trọn đời</span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              {totalEarned.toLocaleString()}đ
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Đã cộng dồn qua tất cả các tháng</p>
          </div>
          <div className="text-xs text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Chính sách trích 20% tự động</span>
          </div>
        </div>

        {/* Card 3: Invited Teachers */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Đồng nghiệp đã mời</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-3xl font-black text-slate-900 dark:text-white">{inviteeCount}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Giáo viên đã tạo tài khoản</p>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Mỗi lượt mời tặng +10.000 Credits</span>
          </div>
        </div>
      </div>

      {/* 3. DUAL-COLUMN CONTENT: RECENT COMMISSIONS & PAYOUT HISTORY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Recent Commissions */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span>Giao Dịch Hoa Hồng Gần Đây</span>
            </h3>
            <span className="text-xs text-slate-500">20% doanh thu</span>
          </div>

          {stats?.recentCommissions && stats.recentCommissions.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {stats.recentCommissions.map((comm) => (
                <div key={comm.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      Đồng nghiệp: {comm.inviteeMaskedEmail}
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                      Đơn hàng: {comm.orderAmount.toLocaleString()}đ • Mã #{comm.orderCode}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      +{comm.commissionAmount.toLocaleString()}đ
                    </span>
                    <div className="text-[10px] text-slate-400">
                      {new Date(comm.createdAt).toLocaleDateString("vi-VN")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-xs text-slate-500 space-y-2">
              <p>Chưa có giao dịch hoa hồng nào.</p>
              <p className="text-[11px] text-slate-400">
                Hãy chia sẻ link giới thiệu tới các nhóm Giáo viên & Phụ huynh để bắt đầu tích lũy!
              </p>
            </div>
          )}
        </div>

        {/* Right: Withdrawal / Conversion History */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span>Lịch Sử Rút & Quy Đổi</span>
            </h3>
            <span className="text-xs text-slate-500">Min 100k tiền mặt</span>
          </div>

          {stats?.pendingPayouts && stats.pendingPayouts.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {stats.pendingPayouts.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{p.payoutType === "credits" ? "⚡ Đổi sang Credits (x1.5)" : "🏦 Rút tiền VietQR"}</span>
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
                    <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                      {p.payoutType === "cash"
                        ? `${p.bankCode} • ${p.bankAccount} (${p.bankAccountName})`
                        : `Nhận +${(p.creditsReceived || 0).toLocaleString()} Credits`}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {p.amountVnd.toLocaleString()}đ
                    </span>
                    <div className="text-[10px] text-slate-400">
                      {new Date(p.createdAt).toLocaleDateString("vi-VN")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-xs text-slate-500 space-y-2">
              <p>Chưa có yêu cầu rút tiền nào.</p>
              <p className="text-[11px] text-slate-400">
                Thầy Cô có thể quy đổi sang AI Credits ngay khi đạt từ 10.000đ!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 4. MODAL: XEM MÃ QR GIỚI THIỆU */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Mã QR Giới Thiệu Của Thầy Cô
            </h3>
            <p className="text-xs text-slate-500">
              Quét mã để mở trang đăng ký có gắn sẵn mã giới thiệu của Thầy Cô
            </p>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 inline-block mx-auto shadow-inner">
              {/* Standard QR Code SVG rendering via Google Chart or SVG */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  shareUrl
                )}`}
                alt="Referral QR Code"
                className="w-48 h-48 mx-auto"
              />
            </div>

            <div className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800">
              MÃ: {referralCode}
            </div>

            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold transition hover:opacity-90 cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* 5. MODAL: ĐỔI SANG CREDITS (x1.5) */}
      {showConvertModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <span>Quy Đổi Hoa Hồng Sang AI Credits</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowConvertModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-800 dark:text-indigo-200 leading-relaxed">
              🎉 <strong>Ưu đãi nhân 1.5x:</strong> Mỗi 1.000đ hoa hồng được quy đổi thành <strong>1.500 Credits</strong>. Kích hoạt vào ví ngay lập tức trong 0 giây!
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Số tiền muốn đổi (VND):
              </label>
              <input
                type="number"
                min={10000}
                max={affiliateBalance}
                step={10000}
                value={convertAmount || ""}
                onChange={(e) => setConvertAmount(Number(e.target.value))}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Khả dụng: {affiliateBalance.toLocaleString()}đ</span>
                <button
                  type="button"
                  onClick={() => setConvertAmount(affiliateBalance)}
                  className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                >
                  Đổi tối đa
                </button>
              </div>
            </div>

            {/* Estimated credits */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-500">Số Credits nhận được:</span>
              <strong className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                +{Math.round((convertAmount || 0) * 1.5).toLocaleString()} Credits
              </strong>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950 text-xs text-rose-700 dark:text-rose-300 font-bold">
                {errorMsg}
              </div>
            )}

            {convertSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-xs text-emerald-700 dark:text-emerald-300 font-bold">
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

      {/* 6. MODAL: RÚT TIỀN MẶT VIETQR */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-emerald-500" />
                <span>Rút Hoa Hồng Về Tài Khoản VietQR</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowPayoutModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Hạn mức rút tối thiểu 100.000đ. Hệ thống đối soát và chuyển khoản qua mạng Napas247 trong vòng 24 giờ làm việc.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Số tiền muốn rút (VND):
                </label>
                <input
                  type="number"
                  min={100000}
                  max={affiliateBalance}
                  step={50000}
                  value={payoutAmount || ""}
                  onChange={(e) => setPayoutAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Ngân hàng nhận tiền:
                </label>
                <select
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {POPULAR_BANKS.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Số tài khoản ngân hàng:
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: 1029384756"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Tên chủ tài khoản (Viết in hoa không dấu):
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: NGUYEN VAN AN"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950 text-xs text-rose-700 dark:text-rose-300 font-bold">
                {errorMsg}
              </div>
            )}

            {payoutSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-xs text-emerald-700 dark:text-emerald-300 font-bold">
                {payoutSuccess}
              </div>
            )}

            <button
              type="button"
              disabled={
                requestingPayout ||
                payoutAmount < 100000 ||
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
