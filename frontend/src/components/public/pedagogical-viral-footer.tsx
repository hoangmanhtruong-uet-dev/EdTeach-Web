"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Sparkles, ShieldCheck, ArrowRight, BookOpen, Gift } from "lucide-react";
import { REFERRAL_BONUS_CREDITS } from "@/lib/constants";

interface PedagogicalViralFooterProps {
  teacherName?: string;
  teacherSchool?: string;
  teacherSubject?: string;
  isVerified?: boolean;
  referralCode?: string;
}

export function PedagogicalViralFooter({
  teacherName = "Thầy Cô",
  teacherSchool,
  teacherSubject,
  isVerified = true,
  referralCode = "EDUTEST2026",
}: PedagogicalViralFooterProps) {
  // Ghi nhận referral_code vào Cookie và LocalStorage (lưu trữ 30 ngày)
  useEffect(() => {
    if (referralCode && typeof window !== "undefined") {
      try {
        localStorage.setItem("edutest_ref_code", referralCode);
        const maxAge = 30 * 24 * 60 * 60; // 30 ngày
        document.cookie = `edutest_ref_code=${referralCode}; path=/; max-age=${maxAge}; SameSite=Lax`;
      } catch (err) {
        console.warn("Could not save referral tracking:", err);
      }
    }
  }, [referralCode]);

  const registerUrl = `/register?ref=${encodeURIComponent(referralCode)}`;

  return (
    <footer className="w-full mt-12 mb-6 border-t border-slate-200/80 dark:border-slate-800/80 pt-8 px-4">
      <div className="max-w-4xl mx-auto rounded-3xl bg-linear-to-br from-indigo-50/90 via-sky-50/60 to-purple-50/70 dark:from-slate-900/90 dark:via-indigo-950/40 dark:to-purple-950/40 backdrop-blur-xl border border-indigo-100/80 dark:border-indigo-900/40 p-6 sm:p-8 shadow-xl shadow-indigo-500/5 relative overflow-hidden">
        {/* Glowing Ambient Background Orb */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-indigo-400/10 dark:bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-purple-400/10 dark:bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left Block: Teacher Credential & Certification */}
          <div className="space-y-3 text-center md:text-left flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 dark:bg-slate-800/80 border border-indigo-200/60 dark:border-indigo-800/60 text-xs font-semibold text-indigo-700 dark:text-indigo-300 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Bảo chứng sư phạm số bởi EduTest AI</span>
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-center md:justify-start gap-2 flex-wrap">
                <span>Biên soạn: {teacherName}</span>
                {isVerified && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                    <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    Thẻ ngành đã xác thực
                  </span>
                )}
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                {teacherSubject ? `Bộ môn ${teacherSubject}` : "Giáo viên chuyên môn GDPT 2025"}
                {teacherSchool ? ` • ${teacherSchool}` : ""}
              </p>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed">
              Phiếu đánh giá năng lực & bài tập củng cố được thực hiện trên nền tảng{" "}
              <strong className="text-indigo-600 dark:text-indigo-400 font-semibold">
                EduTest AI — Tutor OS
              </strong>
              . Trợ lý đắc lực cho Thầy Cô và Gia sư thế hệ mới.
            </p>
          </div>

          {/* Right Block: Viral Colleague CTA */}
          <div className="flex flex-col sm:flex-row md:flex-col items-center gap-3 w-full md:w-auto shrink-0">
            <Link
              href={registerUrl}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-linear-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35 transition-all hover:scale-[1.02] active:scale-[0.98] group text-center"
            >
              <Gift className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
              <span>Dành cho Đồng Nghiệp: Nhận {REFERRAL_BONUS_CREDITS.toLocaleString("vi-VN")} Credits</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <span className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
              Soạn đề chuẩn GDPT • Chấm OMR 0.5s • Báo cáo Zalo 1-click
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
