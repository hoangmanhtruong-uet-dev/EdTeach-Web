"use client";

import React, { useCallback, useRef } from "react";
import { GripVertical, ChevronLeft, ChevronRight } from "lucide-react";

export interface TeachSplitPaneProps {
  splitRatio: number; // 0 to 100 (% of left pane width)
  onSetSplitRatio: (ratio: number) => void;
  isDragging: boolean;
  onStartDrag: (e: React.MouseEvent | React.TouchEvent) => void;
  leftPane: React.ReactNode;
  rightPane: React.ReactNode;
}

export function TeachSplitPane({
  splitRatio,
  onSetSplitRatio,
  isDragging,
  onStartDrag,
  leftPane,
  rightPane,
}: TeachSplitPaneProps) {
  const lastRatioRef = useRef(50);

  // Keyboard navigation on splitter focus
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onSetSplitRatio(Math.max(15, splitRatio - 5));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onSetSplitRatio(Math.min(85, splitRatio + 5));
      } else if (e.key === "Home") {
        e.preventDefault();
        onSetSplitRatio(15);
      } else if (e.key === "End") {
        e.preventDefault();
        onSetSplitRatio(85);
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSetSplitRatio(50);
      }
    },
    [splitRatio, onSetSplitRatio]
  );

  // Toggle collapse question panel
  const handleToggleCollapse = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (splitRatio > 15) {
        lastRatioRef.current = splitRatio;
        onSetSplitRatio(0);
      } else {
        onSetSplitRatio(lastRatioRef.current || 50);
      }
    },
    [splitRatio, onSetSplitRatio]
  );

  return (
    <div className="flex flex-1 min-h-0 w-full overflow-hidden relative select-none">
      {/* Invisible overlay during drag to prevent iframe / canvas event capturing */}
      {isDragging && (
        <div className="fixed inset-0 z-50 cursor-col-resize select-none" />
      )}

      {/* LEFT PANE (QUESTION PANEL) */}
      {splitRatio > 0 && (
        <div
          className="flex flex-col h-full overflow-hidden transition-all duration-75"
          style={{ width: splitRatio === 100 ? "100%" : `${splitRatio}%` }}
        >
          {leftPane}
        </div>
      )}

      {/* SPLITTER: 12px WIDTH, 24px HIT-AREA, HOVER HIGHLIGHT */}
      {splitRatio > 0 && splitRatio < 100 && (
        <div
          role="separator"
          tabIndex={0}
          aria-valuenow={splitRatio}
          aria-valuemin={15}
          aria-valuemax={85}
          aria-label="Thanh kéo điều chỉnh tỉ lệ màn hình. Nhấn mũi tên Trái/Phải để thay đổi, nhấp đúp để chia đôi 50:50."
          onMouseDown={onStartDrag}
          onTouchStart={onStartDrag}
          onDoubleClick={() => onSetSplitRatio(50)}
          onKeyDown={handleKeyDown}
          title="Kéo sang trái/phải để thu phóng (Nhấp đúp để đặt về 50:50)"
          className={`group relative z-30 flex w-3 shrink-0 cursor-col-resize items-center justify-center bg-slate-950 border-x border-slate-800 transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
            isDragging ? "bg-blue-600 border-blue-500 shadow-lg shadow-blue-500/20" : "hover:bg-blue-600/60"
          }`}
        >
          {/* 24px HIT AREA (Invisible padding to make grabbing effortless on touch/mouse) */}
          <div className="absolute inset-y-0 -left-1.5 -right-1.5 cursor-col-resize" />

          {/* Grip Icon */}
          <div className="flex h-12 w-3.5 items-center justify-center rounded-full bg-slate-800 text-slate-400 group-hover:bg-blue-500 group-hover:text-white transition-all pointer-events-none shadow-sm">
            <GripVertical className="h-3 w-3" />
          </div>

          {/* Quick Collapse Button on Splitter */}
          <button
            type="button"
            onClick={handleToggleCollapse}
            aria-label={splitRatio > 15 ? "Thu gọn cột câu hỏi" : "Mở rộng cột câu hỏi"}
            title={splitRatio > 15 ? "Thu gọn cột câu hỏi" : "Mở rộng cột câu hỏi"}
            className="absolute top-1/2 -translate-y-1/2 -left-3.5 h-6 w-6 rounded-full bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 hidden group-hover:flex items-center justify-center text-xs shadow-md z-40 transition cursor-pointer"
          >
            {splitRatio > 15 ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}

      {/* RIGHT PANE (WHITEBOARD / LAB 3D / MULTI-METHOD) */}
      {splitRatio < 100 && (
        <div
          className="flex flex-col h-full overflow-hidden transition-all duration-75 relative bg-slate-950"
          style={{ width: splitRatio === 0 ? "100%" : `${100 - splitRatio}%` }}
        >
          {rightPane}
        </div>
      )}
    </div>
  );
}
