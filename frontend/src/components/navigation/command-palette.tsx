"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  FilePlus,
  FolderOpen,
  Presentation,
  ScanLine,
  FlaskConical,
  Store,
  Wallet,
  Settings,
  Crown,
  Gift,
  HelpCircle,
  Sun,
  Moon,
  ArrowRight,
  FileText,
  Sparkles,
} from "lucide-react";
import { getUserExams, Exam } from "@/lib/api/exams";

interface CommandItem {
  id: string;
  label: string;
  subtext?: string;
  category: "actions" | "exams" | "system";
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  onSelect?: () => void;
  badge?: string;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Toggle Command Palette with Ctrl+K / Cmd+K or custom event
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    const handleOpenCustom = () => setIsOpen(true);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-command-palette", handleOpenCustom);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-command-palette", handleOpenCustom);
    };
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);

      // Pre-load recent exams for instant search
      setLoadingExams(true);
      getUserExams(15, 0)
        .then((res) => setExams(res.exams))
        .catch(() => setExams([]))
        .finally(() => setLoadingExams(false));
    }
  }, [isOpen]);

  // Toggle theme action
  const toggleTheme = useCallback(() => {
    const isDark = document.documentElement.classList.contains("dark");
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("app_theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("app_theme", "dark");
    }
    setIsOpen(false);
  }, []);

  const latestExam = exams.length > 0 ? exams[0] : null;

  // Build items list
  const baseActions: CommandItem[] = [
    {
      id: "create_exam",
      label: "Tạo Đề Thi Mới Bằng AI",
      subtext: "Chuẩn ma trận GDPT 2025 gồm 3 phần",
      category: "actions",
      icon: FilePlus,
      href: "/exams/create",
      badge: "AI 2025",
    },
    {
      id: "my_exams",
      label: "Kho Đề Thi Của Tôi",
      subtext: "Quản lý và xuất bản in file Word",
      category: "actions",
      icon: FolderOpen,
      href: "/exams",
    },
    {
      id: "teach",
      label: "Bục Giảng Số 4.0",
      subtext: latestExam ? `Trình chiếu đề: ${latestExam.name}` : "Chiếu Split-Screen & Kính vẽ Excalidraw",
      category: "actions",
      icon: Presentation,
      href: latestExam ? `/teach/${latestExam.id}` : "/exams",
      badge: "PRO/MAX",
    },
    {
      id: "grading",
      label: "Máy Chấm Trắc Nghiệm OMR",
      subtext: "Quét camera / điện thoại nhận diện tô chì",
      category: "actions",
      icon: ScanLine,
      href: "/grading",
      badge: "OpenCV",
    },
    {
      id: "labs",
      label: "Phòng Thí Nghiệm 3D (54+ Bài)",
      subtext: "Vật lý, Hóa học, Sinh học, Địa lý tương tác",
      category: "actions",
      icon: FlaskConical,
      href: "/labs",
      badge: "3D STEM",
    },
    {
      id: "whiteboard",
      label: "Bảng Trắng Tương Tác Giảng Dạy",
      subtext: "Không giới hạn bảng vẽ Excalidraw",
      category: "actions",
      icon: Presentation,
      href: "/whiteboard",
    },
    {
      id: "marketplace",
      label: "Chợ Đề Thi & Giáo Án",
      subtext: "Khám phá và chia sẻ tài liệu dạy học",
      category: "actions",
      icon: Store,
      href: "/marketplace",
    },
    {
      id: "wallet",
      label: "Ví Credits & Nạp Điểm PayOS",
      subtext: "Quản lý số dư, kích hoạt gói PRO/MAX VietQR",
      category: "actions",
      icon: Wallet,
      href: "/settings?tab=credits",
    },
    {
      id: "pricing",
      label: "Gói Cước & Đặc Quyền PRO / MAX",
      subtext: "Xem bảng giá, tính năng sư phạm và nâng cấp gói",
      category: "actions",
      icon: Crown,
      href: "/settings?tab=plan",
    },
    {
      id: "affiliate",
      label: "Chương Trình Đối Tác & Hoa Hồng 20%",
      subtext: "Giới thiệu đồng nghiệp, rút tiền mặt VietQR",
      category: "actions",
      icon: Gift,
      href: "/settings?tab=partner",
    },
    {
      id: "guide",
      label: "Hướng Dẫn Sử Dụng & Cẩm Nang AI",
      subtext: "Soạn đề 2025, trộn 4 mã đề, in phiếu A4 và chấm OMR",
      category: "actions",
      icon: HelpCircle,
      href: "/settings?tab=guide",
    },
    {
      id: "settings",
      label: "Cài Đặt & Tiêu Đề Trường Học",
      subtext: "Tùy biến tên trường, tổ bộ môn khi in đề",
      category: "actions",
      icon: Settings,
      href: "/settings",
    },
    {
      id: "toggle_theme",
      label: "Chuyển Đổi Giao Diện Sáng / Tối",
      subtext: "Chuyển nhanh giữa chế độ Sáng (Slate) và Tối (Obsidian)",
      category: "system",
      icon: Sun,
      onSelect: toggleTheme,
    },
  ];

  // Map exams into items
  const examItems: CommandItem[] = exams.map((exam) => ({
    id: `exam_${exam.id}`,
    label: exam.name,
    subtext: `${exam.subject} • Lớp ${exam.grade} • ${exam.question_count} câu`,
    category: "exams",
    icon: FileText,
    href: `/exams/${exam.id}`,
    badge: exam.status === "completed" ? "Đã xong" : "Nháp",
  }));

  // Filter items based on query
  const q = query.trim().toLowerCase();
  const filteredActions = baseActions.filter(
    (item) => item.label.toLowerCase().includes(q) || (item.subtext && item.subtext.toLowerCase().includes(q))
  );
  const filteredExams = examItems.filter(
    (item) => item.label.toLowerCase().includes(q) || (item.subtext && item.subtext.toLowerCase().includes(q))
  );

  const allFilteredItems = [...filteredActions, ...filteredExams];

  // Handle selection execution
  const executeItem = useCallback(
    (item: CommandItem) => {
      setIsOpen(false);
      if (item.onSelect) {
        item.onSelect();
      } else if (item.href) {
        router.push(item.href);
      }
    },
    [router]
  );

  // Keyboard navigation
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (allFilteredItems.length > 0 ? (prev + 1) % allFilteredItems.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        allFilteredItems.length > 0 ? (prev - 1 + allFilteredItems.length) % allFilteredItems.length : 0
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (allFilteredItems[selectedIndex]) {
        executeItem(allFilteredItems[selectedIndex]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Thanh Lệnh Toàn Năng"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsOpen(false);
      }}
    >
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Tìm đề thi, mở bục giảng, quét OMR, chuyển trang… (hoặc dùng phím ↑ ↓)"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-hidden"
          />
          <kbd className="hidden sm:inline-flex items-center rounded border border-border px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className="overflow-y-auto p-2 divide-y divide-border/40 scrollbar-none flex-1">
          {allFilteredItems.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Không tìm thấy lệnh hoặc đề thi nào khớp với &quot;{query}&quot;
            </div>
          ) : (
            <>
              {/* Quick Actions Group */}
              {filteredActions.length > 0 && (
                <div className="pb-2">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Thao tác nhanh
                  </div>
                  {filteredActions.map((item, idx) => {
                    const isSelected = selectedIndex === idx;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => executeItem(item)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-primary text-primary-foreground shadow-2xs font-semibold"
                            : "hover:bg-muted text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <item.icon
                            className={`w-4 h-4 shrink-0 ${isSelected ? "text-primary-foreground" : "text-muted-foreground"}`}
                          />
                          <div className="truncate">
                            <p className="truncate leading-tight">{item.label}</p>
                            {item.subtext && (
                              <p
                                className={`text-xs truncate leading-tight mt-0.5 ${
                                  isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                                }`}
                              >
                                {item.subtext}
                              </p>
                            )}
                          </div>
                        </div>
                        {item.badge && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase shrink-0 ${
                              isSelected
                                ? "bg-primary-foreground/20 text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Exams Group */}
              {filteredExams.length > 0 && (
                <div className="pt-2">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                    <span>Đề thi gần đây</span>
                    {loadingExams && <span className="text-[10px] lowercase">Đang tải…</span>}
                  </div>
                  {filteredExams.map((item, idx) => {
                    const globalIdx = filteredActions.length + idx;
                    const isSelected = selectedIndex === globalIdx;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => executeItem(item)}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-primary text-primary-foreground shadow-2xs font-semibold"
                            : "hover:bg-muted text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <item.icon
                            className={`w-4 h-4 shrink-0 ${isSelected ? "text-primary-foreground" : "text-muted-foreground"}`}
                          />
                          <div className="truncate">
                            <p className="truncate leading-tight">{item.label}</p>
                            {item.subtext && (
                              <p
                                className={`text-xs truncate leading-tight mt-0.5 ${
                                  isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                                }`}
                              >
                                {item.subtext}
                              </p>
                            )}
                          </div>
                        </div>
                        <ArrowRight
                          className={`w-4 h-4 shrink-0 ${isSelected ? "text-primary-foreground" : "text-muted-foreground"}`}
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2 bg-muted/30 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-mono bg-muted px-1 rounded">↑</kbd> <kbd className="font-mono bg-muted px-1 rounded">↓</kbd> để di chuyển
            </span>
            <span>
              <kbd className="font-mono bg-muted px-1 rounded">↵</kbd> để chọn
            </span>
          </div>
          <span>EduTest AI Power Search</span>
        </div>
      </div>
    </div>
  );
}
