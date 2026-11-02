"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  Sun,
  Moon,
  Search,
  Sparkles,
  Crown,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { getUserWallet } from "@/lib/api/wallet";
import { isMaxUser, isProUser } from "@/lib/payment/plans";
import { CommandPalette } from "@/components/navigation/command-palette";
import { FeedbackModal } from "@/components/feedback/feedback-modal";
import { SidebarProvider, useSidebar } from "./sidebar-provider";
import { DashboardSidebar } from "./dashboard-sidebar";

function DashboardShellContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const { isCollapsed, toggleMobile } = useSidebar();

  const [credits, setCredits] = useState<number | null>(null);
  const [isDark, setIsDark] = useState(false);

  const isMax = isMaxUser(profile) || isMaxUser(user);
  const isPro = isProUser(profile) || isProUser(user);

  useEffect(() => {
    if (profile?.role === "student") {
      router.replace("/student/exams");
    }
  }, [profile?.role, router]);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    try {
      if (nextDark) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("app_theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("app_theme", "light");
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    async function loadWallet() {
      try {
        const wallet = await getUserWallet();
        if (wallet) {
          setCredits(wallet.balance);
        }
      } catch (err) {
        console.error("Failed to load wallet balance", err);
      }
    }
    if (user) {
      loadWallet();
    }

    try {
      const savedTheme = localStorage.getItem("app_theme") || "system";
      let darkModeActive = false;
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
        darkModeActive = true;
      } else if (savedTheme === "light") {
        document.documentElement.classList.remove("dark");
        darkModeActive = false;
      } else {
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
          document.documentElement.classList.add("dark");
          darkModeActive = true;
        } else {
          document.documentElement.classList.remove("dark");
          darkModeActive = false;
        }
      }
      setIsDark(darkModeActive);
    } catch {
      // ignore
    }
  }, [user]);

  // Các trang editor toàn màn hình chuyên biệt
  const isEditorRoute =
    pathname === "/exams/create" ||
    (pathname.startsWith("/exams/") && pathname !== "/exams");

  if (isEditorRoute) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-white text-slate-900 [color-scheme:light]">
        {children}
      </div>
    );
  }

  return (
    <div
      style={{ "--sidebar-w": isCollapsed ? "72px" : "280px" } as React.CSSProperties}
      className="flex h-screen bg-background text-foreground overflow-hidden"
    >
      {/* Sidebar Component */}
      <DashboardSidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0 transition-all duration-200 ease-in-out motion-reduce:transition-none">
        {/* Top bar Header */}
        <header className="flex h-16 items-center gap-3 border-b border-border bg-card px-4 lg:px-6 shrink-0 z-10">
          {/* Mobile hamburger trigger */}
          <button
            type="button"
            onClick={toggleMobile}
            aria-label="Mở thanh điều hướng"
            className="flex h-10 w-10 min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted transition-colors shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary lg:hidden cursor-pointer"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="flex-1" />

          {/* Zalo Beta Community Button */}
          <a
            href="https://zalo.me/g/e6xf6xhazoa18qiodfxr"
            target="_blank"
            rel="noopener noreferrer"
            title="Tham gia nhóm Zalo hỗ trợ thử nghiệm EdTeach v2.0.0"
            className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60 dark:hover:bg-emerald-900/40 border border-emerald-300/60 px-3 py-1.5 text-xs font-semibold transition-colors mr-1 shadow-2xs"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
            <span>Nhóm Zalo Beta v2.0</span>
          </a>

          {/* Command Palette Quick Launcher */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("open-command-palette"))}
            aria-label="Mở Thanh Lệnh Toàn Năng (Ctrl+K)"
            title="Tìm kiếm đề thi & chuyển trang nhanh (Ctrl+K)"
            className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 min-h-[36px] text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary mr-1"
          >
            <Search className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Tìm kiếm…</span>
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.2 text-[10px] font-mono text-muted-foreground">
              Ctrl K
            </kbd>
          </button>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Chuyển sang giao diện ${isDark ? "Sáng" : "Tối"}`}
            title={`Giao diện ${isDark ? "Tối (Bấm để chuyển Sáng)" : "Sáng (Bấm để chuyển Tối)"}`}
            className="flex h-10 w-10 min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-amber-400" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4 text-slate-600" aria-hidden="true" />
            )}
          </button>

          {/* PRO/MAX status badge */}
          {isMax ? (
            <span className="flex items-center gap-1.5 rounded-full bg-linear-to-r from-amber-500 to-amber-600 px-3 py-1.5 text-xs font-black text-white shadow-xs">
              <Crown className="h-3.5 w-3.5" aria-hidden="true" />
              <span>GÓI MAX</span>
            </span>
          ) : isPro ? (
            <span className="flex items-center gap-1.5 rounded-full bg-linear-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>GÓI PRO</span>
            </span>
          ) : (
            <Link
              href="/settings?tab=plan"
              aria-label="Nâng cấp gói Giáo Viên PRO"
              className="flex items-center gap-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60 dark:hover:bg-amber-900/40 border border-amber-300 px-3 py-1.5 text-xs font-bold transition-colors shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
              <span>Nâng cấp PRO</span>
            </Link>
          )}

          {/* Credits badge */}
          <Link
            href="/settings?tab=credits"
            aria-label="Quản lý ví và số dư credits"
            className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Wallet className="h-4 w-4" aria-hidden="true" />
            <span className="tabular-nums">
              {credits !== null
                ? `${new Intl.NumberFormat("vi-VN").format(credits)} credits`
                : "Đang tải…"}
            </span>
          </Link>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>

        <CommandPalette />
        <FeedbackModal />
      </div>
    </div>
  );
}

export function DashboardShell({
  children,
  initialCollapsed = false,
}: {
  children: React.ReactNode;
  initialCollapsed?: boolean;
}) {
  return (
    <SidebarProvider initialCollapsed={initialCollapsed}>
      <DashboardShellContent>{children}</DashboardShellContent>
    </SidebarProvider>
  );
}
