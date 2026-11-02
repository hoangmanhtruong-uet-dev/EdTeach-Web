"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { isProUser } from "@/lib/payment/plans";
import { useRouter } from "next/navigation";
import {
  Presentation,
  Plus,
  Star,
  Copy,
  Trash2,
  Calendar,
  Crown,
  Sparkles,
  Search,
  Grid,
  List,
  PenTool,
  Clock,
  Layers,
  Columns2,
  Network,
  FileText,
  Activity,
  ArrowRight,
  HelpCircle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import {
  getUserWhiteboards,
  createWhiteboard,
  deleteWhiteboard,
  duplicateWhiteboard,
  updateWhiteboard,
  FREE_TIER_MAX_BOARDS,
} from "@/lib/api/whiteboard";
import { WHITEBOARD_TEMPLATES } from "@/lib/whiteboard/templates";
import { Whiteboard } from "@/types/whiteboard";

export default function WhiteboardDashboardPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [whiteboards, setWhiteboards] = useState<Whiteboard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterFavorite, setFilterFavorite] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isCreating, setIsCreating] = useState(false);
  const [creatingTemplateKey, setCreatingTemplateKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const isPro = isProUser(profile) || isProUser(user);

  const loadBoards = async () => {
    setIsLoading(true);
    try {
      const data = await getUserWhiteboards();
      setWhiteboards(data);
    } catch (err) {
      console.error("Lỗi tải bảng vẽ:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBoards();
  }, [user]);

  // Phím tắt N (tạo mới) và / (tìm kiếm)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        handleCreateBoard();
      } else if (e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPro, whiteboards.length]);

  const handleCreateBoard = async (templateKey?: string, templateTitle?: string) => {
    setErrorMessage(null);
    setIsCreating(true);
    if (templateKey) setCreatingTemplateKey(templateKey);
    try {
      const title = templateTitle || (templateKey ? undefined : "Bảng vẽ mới");
      const res = await createWhiteboard(title, isPro, templateKey);
      if (res.data) {
        showToast(
          templateKey ? "Đã khởi tạo bảng vẽ từ mẫu sư phạm!" : "Đã tạo bảng vẽ mới!",
          "success"
        );
        router.push(`/whiteboard/${res.data.id}`);
      } else if (res.error) {
        setErrorMessage(res.error);
        showToast(res.error, "error");
      }
    } catch (err: any) {
      const msg = err.message || "Không thể tạo bảng vẽ mới.";
      setErrorMessage(msg);
      showToast(msg, "error");
    } finally {
      setIsCreating(false);
      setCreatingTemplateKey(null);
    }
  };

  const handleDeleteBoard = async (id: string, title: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Bạn có chắc chắn muốn xoá bảng vẽ "${title}"?`)) return;

    const ok = await deleteWhiteboard(id);
    if (ok) {
      setWhiteboards((prev) => prev.filter((b) => b.id !== id));
      showToast("Đã xoá bảng vẽ thành công.", "success");
    } else {
      showToast("Không thể xoá bảng vẽ.", "error");
    }
  };

  const handleDuplicateBoard = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const duplicated = await duplicateWhiteboard(id, isPro);
    if (duplicated) {
      setWhiteboards((prev) => [duplicated, ...prev]);
      showToast("Đã nhân bản bảng vẽ thành công!", "success");
    } else {
      showToast(
        `Không thể nhân bản (đã đạt giới hạn ${FREE_TIER_MAX_BOARDS} bảng vẽ của gói Free).`,
        "warning"
      );
    }
  };

  const handleToggleFavorite = async (board: Whiteboard, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextVal = !board.is_favorite;
    setWhiteboards((prev) =>
      prev.map((b) => (b.id === board.id ? { ...b, is_favorite: nextVal } : b))
    );
    await updateWhiteboard(board.id, { is_favorite: nextVal });
    showToast(nextVal ? "Đã thêm vào mục Yêu thích" : "Đã bỏ khỏi Yêu thích", "info");
  };

  // Filter whiteboards
  const filteredBoards = whiteboards.filter((b) => {
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFav = filterFavorite ? b.is_favorite : true;
    return matchesSearch && matchesFav;
  });

  const usedCount = whiteboards.length;
  const isAtLimit = !isPro && usedCount >= FREE_TIER_MAX_BOARDS;
  const remainingSlots = Math.max(0, FREE_TIER_MAX_BOARDS - usedCount);

  // Quick stats calculation
  const totalElements = whiteboards.reduce(
    (acc, b) => acc + (Array.isArray(b.elements) ? b.elements.length : 0),
    0
  );
  const latestUpdatedBoard = whiteboards.length > 0 ? whiteboards[0] : null;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 space-y-8">
      {/* 1. Header Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-blue-700 via-indigo-600 to-purple-700 p-6 sm:p-8 md:p-10 text-white shadow-2xl">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1 text-xs font-bold text-white backdrop-blur-md border border-white/20">
              <Presentation className="h-3.5 w-3.5 text-amber-300" />
              <span>Bảng Trắng Sư Phạm 4.0 • Excalidraw Hybrid</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              Không Gian Bảng Trắng Tương Tác
            </h1>
            <p className="text-sm sm:text-base text-blue-100 leading-relaxed max-w-xl font-normal">
              Phác thảo bài giảng, sơ đồ tư duy, chèn công thức toán học và mô phỏng STEM trực tiếp.
              Tự động lưu trữ đám mây song song, kết nối Bục Giảng Số trên máy chiếu.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={() => handleCreateBoard()}
              disabled={isCreating}
              className="inline-flex h-12 min-h-[44px] items-center justify-center gap-2.5 rounded-2xl bg-white px-6 text-sm font-bold text-blue-700 shadow-xl transition-all hover:bg-blue-50 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>{isCreating && !creatingTemplateKey ? "Đang tạo..." : "Tạo bảng vẽ mới"}</span>
              <kbd className="hidden lg:inline-block ml-1 rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-mono font-bold text-blue-800">
                N
              </kbd>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Quick-Stats Bar (Sprint W-1 A2) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-2xs hover:border-primary/40 transition">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Tổng Bảng Vẽ</span>
            <Presentation className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-foreground">{whiteboards.length}</span>
            <span className="text-xs text-muted-foreground">{isPro ? "(Không giới hạn)" : `(Tối đa 5)`}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Đã lưu trên đám mây</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-2xs hover:border-primary/40 transition">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Đồng Bộ & Lưu Trữ</span>
            <PenTool className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-foreground">
              {totalElements > 0 ? totalElements.toLocaleString("vi-VN") : "Đám mây"}
            </span>
            <span className="text-xs text-muted-foreground">{totalElements > 0 ? "vectors" : "Realtime"}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Tối ưu hoá tải siêu tốc</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-2xs hover:border-primary/40 transition">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Yêu Thích</span>
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-foreground">
              {whiteboards.filter((b) => b.is_favorite).length}
            </span>
            <span className="text-xs text-muted-foreground">bảng</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Được gắn sao quan trọng</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-2xs hover:border-primary/40 transition">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Lần Vẽ Gần Nhất</span>
            <Clock className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 truncate">
            <span className="text-sm font-bold text-foreground">
              {latestUpdatedBoard
                ? new Date(latestUpdatedBoard.updated_at).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Chưa có"}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground truncate">
            {latestUpdatedBoard ? latestUpdatedBoard.title : "Tạo bảng để bắt đầu"}
          </p>
        </div>
      </div>

      {/* 3. 4 Sư Phạm Quick Templates Row (Sprint W-1 A4) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm sm:text-base font-bold text-foreground">
              Bắt đầu nhanh từ Mẫu Sư Phạm (Templates 1-Click)
            </h2>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Khung chuẩn mực sẵn sàng cho tiết học
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {WHITEBOARD_TEMPLATES.map((tpl) => {
            const isThisLoading = isCreating && creatingTemplateKey === tpl.key;
            return (
              <button
                key={tpl.key}
                onClick={() => handleCreateBoard(tpl.key, tpl.name)}
                disabled={isCreating}
                className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-4 text-left shadow-2xs transition-all hover:border-primary hover:shadow-md hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                      {tpl.badge}
                    </span>
                    <span className="text-xs text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5">
                      →
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition">
                    {tpl.name}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {tpl.description}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-xs font-semibold text-primary">
                  <span>{isThisLoading ? "Đang nạp mẫu..." : "Dùng mẫu này"}</span>
                  <Plus className="h-3.5 w-3.5" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Quota & Pro Status Banner (Free Tier Limit = 5 Bảng) */}
      <div className={`flex flex-col justify-between gap-4 rounded-2xl border p-5 shadow-2xs md:flex-row md:items-center ${
        !isPro && remainingSlots <= 1
          ? "border-amber-300 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/20"
          : "border-border bg-card"
      }`}>
        <div className="flex items-center gap-3.5">
          {isPro ? (
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 shrink-0">
              <Crown className="h-6 w-6 fill-amber-500" />
            </div>
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <PenTool className="h-5 w-5" />
            </div>
          )}
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold text-foreground">
                {isPro
                  ? "Tài khoản PRO: Lưu trữ Bảng trắng Không Giới Hạn"
                  : `Gói Miễn phí: Đã dùng ${usedCount}/${FREE_TIER_MAX_BOARDS} bảng vẽ (${remainingSlots} slot còn lại)`}
              </p>
              {isPro ? (
                <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-600 border border-amber-500/20">
                  PRO
                </span>
              ) : (
                <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-bold text-blue-600 border border-blue-500/20">
                  FREE 5 BẢNG
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isPro
                ? "Tự động sao lưu vĩnh viễn, mở khóa toàn bộ thư viện STEM và xuất vector chất lượng cao."
                : `Hạn mức tài khoản Miễn phí được cấp tối đa ${FREE_TIER_MAX_BOARDS} bảng vẽ để trải nghiệm giảng dạy.`}
            </p>
          </div>
        </div>

        {!isPro && (
          <Link
            href="/wallet"
            className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl bg-linear-to-r from-amber-500 to-orange-500 px-5 py-2 text-xs font-bold text-white shadow-md shadow-amber-500/20 transition-all hover:brightness-105 active:scale-95 shrink-0"
          >
            <Sparkles className="h-4 w-4" />
            <span>Nâng cấp Pro lưu không giới hạn</span>
          </Link>
        )}
      </div>

      {/* Error alert if exceeded quota */}
      {errorMessage && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive flex items-center justify-between">
          <p className="font-semibold">{errorMessage}</p>
          <Link href="/wallet" className="text-xs font-bold underline hover:opacity-80 shrink-0">
            Nâng cấp gói Pro ngay →
          </Link>
        </div>
      )}

      {/* 5. Filter, Search & View Mode Switcher */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Tìm kiếm bảng vẽ theo tên (Nhấn / để tìm)…"
            aria-label="Tìm kiếm bảng vẽ theo tên"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-2xs transition"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Favorite filter toggle */}
          <button
            onClick={() => setFilterFavorite(!filterFavorite)}
            className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition cursor-pointer shadow-2xs ${
              filterFavorite
                ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Star className={`h-3.5 w-3.5 ${filterFavorite ? "fill-amber-500" : ""}`} />
            <span>Yêu thích ({whiteboards.filter((b) => b.is_favorite).length})</span>
          </button>

          {/* View mode toggle */}
          <div className="flex items-center rounded-xl border border-border bg-card p-1 shadow-2xs">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === "grid"
                  ? "bg-muted text-foreground font-bold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Xem dạng lưới"
              aria-label="Xem dạng lưới"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === "list"
                  ? "bg-muted text-foreground font-bold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Xem dạng danh sách"
              aria-label="Xem dạng danh sách"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 6. Board Grid / List with Real Thumbnails & Shimmer Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="rounded-2xl border border-border bg-card p-4 space-y-3 animate-pulse shadow-2xs">
              <div className="h-40 rounded-xl bg-muted/60" />
              <div className="h-4 w-3/4 rounded bg-muted/60" />
              <div className="flex justify-between items-center pt-2">
                <div className="h-3 w-1/3 rounded bg-muted/50" />
                <div className="h-3 w-1/4 rounded bg-muted/50" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredBoards.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card/50 py-16 px-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
            <Presentation className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">
            {searchQuery || filterFavorite
              ? "Không tìm thấy bảng vẽ nào phù hợp"
              : "Thầy/Cô chưa có bảng vẽ nào"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-md">
            {searchQuery || filterFavorite
              ? "Hãy thử thay đổi từ khoá tìm kiếm hoặc tắt bộ lọc yêu thích."
              : "Khởi tạo bảng vẽ trắng đầu tiên hoặc chọn 1 trong 4 mẫu sư phạm để bắt đầu tiết giảng sống động."}
          </p>
          {!searchQuery && !filterFavorite && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => handleCreateBoard()}
                disabled={isCreating}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-md transition hover:bg-primary/90 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Tạo bảng vẽ trống</span>
              </button>
              <button
                onClick={() => handleCreateBoard("two-columns", "Hai cột: Đề bài & Lời giải")}
                disabled={isCreating}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-bold text-foreground shadow-2xs transition hover:bg-muted cursor-pointer"
              >
                <Columns2 className="h-4 w-4 text-blue-600" />
                <span>Dùng mẫu Hai Cột</span>
              </button>
            </div>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Create New Card */}
          <button
            onClick={() => handleCreateBoard()}
            disabled={isCreating}
            className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card/60 p-6 text-center transition-all hover:border-primary hover:bg-primary/5 min-h-[260px] cursor-pointer ${
              isAtLimit ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110 transition duration-300 shadow-2xs">
              <Plus className="h-7 w-7" />
            </div>
            <h4 className="mt-4 text-sm font-bold text-foreground">Tạo bảng vẽ mới</h4>
            <p className="mt-1 text-xs text-muted-foreground max-w-[180px]">
              {isAtLimit ? `Đã dùng hết ${FREE_TIER_MAX_BOARDS} bảng Free` : "Khởi tạo canvas Excalidraw trắng"}
            </p>
          </button>

          {/* Existing Boards Cards with Real Thumbnails */}
          {filteredBoards.map((b) => {
            const elementCount = Array.isArray(b.elements) ? b.elements.length : 0;
            return (
              <div
                key={b.id}
                onClick={() => router.push(`/whiteboard/${b.id}`)}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card shadow-2xs transition-all hover:shadow-lg hover:border-primary/50 hover:-translate-y-1 cursor-pointer"
              >
                {/* Real Thumbnail Preview Area */}
                <div className="relative flex h-40 w-full items-center justify-center bg-slate-100 dark:bg-slate-900 border-b border-border/60 overflow-hidden">
                  {b.thumbnail_url ? (
                    <img
                      src={b.thumbnail_url}
                      alt={b.title}
                      loading="lazy"
                      className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground/50 space-y-1">
                      <Presentation className="h-10 w-10 group-hover:scale-110 group-hover:text-primary transition duration-300" />
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {elementCount === 0 && !b.elements ? "Bảng vẽ đám mây" : elementCount === 0 ? "Bảng trắng trống" : "Bảng vẽ Excalidraw"}
                      </span>
                    </div>
                  )}

                  {/* Element count tag (chỉ hiển thị nếu mảng elements được nạp) */}
                  {b.elements && elementCount > 0 && (
                    <div className="absolute bottom-2.5 left-2.5 rounded-lg bg-black/60 backdrop-blur-md px-2.5 py-0.5 text-xs font-semibold text-white border border-white/10 shadow-2xs">
                      {elementCount} nét vẽ
                    </div>
                  )}

                  {/* Favorite Star Badge (Luôn hiện trên thẻ) */}
                  <button
                    onClick={(e) => handleToggleFavorite(b, e)}
                    className="absolute top-2.5 right-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 p-2 backdrop-blur-md shadow-2xs hover:scale-110 transition cursor-pointer"
                    title={b.is_favorite ? "Bỏ yêu thích" : "Yêu thích"}
                    aria-label={b.is_favorite ? "Bỏ yêu thích" : "Yêu thích"}
                  >
                    <Star
                      className={`h-4 w-4 ${
                        b.is_favorite
                          ? "text-amber-500 fill-amber-500"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    />
                  </button>
                </div>

                {/* Info & Actions */}
                <div className="p-4 space-y-2.5">
                  <h4 className="line-clamp-1 text-sm font-bold text-foreground group-hover:text-primary transition">
                    {b.title}
                  </h4>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(b.updated_at).toLocaleDateString("vi-VN")}
                    </span>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                      <button
                        onClick={(e) => handleDuplicateBoard(b.id, e)}
                        className="h-8 w-8 min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
                        title="Nhân bản bảng này"
                        aria-label="Nhân bản"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteBoard(b.id, b.title, e)}
                        className="h-8 w-8 min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition cursor-pointer"
                        title="Xoá bảng này"
                        aria-label="Xoá bảng vẽ"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View Mode */
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xs divide-y divide-border">
          {filteredBoards.map((b) => {
            const elementCount = Array.isArray(b.elements) ? b.elements.length : 0;
            return (
              <div
                key={b.id}
                onClick={() => router.push(`/whiteboard/${b.id}`)}
                className="group flex items-center justify-between p-4 hover:bg-muted/40 transition cursor-pointer gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="h-12 w-16 rounded-lg bg-slate-100 dark:bg-slate-900 border overflow-hidden shrink-0 flex items-center justify-center">
                    {b.thumbnail_url ? (
                      <img src={b.thumbnail_url} alt={b.title} className="h-full w-full object-cover" />
                    ) : (
                      <Presentation className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition truncate">
                      {b.title}
                    </h4>
                    <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                      {b.elements && elementCount > 0 && (
                        <>
                          <span>{elementCount} nét vẽ</span>
                          <span>•</span>
                        </>
                      )}
                      <span>Cập nhật: {new Date(b.updated_at).toLocaleDateString("vi-VN")}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => handleToggleFavorite(b, e)}
                    className="p-2 rounded-lg hover:bg-muted transition text-muted-foreground hover:text-foreground"
                    title={b.is_favorite ? "Bỏ yêu thích" : "Yêu thích"}
                  >
                    <Star
                      className={`h-4 w-4 ${
                        b.is_favorite ? "text-amber-500 fill-amber-500" : ""
                      }`}
                    />
                  </button>
                  <button
                    onClick={(e) => handleDuplicateBoard(b.id, e)}
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition"
                    title="Nhân bản"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteBoard(b.id, b.title, e)}
                    className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition"
                    title="Xoá"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <span className="text-primary font-bold text-sm hidden sm:inline ml-2">
                    Mở bảng →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
