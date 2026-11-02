"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  X,
  Check,
  Search,
  Clock,
} from "lucide-react";
import katex from "katex";
import "katex/dist/katex.min.css";
// Bật tiện ích mở rộng Hóa học mhchem (\ce{})
import "katex/dist/contrib/mhchem.js";

export interface MathFormulaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertFormula: (
    svgDataUrl: string,
    width: number,
    height: number,
    rawLatex: string,
    color: string,
    fontSize: "sm" | "md" | "lg" | "xl"
  ) => void;
  initialLatex?: string;
  initialColor?: string;
  initialFontSize?: "sm" | "md" | "lg" | "xl";
  editingElementId?: string | null;
  boardTheme?: {
    id: string;
    viewBackgroundColor: string;
    defaultStrokeColor: string;
    isDark: boolean;
  };
}

interface Snippet {
  label: string;
  latex: string;
  tooltip?: string;
  keywords?: string;
}

interface SnippetTab {
  id: string;
  name: string;
  icon?: string;
  items: Snippet[];
}

const SNIPPET_TABS: SnippetTab[] = [
  {
    id: "basic",
    name: "Cơ bản",
    items: [
      { label: "a/b", latex: "\\frac{▯}{▯}", tooltip: "Phân số", keywords: "phan so fraction chia" },
      { label: "√x", latex: "\\sqrt{▯}", tooltip: "Căn bậc hai", keywords: "can bac hai sqrt" },
      { label: "ⁿ√x", latex: "\\sqrt[▯]{▯}", tooltip: "Căn bậc n", keywords: "can bac n" },
      { label: "x²", latex: "▯^2", tooltip: "Bình phương", keywords: "binh phuong mu hai" },
      { label: "xⁿ", latex: "▯^{▯}", tooltip: "Lũy thừa mũ n", keywords: "luy thua mu" },
      { label: "xᵢ", latex: "▯_{▯}", tooltip: "Chỉ số dưới", keywords: "chi so duoi index sub" },
      { label: "xᵢⁿ", latex: "▯_{▯}^{▯}", tooltip: "Vừa chỉ số vừa mũ", keywords: "sub sup" },
      { label: "( ... )", latex: "\\left( ▯ \\right)", tooltip: "Ngoặc đơn co giãn", keywords: "ngoac don parenthesis" },
      { label: "[ ... ]", latex: "\\left[ ▯ \\right]", tooltip: "Ngoặc vuông co giãn", keywords: "ngoac vuong bracket" },
      { label: "|x|", latex: "\\left| ▯ \\right|", tooltip: "Giá trị tuyệt đối / Độ dài", keywords: "tri tuyet doi abs" },
    ],
  },
  {
    id: "calculus",
    name: "Giải tích",
    items: [
      { label: "∫ f(x)dx", latex: "\\int ▯ \\,dx", tooltip: "Nguyên hàm", keywords: "nguyen ham integral" },
      { label: "∫ₐᵇ f(x)", latex: "\\int_{▯}^{▯} ▯ \\,dx", tooltip: "Tích phân xác định", keywords: "tich phan definite" },
      { label: "∬ f", latex: "\\iint_{D} ▯ \\,dxdy", tooltip: "Tích phân kép", keywords: "tich phan kep" },
      { label: "lim", latex: "\\lim_{x \\to ▯} ▯", tooltip: "Giới hạn", keywords: "gioi han limit lim" },
      { label: "dy/dx", latex: "\\frac{d▯}{d▯}", tooltip: "Đạo hàm vi phân", keywords: "dao ham vi phan derivative" },
      { label: "f'(x)", latex: "f'(x)", tooltip: "Đạo hàm f phẩy", keywords: "dao ham f'" },
      { label: "f''(x)", latex: "f''(x)", tooltip: "Đạo hàm cấp 2", keywords: "dao ham cap 2" },
      { label: "∑", latex: "\\sum_{i=1}^{n} ▯", tooltip: "Tổng xích-ma", keywords: "tong xich ma sum sigma" },
      { label: "∏", latex: "\\prod_{i=1}^{n} ▯", tooltip: "Tích chuỗi", keywords: "tich chuoi prod" },
      { label: "∞", latex: "\\infty", tooltip: "Vô cùng / Vô cực", keywords: "vo cung vo cuc infinity" },
    ],
  },
  {
    id: "geometry",
    name: "Hình & Vectơ",
    items: [
      { label: "v⃗", latex: "\\vec{▯}", tooltip: "Vectơ v", keywords: "vecto vector vec" },
      { label: "AB⃗", latex: "\\overrightarrow{▯}", tooltip: "Vectơ hai điểm AB", keywords: "vecto ab overrightarrow" },
      { label: "∠ABC", latex: "\\widehat{▯}", tooltip: "Góc ABC", keywords: "goc hat widehat" },
      { label: "△ABC", latex: "\\triangle ▯", tooltip: "Tam giác ABC", keywords: "tam giac triangle" },
      { label: "⟂", latex: "\\perp", tooltip: "Vuông góc", keywords: "vuong goc perpendicular" },
      { label: "∥", latex: "\\parallel", tooltip: "Song song", keywords: "song song parallel" },
      { label: "°", latex: "^{\\circ}", tooltip: "Độ góc", keywords: "do goc degree circ" },
      { label: "·", latex: "\\cdot", tooltip: "Tích vô hướng / Nhân", keywords: "nhan cham dot" },
      { label: "×", latex: "\\times", tooltip: "Tích có hướng / Dấu nhân", keywords: "nhan cheo times" },
      { label: "≅", latex: "\\cong", tooltip: "Đồng dạng / Bằng nhau", keywords: "dong dang cong" },
    ],
  },
  {
    id: "systems",
    name: "Hệ & Ma trận",
    items: [
      {
        label: "{ Hệ 2 PT",
        latex: "\\begin{cases} ▯ \\\\ ▯ \\end{cases}",
        tooltip: "Hệ 2 phương trình",
        keywords: "he phuong trinh cases 2 pt",
      },
      {
        label: "{ Hệ 3 PT",
        latex: "\\begin{cases} ▯ \\\\ ▯ \\\\ ▯ \\end{cases}",
        tooltip: "Hệ 3 phương trình",
        keywords: "he phuong trinh cases 3 pt",
      },
      {
        label: "[ Ma trận 2×2 ]",
        latex: "\\begin{pmatrix} ▯ & ▯ \\\\ ▯ & ▯ \\end{pmatrix}",
        tooltip: "Ma trận ngoặc tròn 2x2",
        keywords: "ma tran matrix pmatrix",
      },
      {
        label: "| Định thức |",
        latex: "\\begin{vmatrix} ▯ & ▯ \\\\ ▯ & ▯ \\end{vmatrix}",
        tooltip: "Định thức ma trận (det)",
        keywords: "dinh thuc det vmatrix",
      },
      { label: "±", latex: "\\pm", tooltip: "Cộng trừ", keywords: "cong tru plus minus pm" },
      { label: "≠", latex: "\\neq", tooltip: "Khác", keywords: "khac not equal neq" },
      { label: "≤", latex: "\\le", tooltip: "Nhỏ hơn hoặc bằng", keywords: "nho hon bang le" },
      { label: "≥", latex: "\\ge", tooltip: "Lớn hơn hoặc bằng", keywords: "lon hon bang ge" },
      { label: "≈", latex: "\\approx", tooltip: "Xấp xỉ", keywords: "xap xi approx" },
      { label: "≡", latex: "\\equiv", tooltip: "Đồng dư / Tương đương", keywords: "dong du tuong duong equiv" },
    ],
  },
  {
    id: "greek",
    name: "Hy Lạp & Quan hệ",
    items: [
      { label: "α", latex: "\\alpha", keywords: "alpha an-pha" },
      { label: "β", latex: "\\beta", keywords: "beta be-ta" },
      { label: "γ", latex: "\\gamma", keywords: "gamma" },
      { label: "δ", latex: "\\delta", keywords: "delta" },
      { label: "Δ", latex: "\\Delta", tooltip: "Delta hoa", keywords: "delta hoa biet thuc" },
      { label: "π", latex: "\\pi", keywords: "pi so pi" },
      { label: "θ", latex: "\\theta", keywords: "theta theta" },
      { label: "λ", latex: "\\lambda", keywords: "lambda buoc song" },
      { label: "μ", latex: "\\mu", keywords: "mu mi-cro he so ma sat" },
      { label: "ω", latex: "\\omega", keywords: "omega tan so goc" },
      { label: "Ω", latex: "\\Omega", tooltip: "Ohm / Điện trở", keywords: "omega ohm dien tro" },
      { label: "ρ", latex: "\\rho", keywords: "rho khoi luong rieng" },
      { label: "φ", latex: "\\varphi", keywords: "phi goc pha" },
      { label: "∈", latex: "\\in", tooltip: "Thuộc", keywords: "thuoc in tap hop" },
      { label: "∉", latex: "\\notin", tooltip: "Không thuộc", keywords: "khong thuoc notin" },
      { label: "⊂", latex: "\\subset", tooltip: "Tập con", keywords: "tap con subset" },
      { label: "∪", latex: "\\cup", tooltip: "Hợp", keywords: "hop cup" },
      { label: "∩", latex: "\\cap", tooltip: "Giao", keywords: "giao cap" },
      { label: "∀", latex: "\\forall", tooltip: "Với mọi", keywords: "voi moi forall" },
      { label: "∃", latex: "\\exists", tooltip: "Tồn tại", keywords: "ton tai exists" },
      { label: "⇒", latex: "\\Rightarrow", tooltip: "Suy ra", keywords: "suy ra implies" },
      { label: "⇔", latex: "\\Leftrightarrow", tooltip: "Tương đương", keywords: "tuong duong iff" },
    ],
  },
  {
    id: "physics",
    name: "Vật lý",
    items: [
      { label: "F⃗ = ma⃗", latex: "\\vec{F} = m\\vec{a}", tooltip: "Định luật II Newton", keywords: "luc newton vat ly" },
      { label: "v = v₀ + at", latex: "v = v_0 + at", tooltip: "Vận tốc biến đổi đều", keywords: "van toc" },
      { label: "W = F.s.cosα", latex: "A = F \\cdot s \\cdot \\cos\\alpha", tooltip: "Công cơ học", keywords: "cong co hoc" },
      { label: "W_đ = ½mv²", latex: "W_d = \\frac{1}{2}mv^2", tooltip: "Động năng", keywords: "dong nang" },
      { label: "W_t = mgh", latex: "W_t = mgh", tooltip: "Thế năng trọng trường", keywords: "the nang" },
      { label: "T = 2π√(l/g)", latex: "T = 2\\pi \\sqrt{\\frac{l}{g}}", tooltip: "Chu kỳ con lắc đơn", keywords: "con lac don chu ky" },
      { label: "λ = v/f", latex: "\\lambda = \\frac{v}{f}", tooltip: "Bước sóng", keywords: "buoc song tan so" },
      { label: "I = U/R", latex: "I = \\frac{U}{R}", tooltip: "Định luật Ohm", keywords: "dinh luat ohm dien" },
      { label: "m/s²", latex: "\\text{m/s}^2", tooltip: "Đơn vị gia tốc", keywords: "don vi gia toc" },
      { label: "kg·m/s", latex: "\\text{kg}\\cdot\\text{m/s}", tooltip: "Đơn vị động lượng", keywords: "dong luong" },
    ],
  },
  {
    id: "chemistry",
    name: "Hóa học",
    items: [
      { label: "ce{...}", latex: "\\ce{▯}", tooltip: "Công thức hóa học chuẩn mhchem", keywords: "hoa hoc mhchem" },
      { label: "A + B -> C", latex: "\\ce{A + B -> C}", tooltip: "Phương trình phản ứng", keywords: "phan ung reaction" },
      { label: "A <=> B", latex: "\\ce{A <=> B}", tooltip: "Phản ứng thuận nghịch", keywords: "thuan nghich can bang" },
      { label: "->[t°]", latex: "\\ce{->[t^\\circ]}", tooltip: "Phản ứng đun nóng t°", keywords: "nhiet do t do" },
      { label: "->[xt, t°]", latex: "\\ce{->[xt, t^\\circ]}", tooltip: "Có xúc tác và nhiệt độ", keywords: "xuc tac" },
      { label: "H₂SO₄", latex: "\\ce{H2SO4}", tooltip: "Axit Sunfuric", keywords: "axit h2so4" },
      { label: "Fe³⁺ / SO₄²⁻", latex: "\\ce{Fe^{3+} + SO4^{2-}}", tooltip: "Ion điện tích", keywords: "ion dien tich" },
      { label: "↓ kết tủa", latex: "\\ce{v}", tooltip: "Mũi tên kết tủa (hoặc v)", keywords: "ket tua" },
      { label: "↑ bay hơi", latex: "\\ce{^}", tooltip: "Mũi tên khí bay lên", keywords: "khi bay hoi" },
      { label: "pH = -log[H+]", latex: "\\text{pH} = -\\log[\\text{H}^+]", tooltip: "Công thức tính pH", keywords: "ph axit bazo" },
    ],
  },
];

