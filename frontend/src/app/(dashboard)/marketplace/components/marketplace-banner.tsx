"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Store,
  PlusCircle,
  Coins,
  CreditCard,
  Link as LinkIcon,
  ChevronDown,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";

interface MarketplaceBannerProps {
  userBalance: number;
  onOpenSellModal: () => void;
  onOpenPayoutModal: () => void;
  onOpenImportModal: () => void;
}

export function MarketplaceBanner({
  userBalance,
  onOpenSellModal,
  onOpenPayoutModal,
  onOpenImportModal,
}: MarketplaceBannerProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 p-5 md:p-6 text-white shadow-md">
      {/* Background subtle glow effect */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        {/* Title & Short Description */}
        <div className="space-y-1.5 max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/20 text-blue-300 border border-blue-400/30">
              <Store className="h-4 w-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Chợ Đề Thi Giáo Viên
            </h1>
            <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-400/30 whitespace-nowrap">
              Miễn Phí & Bản Quyền
            </span>
          </div>
          <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed">
            Sàn chia sẻ và trao đổi đề thi chất lượng cao giữa cộng đồng giáo viên trên cả nước.
          </p>
        </div>

        {/* Action Group: Wallet & Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Credits Wallet Widget */}
          <Link
            href="/settings?tab=credits"
            className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2 backdrop-blur-md transition hover:bg-white/15 hover:border-white/25 active:scale-[0.98]"
            title="Xem chi tiết ví và nạp credits"
            aria-label="Số dư ví credits"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400/20 text-amber-300 border border-amber-300/30">
              <Coins className="h-4 w-4" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold leading-tight text-white">
                <span className="text-amber-300 font-extrabold">
                  {userBalance.toLocaleString("vi-VN")}
                </span>{" "}
                credits
              </span>
              <span className="text-[10px] text-slate-300 leading-tight">
                ~{(userBalance * 100).toLocaleString("vi-VN")}đ
              </span>
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
          </Link>

          {/* Primary Action Button: Đăng đề thi mới */}
          <button
            type="button"
            onClick={onOpenSellModal}
            className="inline-flex min-h-[38px] items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-extrabold text-neutral-950 shadow-md transition hover:bg-amber-400 hover:shadow-amber-500/25 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            <PlusCircle className="h-4 w-4" />
            <span>+ Đăng Đề Thi Mới</span>
          </button>

          {/* Secondary Action: Ví bán đề & Rút tiền */}
          <button
            type="button"
            onClick={onOpenPayoutModal}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/20 hover:border-white/30 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Ví Bán Đề & Rút Tiền</span>
            <span className="sm:hidden">Rút tiền</span>
          </button>

          {/* Secondary Action: Nhập đề từ link (formerly Cào link web) */}
          <button
            type="button"
            onClick={onOpenImportModal}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/20 hover:text-white hover:border-white/30 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            title="Nhập đề trắc nghiệm tự động từ các link web giáo dục"
          >
            <LinkIcon className="h-3.5 w-3.5 text-cyan-300" />
            <span>Nhập đề từ link</span>
          </button>
        </div>
      </div>
    </div>
  );
}
