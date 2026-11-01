"use client";

import { useEffect, useState, useMemo, useRef } from "react";
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
  Sparkles,
  Presentation,
  RotateCcw,
  ChevronDown,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { getUserExams, deleteExam, Exam, getExamById } from "@/lib/api/exams";
import { useAuth } from "@/context/auth-context";
import { isMaxUser, isProUser, PricingPlan } from "@/lib/payment/plans";
import { exportDualTeachingDocx } from "@/lib/export/docx-exporter";
import { UpgradeTierModal } from "@/components/modals/upgrade-tier-modal";
import { PaymentCheckoutModal } from "@/components/modals/payment-checkout-modal";
import { useToast } from "@/context/toast-context";
import { cn } from "@/lib/utils";

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);

  // Filter & Sort States
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

  // Escape key handler for Magic Link Modal & Filter Popover
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (magicLinkExam) setMagicLinkExam(null);
        if (isFilterOpen) setIsFilterOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [magicLinkExam, isFilterOpen]);

  const [copiedMagicLink, setCopiedMagicLink] = useState(false);
  const [upgradeTier, setUpgradeTier] = useState<"pro" | "max" | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<PricingPlan | null>(null);

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

  const handleExportDualTeaching = async (id: string) => {
    try {
      setExportingId(id);
      const fullExam = await getExamById(id);
      if (fullExam) {
        await exportDualTeachingDocx(fullExam, isProUser(profile) || isProUser(user));
      }
      showToast("Đã xuất thành công bộ đề kép giảng dạy (.docx)!", "success");
    } catch (e) {
      console.error("Export dual docx error:", e);
      showToast("Lỗi khi xuất bộ đề giảng dạy. Vui lòng thử lại sau.", "error");
    } finally {
      setExportingId(null);
    }
  };

  const handleMagicLinkClick = (exam: Exam) => {
    if (!isMaxUser(profile)) {
      setUpgradeTier("max");
      return;
    }
    setMagicLinkExam(exam);
  };

  useEffect(() => {
    loadExams();
  }, []);

  async function loadExams() {
    setLoading(true);
    try {
      const res = await getUserExams();
      setExams(res.exams);
    } catch (err) {
      console.error("Failed to load exams", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Bạn có chắc chắn muốn xóa đề thi này không?")) return;
    setDeletingId(id);
    try {
      await deleteExam(id);
      setExams((prev) => prev.filter((e) => e.id !== id));
      showToast("Đã xóa đề thi thành công.", "success");
    } catch (err) {
      console.error("Failed to delete exam", err);
      showToast("Không thể xóa đề thi. Vui lòng thử lại.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  const filteredExams = useMemo(() => {
    const term = search.trim().toLowerCase();
    const result = exams.filter((e) => {
      // 1. Search text
      if (term) {
        const matchName = e.name?.toLowerCase().includes(term);
        const matchSubject = e.subject?.toLowerCase().includes(term);
        if (!matchName && !matchSubject) return false;
      }

      // 2. Subject
      if (selectedSubject !== "all") {
        if (!e.subject || e.subject.toLowerCase() !== selectedSubject.toLowerCase()) {
          return false;
        }
      }

      // 3. Grade
      if (selectedGrade !== "all") {
        if (!e.grade || e.grade.toString() !== selectedGrade.toString()) {
          return false;
        }
      }

      // 4. Status
      if (selectedStatus !== "all") {
        if (e.status !== selectedStatus) {
          return false;
        }
      }

      return true;
    });

    // 5. Sorting
    result.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === "questions_desc") {
        return (b.question_count || 0) - (a.question_count || 0);
      }
      if (sortBy === "questions_asc") {
        return (a.question_count || 0) - (b.question_count || 0);
      }
      if (sortBy === "name_asc") {
        return (a.name || "").localeCompare(b.name || "", "vi");
      }
      if (sortBy === "name_desc") {
        return (b.name || "").localeCompare(a.name || "", "vi");
      }
      return 0;
    });

    return result;
  }, [exams, search, selectedSubject, selectedGrade, selectedStatus, sortBy]);

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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* 1. Môn học */}
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                        Môn học
                      </label>
                      <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer transition"
                      >
                        <option value="all">Tất cả môn học</option>
                        {subjectOptions.map((subj) => (
                          <option key={subj} value={subj}>
                            {subj}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 2. Khối lớp */}
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                        Khối lớp
                      </label>
                      <select
                        value={selectedGrade}
                        onChange={(e) => setSelectedGrade(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer transition"
                      >
                        <option value="all">Tất cả khối lớp</option>
                        {gradeOptions.map((gr) => (
                          <option key={gr} value={gr}>
                            Lớp {gr}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 3. Trạng thái */}
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                        Trạng thái
                      </label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer transition"
                      >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="completed">Đã hoàn thành</option>
                        <option value="generating">Đang tạo AI</option>
                        <option value="draft">Bản nháp</option>
                        <option value="failed">Thất bại</option>
                      </select>
                    </div>

                    {/* 4. Sắp xếp */}
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                        Sắp xếp theo
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer transition"
                      >
                        <option value="newest">Mới nhất trước</option>
                        <option value="oldest">Cũ nhất trước</option>
                        <option value="questions_desc">Nhiều câu hỏi nhất</option>
                        <option value="questions_asc">Ít câu hỏi nhất</option>
                        <option value="name_asc">Tên (A → Z)</option>
                        <option value="name_desc">Tên (Z → A)</option>
                      </select>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      disabled={activeFilterCount === 0}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:hover:text-muted-foreground transition cursor-pointer disabled:cursor-not-allowed"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Đặt lại</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">
                        Hiển thị <strong>{filteredExams.length}</strong> đề
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsFilterOpen(false)}
                        className="rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition shadow-xs cursor-pointer"
                      >
                        Xong
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active filter badge pills */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Bộ lọc đang bật:</span>
            {selectedSubject !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 text-blue-600 dark:text-blue-400 font-medium">
                <span>
                  Môn: <strong>{selectedSubject}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedSubject("all")}
                  className="hover:text-blue-800 dark:hover:text-blue-200 cursor-pointer ml-0.5"
                  title="Xóa lọc môn này"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedGrade !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 text-purple-600 dark:text-purple-400 font-medium">
                <span>
                  Lớp: <strong>{selectedGrade}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedGrade("all")}
                  className="hover:text-purple-800 dark:hover:text-purple-200 cursor-pointer ml-0.5"
                  title="Xóa lọc lớp này"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedStatus !== "all" && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <span>
                  Trạng thái:{" "}
                  <strong>
                    {selectedStatus === "completed"
                      ? "Hoàn thành"
                      : selectedStatus === "generating"
                      ? "Đang tạo AI"
                      : selectedStatus === "draft"
                      ? "Bản nháp"
                      : "Thất bại"}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedStatus("all")}
                  className="hover:text-emerald-800 dark:hover:text-emerald-200 cursor-pointer ml-0.5"
                  title="Xóa lọc trạng thái này"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {sortBy !== "newest" && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-amber-600 dark:text-amber-400 font-medium">
                <span>
                  Sắp xếp:{" "}
                  <strong>
                    {sortBy === "oldest"
                      ? "Cũ nhất"
                      : sortBy === "questions_desc"
                      ? "Nhiều câu nhất"
                      : sortBy === "questions_asc"
                      ? "Ít câu nhất"
                      : sortBy === "name_asc"
                      ? "Tên A-Z"
                      : "Tên Z-A"}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => setSortBy("newest")}
                  className="hover:text-amber-800 dark:hover:text-amber-200 cursor-pointer ml-0.5"
                  title="Đặt lại sắp xếp mặc định"
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

      {/* Exam List */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <BookOpen className="h-6 w-6 text-muted-foreground" />
            </div>
            {exams.length === 0 ? (
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
                  onClick={() => {
                    setSearch("");
                    handleResetFilters();
                  }}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Xóa tìm kiếm & đặt lại bộ lọc</span>
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            <div className="grid grid-cols-12 gap-4 p-4 text-xs font-semibold text-muted-foreground sm:grid">
              <div className="col-span-5 sm:col-span-4">Tên đề thi</div>
              <div className="hidden sm:col-span-2 sm:block">Môn / Lớp</div>
              <div className="hidden sm:col-span-1 sm:block">Số câu</div>
              <div className="hidden sm:col-span-2 sm:block">Ngày tạo</div>
              <div className="col-span-7 text-right sm:col-span-3">Thao tác</div>
            </div>
            {filteredExams.map((exam) => (
              <div
                key={exam.id}
                className="grid grid-cols-12 items-center gap-4 p-4 transition-colors hover:bg-muted/50"
              >
                <div className="col-span-12 sm:col-span-4">
                  <div className="overflow-hidden">
                    <Link href={`/exams/${exam.id}`} className="truncate font-medium hover:text-primary">
                      {exam.name}
                    </Link>
                    <span
                      className={`ml-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium sm:hidden ${
                        exam.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : exam.status === "generating"
                          ? "bg-blue-100 text-blue-700"
                          : exam.status === "failed"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {exam.status === "completed"
                        ? "Hoàn thành"
                        : exam.status === "generating"
                        ? "Đang tạo"
                        : exam.status === "failed"
                        ? "Thất bại"
                        : "Nháp"}
                    </span>
                  </div>
                </div>
                <div className="hidden text-sm text-muted-foreground sm:col-span-2 sm:block">
                  {exam.subject} - Lớp {exam.grade}
                </div>
                <div className="hidden text-sm tabular-nums sm:col-span-1 sm:block">{exam.question_count} câu</div>
                <div className="hidden text-sm tabular-nums text-muted-foreground sm:col-span-2 sm:block">
                  {new Date(exam.created_at).toLocaleDateString("vi-VN")}
                </div>
                <div className="flex items-center justify-end gap-1 sm:col-span-3 flex-wrap sm:flex-nowrap">
                  <Link
                    href={`/teach/${exam.id}`}
                    aria-label={`Trình chiếu Bục Giảng Số đề ${exam.name}`}
                    className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 min-h-[36px] text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 transition-colors shadow-2xs whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
                    title="Bục Giảng Số: Trình chiếu chữa đề kết hợp Bảng nháp Excalidraw (Gói PRO)"
                  >
                    <Presentation className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>Bục giảng</span>
                  </Link>

                  <Link
                    href={`/exams/${exam.id}`}
                    aria-label={`Xem và chỉnh sửa đề ${exam.name}`}
                    className="h-9 w-9 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    title="Xem & Chỉnh sửa"
                  >
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  </Link>
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
                  <button
                    type="button"
                    onClick={() => handleMagicLinkClick(exam)}
                    aria-label={`Giao đề online qua Magic Link cho đề ${exam.name}`}
                    className="h-9 w-9 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 shrink-0"
                    title="Giao đề Online qua Magic Link (Đặc quyền MAX)"
                  >
                    <Share2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(exam.id)}
                    disabled={deletingId === exam.id}
                    aria-label={`Xóa đề ${exam.name}`}
                    className="h-9 w-9 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-destructive shrink-0"
                    title="Xóa"
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
      </div>

      {/* Modal Magic Link Giao đề Online (Gói MAX) */}
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
              Học sinh chỉ cần mở liên kết hoặc quét mã QR dưới đây trên điện thoại để làm bài trực tuyến. Không cần đăng nhập, hệ thống tự động ghi nhận điểm số và lập bảng xếp hạng.
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
                  value={
                    typeof window !== "undefined"
                      ? `${window.location.origin}/grading/submit/${magicLinkExam.id}?name=${encodeURIComponent(
                          magicLinkExam.name
                        )}`
                      : `https://eduteast.vn/grading/submit/${magicLinkExam.id}`
                  }
                  className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => {
                    const link =
                      typeof window !== "undefined"
                        ? `${window.location.origin}/grading/submit/${magicLinkExam.id}?name=${encodeURIComponent(
                            magicLinkExam.name
                          )}`
                        : `https://eduteast.vn/grading/submit/${magicLinkExam.id}`;
                    navigator.clipboard.writeText(link);
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
        requiredTier={upgradeTier || "max"}
        featureTitle="Giao đề Online qua Magic Link (Không cần tài khoản)"
        featureDesc="Đặc quyền Gói Luyện Thi MAX: Biến mọi đề thi trong kho của bạn thành liên kết và mã QR trực tuyến gửi qua Zalo. Học sinh làm bài tức thì trên điện thoại, hệ thống tự động chấm điểm và xếp hạng cả lớp."
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
