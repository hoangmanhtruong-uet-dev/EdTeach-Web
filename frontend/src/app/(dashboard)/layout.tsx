"use client";

import { FeedbackModal } from '@/components/feedback/feedback-modal';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  LayoutDashboard,
  FilePlus,
  FolderOpen,
  Wallet,
  User,
  LogOut,
  Menu,
  X,
  ScanLine,
  Sparkles,
  Crown,
  HelpCircle,
  FlaskConical,
  Presentation,
  Store,
  Sun,
  Moon,
  Search,
  Gift,
} from "lucide-react";
import { useState, useEffect, Suspense, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { getUserWallet } from "@/lib/api/wallet";
import { isMaxUser, isProUser } from "@/lib/payment/plans";
import { CommandPalette } from "@/components/navigation/command-palette";

const sidebarLinks = [
  { href: "/dashboard", label: "Trang chủ", icon: LayoutDashboard },
  { href: "/exams/create", label: "Soạn đề", icon: FilePlus },
  { href: "/exams", label: "Đề thi của tôi", icon: FolderOpen },
  { href: "/grading", label: "Chấm trắc nghiệm", icon: ScanLine },
  { href: "/labs", label: "Phòng TN 3D", icon: FlaskConical },
  { href: "/whiteboard", label: "Bảng trắng", icon: Presentation },
  { href: "/marketplace", label: "Chợ đề thi", icon: Store },
  { href: "/pricing", label: "Gói cước PRO", icon: Crown },
  { href: "/affiliate", label: "Đối tác & Hoa hồng", icon: Gift },
  { href: "/wallet", label: "Nạp điểm", icon: Wallet },
  { href: "/guide", label: "Hướng dẫn", icon: HelpCircle },
  { href: "/settings", label: "Cài đặt", icon: User },
];

function NavLinks({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Điều hướng chính">
      {sidebarLinks.map((link) => {
        const isActive =
          pathname === link.href ||
          (link.href !== "/dashboard" && pathname.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            aria-current={isActive ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary ${
              isActive
                ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800/60 shadow-2xs"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            }`}
          >
            <link.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function DashboardLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, profile, signOut } = useAuth();

  useEffect(() => {
    if (profile?.role === "student") {
      router.replace("/student/exams");
    }
  }, [profile?.role, router]);
  const [credits, setCredits] = useState<number | null>(null);
  const [isDark, setIsDark] = useState(false);

  const isMax = isMaxUser(profile) || isMaxUser(user);
  const isPro = isProUser(profile) || isProUser(user);

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

  // Close sidebar on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && sidebarOpen) {
        setSidebarOpen(false);
      }
    },
    [sidebarOpen]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

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

    // Khởi tạo theme từ localStorage
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

  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "GV";

  const pathname = usePathname();
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
    <div className="flex h-screen bg-background text-foreground">
      {/* Mobile overlay with keyboard accessible button */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Đóng thanh điều hướng"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden border-0 cursor-default transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        aria-label="Thanh điều hướng bên"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo & Version */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
            >
              <BookOpen className="h-7 w-7 text-primary shrink-0" aria-hidden="true" />
              <div className="flex flex-col min-w-0">
                <span className="text-lg font-bold leading-tight truncate">
                  Edu<span className="text-primary">Test</span> AI
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground truncate">
                  v1.0.0 (GDPT 2025)
                </span>
              </div>
            </Link>
            <Link
              href="/updates"
              title="Khám phá lộ trình bản chính thức v2.0.0"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 px-2 py-1 min-h-[28px] text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 transition-colors shrink-0"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" aria-hidden="true" />
              v2.0
            </Link>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Đóng thanh điều hướng"
            className="flex h-10 w-10 min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted transition-colors shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary lg:hidden"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Nav links wrapped in Suspense */}
        <Suspense fallback={<div className="flex-1 p-3" />}>
          <NavLinks onClose={() => setSidebarOpen(false)} />
        </Suspense>

        {/* User section */}
        <div className="mt-auto border-t border-border p-3 pb-6 bg-card/50">
          <div className="flex items-center gap-3 rounded-lg px-2.5 py-2 min-w-0">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar tài khoản"
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-cover border border-primary/30 shrink-0"
              />
            ) : (
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary shrink-0"
                aria-hidden="true"
              >
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex items-center justify-between gap-1.5 min-w-0">
                <p
                  className="truncate text-sm font-medium text-foreground"
                  title={profile?.name || user?.email || "Giáo viên"}
                >
                  {profile?.name || user?.email || "Giáo viên"}
                </p>
                {isMax ? (
                  <span className="shrink-0 rounded bg-amber-500 text-white px-1.5 py-0.5 text-[10px] font-black shadow-xs flex items-center gap-0.5">
                    <Crown className="w-2.5 h-2.5" aria-hidden="true" /> MAX
                  </span>
                ) : isPro ? (
                  <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary border border-primary/20">
                    PRO
                  </span>
                ) : (
                  <span className="shrink-0 rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    Free
                  </span>
                )}
              </div>
              <p
                className="truncate text-xs text-muted-foreground"
                title={user?.email || ""}
              >
                {user?.email || ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => signOut()}
            aria-label="Đăng xuất khỏi tài khoản"
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-destructive"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center gap-3 border-b border-border bg-card px-4 lg:px-6">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Mở thanh điều hướng"
            className="flex h-10 w-10 min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted transition-colors shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary lg:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="flex-1" />

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

          {/* Theme Toggle Button (Light / Dark) */}
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

          {/* PRO/MAX status badge or upgrade pill */}
          {isMax ? (
            <span className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-1.5 text-xs font-black text-white shadow-xs">
              <Crown className="h-3.5 w-3.5" aria-hidden="true" />
              <span>GÓI MAX</span>
            </span>
          ) : isPro ? (
            <span className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>GÓI PRO</span>
            </span>
          ) : (
            <Link
              href="/wallet?plan=pro"
              aria-label="Nâng cấp gói Giáo Viên PRO"
              className="flex items-center gap-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60 dark:hover:bg-amber-900/40 border border-amber-300 px-3 py-1.5 text-xs font-bold transition-colors shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
              <span>Nâng cấp PRO</span>
            </Link>
          )}

          {/* Credits badge */}
          <Link
            href="/wallet"
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

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      <CommandPalette />
      <FeedbackModal />
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="h-screen w-screen bg-background" />}>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </Suspense>
  );
}
