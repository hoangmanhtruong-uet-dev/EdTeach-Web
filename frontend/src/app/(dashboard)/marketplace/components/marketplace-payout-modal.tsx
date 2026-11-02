"use client";

import React, { useState, useEffect } from "react";
import { X, CreditCard, Building, Loader2 } from "lucide-react";
import { PayoutRequest } from "@/types/marketplace";
import { MINIMUM_PAYOUT_VND, MARKETPLACE_CREDIT_RATE_VND } from "@/lib/constants";

interface MarketplacePayoutModalProps {
  userBalance: number;
  onClose: () => void;
  onWalletRefresh: () => void;
}

export function MarketplacePayoutModal({
  userBalance,
  onClose,
  onWalletRefresh,
}: MarketplacePayoutModalProps) {
  const [payoutStats, setPayoutStats] = useState<any | null>(null);
  const [payoutHistory, setPayoutHistory] = useState<PayoutRequest[]>([]);
  const [payoutAmount, setPayoutAmount] = useState(2000);
  const [bankName, setBankName] = useState("MB Bank");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payoutMessage, setPayoutMessage] = useState<string | null>(null);
  const [payoutError, setPayoutError] = useState<string | null>(null);

  // Fetch stats & requests
  const fetchPayoutData = async () => {
    try {
      const res = await fetch("/api/marketplace/payout");
      const data = await res.json();
      if (data.success) {
        setPayoutStats(data.stats);
        setPayoutHistory(data.requests || []);
      }
    } catch (err) {
      console.warn("Lỗi tải thông tin payout:", err);
    }
  };

  useEffect(() => {
    fetchPayoutData();
  }, []);

  const handleSubmitPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutError(null);
    setPayoutMessage(null);

    const minPayoutCredits = MINIMUM_PAYOUT_VND / MARKETPLACE_CREDIT_RATE_VND;
    if (payoutAmount < minPayoutCredits) {
      setPayoutError(
        `Hạn mức rút tối thiểu là ${minPayoutCredits.toLocaleString("vi-VN")} credits (tương đương ${MINIMUM_PAYOUT_VND.toLocaleString("vi-VN")} VNĐ).`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/marketplace/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount_credits: payoutAmount,
          bank_name: bankName,
          account_number: accountNumber.trim(),
          account_holder: accountHolder.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setPayoutError(data.error || "Không thể gửi yêu cầu rút tiền.");
        return;
      }

      setPayoutMessage(data.message || "Đã gửi yêu cầu rút tiền thành công!");
      onWalletRefresh();
      fetchPayoutData();
    } catch (err: any) {
      setPayoutError("Lỗi kết nối máy chủ: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-card text-card-foreground rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-border relative max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
          aria-label="Đóng cửa sổ rút tiền"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-card-foreground">Doanh Thu Bán Đề & Rút Tiền</h3>
            <p className="text-xs text-muted-foreground">Rút tiền về tài khoản ngân hàng qua VietQR 24/7</p>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
          {/* Revenue Statistics */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-muted/50 p-3 rounded-2xl border border-border text-center">
              <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                {(payoutStats?.total_earned_credits ?? 0).toLocaleString("vi-VN")} cr
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Tổng kiếm được</div>
            </div>

            <div className="bg-muted/50 p-3 rounded-2xl border border-border text-center">
              <div className="text-base font-black text-card-foreground">
                {payoutStats?.total_sales ?? 0}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Lượt bán thành công</div>
            </div>

            <div className="bg-muted/50 p-3 rounded-2xl border border-border text-center">
              <div className="text-base font-black text-primary">
                {userBalance.toLocaleString("vi-VN")} cr
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Số dư khả dụng</div>
            </div>
          </div>

          {/* Payout Request Form */}
          <form onSubmit={handleSubmitPayout} className="space-y-3 p-4 rounded-2xl bg-muted/40 border border-border">
            <h4 className="font-bold text-card-foreground text-xs flex items-center gap-1.5">
              <Building className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Tạo lệnh rút tiền về ngân hàng</span>
            </h4>

            <div>
              <label className="block text-[11px] font-semibold text-card-foreground mb-1">
                Số Credits muốn rút (Tối thiểu 2.000 cr = 200.000đ)
              </label>
              <input
                type="number"
                min="2000"
                step="500"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(parseInt(e.target.value, 10) || 0)}
                className="w-full text-xs p-2 rounded-xl border border-border bg-background text-foreground font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                required
              />
              <div className="text-[10px] text-muted-foreground mt-1">
                Quy đổi thực nhận:{" "}
                <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {(payoutAmount * 100).toLocaleString("vi-VN")} VNĐ
                </strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-card-foreground mb-1">
                  Ngân hàng thụ hưởng
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-border bg-background text-foreground font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                >
                  <option value="MB Bank">MB Bank (Quân Đội)</option>
                  <option value="Techcombank">Techcombank</option>
                  <option value="Vietcombank">Vietcombank</option>
                  <option value="Vietinbank">Vietinbank</option>
                  <option value="BIDV">BIDV</option>
                  <option value="ACB">ACB</option>
                  <option value="TPBank">TPBank</option>
                  <option value="VPBank">VPBank</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-card-foreground mb-1">
                  Số tài khoản ngân hàng
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="0987654321..."
                  className="w-full text-xs p-2 rounded-xl border border-border bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-card-foreground mb-1">
                Tên chủ tài khoản (viết hoa không dấu)
              </label>
              <input
                type="text"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
                placeholder="NGUYEN VAN A"
                className="w-full text-xs p-2 rounded-xl border border-border bg-background text-foreground uppercase font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                required
              />
            </div>

            {payoutError && (
              <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-[11px]">
                {payoutError}
              </div>
            )}

            {payoutMessage && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium">
                {payoutMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[40px] py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang gửi yêu cầu...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Gửi Yêu Cầu Rút {(payoutAmount * 100).toLocaleString("vi-VN")}đ</span>
                </>
              )}
            </button>
          </form>

          {/* Recent Payout History */}
          <div>
            <h4 className="font-bold text-card-foreground text-xs mb-2">Lịch sử rút tiền gần đây</h4>
            {payoutHistory.length > 0 ? (
              <div className="space-y-2">
                {payoutHistory.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 rounded-xl border border-border bg-card flex items-center justify-between text-[11px]"
                  >
                    <div>
                      <div className="font-bold text-card-foreground">
                        {req.amount_vnd.toLocaleString("vi-VN")} VNĐ ({req.amount_credits} cr)
                      </div>
                      <div className="text-muted-foreground text-[10px]">
                        {req.bank_name} • {req.account_number} ({req.account_holder})
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        req.status === "completed"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {req.status === "completed" ? "Đã chuyển tiền" : "Đang xử lý"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground text-[11px] bg-muted/20 rounded-xl border border-border">
                Thầy/Cô chưa có lệnh rút tiền nào.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
