"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Lightbulb,
  FileCode2,
  CheckCircle2,
  X,
  ChevronRight,
  Eye,
} from "lucide-react";
import { LatexRenderer } from "@/components/ui/latex-renderer";

export interface AssistLayersProps {
  explanation?: string;
  correctAnswer?: string;
  activeLayer: 1 | 2 | 3 | null;
  onToggleLayer: (layer: 1 | 2 | 3) => void;
  onClose: () => void;
}

export function AssistLayers({
  explanation,
  correctAnswer,
  activeLayer,
  onToggleLayer,
  onClose,
}: AssistLayersProps) {
  // Step-by-step reveal state for Layer 3 (Lời giải)
  const [revealAll, setRevealAll] = useState(false);
  const [revealedStepIdx, setRevealedStepIdx] = useState(1);
  const [prevExplanation, setPrevExplanation] = useState(explanation);

  // Sync state if explanation changes during render
  if (explanation !== prevExplanation) {
    setPrevExplanation(explanation);
    setRevealedStepIdx(1);
    setRevealAll(false);
  }

  // Split explanation into logical steps/lines
  const solutionSteps = useMemo(() => {
    if (!explanation) {
      return ["Xác định giả thiết bài toán, phân tích câu hỏi và áp dụng định lý cơ bản."];
    }
    const lines = explanation
      .split(/\n\s*\n|\n(?=[0-9]+[.)\-]|Bước|\+|-|\*)/)
      .map((s) => s.trim())
      .filter(Boolean);

    return lines.length > 0 ? lines : [explanation];
  }, [explanation]);

  // Keyboard listener: Esc closes panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      if (e.key === "Escape" && activeLayer !== null) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeLayer, onClose]);

  // Layer 1 hint text
  const hintText = useMemo(() => {
    if (!explanation) {
      return "Xác định các đại lượng đã cho trong bài, thiết lập phương trình liên hệ và biến đổi tương đương để tìm nghiệm.";
    }
    return (
      explanation.split("\n")[0] ||
      "Phân tích giả thiết và câu hỏi để chọn phương pháp giải phù hợp."
    );
  }, [explanation]);

  // Layer 2 formula text
  const formulaText = useMemo(() => {
    if (!explanation) {
      return "Áp dụng định lý biến đổi chuẩn theo chương trình Giáo Dục Phổ Thông 2018.";
    }
    const formulaLines = explanation
      .split("\n")
      .filter((line) => line.includes("$") || line.includes("=") || line.includes("\\"));
    if (formulaLines.length > 0) {
      return formulaLines.join("\n\n");
    }
    return explanation;
  }, [explanation]);

  return (
    <>
      {/* 3 HORIZONTAL CHIPS ROW */}
      <div
        role="tablist"
        aria-label="Các lớp gợi ý và lời giải bài toán"
        className="flex items-center gap-2 w-full flex-nowrap whitespace-nowrap min-w-0"
      >
        {/* Chip 1: Gợi ý */}
        <button
          type="button"
          role="tab"
          aria-selected={activeLayer === 1}
          aria-label="Lớp 1: Gợi ý phương pháp (Phím 1)"
          onClick={() => onToggleLayer(1)}
          className={`flex min-h-[38px] items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            activeLayer === 1
              ? "border-amber-400 bg-amber-500/25 text-amber-200 shadow-md ring-2 ring-amber-400/50"
              : "border-slate-800 bg-slate-900/90 text-amber-300 hover:border-amber-500/40 hover:bg-amber-950/20"
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
          <span className="qpane-chip-label">Gợi ý</span>
          <kbd className="rounded bg-slate-800/80 px-1.5 py-0.2 text-[10px] text-amber-300/80 font-mono">
            1
          </kbd>
        </button>

        {/* Chip 2: Công thức */}
        <button
          type="button"
          role="tab"
          aria-selected={activeLayer === 2}
          aria-label="Lớp 2: Công thức cốt lõi (Phím 2)"
          onClick={() => onToggleLayer(2)}
          className={`flex min-h-[38px] items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            activeLayer === 2
              ? "border-blue-400 bg-blue-500/25 text-blue-200 shadow-md ring-2 ring-blue-400/50"
              : "border-slate-800 bg-slate-900/90 text-blue-300 hover:border-blue-500/40 hover:bg-blue-950/20"
          }`}
        >
          <FileCode2 className="w-3.5 h-3.5 text-blue-400 shrink-0" aria-hidden="true" />
          <span className="qpane-chip-label">Công thức</span>
          <kbd className="rounded bg-slate-800/80 px-1.5 py-0.2 text-[10px] text-blue-300/80 font-mono">
            2
          </kbd>
        </button>

        {/* Chip 3: Lời giải */}
        <button
          type="button"
          role="tab"
          aria-selected={activeLayer === 3}
          aria-label="Lớp 3: Đáp án và lời giải chi tiết (Phím 3)"
          onClick={() => onToggleLayer(3)}
          className={`flex min-h-[38px] items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            activeLayer === 3
              ? "border-emerald-400 bg-emerald-500/25 text-emerald-200 shadow-md ring-2 ring-emerald-400/50"
              : "border-slate-800 bg-slate-900/90 text-emerald-300 hover:border-emerald-500/40 hover:bg-emerald-950/20"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
          <span className="qpane-chip-label">Lời giải</span>
          <kbd className="rounded bg-slate-800/80 px-1.5 py-0.2 text-[10px] text-emerald-300/80 font-mono">
            3
          </kbd>
        </button>
      </div>

      {/* SLIDE-UP PANEL OVERLAY (220ms slide-up, floats over bottom of question container without pushing) */}
      <div
        className={`absolute inset-x-0 bottom-0 z-30 max-h-[75%] rounded-t-3xl border-t border-slate-700 bg-slate-950/98 p-4 sm:p-5 shadow-2xl backdrop-blur-xl transition-all duration-[220ms] ease-out overflow-y-auto flex flex-col justify-between ${
          activeLayer !== null
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        {activeLayer !== null && (
          <div className="space-y-4">
            {/* Header with Title + Close button */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                {activeLayer === 1 && (
                  <>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                      <Lightbulb className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <h3 className="text-sm font-bold text-amber-200 truncate">
                        Lớp 1: Gợi ý phương pháp
                      </h3>
                      <p className="text-[11px] text-slate-400 truncate">Định hướng giải bài</p>
                    </div>
                  </>
                )}
                {activeLayer === 2 && (
                  <>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 shrink-0">
                      <FileCode2 className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <h3 className="text-sm font-bold text-blue-200 truncate">
                        Lớp 2: Công thức cốt lõi
                      </h3>
                      <p className="text-[11px] text-slate-400 truncate">Công thức trọng tâm</p>
                    </div>
                  </>
                )}
                {activeLayer === 3 && (
                  <>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <h3 className="text-sm font-bold text-emerald-200 truncate">
                        Lớp 3: Lời giải chi tiết
                      </h3>
                      <p className="text-[11px] text-slate-400 truncate">
                        {revealAll
                          ? "Đã hiện toàn bộ lời giải"
                          : `Đang dẫn dắt (${revealedStepIdx}/${solutionSteps.length})`}
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Reveal step-by-step buttons in Layer 3 */}
                {activeLayer === 3 && solutionSteps.length > 1 && (
                  <div className="flex items-center gap-1.5 mr-2">
                    {!revealAll && revealedStepIdx < solutionSteps.length && (
                      <button
                        type="button"
                        onClick={() => setRevealedStepIdx((prev) => prev + 1)}
                        className="flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 transition cursor-pointer shadow-sm"
                        title="Hiện dòng/bước giải tiếp theo"
                      >
                        <span>Bước tiếp ({revealedStepIdx + 1})</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setRevealAll((prev) => !prev)}
                      className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition cursor-pointer"
                      title={revealAll ? "Thu gọn về từng bước" : "Hiện tất cả các bước"}
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span>{revealAll ? "Từng bước" : "Hiện tất cả"}</span>
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Đóng bảng gợi ý (Esc)"
                  title="Đóng bảng (Esc)"
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="text-sm leading-relaxed text-slate-200">
              {activeLayer === 1 && (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-4 text-amber-100">
                  <LatexRenderer content={hintText} />
                </div>
              )}

              {activeLayer === 2 && (
                <div className="rounded-2xl border border-blue-500/20 bg-blue-950/20 p-4 text-blue-100">
                  <LatexRenderer content={formulaText} />
                </div>
              )}

              {activeLayer === 3 && (
                <div className="space-y-3">
                  {correctAnswer && (
                    <div className="flex items-center gap-3 rounded-xl bg-emerald-950/50 border border-emerald-500/30 px-3.5 py-2">
                      <span className="text-xs font-bold text-emerald-300 uppercase tracking-wide">
                        Đáp án chuẩn:
                      </span>
                      <span className="rounded-lg bg-emerald-500 px-3 py-1 font-black text-slate-950 shadow-xs text-sm">
                        {correctAnswer}
                      </span>
                    </div>
                  )}

                  {/* Step by step list */}
                  <div className="space-y-2.5 pt-1">
                    {solutionSteps.map((step, idx) => {
                      const isVisible = revealAll || idx < revealedStepIdx;
                      if (!isVisible) return null;

                      return (
                        <div
                          key={idx}
                          className="rounded-xl border border-slate-800 bg-slate-900/90 p-3.5 text-slate-100 animate-in fade-in slide-in-from-bottom-2 duration-150"
                        >
                          <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-emerald-400">
                            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500/20 text-[10px]">
                              {idx + 1}
                            </span>
                            <span>Bước {idx + 1}</span>
                          </div>
                          <LatexRenderer content={step} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
