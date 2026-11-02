"use client";

import React from "react";
import Link from "next/link";
import {
  Store,
  SearchX,
  FileQuestion,
  BookOpenCheck,
  PlusCircle,
  Sparkles,
  RotateCcw,
  Compass,
} from "lucide-react";

interface MarketplaceEmptyStateProps {
  mode:
    | "marketplace_empty"
    | "no_search_results"
    | "tab_purchased_empty"
    | "tab_my_listings_empty";
  onClearFilters?: () => void;
  onOpenSellModal?: () => void;
  onSwitchToAllTab?: () => void;
}

export function MarketplaceEmptyState({
  mode,
  onClearFilters,
  onOpenSellModal,
  onSwitchToAllTab,
}: MarketplaceEmptyStateProps) {
  // Case 1: Bộ lọc / tìm kiếm không ra kết quả
  if (mode === "no_search_results") {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card p-10 sm:p-14 text-center max-w-lg mx-auto shadow-xs space-y-4">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center">
          <SearchX className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-card-foreground">
            Không tìm thấy đề thi phù hợp
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Thầy/Cô thử kiểm tra lại từ khóa hoặc xóa bớt tiêu chí lọc môn học, khối lớp để xem thêm các đề thi khác.
          </p>
        </div>
        {onClearFilters && (
          <div className="pt-2">
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex min-h-[38px] items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Xóa bộ lọc & Xem tất cả</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Case 2: Tab "Đã sở hữu" trống
  if (mode === "tab_purchased_empty") {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card p-10 sm:p-14 text-center max-w-lg mx-auto shadow-xs space-y-4">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
          <BookOpenCheck className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-card-foreground">
            Chưa có bộ đề nào trong thư viện đã sở hữu
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Khi Thầy/Cô lấy đề miễn phí hoặc mở khóa đề bản quyền, tất cả sẽ được lưu trữ tại đây để xuất file Word hoặc chỉnh sửa trong Studio.
          </p>
        </div>
        {onSwitchToAllTab && (
          <div className="pt-2">
            <button
              type="button"
              onClick={onSwitchToAllTab}
              className="inline-flex min-h-[38px] items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Khám phá chợ đề thi ngay</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Case 3: Tab "Đề tôi đã đăng" trống
  if (mode === "tab_my_listings_empty") {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card p-10 sm:p-14 text-center max-w-lg mx-auto shadow-xs space-y-4">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
          <FileQuestion className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-card-foreground">
            Thầy/Cô chưa chia sẻ hoặc đăng bán bộ đề nào
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Hãy đóng góp bộ đề chất lượng từ kho đề cá nhân để hỗ trợ đồng nghiệp hoặc kiếm thêm thu nhập bản quyền (nhận tới 95% doanh thu).
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
          {onOpenSellModal && (
            <button
              type="button"
              onClick={onOpenSellModal}
              className="inline-flex min-h-[38px] items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-300" />
              <span>Đăng đề từ kho của tôi</span>
            </button>
          )}
          <Link
            href="/exams/create"
            className="inline-flex min-h-[38px] items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-card-foreground font-semibold text-xs transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Soạn đề mới bằng AI</span>
          </Link>
        </div>
      </div>
    );
  }

  // Case 4: Chợ hoàn toàn chưa có đề nào (Marketplace Empty)
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card p-10 sm:p-14 text-center max-w-lg mx-auto shadow-xs space-y-4">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
        <Store className="w-7 h-7" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-base sm:text-lg font-bold text-card-foreground">
          Chợ Đề Thi Đang Chờ Đón Bộ Đề Đầu Tiên
        </h3>
        <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
          Hiện chưa có đề thi nào được chia sẻ công khai. Thầy/Cô hãy là người tiên phong chia sẻ đề thi từ kho cá nhân: chọn miễn phí để lan tỏa hoặc đặt giá để kiếm thu nhập bản quyền!
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {onOpenSellModal && (
          <button
            type="button"
            onClick={onOpenSellModal}
            className="inline-flex min-h-[38px] items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <PlusCircle className="w-4 h-4 text-amber-300" />
            <span>Đăng đề từ kho của tôi</span>
          </button>
        )}

        <Link
          href="/exams/create"
          className="inline-flex min-h-[38px] items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-card-foreground font-semibold text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Soạn đề mới bằng AI</span>
        </Link>
      </div>
    </div>
  );
}
