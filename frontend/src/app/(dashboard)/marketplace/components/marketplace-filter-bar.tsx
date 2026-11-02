"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  X,
  Gift,
  Coins,
  CheckCircle2,
  UserCheck,
  ArrowUpDown,
  SlidersHorizontal,
} from "lucide-react";

export type MarketplaceTab = "all" | "free" | "paid" | "purchased" | "my_listings";
export type MarketplaceSort = "newest" | "popular" | "price_asc" | "price_desc";

interface TabCounts {
  all: number;
  free: number;
  paid: number;
  purchased: number;
  myListings: number;
}

interface MarketplaceFilterBarProps {
  activeTab: MarketplaceTab;
  onTabChange: (tab: MarketplaceTab) => void;
  search: string;
  onSearchChange: (val: string) => void;
  selectedSubject: string;
  onSubjectChange: (val: string) => void;
  selectedGrade: string;
  onGradeChange: (val: string) => void;
  selectedSort: MarketplaceSort;
  onSortChange: (val: MarketplaceSort) => void;
  tabCounts: TabCounts;
  totalFiltered: number;
  loading: boolean;
}

const SUBJECT_OPTIONS = [
  { value: "all", label: "Tất cả môn học" },
  { value: "Toán", label: "Toán học" },
  { value: "Vật lí", label: "Vật lí" },
  { value: "Hóa học", label: "Hóa học" },
  { value: "Sinh học", label: "Sinh học" },
  { value: "Tiếng Anh", label: "Tiếng Anh" },
  { value: "Ngữ văn", label: "Ngữ văn" },
  { value: "Lịch sử", label: "Lịch sử" },
  { value: "Địa lí", label: "Địa lí" },
  { value: "Tin học", label: "Tin học" },
  { value: "GDCD", label: "GDCD / GDKT&PL" },
  { value: "Công nghệ", label: "Công nghệ" },
  { value: "KHTN", label: "KHTN" },
];

const GRADE_OPTIONS = [
  { value: "all", label: "Tất cả khối lớp" },
  { value: "12", label: "Khối 12" },
  { value: "11", label: "Khối 11" },
  { value: "10", label: "Khối 10" },
  { value: "9", label: "Khối 9" },
  { value: "8", label: "Khối 8" },
  { value: "7", label: "Khối 7" },
  { value: "6", label: "Khối 6" },
];

const SORT_OPTIONS: { value: MarketplaceSort; label: string }[] = [
  { value: "newest", label: "Mới nhất" },
  { value: "popular", label: "Tải nhiều nhất" },
  { value: "price_asc", label: "Giá tăng dần" },
  { value: "price_desc", label: "Giá giảm dần" },
];

export function MarketplaceFilterBar({
  activeTab,
  onTabChange,
  search,
  onSearchChange,
  selectedSubject,
  onSubjectChange,
  selectedGrade,
  onGradeChange,
  selectedSort,
  onSortChange,
  tabCounts,
  totalFiltered,
  loading,
}: MarketplaceFilterBarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [localSearch, setLocalSearch] = useState(search);

  // Sync external search state with local state
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  // Debounce search update (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== search) {
        onSearchChange(localSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, search, onSearchChange]);

  // Shortcut key: "/" to focus search input
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const tabs: { id: MarketplaceTab; label: string; icon?: React.ReactNode; count: number }[] = [
    { id: "all", label: "Tất cả đề", count: tabCounts.all },
    {
      id: "free",
      label: "Đề miễn phí",
      icon: <Gift className="w-3.5 h-3.5" />,
      count: tabCounts.free,
    },
    {
      id: "paid",
      label: "Đề có phí",
      icon: <Coins className="w-3.5 h-3.5" />,
      count: tabCounts.paid,
    },
    {
      id: "purchased",
      label: "Đã sở hữu",
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
      count: tabCounts.purchased,
    },
    {
      id: "my_listings",
      label: "Đề tôi đã đăng",
      icon: <UserCheck className="w-3.5 h-3.5 text-primary" />,
      count: tabCounts.myListings,
    },
  ];

  return (
    <div className="bg-card rounded-2xl p-4 border border-border shadow-xs space-y-3.5 sticky top-2 z-20 backdrop-blur-md bg-card/95">
      {/* Top Row: Segmented Pills Tabs + Count Display */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-3">
        {/* Scrollable Tabs */}
        <div
          role="tablist"
          aria-label="Phân loại đề thi"
          className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none"
        >
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={isSelected}
                onClick={() => onTabChange(tab.id)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-semibold transition ${
                    isSelected
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {loading ? (
                    <span className="inline-block w-3.5 h-2 bg-current opacity-30 rounded-xs animate-pulse align-middle" />
                  ) : (
                    tab.count
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Counter Info */}
        <div className="text-xs text-muted-foreground font-medium shrink-0 flex items-center gap-1.5 self-end sm:self-center">
          {loading ? (
            <span className="flex items-center gap-1.5">
              <span>Đang tải danh sách đề...</span>
              <span className="w-8 h-3.5 bg-muted rounded-xs animate-pulse inline-block" />
            </span>
          ) : (
            <span>
              Hiển thị <strong className="text-foreground">{totalFiltered}</strong> đề thi
            </span>
          )}
        </div>
      </div>

      {/* Bottom Row: Search Box + Subject Filter + Grade Filter + Sort */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-center">
        {/* Search Input (5 cols on lg) */}
        <div className="relative lg:col-span-5">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Tìm theo tên đề, tác giả, chuyên đề... (Nhấn / để tìm)"
            className="w-full text-xs pl-9 pr-8 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all"
            aria-label="Tìm kiếm đề thi"
          />
          {localSearch ? (
            <button
              type="button"
              onClick={() => {
                setLocalSearch("");
                onSearchChange("");
                searchInputRef.current?.focus();
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted cursor-pointer transition"
              aria-label="Xóa nội dung tìm kiếm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">
              /
            </kbd>
          )}
        </div>

        {/* Subject Select (2 cols on lg) */}
        <div className="lg:col-span-2">
          <select
            value={selectedSubject}
            onChange={(e) => onSubjectChange(e.target.value)}
            className="w-full text-xs py-2.5 px-3 rounded-xl border border-border bg-background text-foreground font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer transition"
            aria-label="Lọc theo môn học"
          >
            {SUBJECT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-card text-card-foreground">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Grade Select (2 cols on lg) */}
        <div className="lg:col-span-2">
          <select
            value={selectedGrade}
            onChange={(e) => onGradeChange(e.target.value)}
            className="w-full text-xs py-2.5 px-3 rounded-xl border border-border bg-background text-foreground font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer transition"
            aria-label="Lọc theo khối lớp"
          >
            {GRADE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-card text-card-foreground">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Select (3 cols on lg) */}
        <div className="lg:col-span-3">
          <div className="relative">
            <select
              value={selectedSort}
              onChange={(e) => onSortChange(e.target.value as MarketplaceSort)}
              className="w-full text-xs py-2.5 px-3 rounded-xl border border-border bg-background text-foreground font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer transition"
              aria-label="Sắp xếp danh sách đề thi"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-card text-card-foreground">
                  Sắp xếp: {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
