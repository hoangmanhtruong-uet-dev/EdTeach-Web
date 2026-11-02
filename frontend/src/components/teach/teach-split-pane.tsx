"use client";

import React, { useCallback, useRef, useState, useEffect } from "react";
import { GripVertical, ChevronLeft, ChevronRight } from "lucide-react";

export interface TeachSplitPaneProps {
  splitRatio: number; // 0 to 100 (% of left pane width)
  onSetSplitRatio: (ratio: number) => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  leftPane: React.ReactNode;
  rightPane: React.ReactNode;
}

const STORAGE_KEY = "edteach_split_ratio";

export function TeachSplitPane({
  splitRatio,
  onSetSplitRatio,
  isDragging,
  setIsDragging,
  leftPane,
  rightPane,
}: TeachSplitPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentRatioRef = useRef<number>(splitRatio);
  const [isSnapped, setIsSnapped] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const rafRef = useRef<number | null>(null);

  // Sync split ratio when changed from outside (e.g. presets)
  useEffect(() => {
    currentRatioRef.current = splitRatio;
    if (containerRef.current) {
      containerRef.current.style.setProperty("--split", `${splitRatio}%`);
    }
  }, [splitRatio]);

  // Pointer Down on Splitter
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsDragging(true);
      setIsTransitioning(false);
    },
    [setIsDragging]
  );

  // Pointer Move with rAF and direct CSS variable update (NO setState per frame)
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging || !containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const totalWidth = rect.width;
      if (totalWidth <= 0) return;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      rafRef.current = requestAnimationFrame(() => {
        const rawPx = e.clientX - rect.left;

        // Constraints:
        // Left column min 340px, max 70% of screen
        // Right board min 360px
        const minLeftPx = 340;
        const maxLeftPx = Math.min(totalWidth * 0.7, totalWidth - 360);

        let clampedPx = Math.max(minLeftPx, Math.min(maxLeftPx, rawPx));

        // Snap targets: 30%, 50%, 70% within +/- 12px
        const snap30Px = totalWidth * 0.3;
        const snap50Px = totalWidth * 0.5;
        const snap70Px = totalWidth * 0.7;

        let snapped = false;
        if (Math.abs(clampedPx - snap50Px) <= 12) {
          clampedPx = snap50Px;
          snapped = true;
        } else if (Math.abs(clampedPx - snap30Px) <= 12) {
          clampedPx = snap30Px;
          snapped = true;
        } else if (Math.abs(clampedPx - snap70Px) <= 12) {
          clampedPx = snap70Px;
          snapped = true;
        }

        setIsSnapped(snapped);

        const newRatio = Math.round((clampedPx / totalWidth) * 100);
        currentRatioRef.current = newRatio;

        // Write directly to CSS variable on container (Zero React re-render thrashing!)
        container.style.setProperty("--split", `${newRatio}%`);
      });
    },
    [isDragging]
  );

  // Pointer Up: Release capture, commit ratio, dispatch resize event once
  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }

      setIsDragging(false);
      setIsSnapped(false);

      const finalRatio = currentRatioRef.current;
      onSetSplitRatio(finalRatio);

      // Save to localStorage
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY, String(finalRatio));
        } catch {
          // ignore
        }
      }

      // Notify Excalidraw / listeners ONCE after dragging ends
      requestAnimationFrame(() => {
        window.dispatchEvent(new Event("resize"));
      });
    },
    [isDragging, setIsDragging, onSetSplitRatio]
  );

  // Keyboard navigation on splitter focus
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let delta = 0;
      if (e.key === "ArrowLeft") delta = -3;
      else if (e.key === "ArrowRight") delta = 3;
      else if (e.key === "Home") {
        e.preventDefault();
        onSetSplitRatio(30);
        return;
      } else if (e.key === "End") {
        e.preventDefault();
        onSetSplitRatio(70);
        return;
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSetSplitRatio(50);
        return;
      }

      if (delta !== 0) {
        e.preventDefault();
        const next = Math.max(30, Math.min(70, splitRatio + delta));
        onSetSplitRatio(next);
      }
    },
    [splitRatio, onSetSplitRatio]
  );

  // Transition end handler for preset switches (e.g. 70:30, 50:50)
  const handleTransitionEnd = useCallback(() => {
    setIsTransitioning(false);
    window.dispatchEvent(new Event("resize"));
  }, []);

  // Collapse / Expand toggle button on splitter
  const lastRatioRef = useRef(50);
  const handleToggleCollapse = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsTransitioning(true);
      if (splitRatio > 15) {
        lastRatioRef.current = splitRatio;
        onSetSplitRatio(0);
      } else {
        onSetSplitRatio(lastRatioRef.current || 50);
      }
    },
    [splitRatio, onSetSplitRatio]
  );

  const isLeftVisible = splitRatio > 0;
  const isRightVisible = splitRatio < 100;
  const isSplitActive = isLeftVisible && isRightVisible;

  return (
    <div
      ref={containerRef}
      className={`flex flex-1 min-h-0 w-full overflow-hidden relative select-none ${
        isDragging ? "cursor-col-resize" : ""
      }`}
      style={{
        ["--split" as string]: `${splitRatio}%`,
      }}
    >
      {/* Invisible overlay during drag to capture pointer events cleanly over iframes/canvas */}
      {isDragging && (
        <div className="fixed inset-0 z-50 cursor-col-resize select-none pointer-events-auto bg-transparent" />
      )}

      {/* LEFT PANE (QUESTION PANE) */}
      {isLeftVisible && (
        <div
          onTransitionEnd={handleTransitionEnd}
          className={`flex flex-col h-full overflow-hidden transition-[width] duration-200 ease-out ${
            isDragging ? "!transition-none pointer-events-none select-none" : ""
          }`}
          style={{
            width: splitRatio === 100 ? "100%" : "var(--split, 50%)",
            minWidth: splitRatio === 100 ? undefined : "340px",
          }}
        >
          {leftPane}
        </div>
      )}

      {/* SPLITTER: 12px WIDTH, 24px HIT-AREA, HOVER HIGHLIGHT */}
      {isSplitActive && (
        <div
          role="separator"
          tabIndex={0}
          aria-valuenow={splitRatio}
          aria-valuemin={30}
          aria-valuemax={70}
          aria-label="Thanh kéo chia cột đề thi và bảng vẽ. Nhấn phím mũi tên Trái/Phải để chỉnh, nhấp đúp để chia đôi 50:50."
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onDoubleClick={() => {
            setIsTransitioning(true);
            onSetSplitRatio(50);
          }}
          onKeyDown={handleKeyDown}
          title="Kéo sang trái/phải để thu phóng (Nhấp đúp để đặt về 50:50)"
          className={`group relative z-30 flex w-3 shrink-0 cursor-col-resize items-center justify-center bg-slate-950 border-x border-slate-800 transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
            isDragging
              ? "bg-blue-600 border-blue-500 shadow-lg shadow-blue-500/20"
              : isSnapped
              ? "bg-emerald-600 border-emerald-500"
              : "hover:bg-blue-600/70"
          }`}
        >
          {/* 24px HIT AREA */}
          <div className="absolute inset-y-0 -left-1.5 -right-1.5 cursor-col-resize" />

          {/* Grip Icon with Snap Cue */}
          <div
            className={`flex h-12 w-3.5 items-center justify-center rounded-full shadow-sm transition-all pointer-events-none ${
              isSnapped
                ? "bg-emerald-500 text-white ring-2 ring-emerald-400 scale-110"
                : isDragging
                ? "bg-blue-500 text-white scale-105"
                : "bg-slate-800 text-slate-400 group-hover:bg-blue-500 group-hover:text-white"
            }`}
          >
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
            {splitRatio > 15 ? (
              <ChevronLeft className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      )}

      {/* RIGHT PANE (WHITEBOARD / LAB 3D / MULTI-METHOD) */}
      {isRightVisible && (
        <div
          onTransitionEnd={handleTransitionEnd}
          className={`flex flex-col h-full overflow-hidden transition-[width] duration-200 ease-out relative bg-slate-950 ${
            isDragging ? "!transition-none pointer-events-none select-none" : ""
          }`}
          style={{
            width: splitRatio === 0 ? "100%" : "calc(100% - var(--split, 50%))",
            minWidth: splitRatio === 0 ? undefined : "360px",
          }}
        >
          {rightPane}
        </div>
      )}
    </div>
  );
}
