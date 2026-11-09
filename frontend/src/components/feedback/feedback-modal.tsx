"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  MessageSquarePlus,
  X,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  HelpCircle,
  FileQuestion,
  ScanLine,
  CreditCard,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";

interface FeedbackModalProps {
  defaultOpen?: boolean;
}

export function FeedbackModal({ defaultOpen = false }: FeedbackModalProps) {
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [category, setCategory] = useState("feature_request");
  const [content, setContent] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen]);

  const categories = [
    { id: "feature_request", label: "Góp ý tính năng mới", icon: Sparkles },
    { id: "exam_error", label: "Báo lỗi đề / công thức", icon: FileQuestion },
    { id: "omr_error", label: "Báo lỗi chấm OMR", icon: ScanLine },
    { id: "payment_issue", label: "Sự cố nạp điểm / gói", icon: CreditCard },
    { id: "other", label: "Ý kiến khác", icon: HelpCircle },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          content: content.trim(),
          email: email.trim() || user?.email,
          pageUrl: typeof window !== "undefined" ? window.location.href : pathname,
          metadata: {
            pathname,
            role: profile?.role || "teacher",
            userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Không thể gửi góp ý.");
        return;
      }

      setSubmitted(true);
      setContent("");
      setTimeout(() => {
        setSubmitted(false);
        setIsOpen(false);
      }, 2500);
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi kết nối khi gửi phản hồi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Pill */}
      <div className="fixed bottom-5 right-5 z-40 print:hidden">
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-slate-900/90 hover:bg-slate-900 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 backdrop-blur-md shadow-xl border border-slate-700/50 text-xs font-bold transition-all hover:scale-105 cursor-pointer"
          title="Góp ý tính năng & Báo lỗi cho đội ngũ kỹ thuật"
        >
          <MessageSquarePlus className="w-4 h-4 text-emerald-400 dark:text-white group-hover:rotate-12 transition-transform" />
          <span className="hidden sm:inline">Góp ý & Báo lỗi</span>
        </button>
      </div>

      {/* Feedback Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-modal-title"
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 space-y-5"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shadow-xs">
                  <MessageSquarePlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="feedback-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                    Hòm Thư Góp Ý & Báo Lỗi
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Phản hồi của Thầy/Cô và các bạn giúp EduTest hoàn thiện hơn!
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Đóng hòm thư góp ý"
                className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 flex items-center justify-center transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Zalo Beta Community Banner */}
            <a
              href="https://zalo.me/g/e6xf6xhazoa18qiodfxr"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-emerald-500/10 border border-blue-500/30 hover:border-blue-500/60 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                  Zalo
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Nhóm Zalo Hỗ Trợ Giáo Viên v2.0.0
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Trao đổi trực tiếp với Admin & giải đáp kỹ thuật tức thì
                  </div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </a>

            {submitted ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-white">
                  Cảm ơn bạn rất nhiều!
                </div>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Đội ngũ phát triển EduTest đã tiếp nhận và sẽ xem xét xử lý ngay trong ngày.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Category Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Chủ đề phản hồi:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = category === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategory(cat.id)}
                          className={`p-2 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                            isSelected
                              ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                              : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nội dung chi tiết:
                  </label>
                  <textarea
                    rows={4}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Mô tả cụ thể tính năng bạn mong muốn hoặc tình huống lỗi gặp phải..."
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    required
                  />
                </div>

                {/* Email (Optional) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Email liên hệ lại (Tùy chọn):
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={user?.email || "email@example.com"}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {errorMsg && (
                  <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Submit button */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 transition cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !content.trim()}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang gửi...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Gửi phản hồi</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
