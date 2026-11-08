"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  LayoutDashboard,
  FilePlus,
  FolderOpen,
  ScanLine,
  FlaskConical,
  Presentation,
  Store,
  User,
  LogOut,
  Crown,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  Settings,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { isMaxUser, isProUser } from "@/lib/payment/plans";
import { useSidebar } from "./sidebar-provider";

export const sidebarLinks = [
  { href: "/dashboard", label: "Trang chủ", icon: LayoutDashboard },
  { href: "/exams/create", label: "Soạn đề", icon: FilePlus },
  { href: "/exams", label: "Đề thi của tôi", icon: FolderOpen },
  { href: "/grading", label: "Chấm trắc nghiệm", icon: ScanLine },
  { href: "/labs", label: "Phòng TN 3D", icon: FlaskConical },
  { href: "/whiteboard", label: "Bảng trắng", icon: Presentation },
  { href: "/marketplace", label: "Chợ đề thi", icon: Store },
  { href: "/settings", label: "Cài đặt", icon: User },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();
  const {
    isCollapsed,
    isMobileOpen,
    toggleCollapse,
    setMobileOpen,
  } = useSidebar();

  const [accountPopoverOpen, setAccountPopoverOpen] = useState(false);
  const accountPopoverRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const isMax = isMaxUser(profile) || isMaxUser(user);
  const isPro = isProUser(profile) || isProUser(user);

  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "GV";

  // Đóng popover khi bấm ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        accountPopoverRef.current &&
        !accountPopoverRef.current.contains(event.target as Node)
      ) {
        setAccountPopoverOpen(false);
      }
    }
    if (accountPopoverOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [accountPopoverOpen]);

  // Focus trap cho mobile drawer khi mở
  const handleDrawerKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Tab" && drawerRef.current) {
        const focusableEls = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstEl = focusableEls[0];
        const lastEl = focusableEls[focusableEls.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl?.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl?.focus();
          }
        }
      }
    },
    []
  );

  return (
    <>
      {/* 1. MOBILE BACKDROP & DRAWER (<1024px) */}
      {isMobileOpen && (
        <div
          role="presentation"
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity lg:hidden"
        />
      )}

      {/* MOBILE DRAWER */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isMobileOpen}
        aria-label="Thanh điều hướng di động"
        onKeyDown={handleDrawerKeyDown}
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-border bg-card shadow-2xl transition-all duration-300 ease-in-out lg:hidden ${
          isMobileOpen
            ? "translate-x-0 opacity-100 pointer-events-auto visible"
            : "-translate-x-full opacity-0 pointer-events-none invisible"
        }`}
      >
        {/* Mobile Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Link
            href="/dashboard"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
          >
            <BookOpen className="h-7 w-7 text-primary shrink-0" aria-hidden="true" />
            <div className="flex flex-col min-w-0">
              <span className="text-lg font-bold leading-tight truncate">
                Edu<span className="text-primary">Test</span>
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                v2.0.0 Beta (GDPT 2025)
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Đóng thanh điều hướng"
            className="flex h-10 w-10 min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted transition-colors shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Mobile Nav Links */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto overflow-x-hidden p-3" aria-label="Điều hướng di động">
          {sidebarLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/dashboard" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-[44px] items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary ${
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

        {/* Mobile Account Section */}
        <div className="mt-auto border-t border-border p-3.5 pb-6 bg-card/60">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2 min-w-0">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                width={36}
                height={36}
                className="h-9 w-9 rounded-full object-cover border border-primary/30 shrink-0"
              />
            ) : (
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary shrink-0"
                aria-hidden="true"
              >
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex items-center justify-between gap-1.5 min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {profile?.name || user?.email || "Giáo viên"}
                </p>
                {isMax ? (
                  <span className="shrink-0 rounded bg-amber-500 text-white px-1.5 py-0.5 text-[10px] font-black flex items-center gap-0.5">
                    <Crown className="w-2.5 h-2.5" aria-hidden="true" /> MAX
                  </span>
                ) : isPro ? (
                  <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary border border-primary/20">
                    PRO
                  </span>
                ) : (
                  <span className="shrink-0 rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-400">
                    Free
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {user?.email || ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              signOut();
            }}
            className="mt-2 flex w-full min-h-[40px] items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-destructive"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* 2. DESKTOP SIDEBAR (≥1024px) */}
      <aside
        id="dashboard-sidebar"
        aria-label="Thanh điều hướng chính"
        className={`hidden lg:flex flex-col shrink-0 border-r border-border bg-card select-none relative overflow-x-hidden transition-[width] duration-200 ease-in-out motion-reduce:transition-none ${
          isCollapsed ? "w-[72px]" : "w-[280px]"
        }`}
      >
        {/* Top Header: Logo + Toggle Button */}
        <div className="flex h-16 items-center border-b border-border px-3.5">
          {isCollapsed ? (
            /* Collapsed Header: Centered Book Icon & Hover Toggle */
            <div className="flex w-full items-center justify-center relative group">
              <Link
                href="/dashboard"
                aria-label="EduTest - Trang chủ"
                className="flex h-10 w-10 min-h-[40px] min-w-[40px] items-center justify-center rounded-xl hover:bg-muted/80 text-primary transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
              >
                <BookOpen className="h-6 w-6" aria-hidden="true" />
              </Link>

              {/* Toggle expand button at sidebar edge */}
              <button
                type="button"
                onClick={toggleCollapse}
                aria-expanded={!isCollapsed}
                aria-controls="dashboard-sidebar"
                aria-label="Mở rộng thanh bên (Ctrl+B)"
                title="Mở rộng thanh bên (Ctrl+B)"
                className="absolute -right-5 z-30 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-primary hover:border-primary/50 shadow-md transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            /* Expanded Header: Full Logo, Badge v2.0, Toggle Collapse Button */
            <div className="flex w-full items-center justify-between min-w-0">
              <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2.5 rounded-lg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary min-w-0"
                >
                  <BookOpen className="h-7 w-7 text-primary shrink-0" aria-hidden="true" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-base font-bold leading-tight truncate">
                      Edu<span className="text-primary">Test</span>
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                      v2.0.0 Beta (GDPT 2025)
                    </span>
                  </div>
                </Link>
                <a
                  href="https://zalo.me/g/e6xf6xhazoa18qiodfxr"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Nhóm Zalo hỗ trợ thử nghiệm EdTeach v2.0.0"
                  className="hidden xl:inline-flex items-center gap-1 rounded-md bg-emerald-500/15 border border-emerald-500/40 px-1.5 py-0.5 text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 transition-colors shrink-0 shadow-2xs"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                  BETA v2.0
                </a>
              </div>

              {/* Collapse Button */}
              <button
                type="button"
                onClick={toggleCollapse}
                aria-expanded={!isCollapsed}
                aria-controls="dashboard-sidebar"
                aria-label="Thu gọn thanh bên (Ctrl+B)"
                title="Thu gọn thanh bên (Ctrl+B)"
                className="flex h-8 w-8 min-h-[32px] min-w-[32px] items-center justify-center rounded-lg border border-border/80 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary ml-1"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav
          className={`flex-1 space-y-1.5 overflow-y-auto overflow-x-hidden py-3 ${
            isCollapsed ? "px-2" : "px-3"
          }`}
          aria-label="Điều hướng chính"
        >
          {sidebarLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/dashboard" && pathname.startsWith(link.href));

            return (
              <div key={link.href} className="relative group flex items-center">
                <Link
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={link.label}
                  className={`flex items-center rounded-xl transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary ${
                    isCollapsed
                      ? "h-11 w-11 min-h-[44px] min-w-[44px] mx-auto justify-center"
                      : "w-full min-h-[42px] px-3.5 py-2.5 gap-3 text-sm font-medium"
                  } ${
                    isActive
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800/60 shadow-2xs"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  }`}
                >
                  <link.icon className="h-5 w-5 shrink-0" aria-hidden="true" />

                  {/* Label (only expanded, smooth fade) */}
                  <span
                    className={`whitespace-nowrap transition-all duration-200 ${
                      isCollapsed
                        ? "max-w-0 opacity-0 overflow-hidden pointer-events-none"
                        : "max-w-[180px] opacity-100 truncate"
                    }`}
                  >
                    {link.label}
                  </span>
                </Link>

                {/* Tooltip khi thu nhỏ: Hiển thị bên phải khi hover hoặc focus */}
                {isCollapsed && (
                  <div
                    role="tooltip"
                    className="pointer-events-none absolute left-full ml-3 z-50 hidden group-hover:flex group-focus-within:flex items-center rounded-lg bg-popover text-popover-foreground text-xs font-semibold px-2.5 py-1.5 shadow-lg border border-border whitespace-nowrap animate-in fade-in-0 zoom-in-95 duration-150"
                  >
                    {link.label}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom Section: Account Block & Logout */}
        <div
          ref={accountPopoverRef}
          className={`mt-auto border-t border-border bg-card/60 relative overflow-x-hidden ${
            isCollapsed ? "p-2 flex flex-col items-center gap-2 pb-4" : "p-3 pb-5"
          }`}
        >
          {isCollapsed ? (
            /* COLLAPSED ACCOUNT FOOTER */
            <>
              {/* Avatar trigger button for Popover */}
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => setAccountPopoverOpen((prev) => !prev)}
                  aria-label="Tài khoản và thông tin cá nhân"
                  aria-expanded={accountPopoverOpen}
                  title={profile?.name || user?.email || "Tài khoản"}
                  className="relative flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl hover:bg-muted transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Avatar"
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full object-cover border border-primary/40 shrink-0"
                    />
                  ) : (
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary shrink-0"
                      aria-hidden="true"
                    >
                      {initials}
                    </div>
                  )}

                  {/* Dot status badge on avatar for MAX / PRO */}
                  {isMax ? (
                    <span
                      title="Gói MAX"
                      className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-card"
                    />
                  ) : isPro ? (
                    <span
                      title="Gói PRO"
                      className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-card"
                    />
                  ) : null}
                </button>

                {/* Tooltip khi chưa mở popover */}
                {!accountPopoverOpen && (
                  <div
                    role="tooltip"
                    className="pointer-events-none absolute left-full ml-3 z-50 hidden group-hover:flex items-center rounded-lg bg-popover text-popover-foreground text-xs font-semibold px-2.5 py-1.5 shadow-lg border border-border whitespace-nowrap animate-in fade-in-0 duration-150"
                  >
                    {profile?.name || user?.email || "Tài khoản"}
                  </div>
                )}
              </div>

              {/* Standalone Logout Button in Collapsed Mode */}
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => signOut()}
                  aria-label="Đăng xuất khỏi tài khoản"
                  className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-destructive"
                >
                  <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
                </button>
                <div
                  role="tooltip"
                  className="pointer-events-none absolute left-full ml-3 z-50 hidden group-hover:flex items-center rounded-lg bg-popover text-destructive text-xs font-semibold px-2.5 py-1.5 shadow-lg border border-border whitespace-nowrap animate-in fade-in-0 duration-150"
                >
                  Đăng xuất
                </div>
              </div>

              {/* Account Popover Menu when clicking avatar in Collapsed mode */}
              {accountPopoverOpen && (
                <div
                  role="dialog"
                  aria-label="Thông tin tài khoản"
                  className="absolute bottom-16 left-full ml-2 w-64 rounded-2xl border border-border bg-card p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="flex items-center gap-3 border-b border-border pb-3 px-1">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Avatar"
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-full object-cover border border-primary/40 shrink-0"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary shrink-0">
                        {initials}
                      </div>
                    )}
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="flex items-center justify-between gap-1">
                        <p className="truncate text-sm font-bold text-foreground">
                          {profile?.name || user?.email || "Giáo viên"}
                        </p>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {user?.email || ""}
                      </p>
                      <div className="mt-1">
                        {isMax ? (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-500 text-white px-1.5 py-0.2 text-[10px] font-black shadow-xs">
                            <Crown className="w-2.5 h-2.5" /> GÓI MAX
                          </span>
                        ) : isPro ? (
                          <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.2 text-[10px] font-bold text-primary border border-primary/20">
                            <Sparkles className="w-2.5 h-2.5" /> GÓI PRO
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 text-[10px] font-medium text-slate-600 dark:text-slate-400 border border-border">
                            Miễn phí
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 space-y-1">
                    <Link
                      href="/settings"
                      onClick={() => setAccountPopoverOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <span>Cài đặt tài khoản</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setAccountPopoverOpen(false);
                        signOut();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* EXPANDED ACCOUNT FOOTER */
            <>
              <div className="flex items-center gap-3 rounded-lg px-2 py-1.5 min-w-0">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar tài khoản"
                    width={34}
                    height={34}
                    className="h-8.5 w-8.5 rounded-full object-cover border border-primary/30 shrink-0"
                  />
                ) : (
                  <div
                    className="flex h-8.5 w-8.5 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary shrink-0"
                    aria-hidden="true"
                  >
                    {initials}
                  </div>
                )}
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-center justify-between gap-1.5 min-w-0">
                    <p
                      className="truncate text-sm font-semibold text-foreground"
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
                className="mt-1.5 flex w-full min-h-[38px] items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-destructive"
              >
                <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Đăng xuất</span>
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
