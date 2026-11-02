"use client";

import React, { useEffect, useCallback } from "react";
import { Check, CheckCircle2 } from "lucide-react";
import { LatexRenderer } from "@/components/ui/latex-renderer";

export interface AnswerOptionsProps {
  options: string[];
  correctAnswer?: string;
  selectedOption: string | null;
  onSelectOption: (optionKey: string) => void;
  showCorrectAnswer: boolean;
  fontSizePx?: number;
}

const OPTION_KEYS = ["A", "B", "C", "D", "E"];

export function AnswerOptions({
  options,
  correctAnswer,
  selectedOption,
  onSelectOption,
  showCorrectAnswer,
  fontSizePx = 18,
}: AnswerOptionsProps) {
  // Normalize correct answer letter (e.g. "A", "A. 12", "B")
  const normalizedCorrect = correctAnswer ? correctAnswer.trim().toUpperCase() : "";

  // Keyboard shortcut listener for A, B, C, D
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      const key = e.key.toUpperCase();
      if (["A", "B", "C", "D"].includes(key)) {
        const idx = OPTION_KEYS.indexOf(key);
        if (idx !== -1 && idx < options.length) {
          e.preventDefault();
          onSelectOption(key);
        }
      }
    },
    [options.length, onSelectOption]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!options || options.length === 0) return null;

  return (
    <div
      role="radiogroup"
      aria-label="Các phương án trả lời"
      className="grid gap-3 pt-2 grid-cols-1 sm:grid-cols-2"
    >
      {options.map((optText, idx) => {
        const optKey = OPTION_KEYS[idx] || `P${idx + 1}`;
        const isSelected = selectedOption === optKey;
        const isCorrect =
          showCorrectAnswer &&
          (normalizedCorrect.startsWith(optKey) || normalizedCorrect === optKey);
        const isIncorrectDimmed = showCorrectAnswer && !isCorrect;

        // Clean option text (remove leading "A. ", "A)", etc. if redundant)
        const cleanedText = optText.replace(/^[A-E][.)\s:]+\s*/, "");

        return (
          <button
            key={optKey}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={`Phương án ${optKey}: ${cleanedText}`}
            onClick={() => onSelectOption(optKey)}
            className={`min-h-[48px] flex items-center gap-3.5 rounded-2xl border p-3.5 text-left transition-all duration-150 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
              isCorrect
                ? "border-emerald-500 bg-emerald-950/60 text-emerald-100 ring-2 ring-emerald-400 shadow-lg shadow-emerald-950/40 animate-pulse scale-[1.02]"
                : isSelected
                ? "border-blue-500 bg-blue-950/50 text-blue-100 ring-2 ring-blue-500 shadow-md scale-[1.02]"
                : isIncorrectDimmed
                ? "border-slate-800/80 bg-slate-900/40 text-slate-500 opacity-35"
                : "border-slate-800 bg-slate-800/70 text-slate-200 hover:border-slate-700 hover:bg-slate-800 active:scale-[0.99]"
            }`}
          >
            {/* Option Badge A/B/C/D */}
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black transition-colors ${
                isCorrect
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                  : isSelected
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "bg-slate-700/80 text-slate-200"
              }`}
            >
              {isCorrect ? (
                <Check className="h-5 w-5 stroke-[3]" aria-hidden="true" />
              ) : (
                optKey
              )}
            </span>

            {/* Option Text with LaTeX Rendering */}
            <div
              className="flex-1 font-medium leading-relaxed"
              style={{ fontSize: `${Math.max(15, Math.round(fontSizePx * 0.85))}px` }}
            >
              <LatexRenderer content={cleanedText} />
            </div>

            {/* Status indicator on the right */}
            {isCorrect && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-black text-emerald-300 shrink-0 border border-emerald-500/40">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Đáp án đúng</span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
