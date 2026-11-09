"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  UserCheck,
  Check,
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
} from "lucide-react";

interface RoleOnboardingModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccess?: (role: "teacher" | "tutor" | "student") => void;
}

export function RoleOnboardingModal({
  isOpen,
  onClose,
  onSuccess,
}: RoleOnboardingModalProps) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<"teacher" | "tutor" | "student">("teacher");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirmRole = async () => {
    try {
      setSubmitting(true);
      setErrorMsg(null);

      const res = await fetch("/api/user/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Không thể lưu vai trò.");
        return;
      }

      onSuccess?.(selectedRole);

      // Redirect based on role
      if (selectedRole === "student") {
        router.push("/student");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
      onClose?.();
    } catch (err: any) {
      setErrorMsg(err.message || "Lỗi cập nhật vai trò.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden space-y-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-700 dark:text-indigo-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Chào mừng Thầy Cô & Học Sinh đến với EduTest</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Bạn sử dụng EduTest với vai trò chính là gì?
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Hệ thống sẽ tự động cấu hình không gian làm việc (Workspace) tối ưu nhất, hiển thị đúng những tính năng bạn cần.
          </p>
        </div>

        {/* 3 ROLE CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
          {/* OPTION 1: TEACHER */}
          <div
            onClick={() => setSelectedRole("teacher")}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between text-left relative ${
              selectedRole === "teacher"
                ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-lg shadow-indigo-600/10 scale-[1.02]"
                : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
            }`}
          >
            {selectedRole === "teacher" && (
              <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Check className="w-4 h-4 font-bold" />
              </div>
            )}
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold">
                👨‍🏫
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">Giáo Viên</h4>
                <p className="text-[11px] text-slate-500 font-medium">Trường THCS / THPT</p>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <li className="flex items-center gap-1.5">
                  <span className="text-indigo-600">•</span>
                  <span>Soạn đề GDPT 2025</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-indigo-600">•</span>
                  <span>Bục Giảng Số 4.0</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-indigo-600">•</span>
                  <span>Chấm OMR cả lớp 0.5s</span>
                </li>
              </ul>
            </div>
            <div className="pt-4 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
              Vào Educator Studio →
            </div>
          </div>

          {/* OPTION 2: TUTOR */}
          <div
            onClick={() => setSelectedRole("tutor")}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between text-left relative ${
              selectedRole === "tutor"
                ? "border-purple-600 bg-purple-50/50 dark:bg-purple-950/40 shadow-lg shadow-purple-600/10 scale-[1.02]"
                : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
            }`}
          >
            {selectedRole === "tutor" && (
              <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-xs">
                <Check className="w-4 h-4 font-bold" />
              </div>
            )}
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300 flex items-center justify-center font-bold">
                🎓
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">Gia Sư</h4>
                <p className="text-[11px] text-slate-500 font-medium">Dạy kèm & Trung tâm</p>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <li className="flex items-center gap-1.5">
                  <span className="text-purple-600">•</span>
                  <span>Báo cáo Zalo phụ huynh</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-purple-600">•</span>
                  <span>AI Luyện bù lỗ hổng</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-purple-600">•</span>
                  <span>Watermark thương hiệu</span>
                </li>
              </ul>
            </div>
            <div className="pt-4 text-[11px] font-bold text-purple-600 dark:text-purple-400">
              Vào Educator Studio →
            </div>
          </div>

          {/* OPTION 3: STUDENT */}
          <div
            onClick={() => setSelectedRole("student")}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between text-left relative ${
              selectedRole === "student"
                ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 shadow-lg shadow-emerald-600/10 scale-[1.02]"
                : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
            }`}
          >
            {selectedRole === "student" && (
              <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Check className="w-4 h-4 font-bold" />
              </div>
            )}
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center font-bold">
                🎒
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">Học Sinh</h4>
                <p className="text-[11px] text-slate-500 font-medium">Người làm bài & Tự học</p>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600">•</span>
                  <span>Phòng thi & Nộp bài</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600">•</span>
                  <span>Hồ sơ năng lực 4 cấp độ</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600">•</span>
                  <span>54+ Labs 3D tự học</span>
                </li>
              </ul>
            </div>
            <div className="pt-4 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              Vào Cổng Học Sinh →
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 font-bold text-center">
            {errorMsg}
          </div>
        )}

        {/* ACTION BUTTON */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-400">
            * Bạn có thể đổi lại vai trò bất kỳ lúc nào trong trang Cài đặt.
          </span>

          <button
            type="button"
            disabled={submitting}
            onClick={handleConfirmRole}
            className="px-8 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs sm:text-sm font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>{submitting ? "Đang lưu..." : "Xác Nhận & Bắt Đầu Ngay"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
