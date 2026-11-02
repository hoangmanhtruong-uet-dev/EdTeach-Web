"use client";

import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  Moon,
  Sun,
  Grid,
  Maximize2,
  Minimize2,
  Trash2,
  Pin,
  CheckCircle2,
  Loader2,
  Compass,
} from "lucide-react";
import { BoardTheme } from "@/lib/whiteboard/board-themes";

const WhiteboardCanvas = dynamic(
  () => import("@/components/whiteboard/whiteboard-canvas"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
          <p className="text-xs font-semibold">Đang chuẩn bị Bảng nháp Sư phạm…</p>
        </div>
      </div>
    ),
  }
);

export interface TeachWhiteboardWrapperProps {
  isPro: boolean;
  onApiReady: (api: any) => void;
  onChange: (elements: readonly Record<string, unknown>[]) => void;
  onClearDrawing: () => void;
  onPinQuestion: () => void;
  isMaximized: boolean;
  onToggleMaximize: () => void;
  hasSavedDrawing: boolean;
}

export function TeachWhiteboardWrapper({
  isPro,
  onApiReady,
  onChange,
  onClearDrawing,
  onPinQuestion,
  isMaximized,
  onToggleMaximize,
  hasSavedDrawing,
}: TeachWhiteboardWrapperProps) {
  // Whiteboard theme state: Default dark #0b1220 with light strokes
  const [isDark, setIsDark] = useState(true);
  const [pattern, setPattern] = useState<"none" | "student_grid" | "coord_oxy">("none");

  // Construct active board theme
  const activeTheme = useMemo<BoardTheme>(() => {
    return {
      id: "teach_dark",
      name: isDark ? "Bảng tối sư phạm" : "Bảng trắng văn phòng",
      description: "Tối ưu cho bục giảng trình chiếu",
      iconName: isDark ? "Moon" : "Sun",
      viewBackgroundColor: isDark ? "#0b1220" : "#ffffff",
      defaultStrokeColor: isDark ? "#ffffff" : "#0f172a",
      penPalette: isDark
        ? ["#ffffff", "#fde047", "#60a5fa", "#34d399", "#f472b6", "#fb923c"]
        : ["#0f172a", "#2563eb", "#dc2626", "#16a34a", "#7c3aed"],
      isDark,
      gridSize: 20,
      pattern: pattern === "coord_oxy" ? "coord_oxy" : pattern === "student_grid" ? "student_grid" : "none",
    };
  }, [isDark, pattern]);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-slate-950 relative select-none">
      {/* 1. TOP SUBBAR: THEME & PATTERN TOOLBAR */}
      <div className="flex-none h-11 border-b border-slate-800 bg-slate-900/90 px-3 flex items-center justify-between z-20 text-xs">
        {/* Left: Background Theme + Grid Options */}
        <div className="flex items-center gap-2">
          {/* Dark / Light Toggle */}
          <button
            type="button"
            onClick={() => setIsDark((prev) => !prev)}
            aria-label={isDark ? "Chuyển sang nền trắng" : "Chuyển sang nền tối"}
            title={isDark ? "Chuyển sang nền bảng trắng" : "Chuyển sang nền tối #0b1220"}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-2.5 py-1 font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition cursor-pointer"
          >
            {isDark ? (
              <>
                <Moon className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Nền tối</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">Nền trắng</span>
              </>
            )}
          </button>

          {/* Pattern Options Segment: Trơn / Lưới / Oxy */}
          <div
            role="group"
            aria-label="Tùy chọn phông nền bảng"
            className="flex items-center rounded-xl bg-slate-950 p-0.5 border border-slate-800"
          >
            <button
              type="button"
              onClick={() => setPattern("none")}
              title="Phông nền trơn không lưới"
              className={`rounded-lg px-2 py-0.5 font-semibold transition cursor-pointer ${
                pattern === "none"
                  ? "bg-slate-800 text-blue-400 shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Trơn
            </button>
            <button
              type="button"
              onClick={() => setPattern("student_grid")}
              title="Lưới ô vuông tập học sinh"
              className={`flex items-center gap-1 rounded-lg px-2 py-0.5 font-semibold transition cursor-pointer ${
                pattern === "student_grid"
                  ? "bg-slate-800 text-blue-400 shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Grid className="w-3 h-3" />
              <span>Ô vuông</span>
            </button>
            <button
              type="button"
              onClick={() => setPattern("coord_oxy")}
              title="Hệ trục tọa độ Oxy (Toán học)"
              className={`flex items-center gap-1 rounded-lg px-2 py-0.5 font-semibold transition cursor-pointer ${
                pattern === "coord_oxy"
                  ? "bg-slate-800 text-blue-400 shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Compass className="w-3 h-3" />
              <span>Trục Oxy</span>
            </button>
          </div>
        </div>

        {/* Right: Pin Question + Clear + Save Status + Maximize */}
        <div className="flex items-center gap-2">
          {/* Nút Đưa đề lên bảng vẽ */}
          <button
            type="button"
            onClick={onPinQuestion}
            aria-label="Đưa đề lên bảng vẽ"
            title="Ghim nội dung câu hỏi lên bảng để viết trực tiếp xung quanh đề"
            className="flex items-center gap-1 rounded-xl border border-blue-500/40 bg-blue-600/20 px-2.5 py-1 font-bold text-blue-300 hover:bg-blue-600/30 transition cursor-pointer"
          >
            <Pin className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Đưa đề lên bảng</span>
          </button>

          {/* Nút Xóa nháp */}
          <button
            type="button"
            onClick={onClearDrawing}
            aria-label="Xóa sạch nét vẽ của câu này"
            title="Xóa trắng bảng nháp của câu hiện tại"
            className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-2 py-1 font-semibold text-red-400 hover:bg-red-950/40 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Xóa nháp</span>
          </button>

          {/* Status badge: Đã lưu ✓ */}
          <div
            className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 shrink-0"
            title={hasSavedDrawing ? "Đã lưu nét vẽ cho câu này" : "Tự động lưu nét vẽ theo từng câu hỏi"}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span className="hidden sm:inline">{hasSavedDrawing ? "Đã lưu nét vẽ ✓" : "Đã lưu ✓"}</span>
          </div>

          {/* Maximize / Restore Button */}
          <button
            type="button"
            onClick={onToggleMaximize}
            aria-label={isMaximized ? "Thu nhỏ bảng về chia đôi 50:50" : "Phóng to tối đa bảng vẽ"}
            title={isMaximized ? "Thu nhỏ về 50:50" : "Bung to bảng vẽ"}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
          >
            {isMaximized ? (
              <Minimize2 className="w-3.5 h-3.5 text-blue-400" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* 2. EXCALIDRAW CANVAS */}
      <div className="flex-1 w-full h-[calc(100%-44px)] relative">
        <WhiteboardCanvas
          height="100%"
          isPro={isPro}
          theme={activeTheme}
          initialElements={[]}
          onApiReady={onApiReady}
          onChange={onChange}
        />
      </div>
    </div>
  );
}
