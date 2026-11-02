"use client";

import React, { createContext, useContext, useState, useRef, useCallback, useEffect, ReactNode } from "react";
import { AlertTriangle, AlertCircle, Info, CheckCircle2, HelpCircle, X } from "lucide-react";

export interface ConfirmOptions {
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info" | "primary";
}

export interface PromptOptions {
  title: string;
  message?: React.ReactNode;
  defaultValue?: string;
  placeholder?: string;
  inputType?: "text" | "number" | "url";
  confirmText?: string;
  cancelText?: string;
  variant?: "primary" | "danger" | "warning";
  required?: boolean;
}

export interface AlertModalOptions {
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  variant?: "info" | "warning" | "danger" | "success";
}

interface DialogState {
  type: "confirm" | "prompt" | "alert";
  confirmOptions?: ConfirmOptions;
  promptOptions?: PromptOptions;
  alertOptions?: AlertModalOptions;
}

export interface ConfirmDialogContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  promptModal: (options: PromptOptions) => Promise<string | null>;
  alertModal: (options: AlertModalOptions) => Promise<void>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | undefined>(undefined);

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [dialogState, setDialogState] = useState<DialogState | null>(null);
  const [promptInput, setPromptInput] = useState<string>("");
  const [promptError, setPromptError] = useState<string | null>(null);

  const resolverRef = useRef<((value: any) => void) | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialogState({ type: "confirm", confirmOptions: options });
    });
  }, []);

  const promptModal = useCallback((options: PromptOptions): Promise<string | null> => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setPromptInput(options.defaultValue || "");
      setPromptError(null);
      setDialogState({ type: "prompt", promptOptions: options });
    });
  }, []);

  const alertModal = useCallback((options: AlertModalOptions): Promise<void> => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialogState({ type: "alert", alertOptions: options });
    });
  }, []);

  const handleClose = useCallback(() => {
    if (!dialogState) return;
    if (resolverRef.current) {
      if (dialogState.type === "confirm") {
        resolverRef.current(false);
      } else if (dialogState.type === "prompt") {
        resolverRef.current(null);
      } else {
        resolverRef.current(undefined);
      }
      resolverRef.current = null;
    }
    setDialogState(null);
    setPromptInput("");
    setPromptError(null);
  }, [dialogState]);

  const handleConfirmAction = useCallback(() => {
    if (!dialogState) return;

    if (dialogState.type === "confirm") {
      if (resolverRef.current) {
        resolverRef.current(true);
        resolverRef.current = null;
      }
      setDialogState(null);
    } else if (dialogState.type === "prompt") {
      const opts = dialogState.promptOptions;
      if (opts?.required && !promptInput.trim()) {
        setPromptError("Vui lòng không để trống trường này.");
        inputRef.current?.focus();
        return;
      }
      if (resolverRef.current) {
        resolverRef.current(promptInput);
        resolverRef.current = null;
      }
      setDialogState(null);
      setPromptInput("");
      setPromptError(null);
    } else if (dialogState.type === "alert") {
      if (resolverRef.current) {
        resolverRef.current(undefined);
        resolverRef.current = null;
      }
      setDialogState(null);
    }
  }, [dialogState, promptInput]);

  // Focus input when prompt dialog appears
  useEffect(() => {
    if (dialogState?.type === "prompt") {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [dialogState]);

  // Escape to cancel & Enter to confirm for single prompts
  useEffect(() => {
    if (!dialogState) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      } else if (e.key === "Enter" && dialogState.type === "prompt") {
        e.preventDefault();
        handleConfirmAction();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dialogState, handleClose, handleConfirmAction]);

  const renderIcon = (variant?: string) => {
    switch (variant) {
      case "danger":
        return (
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        );
      case "warning":
        return (
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
        );
      case "success":
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        );
      case "info":
      case "primary":
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
        );
    }
  };

  const getConfirmButtonClasses = (variant?: string) => {
    switch (variant) {
      case "danger":
        return "bg-red-600 hover:bg-red-700 text-white shadow-xs focus-visible:ring-red-500";
      case "warning":
        return "bg-amber-600 hover:bg-amber-700 text-white shadow-xs focus-visible:ring-amber-500";
      case "success":
        return "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs focus-visible:ring-emerald-500";
      case "primary":
      default:
        return "bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs focus-visible:ring-primary";
    }
  };

  return (
    <ConfirmDialogContext.Provider value={{ confirm, promptModal, alertModal }}>
      {children}

      {dialogState && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overscroll-contain animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div className="bg-white dark:bg-[#18181b] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 relative text-left transition-all animate-in zoom-in-95 duration-150">
            {/* Close X Button */}
            <button
              type="button"
              onClick={handleClose}
              className="absolute right-4 top-4 p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              aria-label="Đóng hộp thoại"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header with Icon and Title */}
            <div className="flex items-start gap-3 mb-3 pr-6">
              {renderIcon(
                dialogState.type === "confirm"
                  ? dialogState.confirmOptions?.variant
                  : dialogState.type === "prompt"
                  ? dialogState.promptOptions?.variant
                  : dialogState.alertOptions?.variant
              )}
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-base text-foreground leading-snug">
                  {dialogState.type === "confirm"
                    ? dialogState.confirmOptions?.title
                    : dialogState.type === "prompt"
                    ? dialogState.promptOptions?.title
                    : dialogState.alertOptions?.title}
                </h3>
              </div>
            </div>

            {/* Message Body */}
            <div className="text-sm text-neutral-600 dark:text-neutral-300 mb-4 leading-relaxed whitespace-pre-line">
              {dialogState.type === "confirm"
                ? dialogState.confirmOptions?.message
                : dialogState.type === "prompt"
                ? dialogState.promptOptions?.message
                : dialogState.alertOptions?.message}
            </div>

            {/* Prompt Input Field */}
            {dialogState.type === "prompt" && (
              <div className="mb-5">
                <input
                  ref={inputRef}
                  type={dialogState.promptOptions?.inputType || "text"}
                  value={promptInput}
                  placeholder={dialogState.promptOptions?.placeholder || ""}
                  onChange={(e) => {
                    setPromptInput(e.target.value);
                    if (promptError) setPromptError(null);
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-neutral-50 dark:bg-neutral-900 text-foreground placeholder:text-neutral-400 focus:outline-none focus:ring-2 transition ${
                    promptError
                      ? "border-red-500 focus:ring-red-400"
                      : "border-neutral-200 dark:border-neutral-700 focus:ring-primary"
                  }`}
                />
                {promptError && (
                  <p className="text-xs text-red-500 mt-1 font-medium">{promptError}</p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end items-center gap-2.5 pt-2">
              {dialogState.type !== "alert" && (
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                >
                  {dialogState.type === "confirm"
                    ? dialogState.confirmOptions?.cancelText || "Hủy bỏ"
                    : dialogState.promptOptions?.cancelText || "Hủy bỏ"}
                </button>
              )}
              <button
                type="button"
                onClick={handleConfirmAction}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 ${getConfirmButtonClasses(
                  dialogState.type === "confirm"
                    ? dialogState.confirmOptions?.variant
                    : dialogState.type === "prompt"
                    ? dialogState.promptOptions?.variant
                    : dialogState.alertOptions?.variant
                )}`}
              >
                {dialogState.type === "confirm"
                  ? dialogState.confirmOptions?.confirmText || "Xác nhận"
                  : dialogState.type === "prompt"
                  ? dialogState.promptOptions?.confirmText || "Đồng ý"
                  : dialogState.alertOptions?.confirmText || "Đã hiểu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error("useConfirmDialog must be used within a ConfirmDialogProvider");
  }
  return context;
}

// Convenient alias
export const useConfirm = useConfirmDialog;
