"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  Copy,
  Check,
  Loader2,
  ShieldCheck,
  Sparkles,
  QrCode,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Clock,
  RefreshCw,
  HelpCircle,
  PhoneCall,
  Send,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { trackPlanEvent } from "@/lib/payment/plan-status";

interface PaymentOrder {
  id: string;
  order_code: string;
  amount: number;
  credits: number;
  status: string;
  bank_id: string;
  account_no: string;
  account_name: string;
  qr_url: string;
  created_at: string;
  checkout_url?: string;
}

interface PaymentCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: {
    credits: number;
    price: string;
    amount: number;
    isPro?: boolean;
    tier?: "free" | "pro" | "max" | string;
    name?: string;
  } | null;
  onSuccess: (newBalance: number) => void;
}

export function PaymentCheckoutModal({
  isOpen,
  onClose,
  selectedPlan,
  onSuccess,
}: PaymentCheckoutModalProps) {
  const { refreshWallet } = useAuth();
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [newBalance, setNewBalance] = useState<number | null>(null);

  // Countdown timer in seconds (15 minutes = 900 seconds)
  const [countdown, setCountdown] = useState(900);
  const [showSupportForm, setShowSupportForm] = useState(false);
  const [supportPhone, setSupportPhone] = useState("");
  const [supportMessageSent, setSupportMessageSent] = useState(false);

  // Polling ref to avoid stale closure
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const createOrder = useCallback(async () => {
    if (!selectedPlan) return;
    setLoading(true);
    setError(null);
    setIsPaid(false);
    setIsExpired(false);
    setCountdown(900); // 15 minutes
    setShowSupportForm(false);
    setSupportMessageSent(false);

    try {
      trackPlanEvent("checkout_open", {
        tier: selectedPlan.tier,
        amount: selectedPlan.amount,
        credits: selectedPlan.credits,
      });

      // Ưu tiên tạo qua cổng PayOS
      const resPayos = await fetch("/api/payment/payos/create-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: selectedPlan.amount,
          credits: selectedPlan.credits,
          isPro: selectedPlan.isPro || false,
        }),
      });

      const dataPayos = await resPayos.json();

      if (resPayos.ok && dataPayos.success) {
        setCheckoutUrl(dataPayos.checkoutUrl);
        setOrder({
          id: "payos_" + dataPayos.orderCode,
          order_code: dataPayos.orderCode.toString(),
          amount: dataPayos.amount,
          credits: selectedPlan.credits,
          status: "pending",
          bank_id: dataPayos.bankName || "MBBank / VietinBank (PayOS)",
          account_no: dataPayos.accountNumber,
          account_name: dataPayos.accountName,
          qr_url: dataPayos.qrCode,
          created_at: new Date().toISOString(),
          checkout_url: dataPayos.checkoutUrl,
        });
        setLoading(false);
        return;
      }

      // Fallback sang API create-order chuẩn nếu PayOS chưa khả dụng
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: selectedPlan.amount,
          credits: selectedPlan.credits,
          isPro: selectedPlan.isPro || false,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể khởi tạo đơn nạp tiền.");
      }

      setOrder(data.order);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Lỗi kết nối máy chủ thanh toán.");
      setLoading(false);
    }
  }, [selectedPlan]);

  // Khởi tạo đơn hàng khi mở modal
  useEffect(() => {
    if (!isOpen || !selectedPlan) {
      setOrder(null);
      setCheckoutUrl(null);
      setIsPaid(false);
      setError(null);
      setIsExpired(false);
      stopPolling();
      return;
    }

    createOrder();

    return () => {
      stopPolling();
    };
  }, [isOpen, selectedPlan, createOrder, stopPolling]);

  // Countdown timer countdown
  useEffect(() => {
    if (!isOpen || !order || isPaid || isExpired || loading) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsExpired(true);
          stopPolling();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, order, isPaid, isExpired, loading, stopPolling]);

  // Polling kiểm tra trạng thái thanh toán tự động
  useEffect(() => {
    if (!order || isPaid || isExpired) return;

    stopPolling();

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/payment/check-status?order_code=${order.order_code}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.status === "paid") {
            setIsPaid(true);
            setNewBalance(data.current_balance);
            stopPolling();
            refreshWallet?.();
            trackPlanEvent("checkout_success", {
              orderCode: order.order_code,
              amount: order.amount,
            });
            onSuccess(data.current_balance);
          }
        }
      } catch {
        // silent fail on network blips
      }
    }, 2500);

    return () => {
      stopPolling();
    };
  }, [order, isPaid, isExpired, onSuccess, refreshWallet, stopPolling]);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleClose = () => {
    if (!isPaid) {
      trackPlanEvent("checkout_abandon", {
        orderCode: order?.order_code,
        countdownRemaining: countdown,
      });
    }
    stopPolling();
    onClose();
  };

  const formatCountdown = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remSecs.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-card border border-border shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <QrCode className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="payment-modal-title" className="text-base font-bold text-foreground">
                Thanh toán PayOS / VietQR Tự động
              </h2>
              <p className="text-xs text-muted-foreground">
                Kích hoạt tự động ngay sau khi thanh toán qua VietQR
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
            aria-label="Đóng cửa sổ thanh toán"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* TRẠNG THÁI 1: LOADING */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Loader2 className="h-9 w-9 animate-spin text-primary" aria-hidden="true" />
              <p className="text-sm font-semibold text-foreground">
                Đang khởi tạo mã VietQR Napas247 bảo mật...
              </p>
              <p className="text-xs text-muted-foreground">
                Định tuyến qua cổng PayOS chính thức
              </p>
            </div>
          ) : error ? (
            /* TRẠNG THÁI 2: LỖI */
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
              <div className="p-3.5 rounded-full bg-destructive/10 text-destructive">
                <AlertCircle className="h-8 w-8" aria-hidden="true" />
              </div>
              <h3 className="font-bold text-foreground text-base">Khởi tạo giao dịch thất bại</h3>
              <p className="text-xs text-muted-foreground max-w-xs">{error}</p>
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={createOrder}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Thử lại</span>
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl border border-border bg-card text-foreground text-xs font-semibold hover:bg-muted transition cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          ) : isExpired ? (
            /* TRẠNG THÁI 3: HẾT HẠN MÃ */
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
              <div className="p-3.5 rounded-full bg-amber-500/10 text-amber-600">
                <Clock className="h-8 w-8" aria-hidden="true" />
              </div>
              <h3 className="font-bold text-foreground text-base">Mã thanh toán đã hết hạn</h3>
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                Mã VietQR chỉ có hiệu lực trong 15 phút để đảm bảo an toàn giao dịch. Thầy Cô vui lòng tạo mã mới để thanh toán.
              </p>
              <button
                type="button"
                onClick={createOrder}
                className="mt-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 flex items-center gap-2 transition cursor-pointer shadow-md"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                <span>Tạo lại mã thanh toán mới</span>
              </button>
            </div>
          ) : isPaid ? (
            /* TRẠNG THÁI 4: THÀNH CÔNG */
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-10 w-10" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-xl font-black text-foreground">
                  Kích hoạt thành công!
                </h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Gói cước đã được cập nhật ngay lập tức. Đã cộng{" "}
                  <strong className="text-emerald-600 font-bold">
                    +{selectedPlan?.credits.toLocaleString("vi-VN")} Credits
                  </strong>{" "}
                  vào tài khoản của Thầy Cô.
                </p>
              </div>

              {newBalance !== null && (
                <div className="px-5 py-2.5 rounded-xl bg-muted/60 border border-border text-sm font-medium">
                  Số dư ví hiện tại:{" "}
                  <span className="font-bold text-foreground">
                    {newBalance.toLocaleString("vi-VN")} credits
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={handleClose}
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold transition cursor-pointer shadow-md"
              >
                Hoàn tất & Bắt đầu trải nghiệm
              </button>
            </div>
          ) : (
            /* TRẠNG THÁI 5: ĐANG CHỜ THANH TOÁN (VIETQR DISPLAY) */
            <div className="space-y-4">
              {/* Selected Plan Summary Pill + Countdown Timer */}
              <div className="flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-xs">
                <div>
                  <span className="text-muted-foreground">Gói thanh toán: </span>
                  <span className="font-bold text-foreground">
                    {selectedPlan?.name || "Gói dịch vụ"} ({selectedPlan?.price})
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{formatCountdown(countdown)}</span>
                </div>
              </div>

              {/* QR and Transfer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                {/* QR Image Box */}
                <div className="flex flex-col items-center justify-center p-3 rounded-2xl border border-border bg-white shadow-xs">
                  <img
                    src={order?.qr_url}
                    alt="VietQR Napas247"
                    className="w-44 h-44 object-contain rounded-lg"
                  />
                  <span className="text-[11px] text-slate-600 font-medium mt-1.5 flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-amber-500" aria-hidden="true" />
                    Quét bằng App ngân hàng bất kỳ
                  </span>
                </div>

                {/* Account Details */}
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Ngân hàng thụ hưởng:</span>
                    <p className="font-bold text-foreground text-sm">{order?.bank_id}</p>
                  </div>

                  <div>
                    <span className="text-muted-foreground">Số tài khoản:</span>
                    <div className="flex items-center justify-between font-mono font-bold text-sm bg-muted/60 px-2.5 py-1.5 rounded-lg border border-border">
                      <span>{order?.account_no}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(order?.account_no || "", "acc")}
                        className="text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                        aria-label="Sao chép số tài khoản"
                      >
                        {copiedField === "acc" ? (
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-muted-foreground">Tên người nhận:</span>
                    <p className="font-bold text-foreground uppercase">{order?.account_name}</p>
                  </div>

                  <div>
                    <span className="text-muted-foreground">Số tiền:</span>
                    <div className="flex items-center justify-between font-mono font-bold text-sm text-primary bg-primary/10 px-2.5 py-1.5 rounded-lg border border-primary/20">
                      <span>{order?.amount?.toLocaleString("vi-VN")} đ</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(order?.amount?.toString() || "", "amount")}
                        className="text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer"
                        aria-label="Sao chép số tiền"
                      >
                        {copiedField === "amount" ? (
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-muted-foreground">Nội dung chuyển khoản (bắt buộc):</span>
                    <div className="flex items-center justify-between font-mono font-bold text-sm bg-amber-500/10 text-amber-800 dark:text-amber-300 px-2.5 py-1.5 rounded-lg border border-amber-500/30">
                      <span>{order?.order_code}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(order?.order_code || "", "code")}
                        className="text-amber-700 hover:text-amber-800 dark:text-amber-300 flex items-center gap-1 cursor-pointer"
                        aria-label="Sao chép nội dung chuyển khoản"
                      >
                        {copiedField === "code" ? (
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* PayOS Direct Checkout Button */}
              {checkoutUrl && (
                <div className="pt-1">
                  <a
                    href={checkoutUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Mở trang thanh toán cổng PayOS (Đầy đủ ngân hàng)</span>
                  </a>
                </div>
              )}

              {/* Status Listening Radar */}
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                  </div>
                  <span className="text-muted-foreground text-[11px]">
                    Đang chờ ngân hàng khớp lệnh (tự động cập nhật)...
                  </span>
                </div>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" aria-hidden="true" />
              </div>

              {/* Support link for unpaid / delay */}
              <div className="pt-1 text-center">
                {!showSupportForm ? (
                  <button
                    type="button"
                    onClick={() => setShowSupportForm(true)}
                    className="text-[11px] font-semibold text-muted-foreground hover:text-primary underline transition cursor-pointer"
                  >
                    Tôi đã chuyển khoản nhưng chưa thấy kích hoạt?
                  </button>
                ) : (
                  <div className="p-3 rounded-xl border border-border bg-muted/30 text-left space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-xs text-foreground flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                        <span>Đối soát giao dịch nhanh</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowSupportForm(false)}
                        className="text-[10px] text-muted-foreground hover:text-foreground"
                      >
                        Đóng
                      </button>
                    </div>
                    {supportMessageSent ? (
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                        Đã ghi nhận yêu cầu đối soát cho mã đơn <strong>{order?.order_code}</strong>. Đội ngũ kỹ thuật đang kiểm tra và sẽ phản hồi qua số {supportPhone || "điện thoại"}!
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Nhập số điện thoại/Zalo để kỹ thuật viên hỗ trợ kích hoạt thủ công ngay:
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="tel"
                            placeholder="Số điện thoại / Zalo Thầy Cô"
                            value={supportPhone}
                            onChange={(e) => setSupportPhone(e.target.value)}
                            className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-background text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (supportPhone.trim()) {
                                setSupportMessageSent(true);
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" aria-hidden="true" />
                            <span>Gửi</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaymentCheckoutModal;
