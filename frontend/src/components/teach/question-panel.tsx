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
  // Font multiplier & Splitter state
  fontSizeMultiplier: number;
  isDraggingSplitter?: boolean;
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
  isDraggingSplitter = false,
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

  // Auto-fit text hook: only measures on question change, font multiplier change, or drag end
  useAutoFitText(containerRef, contentRef, {
    isDragging: isDraggingSplitter,
    questionId: question?.id,
    fontScale: fontSizeMultiplier,
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
    <div
      className="question-pane w-full h-full min-w-[340px] overflow-hidden bg-slate-900/90 text-slate-100 relative select-none"
      style={{
        ["--font-scale" as string]: String(fontSizeMultiplier),
      }}
    >
      {/* 1. STICKY TOP HEADER: CÂU n + TAGS + CLONE SWITCHER */}
      <div className="flex-none h-12 border-b border-slate-800 px-3 sm:px-4 flex items-center justify-between bg-slate-900/95 z-20 overflow-x-auto scrollbar-none flex-nowrap min-w-0">
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          <span className="flex items-center gap-1.5 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-2.5 py-1 text-xs font-black text-white shadow-xs tracking-wider whitespace-nowrap shrink-0">
            CÂU {questionNumber}
          </span>

          {question?.difficulty && (
            <span className="rounded-lg bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-300 uppercase whitespace-nowrap shrink-0">
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
            <div className="flex items-center rounded-lg bg-slate-800/90 p-0.5 border border-slate-700 ml-1 shrink-0">
              <button
                type="button"
                onClick={() => onToggleCloned(false)}
                className={`rounded px-2 py-0.5 text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  !isViewingCloned ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Gốc
              </button>
              <button
                type="button"
                onClick={() => onToggleCloned(true)}
                className={`flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  isViewingCloned
                    ? "bg-amber-500 text-slate-950 font-black"
                    : "text-amber-400 hover:text-amber-300"
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>Câu {questionNumber}+</span>
              </button>
            </div>
          )}
        </div>

        {/* AI Quick Actions: Cloner & Scaffolding with Adaptive Labels */}
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <button
            type="button"
            onClick={onTriggerLiveClone}
            disabled={isCloning}
            className="flex items-center gap-1 rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-300 hover:bg-amber-500/20 transition cursor-pointer disabled:opacity-50 whitespace-nowrap"
            title="Đẻ 1 câu tương tự để học sinh luyện tập 2 phút"
            aria-label="Đẻ câu tương tự 2 phút"
          >
            {isCloning ? (
              <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
            ) : (
              <Wand2 className="w-3 h-3 text-amber-400" />
            )}
            <span className="qpane-btn-label">Đẻ câu mới</span>
            <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[9px] font-black text-amber-400">
              MAX
            </span>
          </button>

          <button
            type="button"
            onClick={onTriggerScaffold}
            disabled={isScaffolding}
            className="flex items-center gap-1 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-bold text-indigo-300 hover:bg-indigo-500/20 transition cursor-pointer disabled:opacity-50 whitespace-nowrap"
            title="Bẻ nhỏ bài toán thành 3 bước gợi mở tư duy"
            aria-label="3 bước gợi mở tư duy"
          >
            {isScaffolding ? (
              <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
            ) : (
              <Layers className="w-3 h-3 text-indigo-400" />
            )}
            <span className="qpane-btn-label">3 bước</span>
            <span className="rounded bg-indigo-500/20 px-1 py-0.2 text-[9px] font-black text-indigo-400">
              MAX
            </span>
          </button>
        </div>
      </div>

      {/* 2. QUESTION BODY: ALIGN-TOP (NOT VERTICALLY CENTERED), PURE CSS CLAMP, LIGHT SCROLL IF VERY LONG */}
      <div
        ref={containerRef}
        className="min-h-0 overflow-y-auto px-4 py-3 sm:px-6 sm:py-5 flex flex-col justify-start items-start relative"
      >
        <div
          ref={contentRef}
          key={`${question?.id}_${isViewingCloned}`}
          className="w-full space-y-4 self-start animate-in fade-in duration-150"
        >
          {/* HOTFIX OMR WARNING BANNER */}
          {missedStat && (
            <div className="rounded-xl border border-red-500/50 bg-red-950/40 p-2.5 shadow-xs w-full">
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

          {/* QUESTION TEXT WITH PURE CSS CLAMP VIA .question-text */}
          <div className="question-text text-slate-100 w-full [overflow-wrap:anywhere] break-words">
            <LatexRenderer content={displayContent} />
          </div>

          {/* ANSWER OPTIONS A/B/C/D */}
          <AnswerOptions
            options={displayOptions}
            correctAnswer={displayAnswer || undefined}
            selectedOption={selectedOption}
            onSelectOption={onSelectOption}
            showCorrectAnswer={showCorrectAnswer}
          />

          {/* AI SCAFFOLDING ACCORDION (If generated) */}
          {scaffoldingSteps && scaffoldingSteps.length > 0 && (
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3 space-y-2 text-xs w-full">
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
      </div>

      {/* 3. ASSIST LAYERS HORIZONTAL CHIPS ROW */}
      <div className="flex-none px-3 sm:px-4 py-2 border-t border-slate-800/80 bg-slate-900/90 z-20">
        <AssistLayers
          explanation={displayExplanation || undefined}
          correctAnswer={displayAnswer || undefined}
          activeLayer={activeLayer}
          onToggleLayer={handleToggleLayer}
          onClose={() => setActiveLayer(null)}
        />
      </div>

      {/* 4. STICKY FOOTER: NAVIGATION WITH ADAPTIVE LABELS & STEPPERS */}
      <div className="flex-none border-t border-slate-800 bg-slate-900/95 p-2.5 px-3 sm:px-4 z-20">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onPrevQuestion}
            disabled={!canPrev}
            className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 disabled:opacity-35 disabled:cursor-not-allowed transition cursor-pointer whitespace-nowrap shrink-0"
            title="Câu trước (Phím ←)"
            aria-label="Câu trước"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="qpane-nav-label">Câu trước</span>
          </button>

          {/* Stepper with small "Câu 1/4" and dots */}
          <div className="flex flex-col items-center gap-0.5 min-w-0 shrink">
            <span className="text-[11px] font-bold text-slate-300 tabular-nums whitespace-nowrap">
              Câu {questionNumber} / {totalQuestions}
            </span>

            {/* Stepper Dots */}
            <div className="flex items-center gap-1.5 max-w-[240px] overflow-x-auto py-0.5 px-1 scrollbar-none">
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
                    className={`relative rounded-full transition-all cursor-pointer shrink-0 ${
                      isCur
                        ? "h-2 w-5 bg-blue-500 shadow-md ring-2 ring-blue-400"
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
            className="flex items-center gap-1 rounded-xl bg-blue-600 hover:bg-blue-500 px-3.5 py-1.5 text-xs font-bold text-white disabled:opacity-35 disabled:cursor-not-allowed transition cursor-pointer shadow-md shadow-blue-600/20 whitespace-nowrap shrink-0"
            title="Câu tiếp (Phím →)"
            aria-label="Câu tiếp"
          >
            <span className="qpane-nav-label">Câu tiếp</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
