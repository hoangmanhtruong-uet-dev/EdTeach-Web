"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Sparkles,
  Layers,
  Wand2,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Question } from "@/lib/api/exams";
import { LatexRenderer } from "@/components/ui/latex-renderer";
import { AnswerOptions } from "@/components/teach/answer-options";
import { AssistLayers } from "@/components/teach/assist-layers";
import { useAutoFitText } from "@/lib/teach/use-auto-fit-text";

export interface QuestionPanelProps {
  questionNumber: number;
  totalQuestions: number;
  question?: Question | null;
  clonedQuestion?: { content: string; options: string[]; correct_answer: string; explanation: string };
  isViewingCloned: boolean;
  onToggleCloned: (showCloned: boolean) => void;
  // Options
  selectedOption: string | null;
  onSelectOption: (optionKey: string) => void;
  // Answer reveal
  showCorrectAnswer: boolean;
  onToggleCorrectAnswer: () => void;
  // Navigation
  onPrevQuestion: () => void;
  onNextQuestion: () => void;
  onGoToQuestion: (idx: number) => void;
  canPrev: boolean;
  canNext: boolean;
  // Per-question drawings or cloned indicator
  questionsWithDrawings: Record<string, boolean>;
  clonedQuestionsMap: Record<string, unknown>;
  // Font multiplier
  fontSizeMultiplier: number;
  // Hotfix OMR Stat
  missedStat?: {
    wrongPct: number;
    wrongCount: number;
    total: number;
    mostChosenWrong?: string;
    correctAns?: string;
  } | null;
  // Scaffolding & Cloner triggers
  scaffoldingSteps?: Array<{ step_number: number; title: string; question: string; hint: string }>;
  revealedScaffoldCount: number;
  onRevealNextScaffoldStep: (step: number) => void;
  onTriggerLiveClone: () => void;
  isCloning: boolean;
  onTriggerScaffold: () => void;
  isScaffolding: boolean;
}

