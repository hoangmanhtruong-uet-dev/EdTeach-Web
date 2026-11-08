"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  Loader2,
  BookOpen,
  Share2,
  Crown,
  Copy,
  Check,
  X,
  Presentation,
  RotateCcw,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { getUserExams, deleteExam, Exam, getExamById } from "@/lib/api/exams";
import { useAuth } from "@/context/auth-context";
import { isMaxUser, isProUser, PricingPlan } from "@/lib/payment/plans";
// docx exporter loaded dynamically on demand
import { UpgradeTierModal } from "@/components/modals/upgrade-tier-modal";
import { PaymentCheckoutModal } from "@/components/modals/payment-checkout-modal";
import { useToast } from "@/context/toast-context";
import { cn } from "@/lib/utils";

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);

  // Pagination States (EXL-01)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  // Soft Delete Confirmation Dialog State (EXL-04, EXL-10)
  const [deleteConfirmExam, setDeleteConfirmExam] = useState<Exam | null>(null);

  // Filter & Sort States (EXL-02)
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "questions_desc" | "questions_asc" | "name_asc" | "name_desc"
  >("newest");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [magicLinkExam, setMagicLinkExam] = useState<Exam | null>(null);
  const [copiedMagicLink, setCopiedMagicLink] = useState(false);
  const [upgradeTier, setUpgradeTier] = useState<"pro" | "max" | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<PricingPlan | null>(null);

  // User tier checks (EXL-05)
  const isMax = isMaxUser(profile) || isMaxUser(user);
  const isPro = isProUser(profile) || isProUser(user) || isMax;

  // Debounce search input (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset to page 1 whenever search, filters, or sorting change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedSubject, selectedGrade, selectedStatus, sortBy]);

  // Click outside to close filter popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    if (isFilterOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFilterOpen]);

  // Escape key handler for Modals & Filter Popover
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (magicLinkExam) setMagicLinkExam(null);
        if (deleteConfirmExam) setDeleteConfirmExam(null);
        if (isFilterOpen) setIsFilterOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [magicLinkExam, deleteConfirmExam, isFilterOpen]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedSubject !== "all") count++;
    if (selectedGrade !== "all") count++;
    if (selectedStatus !== "all") count++;
    if (sortBy !== "newest") count++;
    return count;
  }, [selectedSubject, selectedGrade, selectedStatus, sortBy]);

  const handleResetFilters = () => {
    setSelectedSubject("all");
    setSelectedGrade("all");
    setSelectedStatus("all");
    setSortBy("newest");
    setSearch("");
    setCurrentPage(1);
  };

  const subjectOptions = useMemo(() => {
    const defaults = [
      "Toán",
      "Ngữ văn",
      "Tiếng Anh",
      "Vật lí",
      "Hóa học",
      "Sinh học",
      "Lịch sử",
      "Địa lí",
      "GDCD",
      "Tin học",
      "Công nghệ",
    ];
    const set = new Set<string>(defaults);
    exams.forEach((e) => {
      if (e.subject) set.add(e.subject);
    });
    return Array.from(set);
  }, [exams]);

  const gradeOptions = useMemo(() => {
    const defaults = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
    const set = new Set<string>(defaults);
    exams.forEach((e) => {
      if (e.grade) set.add(e.grade.toString());
    });
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [exams]);

  // Load exams with server-side pagination & filter query (EXL-01, EXL-02)
  const loadExams = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUserExams({
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
        search: debouncedSearch.trim() || undefined,
        subject: selectedSubject !== "all" ? selectedSubject : undefined,
        grade: selectedGrade !== "all" ? selectedGrade : undefined,
        status: selectedStatus !== "all" ? selectedStatus : undefined,
        sortBy,
      });
      setExams(res.exams);
      setTotalCount(res.totalCount);
    } catch (err) {
      console.error("Failed to load exams", err);
      showToast("Không thể tải danh sách đề thi. Vui lòng tải lại trang.", "error");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, selectedSubject, selectedGrade, selectedStatus, sortBy, showToast]);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalCount, currentPage * pageSize);

  const handleExportDualTeaching = async (id: string) => {
    try {
      setExportingId(id);
      const fullExam = await getExamById(id);
      if (fullExam) {
        const { exportDualTeachingDocx } = await import("@/lib/export/docx-exporter");
        await exportDualTeachingDocx(fullExam, isPro);
      }
      showToast("Đã xuất thành công bộ đề kép giảng dạy (.docx)!", "success");
    } catch (e) {
      console.error("Export dual docx error:", e);
      showToast("Lỗi khi xuất bộ đề giảng dạy. Vui lòng thử lại sau.", "error");
    } finally {
      setExportingId(null);
    }
  };

  // EXL-03: Magic link handler with MAX tier check
  const handleMagicLinkClick = (exam: Exam) => {
    if (!isMax) {
      setUpgradeTier("max");
      return;
    }
    setMagicLinkExam(exam);
  };

  // EXL-05: Bục Giảng Số PRO tier handler
  const handleTeachClick = (exam: Exam) => {
    if (!isPro) {
      setUpgradeTier("pro");
      return;
    }
  };

  // EXL-04, EXL-10: Confirmation Delete
  const handleConfirmDelete = async () => {
    if (!deleteConfirmExam) return;
    const idToDelete = deleteConfirmExam.id;
    setDeletingId(idToDelete);
    try {
      await deleteExam(idToDelete);
      showToast("Đã chuyển đề thi vào thùng rác thành công.", "success");
      setDeleteConfirmExam(null);
      if (exams.length === 1 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      } else {
        await loadExams();
      }
    } catch (err) {
      console.error("Failed to delete exam", err);
      showToast("Không thể xóa đề thi. Vui lòng thử lại.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const magicLinkUrl = magicLinkExam
    ? typeof window !== "undefined"
      ? `${window.location.origin}/grading/submit/${magicLinkExam.id}?name=${encodeURIComponent(
          magicLinkExam.name
        )}`
      : `https://edutest.vn/grading/submit/${magicLinkExam.id}`
    : "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Đề thi của tôi</h1>
          <p className="text-sm text-muted-foreground">Quản lý và xuất bản các đề thi đã tạo</p>
        </div>
        <Link
          href="/exams/create"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Tạo đề mới
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên đề, môn học…"
              aria-label="Tìm kiếm đề thi"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/10 transition cursor-pointer"
                title="Đặt lại các tiêu chí bộ lọc"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Đặt lại</span>
              </button>
            )}

            {/* Filter Button & Popover Container */}
            <div className="relative" ref={filterRef}>
              <button
                type="button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                aria-expanded={isFilterOpen}
                aria-label="Mở bộ lọc và sắp xếp đề thi"
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition cursor-pointer select-none",
                  isFilterOpen || activeFilterCount > 0
                    ? "border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary/20"
                    : "border-border bg-card text-foreground hover:bg-muted"
                )}
              >
                <Filter className={cn("h-4 w-4", activeFilterCount > 0 ? "text-primary" : "text-muted-foreground")} />
                <span>Lọc</span>
                {activeFilterCount > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground leading-none animate-in zoom-in-75 duration-150">
                    {activeFilterCount}
                  </span>
                )}
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
                    isFilterOpen && "rotate-180 text-primary"
                  )}
                />
              </button>

              {/* Popover Card */}
              {isFilterOpen && (
                <div className="absolute right-0 top-full mt-2 z-40 w-80 sm:w-[420px] max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-card p-5 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm text-foreground">Bộ lọc & Sắp xếp</span>
                      {activeFilterCount > 0 && (
                        <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[11px] font-bold">
                          {activeFilterCount} điều kiện
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsFilterOpen(false)}
                      className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
                      aria-label="Đóng bảng lọc"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-4 text-xs">
                    {/* Sắp xếp */}
                    <div>
                      <label className="block font-semibold text-muted-foreground mb-1.5">Sắp xếp theo:</label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <option value="newest">Mới nhất trước</option>
                        <option value="oldest">Cũ nhất trước</option>
                        <option value="questions_desc">Nhiều câu hỏi nhất</option>
                        <option value="questions_asc">Ít câu hỏi nhất</option>
                        <option value="name_asc">Tên A → Z</option>
                        <option value="name_desc">Tên Z → A</option>
                      </select>
                    </div>

                    {/* Môn học */}
                    <div>
                      <label className="block font-semibold text-muted-foreground mb-1.5">Môn học:</label>
                      <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <option value="all">Tất cả môn học</option>
                        {subjectOptions.map((subj) => (
                          <option key={subj} value={subj}>
                            {subj}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Khối lớp */}
                    <div>
                      <label className="block font-semibold text-muted-foreground mb-1.5">Khối lớp:</label>
                      <select
                        value={selectedGrade}
                        onChange={(e) => setSelectedGrade(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <option value="all">Tất cả khối lớp</option>
                        {gradeOptions.map((g) => (
                          <option key={g} value={g}>
                            Lớp {g}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Trạng thái */}
                    <div>
                      <label className="block font-semibold text-muted-foreground mb-1.5">Trạng thái:</label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="completed">Đã hoàn thành</option>
                        <option value="draft">Bản nháp</option>
                        <option value="generating">Đang tạo...</option>
                        <option value="failed">Thất bại</option>
                      </select>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        disabled={activeFilterCount === 0}
                        className="text-muted-foreground hover:text-foreground font-semibold disabled:opacity-40 transition cursor-pointer"
                      >
                        Đặt lại bộ lọc
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsFilterOpen(false)}
                        className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition shadow-xs cursor-pointer"
                      >
                        Áp dụng ({activeFilterCount})
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active Filters Pill Bar & Live Status (EXL-02, EXL-10) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div aria-live="polite" className="text-xs text-muted-foreground font-medium">
            {loading ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang cập nhật danh sách…
              </span>
            ) : totalCount > 0 ? (
              <span>
                Tìm thấy <strong>{totalCount}</strong> đề thi
                {debouncedSearch && <span> khớp với &quot;{debouncedSearch}&quot;</span>}
              </span>
            ) : null}
          </div>

          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-muted-foreground text-[11px] font-medium mr-1">Đang lọc:</span>
              {selectedSubject !== "all" && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 text-xs font-semibold">
                  Môn: {selectedSubject}
                  <button
                    type="button"
                    onClick={() => setSelectedSubject("all")}
                    className="hover:text-destructive cursor-pointer"
                    title="Bỏ lọc môn"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedGrade !== "all" && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 text-xs font-semibold">
                  Lớp: {selectedGrade}
                  <button
                    type="button"
                    onClick={() => setSelectedGrade("all")}
                    className="hover:text-destructive cursor-pointer"
                    title="Bỏ lọc lớp"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedStatus !== "all" && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 text-xs font-semibold">
                  Trạng thái: {selectedStatus === "completed" ? "Đã hoàn thành" : selectedStatus}
                  <button
                    type="button"
                    onClick={() => setSelectedStatus("all")}
                    className="hover:text-destructive cursor-pointer"
                    title="Bỏ lọc trạng thái"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {sortBy !== "newest" && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-muted text-foreground border border-border px-2.5 py-1 text-xs font-semibold">
                  Sắp xếp:{" "}
                  {sortBy === "oldest"
                    ? "Cũ nhất"
                    : sortBy === "questions_desc"
                    ? "Nhiều câu nhất"
                    : sortBy === "questions_asc"
                    ? "Ít câu nhất"
                    : sortBy === "name_asc"
                    ? "Tên A-Z"
                    : "Tên Z-A"}
                  <button
                    type="button"
                    onClick={() => setSortBy("newest")}
                    className="hover:text-destructive cursor-pointer"
                    title="Đặt lại sắp xếp"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-primary hover:underline font-semibold cursor-pointer ml-1 text-xs"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Exam List Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
        {loading && exams.length === 0 ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : exams.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <BookOpen className="h-6 w-6 text-muted-foreground" />
            </div>
            {totalCount === 0 && !debouncedSearch && activeFilterCount === 0 ? (
              <>
                <h3 className="mt-4 font-semibold">Chưa có đề thi nào</h3>
                <p className="mt-1 text-xs text-muted-foreground">Bắt đầu bằng cách tạo một đề thi mới ngay bây giờ!</p>
                <Link
                  href="/exams/create"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" /> Tạo đề đầu tiên
                </Link>
              </>
            ) : (
              <>
                <h3 className="mt-4 font-semibold">Không tìm thấy đề thi phù hợp</h3>
                <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                  Không có đề thi nào khớp với từ khóa tìm kiếm hoặc các điều kiện bộ lọc đang áp dụng.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Xóa tìm kiếm & đặt lại bộ lọc</span>
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="min-w-[960px] divide-y divide-border">
            <div className="grid grid-cols-12 gap-4 p-4 text-xs font-semibold text-muted-foreground sm:grid">
              <div className="col-span-5 sm:col-span-3">Tên đề thi</div>
              <div className="col-span-3 sm:col-span-2">Môn / Lớp</div>
              <div className="col-span-4 sm:col-span-1">Trạng thái</div>
              <div className="hidden sm:col-span-1 sm:block text-center">Số câu</div>
              <div className="hidden sm:col-span-2 sm:block">Ngày tạo</div>
              <div className="hidden sm:col-span-3 sm:block text-right pr-2">Thao tác</div>
            </div>

            {exams.map((exam) => (
              <div
                key={exam.id}
                className="grid grid-cols-12 items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="col-span-5 sm:col-span-3">
                  <Link
                    href={`/exams/${exam.id}`}
                    className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1 text-sm"
                  >
                    {exam.name}
                  </Link>
                  <p className="text-xs text-muted-foreground sm:hidden mt-0.5">
                    {exam.subject} • Lớp {exam.grade} • {exam.question_count} câu
                  </p>
                </div>

                <div className="col-span-3 sm:col-span-2 text-xs">
                  <span className="font-medium text-foreground">{exam.subject}</span>
                  <span className="text-muted-foreground"> • Lớp {exam.grade}</span>
                </div>

                <div className="col-span-4 sm:col-span-1">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
                      exam.status === "completed"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : exam.status === "generating"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : exam.status === "failed"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {exam.status === "completed"
                      ? "Hoàn thành"
                      : exam.status === "generating"
                      ? "Đang tạo..."
                      : exam.status === "failed"
                      ? "Thất bại"
                      : "Bản nháp"}
                  </span>
                </div>

                <div className="hidden text-sm tabular-nums sm:col-span-1 sm:block text-center">{exam.question_count} câu</div>
                <div className="hidden text-sm tabular-nums text-muted-foreground sm:col-span-2 sm:block whitespace-nowrap">
                  {new Date(exam.created_at).toLocaleDateString("vi-VN")}
                </div>

                <div className="flex items-center justify-end gap-2 col-span-12 sm:col-span-3 flex-wrap sm:flex-nowrap">
                  {/* Bục Giảng Số Button (EXL-05 PRO Gate) */}
                  {isPro ? (
                    <Link
                      href={`/teach/${exam.id}`}
                      aria-label={`Trình chiếu Bục Giảng Số đề ${exam.name}`}
                      className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 min-h-[36px] text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 transition-colors shadow-2xs whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
                      title="Bục Giảng Số: Trình chiếu chữa đề kết hợp Bảng nháp Excalidraw (Gói PRO)"
                    >
                      <Presentation className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>Bục giảng</span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleTeachClick(exam)}
                      aria-label={`Nâng cấp PRO để trình chiếu Bục Giảng Số cho đề ${exam.name}`}
                      className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 min-h-[36px] text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors shadow-2xs whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
                      title="Bục Giảng Số (Đặc quyền Gói PRO - Nhấn để nâng cấp)"
                    >
                      <Crown className="h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
                      <span>Bục giảng</span>
                    </button>
                  )}

                  {/* View / Edit Button */}
                  <Link
                    href={`/exams/${exam.id}`}
                    aria-label={`Xem và chỉnh sửa đề ${exam.name}`}
                    className="h-9 w-9 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary shrink-0"
                    title="Xem & Chỉnh sửa"
                  >
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  </Link>

                  {/* Dual Teaching Export */}
                  <button
                    type="button"
                    onClick={() => handleExportDualTeaching(exam.id)}
                    disabled={exportingId === exam.id}
                    aria-label={`Tải bộ đề kép Word của đề ${exam.name}`}
                    className="h-9 w-9 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 disabled:opacity-50 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 shrink-0"
                    title="Tải Bộ Đề Kép: 1 Bản Học Sinh (có dòng chấm chép bài) & 1 Bản Giáo Viên (kèm lời giải chi tiết)"
                  >
                    {exportingId === exam.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" aria-hidden="true" />
                    ) : (
                      <Download className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                    )}
                  </button>

                  {/* Magic Link Button (MAX tier) */}
                  <button
                    type="button"
                    onClick={() => handleMagicLinkClick(exam)}
                    aria-label={`Giao đề online qua Magic Link cho đề ${exam.name}`}
                    className="h-9 w-9 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 shrink-0"
                    title="Giao đề Online qua Magic Link (Đặc quyền MAX)"
                  >
                    <Share2 className="h-4 w-4" aria-hidden="true" />
                  </button>

                  {/* Soft Delete Trigger (EXL-04, EXL-10) */}
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmExam(exam)}
                    disabled={deletingId === exam.id}
                    aria-label={`Xóa đề ${exam.name}`}
                    className="h-9 w-9 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-destructive shrink-0"
                    title="Xóa đề thi"
                  >
                    {deletingId === exam.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Bar (EXL-01) */}
        {totalCount > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-border bg-card/50 text-xs text-muted-foreground min-w-[960px]">
            <div aria-live="polite" className="tabular-nums font-medium">
              Hiển thị <strong>{startItem}</strong> - <strong>{endItem}</strong> trong tổng số{" "}
              <strong>{totalCount}</strong> đề thi
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || loading}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-card text-foreground font-semibold hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                aria-label="Trang trước"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Trước</span>
              </button>

              <span className="px-2 font-medium tabular-nums text-foreground">
                Trang {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || loading}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-card text-foreground font-semibold hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                aria-label="Trang sau"
              >
                <span>Sau</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal (EXL-04, EXL-10) */}
      {deleteConfirmExam && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-desc"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overscroll-contain animate-in fade-in duration-200"
        >
          <div className="bg-white dark:bg-card rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 relative text-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 id="delete-dialog-title" className="font-bold text-base text-foreground">
                  Xác nhận xóa đề thi
                </h3>
                <p className="text-xs text-muted-foreground">
                  Đề thi sẽ được chuyển vào thùng rác
                </p>
              </div>
            </div>

            <p id="delete-dialog-desc" className="text-sm text-neutral-600 dark:text-neutral-300 mb-6 leading-relaxed">
              Bạn có chắc chắn muốn xóa đề thi <strong>&quot;{deleteConfirmExam.name}&quot;</strong> ({deleteConfirmExam.subject} - Lớp {deleteConfirmExam.grade})? Thao tác này an toàn và không làm đứt gãy lịch sử chấm thi.
            </p>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmExam(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={deletingId === deleteConfirmExam.id}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-destructive text-white text-xs font-bold hover:bg-destructive/90 transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                {deletingId === deleteConfirmExam.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Xóa đề thi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Magic Link Giao đề Online (Gói MAX - EXL-03) */}
      {magicLinkExam && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="magic-link-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overscroll-contain animate-in fade-in duration-200"
        >
          <div className="bg-white dark:bg-card rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 relative text-left">
            <button
              type="button"
              onClick={() => setMagicLinkExam(null)}
              aria-label="Đóng cửa sổ giao đề trực tuyến"
              className="absolute right-4 top-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h3 id="magic-link-title" className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                  Giao đề Online qua Magic Link
                </h3>
                <p className="text-xs text-muted-foreground">
                  Đề thi: <strong>{magicLinkExam.name}</strong> ({magicLinkExam.subject} - Lớp {magicLinkExam.grade})
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-4 leading-relaxed">
              Học sinh chỉ cần mở liên kết dưới đây trên điện thoại hoặc máy tính để làm bài trực tuyến. Không cần đăng nhập, hệ thống tự động ghi nhận điểm số theo ma trận đề thi.
            </p>

            <div className="rounded-xl border border-border bg-neutral-50 dark:bg-muted/40 p-3.5 mb-4">
              <label htmlFor="magic-link-input" className="block text-[11px] font-semibold text-muted-foreground mb-1">
                Đường dẫn làm bài trực tuyến:
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="magic-link-input"
                  type="text"
                  readOnly
                  aria-label="Đường dẫn làm bài trực tuyến cho học sinh"
                  value={magicLinkUrl}
                  className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(magicLinkUrl);
                    setCopiedMagicLink(true);
                    showToast("Đã sao chép liên kết làm bài vào khay nhớ tạm!", "success");
                    setTimeout(() => setCopiedMagicLink(false), 2000);
                  }}
                  aria-label="Sao chép đường dẫn làm bài"
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary/90 transition shadow-xs cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {copiedMagicLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedMagicLink ? "Đã sao chép" : "Sao chép"}</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMagicLinkExam(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Tier Modal */}
      <UpgradeTierModal
        isOpen={!!upgradeTier}
        onClose={() => setUpgradeTier(null)}
        requiredTier={upgradeTier || "pro"}
        featureTitle={
          upgradeTier === "max"
            ? "Giao đề Online qua Magic Link (Không cần tài khoản)"
            : "Trình chiếu Bục Giảng Số 4.0 (Gói PRO)"
        }
        featureDesc={
          upgradeTier === "max"
            ? "Đặc quyền Gói Luyện Thi MAX: Biến mọi đề thi trong kho của bạn thành liên kết và mã QR trực tuyến gửi qua Zalo. Học sinh làm bài tức thì trên điện thoại, hệ thống tự động chấm điểm và xếp hạng cả lớp."
            : "Đặc quyền Gói Giảng Dạy PRO: Trình chiếu câu hỏi thông minh chuẩn GDPT 2025, bảng nháp Excalidraw tương tác thời gian thực, phóng to công thức LaTeX và xuất file đề kép."
        }
        onSelectPlan={(plan) => setCheckoutPlan(plan)}
      />

      {/* PayOS Checkout Modal */}
      {checkoutPlan && (
        <PaymentCheckoutModal
          isOpen={!!checkoutPlan}
          onClose={() => setCheckoutPlan(null)}
          selectedPlan={checkoutPlan}
          onSuccess={() => {
            setCheckoutPlan(null);
            setUpgradeTier(null);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
