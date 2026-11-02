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
}

const OPTION_KEYS = ["A", "B", "C", "D", "E"];

export function AnswerOptions({
  options,
  correctAnswer,
  selectedOption,
  onSelectOption,
  showCorrectAnswer,
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
      className="answers-grid pt-2 w-full min-w-0"
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
            data-correct={isCorrect ? "true" : isIncorrectDimmed ? "false" : undefined}
            onClick={() => onSelectOption(optKey)}
            className={`min-h-[48px] w-full min-w-0 box-border flex items-center gap-3 rounded-2xl border p-3 text-left transition-all duration-150 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 overflow-hidden ${
              isCorrect
                ? "border-emerald-500 bg-emerald-950/60 text-emerald-100 ring-2 ring-emerald-400 shadow-lg shadow-emerald-950/40 animate-pulse scale-[1.01]"
                : isSelected
                ? "border-blue-500 bg-blue-950/50 text-blue-100 ring-2 ring-blue-500 shadow-md scale-[1.01]"
                : isIncorrectDimmed
                ? "border-slate-800/80 bg-slate-900/40 text-slate-500 opacity-35"
                : "border-slate-800 bg-slate-800/70 text-slate-200 hover:border-slate-700 hover:bg-slate-800 active:scale-[0.99]"
            }`}
          >
            {/* Option Badge A/B/C/D */}
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black transition-colors ${
                isCorrect
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                  : isSelected
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "bg-slate-700/80 text-slate-200"
              }`}
            >
              {isCorrect ? (
                <Check className="h-4 w-4 stroke-[3]" aria-hidden="true" />
              ) : (
                optKey
              )}
            </span>

            {/* Option Text with pure CSS clamp via .answer-text and overflow protection */}
            <div className="flex-1 min-w-0 overflow-hidden answer-text font-medium leading-relaxed [overflow-wrap:anywhere] break-words">
              <LatexRenderer content={cleanedText} />
            </div>

            {/* Status indicator on the right */}
            {isCorrect && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-300 shrink-0 border border-emerald-500/40 whitespace-nowrap">
                <CheckCircle2 className="w-3 h-3" />
                <span className="qpane-btn-label">Đúng</span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
