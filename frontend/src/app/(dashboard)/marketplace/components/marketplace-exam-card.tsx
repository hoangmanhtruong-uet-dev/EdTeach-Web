"use client";

import React, { memo } from "react";
import {
  Star,
  Gift,
  Award,
  Download,
  Eye,
  Sparkles,
  Coins,
  Loader2,
  FileCheck,
} from "lucide-react";
import { MarketplaceItem } from "@/types/marketplace";

interface MarketplaceExamCardProps {
  item: MarketplaceItem;
  cloningId: string | null;
  downloadingId: string | null;
  onPreview: (item: MarketplaceItem) => void;
  onClaimFree: (item: MarketplaceItem) => void;
  onBuy: (item: MarketplaceItem) => void;
  onCloneToStudio: (item: MarketplaceItem) => void;
  onDownloadDocx: (item: MarketplaceItem) => void;
}

export const MarketplaceExamCard = memo(function MarketplaceExamCard({
  item,
  cloningId,
  downloadingId,
  onPreview,
  onClaimFree,
  onBuy,
  onCloneToStudio,
  onDownloadDocx,
}: MarketplaceExamCardProps) {
  const isFree = item.price_credits === 0;
  const isOwnedOrPurchased = item.is_purchased || item.is_owner;
  const isCloning = cloningId === item.id;
  const isDownloading = downloadingId === item.id;

  return (
    <div className="bg-card rounded-2xl p-5 border border-border shadow-xs hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between group">
      <div>
        {/* Subject, Grade, Price Badge & Downloads / Rating */}
        <div className="flex items-center justify-between text-xs mb-3 gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-bold px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-[11px]">
              {item.subject} • Lớp {item.grade}
            </span>
            {isFree ? (
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-0.5">
                <Gift className="w-3 h-3 text-emerald-500" />
                MIỄN PHÍ
              </span>
            ) : (
              item.seller_tier === "pro" && (
                <span className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <Award className="w-3 h-3 text-amber-500" />
                  Tác giả PRO
                </span>
              )
            )}
          </div>

          {/* Rating or Downloads */}
          <div className="flex items-center gap-1 text-amber-500 font-bold text-xs shrink-0">
            {item.review_count && item.review_count > 0 && item.rating > 0 ? (
              <>
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{item.rating.toFixed(1)}</span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  ({item.downloads_count ?? 0})
                </span>
              </>
            ) : (
              <span className="text-[11px] text-muted-foreground font-normal">
                {(item.downloads_count ?? 0) > 0
                  ? `${item.downloads_count} lượt tải`
                  : "Mới đăng"}
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3
          className="font-bold text-card-foreground text-sm mb-2 line-clamp-2 leading-snug group-hover:text-primary transition-colors min-h-[40px]"
          title={item.title}
        >
          {item.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed min-h-[32px]">
          {item.description || "Bộ đề thi chuẩn phân hóa, bám sát cấu trúc đề minh họa mới nhất của Bộ GD&ĐT."}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3.5 min-h-[22px]">
          {item.tags && item.tags.length > 0 ? (
            item.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-md font-medium border border-border/50"
              >
                #{tag}
              </span>
            ))
          ) : (
            <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-md font-medium border border-border/50">
              #Đề kiểm tra
            </span>
          )}
        </div>

        {/* Author & Exam Meta */}
        <div className="text-xs text-muted-foreground mb-4 pb-3 border-b border-border flex items-center justify-between">
          <div>
            <div className="font-semibold text-card-foreground text-xs flex items-center gap-1">
              <span>{item.seller_name}</span>
              {item.is_owner && (
                <span className="text-[10px] text-primary font-bold">(Đề của bạn)</span>
              )}
            </div>
            <div className="text-[10px] text-muted-foreground">Giáo viên chia sẻ</div>
          </div>
          <div className="text-right">
            <div className="font-bold text-card-foreground text-xs">
              {item.question_count} câu hỏi
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              Có đáp án & giải
            </div>
          </div>
        </div>
      </div>

      {/* Footer Price & Buttons */}
      <div className="flex items-center justify-between pt-1 gap-2">
        {/* Price display */}
        <div className="min-w-0">
          {isFree ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-xs sm:text-sm flex items-center gap-1">
              <Gift className="w-4 h-4 shrink-0" />
              <span>Miễn phí</span>
            </span>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-black text-primary">
                {item.price_credits.toLocaleString("vi-VN")}
              </span>
              <span className="text-[11px] font-semibold text-muted-foreground">
                cr (~{(item.price_credits * 100).toLocaleString("vi-VN")}đ)
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isOwnedOrPurchased ? (
            <>
              <button
                type="button"
                onClick={() => onCloneToStudio(item)}
                disabled={isCloning}
                className="min-h-[34px] px-2.5 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center gap-1 transition shadow-2xs cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                title="Sao chép đề vào Studio cá nhân để chỉnh sửa, trộn đề"
                aria-label={`Mở đề ${item.title} trong Studio`}
              >
                {isCloning ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                )}
                <span>Studio</span>
              </button>

              <button
                type="button"
                onClick={() => onDownloadDocx(item)}
                disabled={isDownloading}
                className="min-h-[34px] px-2.5 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-card-foreground font-semibold text-xs flex items-center gap-1 transition cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                title="Tải file Word (.docx) kèm ma trận & barem đáp án"
                aria-label={`Tải file Word cho đề ${item.title}`}
              >
                {isDownloading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-primary" />
                )}
                <span>Word</span>
              </button>
            </>
          ) : isFree ? (
            <>
              <button
                type="button"
                onClick={() => onPreview(item)}
                className="min-h-[34px] px-2.5 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-card-foreground font-semibold text-xs flex items-center gap-1 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                title="Xem thử 3-5 câu hỏi mẫu và ma trận"
                aria-label={`Xem trước đề ${item.title}`}
              >
                <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Xem thử</span>
              </button>

              <button
                type="button"
                onClick={() => onClaimFree(item)}
                className="min-h-[34px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 transition shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                title="Lấy bộ đề này về kho cá nhân miễn phí"
                aria-label={`Lấy đề miễn phí ${item.title}`}
              >
                <Gift className="w-3.5 h-3.5" />
                <span>Lấy đề</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onPreview(item)}
                className="min-h-[34px] px-2.5 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-card-foreground font-semibold text-xs flex items-center gap-1 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                title="Xem thử cấu trúc ma trận & câu hỏi mẫu"
                aria-label={`Xem trước đề ${item.title}`}
              >
                <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Xem thử</span>
              </button>

              <button
                type="button"
                onClick={() => onBuy(item)}
                className="min-h-[34px] px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold text-xs flex items-center gap-1 transition shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                title={`Mở khóa bản quyền đề thi với ${item.price_credits} credits`}
                aria-label={`Mua đề ${item.title} với ${item.price_credits} credits`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Mua đề</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
});
