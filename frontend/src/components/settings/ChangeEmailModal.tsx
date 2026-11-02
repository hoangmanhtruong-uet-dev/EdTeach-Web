"use client";

import React, { useState } from "react";
import { X, Mail, ShieldAlert, CheckCircle2, Loader2, ArrowRight, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ChangeEmailModalProps {
  currentEmail: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccessToast?: (msg: string) => void;
}

export function ChangeEmailModal({
  currentEmail,
  isOpen,
  onClose,
  onSuccessToast,
}: ChangeEmailModalProps) {
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [step, setStep] = useState<"input" | "sent">("input");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNew = newEmail.trim().toLowerCase();

    if (!cleanNew || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanNew)) {
      setErrorMsg("Vui lòng nhập địa chỉ email hợp lệ.");
      return;
    }

    if (cleanNew === currentEmail.toLowerCase()) {
      setErrorMsg("Địa chỉ email mới phải khác với email hiện tại.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser(
        { email: cleanNew },
        { emailRedirectTo: `${window.location.origin}/settings?tab=account&section=profile` }
      );

      if (error) {
        throw error;
      }

      setStep("sent");
      onSuccessToast?.("Đã gửi yêu cầu đổi email! Vui lòng kiểm tra hòm thư mới.");
    } catch (err: any) {
      console.error("Change email error:", err);
      setErrorMsg(err.message || "Không thể gửi yêu cầu đổi email. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNewEmail("");
    setErrorMsg(null);
    setStep("input");
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-email-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-card text-card-foreground border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Đóng cửa sổ"
          className="absolute right-4 top-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 id="change-email-title" className="text-base font-bold text-foreground">
              Thay đổi email đăng nhập
            </h3>
            <p className="text-xs text-muted-foreground">
              Quy trình xác minh bảo mật 2 bước
            </p>
          </div>
        </div>

        {step === "input" ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/40 p-3.5 space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                Email hiện tại
              </span>
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{currentEmail}</span>
              </p>
            </div>

            <div>
              <label htmlFor="new-email-input" className="block text-xs font-semibold text-foreground mb-1">
                Địa chỉ email mới
              </label>
              <input
                id="new-email-input"
                type="email"
                required
                value={newEmail}
                onChange={(e) => {
                  setNewEmail(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="VD: thaya@truongchuyen.edu.vn"
                className="block w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Hệ thống sẽ gửi mã hoặc đường link kích hoạt tới hòm thư này.
              </p>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive flex items-center gap-2"
              >
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-800 dark:text-amber-300">
              <p className="font-semibold mb-0.5">Lưu ý an toàn tài khoản:</p>
              <p>Email cũ của Thầy Cô vẫn được dùng để đăng nhập cho đến khi Thầy Cô hoàn tất xác thực email mới.</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-border hover:bg-muted transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5" />
                )}
                <span>{loading ? "Đang gửi…" : "Tiếp tục & Gửi xác nhận"}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 py-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-sm font-bold text-foreground">
                Đã gửi yêu cầu xác minh
              </h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                Hệ thống đã gửi đường link xác nhận đến hòm thư{" "}
                <strong className="text-foreground">{newEmail}</strong>. Vui lòng mở email và bấm xác nhận để hoàn tất.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground space-y-1">
              <p>• Email cảnh báo bảo mật cũng đã được gửi đến: <strong className="text-foreground">{currentEmail}</strong></p>
              <p>• Nếu không tìm thấy, vui lòng kiểm tra mục Thư rác (Spam) hoặc Quảng cáo.</p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2.5 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-xs cursor-pointer"
              >
                Đã hiểu & Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChangeEmailModal;
