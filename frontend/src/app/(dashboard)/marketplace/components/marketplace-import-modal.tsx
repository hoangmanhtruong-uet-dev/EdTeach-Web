"use client";

import React, { useState } from "react";
import { X, Link as LinkIcon, CheckCircle2, ExternalLink, Loader2, Sparkles, Globe } from "lucide-react";
import Link from "next/link";

interface MarketplaceImportModalProps {
  onClose: () => void;
}

export function MarketplaceImportModal({ onClose }: MarketplaceImportModalProps) {
  const [importUrl, setImportUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<any | null>(null);

  const handleImport = async () => {
    if (!importUrl.trim()) {
      setImportError("Vui lòng nhập đường link bài viết hoặc đề thi.");
      return;
    }

    try {
      setIsImporting(true);
      setImportError(null);
      setImportSuccess(null);

      const res = await fetch("/api/exams/import-from-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setImportError(data.error || "Không thể bóc tách đề từ liên kết này. Vui lòng kiểm tra lại đường dẫn.");
        return;
      }

      setImportSuccess(data);
    } catch (err: any) {
      setImportError("Lỗi kết nối máy chủ: " + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-card text-card-foreground rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-border relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
          aria-label="Đóng cửa sổ nhập đề"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-card-foreground">Nhập đề từ liên kết web</h3>
            <p className="text-xs text-muted-foreground">Tự động nhận diện câu hỏi từ các trang tài liệu</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          Dán đường link từ các trang chia sẻ giáo dục (VnDoc, VietJack, Thuvienhoclieu, Hoc247...).
          AI sẽ đọc câu hỏi, gợi ý đáp án và lưu thẳng vào kho đề của bạn.
        </p>

        {importSuccess ? (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs">
              <div className="flex items-center gap-2 font-bold text-sm mb-1.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Đã bóc tách thành công {importSuccess.questionCount} câu hỏi!</span>
              </div>
              <p className="leading-relaxed">
                Đề thi: <strong className="text-foreground">{importSuccess.examName}</strong> ({importSuccess.subject} - Lớp{" "}
                {importSuccess.grade}) đã được lưu trữ an toàn trong kho đề của Thầy/Cô.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Link
                href={`/exams/${importSuccess.examId}`}
                className="flex-1 min-h-[40px] py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Mở chỉnh sửa trong Studio</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setImportSuccess(null);
                  setImportUrl("");
                }}
                className="min-h-[40px] px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-card-foreground text-xs font-semibold cursor-pointer transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Nhập link khác
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-card-foreground mb-1.5">
                Đường dẫn bài viết chứa đề thi
              </label>
              <div className="relative">
                <LinkIcon className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  placeholder="https://thuvienhoclieu.com/de-thi-giua-ki-1-toan-12..."
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
            </div>

            {importError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                {importError}
              </div>
            )}

            <div className="text-[11px] text-muted-foreground bg-muted/40 p-3 rounded-xl border border-border leading-relaxed">
              💡 <strong>Gợi ý:</strong> Bạn có thể copy link bài tập, đề kiểm tra hoặc ngân hàng câu hỏi công khai trên internet để AI tự động chuyển đổi sang định dạng EduTest AI.
            </div>

            <button
              type="button"
              onClick={handleImport}
              disabled={isImporting}
              className="w-full min-h-[42px] py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI đang đọc trang web & bóc tách câu hỏi...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Bóc tách & Tải về kho đề</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
