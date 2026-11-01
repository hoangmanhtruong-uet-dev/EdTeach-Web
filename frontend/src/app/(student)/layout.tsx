"use client";

import { FeedbackModal } from '@/components/feedback/feedback-modal';

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  LayoutDashboard,
  FileText,
  BarChart3,
  Zap,
  FlaskConical,
  Flame,
  LogOut,
  Sun,
  Moon,
  ArrowLeft,
  User,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";

const studentNavLinks = [
  { href: "/student", label: "Trang chủ", icon: LayoutDashboard },
  { href: "/student/exams", label: "Phòng thi", icon: FileText },
  { href: "/student/progress", label: "Hồ sơ năng lực", icon: BarChart3 },
  { href: "/student/practice", label: "Luyện bù lỗ hổng", icon: Zap },
  { href: "/student/labs", label: "Phòng TN 3D", icon: FlaskConical },
];

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();
  const [isDark, setIsDark] = useState(false);

  const isTeacherPreview =
    profile?.role === "teacher" || profile?.role === "tutor";

  const studentName = profile?.name || profile?.full_name || user?.email?.split("@")[0] || "Học Sinh";

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans">
      {/* 1. TEACHER PREVIEW MODE BANNER */}
      {isTeacherPreview && (
        <div className="bg-linear-to-r from-amber-500 via-orange-500 to-amber-600 text-white px-4 py-2 text-xs font-bold shadow-md flex items-center justify-between z-50">
          <div className="flex items-center gap-2 max-w-2xl truncate">
            <span>👨‍🏫</span>
            <span>
              Thầy Cô đang ở <strong>Chế Độ Xem Thử (Preview Mode)</strong> dưới góc nhìn của Học Sinh.
            </span>
          </div>
          <Link
            href="/dashboard"
            className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-bold backdrop-blur-xs transition shrink-0 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại Bục Giảng Số</span>
          </Link>
        </div>
      )}

      {/* 2. TOP NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/student" className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                Edu<span className="text-emerald-600 dark:text-emerald-400">Test</span> AI
              </span>
              <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Cổng Học Sinh
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {studentNavLinks.map((link) => {
              const isActive =
                link.href === "/student"
                  ? pathname === "/student"
                  : pathname.startsWith(link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold shadow-2xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Header: Streak & Profile */}
        <div className="flex items-center gap-3">
          {/* Streak Counter Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800 text-xs font-black text-orange-600 dark:text-orange-400 shadow-2xs">
            <Flame className="w-4 h-4 fill-orange-500 text-orange-500 animate-pulse" />
            <span>4 Ngày Học</span>
          </div>

          {/* User Profile Pill */}
          <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200">
            <User className="w-3.5 h-3.5 text-slate-500" />
            <span className="truncate max-w-[120px]">{studentName}</span>
          </div>

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={() => signOut?.()}
            title="Đăng xuất"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 3. MAIN BODY CONTAINER */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12">
        {children}
      </main>

      {/* 4. MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-2 flex items-center justify-around shadow-lg">
        {studentNavLinks.map((link) => {
          const isActive =
            link.href === "/student"
              ? pathname === "/student"
              : pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all ${
                isActive
                  ? "text-emerald-600 dark:text-emerald-400 font-extrabold"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
      <FeedbackModal />
    </div>
  );
}
