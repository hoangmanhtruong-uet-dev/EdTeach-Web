"use client";

import React, { useState } from "react";
import { Lock, Eye, EyeOff, AlertCircle, Loader2, X, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export interface ReAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
  actionLabel?: string;
  isDanger?: boolean;
  userEmail?: string;
  isOAuthOnly?: boolean;
}

export function ReAuthModal({
  isOpen,
  onClose,
  onSuccess,
  title = "Xác thực danh tính bảo mật",
  description = "Vì lý do an toàn, vui lòng nhập mật khẩu hiện tại của Thầy/Cô để tiếp tục thực hiện hành động này.",
  actionLabel = "Xác nhận",
  isDanger = false,
  userEmail,
  isOAuthOnly = false,
}: ReAuthModalProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // If OAuth user without traditional password
    if (isOAuthOnly) {
      onSuccess();
      onClose();
      return;
    }

    if (!password.trim()) {
      setErrorMsg("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      if (!userEmail) {
        throw new Error("Không tìm thấy thông tin email đăng nhập.");
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: password.trim(),
      });

      if (error) {
        throw new Error("Mật khẩu không chính xác. Vui lòng kiểm tra lại.");
      }

      setPassword("");
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Xác thực thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                isDanger
                  ? "bg-destructive/10 text-destructive"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {isDanger ? <ShieldAlert className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">{title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{userEmail}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {!isOAuthOnly ? (
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Mật khẩu hiện tại
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoFocus
                  required
                  disabled={loading}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 pr-10 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 transition cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-700 dark:text-blue-300">
              Tài khoản đang đăng nhập qua Google OAuth. Nhấn xác nhận để tiếp tục hành động.
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted transition cursor-pointer disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold text-white transition shadow-xs cursor-pointer disabled:opacity-50 ${
                isDanger
                  ? "bg-destructive hover:bg-destructive/90"
                  : "bg-primary hover:bg-primary/90"
              }`}
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{loading ? "Đang xác thực…" : actionLabel}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
