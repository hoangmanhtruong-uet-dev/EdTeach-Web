"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  Minimize2,
  Maximize2,
  Calculator,
  ArrowRight,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
} from "lucide-react";

interface CasioCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPasteToCanvas?: (content: string) => void;
}

export function CasioCalculatorModal({
  isOpen,
  onClose,
  onPasteToCanvas,
}: CasioCalculatorModalProps) {
  // Draggable position
  const [position, setPosition] = useState({ x: 100, y: 120 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(false);

  // Calculator State
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState("0");
  const [history, setHistory] = useState<string[]>([]);
  const [mode, setMode] = useState<"comp" | "quad">("comp");
  const [copied, setCopied] = useState(false);

  // Quadratic equation state: ax² + bx + c = 0
  const [quadA, setQuadA] = useState("");
  const [quadB, setQuadB] = useState("");
  const [quadC, setQuadC] = useState("");
  const [quadRoots, setQuadRoots] = useState<{ x1: string; x2: string } | null>(null);

  // Dragging handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("input")) {
      return;
    }
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({
        x: Math.max(10, Math.min(window.innerWidth - 340, e.clientX - dragStartRef.current.x)),
        y: Math.max(10, Math.min(window.innerHeight - 100, e.clientY - dragStartRef.current.y)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  // Keypad actions
  const handleKeyClick = (val: string) => {
    setExpression((prev) => prev + val);
  };

  const handleClear = () => {
    setExpression("");
    setResult("0");
  };

  const handleDelete = () => {
    setExpression((prev) => prev.slice(0, -1));
  };

  const calculateResult = useCallback(() => {
    if (!expression.trim()) return;
    try {
      // Clean and sanitize mathematical expression for safe evaluation
      let sanitized = expression
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/π/g, "Math.PI")
        .replace(/e/g, "Math.E")
        .replace(/√\(([^)]+)\)/g, "Math.sqrt($1)")
        .replace(/√(\d+(\.\d+)?)/g, "Math.sqrt($1)")
        .replace(/sin\(([^)]+)\)/g, "Math.sin(($1) * Math.PI / 180)")
        .replace(/cos\(([^)]+)\)/g, "Math.cos(($1) * Math.PI / 180)")
        .replace(/tan\(([^)]+)\)/g, "Math.tan(($1) * Math.PI / 180)")
        .replace(/ln\(([^)]+)\)/g, "Math.log($1)")
        .replace(/log\(([^)]+)\)/g, "Math.log10($1)")
        .replace(/\^/g, "**");

      // Only allow safe math characters
      if (/[^0-9+\-*/().MathPIEsqrtcointalge\s,]/.test(sanitized)) {
        setResult("Cú pháp lỗi");
        return;
      }

      // Safe Function evaluator
      const fn = new Function(`return (${sanitized});`);
      const res = fn();
      if (typeof res === "number" && !isNaN(res)) {
        // Round cleanly to 6 decimal places if needed
        const formatted = Number.isInteger(res) ? res.toString() : parseFloat(res.toFixed(6)).toString();
        setResult(formatted);
        setHistory((prev) => [expression + " = " + formatted, ...prev.slice(0, 9)]);
      } else {
        setResult("Lỗi");
      }
    } catch {
      setResult("Cú pháp lỗi");
    }
  }, [expression]);

  // Quadratic equation solver
  const solveQuadratic = () => {
    const a = parseFloat(quadA);
    const b = parseFloat(quadB);
    const c = parseFloat(quadC);

    if (isNaN(a) || isNaN(b) || isNaN(c)) {
      setQuadRoots(null);
      return;
    }
    if (a === 0) {
      if (b === 0) {
        setQuadRoots({ x1: "Vô nghiệm", x2: "" });
      } else {
        const root = (-c / b).toFixed(4);
        setQuadRoots({ x1: `x = ${root}`, x2: "PT bậc 1" });
      }
      return;
    }

    const delta = b * b - 4 * a * c;
    if (delta < 0) {
      const real = (-b / (2 * a)).toFixed(3);
      const imag = (Math.sqrt(-delta) / (2 * a)).toFixed(3);
      setQuadRoots({
        x1: `${real} + ${imag}i`,
        x2: `${real} - ${imag}i`,
      });
    } else if (delta === 0) {
      const r = (-b / (2 * a)).toFixed(4);
      setQuadRoots({ x1: `x₁ = x₂ = ${r}`, x2: "Nghiệm kép" });
    } else {
      const r1 = ((-b + Math.sqrt(delta)) / (2 * a)).toFixed(4);
      const r2 = ((-b - Math.sqrt(delta)) / (2 * a)).toFixed(4);
      setQuadRoots({ x1: `x₁ = ${r1}`, x2: `x₂ = ${r2}` });
    }
  };

  const handlePasteToCanvas = (customText?: string) => {
    const textToPaste =
      customText ||
      (mode === "comp"
        ? `${expression} = ${result}`
        : `PT: ${quadA}x² + ${quadB}x + ${quadC} = 0 → ${quadRoots?.x1 || ""}, ${quadRoots?.x2 || ""}`);
    if (onPasteToCanvas) {
      onPasteToCanvas(textToPaste);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className={`fixed z-50 select-none shadow-2xl rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 overflow-hidden transition-all duration-150 ${
        isMinimized ? "w-72" : "w-80"
      }`}
    >
      {/* Top Drag Handle Bar */}
      <div
        onMouseDown={handleMouseDown}
        className="flex items-center justify-between px-3.5 py-2.5 bg-slate-800/90 border-b border-slate-700/80 cursor-move"
      >
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-amber-400" />
          <span className="font-mono text-xs font-bold tracking-wider text-slate-200">
            CASIO <span className="text-amber-400 font-black">fx-580VN X</span>
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition"
            title={isMinimized ? "Mở rộng" : "Thu gọn"}
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
            title="Đóng máy tính"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="p-3.5 space-y-2.5">
          {/* LCD Natural Screen */}
          <div className="rounded-xl border border-emerald-900/60 bg-[#c2d4c0] p-3 text-slate-900 shadow-inner font-mono">
            <div className="flex items-center justify-between text-[10px] text-slate-700 font-sans font-semibold border-b border-slate-400/30 pb-0.5">
              <span>{mode === "comp" ? "D • Math • COMP" : "D • EQUATION (Bậc 2)"}</span>
              <button
                onClick={() => setMode(mode === "comp" ? "quad" : "comp")}
                className="text-emerald-900 font-bold hover:underline cursor-pointer"
              >
                [{mode === "comp" ? "Chuyển Giải PT" : "Chuyển Máy tính thường"}]
              </button>
            </div>

            {mode === "comp" ? (
              <div className="mt-1.5 flex flex-col justify-between min-h-[48px]">
                <div className="text-xs text-slate-700 overflow-x-auto whitespace-nowrap text-left">
                  {expression || "0"}
                </div>
                <div className="text-lg font-black text-right text-slate-900 truncate tracking-tight">
                  {result}
                </div>
              </div>
            ) : (
              <div className="mt-1 space-y-1.5">
                <div className="text-[11px] font-bold text-slate-800 text-center">
                  ax² + bx + c = 0
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <input
                    type="number"
                    value={quadA}
                    onChange={(e) => setQuadA(e.target.value)}
                    placeholder="a"
                    className="w-full text-center text-xs p-1 rounded border border-slate-400 bg-white/70 text-slate-900"
                  />
                  <input
                    type="number"
                    value={quadB}
                    onChange={(e) => setQuadB(e.target.value)}
                    placeholder="b"
                    className="w-full text-center text-xs p-1 rounded border border-slate-400 bg-white/70 text-slate-900"
                  />
                  <input
                    type="number"
                    value={quadC}
                    onChange={(e) => setQuadC(e.target.value)}
                    placeholder="c"
                    className="w-full text-center text-xs p-1 rounded border border-slate-400 bg-white/70 text-slate-900"
                  />
                </div>
                <button
                  type="button"
                  onClick={solveQuadratic}
                  className="w-full py-1 rounded bg-slate-900 text-white text-[11px] font-bold hover:bg-slate-800"
                >
                  Giải nghiệm
                </button>
                {quadRoots && (
                  <div className="text-xs font-bold text-slate-900 text-right pt-0.5">
                    <div>{quadRoots.x1}</div>
                    <div>{quadRoots.x2}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Paste to Canvas Button */}
          <button
            type="button"
            onClick={() => handlePasteToCanvas()}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-xs font-bold transition active:scale-98 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Đã dán lên Bảng!" : "Dán phép tính & kết quả lên Bảng"}</span>
          </button>

          {/* Mode 1: Scientific Keypad */}
          {mode === "comp" && (
            <div className="space-y-1.5">
              {/* Function Row 1 */}
              <div className="grid grid-cols-5 gap-1.5 text-[11px] font-semibold text-slate-300">
                <button
                  type="button"
                  onClick={() => handleKeyClick("sin(")}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 active:scale-95"
                >
                  sin
                </button>
                <button
                  type="button"
                  onClick={() => handleKeyClick("cos(")}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 active:scale-95"
                >
                  cos
                </button>
                <button
                  type="button"
                  onClick={() => handleKeyClick("tan(")}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 active:scale-95"
                >
                  tan
                </button>
                <button
                  type="button"
                  onClick={() => handleKeyClick("√(")}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 active:scale-95"
                >
                  √
                </button>
                <button
                  type="button"
                  onClick={() => handleKeyClick("^2")}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 active:scale-95"
                >
                  x²
                </button>
              </div>

              {/* Function Row 2 */}
              <div className="grid grid-cols-5 gap-1.5 text-[11px] font-semibold text-slate-300">
                <button
                  type="button"
                  onClick={() => handleKeyClick("ln(")}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 active:scale-95"
                >
                  ln
                </button>
                <button
                  type="button"
                  onClick={() => handleKeyClick("log(")}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 active:scale-95"
                >
                  log
                </button>
                <button
                  type="button"
                  onClick={() => handleKeyClick("(")}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 active:scale-95"
                >
                  (
                </button>
                <button
                  type="button"
                  onClick={() => handleKeyClick(")")}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 active:scale-95"
                >
                  )
                </button>
                <button
                  type="button"
                  onClick={() => handleKeyClick("π")}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-300"
                >
                  π
                </button>
              </div>

              {/* Number and Operator Grid */}
              <div className="grid grid-cols-4 gap-1.5 text-xs font-bold pt-1">
                {/* 7, 8, 9, DEL */}
                <button
                  type="button"
                  onClick={() => handleKeyClick("7")}
                  className="py-2 rounded-lg bg-slate-700 hover:bg-slate-600 active:scale-95 text-white"
                >
                  7
                </button>
                <button
                  type="button"
                  onClick={() => handleKeyClick("8")}
                  className="py-2 rounded-lg bg-slate-700 hover:bg-slate-600 active:scale-95 text-white"
                >
                  8
                </button>
                <button
                  type="button"
                  onClick={() => handleKeyClick("9")}
                  className="py-2 rounded-lg bg-slate-700 hover:bg-slate-600 active:scale-95 text-white"
                >
                  9
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="py-2 rounded-lg bg-rose-600 hover:bg-rose-500 active:scale-95 text-white"
                >
                  DEL
                </button>

                {/* 4, 5, 6, x */}
                <button
                  type="button"
                  onClick={() => handleKeyClick("4")}
                  className="py-2 rounded-lg bg-slate-700 hover:bg-slate-600 active:scale-95 text-white"
                >
                  4
                </button>
                <button
                  type="button"
                  onClick={() => handleKeyClick("5")}
                  className="py-2 rounded-lg bg-slate-700 hover:bg-slate-600 active:scale-95 text-white"
                >
                  5
                </button>
                <button
                  type="button"
                  onClick={() => handleKeyClick("6")}
                  className="py-2 rounded-lg bg-slate-700 hover:bg-slate-600 active:scale-95 text-white"
                >
                  6
                </button>
                <button
                  type="button"
                  onClick={() => handleKeyClick("×")}
                  className="py-2 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-400 font-extrabold"
                >
                  ×
                </button>

                {/* 1, 2, 3, / */}
                <button
                  type="button"
                  onClick={() => handleKeyClick("1")}
                  className="py-2 rounded-lg bg-slate-700 hover:bg-slate-600 active:scale-95 text-white"
                >
                  1
                </button>
                <button
                  type="button"
                  onClick={() => handleKeyClick("2")}
                  className="py-2 rounded-lg bg-slate-700 hover:bg-slate-600 active:scale-95 text-white"
                >
                  2
                </button>
                <button
                  type="button"
                  onClick={() => handleKeyClick("3")}
                  className="py-2 rounded-lg bg-slate-700 hover:bg-slate-600 active:scale-95 text-white"
                >
                  3
                </button>
                <button
                  type="button"
                  onClick={() => handleKeyClick("÷")}
                  className="py-2 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-400 font-extrabold"
                >
                  ÷
                </button>

                {/* 0, ., +, - */}
                <button
                  type="button"
                  onClick={() => handleKeyClick("0")}
                  className="py-2 rounded-lg bg-slate-700 hover:bg-slate-600 active:scale-95 text-white"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => handleKeyClick(".")}
                  className="py-2 rounded-lg bg-slate-700 hover:bg-slate-600 active:scale-95 text-white"
                >
                  .
                </button>
                <button
                  type="button"
                  onClick={() => handleKeyClick("+")}
                  className="py-2 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-400 font-extrabold"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => handleKeyClick("-")}
                  className="py-2 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-400 font-extrabold"
                >
                  -
                </button>
              </div>

              {/* Bottom AC & EQUAL */}
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={handleClear}
                  className="py-2 rounded-lg bg-rose-700 hover:bg-rose-600 active:scale-95 text-white text-xs font-bold"
                >
                  AC (Xóa hết)
                </button>
                <button
                  type="button"
                  onClick={calculateResult}
                  className="py-2 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-base font-black shadow-md"
                >
                  =
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
