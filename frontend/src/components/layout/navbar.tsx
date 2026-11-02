"use client";

import Link from "next/link";
import { BookOpen, LogIn, Menu, X, Sparkles, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md shadow-2xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <Link href="/" className="flex items-center gap-2 py-1">
            <BookOpen className="h-7 w-7 text-blue-600 dark:text-blue-500" />
            <span className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">
              Edu<span className="text-blue-600 dark:text-blue-400">Test</span> AI
            </span>
          </Link>
          <Link
            href="/updates"
            title="Khám phá lộ trình bản v2.0.0"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-slate-900 border border-slate-700/80 px-2.5 py-1 min-h-[28px] text-[11px] font-black uppercase tracking-wider text-amber-300 hover:text-white hover:border-blue-400 transition-all shadow-xs"
          >
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            v1.0 ➔ v2.0
          </Link>
        </div>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/#features"
            className="text-sm font-semibold text-slate-600 dark:text-slate-300 transition-colors hover:text-slate-950 dark:hover:text-white px-2 py-1.5 rounded-lg hover:bg-slate-100/70 dark:hover:bg-slate-850"
          >
            Tính năng
          </Link>
          <Link
            href="/#pricing"
            className="text-sm font-semibold text-slate-600 dark:text-slate-300 transition-colors hover:text-slate-950 dark:hover:text-white px-2 py-1.5 rounded-lg hover:bg-slate-100/70 dark:hover:bg-slate-850"
          >
            Bảng giá
          </Link>
          <Link
            href="/updates"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 px-3 py-1.5 min-h-[32px] rounded-full transition-all shadow-xs hover:border-blue-300"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
            <span>Lộ trình v2.0</span>
          </Link>
          {user ? (
            <Link
              href="/dashboard"
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white transition-all hover:bg-blue-700 shadow-xs"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>{profile?.name || "Vào Dashboard"}</span>
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 text-sm font-bold text-slate-800 dark:text-slate-200 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-400"
              >
                <LogIn className="h-4 w-4" />
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="inline-flex h-9 items-center rounded-xl bg-blue-600 px-4 text-sm font-bold text-white transition-all hover:bg-blue-700 shadow-xs"
              >
                Dùng thử miễn phí
              </Link>
            </>
          )}
        </nav>

        {/* Mobile toggle */}
        <button
          className="inline-flex h-10 w-10 min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "overflow-hidden border-t border-slate-200 dark:border-slate-800 transition-all duration-200 md:hidden bg-white/98 dark:bg-slate-950/98 shadow-md",
          mobileOpen ? "max-h-96" : "max-h-0 border-t-0"
        )}
      >
        <div className="flex flex-col gap-2 px-4 py-4">
          <Link
            href="/#features"
            onClick={() => setMobileOpen(false)}
            className="flex items-center min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors"
          >
            Tính năng
          </Link>
          <Link
            href="/#pricing"
            onClick={() => setMobileOpen(false)}
            className="flex items-center min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors"
          >
            Bảng giá
          </Link>
          <Link
            href="/updates"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 shadow-2xs"
          >
            <Sparkles className="h-4 w-4 text-amber-500 fill-amber-500 shrink-0" />
            <span>Khám phá Lộ trình v2.0 (Chính thức)</span>
          </Link>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
            {user ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex h-11 min-h-[44px] items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white shadow-md shadow-blue-500/20"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Vào Dashboard ({profile?.name || user.email})</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-11 min-h-[44px] items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-slate-800 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-850"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-11 min-h-[44px] items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-md shadow-blue-500/20"
                >
                  Dùng thử miễn phí
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