export function QuestionPanel({
  questionNumber,
  totalQuestions,
  question,
  clonedQuestion,
  isViewingCloned,
  onToggleCloned,
  selectedOption,
  onSelectOption,
  showCorrectAnswer,
  onToggleCorrectAnswer,
  onPrevQuestion,
  onNextQuestion,
  onGoToQuestion,
  canPrev,
  canNext,
  questionsWithDrawings,
  clonedQuestionsMap,
  fontSizeMultiplier,
  missedStat,
  scaffoldingSteps,
  revealedScaffoldCount,
  onRevealNextScaffoldStep,
  onTriggerLiveClone,
  isCloning,
  onTriggerScaffold,
  isScaffolding,
}: QuestionPanelProps) {
  // Container & Content refs for auto-fit text
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Active layer for slide-up panel: 1: Gợi ý, 2: Công thức, 3: Lời giải, null: Closed
  const [activeLayer, setActiveLayer] = useState<1 | 2 | 3 | null>(null);

  // Active question content to display (original or cloned)
  const displayContent = isViewingCloned && clonedQuestion ? clonedQuestion.content : question?.content || "";
  const displayOptions: string[] = isViewingCloned && clonedQuestion
    ? clonedQuestion.options || []
    : Array.isArray(question?.options)
    ? (question.options as unknown[]).map((o) => (typeof o === "string" ? o : String(o)))
    : typeof question?.options === "object" && question?.options !== null
    ? Object.values(question.options as Record<string, unknown>).map(String)
    : [];
  const displayAnswer = isViewingCloned && clonedQuestion ? clonedQuestion.correct_answer : question?.correct_answer;
  const displayExplanation = isViewingCloned && clonedQuestion ? clonedQuestion.explanation : question?.explanation;

  // Auto-fit text hook
  const { fontSize } = useAutoFitText(containerRef, contentRef, {
    minFontSize: 18,
    maxFontSize: 40,
    multiplier: fontSizeMultiplier,
    dependencies: [question?.id, isViewingCloned, displayContent, displayOptions.length],
  });

  // Handle Layer toggling (when Layer 3 opens, also show correct answer)
  const handleToggleLayer = (layer: 1 | 2 | 3) => {
    if (activeLayer === layer) {
      setActiveLayer(null);
    } else {
      setActiveLayer(layer);
      if (layer === 3 && !showCorrectAnswer) {
        onToggleCorrectAnswer();
      }
    }
  };

  // Keyboard shortcut listener for 1, 2, 3, Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      if (e.key === "1") {
        e.preventDefault();
        handleToggleLayer(1);
      } else if (e.key === "2") {
        e.preventDefault();
        handleToggleLayer(2);
      } else if (e.key === "3") {
        e.preventDefault();
        handleToggleLayer(3);
      } else if (e.key === "Enter") {
        e.preventDefault();
        onToggleCorrectAnswer();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-slate-900/90 text-slate-100 relative select-none">
      {/* 1. STICKY TOP HEADER: CÂU n + TAGS + CLONE SWITCHER */}
      <div className="flex-none h-12 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between bg-slate-900/95 z-20">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1.5 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-3 py-1 text-xs font-black text-white shadow-xs tracking-wider">
            CÂU {questionNumber}
          </span>

          {question?.difficulty && (
            <span className="rounded-lg bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-300 uppercase">
              {question.difficulty === "easy"
                ? "Nhận biết"
                : question.difficulty === "medium"
                ? "Thông hiểu"
                : question.difficulty === "hard"
                ? "Vận dụng"
                : "Vận dụng cao"}
            </span>
          )}

          {/* Cloned Switcher if cloned question exists */}
          {clonedQuestion && (
            <div className="flex items-center rounded-lg bg-slate-800/90 p-0.5 border border-slate-700 ml-2">
              <button
                type="button"
                onClick={() => onToggleCloned(false)}
                className={`rounded px-2 py-0.5 text-xs font-bold transition cursor-pointer ${
                  !isViewingCloned ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Câu gốc
              </button>
              <button
                type="button"
                onClick={() => onToggleCloned(true)}
                className={`flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold transition cursor-pointer ${
                  isViewingCloned
                    ? "bg-amber-500 text-slate-950 font-black"
                    : "text-amber-400 hover:text-amber-300"
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>Câu {questionNumber}+ (Luyện tập)</span>
              </button>
            </div>
          )}
        </div>

        {/* AI Quick Actions: Cloner & Scaffolding */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onTriggerLiveClone}
            disabled={isCloning}
            className="flex items-center gap-1 rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-300 hover:bg-amber-500/20 transition cursor-pointer disabled:opacity-50"
            title="Đẻ 1 câu tương tự để học sinh luyện tập 2 phút"
          >
            {isCloning ? (
              <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
            ) : (
              <Wand2 className="w-3 h-3 text-amber-400" />
            )}
            <span className="hidden sm:inline">Đẻ câu mới</span>
            <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[9px] font-black text-amber-400">
              MAX
            </span>
          </button>

          <button
            type="button"
            onClick={onTriggerScaffold}
            disabled={isScaffolding}
            className="flex items-center gap-1 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-bold text-indigo-300 hover:bg-indigo-500/20 transition cursor-pointer disabled:opacity-50"
            title="Bẻ nhỏ bài toán thành 3 bước gợi mở tư duy"
          >
            {isScaffolding ? (
              <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
            ) : (
              <Layers className="w-3 h-3 text-indigo-400" />
            )}
            <span className="hidden sm:inline">3 bước gợi mở</span>
            <span className="rounded bg-indigo-500/20 px-1 py-0.2 text-[9px] font-black text-indigo-400">
              MAX
            </span>
          </button>
        </div>
      </div>

      {/* 2. AUTO-FIT QUESTION BODY: 100DVH FIT, NO SCROLLING */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 overflow-hidden px-5 py-4 sm:px-8 sm:py-6 flex flex-col justify-center relative"
      >
        <div
          ref={contentRef}
          key={`${question?.id}_${isViewingCloned}`}
          className="space-y-4 max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-right-3 duration-200"
        >
          {/* HOTFIX OMR WARNING BANNER (If high wrong rate) */}
          {missedStat && (
            <div className="rounded-xl border border-red-500/50 bg-red-950/40 p-2.5 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold text-red-300">
                <span className="flex items-center gap-1.5 text-red-400">
                  <Flame className="w-4 h-4 text-red-500 animate-bounce" />
                  <span>Chữa nóng OMR: {missedStat.wrongPct}% học sinh sai</span>
                </span>
                <span>{missedStat.wrongCount}/{missedStat.total} học sinh</span>
              </div>
              {missedStat.mostChosenWrong && (
                <p className="mt-1 text-[11px] text-red-200">
                  ⚠️ Bẫy sai phổ biến ở phương án{" "}
                  <strong className="text-amber-300">{missedStat.mostChosenWrong}</strong>.
                </p>
              )}
            </div>
          )}

          {/* QUESTION TEXT WITH AUTO-FIT FONT SIZE */}
          <div
            className="font-semibold text-slate-100 tracking-normal transition-all duration-150"
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.5 }}
          >
            <LatexRenderer content={displayContent} />
          </div>

          {/* ANSWER OPTIONS A/B/C/D */}
          <AnswerOptions
            options={displayOptions}
            correctAnswer={displayAnswer || undefined}
            selectedOption={selectedOption}
            onSelectOption={onSelectOption}
            showCorrectAnswer={showCorrectAnswer}
            fontSizePx={fontSize}
          />

          {/* AI SCAFFOLDING ACCORDION (If generated) */}
          {scaffoldingSteps && scaffoldingSteps.length > 0 && (
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-indigo-500/20 pb-1.5">
                <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> 3 Bước Gợi Mở Tư Duy
                </span>
                <span className="text-[10px] text-indigo-400">
                  Đã mở {revealedScaffoldCount}/3 bước
                </span>
              </div>
              <div className="grid gap-2">
                {scaffoldingSteps.map((step) => {
                  const isRev = revealedScaffoldCount >= step.step_number;
                  return (
                    <div
                      key={step.step_number}
                      className={`rounded-lg p-2.5 border transition ${
                        isRev
                          ? "border-indigo-500/40 bg-slate-900/90 text-slate-100"
                          : "border-slate-800 bg-slate-900/30 text-slate-500"
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-[11px]">
                        <span className="text-indigo-300">{step.title}</span>
                        {!isRev ? (
                          <button
                            type="button"
                            onClick={() => onRevealNextScaffoldStep(step.step_number)}
                            className="rounded bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-indigo-500 transition cursor-pointer"
                          >
                            Mở bước {step.step_number}
                          </button>
                        ) : (
                          <span className="text-emerald-400 flex items-center gap-1 text-[10px]">
                            <CheckCircle2 className="w-3 h-3" /> Đã mở
                          </span>
                        )}
                      </div>
                      {isRev && (
                        <div className="mt-1 text-[11px] text-slate-300 border-t border-indigo-500/20 pt-1">
                          <p className="font-semibold text-indigo-200">{step.question}</p>
                          <div className="mt-0.5 text-slate-400">
                            <LatexRenderer content={step.hint} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* SLIDE-UP ASSIST LAYERS PANEL */}
        <AssistLayers
          explanation={displayExplanation || undefined}
          correctAnswer={displayAnswer || undefined}
          activeLayer={activeLayer}
          onToggleLayer={handleToggleLayer}
          onClose={() => setActiveLayer(null)}
        />
      </div>

      {/* 3. STICKY FOOTER: CHIPS + NAVIGATION WITH DOT STEPPERS */}
      <div className="flex-none border-t border-slate-800 bg-slate-900/95 p-3 px-4 sm:px-6 z-20 space-y-2.5">
        {/* Navigation Row */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onPrevQuestion}
            disabled={!canPrev}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 disabled:opacity-35 disabled:cursor-not-allowed transition cursor-pointer"
            title="Câu trước (Phím ←)"
            aria-label="Câu trước"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Câu trước</span>
          </button>

          {/* Stepper with small "Câu 1/4" and dots */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-bold text-slate-300 tabular-nums">
              Câu {questionNumber} / {totalQuestions}
            </span>

            {/* Stepper Dots */}
            <div className="flex items-center gap-1.5 max-w-[280px] overflow-x-auto py-0.5 px-1">
              {Array.from({ length: totalQuestions }).map((_, idx) => {
                const isCur = idx === questionNumber - 1;
                const qKey = `q_${idx + 1}`;
                const hasDraw = !!questionsWithDrawings[qKey];
                const hasClone = !!clonedQuestionsMap[qKey];

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onGoToQuestion(idx)}
                    title={`Chuyển tới Câu ${idx + 1}${hasDraw ? " (Có nháp)" : ""}${hasClone ? " (Có câu luyện tập)" : ""}`}
                    aria-label={`Chuyển tới Câu ${idx + 1}`}
                    className={`relative rounded-full transition-all cursor-pointer ${
                      isCur
                        ? "h-2.5 w-6 bg-blue-500 shadow-md ring-2 ring-blue-400"
                        : "h-2 w-2 bg-slate-700 hover:bg-slate-500"
                    }`}
                  >
                    {hasDraw && !isCur && (
                      <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-amber-400" />
                    )}
                    {hasClone && !isCur && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-blue-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={onNextQuestion}
            disabled={!canNext}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-bold text-white disabled:opacity-35 disabled:cursor-not-allowed transition cursor-pointer shadow-md shadow-blue-600/20"
            title="Câu tiếp (Phím →)"
            aria-label="Câu tiếp"
          >
            <span className="hidden sm:inline">Câu tiếp</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
