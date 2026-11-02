"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Sparkles,
  Check,
  Copy,
  Plus,
  HelpCircle,
  Divide,
  CornerDownLeft,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface MathFormulaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertFormula: (svgDataUrl: string, width: number, height: number, rawLatex: string) => void;
  initialLatex?: string;
  themeTextColor?: string;
}

interface Snippet {
  label: string;
  latex: string;
  tooltip?: string;
}

const SNIPPET_GROUPS: { group: string; items: Snippet[] }[] = [
  {
    group: "Phân số & Căn",
    items: [
      { label: "a/b", latex: "\\frac{a}{b}", tooltip: "Phân số" },
      { label: "√x", latex: "\\sqrt{x}", tooltip: "Căn bậc hai" },
      { label: "ⁿ√x", latex: "\\sqrt[n]{x}", tooltip: "Căn bậc n" },
      { label: "x²", latex: "x^2", tooltip: "Bình phương" },
      { label: "xⁿ", latex: "x^{n}", tooltip: "Lũy thừa" },
      { label: "xᵢ", latex: "x_{i}", tooltip: "Chỉ số dưới" },
    ],
  },
  {
    group: "Giải tích & Giới hạn",
    items: [
      { label: "∫ f(x)dx", latex: "\\int f(x)\\,dx", tooltip: "Nguyên hàm" },
      { label: "∫ₐᵇ f(x)", latex: "\\int_{a}^{b} f(x)\\,dx", tooltip: "Tích phân xác định" },
      { label: "lim", latex: "\\lim_{x \\to x_0} f(x)", tooltip: "Giới hạn" },
      { label: "dy/dx", latex: "\\frac{dy}{dx}", tooltip: "Đạo hàm" },
      { label: "∑", latex: "\\sum_{i=1}^{n} a_i", tooltip: "Tổng xích-ma" },
      { label: "∏", latex: "\\prod_{i=1}^{n} a_i", tooltip: "Tích chuỗi" },
    ],
  },
  {
    group: "Hình học & Vectơ",
    items: [
      { label: "v⃗", latex: "\\vec{v}", tooltip: "Vectơ v" },
      { label: "AB⃗", latex: "\\overrightarrow{AB}", tooltip: "Vectơ AB" },
      { label: "∠ABC", latex: "\\widehat{ABC}", tooltip: "Góc ABC" },
      { label: "⟂", latex: "\\perp", tooltip: "Vuông góc" },
      { label: "∥", latex: "\\parallel", tooltip: "Song song" },
      { label: "△ABC", latex: "\\triangle ABC", tooltip: "Tam giác ABC" },
    ],
  },
  {
    group: "Hệ PT & Ma trận",
    items: [
      {
        label: "{ Hệ PT",
        latex: "\\begin{cases} 2x + y = 5 \\\\ x - 3y = 2 \\end{cases}",
        tooltip: "Hệ 2 phương trình",
      },
      {
        label: "[ Ma trận ]",
        latex: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}",
        tooltip: "Ma trận 2x2",
      },
      { label: "±", latex: "\\pm", tooltip: "Cộng trừ" },
      { label: "≠", latex: "\\neq", tooltip: "Khác" },
      { label: "≤", latex: "\\le", tooltip: "Nhỏ hơn hoặc bằng" },
      { label: "≥", latex: "\\ge", tooltip: "Lớn hơn hoặc bằng" },
    ],
  },
  {
    group: "Ký hiệu Hy Lạp & Lý/Hóa",
    items: [
      { label: "α", latex: "\\alpha" },
      { label: "β", latex: "\\beta" },
      { label: "π", latex: "\\pi" },
      { label: "θ", latex: "\\theta" },
      { label: "Δ", latex: "\\Delta" },
      { label: "ω", latex: "\\omega" },
      { label: "λ", latex: "\\lambda" },
      { label: "Ω", latex: "\\Omega" },
      { label: "→", latex: "\\rightarrow" },
      { label: "⇌", latex: "\\rightleftharpoons" },
    ],
  },
];

