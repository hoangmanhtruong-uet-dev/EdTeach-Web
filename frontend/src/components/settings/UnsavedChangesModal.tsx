"use client";

import React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

interface UnsavedChangesModalProps {
  isOpen: boolean;
  saving?: boolean;
  onStay: () => void;
  onDiscard: () => void;
  onSave: () => void;
}

export function UnsavedChangesModal({
  isOpen,
  saving = false,
  onStay,
  onDiscard,
  onSave,
}: UnsavedChangesModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="unsaved-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-card text-card-foreground border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 id="unsaved-modal-title" className="text-base font-bold text-foreground mb-1.5">
          Bạn có thay đổi chưa lưu
        </h3>

        <p className="text-xs text-muted-foreground leading-relaxed mb-6">
          Các thông tin bạn vừa chỉnh sửa chưa được lưu. Nếu chuyển trang ngay bây giờ, những thay đổi này sẽ bị mất.
        </p>

        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onStay}
            disabled={saving}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-xl border border-border hover:bg-muted transition cursor-pointer text-foreground"
          >
            Ở lại
          </button>
          <button
            type="button"
            onClick={onDiscard}
            disabled={saving}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-xl text-destructive hover:bg-destructive/10 transition cursor-pointer"
          >
            Bỏ thay đổi
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{saving ? "Đang lưu…" : "Lưu thay đổi"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default UnsavedChangesModal;