// Công thức mẫu phổ biến theo môn học
const SAMPLE_FORMULAS = [
  {
    subject: "Toán",
    title: "Nghiệm PT Bậc 2",
    latex: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
  },
  {
    subject: "Toán",
    title: "Tích phân từng phần",
    latex: "\\int_{a}^{b} u\\,dv = \\left. uv \\right|_{a}^{b} - \\int_{a}^{b} v\\,du",
  },
  {
    subject: "Toán",
    title: "Đạo hàm thương",
    latex: "\\left( \\frac{u}{v} \\right)' = \\frac{u'v - uv'}{v^2}",
  },
  {
    subject: "Lý",
    title: "Định luật vạn vật hấp dẫn",
    latex: "F_{hd} = G \\frac{m_1 m_2}{r^2}",
  },
  {
    subject: "Lý",
    title: "Dao động điều hòa",
    latex: "x = A \\cos(\\omega t + \\varphi)",
  },
  {
    subject: "Hóa",
    title: "Nhiệt phân đá vôi",
    latex: "\\ce{CaCO3 ->[t^\\circ] CaO + CO2 ^}",
  },
  {
    subject: "Hóa",
    title: "Kim loại tác dụng axit",
    latex: "\\ce{Fe + 2HCl -> FeCl2 + H2 ^}",
  },
  {
    subject: "Hóa",
    title: "Cân bằng tổng hợp NH3",
    latex: "\\ce{N2 + 3H2 <=>[Fe, t^\\circ, p] 2NH3}",
  },
];