export function MathFormulaModal({
  isOpen,
  onClose,
  onInsertFormula,
  initialLatex = "",
  themeTextColor = "#1e293b",
}: MathFormulaModalProps) {
  const [latexInput, setLatexInput] = useState(initialLatex || "f(x) = \\frac{x^2 - 4x + 3}{x - 1}");
  const [renderedHtml, setRenderedHtml] = useState("");
  const [renderError, setRenderError] = useState<string | null>(null);
  const [color, setColor] = useState(themeTextColor);
  const [fontSize, setFontSize] = useState<"sm" | "md" | "lg" | "xl">("lg");
  const previewRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialLatex) {
      setLatexInput(initialLatex);
    }
  }, [initialLatex]);

  // Real-time KaTeX preview rendering
  useEffect(() => {
    if (!latexInput.trim()) {
      setRenderedHtml("");
      setRenderError(null);
      return;
    }
    try {
      const html = katex.renderToString(latexInput, {
        displayMode: true,
        throwOnError: true,
        output: "html",
      });
      setRenderedHtml(html);
      setRenderError(null);
    } catch (err: any) {
      setRenderError(err.message || "Lỗi cú pháp LaTeX");
    }
  }, [latexInput]);

  const handleInsertSnippet = (snippetLatex: string) => {
    if (!inputRef.current) {
      setLatexInput((prev) => prev + " " + snippetLatex);
      return;
    }
    const textarea = inputRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const nextVal = latexInput.substring(0, start) + snippetLatex + latexInput.substring(end);
    setLatexInput(nextVal);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + snippetLatex.length, start + snippetLatex.length);
    }, 10);
  };

  const handleConfirmInsert = async () => {
    if (!previewRef.current || renderError || !latexInput.trim()) return;

    try {
      // Render KaTeX HTML to a high-DPR Canvas for 100% crispness in Excalidraw
      const previewEl = previewRef.current.querySelector(".katex-display") || previewRef.current;
      const rect = previewEl.getBoundingClientRect();
      const padding = 24;
      const w = Math.max(120, Math.ceil(rect.width) + padding * 2);
      const h = Math.max(60, Math.ceil(rect.height) + padding * 2);

      // Tạo SVG data URL chứa HTML KaTeX với font chuẩn
      const cleanKatexHtml = katex.renderToString(latexInput, {
        displayMode: true,
        throwOnError: false,
      });

      const fontScaleMap = { sm: "20px", md: "26px", lg: "34px", xl: "44px" };
      const currentFontSize = fontScaleMap[fontSize];

      const svgString = `
<svg xmlns="http://www.w3.org/2000/svg" width="${w * 1.5}" height="${h * 1.5}" viewBox="0 0 ${w} ${h}">
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml" style="display:flex;align-items:center;justify-content:center;height:100%;color:${color};font-size:${currentFontSize};font-family:KaTeX_Main, 'Times New Roman', serif;">
      ${cleanKatexHtml}
    </div>
  </foreignObject>
</svg>
`.trim();

      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        onInsertFormula(dataUrl, w, h, latexInput);
        onClose();
      };
      reader.readAsDataURL(svgBlob);
    } catch (err) {
      console.error("Lỗi khi sinh SVG công thức:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative flex flex-col w-full max-w-2xl max-h-[92vh] rounded-2xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold font-serif italic text-base">
              f(x)
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Gõ Công thức Toán & Khoa học (LaTeX)</h3>
              <p className="text-[11px] text-muted-foreground">
                Hiển thị chuẩn KaTeX siêu nét, chèn trực tiếp vào Bảng bục giảng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Snippet Toolbar Bar */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Mẫu ký hiệu & phép tính nhanh:
            </span>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {SNIPPET_GROUPS.map((grp) => (
                <div key={grp.group} className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-[10px] font-medium text-muted-foreground/80 w-24 shrink-0 truncate">
                    {grp.group}:
                  </span>
                  {grp.items.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => handleInsertSnippet(item.latex)}
                      title={item.tooltip || item.latex}
                      className="px-2 py-1 rounded-md bg-muted/60 hover:bg-muted border border-border/80 text-foreground text-xs font-serif hover:border-primary/50 transition cursor-pointer active:scale-95"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* LaTeX Input Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-foreground">Mã nguồn LaTeX:</label>
              <span className="text-[10px] text-muted-foreground font-mono">
                VD: \frac{'{'}a{'}'}{'{'}b{'}'}, x^2, \int_{'{'}0{'}'}^{'{'}1{'}'}
              </span>
            </div>
            <textarea
              ref={inputRef}
              rows={3}
              value={latexInput}
              onChange={(e) => setLatexInput(e.target.value)}
              placeholder="Nhập mã LaTeX hoặc click các ký hiệu bên trên..."
              className="w-full text-xs font-mono p-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Real-time Preview Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-foreground">Xem trước trực quan (KaTeX):</span>
              {renderError ? (
                <span className="text-[11px] text-rose-500 font-medium">{renderError}</span>
              ) : (
                <span className="text-[11px] text-emerald-600 font-medium">✓ Cú pháp hợp lệ</span>
              )}
            </div>
            <div
              ref={previewRef}
              style={{ color }}
              className="min-h-[90px] rounded-xl border border-border/90 bg-muted/20 p-4 flex items-center justify-center overflow-x-auto text-center"
            >
              {renderedHtml ? (
                <div
                  className="katex-preview select-none"
                  dangerouslySetInnerHTML={{ __html: renderedHtml }}
                />
              ) : (
                <span className="text-xs text-muted-foreground italic">
                  Chưa có công thức nào được nhập
                </span>
              )}
            </div>
          </div>

          {/* Formatting Options (Color & Size) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border text-xs">
            {/* Color picker */}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-medium">Màu chữ:</span>
              <div className="flex items-center gap-1.5">
                {[
                  { name: "Đen", hex: "#0f172a" },
                  { name: "Trắng", hex: "#f8fafc" },
                  { name: "Xanh dương", hex: "#2563eb" },
                  { name: "Đỏ", hex: "#ef4444" },
                  { name: "Xanh lá", hex: "#16a34a" },
                  { name: "Vàng", hex: "#f59e0b" },
                ].map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setColor(c.hex)}
                    title={c.name}
                    className={`w-5 h-5 rounded-full border transition-all ${
                      color === c.hex ? "scale-125 ring-2 ring-primary ring-offset-1" : "opacity-80 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: c.hex, borderColor: "#94a3b8" }}
                  />
                ))}
              </div>
            </div>

            {/* Size options */}
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground font-medium">Cỡ:</span>
              {(["sm", "md", "lg", "xl"] as const).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setFontSize(sz)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                    fontSize === sz
                      ? "bg-primary text-primary-foreground font-bold"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {sz.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/40">
          <p className="text-[11px] text-muted-foreground">
            💡 Nhấp đúp vào công thức trên bảng để mở lại bảng soạn thảo này
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-border hover:bg-muted text-xs font-semibold text-foreground transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              onClick={handleConfirmInsert}
              disabled={Boolean(renderError) || !latexInput.trim()}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-xs font-bold text-white transition shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Chèn lên Bảng</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
