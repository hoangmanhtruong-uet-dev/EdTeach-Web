"use client";

import React, { useState } from "react";
import { X, BookOpen, Gift, Coins } from "lucide-react";
import { MarketplaceItem } from "@/types/marketplace";

interface MarketplacePreviewModalProps {
  item: MarketplaceItem;
  onClose: () => void;
  onClaimFree: (item: MarketplaceItem) => void;
  onBuy: (item: MarketplaceItem) => void;
}

export function MarketplacePreviewModal({
  item,
  onClose,
  onClaimFree,
  onBuy,
}: MarketplacePreviewModalProps) {
  const [activeTab, setActiveTab] = useState<"questions" | "matrix">("questions");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-card text-card-foreground rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-border relative max-h-[90vh] flex flex-col">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
          aria-label="Đóng cửa sổ xem trước"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-4 pr-8">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-[11px]">
              {item.subject} - Lớp {item.grade}
            </span>
            {item.price_credits === 0 ? (
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-black px-2 py-0.5 rounded">
                Miễn phí (0 cr)
              </span>
            ) : (
              <span className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] font-black px-2 py-0.5 rounded">
                {item.price_credits.toLocaleString("vi-VN")} credits
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              Tác giả: <strong className="text-foreground">{item.seller_name}</strong>
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-card-foreground leading-snug">
            {item.title}
          </h2>
        </div>

        {/* Tabs switcher */}
        <div className="flex items-center gap-2 border-b border-border pb-2.5 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab("questions")}
            className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "questions"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Câu hỏi xem trước (3-5 câu)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("matrix")}
            className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === "matrix"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Ma trận đề thi chuẩn 2025
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs">
          {activeTab === "questions" ? (
            <div className="space-y-3.5">
              {item.preview_data?.sample_questions &&
              item.preview_data.sample_questions.length > 0 ? (
                item.preview_data.sample_questions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="p-4 rounded-2xl bg-muted/50 border border-border space-y-2"
                  >
                    <div className="flex items-center justify-between font-bold text-card-foreground">
                      <span>Câu {q.order || idx + 1}:</span>
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                        {q.difficulty}
                      </span>
                    </div>
                    <p className="text-card-foreground leading-relaxed whitespace-pre-line text-xs">
                      {q.content}
                    </p>

                    {q.options && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1.5">
                        {q.options.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className="px-2.5 py-1.5 rounded-lg bg-card border border-border text-[11px] text-card-foreground"
                          >
                            {opt}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-muted-foreground bg-muted/40 rounded-2xl border border-border">
                  Bộ đề chưa có bản xem trước câu hỏi chi tiết.
                </div>
              )}

              {/* Unlock All Questions Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-primary/10 border border-primary/20 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center mx-auto">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="font-bold text-card-foreground text-sm">
                  Mở khóa toàn bộ {item.question_count} câu hỏi & lời giải chi tiết
                </div>
                <p className="text-[11px] text-muted-foreground max-w-md mx-auto leading-relaxed">
                  {item.price_credits === 0
                    ? "Đề thi được chia sẻ Miễn Phí. Thầy/Cô có thể nhận ngay về kho Studio để sử dụng và tải file Word!"
                    : "Toàn bộ đáp án chính xác, lời giải chi tiết từng bước và quyền tải file Word chuẩn Bộ GD&ĐT."}
                </p>
              </div>
            </div>
          ) : (
            /* Matrix Tab */
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-2xl p-4 border border-border space-y-3">
                <h4 className="font-bold text-card-foreground">Cấu trúc câu hỏi định dạng 2025:</h4>
                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="bg-card p-3 rounded-xl border border-border">
                    <div className="text-lg font-black text-primary">
                      {item.preview_data?.matrix?.multiple_choice_count ?? 0}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      Phần I: 4 Lựa chọn
                    </div>
                  </div>
                  <div className="bg-card p-3 rounded-xl border border-border">
                    <div className="text-lg font-black text-amber-600 dark:text-amber-400">
                      {item.preview_data?.matrix?.true_false_count ?? 0}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      Phần II: Đúng / Sai
                    </div>
                  </div>
                  <div className="bg-card p-3 rounded-xl border border-border">
                    <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                      {item.preview_data?.matrix?.short_answer_count ?? 0}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      Phần III: Trả lời ngắn
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-2xl p-4 border border-border space-y-3">
                <h4 className="font-bold text-card-foreground">Phân bổ mức độ nhận thức:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px]">
                  <div className="bg-card p-2.5 rounded-xl border border-border">
                    <div className="font-bold text-card-foreground">Nhận biết</div>
                    <div className="text-sm font-black text-blue-600 dark:text-blue-400 mt-1">
                      {item.preview_data?.matrix?.difficulty_distribution?.easy ?? 0} câu
                    </div>
                  </div>
                  <div className="bg-card p-2.5 rounded-xl border border-border">
                    <div className="font-bold text-card-foreground">Thông hiểu</div>
                    <div className="text-sm font-black text-indigo-600 dark:text-indigo-400 mt-1">
                      {item.preview_data?.matrix?.difficulty_distribution?.medium ?? 0} câu
                    </div>
                  </div>
                  <div className="bg-card p-2.5 rounded-xl border border-border">
                    <div className="font-bold text-card-foreground">Vận dụng</div>
                    <div className="text-sm font-black text-amber-600 dark:text-amber-400 mt-1">
                      {item.preview_data?.matrix?.difficulty_distribution?.hard ?? 0} câu
                    </div>
                  </div>
                  <div className="bg-card p-2.5 rounded-xl border border-border">
                    <div className="font-bold text-card-foreground">Vận dụng cao</div>
                    <div className="text-sm font-black text-rose-600 dark:text-rose-400 mt-1">
                      {item.preview_data?.matrix?.difficulty_distribution?.very_hard ?? 0} câu
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3 mt-2">
          <div>
            <span className="text-xs text-muted-foreground">Giá bộ đề:</span>
            <div className="text-base font-black text-primary">
              {item.price_credits === 0
                ? "Miễn phí (0 credits)"
                : `${item.price_credits.toLocaleString("vi-VN")} credits (~${(item.price_credits * 100).toLocaleString("vi-VN")}đ)`}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[38px] px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-card-foreground text-xs font-semibold cursor-pointer transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Đóng
            </button>
            {item.price_credits === 0 ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onClaimFree(item);
                }}
                className="min-h-[38px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <Gift className="w-4 h-4" />
                <span>Lấy đề miễn phí</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onBuy(item);
                }}
                className="min-h-[38px] px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              >
                <Coins className="w-4 h-4" />
                <span>Mua đề ngay</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
