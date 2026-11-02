"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Gift,
  QrCode,
  Copy,
  Check,
  Share2,
  Sparkles,
  Zap,
  Users,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Heart,
} from "lucide-react";
import { APP_URL, REFERRAL_BONUS_CREDITS } from "@/lib/constants";

interface QuotaExhaustedModalProps {
  isOpen: boolean;
  onClose: () => void;
  referralCode?: string;
  dailyQuota?: number;
  dailyUsed?: number;
  userId?: string;
}

export function QuotaExhaustedModal({
  isOpen,
  onClose,
  referralCode = "EDUTEACH",
  dailyQuota = 3,
  dailyUsed = 3,
  userId = "USER",
}: QuotaExhaustedModalProps) {
  const [activeTab, setActiveTab] = useState<"free" | "pricing">("free");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Input colleague's referral code
  const [colleagueCode, setColleagueCode] = useState("");
  const [applyingCode, setApplyingCode] = useState(false);
  const [applyResult, setApplyResult] = useState<{ success: boolean; msg: string } | null>(null);

  // Pricing package selection
  const [selectedPlan, setSelectedPlan] = useState<"pack19" | "sub49">("pack19");
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);

  if (!isOpen) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : APP_URL;
  const shareUrl = `${origin}?ref=${referralCode}`;
  const prewrittenMsg = `Thầy/cô ơi, em vừa dùng thử EduTest AI soạn đề thi chuẩn Bộ GD&ĐT nhanh và chuẩn ma trận lắm. Đăng ký qua link này thì cả hai thầy cô cùng được tặng thêm ${REFERRAL_BONUS_CREDITS.toLocaleString("vi-VN")} credits miễn phí (tương đương 4 đề thi Flash) nhé: ${shareUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(prewrittenMsg);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleApplyColleagueCode = async () => {
    if (!colleagueCode.trim()) return;
    setApplyingCode(true);
    setApplyResult(null);
    try {
      const res = await fetch("/api/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referral_code: colleagueCode }),
      });
      const data = await res.json();
      if (res.ok) {
        setApplyResult({ success: true, msg: data.message });
      } else {
        setApplyResult({ success: false, msg: data.error || "Mã không hợp lệ" });
      }
    } catch {
      setApplyResult({ success: false, msg: "Lỗi kết nối máy chủ" });
    } finally {
      setApplyingCode(false);
    }
  };

  const bankId = process.env.NEXT_PUBLIC_PAYMENT_BANK_ID || "MB";
  const accountNo = process.env.NEXT_PUBLIC_PAYMENT_ACCOUNT_NO || "0988888888";
  const accountName = process.env.NEXT_PUBLIC_PAYMENT_ACCOUNT_NAME || "EDUTEST AI";

  const transferAmount = selectedPlan === "pack19" ? 19000 : 149000;
  const transferContent = `EDUPAY ${userId.slice(0, 6).toUpperCase()}`;
  const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${transferAmount}&addInfo=${encodeURIComponent(
    transferContent
  )}&accountName=${encodeURIComponent(accountName)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden text-slate-800">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full p-1 text-white/80 hover:bg-white/20 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
              <Sparkles className="h-4 w-4 text-amber-300" />
            </span>
            <h3 className="text-lg font-bold">Thầy cô đã dùng hết credits miễn phí</h3>
          </div>
          <p className="mt-1 text-xs text-blue-100">
            Thầy cô có thể nhận thêm +2.000 credits hoàn toàn miễn phí khi lan tỏa tới đồng nghiệp, hoặc nâng cấp Gói PRO (+30.000 credits):
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("free")}
            className={`flex items-center gap-1.5 border-b-2 pb-3 px-3 transition ${
              activeTab === "free"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Gift className="h-4 w-4 text-amber-500" />
            🎁 Nhận Thêm +2.000 Credits (Lan tỏa)
          </button>

          <button
            onClick={() => setActiveTab("pricing")}
            className={`flex items-center gap-1.5 border-b-2 pb-3 px-3 transition ${
              activeTab === "pricing"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <QrCode className="h-4 w-4 text-green-600" />
            ⚡ Nạp Nhanh VietQR (Từ 19k)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {activeTab === "free" ? (
            /* TAB 1: FREE REFERRAL */
            <div className="space-y-4">
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-blue-900">
                      Mời 1 đồng nghiệp = Cả hai cùng nhận +{REFERRAL_BONUS_CREDITS.toLocaleString("vi-VN")} credits miễn phí!
                    </h4>
                    <p className="mt-1 text-xs text-blue-700 leading-relaxed">
                      Chia sẻ mã hoặc link giới thiệu cho giáo viên cùng trường hoặc bạn bè. Khi đồng nghiệp đăng ký qua link, cả hai thầy cô đều được cộng ngay {REFERRAL_BONUS_CREDITS.toLocaleString("vi-VN")} credits vào ví (tương đương 4 đề thi Flash chuẩn ma trận).
                    </p>
                  </div>
                </div>

                {/* Referral Code box */}
                <div className="mt-4 flex items-center justify-between rounded-lg border border-blue-200 bg-white px-3 py-2">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400">Mã giới thiệu của bạn:</span>
                    <p className="text-base font-mono font-bold tracking-wider text-blue-600">{referralCode}</p>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 rounded-md bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    {copiedCode ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedCode ? "Đã chép" : "Sao chép mã"}</span>
                  </button>
                </div>

                {/* Action buttons */}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                  >
                    {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
                    <span>{copiedLink ? "Đã chép link Zalo!" : "Sao chép link mời"}</span>
                  </button>
                  <button
                    onClick={handleCopyMessage}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    {copiedMessage ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedMessage ? "Đã chép lời nhắn" : "Chép tin nhắn mẫu"}</span>
                  </button>
                </div>
              </div>

              {/* Box to enter a colleague's referral code */}
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold text-slate-700">Thầy cô có mã giới thiệu từ đồng nghiệp?</p>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={colleagueCode}
                    onChange={(e) => setColleagueCode(e.target.value.toUpperCase())}
                    placeholder="VD: EDU8K2M"
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono uppercase focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={handleApplyColleagueCode}
                    disabled={applyingCode || !colleagueCode.trim()}
                    className="flex items-center gap-1 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {applyingCode ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Áp dụng"}
                  </button>
                </div>
                {applyResult && (
                  <p
                    className={`mt-2 text-xs font-medium ${
                      applyResult.success ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {applyResult.msg}
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* TAB 2: PRICING / VIETQR */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Option 19k */}
                <div
                  onClick={() => setSelectedPlan("pack19")}
                  className={`cursor-pointer rounded-xl border p-3.5 transition ${
                    selectedPlan === "pack19"
                      ? "border-blue-600 bg-blue-50/50 shadow-sm"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="inline-block rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                    TIẾT KIỆM
                  </span>
                  <h4 className="mt-1 text-sm font-bold text-slate-900">Gói Soạn Nhanh</h4>
                  <p className="text-lg font-extrabold text-blue-600">19.000đ</p>
                  <p className="mt-1 text-[11px] text-slate-500">+10.000 credits vào ví (~20 đề Flash)</p>
                </div>

                {/* Option PRO 149k */}
                <div
                  onClick={() => setSelectedPlan("sub49")}
                  className={`cursor-pointer rounded-xl border p-3.5 transition ${
                    selectedPlan === "sub49"
                      ? "border-amber-500 bg-amber-50/50 shadow-sm"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                    GÓI KHUYÊN DÙNG
                  </span>
                  <h4 className="mt-1 text-sm font-bold text-slate-900">Giáo Viên PRO</h4>
                  <p className="text-lg font-extrabold text-amber-600">149.000đ<span className="text-xs font-normal text-slate-500">/tháng</span></p>
                  <p className="mt-1 text-[11px] text-slate-500">+30.000 credits & mở khóa AI nâng cao</p>
                </div>
              </div>

              {/* VietQR Code Display */}
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-center">
                <p className="text-xs font-semibold text-slate-700">
                  Quét mã QR bằng App Ngân hàng hoặc MoMo
                </p>
                <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrUrl}
                    alt="VietQR Payment"
                    className="h-48 w-48 object-contain"
                  />
                </div>

                <div className="mt-3 w-full space-y-1.5 text-left text-xs text-slate-600 max-w-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Số tiền:</span>
                    <span className="font-bold text-blue-600">{transferAmount.toLocaleString()}đ</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Nội dung CK:</span>
                    <span className="font-mono font-bold text-slate-800 bg-slate-200/70 px-1 rounded">
                      {transferContent}
                    </span>
                  </div>
                </div>

                <p className="mt-3 text-[11px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
                  Hệ thống tự động kích hoạt lượt sau khi nhận chuyển khoản
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-3 text-xs text-slate-500">
          <span>Credits được bảo lưu vĩnh viễn trong ví tài khoản</span>
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1 font-medium text-slate-600 hover:bg-slate-200"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