export function MathFormulaModal({
  isOpen,
  onClose,
  onInsertFormula,
  initialLatex = "",
  initialColor,
  initialFontSize = "lg",
  editingElementId = null,
  boardTheme,
}: MathFormulaModalProps) {
  // Xác định màu mặc định tương phản với bảng hiện tại
  const isBoardDark = boardTheme?.isDark ?? false;
  const defaultContrastColor = initialColor
    ? initialColor
    : isBoardDark
    ? "#ffffff"
    : "#0f172a";

  const [latexInput, setLatexInput] = useState(
    initialLatex || "f(x) = \\frac{x^2 - 4x + 3}{x - 1}"
  );
  const [renderedHtml, setRenderedHtml] = useState("");
  const [lastValidHtml, setLastValidHtml] = useState("");
  const [renderError, setRenderError] = useState<string | null>(null);

  const [color, setColor] = useState(defaultContrastColor);
  const [fontSize, setFontSize] = useState<"sm" | "md" | "lg" | "xl">(initialFontSize);

  // Xem trước giả lập nền: "board" (theo bảng) | "light" | "dark"
  const [previewBgMode, setPreviewBgMode] = useState<"board" | "light" | "dark">("board");

  // Tab bảng ký hiệu đang chọn & tìm kiếm
  const [activeTab, setActiveTab] = useState("basic");
  const [symbolSearch, setSymbolSearch] = useState("");

  // Lịch sử gần đây (10 công thức)
  const [recentFormulas, setRecentFormulas] = useState<string[]>([]);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Nạp lịch sử từ localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedRecent = localStorage.getItem("edteach_wb_recent_latex");
        if (storedRecent) setRecentFormulas(JSON.parse(storedRecent));
      } catch (e) {
        console.warn("Lỗi đọc recent latex:", e);
      }
    }
  }, []);

  // Cập nhật khi mở lại công thức (nhấp đúp sửa)
  useEffect(() => {
    if (isOpen) {
      if (initialLatex) {
        setLatexInput(initialLatex);
      }
      if (initialColor) {
        setColor(initialColor);
      } else {
        setColor(defaultContrastColor);
      }
      if (initialFontSize) {
        setFontSize(initialFontSize);
      }
      // Focus vào ô nhập khi mở modal
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, initialLatex, initialColor, initialFontSize, defaultContrastColor]);

  // Biên dịch KaTeX thời gian thực
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
      setLastValidHtml(html);
      setRenderError(null);
    } catch (err: any) {
      const rawMsg = err.message || "";
      // Việt hóa thông báo lỗi phổ biến
      let viMsg = "Lỗi cú pháp LaTeX";
      if (rawMsg.includes("Expected '}'")) {
        const match = rawMsg.match(/position (\d+)/);
        viMsg = match ? `Thiếu dấu đóng ngoặc '}' tại ký tự ${match[1]}` : "Thiếu dấu đóng ngoặc '}'";
      } else if (rawMsg.includes("Undefined control sequence")) {
        const cmd = rawMsg.match(/\\([a-zA-Z]+)/);
        viMsg = cmd ? `Lệnh '\\${cmd[1]}' chưa hợp lệ` : "Lệnh LaTeX không tồn tại";
      } else if (rawMsg.includes("Expected")) {
        viMsg = `Sai định dạng cú pháp: ${rawMsg.replace("KaTeX parse error: ", "")}`;
      }
      setRenderError(viMsg);
    }
  }, [latexInput]);

  // Chèn snippet tại vị trí con trỏ và nhảy vào placeholder ▯
  const handleInsertSnippet = (snippetLatex: string) => {
    if (!inputRef.current) {
      setLatexInput((prev) => prev + " " + snippetLatex);
      return;
    }
    const textarea = inputRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = latexInput.substring(start, end);

    let insertedText = snippetLatex;
    // Nếu đang bôi đen văn bản, thay placeholder đầu tiên bằng văn bản được chọn
    if (selectedText && insertedText.includes("▯")) {
      insertedText = insertedText.replace("▯", selectedText);
    }

    const nextVal = latexInput.substring(0, start) + insertedText + latexInput.substring(end);
    setLatexInput(nextVal);

    setTimeout(() => {
      textarea.focus();
      const firstPlaceholderIdx = nextVal.indexOf("▯", start);
      if (firstPlaceholderIdx !== -1) {
        textarea.setSelectionRange(firstPlaceholderIdx, firstPlaceholderIdx + 1);
      } else {
        const targetPos = start + insertedText.length;
        textarea.setSelectionRange(targetPos, targetPos);
      }
    }, 20);
  };

  // Phím Tab nhảy sang placeholder ▯ kế tiếp
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      const textarea = inputRef.current;
      if (!textarea) return;
      const currentPos = textarea.selectionEnd;
      const nextPlaceholder = latexInput.indexOf("▯", currentPos);
      if (nextPlaceholder !== -1) {
        e.preventDefault();
        textarea.setSelectionRange(nextPlaceholder, nextPlaceholder + 1);
        return;
      }
      const prevPlaceholder = latexInput.indexOf("▯");
      if (prevPlaceholder !== -1 && prevPlaceholder < currentPos) {
        e.preventDefault();
        textarea.setSelectionRange(prevPlaceholder, prevPlaceholder + 1);
        return;
      }
    }

    // Ctrl+Enter hoặc Cmd+Enter để chèn ngay
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleConfirmInsert(false);
    }

    // Esc để đóng modal
    if (e.key === "Escape") {
      onClose();
    }
  };

  // Lưu lịch sử gần đây
  const saveToRecent = (formula: string) => {
    if (!formula.trim()) return;
    try {
      const updated = [formula, ...recentFormulas.filter((f) => f !== formula)].slice(0, 10);
      setRecentFormulas(updated);
      localStorage.setItem("edteach_wb_recent_latex", JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Xác nhận chèn lên Bảng vẽ
  const handleConfirmInsert = async (keepOpenAfterInsert: boolean = false) => {
    if (!latexInput.trim() || renderError) return;

    try {
      saveToRecent(latexInput.trim());

      const fontScaleMap = {
        sm: { size: "22px", boardPx: 22 },
        md: { size: "28px", boardPx: 28 },
        lg: { size: "36px", boardPx: 36 },
        xl: { size: "46px", boardPx: 46 },
      };
      const scaleInfo = fontScaleMap[fontSize];

      const cleanKatexHtml = katex.renderToString(latexInput, {
        displayMode: true,
        throwOnError: false,
      });

      // Đo kích thước thực tế từ khung preview
      const previewEl = previewRef.current?.querySelector(".katex-display") || previewRef.current;
      const rect = previewEl ? previewEl.getBoundingClientRect() : { width: 280, height: 70 };
      const padding = 28;
      const w = Math.max(120, Math.ceil(rect.width) + padding * 2);
      const h = Math.max(55, Math.ceil(rect.height) + padding * 2);

      const svgString = `
<svg xmlns="http://www.w3.org/2000/svg" width="${w * 1.5}" height="${h * 1.5}" viewBox="0 0 ${w} ${h}">
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml" style="display:flex;align-items:center;justify-content:center;height:100%;color:${color};font-size:${scaleInfo.size};font-family:KaTeX_Main, 'Times New Roman', serif;">
      ${cleanKatexHtml}
    </div>
  </foreignObject>
</svg>
`.trim();

      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        onInsertFormula(dataUrl, w, h, latexInput.trim(), color, fontSize);
        if (keepOpenAfterInsert) {
          setLatexInput("");
          inputRef.current?.focus();
        } else {
          onClose();
        }
      };
      reader.readAsDataURL(svgBlob);
    } catch (err) {
      console.error("Lỗi sinh SVG công thức:", err);
    }
  };

  // Lọc ký hiệu theo từ khóa tìm kiếm xuyên các Tab
  const searchResults = useMemo(() => {
    if (!symbolSearch.trim()) return [];
    const q = symbolSearch.toLowerCase().trim();
    const results: Snippet[] = [];
    SNIPPET_TABS.forEach((tab) => {
      tab.items.forEach((item) => {
        if (
          item.label.toLowerCase().includes(q) ||
          item.latex.toLowerCase().includes(q) ||
          (item.tooltip && item.tooltip.toLowerCase().includes(q)) ||
          (item.keywords && item.keywords.toLowerCase().includes(q))
        ) {
          results.push(item);
        }
      });
    });
    return results;
  }, [symbolSearch]);

  if (!isOpen) return null;

  // Tính toán màu nền của khung xem trước
  const previewBgColor =
    previewBgMode === "board"
      ? boardTheme?.viewBackgroundColor || "#12161f"
      : previewBgMode === "dark"
      ? "#12161f"
      : "#ffffff";

  const isEditing = Boolean(editingElementId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative flex flex-col w-full max-w-[1020px] max-h-[92vh] rounded-2xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="math-modal-title"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold font-serif italic text-base shadow-xs">
              f(x)
            </div>
            <div>
              <h3 id="math-modal-title" className="text-sm font-bold text-foreground">
                {isEditing ? "Sửa công thức KaTeX trên Bảng" : "Soạn thảo Công thức KaTeX (Toán, Lý, Hóa)"}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Độ nét cao chuẩn KaTeX & Hóa học \ce&#123;&#125;, tự động co giãn theo góc nhìn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* BODY - CHIA 2 CỘT (DESKTOP) / XẾP DỌC (MOBILE) */}
        <div className="flex-1 overflow-y-auto md:overflow-hidden flex flex-col md:flex-row p-4 sm:p-5 gap-5">
          {/* CỘT TRÁI (55%): Ô NHẬP LATEX & BẢNG KÝ HIỆU SNIPPET */}
          <div className="w-full md:w-[56%] flex flex-col gap-3.5 md:overflow-y-auto pr-0 md:pr-1">
            {/* 1. Ô Nhập Mã LaTeX */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="latex-code-input" className="text-xs font-bold text-foreground">
                  Mã nguồn LaTeX / KaTeX:
                </label>
                <span className="text-[11px] text-muted-foreground">
                  Nhấn <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">Tab</kbd> nhảy giữa các ▯
                </span>
              </div>
              <textarea
                id="latex-code-input"
                ref={inputRef}
                rows={4}
                value={latexInput}
                onChange={(e) => setLatexInput(e.target.value)}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                autoCapitalize="off"
                placeholder="Nhập mã LaTeX hoặc click các ký hiệu bên dưới (VD: \frac{a}{b}, \ce{H2SO4})..."
                className="w-full text-sm font-mono p-3.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs resize-y"
              />
              {/* Trạng thái cú pháp trực quan */}
              <div className="flex items-center justify-between min-h-[20px] px-1">
                {renderError ? (
                  <span className="text-[11px] text-rose-500 font-medium flex items-center gap-1">
                    ⚠ {renderError}
                  </span>
                ) : (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 inline" /> Cú pháp KaTeX hợp lệ
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground font-mono">
                  {latexInput.length} ký tự
                </span>
              </div>
            </div>

            {/* 2. Bảng Ký Hiệu & Phép Tính (Phân Tab + Tìm Kiếm) */}
            <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-muted/20 p-3">
              {/* Thanh tìm kiếm ký hiệu & Tab */}
              <div className="flex items-center justify-between gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={symbolSearch}
                    onChange={(e) => setSymbolSearch(e.target.value)}
                    placeholder="Tìm ký hiệu: phân số, tích phân, alpha, hóa..."
                    className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  {symbolSearch && (
                    <button
                      onClick={() => setSymbolSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Danh sách Tabs (nếu không đang tìm kiếm) */}
              {!symbolSearch && (
                <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none border-b border-border/50 text-xs">
                  {SNIPPET_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition cursor-pointer text-xs ${
                        activeTab === tab.id
                          ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {tab.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Lưới các nút ký hiệu */}
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 max-h-44 overflow-y-auto p-0.5">
                {(symbolSearch ? searchResults : SNIPPET_TABS.find((t) => t.id === activeTab)?.items || []).map(
                  (item) => (
                    <button
                      key={item.label + item.latex}
                      type="button"
                      onClick={() => handleInsertSnippet(item.latex)}
                      title={`${item.tooltip || item.label}: ${item.latex}`}
                      aria-label={item.tooltip || item.label}
                      className="h-10 px-2 rounded-lg bg-card hover:bg-muted border border-border/70 text-foreground text-xs font-serif flex items-center justify-center hover:border-primary/60 transition cursor-pointer active:scale-95 shadow-2xs group relative"
                    >
                      <span className="truncate">{item.label}</span>
                    </button>
                  )
                )}
                {symbolSearch && searchResults.length === 0 && (
                  <div className="col-span-full py-4 text-center text-xs text-muted-foreground">
                    Không tìm thấy ký hiệu phù hợp cho &quot;{symbolSearch}&quot;
                  </div>
                )}
              </div>
            </div>

            {/* 3. Công Thức Mẫu Nhanh Theo Môn */}
            <div className="flex flex-col gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Công thức mẫu phổ biến (Toán - Lý - Hóa):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_FORMULAS.map((sample) => (
                  <button
                    key={sample.title}
                    type="button"
                    onClick={() => {
                      setLatexInput(sample.latex);
                      inputRef.current?.focus();
                    }}
                    title={sample.latex}
                    className="px-2.5 py-1 rounded-lg bg-muted/60 hover:bg-muted border border-border/70 text-[11px] font-medium text-foreground hover:border-blue-400 transition cursor-pointer"
                  >
                    <span className="font-bold text-blue-600 dark:text-blue-400 mr-1">[{sample.subject}]</span>
                    {sample.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (44%): XEM TRƯỚC TRỰC QUAN & TÙY CHỌN ĐỊNH DẠNG */}
          <div className="w-full md:w-[44%] flex flex-col gap-3.5 shrink-0">
            {/* Khung Xem Trước Trực Quan Khổ Lớn */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Xem trước trực quan:</span>
                {/* Nút chuyển đổi nhanh chế độ xem nền */}
                <div className="flex items-center gap-1 text-[10px] bg-muted/60 p-0.5 rounded-lg border border-border">
                  <button
                    type="button"
                    onClick={() => setPreviewBgMode("board")}
                    className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                      previewBgMode === "board" ? "bg-background text-foreground shadow-2xs font-bold" : "text-muted-foreground"
                    }`}
                  >
                    Nền bảng
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewBgMode("light")}
                    className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                      previewBgMode === "light" ? "bg-background text-foreground shadow-2xs font-bold" : "text-muted-foreground"
                    }`}
                  >
                    Sáng
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewBgMode("dark")}
                    className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                      previewBgMode === "dark" ? "bg-background text-foreground shadow-2xs font-bold" : "text-muted-foreground"
                    }`}
                  >
                    Tối
                  </button>
                </div>
              </div>

              {/* Màn Canvas Preview */}
              <div
                ref={previewRef}
                style={{
                  backgroundColor: previewBgColor,
                  color: color,
                }}
                className="min-h-[160px] sm:min-h-[180px] rounded-2xl border border-border p-5 flex flex-col items-center justify-center overflow-x-auto text-center transition-colors shadow-inner relative group"
              >
                {renderedHtml ? (
                  <div
                    className="katex-preview select-none max-w-full overflow-x-auto py-2"
                    dangerouslySetInnerHTML={{ __html: renderedHtml }}
                  />
                ) : lastValidHtml && renderError ? (
                  <div className="flex flex-col items-center gap-1 opacity-50">
                    <div
                      className="katex-preview select-none max-w-full overflow-x-auto"
                      dangerouslySetInnerHTML={{ __html: lastValidHtml }}
                    />
                    <span className="text-[10px] text-rose-500 font-sans italic">
                      (Bản hợp lệ gần nhất - đang lỗi cú pháp)
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground/80 italic font-sans">
                    Công thức sẽ hiển thị tại đây theo chuẩn KaTeX
                  </span>
                )}

                {/* Badge kích thước ước tính */}
                <div className="absolute bottom-2 right-2.5 px-2 py-0.5 rounded-md bg-black/40 text-[10px] font-mono text-white/80 backdrop-blur-xs">
                  {fontSize === "sm" ? "~22px" : fontSize === "md" ? "~28px" : fontSize === "lg" ? "~36px" : "~46px"} trên bảng
                </div>
              </div>
            </div>

            {/* Màu Sắc & Kích Thước Chữ */}
            <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-muted/20 p-3.5">
              {/* 1. Chọn Màu */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-foreground">Màu chữ công thức:</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { name: "Đen", hex: "#0f172a" },
                    { name: "Trắng (Phấn)", hex: "#ffffff" },
                    { name: "Xanh dương", hex: "#2563eb" },
                    { name: "Đỏ", hex: "#ef4444" },
                    { name: "Xanh lá", hex: "#16a34a" },
                    { name: "Vàng phấn", hex: "#fef08a" },
                    { name: "Cam", hex: "#f97316" },
                    { name: "Tím", hex: "#a855f7" },
                  ].map((c) => {
                    const isSelected = color === c.hex;
                    return (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setColor(c.hex)}
                        title={c.name}
                        aria-label={`Chọn màu ${c.name}`}
                        className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer shadow-2xs ${
                          isSelected
                            ? "scale-115 ring-2 ring-primary ring-offset-2 ring-offset-card"
                            : "opacity-85 hover:opacity-100 hover:scale-105"
                        }`}
                        style={{
                          backgroundColor: c.hex,
                          borderColor: c.hex === "#ffffff" ? "#cbd5e1" : c.hex,
                        }}
                      >
                        {isSelected && (
                          <Check
                            className={`w-3.5 h-3.5 ${
                              c.hex === "#ffffff" || c.hex === "#fef08a" ? "text-slate-900" : "text-white"
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Chọn Kích Thước */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-border/60">
                <span className="text-xs font-semibold text-foreground">Kích cỡ trên bảng vẽ:</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: "sm", label: "Nhỏ", px: "22px" },
                    { id: "md", label: "Vừa", px: "28px" },
                    { id: "lg", label: "Lớn", px: "36px" },
                    { id: "xl", label: "Rất lớn", px: "46px" },
                  ].map((sz) => (
                    <button
                      key={sz.id}
                      type="button"
                      onClick={() => setFontSize(sz.id as any)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium transition cursor-pointer flex flex-col items-center justify-center ${
                        fontSize === sz.id
                          ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                          : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border/70"
                      }`}
                    >
                      <span>{sz.label}</span>
                      <span className="text-[10px] opacity-75">{sz.px}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Lịch Sử Công Thức Gần Đây (Nhanh) */}
            {recentFormulas.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Gần đây:
                </span>
                <div className="flex flex-col gap-1 max-h-24 overflow-y-auto pr-1">
                  {recentFormulas.slice(0, 4).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => {
                        setLatexInput(f);
                        inputRef.current?.focus();
                      }}
                      className="px-2 py-1 rounded bg-muted/40 hover:bg-muted border border-border/50 text-[11px] font-mono text-left truncate text-foreground/90 transition cursor-pointer"
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-border bg-muted/40 shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground hidden sm:flex">
            <span>
              💡 Nhấn <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-[10px]">Ctrl+Enter</kbd> để chèn nhanh
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-semibold text-foreground transition cursor-pointer"
            >
              Hủy
            </button>

            {!isEditing && (
              <button
                type="button"
                onClick={() => handleConfirmInsert(true)}
                disabled={Boolean(renderError) || !latexInput.trim()}
                className="px-3.5 py-2 rounded-xl border border-blue-500/50 bg-blue-50/50 hover:bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50 disabled:opacity-50 transition cursor-pointer hidden md:flex items-center gap-1.5"
                title="Chèn công thức hiện tại lên bảng và giữ modal để gõ tiếp công thức khác"
              >
                <span>Chèn & tiếp tục</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleConfirmInsert(false)}
              disabled={Boolean(renderError) || !latexInput.trim()}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-xs font-bold text-white transition shadow-sm cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{isEditing ? "Cập nhật công thức" : "Chèn lên Bảng"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
