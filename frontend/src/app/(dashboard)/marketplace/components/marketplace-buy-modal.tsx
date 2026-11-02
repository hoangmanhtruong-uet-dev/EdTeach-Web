"use client";

import React from "react";
import { X, Coins, AlertCircle, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { MarketplaceItem } from "@/types/marketplace";

interface MarketplaceBuyModalProps {
  item: MarketplaceItem;
  userBalance: number;
  isProcessing: boolean;
  buyError: string | null;
  onClose: () => void;
  onConfirmBuy: () => void;
}

export function MarketplaceBuyModal({
  item,
  userBalance,
  isProcessing,
  buyError,
  onClose,
  onConfirmBuy,
}: MarketplaceBuyModalProps) {
  const isInsufficient = userBalance < item.price_credits;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-card text-card-foreground rounded-3xl max-w-md w-full p-6 shadow-2xl border border-border relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isProcessing}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer disabled:opacity-50"
          aria-label="Đóng hộp thoại"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-3.5">
          <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-card-foreground">Xác nhận mở khóa đề thi</h3>
            <p className="text-xs text-muted-foreground">Thanh toán bản quyền bằng credits</p>
          </div>
        </div>

        {/* Item Details Summary Box */}
        <div className="p-4 rounded-2xl bg-muted/50 border border-border mb-4 space-y-2 text-xs">
          <div className="font-bold text-card-foreground text-sm line-clamp-2">{item.title}</div>
          <div className="flex justify-between text-muted-foreground pt-1.5 border-t border-border">
            <span>Tác giả:</span>
            <strong className="text-card-foreground">{item.seller_name}</strong>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Số câu hỏi:</span>
            <strong className="text-card-foreground">{item.question_count} câu</strong>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Giá mở khóa:</span>
            <strong className="text-primary font-bold">
              {item.price_credits.toLocaleString("vi-VN")} credits (~{(item.price_credits * 100).toLocaleString("vi-VN")}đ)
            </strong>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Số dư ví hiện tại:</span>
            <strong className="text-card-foreground">{userBalance.toLocaleString("vi-VN")} credits</strong>
          </div>
        </div>

        {/* Error / Insufficient Balance Warning */}
        {isInsufficient && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs mb-4 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p>Số dư ví của Thầy/Cô hiện không đủ để mở khóa đề thi này.</p>
              <Link
                href="/settings?tab=credits"
                className="inline-flex items-center gap-1 font-bold underline mt-1.5 text-destructive hover:opacity-90"
              >
                <span>Nạp thêm Credits qua VietQR ngay</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}

        {buyError && !isInsufficient && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs mb-4 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">{buyError}</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 min-h-[40px] py-2 rounded-xl border border-border bg-card hover:bg-muted text-card-foreground text-xs font-semibold cursor-pointer transition disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirmBuy}
            disabled={isProcessing || isInsufficient}
            className="flex-1 min-h-[40px] py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Xác nhận ({item.price_credits} cr)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
