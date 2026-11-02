"use client";

import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Copy,
  Trash2,
  Layers,
  FileDown,
  X,
  Edit2,
  Check,
} from "lucide-react";
import { WhiteboardPage } from "@/types/whiteboard";

interface BottomSlideBarProps {
  pages: WhiteboardPage[];
  currentPageIndex: number;
  onSelectPage: (index: number) => void;
  onAddPage: () => void;
  onDuplicatePage: (index: number) => void;
  onDeletePage: (index: number) => void;
  onRenamePage?: (index: number, newTitle: string) => void;
  onExportAllPagesPdf?: () => void;
  isExportingPdf?: boolean;
}

export function BottomSlideBar({
  pages,
  currentPageIndex,
  onSelectPage,
  onAddPage,
  onDuplicatePage,
  onDeletePage,
  onRenamePage,
  onExportAllPagesPdf,
  isExportingPdf = false,
}: BottomSlideBarProps) {
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const totalPages = Math.max(1, pages.length);
  const currentPage = pages[currentPageIndex] || {
    id: "p1",
    title: `Trang ${currentPageIndex + 1}`,
    elements: [],
  };

  const handlePrev = () => {
    if (currentPageIndex > 0) {
      onSelectPage(currentPageIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentPageIndex < totalPages - 1) {
      onSelectPage(currentPageIndex + 1);
    }
  };

  const startRename = (idx: number, currentTitle: string) => {
    setEditingIndex(idx);
    setEditingTitle(currentTitle);
  };

  const commitRename = (idx: number) => {
    if (onRenamePage && editingTitle.trim()) {
      onRenamePage(idx, editingTitle.trim());
    }
    setEditingIndex(null);
  };

  return (
    <>
      {/* Bottom Floating Slide Bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border border-border bg-card/95 backdrop-blur-md text-card-foreground shadow-xl select-none text-xs">
        {/* Prev Slide */}
        <button
          onClick={handlePrev}
          disabled={currentPageIndex <= 0}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
          title="Trang trước (Phím mũi tên trái)"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Current Slide Display / Drawer Toggle */}
        <button
          onClick={() => setShowDrawer(!showDrawer)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-muted font-bold text-foreground transition cursor-pointer"
          title="Mở danh sách các trang slide"
        >
          <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>
            Trang {currentPageIndex + 1} / {totalPages}
          </span>
        </button>

        {/* Next Slide */}
        <button
          onClick={handleNext}
          disabled={currentPageIndex >= totalPages - 1}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
          title="Trang tiếp (Phím mũi tên phải)"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-border mx-1" />

        {/* Add Page Button */}
        <button
          onClick={onAddPage}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-xs cursor-pointer active:scale-95"
          title="Thêm trang mới"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Thêm trang</span>
        </button>

        {/* Duplicate Current Slide */}
        <button
          onClick={() => onDuplicatePage(currentPageIndex)}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
          title="Nhân bản trang này"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>

        {/* Delete Current Slide */}
        <button
          onClick={() => onDeletePage(currentPageIndex)}
          disabled={totalPages <= 1}
          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
          title="Xóa trang này"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>

        {/* Export All Slides to PDF */}
        {onExportAllPagesPdf && (
          <>
            <div className="h-4 w-px bg-border mx-1" />
            <button
              onClick={onExportAllPagesPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-1 px-2 py-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
              title="Xuất toàn bộ các trang bài giảng thành 1 tệp PDF"
            >
              <FileDown className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden md:inline">Xuất PDF tất cả</span>
            </button>
          </>
        )}
      </div>

      {/* Slide Drawer (Thumbnails and management) */}
      {showDrawer && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-40 w-[94vw] max-w-3xl rounded-2xl border border-border bg-card/95 backdrop-blur-md shadow-2xl p-4 animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <h4 className="text-sm font-bold text-foreground">
                Quản lý các trang bài giảng ({totalPages} trang)
              </h4>
            </div>
            <button
              onClick={() => setShowDrawer(false)}
              className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 pr-1">
            {pages.map((p, idx) => {
              const isActive = idx === currentPageIndex;
              return (
                <div
                  key={p.id || idx}
                  className={`group relative flex-none w-44 rounded-xl border p-2 transition cursor-pointer flex flex-col justify-between ${
                    isActive
                      ? "border-blue-600 bg-blue-50/20 ring-2 ring-blue-500/30"
                      : "border-border bg-background hover:border-border/80"
                  }`}
                  onClick={() => onSelectPage(idx)}
                >
                  {/* Thumbnail / Placeholder Canvas */}
                  <div className="w-full h-24 rounded-lg bg-muted/40 border border-border/60 flex items-center justify-center relative overflow-hidden mb-2">
                    {p.thumbnail_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={p.thumbnail_url}
                        alt={p.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-[10px] text-muted-foreground font-mono text-center p-2">
                        {p.elements?.length ? `${p.elements.length} đối tượng` : "Trang trống"}
                      </div>
                    )}
                    <span className="absolute top-1 left-1.5 px-1.5 py-0.2 rounded bg-black/60 text-white font-bold text-[9px]">
                      {idx + 1}
                    </span>
                  </div>

                  {/* Title / Renaming */}
                  <div className="flex items-center justify-between gap-1 text-xs">
                    {editingIndex === idx ? (
                      <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && commitRename(idx)}
                          className="w-full text-xs p-1 rounded border border-border bg-background text-foreground"
                          autoFocus
                        />
                        <button
                          onClick={() => commitRename(idx)}
                          className="p-1 rounded bg-blue-600 text-white"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="font-semibold text-foreground truncate max-w-[120px]">
                          {p.title || `Trang ${idx + 1}`}
                        </span>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startRename(idx, p.title || `Trang ${idx + 1}`);
                            }}
                            className="p-1 rounded hover:bg-muted text-muted-foreground"
                            title="Đổi tên"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDuplicatePage(idx);
                            }}
                            className="p-1 rounded hover:bg-muted text-muted-foreground"
                            title="Nhân bản"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          {totalPages > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeletePage(idx);
                              }}
                              className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                              title="Xóa"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Quick Add Slide Card */}
            <div
              onClick={onAddPage}
              className="flex-none w-32 h-36 rounded-xl border border-dashed border-border hover:border-primary flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition cursor-pointer p-4 bg-muted/10 hover:bg-muted/20"
            >
              <Plus className="w-5 h-5" />
              <span className="text-xs font-semibold">Thêm trang</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
