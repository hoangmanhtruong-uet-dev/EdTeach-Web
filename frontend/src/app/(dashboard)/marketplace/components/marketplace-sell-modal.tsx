"use client";

import React, { useState } from "react";
import { X, Store, Gift, Coins, PlusCircle, Loader2 } from "lucide-react";
import { Exam } from "@/lib/api/exams";
import { MARKETPLACE_COMMISSION_TIERS } from "@/lib/constants";

interface MarketplaceSellModalProps {
  userExams: Exam[];
  isUserPro: boolean;
  isUserMax: boolean;
  onClose: () => void;
  onSuccess: (finalPrice: number) => void;
}

export function MarketplaceSellModal({
  userExams,
  isUserPro,
  isUserMax,
  onClose,
  onSuccess,
}: MarketplaceSellModalProps) {
  const [selectedExamId, setSelectedExamId] = useState("");
  const [sellTitle, setSellTitle] = useState("");
  const [sellSubject, setSellSubject] = useState("Toán");
  const [sellGrade, setSellGrade] = useState("12");
  const [sellPricingType, setSellPricingType] = useState<"free" | "paid">("free");
  const [sellPrice, setSellPrice] = useState(100);
  const [sellDescription, setSellDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sellError, setSellError] = useState<string | null>(null);

  const authorRate = isUserMax
    ? MARKETPLACE_COMMISSION_TIERS.max.authorShare
    : isUserPro
    ? MARKETPLACE_COMMISSION_TIERS.pro.authorShare
    : MARKETPLACE_COMMISSION_TIERS.free.authorShare;

  const currentTierLabel = isUserMax ? "MAX VIP (95%)" : isUserPro ? "PRO (90%)" : "Free (80%)";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSellError(null);

    if (!sellTitle.trim()) {
      setSellError("Vui lòng nhập tiêu đề đề thi.");
      return;
    }

    const finalPrice = sellPricingType === "free" ? 0 : Math.max(10, sellPrice);

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/marketplace/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: sellTitle.trim(),
          subject: sellSubject,
          grade: sellGrade,
          price_credits: finalPrice,
          description: sellDescription.trim(),
          exam_id: selectedExamId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSellError(data.error || "Không thể đăng đề thi. Vui lòng thử lại.");
        return;
      }

      onSuccess(finalPrice);
    } catch (err: any) {
      setSellError("Lỗi kết nối máy chủ: " + err.message);
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
          aria-label="Đóng cửa sổ đăng đề"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-card-foreground">Đăng đề thi lên Chợ</h3>
            <p className="text-xs text-muted-foreground">
              Chia sẻ miễn phí cho cộng đồng hoặc đăng bán bản quyền bằng credits
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
          {/* Select from existing exams */}
          <div>
            <label className="block font-semibold text-card-foreground mb-1.5">
              Chọn đề từ "Kho đề của tôi" (hoặc tự nhập tiêu đề bên dưới)
            </label>
            <select
              value={selectedExamId}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedExamId(id);
                const found = userExams.find((ex) => ex.id === id);
                if (found) {
                  setSellTitle(found.name);
                  if (found.subject) setSellSubject(found.subject);
                  if (found.grade) setSellGrade(found.grade.toString());
                }
              }}
              className="w-full text-xs p-2.5 rounded-xl border border-border bg-background text-foreground font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
            >
              <option value="" className="bg-card text-card-foreground">
                -- Tự nhập tiêu đề đề thi mới --
              </option>
              {userExams.map((ex) => (
                <option key={ex.id} value={ex.id} className="bg-card text-card-foreground">
                  {ex.name} ({ex.subject} - Lớp {ex.grade})
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block font-semibold text-card-foreground mb-1.5">
              Tiêu đề đề thi <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={sellTitle}
              onChange={(e) => setSellTitle(e.target.value)}
              placeholder="Ví dụ: Đề ôn thi Giữa kỳ 1 Toán 12 - Chương Hàm số bám sát đề minh họa"
              className="w-full text-xs p-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              required
            />
          </div>

          {/* Subject & Grade */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-card-foreground mb-1.5">Môn học</label>
              <select
                value={sellSubject}
                onChange={(e) => setSellSubject(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-border bg-background text-foreground font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
              >
                <option value="Toán">Toán</option>
                <option value="Vật lí">Vật lí</option>
                <option value="Hóa học">Hóa học</option>
                <option value="Sinh học">Sinh học</option>
                <option value="Tiếng Anh">Tiếng Anh</option>
                <option value="Ngữ văn">Ngữ văn</option>
                <option value="Lịch sử">Lịch sử</option>
                <option value="Địa lí">Địa lí</option>
                <option value="Tin học">Tin học</option>
                <option value="GDCD">GDCD</option>
                <option value="Công nghệ">Công nghệ</option>
                <option value="KHTN">KHTN</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-card-foreground mb-1.5">Khối lớp</label>
              <select
                value={sellGrade}
                onChange={(e) => setSellGrade(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-border bg-background text-foreground font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
              >
                <option value="12">Lớp 12</option>
                <option value="11">Lớp 11</option>
                <option value="10">Lớp 10</option>
                <option value="9">Lớp 9</option>
                <option value="8">Lớp 8</option>
                <option value="7">Lớp 7</option>
                <option value="6">Lớp 6</option>
              </select>
            </div>
          </div>

          {/* Pricing Type Chooser */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-3">
            <label className="block font-bold text-card-foreground text-xs">
              Hình thức đăng tải trên Chợ:
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSellPricingType("free")}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  sellPricingType === "free"
                    ? "border-emerald-500 bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 font-bold shadow-xs"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-600 dark:text-emerald-400">
                  <Gift className="w-4 h-4" />
                  <span>Miễn Phí (0 cr)</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Mọi giáo viên tải & mở Studio tự do
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSellPricingType("paid")}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  sellPricingType === "paid"
                    ? "border-amber-500 bg-amber-500/15 text-amber-900 dark:text-amber-200 font-bold shadow-xs"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-amber-600 dark:text-amber-400">
                  <Coins className="w-4 h-4" />
                  <span>Có phí (Credits)</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Bán bản quyền, tích lũy doanh thu
                </p>
              </button>
            </div>

            {sellPricingType === "paid" ? (
              <div className="space-y-2 pt-2 border-t border-border">
                <label className="block text-[11px] font-semibold text-card-foreground">
                  Giá bán đề thi (Credits):
                </label>
                <div className="flex items-center gap-2.5">
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(parseInt(e.target.value, 10) || 0)}
                    className="w-36 text-xs p-2 rounded-xl border border-border bg-background text-foreground font-bold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                  <span className="text-xs text-muted-foreground font-medium">
                    = {(sellPrice * 100).toLocaleString("vi-VN")} VNĐ
                  </span>
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  👉 Thầy/Cô thực nhận:{" "}
                  <strong>
                    {Math.round(sellPrice * authorRate).toLocaleString("vi-VN")} credits (~
                    {(Math.round(sellPrice * authorRate) * 100).toLocaleString("vi-VN")}đ)
                  </strong>{" "}
                  mỗi lượt bán (Tài khoản hiện tại: {currentTierLabel}).
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                ✨ Bộ đề sẽ gắn nhãn <strong>MIỄN PHÍ</strong>. Đồng nghiệp có thể tải về kho cá nhân và sử dụng tự do.
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-card-foreground mb-1.5">Mô tả tóm tắt bộ đề</label>
            <textarea
              rows={3}
              value={sellDescription}
              onChange={(e) => setSellDescription(e.target.value)}
              placeholder="Đặc điểm nổi bật, số lượng câu trắc nghiệm/tự luận, bám sát chuyên đề nào..."
              className="w-full text-xs p-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          {sellError && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              {sellError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[42px] py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs transition flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xử lý đăng đề...</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4 text-amber-300" />
                <span>
                  {sellPricingType === "free"
                    ? "Chia Sẻ Đề Miễn Phí"
                    : `Đăng Bán Với Giá ${sellPrice.toLocaleString("vi-VN")} cr`}
                </span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
