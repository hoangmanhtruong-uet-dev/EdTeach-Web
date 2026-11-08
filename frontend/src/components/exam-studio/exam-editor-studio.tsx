"use client";
import dynamic from "next/dynamic";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Strikethrough,
  Superscript,
  Subscript,
  Square,
  Type,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  MoveVertical,
  ArrowUpDown,
  Indent,
  Outdent,
  ListOrdered,
  Columns as ColumnsIcon,
  Columns3,
  FileText,
  Check,
  Share2,
  FolderOpen,
  Sparkles,
  Crown,
  Presentation,
  RotateCcw,
  X,
  Undo2,
  Redo2,
  Printer,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  Bold,
  Italic,
  Underline,
  Sigma,
  Highlighter,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeft,
  List,
  Layers,
  Image as ImageIcon,
  Paperclip,
  ArrowUp,
  Clock,
  Calendar,
  Eye,
  EyeOff,
  Trash2,
  Edit3,
  Copy,
  Download,
  Shuffle,
  FileCheck2,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Loader2,
  Save,
  Gift,
  Table as TableIcon,
  Link as LinkIcon,
  SplitSquareVertical,
  Minus as MinusIcon,
  AlertCircle,
  PenTool,
  Columns2,
  FileSignature,
  Scale,
  Heading1,
  FileCode,
  SlidersHorizontal,
  LayoutGrid,
  Maximize2,
  Search,
  Replace,
  TrendingUp,
  BarChart3,
  FileSpreadsheet,
  User,
  LogOut,
} from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "@/context/auth-context";
import { useConfirm } from "@/context/confirm-dialog-context";
import { LatexRenderer } from "@/components/ui/latex-renderer";
// docx exporter loaded dynamically on demand
import { getUserPreferences } from "@/lib/preferences";
import { ExamWithQuestions, Question, createExam, updateExam, getExamById } from "@/lib/api/exams";
import {
  SheetBoxSvg,
  HeaterCircuitSvg,
  RadiationHazardSvg,
  VariationTableSvg,
  FunctionGraphSvg,
  StatisticsChartSvg,
  GeometryDiagramSvg,
} from "./svg-illustrations";
import { isProUser, isMaxUser, PricingPlan } from "@/lib/payment/plans";
import { APP_URL } from "@/lib/constants";
import { VariationTableRenderer, VariationTableData } from "./variation-table-modal";
import { FunctionGraphRenderer, FunctionGraphData } from "./function-graph-modal";
import { ChartSvgRenderer, ChartConfigData } from "./chart-editor-modal";
import { GeometrySvgRenderer, GeometryConfigData } from "./geometry-editor-modal";
import { TeachingStepperBar } from "./teaching-stepper-bar";

// Dynamic lazy imports for heavy studio modals (Performance Optimization P2)
const QuotaExhaustedModal = dynamic(() => import("@/components/modals/quota-exhausted-modal").then((m) => m.QuotaExhaustedModal), { ssr: false });
const FormulaEditorModal = dynamic(() => import("./formula-editor-modal").then((m) => m.FormulaEditorModal), { ssr: false });
const FindReplaceModal = dynamic(() => import("./find-replace-modal").then((m) => m.FindReplaceModal), { ssr: false });
const ShuffleExamModal = dynamic(() => import("./shuffle-exam-modal").then((m) => m.ShuffleExamModal), { ssr: false });
const ShareExamModal = dynamic(() => import("./share-exam-modal").then((m) => m.ShareExamModal), { ssr: false });
const UpgradeTierModal = dynamic(() => import("@/components/modals/upgrade-tier-modal").then((m) => m.UpgradeTierModal), { ssr: false });
const PaymentCheckoutModal = dynamic(() => import("@/components/modals/payment-checkout-modal").then((m) => m.PaymentCheckoutModal), { ssr: false });
const VariationTableModal = dynamic(() => import("./variation-table-modal").then((m) => m.VariationTableModal), { ssr: false });
const FunctionGraphModal = dynamic(() => import("./function-graph-modal").then((m) => m.FunctionGraphModal), { ssr: false });
const ChartEditorModal = dynamic(() => import("./chart-editor-modal").then((m) => m.ChartEditorModal), { ssr: false });
const GeometryEditorModal = dynamic(() => import("./geometry-editor-modal").then((m) => m.GeometryEditorModal), { ssr: false });
import { parseDocumentFile } from "@/lib/utils/document-parser";
import { saveToOfflineStore } from "@/lib/storage/indexed-db";

export interface DocItem {
  id: string;
  exam_id?: string;
  order_index?: number;
  type?: string;
  content: string;
  options?: any;
  correct_answer?: string | null;
  explanation?: string | null;
  difficulty?: string;
  created_at?: string;
  blockType?:
    | "question"
    | "svg"
    | "table"
    | "header_custom"
    | "section_title"
    | "heading_2"
    | "heading_3"
    | "passage"
    | "dotted_lines"
    | "callout"
    | "divider"
    | "page_break"
    | "image"
    | "bubble_sheet"
    | "true_false"
    | "short_answer"
    | "essay"
    | "formula"
    | "rubric_table"
    | "rubric_with_geometry";
  svgType?:
    | "sheet_box"
    | "heater"
    | "radiation"
    | "variation_table"
    | "function_graph"
    | "chart"
    | "geometry";
  tableRows?: string[][];
  imageUrl?: string;
  sectionTitle?: string;
  passageContent?: string;
  headerType?: "two_col" | "centered" | "student_info" | "grading_guide";
  trueFalseItems?: { label: string; statement: string; isCorrect: boolean }[];
  shortAnswerPrompt?: string;
  variationTableData?: VariationTableData;
  functionGraphData?: FunctionGraphData;
  chartData?: ChartConfigData;
  geometryData?: GeometryConfigData;
}

export const FONT_FAMILIES = [
  { id: "Times New Roman", name: "Times New Roman", desc: "Chuẩn Bộ GD&ĐT", fontStack: "'Times New Roman', Times, serif" },
  { id: "Arial", name: "Arial", desc: "Không chân rõ ràng", fontStack: "Arial, Helvetica, sans-serif" },
  { id: "Calibri", name: "Calibri", desc: "Hiện đại Microsoft Word", fontStack: "Calibri, Candara, Segoe, sans-serif" },
  { id: "Roboto", name: "Roboto", desc: "Google Fonts thanh thoát", fontStack: "Roboto, 'Segoe UI', sans-serif" },
  { id: "Be Vietnam Pro", name: "Be Vietnam Pro", desc: "Tối ưu hóa tiếng Việt", fontStack: "'Be Vietnam Pro', sans-serif" },
  { id: "Courier New", name: "Courier New", desc: "Monospace / Tin học", fontStack: "'Courier New', Courier, monospace" },
];

export const TEXT_STYLES = [
  {
    id: "normal",
    label: "Văn bản thường",
    shortcut: "Ctrl+Alt+0",
    desc: "Câu hỏi / đoạn văn thông thường",
    previewClass: "font-normal text-slate-800",
  },
  {
    id: "heading_1",
    label: "Tiêu đề 1 (Phần thi)",
    shortcut: "Ctrl+Alt+1",
    desc: "PHẦN I, PHẦN II, Tiêu đề phần lớn",
    previewClass: "font-bold text-slate-900 uppercase tracking-wide",
  },
  {
    id: "heading_2",
    label: "Tiêu đề 2 (Đề mục con)",
    shortcut: "Ctrl+Alt+2",
    desc: "Chủ đề bài đọc, nhóm câu hỏi",
    previewClass: "font-bold text-slate-800",
  },
  {
    id: "heading_3",
    label: "Tiêu đề 3 (Tiểu mục)",
    shortcut: "Ctrl+Alt+3",
    desc: "Tiểu mục, ghi chú nhỏ",
    previewClass: "font-semibold text-slate-700",
  },
  {
    id: "passage",
    label: "Trích dẫn / Bài đọc hiểu",
    shortcut: "Ctrl+Alt+P",
    desc: "Khung văn bản đọc hiểu trích đoạn",
    previewClass: "italic text-slate-600 border-l-2 border-primary pl-1.5",
  },
  {
    id: "callout",
    label: "Hộp ghi chú & Barem",
    shortcut: "Ctrl+Alt+N",
    desc: "Khung lưu ý, hướng dẫn phòng thi",
    previewClass: "font-medium text-amber-800 bg-amber-50 px-1 rounded",
  },
];

interface ExamStudioProps {
  initialExamId?: string;
}

export function ExamEditorStudio({ initialExamId }: ExamStudioProps) {
  const { promptModal } = useConfirm();
  const router = useRouter();
  const { user, profile, wallet, refreshWallet, signOut } = useAuth();

  // Document states
  const [examId, setExamId] = useState<string | null>(initialExamId || null);
  const [title, setTitle] = useState("Đề thi mới");
  const [subject, setSubject] = useState("Toán");
  const [grade, setGrade] = useState("4");
  const [duration, setDuration] = useState("45");
  const [savedStatus, setSavedStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [shareToast, setShareToast] = useState(false);

  // Formatting & View options
  const [zoom, setZoom] = useState(100);
  const [fontFamily, setFontFamily] = useState("Times New Roman");
  const [fontSize, setFontSize] = useState(15);
  const [isStyleMenuOpen, setIsStyleMenuOpen] = useState(false);
  const [isFontMenuOpen, setIsFontMenuOpen] = useState(false);
  const styleMenuRef = useRef<HTMLDivElement>(null);
  const fontMenuRef = useRef<HTMLDivElement>(null);
  const [currentTextStyle, setCurrentTextStyle] = useState<string>("normal");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isSuperscript, setIsSuperscript] = useState(false);
  const [isSubscript, setIsSubscript] = useState(false);
  const [isBorderBox, setIsBorderBox] = useState(false);
  const [textColor, setTextColor] = useState("#0f172a");
  const [bgColor, setBgColor] = useState("transparent");
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right" | "justify">("left");
  const [lineSpacing, setLineSpacing] = useState("1.3");
  const [columnCount, setColumnCount] = useState(1);
  const [teacherMode, setTeacherMode] = useState(true); // true: shows answers & solutions

  // Undo / Redo history
  const [history, setHistory] = useState<DocItem[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const isUndoRedoAction = useRef(false);

  // Formula Modal states
  const [isFormulaModalOpen, setIsFormulaModalOpen] = useState(false);
  const [formulaModalMode, setFormulaModalMode] = useState<"math" | "chem">("math");
  const [formulaModalInitialFormula, setFormulaModalInitialFormula] = useState("");
  const [formulaModalDisplayMode, setFormulaModalDisplayMode] = useState<"inline" | "block">("inline");

  // Find & Replace Modal states
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState(false);
  const [findReplaceMode, setFindReplaceMode] = useState<"find" | "replace">("find");
  const [searchMatches, setSearchMatches] = useState<number[]>([]);
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);

  // Variation Table Modal states
  const [isVarTableModalOpen, setIsVarTableModalOpen] = useState(false);
  const [currentVarTableData, setCurrentVarTableData] = useState<VariationTableData | null>(null);
  const [editingVarTableId, setEditingVarTableId] = useState<string | null>(null);

  // Function Graph Modal states
  const [isGraphModalOpen, setIsGraphModalOpen] = useState(false);
  const [currentGraphData, setCurrentGraphData] = useState<FunctionGraphData | null>(null);
  const [editingGraphId, setEditingGraphId] = useState<string | null>(null);

  // Chart Modal states
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [currentChartData, setCurrentChartData] = useState<ChartConfigData | null>(null);
  const [editingChartId, setEditingChartId] = useState<string | null>(null);

  // Geometry Modal states
  const [isGeomModalOpen, setIsGeomModalOpen] = useState(false);
  const [currentGeomData, setCurrentGeomData] = useState<GeometryConfigData | null>(null);
  const [editingGeomId, setEditingGeomId] = useState<string | null>(null);

  // Layout panels
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [aiSidebarOpen, setAiSidebarOpen] = useState(true);

  // Resizable Sidebars (Widths & Dragging state)
  const [leftWidth, setLeftWidth] = useState(260);
  const [rightWidth, setRightWidth] = useState(380);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);

  // Standard Header Visibility (default false for fresh blank canvas)
  const [showStandardHeader, setShowStandardHeader] = useState(false);

  // Responsive sidebar defaults and localStorage memory
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLeftOpen = localStorage.getItem("exam_studio_left_sidebar_open");
      const savedLeftWidth = localStorage.getItem("exam_studio_left_sidebar_width");
      if (savedLeftWidth) {
        const parsedW = parseInt(savedLeftWidth, 10);
        if (parsedW >= 220 && parsedW <= 380) setLeftWidth(parsedW);
      }
      if (savedLeftOpen !== null) {
        setLeftSidebarOpen(savedLeftOpen === "true");
      } else if (window.innerWidth < 1366) {
        // Under 1366px: default to compact Dock Rail
        setLeftSidebarOpen(false);
      }

      if (window.innerWidth < 1024) {
        setAiSidebarOpen(false);
      }
    }
  }, []);

  const toggleLeftSidebar = (open?: boolean) => {
    const next = open !== undefined ? open : !leftSidebarOpen;
    setLeftSidebarOpen(next);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("exam_studio_left_sidebar_open", String(next));
      } catch {}
    }
  };

  // Dropdown states for menus
  const [showZoomMenu, setShowZoomMenu] = useState(false);
  const [showAddTypeMenu, setShowAddTypeMenu] = useState(false);
  const [showEmptyAddTypeMenu, setShowEmptyAddTypeMenu] = useState(false);
  const [activeLeftTab, setActiveLeftTab] = useState<"toc" | "templates">("toc");

  // Questions & Document Content Blocks
  const [questions, setQuestions] = useState<DocItem[]>([]);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const submenuTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSubmenuHover = (
    menuKey: string
  ) => {
    if (submenuTimerRef.current) {
      clearTimeout(submenuTimerRef.current);
      submenuTimerRef.current = null;
    }
    // If a different submenu is currently open, grace period of 150ms before switching
    // This allows safe diagonal cursor movement into the currently open submenu
    if (activeSubmenu && activeSubmenu !== menuKey) {
      submenuTimerRef.current = setTimeout(() => {
        setActiveSubmenu(menuKey);
      }, 150);
    } else {
      setActiveSubmenu(menuKey);
    }
  };

  const handleSubmenuLeave = () => {
    if (submenuTimerRef.current) {
      clearTimeout(submenuTimerRef.current);
    }
    submenuTimerRef.current = setTimeout(() => {
      setActiveSubmenu(null);
    }, 250);
  };

  const cancelSubmenuLeave = () => {
    if (submenuTimerRef.current) {
      clearTimeout(submenuTimerRef.current);
      submenuTimerRef.current = null;
    }
  };

  const toggleSubmenu = (
    menuKey: string
  ) => {
    if (submenuTimerRef.current) {
      clearTimeout(submenuTimerRef.current);
      submenuTimerRef.current = null;
    }
    setActiveSubmenu(activeSubmenu === menuKey ? null : menuKey);
  };
  const [hoveredGridCell, setHoveredGridCell] = useState<{ row: number; col: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [switchingTypeId, setSwitchingTypeId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    content: string;
    options: Record<string, string>;
    correct_answer: string;
    explanation: string;
    trueFalseItems?: Array<{ label: string; statement: string; isCorrect: boolean }>;
  }>({
    content: "",
    options: { A: "", B: "", C: "", D: "" },
    correct_answer: "A",
    explanation: "",
    trueFalseItems: [],
  });

  // AI Assistant states
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiThinkingEffort, setAiThinkingEffort] = useState<"low" | "medium" | "high">("medium");
  const [aiModelTier, setAiModelTier] = useState<"medium" | "high">("medium");
  const [attachedImage, setAttachedImage] = useState<{
    name: string;
    dataUrl: string;
    size: string;
  } | null>(null);
  const [attachedDoc, setAttachedDoc] = useState<{
    name: string;
    content: string;
    size: string;
  } | null>(null);
  const ocrImageInputRef = useRef<HTMLInputElement>(null);
  const docAttachmentInputRef = useRef<HTMLInputElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiStatusMessage, setAiStatusMessage] = useState<string | null>(null);
  const [showActiveMenu, setShowActiveMenu] = useState<string | null>(null);

  // Toast notification state (aria-live="polite")
  const [toast, setToast] = useState<{ message: string; type: "info" | "success" | "warning" | "error" } | null>(null);
  const showToast = useCallback((message: string, type: "info" | "success" | "warning" | "error" = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  }, []);

  // BeforeUnload navigation guard when changes are unsaved
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (savedStatus === "unsaved") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [savedStatus]);

  // Daily Quota & Viral Referral states
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [showShareExamModal, setShowShareExamModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const moreActionsRef = useRef<HTMLDivElement>(null);
  const [showAiAttachmentMenu, setShowAiAttachmentMenu] = useState(false);
  const aiAttachmentMenuRef = useRef<HTMLDivElement>(null);
  const [showShuffleModal, setShowShuffleModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState<"pro" | "max" | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<PricingPlan | null>(null);
  const [dailyQuota, setDailyQuota] = useState(3);
  const [dailyUsed, setDailyUsed] = useState(0);
  const [userReferralCode, setUserReferralCode] = useState("EDUTEACH");

  // Click outside to close dropdown menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false);
      }
      if (moreActionsRef.current && !moreActionsRef.current.contains(target)) {
        setShowMoreActions(false);
      }
      if (aiAttachmentMenuRef.current && !aiAttachmentMenuRef.current.contains(target)) {
        setShowAiAttachmentMenu(false);
      }
    };
    if (showUserMenu || showMoreActions || showAiAttachmentMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu, showMoreActions, showAiAttachmentMenu]);

  // Load referral code
  useEffect(() => {
    async function loadReferralInfo() {
      try {
        const res = await fetch("/api/referral");
        if (res.ok) {
          const data = await res.json();
          if (data.referral_code) {
            setUserReferralCode(data.referral_code);
          }
        }
      } catch {
        // silent
      }
    }
    loadReferralInfo();
  }, []);

  // Undo / Redo logic
  const handleUndo = () => {
    if (historyIndex > 0) {
      isUndoRedoAction.current = true;
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      setQuestions(history[prevIdx]);
      setSavedStatus("unsaved");
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setQuestions(history[nextIdx]);
      setSavedStatus("unsaved");
    }
  };

  // Synchronize history
  useEffect(() => {
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }
    if (questions.length > 0 || historyIndex >= 0) {
      setHistory((prev) => {
        const upToCurrent = prev.slice(0, historyIndex + 1);
        const newHist = [...upToCurrent, questions];
        if (newHist.length > 25) {
          return newHist.slice(-25);
        }
        return newHist;
      });
      setHistoryIndex((prev) => Math.min(prev + 1, 24));
    }
  }, [questions]);

  // Global Keyboard Shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+F, Ctrl+H)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;

      // Ctrl+Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        if (!isInput) {
          e.preventDefault();
          handleUndo();
        }
      }
      // Ctrl+Y or Ctrl+Shift+Z: Redo
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z")
      ) {
        if (!isInput) {
          e.preventDefault();
          handleRedo();
        }
      }
      // Ctrl+F: Find
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setIsFindReplaceOpen(true);
        setFindReplaceMode("find");
      }
      // Ctrl+H: Replace
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "h") {
        e.preventDefault();
        setIsFindReplaceOpen(true);
        setFindReplaceMode("replace");
      }
      // Ctrl+: Reset format
      if ((e.ctrlKey || e.metaKey) && e.key === "\\") {
        e.preventDefault();
        handleResetFormatting();
      }
      // Ctrl+B: Bold
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b" && !isInput) {
        e.preventDefault();
        setIsBold((b) => !b);
      }
      // Ctrl+I: Italic
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i" && !isInput) {
        e.preventDefault();
        setIsItalic((i) => !i);
      }
      // Ctrl+U: Underline
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "u" && !isInput) {
        e.preventDefault();
        setIsUnderline((u) => !u);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [historyIndex, history]);


  const handleSaveVariationTable = (vtData: VariationTableData) => {
    if (editingVarTableId) {
      setQuestions((prev) =>
        prev.map((q) => (q.id === editingVarTableId ? { ...q, variationTableData: vtData } : q))
      );
      setSavedStatus("unsaved");
      return;
    }
    const newBlock: DocItem = {
      id: "vt-" + Date.now(),
      exam_id: examId || "temp",
      order_index: questions.length + 1,
      type: "multiple_choice",
      content: `Cho hàm số $y = f(x)$ có bảng biến thiên như hình sau:`,
      options: {
        A: "Hàm số đồng biến trên khoảng $(-∞; 1)$",
        B: "Hàm số nghịch biến trên khoảng $(-1; 1)$",
        C: "Điểm cực đại của đồ thị hàm số là $(1; -2)$",
        D: "Giá trị nhỏ nhất của hàm số bằng $-2$",
      },
      correct_answer: "A",
      explanation: "Dựa vào bảng biến thiên để xác định khoảng đồng biến/nghịch biến và cực trị.",
      blockType: "svg",
      svgType: "variation_table",
      variationTableData: vtData,
      created_at: new Date().toISOString(),
    };
    setQuestions([...questions, newBlock]);
    setSavedStatus("unsaved");
  };

  const handleSaveFunctionGraph = (gData: FunctionGraphData) => {
    if (editingGraphId) {
      setQuestions((prev) =>
        prev.map((q) => (q.id === editingGraphId ? { ...q, functionGraphData: gData } : q))
      );
      setSavedStatus("unsaved");
      return;
    }
    const newBlock: DocItem = {
      id: "graph-" + Date.now(),
      exam_id: examId || "temp",
      order_index: questions.length + 1,
      type: "multiple_choice",
      content: `Cho hàm số $y = f(x)$ có đồ thị như hình vẽ bên dưới:`,
      options: {
        A: "Đồ thị hàm số đạt cực đại tại $x = -2$",
        B: "Hàm số đồng biến trên toàn $\\mathbb{R}$",
        C: "Điểm cực tiểu của đồ thị là $(0; -4)$",
        D: "Phương trình $f(x) = 0$ có 3 nghiệm phân biệt",
      },
      correct_answer: "D",
      explanation: "Đọc đồ thị toạ độ Oxy và số giao điểm với trục hoành.",
      blockType: "svg",
      svgType: "function_graph",
      functionGraphData: gData,
      created_at: new Date().toISOString(),
    };
    setQuestions([...questions, newBlock]);
    setSavedStatus("unsaved");
  };

  const handleSaveChart = (cData: ChartConfigData) => {
    if (editingChartId) {
      setQuestions((prev) =>
        prev.map((q) => (q.id === editingChartId ? { ...q, chartData: cData } : q))
      );
      setSavedStatus("unsaved");
      return;
    }
    const newBlock: DocItem = {
      id: "chart-" + Date.now(),
      exam_id: examId || "temp",
      order_index: questions.length + 1,
      type: "multiple_choice",
      content: `Dựa vào biểu đồ "${cData.title}" sau đây:`,
      options: {
        A: "Mục có giá trị cao nhất là " + (cData.items[0]?.label || "Mục 1"),
        B: "Tổng giá trị các mục vượt quá 100",
        C: "Số lượng các nhóm được thống kê là " + cData.items.length,
        D: "Mục có số liệu thấp nhất là " + (cData.items[cData.items.length - 1]?.label || "Mục cuối"),
      },
      correct_answer: "A",
      explanation: "Phân tích và đối chiếu số liệu từ biểu đồ thống kê.",
      blockType: "svg",
      svgType: "chart",
      chartData: cData,
      created_at: new Date().toISOString(),
    };
    setQuestions([...questions, newBlock]);
    setSavedStatus("unsaved");
  };

  const handleSaveGeometry = (gData: GeometryConfigData) => {
    if (editingGeomId) {
      setQuestions((prev) =>
        prev.map((q) => (q.id === editingGeomId ? { ...q, geometryData: gData } : q))
      );
      setSavedStatus("unsaved");
      return;
    }
    const newBlock: DocItem = {
      id: "geo-" + Date.now(),
      exam_id: examId || "temp",
      order_index: questions.length + 1,
      type: "multiple_choice",
      content: `Cho hình vẽ hình học sau (${gData.title || "Hình học"}):`,
      options: {
        A: "Khẳng định A đúng",
        B: "Khẳng định B đúng",
        C: "Khẳng định C đúng",
        D: "Khẳng định D đúng",
      },
      correct_answer: "A",
      explanation: "Áp dụng định lý và tính chất hình học tương ứng.",
      blockType: "svg",
      svgType: "geometry",
      geometryData: gData,
      created_at: new Date().toISOString(),
    };
    setQuestions([...questions, newBlock]);
    setSavedStatus("unsaved");
  };

  // Resizable sidebar drag listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingLeft) {
        if (e.clientX < 180) {
          // Snap closed to Dock Rail
          setLeftSidebarOpen(false);
          setIsDraggingLeft(false);
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem("exam_studio_left_sidebar_open", "false");
            } catch {}
          }
        } else {
          const newW = Math.max(220, Math.min(e.clientX, 380));
          setLeftWidth(newW);
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem("exam_studio_left_sidebar_width", String(newW));
            } catch {}
          }
        }
      }
      if (isDraggingRight) {
        const newW = Math.max(280, Math.min(window.innerWidth - e.clientX, 560));
        setRightWidth(newW);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingLeft(false);
      setIsDraggingRight(false);
    };

    if (isDraggingLeft || isDraggingRight) {
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    }

    return () => {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingLeft, isDraggingRight]);

  // Load existing exam if initialExamId is present, or load preferences for new exams
  useEffect(() => {
    if (initialExamId) {
      const idToLoad = initialExamId;
      async function loadExam() {
        try {
          const data: any = await getExamById(idToLoad);
          if (data) {
            setTitle(data.name || data.title || "Đề thi mới");
            setSubject(data.subject || "Toán");
            setGrade(data.grade || "4");
            const qs =
              data.questions && data.questions.length > 0
                ? data.questions
                : (data.config as any)?.questions || [];
            if (qs.length > 0) {
              setQuestions(qs as Question[]);
            }
          }
        } catch (e) {
          console.error("Failed to load exam data", e);
        }
      }
      loadExam();
    } else {
      // Initialize defaults from teacher's settings preferences
      const prefs = getUserPreferences(profile);
      if (prefs.teaching.defaultSubject) setSubject(prefs.teaching.defaultSubject);
      if (prefs.teaching.defaultGrade) setGrade(prefs.teaching.defaultGrade);
      if (prefs.teaching.defaultDuration) setDuration(String(prefs.teaching.defaultDuration));
      if (prefs.export.docxFont) setFontFamily(prefs.export.docxFont);

      // CRT-03: Khôi phục bản nháp chưa lưu gần nhất từ localStorage
      try {
        const localDraft = localStorage.getItem("edutest_exam_draft");
        if (localDraft) {
          const parsed = JSON.parse(localDraft);
          if (
            parsed &&
            parsed.questions &&
            parsed.questions.length > 0 &&
            Date.now() - (parsed.updatedAt || 0) < 7 * 86400000
          ) {
            setTitle(parsed.title || "Đề thi mới");
            if (parsed.subject) setSubject(parsed.subject);
            if (parsed.grade) setGrade(parsed.grade);
            if (parsed.duration) setDuration(String(parsed.duration));
            setQuestions(parsed.questions);
            if (parsed.examId && !parsed.examId.startsWith("temp")) {
              setExamId(parsed.examId);
            }
          }
        }
      } catch (err) {
        console.warn("Could not restore local draft:", err);
      }
    }
  }, [initialExamId, profile]);

  // CRT-03: Cơ chế Autosave thực sự xuống Supabase & LocalStorage
  const saveCurrentExam = useCallback(async () => {
    // 1. Sao lưu tức thì vào localStorage
    try {
      localStorage.setItem(
        "edutest_exam_draft",
        JSON.stringify({
          examId,
          title,
          subject,
          grade,
          duration,
          questions,
          updatedAt: Date.now(),
        })
      );
    } catch (e) {
      console.warn("Could not save draft to localStorage:", e);
    }

    if (questions.length === 0 && (!title || title === "Đề thi mới")) {
      setSavedStatus("saved");
      return;
    }

    if (!user?.id) {
      setSavedStatus("saved");
      return;
    }

    setSavedStatus("saving");
    // Backup offline to IndexedDB immediately before network dispatch (CRT-03)
    saveToOfflineStore(
      `exam_studio_${examId || "draft"}`,
      { title, subject, grade, duration, questions },
      1
    ).catch(() => {});

    try {
      if (examId && !examId.startsWith("seed-") && !examId.startsWith("temp")) {
        await updateExam(examId, {
          name: title,
          title,
          subject,
          grade,
          question_count: questions.length,
          config: { questions, duration } as any,
          updated_at: new Date().toISOString(),
        });
      } else {
        const created = await createExam({
          user_id: user.id,
          name: title,
          title,
          subject,
          grade,
          chapter: "",
          question_count: questions.length,
          status: "draft",
          credit_cost: 0,
          config: { questions, duration } as any,
        });
        if (created?.id) {
          setExamId(created.id);
          if (typeof window !== "undefined") {
            window.history.replaceState(null, "", `/exams/create?initialExamId=${created.id}`);
          }
        }
      }
      setSavedStatus("saved");
    } catch (err) {
      console.error("Autosave to DB failed:", err);
      setSavedStatus("unsaved");
    }
  }, [user?.id, examId, title, subject, grade, duration, questions]);

  // Debounced Autosave 3 giây khi có thay đổi chưa lưu
  useEffect(() => {
    if (savedStatus !== "unsaved") return;
    const timer = setTimeout(() => {
      saveCurrentExam();
    }, 3000);
    return () => clearTimeout(timer);
  }, [savedStatus, saveCurrentExam]);

  // Tự động đồng bộ khi có kết nối mạng internet trở lại
  useEffect(() => {
    const handleOnline = () => {
      if (savedStatus === "unsaved") {
        saveCurrentExam();
      }
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [savedStatus, saveCurrentExam]);

  // Phím tắt Ctrl+S / Cmd+S để lưu ngay và chặn hộp thoại lưu trang web của trình duyệt
  useEffect(() => {
    const handleSaveShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        saveCurrentExam();
        showToast("Đã lưu đề thi thành công!", "success");
      }
    };
    window.addEventListener("keydown", handleSaveShortcut);
    return () => window.removeEventListener("keydown", handleSaveShortcut);
  }, [saveCurrentExam]);

  // Handle suggestion click from right AI sidebar
  const handleSelectSuggestion = (promptText: string) => {
    setAiPrompt(promptText);
    executeAiGenerate(promptText);
  };

  const handleResetFormatting = () => {
    setIsBold(false);
    setIsItalic(false);
    setIsUnderline(false);
    setIsStrikethrough(false);
    setIsSuperscript(false);
    setIsSubscript(false);
    setIsBorderBox(false);
    setTextColor("#0f172a");
    setBgColor("transparent");
    setTextAlign("left");
    setLineSpacing("1.3");
    setColumnCount(1);
    setFontSize(15);
    setFontFamily("Times New Roman");
    setShowActiveMenu(null);
    setActiveSubmenu(null);
  };

  const handleShowExamStats = () => {
    const mcqCount = questions.filter(
      (q) => !q.blockType || q.blockType === "question" || q.type === "multiple_choice"
    ).length;
    const tfCount = questions.filter((q) => q.blockType === "true_false" || q.type === "true_false").length;
    const saCount = questions.filter((q) => q.blockType === "short_answer" || q.type === "short_answer").length;
    const essayCount = questions.filter((q) => q.blockType === "essay" || q.type === "essay").length;

    showToast(
      `📊 Thống kê: ${questions.length} khối (${mcqCount} MCQ • ${tfCount} Đúng/Sai • ${saCount} Trả lời ngắn • ${essayCount} Tự luận). Thang điểm 10.0đ`,
      "info"
    );
  };

  // Execute AI generation
  const executeAiGenerate = async (promptTextOverride?: string) => {
    const promptToUse = promptTextOverride !== undefined ? promptTextOverride : aiPrompt;
    if (!promptToUse.trim() && !attachedImage && !attachedDoc) return;

    setIsGenerating(true);
    setAiStatusMessage("Trợ lý AI đang thiết lập cấu trúc và sinh câu hỏi…");
    setSavedStatus("saving");

    let detectedSubject = subject;
    let detectedGrade = grade;

    const lower = promptToUse.toLowerCase();
    if (/hóa|hoá|acid|base|chemistry/i.test(lower)) {
      detectedSubject = "Hóa học";
    } else if (/toán|toan|đại số|hình học|math/i.test(lower)) {
      detectedSubject = "Toán";
    } else if (/vật lý|vật lí|lý|lí|physics/i.test(lower)) {
      detectedSubject = "Vật lý";
    } else if (/sinh học|sinh|biology/i.test(lower)) {
      detectedSubject = "Sinh học";
    } else if (/tiếng anh|anh văn|english/i.test(lower)) {
      detectedSubject = "Tiếng Anh";
    } else if (/ngữ văn|văn|tiếng việt|literature/i.test(lower)) {
      detectedSubject = "Ngữ văn";
    } else if (/lịch sử|sử|history/i.test(lower)) {
      detectedSubject = "Lịch sử";
    } else if (/địa lý|địa lí|địa|geography/i.test(lower)) {
      detectedSubject = "Địa lý";
    } else if (/tin học|tin/i.test(lower)) {
      detectedSubject = "Tin học";
    }

    const gradeMatch = lower.match(/(?:lớp|khối)\s*(\d{1,2})/i);
    if (gradeMatch && gradeMatch[1]) {
      const gNum = parseInt(gradeMatch[1]);
      if (gNum >= 1 && gNum <= 12) {
        detectedGrade = gNum.toString();
      }
    }

    // Parse question count (e.g. 15 câu, 4 câu, 6 câu)
    let totalQuestions = 10;
    const countMatches = lower.match(/(\d+)\s*câu/g);
    if (countMatches) {
      let sum = 0;
      for (const m of countMatches) {
        const val = parseInt(m);
        if (!isNaN(val) && val > 0 && val <= 50) sum += val;
      }
      if (sum > 0) totalQuestions = Math.min(sum, 30);
    }

    setSubject(detectedSubject);
    setGrade(detectedGrade);

    try {
      const finalTopic = promptToUse.trim()
        ? promptToUse
        : attachedImage
        ? `Quét OCR và chuyển đổi ảnh đề thi (${attachedImage.name}) thành câu hỏi trắc nghiệm`
        : `Soạn đề thi theo tài liệu (${attachedDoc?.name})`;

      // Auto title
      const newTitle = `Đề kiểm tra ${detectedSubject} Lớp ${detectedGrade} - ${finalTopic.length > 35 ? finalTopic.slice(0, 32) + "..." : finalTopic}`;
      setTitle(newTitle);

      const res = await fetch("/api/exams/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTitle,
          subject: detectedSubject,
          grade: detectedGrade,
          topic: finalTopic,
          question_type: "MCQ",
          num_questions: totalQuestions,
          difficulty: 2,
          thinking_effort: aiThinkingEffort,
          additional_context: promptToUse,
          model_tier: aiModelTier,
          image_base64: attachedImage?.dataUrl,
          attachment_text: attachedDoc?.content,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "QUOTA_EXHAUSTED" || res.status === 403) {
          setShowQuotaModal(true);
          setAiStatusMessage(data.message || "Thầy cô không đủ credits để tạo đề thi này. Vui lòng nâng cấp Gói PRO (+30.000 credits) hoặc nạp thêm credits.");
          return;
        }
        throw new Error(data.message || data.error || "Lỗi máy chủ sinh đề AI");
      }

      if (data.daily_quota !== undefined) {
        setDailyQuota(data.daily_quota);
        setDailyUsed(data.daily_quota_used);
      }

      if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
        const mappedQuestions: DocItem[] = data.questions.map((q: any, i: number) => ({
          id: `gen-${Date.now()}-${i}`,
          exam_id: data.exam_id || "temp",
          order_index: i + 1,
          type: q.type || (q.blockType === "true_false" ? "true_false" : q.blockType === "short_answer" ? "short_answer" : q.blockType === "essay" ? "essay" : "multiple_choice"),
          blockType: q.blockType || (q.trueFalseItems ? "true_false" : q.options ? "multiple_choice" : "multiple_choice"),
          difficulty: q.difficulty || "medium",
          content: q.content || (q.blockType === "section_title" ? (q.sectionTitle || "") : ""),
          sectionTitle: q.sectionTitle,
          trueFalseItems: q.trueFalseItems,
          options:
            q.blockType === "true_false" ||
            q.blockType === "short_answer" ||
            q.blockType === "essay" ||
            q.blockType === "section_title"
              ? undefined
              : (q.options || { A: "A", B: "B", C: "C", D: "D" }),
          correct_answer: q.correct_answer || (q.blockType === "short_answer" ? "" : "A"),
          explanation: q.explanation || q.solution || "",
          points: q.points || 1,
        }));
        setQuestions(mappedQuestions);
      } else if (data.exam_id) {
        setExamId(data.exam_id);
        const fullExam: any = await getExamById(data.exam_id);
        if (fullExam?.config?.questions && Array.isArray(fullExam.config.questions)) {
          setQuestions(fullExam.config.questions);
        } else if (fullExam && fullExam.questions && fullExam.questions.length > 0) {
          setQuestions(fullExam.questions as Question[]);
        }
      }

      setAiStatusMessage(`Đã tạo thành công đề thi ${detectedSubject} lớp ${detectedGrade}!`);
      setTimeout(() => setAiStatusMessage(null), 4000);
      setSavedStatus("saved");
      setAiPrompt("");
      setAttachedImage(null);
      setAttachedDoc(null);
    } catch (err: any) {
      console.error("AI generation failed:", err);
      setSavedStatus("unsaved");
      setAiStatusMessage(`Lỗi sinh đề: ${err.message || "Vui lòng thử lại"}`);
      setTimeout(() => setAiStatusMessage(null), 6000);
    } finally {
      setIsGenerating(false);
      refreshWallet?.().catch(() => {});
    }
  };

  const createMockQuestions = (subj: string, grd: string) => {
    const mocks: Question[] = [
      {
        id: "mock-1",
        exam_id: examId || "temp",
        order_index: 1,
        type: "multiple_choice",
        difficulty: "easy",
        content: `Số chẵn lớn nhất có 4 chữ số khác nhau là:`,
        options: {
          A: "9876",
          B: "9998",
          C: "9874",
          D: "9786",
        },
        correct_answer: "A",
        explanation: "Các chữ số khác nhau từ lớn đến bé là 9, 8, 7, 6. Vì yêu cầu số chẵn nên chữ số tận cùng là 6. Vậy số đó là 9876.",
        created_at: new Date().toISOString(),
      },
      {
        id: "mock-2",
        exam_id: examId || "temp",
        order_index: 2,
        type: "multiple_choice",
        difficulty: "medium",
        content: `Giá trị của biểu thức $P = 4500 + 125 \\times 4$ là:`,
        options: {
          A: "5000",
          B: "4900",
          C: "5200",
          D: "4850",
        },
        correct_answer: "A",
        explanation: "Thực hiện phép nhân trước: $125 \\times 4 = 500$. Sau đó cộng: $4500 + 500 = 5000$.",
        created_at: new Date().toISOString(),
      },
      {
        id: "mock-3",
        exam_id: examId || "temp",
        order_index: 3,
        type: "multiple_choice",
        difficulty: "medium",
        content: `Một hình chữ nhật có chu vi $48\\text{ cm}$, chiều rộng là $8\\text{ cm}$. Diện tích của hình chữ nhật đó là:`,
        options: {
          A: "$128\\text{ cm}^2$",
          B: "$144\\text{ cm}^2$",
          C: "$160\\text{ cm}^2$",
          D: "$192\\text{ cm}^2$",
        },
        correct_answer: "A",
        explanation: "Nửa chu vi hình chữ nhật là: $48 : 2 = 24\\text{ cm}$. Chiều dài là: $24 - 8 = 16\\text{ cm}$. Diện tích là: $16 \\times 8 = 128\\text{ cm}^2$.",
        created_at: new Date().toISOString(),
      },
      {
        id: "mock-4",
        exam_id: examId || "temp",
        order_index: 4,
        type: "multiple_choice",
        difficulty: "hard",
        content: `Trung bình cộng của ba số là $45$. Nếu thêm số thứ tư là $65$ thì trung bình cộng của bốn số là:`,
        options: {
          A: "50",
          B: "48",
          C: "52",
          D: "55",
        },
        correct_answer: "A",
        explanation: "Tổng của ba số đầu là: $45 \\times 3 = 135$. Tổng của bốn số là: $135 + 65 = 200$. Trung bình cộng bốn số là: $200 : 4 = 50$.",
        created_at: new Date().toISOString(),
      },
    ];
    setQuestions(mocks);
  };

  // Add a question with selected type
  const handleAddQuestion = (
    qType: "multiple_choice" | "true_false" | "short_answer" | "essay" = "multiple_choice"
  ) => {
    let newQ: DocItem;
    const now = Date.now();
    const idx = questions.length + 1;

    if (qType === "true_false") {
      newQ = {
        id: "tf-" + now,
        exam_id: examId || "temp",
        order_index: idx,
        type: "true_false",
        blockType: "true_false",
        difficulty: "medium",
        content: `Câu ${idx}: Cho các phát biểu sau đây. Xét tính đúng/sai của các mệnh đề:`,
        options: {},
        trueFalseItems: [
          { label: "a", statement: "Mệnh đề a...", isCorrect: true },
          { label: "b", statement: "Mệnh đề b...", isCorrect: false },
          { label: "c", statement: "Mệnh đề c...", isCorrect: true },
          { label: "d", statement: "Mệnh đề d...", isCorrect: false },
        ],
        correct_answer: "a - Đ, b - S, c - Đ, d - S",
        explanation: "Lời giải chi tiết cho từng ý a, b, c, d.",
        created_at: new Date().toISOString(),
      };
    } else if (qType === "short_answer") {
      newQ = {
        id: "sa-" + now,
        exam_id: examId || "temp",
        order_index: idx,
        type: "short_answer",
        blockType: "short_answer",
        difficulty: "medium",
        content: `Câu ${idx}: Nhập đề bài câu hỏi trả lời ngắn (học sinh tự tính toán và điền đáp số vào ô trống)...`,
        options: {},
        correct_answer: "10",
        explanation: "Hướng dẫn các bước tính ra đáp số.",
        created_at: new Date().toISOString(),
      };
    } else if (qType === "essay") {
      newQ = {
        id: "ess-" + now,
        exam_id: examId || "temp",
        order_index: idx,
        type: "essay",
        blockType: "essay",
        difficulty: "medium",
        content: `Câu ${idx} (Tự luận): Nhập đề bài câu hỏi tự luận tại đây...`,
        options: {},
        correct_answer: "Barem điểm...",
        explanation: "Hướng dẫn chấm chi tiết và thang điểm.",
        created_at: new Date().toISOString(),
      };
    } else {
      newQ = {
        id: "q-" + now,
        exam_id: examId || "temp",
        order_index: idx,
        type: "multiple_choice",
        difficulty: "medium",
        content: `Câu ${idx}: Nhập nội dung câu hỏi trắc nghiệm tại đây...`,
        options: {
          A: "Phương án A",
          B: "Phương án B",
          C: "Phương án C",
          D: "Phương án D",
        },
        correct_answer: "A",
        explanation: "Nhập lời giải chi tiết và hướng dẫn giải...",
        created_at: new Date().toISOString(),
      };
    }

    setQuestions([...questions, newQ]);
    handleStartEdit(newQ);
    setShowAddTypeMenu(false);
    setShowEmptyAddTypeMenu(false);
  };

  // Switch type of an existing question
  const handleSwitchQuestionType = (qId: string, targetType: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id !== qId) return q;

        if (targetType === "true_false") {
          return {
            ...q,
            type: "true_false",
            blockType: "true_false",
            trueFalseItems: q.trueFalseItems || [
              { label: "a", statement: "Khẳng định a...", isCorrect: true },
              { label: "b", statement: "Khẳng định b...", isCorrect: false },
              { label: "c", statement: "Khẳng định c...", isCorrect: true },
              { label: "d", statement: "Khẳng định d...", isCorrect: false },
            ],
            correct_answer: q.correct_answer || "a - Đ, b - S, c - Đ, d - S",
          };
        } else if (targetType === "short_answer") {
          return {
            ...q,
            type: "short_answer",
            blockType: "short_answer",
            correct_answer: q.correct_answer || "Đáp số",
          };
        } else if (targetType === "essay") {
          return {
            ...q,
            type: "essay",
            blockType: "essay",
            correct_answer: q.correct_answer || "Barem điểm",
          };
        } else {
          return {
            ...q,
            type: "multiple_choice",
            blockType: "question",
            options:
              q.options && Object.keys(q.options).length > 0
                ? q.options
                : {
                    A: "Phương án A",
                    B: "Phương án B",
                    C: "Phương án C",
                    D: "Phương án D",
                  },
            correct_answer: q.correct_answer?.length === 1 ? q.correct_answer : "A",
          };
        }
      })
    );
  };

  // Handlers for "Chèn" & "Chỉnh sửa" Menu Features
  const handleInsertFormula = (type: "math" | "chem") => {
    setFormulaModalMode(type);
    setFormulaModalInitialFormula("");
    setFormulaModalDisplayMode("inline");
    setIsFormulaModalOpen(true);
    setShowActiveMenu(null);
    setActiveSubmenu(null);
  };

  const handleSaveFormula = (
    formulaLatex: string,
    displayMode: "inline" | "block",
    mode: "math" | "chem"
  ) => {
    if (!formulaLatex.trim()) return;

    const formattedFormula =
      displayMode === "inline" ? `$${formulaLatex}$` : `$$${formulaLatex}$$`;

    // Case 1: If user was editing a question inline
    if (editingQuestionId) {
      setEditForm((prev) => ({
        ...prev,
        content: prev.content ? `${prev.content} ${formattedFormula}` : formattedFormula,
      }));
      return;
    }

    // Case 2: Standalone formula block
    const newBlock: DocItem = {
      id: "formula-" + Date.now(),
      exam_id: examId || "temp",
      order_index: questions.length + 1,
      type: "formula",
      blockType: "formula",
      content: formattedFormula,
      options: {},
      created_at: new Date().toISOString(),
    };

    setQuestions([...questions, newBlock]);
    setSavedStatus("unsaved");
  };

  const handleOpenFormulaModalForEdit = (q: DocItem) => {
    let content = q.content || "";
    let isBlock = false;
    if (content.startsWith("$$") && content.endsWith("$$")) {
      content = content.slice(2, -2).trim();
      isBlock = true;
    } else if (content.startsWith("$") && content.endsWith("$")) {
      content = content.slice(1, -1).trim();
    }
    setEditingQuestionId(null);
    setFormulaModalInitialFormula(content);
    setFormulaModalDisplayMode(isBlock ? "block" : "inline");
    setFormulaModalMode(
      /hóa|hoá|acid|->|rightarrow|rightleftharpoons|\\text\{/i.test(content)
        ? "chem"
        : "math"
    );
    setIsFormulaModalOpen(true);
  };

  const handleCleanEmptySpaces = () => {
    const cleaned = questions
      .filter((q) => {
        if (q.blockType && q.blockType !== "question") return true;
        const hasContent = q.content && q.content.trim().length > 0;
        const hasOpts =
          q.options &&
          Object.values(q.options).some(
            (v) => typeof v === "string" && v.trim().length > 0
          );
        return hasContent || hasOpts;
      })
      .map((q, idx) => ({
        ...q,
        order_index: idx + 1,
        content: (q.content || "").replace(/\n{3,}/g, "\n\n").trim(),
      }));

    const removed = questions.length - cleaned.length;
    setQuestions(cleaned);
    setShowActiveMenu(null);
    showToast(
      `Đã dọn dẹp các đoạn trống thừa! ${
        removed > 0 ? `Đã xoá ${removed} đoạn/khối trống.` : "Đề thi đã chuẩn định dạng."
      }`,
      "info"
    );
  };

  const handleSelectAll = () => {
    setShowActiveMenu(null);
    const allText = questions
      .map((q, idx) => `Câu ${idx + 1}: ${q.content}`)
      .join("\n\n");
    navigator.clipboard?.writeText(allText).catch(() => {});
    showToast("Đã chọn và sao chép toàn bộ nội dung đề thi vào Clipboard!", "success");
  };

  const handleFind = (query: string, direction: "next" | "prev") => {
    if (!query.trim()) {
      setSearchMatches([]);
      setCurrentMatchIdx(0);
      return;
    }
    const qLower = query.toLowerCase();
    const matchedIndices: number[] = [];

    questions.forEach((q, idx) => {
      const textToSearch = [
        q.content || "",
        ...(q.options ? Object.values(q.options) : []),
        q.explanation || "",
        q.sectionTitle || "",
        q.passageContent || "",
        ...(q.trueFalseItems ? q.trueFalseItems.map((tf) => tf.statement) : []),
      ]
        .join(" ")
        .toLowerCase();

      if (textToSearch.includes(qLower)) {
        matchedIndices.push(idx);
      }
    });

    setSearchMatches(matchedIndices);

    if (matchedIndices.length > 0) {
      let nextIdx = 0;
      if (direction === "next") {
        nextIdx = (currentMatchIdx + 1) % matchedIndices.length;
      } else {
        nextIdx = (currentMatchIdx - 1 + matchedIndices.length) % matchedIndices.length;
      }
      setCurrentMatchIdx(nextIdx);

      const targetQIdx = matchedIndices[nextIdx];
      const el = document.getElementById(`question-anchor-${targetQIdx}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } else {
      setCurrentMatchIdx(0);
    }
  };

  const handleReplace = (query: string, replacement: string) => {
    if (!query.trim() || searchMatches.length === 0) return;
    const targetQIdx = searchMatches[currentMatchIdx];
    const targetQ = questions[targetQIdx];
    if (!targetQ) return;

    const replaceInText = (str: string) => {
      const reg = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      return str.replace(reg, replacement);
    };

    const updatedQ: DocItem = {
      ...targetQ,
      content: replaceInText(targetQ.content || ""),
      explanation: targetQ.explanation ? replaceInText(targetQ.explanation) : targetQ.explanation,
      sectionTitle: targetQ.sectionTitle ? replaceInText(targetQ.sectionTitle) : targetQ.sectionTitle,
      passageContent: targetQ.passageContent ? replaceInText(targetQ.passageContent) : targetQ.passageContent,
      options: targetQ.options
        ? Object.fromEntries(
            Object.entries(targetQ.options).map(([k, v]) => [
              k,
              typeof v === "string" ? replaceInText(v) : v,
            ])
          )
        : targetQ.options,
    };

    const nextQuestions = [...questions];
    nextQuestions[targetQIdx] = updatedQ;
    setQuestions(nextQuestions);
    setSavedStatus("unsaved");
    handleFind(query, "next");
  };

  const handleReplaceAll = (query: string, replacement: string) => {
    if (!query.trim()) return;
    const replaceInText = (str: string) => {
      const reg = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      return str.replace(reg, replacement);
    };

    let count = 0;
    const nextQuestions = questions.map((q) => {
      const textCombined = [
        q.content || "",
        ...(q.options ? Object.values(q.options) : []),
        q.explanation || "",
      ].join(" ");
      if (textCombined.toLowerCase().includes(query.toLowerCase())) {
        count++;
      }
      return {
        ...q,
        content: replaceInText(q.content || ""),
        explanation: q.explanation ? replaceInText(q.explanation) : q.explanation,
        sectionTitle: q.sectionTitle ? replaceInText(q.sectionTitle) : q.sectionTitle,
        passageContent: q.passageContent ? replaceInText(q.passageContent) : q.passageContent,
        options: q.options
          ? Object.fromEntries(
              Object.entries(q.options).map(([k, v]) => [
                k,
                typeof v === "string" ? replaceInText(v) : v,
              ])
            )
          : q.options,
      };
    });

    setQuestions(nextQuestions);
    setSavedStatus("unsaved");
    setSearchMatches([]);
    showToast(`Đã thay thế nội dung trong ${count} vị trí/câu hỏi.`, "success");
  };

  const handleInsertTable = (rows: number, cols: number) => {
    const tableData: string[][] = Array.from({ length: rows }).map((_, r) =>
      Array.from({ length: cols }).map((_, c) => `Ô (${r + 1}, ${c + 1})`)
    );
    const newBlock: DocItem = {
      id: "tbl-" + Date.now(),
      exam_id: examId || "temp",
      order_index: questions.length + 1,
      type: "multiple_choice",
      content: "Bảng dữ liệu khảo sát và thực nghiệm:",
      options: {},
      blockType: "table",
      tableRows: tableData,
      created_at: new Date().toISOString(),
    };
    setQuestions([...questions, newBlock]);
    setShowActiveMenu(null);
    setActiveSubmenu(null);
  };

  const handleInsertSvg = (svgType: "sheet_box" | "heater" | "radiation") => {
    const contentMap = {
      sheet_box:
        "Người ta muốn cắt 4 góc của tấm nhôm hình chữ nhật kích thước $8\\text{ dm} \\times 5\\text{ dm}$ các hình vuông bằng nhau cạnh $a$ rồi gấp lại thành chiếc hộp không nắp. Hãy tìm $a$ để thể tích hộp lớn nhất.",
      heater:
        "Cho sơ đồ mạch điện của máy sưởi gia đình như hình vẽ bên dưới. Biết điện áp nguồn là $U = 220\\text{ V}$, điện trở mayso $R = 48.4\\ \\Omega$. Tính công suất tỏa nhiệt của máy sưởi.",
      radiation:
        "Biển báo nào dưới đây cảnh báo khu vực có nguy hiểm về phóng xạ theo tiêu chuẩn an toàn quốc tế?",
    };
    const newBlock: DocItem = {
      id: "svg-" + Date.now(),
      exam_id: examId || "temp",
      order_index: questions.length + 1,
      type: "multiple_choice",
      content: contentMap[svgType],
      options:
        svgType === "sheet_box"
          ? {
              A: "$a = 1\\text{ dm}$",
              B: "$a = 1.5\\text{ dm}$",
              C: "$a = 2\\text{ dm}$",
              D: "$a = 0.8\\text{ dm}$",
            }
          : {
              A: "1000 W",
              B: "500 W",
              C: "2000 W",
              D: "800 W",
            },
      correct_answer: "A",
      explanation: "Lời giải chi tiết theo định luật vật lý/toán học.",
      blockType: "svg",
      svgType,
      created_at: new Date().toISOString(),
    };
    setQuestions([...questions, newBlock]);
    setShowActiveMenu(null);
    setActiveSubmenu(null);
  };

  const handleInsertHeader = (headerType: "two_col" | "centered" | "student_info" | "grading_guide") => {
    const newBlock: DocItem = {
      id: "hdr-" + Date.now(),
      exam_id: examId || "temp",
      order_index: 0,
      type: "multiple_choice",
      content: headerType,
      options: {},
      blockType: "header_custom",
      headerType,
      created_at: new Date().toISOString(),
    };
    setQuestions([newBlock, ...questions]);
    setShowActiveMenu(null);
    setActiveSubmenu(null);
  };

  const handleInsertQuestionType = (
    qType: "section_title" | "essay" | "mcq_auto" | "mcq_2col" | "true_false" | "short_answer" | "passage"
  ) => {
    let newBlock: DocItem;
    if (qType === "section_title") {
      newBlock = {
        id: "sec-" + Date.now(),
        exam_id: examId || "temp",
        order_index: questions.length + 1,
        type: "multiple_choice",
        content: "",
        options: {},
        blockType: "section_title",
        sectionTitle: "PHẦN I. CÂU TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN",
        created_at: new Date().toISOString(),
      };
    } else if (qType === "true_false") {
      newBlock = {
        id: "tf-" + Date.now(),
        exam_id: examId || "temp",
        order_index: questions.length + 1,
        type: "true_false",
        content: "Cho hàm số $y = f(x) = x^3 - 3x^2 + 2$. Xét tính đúng/sai của các mệnh đề sau:",
        options: {},
        blockType: "true_false",
        trueFalseItems: [
          { label: "a", statement: "Hàm số đồng biến trên khoảng $(0; 2)$.", isCorrect: false },
          { label: "b", statement: "Điểm cực tiểu của đồ thị hàm số là $(2; -2)$.", isCorrect: true },
          { label: "c", statement: "Giá trị lớn nhất của hàm số trên đoạn $[-1; 1]$ bằng 2.", isCorrect: true },
          { label: "d", statement: "Đồ thị hàm số cắt trục hoành tại 3 điểm phân biệt.", isCorrect: true },
        ],
        correct_answer: "a - S, b - Đ, c - Đ, d - Đ",
        explanation: "Khảo sát và vẽ bảng biến thiên của hàm số bậc 3 để kết luận.",
        created_at: new Date().toISOString(),
      };
    } else if (qType === "short_answer") {
      newBlock = {
        id: "sa-" + Date.now(),
        exam_id: examId || "temp",
        order_index: questions.length + 1,
        type: "short_answer",
        content:
          "Một người gửi tiết kiệm ngân hàng số tiền 100 triệu đồng với lãi suất $6\\%/\\text{năm}$. Sau 3 năm, số tiền lãi người đó nhận được (làm tròn đến hàng nghìn) là bao nhiêu triệu đồng?",
        options: {},
        blockType: "short_answer",
        correct_answer: "19.102",
        explanation: "Áp dụng công thức lãi kép: $T = 100 \\times (1 + 0.06)^3 - 100 = 19.102$ triệu đồng.",
        created_at: new Date().toISOString(),
      };
    } else if (qType === "essay") {
      newBlock = {
        id: "ess-" + Date.now(),
        exam_id: examId || "temp",
        order_index: questions.length + 1,
        type: "essay",
        content: "Giải phương trình lượng giác sau: $\\sin 2x + 2\\cos x = 0$ trên đoạn $[0; 2\\pi]$.",
        options: {},
        blockType: "essay",
        correct_answer: "$x = \\frac{\\pi}{2}, \\frac{3\\pi}{2}$",
        explanation: "Biến đổi $\\sin 2x = 2\\sin x \\cos x$, đặt nhân tử chung đưa về phương trình tích.",
        created_at: new Date().toISOString(),
      };
    } else if (qType === "passage") {
      newBlock = {
        id: "pas-" + Date.now(),
        exam_id: examId || "temp",
        order_index: questions.length + 1,
        type: "multiple_choice",
        content: "Đọc đoạn trích sau và trả lời câu hỏi bên dưới:",
        passageContent:
          '"Mỗi chúng ta đều là một cánh én nhỏ. Một cánh én không làm nên mùa xuân, nhưng nếu hàng triệu cánh én cùng vỗ cánh bay về phương nam mang theo niềm tin và nghị lực, mùa xuân hy vọng sẽ tràn ngập khắp đất nước..."',
        options: {
          A: "Nghị lực và tinh thần đoàn kết",
          B: "Sự cô đơn lẻ loi",
          C: "Thời tiết mùa xuân",
          D: "Thiên nhiên tươi đẹp",
        },
        correct_answer: "A",
        blockType: "passage",
        created_at: new Date().toISOString(),
      };
    } else {
      newBlock = {
        id: "mcq-" + Date.now(),
        exam_id: examId || "temp",
        order_index: questions.length + 1,
        type: "multiple_choice",
        content: "Nội dung câu trắc nghiệm mới:",
        options: {
          A: "Phương án A",
          B: "Phương án B",
          C: "Phương án C",
          D: "Phương án D",
        },
        correct_answer: "A",
        created_at: new Date().toISOString(),
      };
    }
    setQuestions([...questions, newBlock]);
    setShowActiveMenu(null);
    setActiveSubmenu(null);
  };

  const handleInsertContent = (
    contentType:
      | "formula_block"
      | "table"
      | "rubric_table"
      | "image"
      | "variation_table"
      | "function_graph"
      | "chart"
      | "geometry"
      | "rubric_with_geometry"
  ) => {
    setShowActiveMenu(null);
    setActiveSubmenu(null);

    if (contentType === "formula_block") {
      setFormulaModalMode("math");
      setFormulaModalInitialFormula("");
      setFormulaModalDisplayMode("block");
      setIsFormulaModalOpen(true);
      return;
    }

    if (contentType === "table") {
      handleInsertTable(3, 4);
      return;
    }

    if (contentType === "image") {
      fileInputRef.current?.click();
      return;
    }

    if (contentType === "variation_table") {
      setEditingVarTableId(null);
      setCurrentVarTableData(null);
      setIsVarTableModalOpen(true);
      return;
    }

    if (contentType === "function_graph") {
      setEditingGraphId(null);
      setCurrentGraphData(null);
      setIsGraphModalOpen(true);
      return;
    }

    if (contentType === "chart") {
      setEditingChartId(null);
      setCurrentChartData(null);
      setIsChartModalOpen(true);
      return;
    }

    if (contentType === "geometry") {
      setEditingGeomId(null);
      setCurrentGeomData(null);
      setIsGeomModalOpen(true);
      return;
    }

    let newBlock: DocItem;
    if (contentType === "rubric_table") {
      newBlock = {
        id: "rubric-" + Date.now(),
        exam_id: examId || "temp",
        order_index: questions.length + 1,
        type: "essay",
        content: "Bảng barem hướng dẫn chấm chi tiết:",
        options: {},
        blockType: "rubric_table",
        tableRows: [
          ["Ý / Câu", "Nội dung đáp án & Phương pháp giải", "Điểm"],
          ["a)", "Viết đúng công thức / phương trình phản ứng", "0.25"],
          ["b)", "Thay số, tính toán và giải thích chi tiết", "0.50"],
          ["c)", "Kết luận và đối chiếu điều kiện", "0.25"],
        ],
        created_at: new Date().toISOString(),
      };
    } else {
      // rubric_with_geometry
      newBlock = {
        id: "rubric-geo-" + Date.now(),
        exam_id: examId || "temp",
        order_index: questions.length + 1,
        type: "essay",
        content: "Bài toán hình học và biểu điểm chi tiết:",
        options: {},
        blockType: "rubric_with_geometry",
        tableRows: [
          ["Ý", "Nội dung chứng minh", "Điểm"],
          ["1", "Vẽ hình đúng, chứng minh tam giác ABC đồng dạng với tam giác HBA", "0.50"],
          ["2", "Suy ra hệ thức liên hệ cạnh và đường cao AH", "0.50"],
        ],
        created_at: new Date().toISOString(),
      };
    }

    setQuestions([...questions, newBlock]);
  };

  const handleInsertLayout = (
    layoutType: "two_columns" | "dotted_lines" | "callout" | "answer_sheet" | "divider" | "page_break"
  ) => {
    let newBlock: DocItem;
    if (layoutType === "callout") {
      newBlock = {
        id: "call-" + Date.now(),
        exam_id: examId || "temp",
        order_index: questions.length + 1,
        type: "multiple_choice",
        content: "LƯU Ý: Thí sinh không được sử dụng máy tính có chức năng soạn thảo văn bản và thẻ nhớ trong phòng thi.",
        options: {},
        blockType: "callout",
        created_at: new Date().toISOString(),
      };
    } else if (layoutType === "dotted_lines") {
      newBlock = {
        id: "dot-" + Date.now(),
        exam_id: examId || "temp",
        order_index: questions.length + 1,
        type: "multiple_choice",
        content: "",
        options: {},
        blockType: "dotted_lines",
        created_at: new Date().toISOString(),
      };
    } else if (layoutType === "answer_sheet") {
      newBlock = {
        id: "bubble-" + Date.now(),
        exam_id: examId || "temp",
        order_index: questions.length + 1,
        type: "multiple_choice",
        content: "PHIẾU TRẢ LỜI TRẮC NGHIỆM",
        options: {},
        blockType: "bubble_sheet",
        created_at: new Date().toISOString(),
      };
    } else if (layoutType === "two_columns") {
      newBlock = {
        id: "two-col-" + Date.now(),
        exam_id: examId || "temp",
        order_index: questions.length + 1,
        type: "multiple_choice",
        content: "CỘT TRÁI: Dữ liệu câu hỏi hoặc hình vẽ\n\nCỘT PHẢI: Yêu cầu bài toán và hướng dẫn",
        options: {},
        blockType: "header_custom",
        headerType: "two_col",
        created_at: new Date().toISOString(),
      };
    } else {
      newBlock = {
        id: "lay-" + Date.now(),
        exam_id: examId || "temp",
        order_index: questions.length + 1,
        type: "multiple_choice",
        content: "",
        options: {},
        blockType: layoutType,
        created_at: new Date().toISOString(),
      };
    }
    setQuestions([...questions, newBlock]);
    setShowActiveMenu(null);
    setActiveSubmenu(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        const newBlock: DocItem = {
          id: "img-" + Date.now(),
          exam_id: examId || "temp",
          order_index: questions.length + 1,
          type: "multiple_choice",
          content: "Hình minh họa bài tập:",
          options: { A: "Phương án A", B: "Phương án B", C: "Phương án C", D: "Phương án D" },
          correct_answer: "A",
          blockType: "image",
          imageUrl: url,
          created_at: new Date().toISOString(),
        };
        setQuestions([...questions, newBlock]);
      };
      reader.readAsDataURL(file);
    }
    setShowActiveMenu(null);
  };

  const handleStartEdit = (q: DocItem) => {
    setEditingQuestionId(q.id);
    const opts = (typeof q.options === "object" && q.options !== null ? q.options : { A: "", B: "", C: "", D: "" }) as Record<string, string>;
    setEditForm({
      content: q.content,
      options: opts,
      correct_answer: q.correct_answer || (q.blockType === "short_answer" ? "" : "A"),
      explanation: q.explanation || "",
      trueFalseItems: q.trueFalseItems
        ? q.trueFalseItems.map((item) => ({ ...item }))
        : [
            { label: "a", statement: "", isCorrect: true },
            { label: "b", statement: "", isCorrect: false },
            { label: "c", statement: "", isCorrect: true },
            { label: "d", statement: "", isCorrect: false },
          ],
    });
  };

  const handleSaveEdit = () => {
    if (!editingQuestionId) return;
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === editingQuestionId
          ? {
              ...q,
              content: editForm.content,
              options: editForm.options,
              correct_answer: editForm.correct_answer,
              explanation: editForm.explanation,
              trueFalseItems: editForm.trueFalseItems,
            }
          : q
      )
    );
    setEditingQuestionId(null);
    setSavedStatus("saved");
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    setSavedStatus("saved");
  };

  const handleDuplicateQuestion = (q: DocItem) => {
    const dup: DocItem = {
      ...q,
      id: "dup-" + Date.now(),
      order_index: questions.length + 1,
    };
    setQuestions([...questions, dup]);
  };

  // Close dropdowns on outside click using refs
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (styleMenuRef.current && !styleMenuRef.current.contains(target)) {
        setIsStyleMenuOpen(false);
      }
      if (fontMenuRef.current && !fontMenuRef.current.contains(target)) {
        setIsFontMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleApplyTextStyle = (styleId: string) => {
    setCurrentTextStyle(styleId);
    setIsStyleMenuOpen(false);

    // 1. Nếu đang chọn 1 câu hỏi/khối, chuyển đổi kiểu cho khối đó
    if (editingQuestionId) {
      setQuestions((prev) =>
        prev.map((q) => {
          if (q.id === editingQuestionId) {
            if (styleId === "heading_1") {
              return {
                ...q,
                blockType: "section_title",
                sectionTitle: q.content || q.sectionTitle || "PHẦN I. CÂU TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN",
              };
            }
            if (styleId === "heading_2") {
              return {
                ...q,
                blockType: "heading_2",
                content: q.content || "Chủ đề / Nhóm câu hỏi",
              };
            }
            if (styleId === "heading_3") {
              return {
                ...q,
                blockType: "heading_3",
                content: q.content || "Tiểu mục ghi chú",
              };
            }
            if (styleId === "passage") {
              return {
                ...q,
                blockType: "passage",
                passageContent: q.passageContent || q.content || '"Đoạn văn trích dẫn đọc hiểu..."',
              };
            }
            if (styleId === "callout") {
              return {
                ...q,
                blockType: "callout",
                content: q.content || "LƯU Ý: Thí sinh kiểm tra kỹ đề thi trước khi làm bài.",
              };
            }
            // default: normal
            return {
              ...q,
              blockType: q.trueFalseItems && q.trueFalseItems.length > 0 ? "true_false" : "question",
            };
          }
          return q;
        })
      );
      setSavedStatus("unsaved");
      return;
    }

    // 2. Nếu không có khối nào đang chọn, chèn mới 1 khối tương ứng vào cuối đề
    const now = Date.now();
    let newBlock: DocItem;
    if (styleId === "heading_1") {
      newBlock = {
        id: "sec-" + now,
        exam_id: examId || "temp",
        order_index: questions.length + 1,
        type: "multiple_choice",
        content: "",
        options: {},
        blockType: "section_title",
        sectionTitle: "PHẦN MỚI. CÂU HỎI TRẮC NGHIỆM",
        created_at: new Date().toISOString(),
      };
    } else if (styleId === "heading_2") {
      newBlock = {
        id: "h2-" + now,
        exam_id: examId || "temp",
        order_index: questions.length + 1,
        type: "multiple_choice",
        content: "Chủ đề / Đề mục nhóm câu hỏi số " + (questions.filter((q) => q.blockType === "heading_2").length + 1),
        options: {},
        blockType: "heading_2",
        created_at: new Date().toISOString(),
      };
    } else if (styleId === "heading_3") {
      newBlock = {
        id: "h3-" + now,
        exam_id: examId || "temp",
        order_index: questions.length + 1,
        type: "multiple_choice",
        content: "Tiểu mục ghi chú",
        options: {},
        blockType: "heading_3",
        created_at: new Date().toISOString(),
      };
    } else if (styleId === "passage") {
      newBlock = {
        id: "pas-" + now,
        exam_id: examId || "temp",
        order_index: questions.length + 1,
        type: "multiple_choice",
        content: "Đọc đoạn trích sau và trả lời câu hỏi bên dưới:",
        passageContent: '"Nội dung đoạn trích hoặc ngữ cảnh bài đọc hiểu..."',
        options: { A: "Phương án A", B: "Phương án B", C: "Phương án C", D: "Phương án D" },
        correct_answer: "A",
        blockType: "passage",
        created_at: new Date().toISOString(),
      };
    } else if (styleId === "callout") {
      newBlock = {
        id: "call-" + now,
        exam_id: examId || "temp",
        order_index: questions.length + 1,
        type: "multiple_choice",
        content: "LƯU Ý: Thí sinh làm bài trực tiếp vào phiếu trả lời trắc nghiệm theo quy định.",
        options: {},
        blockType: "callout",
        created_at: new Date().toISOString(),
      };
    } else {
      newBlock = {
        id: "mcq-" + now,
        exam_id: examId || "temp",
        order_index: questions.length + 1,
        type: "multiple_choice",
        content: "Nội dung câu hỏi mới...",
        options: { A: "Phương án A", B: "Phương án B", C: "Phương án C", D: "Phương án D" },
        correct_answer: "A",
        blockType: "question",
        created_at: new Date().toISOString(),
      };
    }

    setQuestions((prev) => [...prev, newBlock]);
    setSavedStatus("unsaved");
    setEditingQuestionId(newBlock.id);
  };

  // Keyboard shortcuts: Ctrl+Alt+0, 1, 2, 3, P, N
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey) {
        if (e.key === "0") {
          e.preventDefault();
          handleApplyTextStyle("normal");
        } else if (e.key === "1") {
          e.preventDefault();
          handleApplyTextStyle("heading_1");
        } else if (e.key === "2") {
          e.preventDefault();
          handleApplyTextStyle("heading_2");
        } else if (e.key === "3") {
          e.preventDefault();
          handleApplyTextStyle("heading_3");
        } else if (e.key.toLowerCase() === "p") {
          e.preventDefault();
          handleApplyTextStyle("passage");
        } else if (e.key.toLowerCase() === "n") {
          e.preventDefault();
          handleApplyTextStyle("callout");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingQuestionId, questions]);

  const handleShuffleQuestions = () => {
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
  };

  // Export to docx
  const handleExportDocx = async () => {
    const examData: ExamWithQuestions = {
      id: examId || "temp",
      user_id: user?.id || "temp",
      name: title,
      subject,
      grade,
      chapter: "",
      config: {},
      status: "completed",
      credit_cost: 0,
      question_count: questions.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      questions: questions as any,
    };
    const isPro = isProUser(profile) || isProUser(user);
    const { exportExamToDocx } = await import("@/lib/export/docx-exporter");
    await exportExamToDocx(examData, teacherMode, isPro, fontFamily);
  };

  // Export Dual Teaching docx (Student with note lines + Teacher with solutions)
  const handleExportDualDocx = async () => {
    const examData: ExamWithQuestions = {
      id: examId || "temp",
      user_id: user?.id || "temp",
      name: title,
      subject,
      grade,
      chapter: "",
      config: {},
      status: "completed",
      credit_cost: 0,
      question_count: questions.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      questions: questions as any,
    };
    const isPro = isProUser(profile) || isProUser(user);
    const { exportDualTeachingDocx } = await import("@/lib/export/docx-exporter");
    await exportDualTeachingDocx(examData, isPro, fontFamily);
  };

  // Print
  const handlePrint = () => {
    window.print();
  };

  // Share
  const handleShare = async () => {
    let currentId = examId;
    if (!currentId || currentId.startsWith("temp") || currentId.startsWith("seed-")) {
      setSavedStatus("saving");
      try {
        if (user?.id) {
          const created = await createExam({
            user_id: user.id,
            name: title,
            title,
            subject,
            grade,
            chapter: "",
            question_count: questions.length,
            status: "draft",
            credit_cost: 0,
            config: { questions, duration } as any,
          });
          if (created?.id) {
            currentId = created.id;
            setExamId(created.id);
            if (typeof window !== "undefined") {
              window.history.replaceState(null, "", `/exams/create?initialExamId=${created.id}`);
            }
          }
        }
      } catch (e) {
        console.warn("Share auto-save warning:", e);
      }
    }

    const origin = typeof window !== "undefined" ? window.location.origin : APP_URL;
    const shareExamUrl = currentId
      ? `${origin}/exams/${currentId}?ref=${userReferralCode}`
      : `${origin}/exams/create?ref=${userReferralCode}`;
    navigator.clipboard.writeText(shareExamUrl);
    setShareToast(true);
    setTimeout(() => setShareToast(false), 3500);
    setShowShareExamModal(true);
  };

  const scrollToQuestion = (idx: number) => {
    const el = document.getElementById(`question-anchor-${idx}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-primary", "transition-all");
      setTimeout(() => el.classList.remove("ring-2", "ring-primary"), 1500);
    }
  };

  const userInitial = profile?.name ? profile.name[0].toUpperCase() : user?.email ? user.email[0].toUpperCase() : "T";
  const userDisplayName = profile?.name || user?.email?.split("@")[0] || "Trường Hoà...";
  const userCredits = wallet?.balance !== undefined ? wallet.balance : 0;

  // Helper to render question type switcher dropdown badge
  const renderQuestionTypeBadge = (q: DocItem) => {
    const currentType = q.blockType || "multiple_choice";
    const typeLabel =
      currentType === "true_false"
        ? "Đúng / Sai"
        : currentType === "short_answer"
        ? "Trả lời ngắn"
        : currentType === "essay"
        ? "Tự luận"
        : "Trắc nghiệm";

    const typeColor =
      currentType === "true_false"
        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
        : currentType === "short_answer"
        ? "text-amber-700 bg-amber-50 border-amber-200"
        : currentType === "essay"
        ? "text-purple-700 bg-purple-50 border-purple-200"
        : "text-blue-700 bg-blue-50 border-blue-200";

    return (
      <div className="relative inline-block print:hidden ml-1.5 align-middle">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSwitchingTypeId(switchingTypeId === q.id ? null : q.id);
          }}
          className={clsx(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border transition hover:opacity-90 shadow-2xs cursor-pointer",
            typeColor
          )}
          title="Bấm để đổi loại câu hỏi này"
        >
          <span>{typeLabel}</span>
          <ChevronDown className="h-3 w-3 opacity-70" />
        </button>

        {switchingTypeId === q.id && (
          <div
            onMouseLeave={() => setSwitchingTypeId(null)}
            className="absolute left-0 top-full mt-1 z-50 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-xl text-xs space-y-0.5 text-left font-normal"
          >
            <p className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Đổi loại câu hỏi:
            </p>
            <button
              onClick={() => {
                handleSwitchQuestionType(q.id, "multiple_choice");
                setSwitchingTypeId(null);
              }}
              className={clsx(
                "flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-50",
                currentType === "multiple_choice" || currentType === "question"
                  ? "font-bold text-blue-700 bg-blue-50/50"
                  : "text-slate-700"
              )}
            >
              <span className="font-bold text-blue-600 text-[10px] w-6">MCQ</span>
              <span>Trắc nghiệm 4 lựa chọn</span>
            </button>
            <button
              onClick={() => {
                handleSwitchQuestionType(q.id, "true_false");
                setSwitchingTypeId(null);
              }}
              className={clsx(
                "flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-50",
                currentType === "true_false"
                  ? "font-bold text-emerald-700 bg-emerald-50/50"
                  : "text-slate-700"
              )}
            >
              <span className="font-bold text-emerald-600 text-[10px] w-6">Đ/S</span>
              <span>Trắc nghiệm Đúng / Sai</span>
            </button>
            <button
              onClick={() => {
                handleSwitchQuestionType(q.id, "short_answer");
                setSwitchingTypeId(null);
              }}
              className={clsx(
                "flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-50",
                currentType === "short_answer"
                  ? "font-bold text-amber-700 bg-amber-50/50"
                  : "text-slate-700"
              )}
            >
              <span className="font-bold text-amber-600 text-[10px] w-6">TN</span>
              <span>Trả lời ngắn (Điền số)</span>
            </button>
            <button
              onClick={() => {
                handleSwitchQuestionType(q.id, "essay");
                setSwitchingTypeId(null);
              }}
              className={clsx(
                "flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-50",
                currentType === "essay"
                  ? "font-bold text-purple-700 bg-purple-50/50"
                  : "text-slate-700"
              )}
            >
              <span className="font-bold text-purple-600 text-[10px] w-6">TL</span>
              <span>Tự luận</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  // Helper to render inline edit form for any question type
  const renderInlineEditForm = (q: DocItem, idx: number) => {
    if (editingQuestionId !== q.id) return null;
    return (
      <div className="mt-3 rounded-lg border border-primary/40 bg-white p-4 shadow-md text-xs print:hidden">
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
          <p className="font-semibold text-slate-800">
            Chỉnh sửa Câu {idx + 1} (
            {q.blockType === "true_false"
              ? "Trắc nghiệm Đúng / Sai"
              : q.blockType === "short_answer"
              ? "Trả lời ngắn"
              : q.blockType === "essay"
              ? "Tự luận"
              : "Trắc nghiệm 4 lựa chọn"}
            ):
          </p>
          <button
            onClick={() => setEditingQuestionId(null)}
            className="text-slate-400 hover:text-slate-600 rounded p-1"
            title="Đóng chỉnh sửa"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Stem / Content */}
        <div className="mb-3">
          <label className="font-medium text-slate-700 mb-1 block">Nội dung câu hỏi / Đề bài:</label>
          <textarea
            value={editForm.content}
            onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
            className="w-full rounded border border-slate-200 p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary font-normal"
            rows={3}
          />
        </div>

        {/* Type-specific inputs */}
        {q.blockType === "true_false" ? (
          <div className="mb-3 space-y-2">
            <label className="font-medium text-slate-700 block">Các mệnh đề (a, b, c, d) và tính Đúng/Sai:</label>
            {(editForm.trueFalseItems || []).map((tf, tfIdx) => (
              <div key={tfIdx} className="flex items-center gap-2">
                <span className="font-bold text-slate-700 w-5">{tf.label})</span>
                <input
                  type="text"
                  value={tf.statement}
                  onChange={(e) => {
                    const updated = [...(editForm.trueFalseItems || [])];
                    updated[tfIdx] = { ...updated[tfIdx], statement: e.target.value };
                    setEditForm({ ...editForm, trueFalseItems: updated });
                  }}
                  placeholder={`Nội dung mệnh đề ${tf.label}...`}
                  className="flex-1 rounded border border-slate-200 px-2 py-1.5 text-xs"
                />
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...(editForm.trueFalseItems || [])];
                      updated[tfIdx] = { ...updated[tfIdx], isCorrect: true };
                      setEditForm({ ...editForm, trueFalseItems: updated });
                    }}
                    className={clsx(
                      "px-2.5 py-1 rounded text-[11px] font-bold transition",
                      tf.isCorrect
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    Đúng
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...(editForm.trueFalseItems || [])];
                      updated[tfIdx] = { ...updated[tfIdx], isCorrect: false };
                      setEditForm({ ...editForm, trueFalseItems: updated });
                    }}
                    className={clsx(
                      "px-2.5 py-1 rounded text-[11px] font-bold transition",
                      !tf.isCorrect
                        ? "bg-red-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    Sai
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : q.blockType === "short_answer" ? (
          <div className="mb-3">
            <label className="font-medium text-slate-700 mb-1 block">Đáp số / Kết quả ngắn:</label>
            <input
              type="text"
              value={editForm.correct_answer}
              onChange={(e) => setEditForm({ ...editForm, correct_answer: e.target.value })}
              placeholder="Ví dụ: 42 hoặc 3,14 hoặc H2SO4..."
              className="w-full sm:w-1/2 rounded border border-slate-200 px-2.5 py-1.5 text-xs font-mono"
            />
          </div>
        ) : q.blockType === "essay" ? (
          <div className="mb-3">
            <label className="font-medium text-slate-700 mb-1 block">Barem điểm / Thang điểm:</label>
            <textarea
              value={editForm.correct_answer}
              onChange={(e) => setEditForm({ ...editForm, correct_answer: e.target.value })}
              placeholder="Ví dụ: Ý 1 (0.5đ), Ý 2 (1.0đ)..."
              className="w-full rounded border border-slate-200 p-2 text-xs font-mono"
              rows={2}
            />
          </div>
        ) : (
          /* Standard MCQ */
          <>
            <div className="mb-3 grid grid-cols-2 gap-2">
              {["A", "B", "C", "D"].map((k) => (
                <div key={k} className="flex items-center gap-1.5">
                  <span className="text-xs font-bold w-4">{k}:</span>
                  <input
                    type="text"
                    value={editForm.options[k] || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        options: { ...editForm.options, [k]: e.target.value },
                      })
                    }
                    className="w-full rounded border border-slate-200 px-2 py-1 text-xs"
                  />
                </div>
              ))}
            </div>

            <div className="mb-3 flex items-center gap-3">
              <label className="font-medium text-slate-700">Đáp án đúng:</label>
              <select
                value={editForm.correct_answer}
                onChange={(e) => setEditForm({ ...editForm, correct_answer: e.target.value })}
                className="rounded border border-slate-200 px-2 py-1 text-xs bg-white font-bold text-emerald-700"
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>
          </>
        )}

        {/* Explanation */}
        <div className="mb-3">
          <label className="font-medium text-slate-700 mb-1 block">
            Hướng dẫn giải / Lời giải chi tiết:
          </label>
          <textarea
            value={editForm.explanation}
            onChange={(e) => setEditForm({ ...editForm, explanation: e.target.value })}
            className="w-full rounded border border-slate-200 p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            rows={2}
            placeholder="Giải thích chi tiết các bước để giáo viên và học sinh đối chiếu..."
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={() => setEditingQuestionId(null)}
            className="rounded px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100"
          >
            Hủy
          </button>
          <button
            onClick={handleSaveEdit}
            className="rounded bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground shadow-xs hover:bg-primary/90"
          >
            Lưu thay đổi
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-white text-slate-800 font-sans">
      {/* ============================================================== */}
      {/* 1. TOP HEADER (GOOGLE DOCS STYLE)                              */}
      {/* ============================================================== */}
      <header className="flex h-16 w-full shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3 sm:px-4 gap-2">
        {/* Left: Document Icon & Title & File Menus */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <Link
            href="/exams"
            title="Quay lại danh sách đề thi"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm hover:bg-slate-800"
          >
            <FileText className="h-5 w-5" />
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setSavedStatus("unsaved");
                }}
                onBlur={() => {
                  saveCurrentExam();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur();
                  }
                }}
                className="max-w-[150px] sm:max-w-[200px] md:max-w-[260px] lg:max-w-[320px] truncate rounded px-1.5 py-0.5 text-sm sm:text-base font-semibold text-slate-800 hover:bg-slate-100 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="shrink-0 flex items-center gap-1.5 text-xs text-slate-500 font-medium whitespace-nowrap">
                {savedStatus === "saved" && (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Đã lưu vào tài khoản</span>
                  </>
                )}
                {savedStatus === "saving" && (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                    <span>Đang lưu...</span>
                  </>
                )}
                {savedStatus === "unsaved" && (
                  <span className="text-amber-600 font-medium">Chưa lưu</span>
                )}
              </span>
            </div>

            {/* Menu options: Tệp, Chỉnh sửa, Xem, Chèn, Định dạng, Công cụ */}
            <div className="flex items-center gap-0.5 sm:gap-1 text-xs text-slate-600 pt-0.5 whitespace-nowrap overflow-x-auto scrollbar-none">
              {/* 1. Tệp */}
              <div className="relative">
                <button
                  onClick={() => setShowActiveMenu(showActiveMenu === "file" ? null : "file")}
                  className={`rounded px-2 py-0.5 text-xs font-medium transition cursor-pointer leading-normal ${showActiveMenu === "file" ? "bg-slate-200 text-slate-900 font-semibold" : "text-slate-700 hover:bg-slate-100"}`}
                >
                  Tệp
                </button>
                {showActiveMenu === "file" && (
                  <div className="absolute left-0 top-full z-50 mt-1 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                    <button
                      onClick={() => {
                        setTitle("Đề thi mới");
                        setQuestions([]);
                        setShowActiveMenu(null);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                    >
                      <Plus className="h-3.5 w-3.5" /> Tạo đề mới
                    </button>
                    <button
                      onClick={() => {
                        handleExportDocx();
                        setShowActiveMenu(null);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                    >
                      <Download className="h-3.5 w-3.5" /> Tải về file Word (.docx)
                    </button>
                    <button
                      onClick={() => {
                        setShowShuffleModal(true);
                        setShowActiveMenu(null);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50 text-blue-600 font-semibold"
                    >
                      <Shuffle className="h-3.5 w-3.5 text-blue-600" /> Trộn bộ 4 mã đề & Ma trận (.docx)
                    </button>
                    <button
                      onClick={() => {
                        handleExportDualDocx();
                        setShowActiveMenu(null);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50 text-amber-700 font-bold"
                      title="Tải về cùng lúc: 1 Bản Học Sinh (có dòng chấm chép bài) & 1 Bản Giáo Viên (kèm lời giải chi tiết)"
                    >
                      <Crown className="h-3.5 w-3.5 text-amber-600" /> Xuất Bộ Đề Kép Giảng Dạy (HS + GV) (.docx)
                    </button>
                    <button
                      onClick={() => {
                        handlePrint();
                        setShowActiveMenu(null);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                    >
                      <Printer className="h-3.5 w-3.5" /> In đề thi (PDF)
                    </button>
                  </div>
                )}
              </div>

              {/* 2. Chỉnh sửa */}
              <div className="relative">
                <button
                  onClick={() => setShowActiveMenu(showActiveMenu === "edit" ? null : "edit")}
                  className={`rounded px-2 py-0.5 text-xs font-medium transition cursor-pointer leading-normal ${showActiveMenu === "edit" ? "bg-slate-200 text-slate-900 font-semibold" : "text-slate-700 hover:bg-slate-100"}`}
                >
                  Chỉnh sửa
                </button>
                {showActiveMenu === "edit" && (
                  <div
                    onMouseLeave={() => setActiveSubmenu(null)}
                    className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-xl text-slate-700 text-xs select-none"
                  >
                    <button
                      onClick={() => {
                        handleUndo();
                        setShowActiveMenu(null);
                      }}
                      disabled={historyIndex <= 0}
                      className={clsx(
                        "flex w-full items-center justify-between px-3 py-1.5 text-left transition hover:bg-slate-50",
                        historyIndex <= 0 && "opacity-40 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Undo2 className="h-3.5 w-3.5" />
                        <span>Hoàn tác</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">Ctrl+Z</span>
                    </button>

                    <button
                      onClick={() => {
                        handleRedo();
                        setShowActiveMenu(null);
                      }}
                      disabled={historyIndex >= history.length - 1}
                      className={clsx(
                        "flex w-full items-center justify-between px-3 py-1.5 text-left transition hover:bg-slate-50",
                        historyIndex >= history.length - 1 && "opacity-40 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Redo2 className="h-3.5 w-3.5" />
                        <span>Làm lại</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">Ctrl+Y</span>
                    </button>

                    <div className="my-1 border-t border-slate-100" />

                    <button
                      onClick={() => {
                        handleSelectAll();
                        setShowActiveMenu(null);
                      }}
                      className="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-slate-500" />
                        <span>Chọn tất cả</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">Ctrl+A</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsFindReplaceOpen(true);
                        setFindReplaceMode("find");
                        setShowActiveMenu(null);
                      }}
                      className="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-2">
                        <Search className="h-3.5 w-3.5 text-slate-500" />
                        <span>Tìm</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">Ctrl+F</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsFindReplaceOpen(true);
                        setFindReplaceMode("replace");
                        setShowActiveMenu(null);
                      }}
                      className="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-2">
                        <Replace className="h-3.5 w-3.5 text-slate-500" />
                        <span>Tìm và thay thế</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">Ctrl+H</span>
                    </button>

                    <div className="my-1 border-t border-slate-100" />

                    <button
                      onClick={() => {
                        handleCleanEmptySpaces();
                        setShowActiveMenu(null);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-slate-500" />
                      <span>Xoá đoạn trống thừa</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 3. Xem */}
              <div className="relative">
                <button
                  onClick={() => setShowActiveMenu(showActiveMenu === "view" ? null : "view")}
                  className={`rounded px-2 py-0.5 text-xs font-medium transition cursor-pointer leading-normal ${showActiveMenu === "view" ? "bg-slate-200 text-slate-900 font-semibold" : "text-slate-700 hover:bg-slate-100"}`}
                >
                  Xem
                </button>
                {showActiveMenu === "view" && (
                  <div
                    onMouseLeave={handleSubmenuLeave}
                    className="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border border-slate-200 bg-white py-1 shadow-xl text-slate-700 text-xs select-none"
                  >
                    {/* Thu phóng Submenu */}
                    <div
                      className="relative"
                      onMouseEnter={() => handleSubmenuHover("zoom")}
                      onMouseLeave={handleSubmenuLeave}
                    >
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSubmenu("zoom");
                        }}
                        className={`flex w-full items-center justify-between px-3 py-1.5 cursor-pointer ${activeSubmenu === "zoom" ? "bg-slate-100 font-medium" : "hover:bg-slate-50"}`}
                      >
                        <div className="flex items-center gap-2">
                          <Maximize2 className="h-3.5 w-3.5 text-slate-500" />
                          <span>Thu phóng</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      </div>

                      {activeSubmenu === "zoom" && (
                        <div
                          onMouseEnter={cancelSubmenuLeave}
                          onMouseLeave={handleSubmenuLeave}
                          className="absolute left-[calc(100%-2px)] top-0 z-50 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-xl before:absolute before:-left-3 before:top-0 before:bottom-0 before:w-4 before:content-['']"
                        >
                          <button
                            onClick={() => {
                              const availableW = window.innerWidth - (leftSidebarOpen ? leftWidth : 40) - (aiSidebarOpen ? rightWidth : 40) - 100;
                              const fitZoom = Math.min(130, Math.max(65, Math.round((availableW / 820) * 100)));
                              setZoom(fitZoom);
                              setShowActiveMenu(null);
                              setActiveSubmenu(null);
                            }}
                            className="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-slate-50 font-medium text-slate-800"
                          >
                            <span>Vừa màn hình</span>
                          </button>
                          <div className="my-1 border-t border-slate-100" />
                          {[50, 75, 90, 100, 125, 150, 200].map((z) => (
                            <button
                              key={z}
                              onClick={() => {
                                setZoom(z);
                                setShowActiveMenu(null);
                                setActiveSubmenu(null);
                              }}
                              className="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-slate-50 text-slate-700"
                            >
                              <span>{z}%</span>
                              {zoom === z && <Check className="h-3.5 w-3.5 text-blue-600" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="my-1 border-t border-slate-100" />

                    <button
                      onClick={() => {
                        toggleLeftSidebar();
                        setShowActiveMenu(null);
                      }}
                      className="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-2">
                        <List className="h-3.5 w-3.5 text-slate-500" />
                        <span>Hiện dàn ý và mẫu chèn</span>
                      </div>
                      {leftSidebarOpen && <Check className="h-3.5 w-3.5 text-blue-600" />}
                    </button>

                    <button
                      onClick={() => {
                        setAiSidebarOpen(!aiSidebarOpen);
                        setShowActiveMenu(null);
                      }}
                      className="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                        <span>Trợ lý AI</span>
                      </div>
                      {aiSidebarOpen && <Check className="h-3.5 w-3.5 text-blue-600" />}
                    </button>
                  </div>
                )}
              </div>

              {/* 4. Chèn */}
              <div className="relative">
                <button
                  onClick={() => setShowActiveMenu(showActiveMenu === "insert" ? null : "insert")}
                  className={`rounded px-2 py-0.5 text-xs font-medium transition cursor-pointer leading-normal ${showActiveMenu === "insert" ? "bg-slate-200 text-slate-900 font-semibold" : "text-slate-700 hover:bg-slate-100"}`}
                >
                  Chèn
                </button>
                {showActiveMenu === "insert" && (
                  <div
                    onMouseLeave={handleSubmenuLeave}
                    className="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border border-slate-200 bg-white py-1 shadow-xl text-slate-700 text-xs select-none"
                  >
                    {/* 1. Công thức toán */}
                    <button
                      onMouseEnter={handleSubmenuLeave}
                      onClick={() => handleInsertFormula("math")}
                      className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left hover:bg-slate-50"
                    >
                      <span className="font-serif font-bold text-slate-700">∑</span>
                      <span>Công thức toán</span>
                    </button>

                    {/* 2. Công thức hoá học */}
                    <button
                      onMouseEnter={handleSubmenuLeave}
                      onClick={() => handleInsertFormula("chem")}
                      className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left hover:bg-slate-50"
                    >
                      <span className="font-serif font-bold text-slate-700">∑</span>
                      <span>Công thức hoá học</span>
                    </button>

                    <div className="my-1 border-t border-slate-100" />

                    {/* 3. Bảng > (Submenu with 8x8 Grid) */}
                    <div
                      className="relative"
                      onMouseEnter={() => handleSubmenuHover("table")}
                      onMouseLeave={handleSubmenuLeave}
                    >
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSubmenu("table");
                        }}
                        className={`flex w-full items-center justify-between px-3 py-1.5 cursor-pointer ${activeSubmenu === "table" ? "bg-slate-100 font-medium" : "hover:bg-slate-50"}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <TableIcon className="h-3.5 w-3.5 text-slate-600" />
                          <span>Bảng</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      </div>

                      {activeSubmenu === "table" && (
                        <div
                          onMouseEnter={cancelSubmenuLeave}
                          onMouseLeave={handleSubmenuLeave}
                          className="absolute left-[calc(100%-2px)] top-0 z-50 rounded-lg border border-slate-200 bg-white p-3 shadow-xl before:absolute before:-left-3 before:top-0 before:bottom-0 before:w-4 before:content-['']"
                        >
                          <div className="grid grid-cols-8 gap-1">
                            {Array.from({ length: 8 }).map((_, rIdx) =>
                              Array.from({ length: 8 }).map((_, cIdx) => {
                                const r = rIdx + 1;
                                const c = cIdx + 1;
                                const isHighlighted =
                                  hoveredGridCell !== null &&
                                  r <= hoveredGridCell.row &&
                                  c <= hoveredGridCell.col;
                                return (
                                  <div
                                    key={`${r}-${c}`}
                                    onMouseEnter={() => setHoveredGridCell({ row: r, col: c })}
                                    onClick={() => handleInsertTable(r, c)}
                                    className={`h-4 w-4 cursor-pointer rounded-[2px] border transition-colors ${
                                      isHighlighted
                                        ? "border-blue-500 bg-blue-100"
                                        : "border-slate-300 bg-white hover:border-blue-400"
                                    }`}
                                  />
                                );
                              })
                            )}
                          </div>
                          <div className="mt-2 text-center text-xs font-medium text-slate-600">
                            {hoveredGridCell ? `${hoveredGridCell.row} × ${hoveredGridCell.col}` : "1 × 1"}
                          </div>
                          <div className="mt-1 border-t border-slate-100 pt-1">
                            <button
                              onClick={async () => {
                                const rows = await promptModal({
                                  title: "Chèn bảng - Số hàng",
                                  message: "Nhập số hàng cho bảng:",
                                  defaultValue: "3",
                                  inputType: "number",
                                });
                                if (!rows) return;
                                const cols = await promptModal({
                                  title: "Chèn bảng - Số cột",
                                  message: "Nhập số cột cho bảng:",
                                  defaultValue: "4",
                                  inputType: "number",
                                });
                                if (cols) {
                                  handleInsertTable(parseInt(rows) || 3, parseInt(cols) || 4);
                                }
                              }}
                              className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                            >
                              <SlidersHorizontal className="h-3 w-3 text-slate-500" />
                              <span>Tùy chọn khác</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 4. Hình */}
                    <button
                      onMouseEnter={handleSubmenuLeave}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left hover:bg-slate-50"
                    >
                      <ImageIcon className="h-3.5 w-3.5 text-slate-600" />
                      <span>Hình</span>
                    </button>

                    <div className="my-1 border-t border-slate-100" />

                    {/* 5. Hình minh hoạ SVG > */}
                    <div
                      className="relative"
                      onMouseEnter={() => handleSubmenuHover("svg")}
                      onMouseLeave={handleSubmenuLeave}
                    >
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSubmenu("svg");
                        }}
                        className={`flex w-full items-center justify-between px-3 py-1.5 cursor-pointer ${activeSubmenu === "svg" ? "bg-slate-100 font-medium" : "hover:bg-slate-50"}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <LayoutGrid className="h-3.5 w-3.5 text-slate-600" />
                          <span>Hình minh hoạ SVG</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      </div>

                      {activeSubmenu === "svg" && (
                        <div
                          onMouseEnter={cancelSubmenuLeave}
                          onMouseLeave={handleSubmenuLeave}
                          className="absolute left-[calc(100%-2px)] top-0 z-50 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-xl before:absolute before:-left-3 before:top-0 before:bottom-0 before:w-4 before:content-['']"
                        >
                          <button
                            onClick={() => handleInsertSvg("sheet_box")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <FileText className="h-3.5 w-3.5 text-slate-500" />
                            <span>Tấm nhôm và hộp không nắp</span>
                          </button>
                          <button
                            onClick={() => handleInsertSvg("heater")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <FileText className="h-3.5 w-3.5 text-slate-500" />
                            <span>Sơ đồ máy sưởi</span>
                          </button>
                          <button
                            onClick={() => handleInsertSvg("radiation")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <FileText className="h-3.5 w-3.5 text-slate-500" />
                            <span>Biển cảnh báo phóng xạ</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 6. Đầu đề > */}
                    <div
                      className="relative"
                      onMouseEnter={() => handleSubmenuHover("header")}
                      onMouseLeave={handleSubmenuLeave}
                    >
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSubmenu("header");
                        }}
                        className={`flex w-full items-center justify-between px-3 py-1.5 cursor-pointer ${activeSubmenu === "header" ? "bg-slate-100 font-medium" : "hover:bg-slate-50"}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Columns2 className="h-3.5 w-3.5 text-slate-600" />
                          <span>Đầu đề</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      </div>

                      {activeSubmenu === "header" && (
                        <div
                          onMouseEnter={cancelSubmenuLeave}
                          onMouseLeave={handleSubmenuLeave}
                          className="absolute left-[calc(100%-2px)] top-0 z-50 w-52 rounded-lg border border-slate-200 bg-white py-1 shadow-xl before:absolute before:-left-3 before:top-0 before:bottom-0 before:w-4 before:content-['']"
                        >
                          <button
                            onClick={() => handleInsertHeader("two_col")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <Columns2 className="h-3.5 w-3.5 text-slate-500" />
                            <span>Đầu đề hai cột</span>
                          </button>
                          <button
                            onClick={() => handleInsertHeader("centered")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <Heading1 className="h-3.5 w-3.5 text-slate-500" />
                            <span>Tên đề căn giữa</span>
                          </button>
                          <button
                            onClick={() => handleInsertHeader("student_info")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <FileSignature className="h-3.5 w-3.5 text-slate-500" />
                            <span>Thông tin thí sinh</span>
                          </button>
                          <button
                            onClick={() => handleInsertHeader("grading_guide")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <FileCheck2 className="h-3.5 w-3.5 text-slate-500" />
                            <span>Đầu hướng dẫn chấm</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 7. Câu hỏi > */}
                    <div
                      className="relative"
                      onMouseEnter={() => handleSubmenuHover("question")}
                      onMouseLeave={handleSubmenuLeave}
                    >
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSubmenu("question");
                        }}
                        className={`flex w-full items-center justify-between px-3 py-1.5 cursor-pointer ${activeSubmenu === "question" ? "bg-slate-100 font-medium" : "hover:bg-slate-50"}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <FileText className="h-3.5 w-3.5 text-slate-600" />
                          <span>Câu hỏi</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      </div>

                      {activeSubmenu === "question" && (
                        <div
                          onMouseEnter={cancelSubmenuLeave}
                          onMouseLeave={handleSubmenuLeave}
                          className="absolute left-[calc(100%-2px)] top-0 z-50 w-72 rounded-lg border border-slate-200 bg-white py-1 shadow-xl before:absolute before:-left-3 before:top-0 before:bottom-0 before:w-4 before:content-['']"
                        >
                          <button
                            onClick={() => handleInsertQuestionType("section_title")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <span className="font-serif font-bold text-slate-700 px-1">T</span>
                            <span>Tiêu đề phần</span>
                          </button>
                          <button
                            onClick={() => handleInsertQuestionType("essay")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <FileText className="h-3.5 w-3.5 text-slate-500" />
                            <span>Câu tự luận</span>
                          </button>
                          <button
                            onClick={() => handleInsertQuestionType("mcq_auto")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <FileText className="h-3.5 w-3.5 text-slate-500" />
                            <span>Câu trắc nghiệm (tự động xếp đáp án)</span>
                          </button>
                          <button
                            onClick={() => handleInsertQuestionType("mcq_2col")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <FileText className="h-3.5 w-3.5 text-slate-500" />
                            <span>Câu trắc nghiệm (2 phương án 1 hàng)</span>
                          </button>
                          <button
                            onClick={() => handleInsertQuestionType("true_false")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <Scale className="h-3.5 w-3.5 text-slate-500" />
                            <span>Câu đúng / sai</span>
                          </button>
                          <button
                            onClick={() => handleInsertQuestionType("short_answer")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <Edit3 className="h-3.5 w-3.5 text-slate-500" />
                            <span>Câu trả lời ngắn</span>
                          </button>
                          <button
                            onClick={() => handleInsertQuestionType("passage")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <BookOpen className="h-3.5 w-3.5 text-slate-500" />
                            <span>Ngữ liệu / đoạn trích</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 8. Nội dung > (Screenshot 5: 9 items) */}
                    <div
                      className="relative"
                      onMouseEnter={() => handleSubmenuHover("content")}
                      onMouseLeave={handleSubmenuLeave}
                    >
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSubmenu("content");
                        }}
                        className={`flex w-full items-center justify-between px-3 py-1.5 cursor-pointer ${activeSubmenu === "content" ? "bg-slate-100 font-medium" : "hover:bg-slate-50"}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <FileCode className="h-3.5 w-3.5 text-slate-600" />
                          <span>Nội dung</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      </div>

                      {activeSubmenu === "content" && (
                        <div
                          onMouseEnter={cancelSubmenuLeave}
                          onMouseLeave={handleSubmenuLeave}
                          className="absolute left-[calc(100%-2px)] top-0 z-50 w-60 rounded-lg border border-slate-200 bg-white py-1 shadow-xl before:absolute before:-left-3 before:top-0 before:bottom-0 before:w-4 before:content-['']"
                        >
                          <button
                            onClick={() => handleInsertContent("formula_block")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <span className="font-serif font-bold text-slate-700 w-4 text-center">∑</span>
                            <span>Công thức riêng dòng</span>
                          </button>
                          <button
                            onClick={() => handleInsertContent("table")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <TableIcon className="h-3.5 w-3.5 text-slate-500" />
                            <span>Bảng</span>
                          </button>
                          <button
                            onClick={() => handleInsertContent("rubric_table")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <FileSpreadsheet className="h-3.5 w-3.5 text-slate-500" />
                            <span>Bảng barem</span>
                          </button>
                          <button
                            onClick={() => handleInsertContent("image")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <ImageIcon className="h-3.5 w-3.5 text-slate-500" />
                            <span>Hình</span>
                          </button>
                          <button
                            onClick={() => handleInsertContent("variation_table")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <TrendingUp className="h-3.5 w-3.5 text-slate-500" />
                            <span>Bảng biến thiên</span>
                          </button>
                          <button
                            onClick={() => handleInsertContent("function_graph")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                            <span>Đồ thị hàm số</span>
                          </button>
                          <button
                            onClick={() => handleInsertContent("chart")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <BarChart3 className="h-3.5 w-3.5 text-slate-500" />
                            <span>Biểu đồ</span>
                          </button>
                          <button
                            onClick={() => handleInsertContent("geometry")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <PenTool className="h-3.5 w-3.5 text-slate-500" />
                            <span>Hình học</span>
                          </button>
                          <button
                            onClick={() => handleInsertContent("rubric_with_geometry")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Barem có hình học</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 9. Bố cục > */}
                    <div
                      className="relative"
                      onMouseEnter={() => handleSubmenuHover("layout")}
                      onMouseLeave={handleSubmenuLeave}
                    >
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSubmenu("layout");
                        }}
                        className={`flex w-full items-center justify-between px-3 py-1.5 cursor-pointer ${activeSubmenu === "layout" ? "bg-slate-100 font-medium" : "hover:bg-slate-50"}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Columns2 className="h-3.5 w-3.5 text-slate-600" />
                          <span>Bố cục</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      </div>

                      {activeSubmenu === "layout" && (
                        <div
                          onMouseEnter={cancelSubmenuLeave}
                          onMouseLeave={handleSubmenuLeave}
                          className="absolute left-[calc(100%-2px)] top-0 z-50 w-64 rounded-lg border border-slate-200 bg-white py-1 shadow-xl before:absolute before:-left-3 before:top-0 before:bottom-0 before:w-4 before:content-['']"
                        >
                          <button
                            onClick={() => handleInsertLayout("two_columns")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <Columns2 className="h-3.5 w-3.5 text-slate-500" />
                            <span>Chia 2 cột song song</span>
                          </button>
                          <button
                            onClick={() => handleInsertLayout("dotted_lines")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <PenTool className="h-3.5 w-3.5 text-slate-500" />
                            <span>Dòng kẻ chấm (viết tự luận) ........</span>
                          </button>
                          <button
                            onClick={() => handleInsertLayout("callout")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                            <span>Khung chú ý / Ghi chú</span>
                          </button>
                          <button
                            onClick={() => handleInsertLayout("answer_sheet")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-slate-500" />
                            <span>Phiếu trả lời trắc nghiệm</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="my-1 border-t border-slate-100" />

                    {/* 10. Liên kết */}
                    <button
                      onMouseEnter={handleSubmenuLeave}
                      onClick={async () => {
                        const url = await promptModal({
                          title: "Chèn liên kết",
                          message: "Nhập địa chỉ URL của liên kết:",
                          placeholder: "https://...",
                          inputType: "url",
                          required: true,
                        });
                        if (url) {
                          const linkBlock: DocItem = {
                            id: "link-" + Date.now(),
                            content: `[Liên kết tham khảo: ${url}](${url})`,
                            type: "multiple_choice",
                            options: {},
                          };
                          setQuestions([...questions, linkBlock]);
                        }
                        setShowActiveMenu(null);
                      }}
                      className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left hover:bg-slate-50"
                    >
                      <LinkIcon className="h-3.5 w-3.5 text-slate-600" />
                      <span>Liên kết</span>
                    </button>

                    {/* 11. Ngắt trang */}
                    <button
                      onMouseEnter={handleSubmenuLeave}
                      onClick={() => handleInsertLayout("page_break")}
                      className="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-2.5">
                        <SplitSquareVertical className="h-3.5 w-3.5 text-slate-600" />
                        <span>Ngắt trang</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">Ctrl+↵</span>
                    </button>

                    {/* 12. Đường kẻ ngang */}
                    <button
                      onMouseEnter={handleSubmenuLeave}
                      onClick={() => handleInsertLayout("divider")}
                      className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left hover:bg-slate-50"
                    >
                      <MinusIcon className="h-3.5 w-3.5 text-slate-600" />
                      <span>Đường kẻ ngang</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 5. Định dạng (Exact match with Screenshots 1 & 2) */}
              <div className="relative">
                <button
                  onClick={() => setShowActiveMenu(showActiveMenu === "format" ? null : "format")}
                  className={`rounded px-2 py-0.5 text-xs font-medium transition cursor-pointer leading-normal ${showActiveMenu === "format" ? "bg-slate-200 text-slate-900 font-semibold" : "text-slate-700 hover:bg-slate-100"}`}
                >
                  Định dạng
                </button>
                {showActiveMenu === "format" && (
                  <div
                    onMouseLeave={handleSubmenuLeave}
                    className="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border border-slate-200 bg-white py-1 shadow-xl text-slate-700 text-xs select-none"
                  >
                    {/* 1. Aa Chữ > (Screenshot 2: 7 items) */}
                    <div
                      className="relative"
                      onMouseEnter={() => handleSubmenuHover("fmt_text")}
                      onMouseLeave={handleSubmenuLeave}
                    >
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSubmenu("fmt_text");
                        }}
                        className={`flex w-full items-center justify-between px-3 py-1.5 cursor-pointer ${activeSubmenu === "fmt_text" ? "bg-slate-100 font-medium" : "hover:bg-slate-50"}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold font-serif text-slate-700 w-4 text-center">Aa</span>
                          <span>Chữ</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      </div>

                      {activeSubmenu === "fmt_text" && (
                        <div
                          onMouseEnter={cancelSubmenuLeave}
                          onMouseLeave={handleSubmenuLeave}
                          className="absolute left-[calc(100%-2px)] top-0 z-50 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-xl before:absolute before:-left-3 before:top-0 before:bottom-0 before:w-4 before:content-['']"
                        >
                          <button
                            onClick={() => setIsBold(!isBold)}
                            className="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-slate-50"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="font-bold w-4 text-center">B</span>
                              <span>Đậm</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {isBold && <Check className="h-3 w-3 text-blue-600" />}
                              <span className="text-[10px] text-slate-400 font-mono">Ctrl+B</span>
                            </div>
                          </button>

                          <button
                            onClick={() => setIsItalic(!isItalic)}
                            className="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-slate-50"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="italic font-serif font-bold w-4 text-center">I</span>
                              <span>Nghiêng</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {isItalic && <Check className="h-3 w-3 text-blue-600" />}
                              <span className="text-[10px] text-slate-400 font-mono">Ctrl+I</span>
                            </div>
                          </button>

                          <button
                            onClick={() => setIsUnderline(!isUnderline)}
                            className="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-slate-50"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="underline font-bold w-4 text-center">U</span>
                              <span>Gạch chân</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {isUnderline && <Check className="h-3 w-3 text-blue-600" />}
                              <span className="text-[10px] text-slate-400 font-mono">Ctrl+U</span>
                            </div>
                          </button>

                          <button
                            onClick={() => setIsStrikethrough(!isStrikethrough)}
                            className="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-slate-50"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="line-through font-bold w-4 text-center">S</span>
                              <span>Gạch ngang</span>
                            </div>
                            {isStrikethrough && <Check className="h-3 w-3 text-blue-600" />}
                          </button>

                          <button
                            onClick={() => setIsSuperscript(!isSuperscript)}
                            className="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-slate-50"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="font-mono text-xs font-bold w-4 text-center">x²</span>
                              <span>Chỉ số trên</span>
                            </div>
                            {isSuperscript && <Check className="h-3 w-3 text-blue-600" />}
                          </button>

                          <button
                            onClick={() => setIsSubscript(!isSubscript)}
                            className="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-slate-50"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="font-mono text-xs font-bold w-4 text-center">x₂</span>
                              <span>Chỉ số dưới</span>
                            </div>
                            {isSubscript && <Check className="h-3 w-3 text-blue-600" />}
                          </button>

                          <div className="my-1 border-t border-slate-100" />

                          <button
                            onClick={() => setIsBorderBox(!isBorderBox)}
                            className="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-slate-50"
                          >
                            <div className="flex items-center gap-2.5">
                              <Square className="h-3.5 w-3.5 text-slate-500" />
                              <span>Đóng khung</span>
                            </div>
                            {isBorderBox && <Check className="h-3 w-3 text-blue-600" />}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 2. Aa Phông chữ > */}
                    <div
                      className="relative"
                      onMouseEnter={() => handleSubmenuHover("fmt_font")}
                      onMouseLeave={handleSubmenuLeave}
                    >
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSubmenu("fmt_font");
                        }}
                        className={`flex w-full items-center justify-between px-3 py-1.5 cursor-pointer ${activeSubmenu === "fmt_font" ? "bg-slate-100 font-medium" : "hover:bg-slate-50"}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Type className="h-3.5 w-3.5 text-slate-500" />
                          <span>Phông chữ</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      </div>

                      {activeSubmenu === "fmt_font" && (
                        <div
                          onMouseEnter={cancelSubmenuLeave}
                          onMouseLeave={handleSubmenuLeave}
                          className="absolute left-[calc(100%-2px)] top-0 z-50 w-52 rounded-lg border border-slate-200 bg-white py-1 shadow-xl before:absolute before:-left-3 before:top-0 before:bottom-0 before:w-4 before:content-['']"
                        >
                          {["Times New Roman", "Arial", "Calibri", "Roboto"].map((fn) => (
                            <button
                              key={fn}
                              onClick={() => {
                                setFontFamily(fn);
                                setShowActiveMenu(null);
                              }}
                              className="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-slate-50"
                            >
                              <span style={{ fontFamily: fn }}>{fn}</span>
                              {fontFamily === fn && <Check className="h-3 w-3 text-blue-600" />}
                            </button>
                          ))}
                          <div className="my-1 border-t border-slate-100" />
                          <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase">
                            Cỡ chữ nhanh
                          </div>
                          <div className="grid grid-cols-4 gap-1 px-3 py-1">
                            {[12, 13, 14, 15, 16, 18, 20, 24].map((sz) => (
                              <button
                                key={sz}
                                onClick={() => {
                                  setFontSize(sz);
                                  setShowActiveMenu(null);
                                }}
                                className={`rounded py-1 text-center font-mono font-medium hover:bg-blue-50 hover:text-blue-600 ${fontSize === sz ? "bg-blue-100 text-blue-700 font-bold" : "bg-slate-50"}`}
                              >
                                {sz}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 3. Màu chữ > */}
                    <div
                      className="relative"
                      onMouseEnter={() => handleSubmenuHover("fmt_color")}
                      onMouseLeave={handleSubmenuLeave}
                    >
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSubmenu("fmt_color");
                        }}
                        className={`flex w-full items-center justify-between px-3 py-1.5 cursor-pointer ${activeSubmenu === "fmt_color" ? "bg-slate-100 font-medium" : "hover:bg-slate-50"}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Palette className="h-3.5 w-3.5 text-slate-500" />
                          <span>Màu chữ</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      </div>

                      {activeSubmenu === "fmt_color" && (
                        <div
                          onMouseEnter={cancelSubmenuLeave}
                          onMouseLeave={handleSubmenuLeave}
                          className="absolute left-[calc(100%-2px)] top-0 z-50 w-44 rounded-lg border border-slate-200 bg-white py-2 shadow-xl before:absolute before:-left-3 before:top-0 before:bottom-0 before:w-4 before:content-['']"
                        >
                          <div className="grid grid-cols-5 gap-2 px-3 py-1">
                            {[
                              { label: "Đen", hex: "#0f172a" },
                              { label: "Đỏ", hex: "#dc2626" },
                              { label: "Xanh lam", hex: "#2563eb" },
                              { label: "Xanh lục", hex: "#16a34a" },
                              { label: "Tím", hex: "#9333ea" },
                              { label: "Cam", hex: "#ea580c" },
                              { label: "Xám", hex: "#64748b" },
                              { label: "Vàng", hex: "#eab308" },
                              { label: "Hồng", hex: "#ec4899" },
                              { label: "Xanh ngọc", hex: "#06b6d4" },
                            ].map((c) => (
                              <button
                                key={c.hex}
                                onClick={() => {
                                  setTextColor(c.hex);
                                  setShowActiveMenu(null);
                                }}
                                title={c.label}
                                className="h-6 w-6 rounded-full border border-slate-300 shadow-sm transition hover:scale-110"
                                style={{ backgroundColor: c.hex }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 4. Màu nền chữ > */}
                    <div
                      className="relative"
                      onMouseEnter={() => handleSubmenuHover("fmt_bgcolor")}
                      onMouseLeave={handleSubmenuLeave}
                    >
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSubmenu("fmt_bgcolor");
                        }}
                        className={`flex w-full items-center justify-between px-3 py-1.5 cursor-pointer ${activeSubmenu === "fmt_bgcolor" ? "bg-slate-100 font-medium" : "hover:bg-slate-50"}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Highlighter className="h-3.5 w-3.5 text-amber-500" />
                          <span>Màu nền chữ</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      </div>

                      {activeSubmenu === "fmt_bgcolor" && (
                        <div
                          onMouseEnter={cancelSubmenuLeave}
                          onMouseLeave={handleSubmenuLeave}
                          className="absolute left-[calc(100%-2px)] top-0 z-50 w-44 rounded-lg border border-slate-200 bg-white py-2 shadow-xl before:absolute before:-left-3 before:top-0 before:bottom-0 before:w-4 before:content-['']"
                        >
                          <button
                            onClick={() => {
                              setBgColor("transparent");
                              setShowActiveMenu(null);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-slate-50"
                          >
                            <RotateCcw className="h-3 w-3 text-slate-400" />
                            <span>Không màu</span>
                          </button>
                          <div className="my-1 border-t border-slate-100" />
                          <div className="grid grid-cols-5 gap-2 px-3 py-1">
                            {[
                              { label: "Vàng dạ quang", hex: "#fef08a" },
                              { label: "Xanh lục nhạt", hex: "#bbf7d0" },
                              { label: "Xanh lam nhạt", hex: "#bfdbfe" },
                              { label: "Hồng nhạt", hex: "#fbcfe8" },
                              { label: "Cam nhạt", hex: "#fed7aa" },
                            ].map((c) => (
                              <button
                                key={c.hex}
                                onClick={() => {
                                  setBgColor(c.hex);
                                  setShowActiveMenu(null);
                                }}
                                title={c.label}
                                className="h-6 w-6 rounded border border-slate-300 shadow-sm transition hover:scale-110"
                                style={{ backgroundColor: c.hex }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 5. Kiểu đoạn > */}
                    <div
                      className="relative"
                      onMouseEnter={() => handleSubmenuHover("fmt_style")}
                      onMouseLeave={handleSubmenuLeave}
                    >
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSubmenu("fmt_style");
                        }}
                        className={`flex w-full items-center justify-between px-3 py-1.5 cursor-pointer ${activeSubmenu === "fmt_style" ? "bg-slate-100 font-medium" : "hover:bg-slate-50"}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold w-4 text-center">T</span>
                          <span>Kiểu đoạn</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      </div>

                      {activeSubmenu === "fmt_style" && (
                        <div
                          onMouseEnter={cancelSubmenuLeave}
                          onMouseLeave={handleSubmenuLeave}
                          className="absolute left-[calc(100%-2px)] top-0 z-50 w-52 rounded-lg border border-slate-200 bg-white py-1 shadow-xl before:absolute before:-left-3 before:top-0 before:bottom-0 before:w-4 before:content-['']"
                        >
                          <button
                            onClick={() => {
                              setFontSize(15);
                              setIsBold(false);
                              setShowActiveMenu(null);
                            }}
                            className="flex w-full items-center px-3 py-1.5 text-left hover:bg-slate-50"
                          >
                            <span>Văn bản thường</span>
                          </button>
                          <button
                            onClick={() => {
                              setFontSize(18);
                              setIsBold(true);
                              setShowActiveMenu(null);
                            }}
                            className="flex w-full items-center px-3 py-1.5 text-left font-bold text-sm hover:bg-slate-50"
                          >
                            <span>Tiêu đề 1 (Lớn)</span>
                          </button>
                          <button
                            onClick={() => {
                              setFontSize(16);
                              setIsBold(true);
                              setShowActiveMenu(null);
                            }}
                            className="flex w-full items-center px-3 py-1.5 text-left font-bold text-xs hover:bg-slate-50"
                          >
                            <span>Tiêu đề 2 (Vừa)</span>
                          </button>
                          <button
                            onClick={() => {
                              setFontSize(14);
                              setIsBold(true);
                              setShowActiveMenu(null);
                            }}
                            className="flex w-full items-center px-3 py-1.5 text-left font-semibold text-xs hover:bg-slate-50"
                          >
                            <span>Tiêu đề 3 (Nhỏ)</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 6. Căn lề > */}
                    <div
                      className="relative"
                      onMouseEnter={() => handleSubmenuHover("fmt_align")}
                      onMouseLeave={handleSubmenuLeave}
                    >
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSubmenu("fmt_align");
                        }}
                        className={`flex w-full items-center justify-between px-3 py-1.5 cursor-pointer ${activeSubmenu === "fmt_align" ? "bg-slate-100 font-medium" : "hover:bg-slate-50"}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <AlignLeft className="h-3.5 w-3.5 text-slate-500" />
                          <span>Căn lề</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      </div>

                      {activeSubmenu === "fmt_align" && (
                        <div
                          onMouseEnter={cancelSubmenuLeave}
                          onMouseLeave={handleSubmenuLeave}
                          className="absolute left-[calc(100%-2px)] top-0 z-50 w-52 rounded-lg border border-slate-200 bg-white py-1 shadow-xl before:absolute before:-left-3 before:top-0 before:bottom-0 before:w-4 before:content-['']"
                        >
                          <button
                            onClick={() => {
                              setTextAlign("left");
                              setShowActiveMenu(null);
                            }}
                            className="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-slate-50"
                          >
                            <div className="flex items-center gap-2">
                              <AlignLeft className="h-3.5 w-3.5 text-slate-500" />
                              <span>Căn trái</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">Ctrl+L</span>
                          </button>
                          <button
                            onClick={() => {
                              setTextAlign("center");
                              setShowActiveMenu(null);
                            }}
                            className="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-slate-50"
                          >
                            <div className="flex items-center gap-2">
                              <AlignCenter className="h-3.5 w-3.5 text-slate-500" />
                              <span>Căn giữa</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">Ctrl+E</span>
                          </button>
                          <button
                            onClick={() => {
                              setTextAlign("right");
                              setShowActiveMenu(null);
                            }}
                            className="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-slate-50"
                          >
                            <div className="flex items-center gap-2">
                              <AlignRight className="h-3.5 w-3.5 text-slate-500" />
                              <span>Căn phải</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">Ctrl+R</span>
                          </button>
                          <button
                            onClick={() => {
                              setTextAlign("justify");
                              setShowActiveMenu(null);
                            }}
                            className="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-slate-50"
                          >
                            <div className="flex items-center gap-2">
                              <AlignJustify className="h-3.5 w-3.5 text-slate-500" />
                              <span>Căn đều 2 bên</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">Ctrl+J</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 7. Giãn dòng > */}
                    <div
                      className="relative"
                      onMouseEnter={() => handleSubmenuHover("fmt_spacing")}
                      onMouseLeave={handleSubmenuLeave}
                    >
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSubmenu("fmt_spacing");
                        }}
                        className={`flex w-full items-center justify-between px-3 py-1.5 cursor-pointer ${activeSubmenu === "fmt_spacing" ? "bg-slate-100 font-medium" : "hover:bg-slate-50"}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <MoveVertical className="h-3.5 w-3.5 text-slate-500" />
                          <span>Giãn dòng</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      </div>

                      {activeSubmenu === "fmt_spacing" && (
                        <div
                          onMouseEnter={cancelSubmenuLeave}
                          onMouseLeave={handleSubmenuLeave}
                          className="absolute left-[calc(100%-2px)] top-0 z-50 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-xl before:absolute before:-left-3 before:top-0 before:bottom-0 before:w-4 before:content-['']"
                        >
                          {["1.0", "1.15", "1.3", "1.5", "2.0"].map((sp) => (
                            <button
                              key={sp}
                              onClick={() => {
                                setLineSpacing(sp);
                                setShowActiveMenu(null);
                              }}
                              className="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-slate-50"
                            >
                              <span>{sp} {sp === "1.15" ? "(Chuẩn)" : sp === "1.0" ? "(Đơn)" : sp === "2.0" ? "(Đôi)" : ""}</span>
                              {lineSpacing === sp && <Check className="h-3 w-3 text-blue-600" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 8. Khoảng cách đoạn > */}
                    <div
                      className="relative"
                      onMouseEnter={() => handleSubmenuHover("fmt_paraspacing")}
                      onMouseLeave={handleSubmenuLeave}
                    >
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSubmenu("fmt_paraspacing");
                        }}
                        className={`flex w-full items-center justify-between px-3 py-1.5 cursor-pointer ${activeSubmenu === "fmt_paraspacing" ? "bg-slate-100 font-medium" : "hover:bg-slate-50"}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
                          <span>Khoảng cách đoạn</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      </div>

                      {activeSubmenu === "fmt_paraspacing" && (
                        <div
                          onMouseEnter={cancelSubmenuLeave}
                          onMouseLeave={handleSubmenuLeave}
                          className="absolute left-[calc(100%-2px)] top-0 z-50 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-xl before:absolute before:-left-3 before:top-0 before:bottom-0 before:w-4 before:content-['']"
                        >
                          <button
                            onClick={() => {
                              handleCleanEmptySpaces();
                              setShowActiveMenu(null);
                            }}
                            className="flex w-full items-center px-3 py-1.5 text-left hover:bg-slate-50"
                          >
                            <span>Thêm khoảng trống trước đoạn</span>
                          </button>
                          <button
                            onClick={() => {
                              handleCleanEmptySpaces();
                              setShowActiveMenu(null);
                            }}
                            className="flex w-full items-center px-3 py-1.5 text-left hover:bg-slate-50"
                          >
                            <span>Thêm khoảng trống sau đoạn</span>
                          </button>
                          <button
                            onClick={() => {
                              handleCleanEmptySpaces();
                              setShowActiveMenu(null);
                            }}
                            className="flex w-full items-center px-3 py-1.5 text-left hover:bg-slate-50 text-blue-600 font-medium"
                          >
                            <span>Xoá khoảng trống thừa</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 9. Thụt lề > */}
                    <div
                      className="relative"
                      onMouseEnter={() => handleSubmenuHover("fmt_indent")}
                      onMouseLeave={handleSubmenuLeave}
                    >
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSubmenu("fmt_indent");
                        }}
                        className={`flex w-full items-center justify-between px-3 py-1.5 cursor-pointer ${activeSubmenu === "fmt_indent" ? "bg-slate-100 font-medium" : "hover:bg-slate-50"}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Indent className="h-3.5 w-3.5 text-slate-500" />
                          <span>Thụt lề</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      </div>

                      {activeSubmenu === "fmt_indent" && (
                        <div
                          onMouseEnter={cancelSubmenuLeave}
                          onMouseLeave={handleSubmenuLeave}
                          className="absolute left-[calc(100%-2px)] top-0 z-50 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-xl before:absolute before:-left-3 before:top-0 before:bottom-0 before:w-4 before:content-['']"
                        >
                          <button
                            onClick={() => setShowActiveMenu(null)}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-50"
                          >
                            <Indent className="h-3.5 w-3.5 text-slate-500" />
                            <span>Tăng thụt lề</span>
                          </button>
                          <button
                            onClick={() => setShowActiveMenu(null)}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-50"
                          >
                            <Outdent className="h-3.5 w-3.5 text-slate-500" />
                            <span>Giảm thụt lề</span>
                          </button>
                          <button
                            onClick={() => setShowActiveMenu(null)}
                            className="flex w-full items-center px-3 py-1.5 text-left hover:bg-slate-50 text-blue-600"
                          >
                            <span>Thụt lề dòng đầu (1.27 cm)</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 10. Dấu đầu dòng và đánh số > */}
                    <div
                      className="relative"
                      onMouseEnter={() => handleSubmenuHover("fmt_bullets")}
                      onMouseLeave={handleSubmenuLeave}
                    >
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSubmenu("fmt_bullets");
                        }}
                        className={`flex w-full items-center justify-between px-3 py-1.5 cursor-pointer ${activeSubmenu === "fmt_bullets" ? "bg-slate-100 font-medium" : "hover:bg-slate-50"}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <ListOrdered className="h-3.5 w-3.5 text-slate-500" />
                          <span>Dấu đầu dòng và đánh số</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      </div>

                      {activeSubmenu === "fmt_bullets" && (
                        <div
                          onMouseEnter={cancelSubmenuLeave}
                          onMouseLeave={handleSubmenuLeave}
                          className="absolute left-[calc(100%-2px)] top-0 z-50 w-52 rounded-lg border border-slate-200 bg-white py-1 shadow-xl before:absolute before:-left-3 before:top-0 before:bottom-0 before:w-4 before:content-['']"
                        >
                          <button onClick={() => setShowActiveMenu(null)} className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-50">
                            <span className="w-4 text-center font-bold">•</span>
                            <span>Danh sách chấm tròn</span>
                          </button>
                          <button onClick={() => setShowActiveMenu(null)} className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-50">
                            <span className="w-4 text-center font-bold">1.</span>
                            <span>Danh sách số (1, 2, 3...)</span>
                          </button>
                          <button onClick={() => setShowActiveMenu(null)} className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-50">
                            <span className="w-4 text-center font-bold">a)</span>
                            <span>Danh sách chữ (a, b, c...)</span>
                          </button>
                          <button onClick={() => setShowActiveMenu(null)} className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-50">
                            <span className="w-4 text-center font-bold">I.</span>
                            <span>Số La Mã (I, II, III...)</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 11. Định dạng đoạn, viền và màu nền */}
                    <button
                      onClick={() => {
                        setIsBorderBox(!isBorderBox);
                        setShowActiveMenu(null);
                      }}
                      className="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-2.5">
                        <Square className="h-3.5 w-3.5 text-slate-500" />
                        <span>Định dạng đoạn, viền và màu nền</span>
                      </div>
                      {isBorderBox && <Check className="h-3 w-3 text-blue-600" />}
                    </button>

                    {/* 12. Cột > */}
                    <div
                      className="relative"
                      onMouseEnter={() => handleSubmenuHover("fmt_columns")}
                      onMouseLeave={handleSubmenuLeave}
                    >
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSubmenu("fmt_columns");
                        }}
                        className={`flex w-full items-center justify-between px-3 py-1.5 cursor-pointer ${activeSubmenu === "fmt_columns" ? "bg-slate-100 font-medium" : "hover:bg-slate-50"}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <ColumnsIcon className="h-3.5 w-3.5 text-slate-500" />
                          <span>Cột</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      </div>

                      {activeSubmenu === "fmt_columns" && (
                        <div
                          onMouseEnter={cancelSubmenuLeave}
                          onMouseLeave={handleSubmenuLeave}
                          className="absolute left-[calc(100%-2px)] top-0 z-50 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-xl before:absolute before:-left-3 before:top-0 before:bottom-0 before:w-4 before:content-['']"
                        >
                          <button
                            onClick={() => {
                              setColumnCount(1);
                              setShowActiveMenu(null);
                            }}
                            className="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-slate-50"
                          >
                            <span>1 cột (Mặc định)</span>
                            {columnCount === 1 && <Check className="h-3 w-3 text-blue-600" />}
                          </button>
                          <button
                            onClick={() => {
                              setColumnCount(2);
                              setShowActiveMenu(null);
                            }}
                            className="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-slate-50"
                          >
                            <span>2 cột song song</span>
                            {columnCount === 2 && <Check className="h-3 w-3 text-blue-600" />}
                          </button>
                          <button
                            onClick={() => {
                              setColumnCount(3);
                              setShowActiveMenu(null);
                            }}
                            className="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-slate-50"
                          >
                            <span>3 cột</span>
                            {columnCount === 3 && <Check className="h-3 w-3 text-blue-600" />}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 13. Bảng > */}
                    <div
                      className="relative"
                      onMouseEnter={() => handleSubmenuHover("fmt_table")}
                      onMouseLeave={handleSubmenuLeave}
                    >
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSubmenu("fmt_table");
                        }}
                        className={`flex w-full items-center justify-between px-3 py-1.5 cursor-pointer ${activeSubmenu === "fmt_table" ? "bg-slate-100 font-medium" : "hover:bg-slate-50"}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <TableIcon className="h-3.5 w-3.5 text-slate-500" />
                          <span>Bảng</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      </div>

                      {activeSubmenu === "fmt_table" && (
                        <div
                          onMouseEnter={cancelSubmenuLeave}
                          onMouseLeave={handleSubmenuLeave}
                          className="absolute left-[calc(100%-2px)] top-0 z-50 w-52 rounded-lg border border-slate-200 bg-white py-1 shadow-xl before:absolute before:-left-3 before:top-0 before:bottom-0 before:w-4 before:content-['']"
                        >
                          <button onClick={() => setShowActiveMenu(null)} className="flex w-full items-center px-3 py-1.5 text-left hover:bg-slate-50">
                            <span>Chèn hàng phía trên</span>
                          </button>
                          <button onClick={() => setShowActiveMenu(null)} className="flex w-full items-center px-3 py-1.5 text-left hover:bg-slate-50">
                            <span>Chèn hàng phía dưới</span>
                          </button>
                          <button onClick={() => setShowActiveMenu(null)} className="flex w-full items-center px-3 py-1.5 text-left hover:bg-slate-50">
                            <span>Chèn cột bên trái</span>
                          </button>
                          <button onClick={() => setShowActiveMenu(null)} className="flex w-full items-center px-3 py-1.5 text-left hover:bg-slate-50">
                            <span>Chèn cột bên phải</span>
                          </button>
                          <div className="my-1 border-t border-slate-100" />
                          <button onClick={() => setShowActiveMenu(null)} className="flex w-full items-center px-3 py-1.5 text-left text-red-600 hover:bg-red-50">
                            <span>Xoá hàng / cột</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="my-1 border-t border-slate-100" />

                    {/* 14. Xoá định dạng (Ctrl+) */}
                    <button
                      onClick={handleResetFormatting}
                      className="flex w-full items-center justify-between px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-2.5">
                        <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                        <span>Xoá định dạng</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">Ctrl+\\</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 6. Công cụ */}
              <div className="relative">
                <button
                  onClick={() => setShowActiveMenu(showActiveMenu === "tools" ? null : "tools")}
                  className={`rounded px-2 py-0.5 text-xs font-medium transition cursor-pointer leading-normal ${showActiveMenu === "tools" ? "bg-slate-200 text-slate-900 font-semibold" : "text-slate-700 hover:bg-slate-100"}`}
                >
                  Công cụ
                </button>
                {showActiveMenu === "tools" && (
                  <div
                    onMouseLeave={() => setActiveSubmenu(null)}
                    className="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border border-slate-200 bg-white py-1 shadow-xl text-slate-700 text-xs select-none"
                  >
                    <button
                      onClick={() => {
                        setShowShuffleModal(true);
                        setShowActiveMenu(null);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-50 text-blue-600 font-semibold"
                    >
                      <Shuffle className="h-3.5 w-3.5 text-blue-600" />
                      <span>Trộn đề thi & Ma trận đáp án (4 mã)</span>
                    </button>

                    <button
                      onClick={() => {
                        setTeacherMode(!teacherMode);
                        setShowActiveMenu(null);
                      }}
                      className="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-2">
                        {teacherMode ? (
                          <EyeOff className="h-3.5 w-3.5 text-slate-500" />
                        ) : (
                          <Eye className="h-3.5 w-3.5 text-blue-600" />
                        )}
                        <span>{teacherMode ? "Xem bản học sinh (ẩn giải)" : "Xem bản giáo viên (hiện giải)"}</span>
                      </div>
                    </button>

                    <div className="my-1 border-t border-slate-100" />

                    <button
                      onClick={() => {
                        handleShowExamStats();
                        setShowActiveMenu(null);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-50"
                    >
                      <BarChart3 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Thống kê câu hỏi & thang điểm</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions & User Info */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Flagship Action 1: Trộn Mã Đề & Ma Trận (Xanh dương nổi bật) */}
          <button
            type="button"
            onClick={() => setShowShuffleModal(true)}
            aria-label="Trộn 4-8 mã đề và tạo ma trận đáp án"
            title="Trộn bộ 4-8 mã đề con hoán vị kèm ma trận barem chuẩn Bộ GD&ĐT"
            className="flex items-center gap-1.5 rounded-full bg-blue-600 px-3 sm:px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-blue-700 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 shrink-0"
          >
            <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Trộn Mã Đề</span>
          </button>

          {/* Flagship Action 2: Xuất Word (.docx) (Xanh lá nổi bật) */}
          <button
            type="button"
            onClick={handleExportDocx}
            aria-label="Tải về file Word (.docx) chuẩn Bộ GD&ĐT"
            title="Xuất file Word (.docx) chuẩn Times New Roman và hình vẽ vector"
            className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 sm:px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-700 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 shrink-0"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Xuất Word</span>
          </button>

          {/* Action: Chia sẻ Đề Thi (Mở Modal chia sẻ học sinh & giáo viên) */}
          <button
            type="button"
            onClick={handleShare}
            aria-label="Chia sẻ đề thi đang soạn"
            title="Chia sẻ đề thi đang soạn cho học sinh làm bài hoặc đồng nghiệp phản biện"
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-50 hover:text-blue-600 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 shrink-0"
          >
            <Share2 className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
            <span className="hidden sm:inline">Chia sẻ</span>
          </button>

          {/* More Actions Dropdown Menu "⋯" (Holds Chia sẻ, Mời đồng nghiệp, Xem kho đề) */}
          <div className="relative" ref={moreActionsRef}>
            <button
              type="button"
              onClick={() => setShowMoreActions(!showMoreActions)}
              aria-label="Thao tác khác"
              title="Thao tác khác: Chia sẻ đề thi, Mời nhận credits, Xem kho đề"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition cursor-pointer shadow-xs"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {showMoreActions && (
              <div
                className="absolute right-0 top-full mt-1.5 z-50 w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl text-xs space-y-0.5 text-slate-700 animate-in fade-in slide-in-from-top-1 duration-150 text-left font-normal"
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreActions(false);
                    handleShare();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-blue-50 text-slate-800 hover:text-blue-700 transition cursor-pointer"
                >
                  <Share2 className="h-4 w-4 text-blue-600 shrink-0" />
                  <span className="font-semibold">Chia sẻ đề thi (HS & GV)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowMoreActions(false);
                    setShowQuotaModal(true);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-amber-50 text-amber-900 transition cursor-pointer"
                >
                  <Gift className="h-4 w-4 text-amber-600 shrink-0" />
                  <span className="font-semibold">Mời đồng nghiệp (+2.000 cr)</span>
                </button>

                <Link
                  href="/exams"
                  onClick={() => setShowMoreActions(false)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-slate-100 text-slate-700 transition"
                >
                  <FolderOpen className="h-4 w-4 text-slate-500 shrink-0" />
                  <span>Kho đề thi của tôi</span>
                </Link>

                {examId && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreActions(false);
                      router.push(`/teach/${examId}`);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-amber-50 text-amber-800 transition cursor-pointer"
                  >
                    <Presentation className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Mở Bục Giảng Số</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Hỏi AI Toggle Button */}
          <button
            onClick={() => setAiSidebarOpen(!aiSidebarOpen)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition shadow-xs shrink-0 cursor-pointer ${
              aiSidebarOpen
                ? "bg-primary text-primary-foreground"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Hỏi AI</span>
          </button>

          {/* User Badge: Interactive Avatar with Profile Dropdown */}
          <div className="relative pl-1 sm:pl-2" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-label="Menu thông tin tài khoản"
              className="flex items-center gap-2 rounded-full p-1 hover:bg-slate-100 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 font-bold text-white shadow-sm ring-2 ring-white">
                {userInitial}
              </div>
              <div className="hidden text-left xl:block">
                <p className="text-xs font-semibold leading-tight text-slate-800">
                  {userDisplayName}
                </p>
                <p className="text-[11px] font-medium text-emerald-600">
                  ⚡ {userCredits.toLocaleString()} credits
                </p>
              </div>
              <ChevronDown className="hidden xl:block h-3 w-3 text-slate-400" />
            </button>

            {/* Profile Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 top-full z-50 mt-1.5 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl text-slate-700 animate-in fade-in slide-in-from-top-1 duration-150">
                {/* User Summary Header */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-black text-white text-sm shadow-xs shrink-0">
                      {userInitial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">{userDisplayName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user?.email || "Chưa cập nhật email"}</p>
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between border-t border-slate-200/60 pt-2 text-[11px]">
                    <span className="font-semibold text-slate-600">
                      {profile?.role === "teacher" ? "👨‍🏫 Giáo viên" : profile?.role === "tutor" ? "🎓 Gia sư" : "🎒 Học sinh"}
                    </span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-bold text-emerald-700">
                      ⚡ {userCredits.toLocaleString()} cr
                    </span>
                  </div>
                </div>

                {/* Navigation Links */}
                <div className="mt-1.5 space-y-0.5 text-xs">
                  <Link
                    href="/dashboard"
                    onClick={() => setShowUserMenu(false)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-slate-700 hover:bg-slate-100 transition"
                  >
                    <BookOpen className="h-4 w-4 text-slate-500" />
                    <span>Trang chủ Dashboard</span>
                  </Link>
                  <Link
                    href="/exams"
                    onClick={() => setShowUserMenu(false)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-slate-700 hover:bg-slate-100 transition"
                  >
                    <FolderOpen className="h-4 w-4 text-slate-500" />
                    <span>Đề thi của tôi</span>
                  </Link>
                  <Link
                    href="/settings?tab=plan"
                    onClick={() => setShowUserMenu(false)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-slate-700 hover:bg-slate-100 transition font-semibold text-blue-600"
                  >
                    <Crown className="h-4 w-4 text-amber-500" />
                    <span>Gói cước PRO & Nạp điểm</span>
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-slate-700 hover:bg-slate-100 transition"
                  >
                    <User className="h-4 w-4 text-slate-500" />
                    <span>Cài đặt tài khoản</span>
                  </Link>
                </div>

                <div className="my-1 border-t border-slate-100" />

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={async () => {
                    setShowUserMenu(false);
                    if (signOut) {
                      await signOut();
                      router.push("/login");
                    }
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition cursor-pointer"
                >
                  <LogOut className="h-4 w-4 text-red-500" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Teaching Stepper Bar: Hành trình Tiết dạy 360° */}
      {examId && (
        <TeachingStepperBar
          examId={examId}
          examName={title}
          questionCount={questions.length}
          onOpenShuffleModal={() => setShowShuffleModal(true)}
          onExportDualTeaching={handleExportDualDocx}
        />
      )}

      {/* Hidden file input for image uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Backdrop for open dropdown menus */}
      {showActiveMenu && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setShowActiveMenu(null);
            setActiveSubmenu(null);
          }}
        />
      )}

      {/* Backdrop for open toolbar style / font menus */}
      {(isStyleMenuOpen || isFontMenuOpen) && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => {
            setIsStyleMenuOpen(false);
            setIsFontMenuOpen(false);
          }}
        />
      )}

      {/* Share Toast */}
      {shareToast && (
        <div className="fixed top-16 right-6 z-50 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-medium text-white shadow-xl">
          ✓ Đã sao chép liên kết đề thi kèm mã giới thiệu ({userReferralCode})!
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. RICH TEXT FORMATTING TOOLBAR                                */}
      {/* ============================================================== */}
      <div className="relative z-40 flex h-11 w-full shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3 sm:px-4 overflow-hidden">
        <div className="flex items-center gap-1 text-slate-700 overflow-x-auto no-scrollbar whitespace-nowrap min-w-0 pr-2">
          {/* Undo / Redo */}
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            title="Hoàn tác (Ctrl+Z)"
            className={clsx("rounded p-1.5 hover:bg-slate-100 transition", historyIndex <= 0 && "opacity-40 cursor-not-allowed")}
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            title="Làm lại (Ctrl+Y)"
            className={clsx("rounded p-1.5 hover:bg-slate-100 transition", historyIndex >= history.length - 1 && "opacity-40 cursor-not-allowed")}
          >
            <Redo2 className="h-4 w-4" />
          </button>

          {/* Print */}
          <button
            onClick={handlePrint}
            title="In đề thi"
            className="rounded p-1.5 hover:bg-slate-100"
          >
            <Printer className="h-4 w-4" />
          </button>

          <div className="mx-1 h-5 w-[1px] bg-slate-200" />

          {/* Zoom & View Width */}
          <div className="relative">
            <button
              onClick={() => setShowZoomMenu(!showZoomMenu)}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-slate-100 transition"
              title="Phóng to / Thu nhỏ trang soạn thảo"
            >
              <span className="font-medium text-slate-700">{zoom}%</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>
            {showZoomMenu && (
              <div
                onMouseLeave={() => setShowZoomMenu(false)}
                className="absolute left-0 top-full mt-1 z-50 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-xl text-xs"
              >
                {[75, 85, 90, 100, 110, 125, 150].map((z) => (
                  <button
                    key={z}
                    onClick={() => {
                      setZoom(z);
                      setShowZoomMenu(false);
                    }}
                    className={clsx(
                      "flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-slate-50",
                      zoom === z ? "font-bold text-primary" : "text-slate-700"
                    )}
                  >
                    <span>{z}%</span>
                    {zoom === z && <Check className="h-3 w-3" />}
                  </button>
                ))}
                <div className="my-1 border-t border-slate-100" />
                <button
                  onClick={() => {
                    const availableW = window.innerWidth - (leftSidebarOpen ? leftWidth : 40) - (aiSidebarOpen ? rightWidth : 40) - 100;
                    const fitZoom = Math.min(130, Math.max(65, Math.round((availableW / 820) * 100)));
                    setZoom(fitZoom);
                    setShowZoomMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-slate-800 hover:bg-slate-50 font-medium"
                >
                  <Maximize2 className="h-3 w-3 text-blue-600" />
                  <span>Vừa chiều rộng</span>
                </button>
              </div>
            )}
          </div>

          <div className="mx-1 h-5 w-[1px] bg-slate-200" />

          {/* Header Toggle Button */}
          <button
            onClick={() => setShowStandardHeader(!showStandardHeader)}
            className={clsx(
              "flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition",
              showStandardHeader
                ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
                : "text-slate-600 hover:bg-slate-100 border border-slate-200"
            )}
            title={showStandardHeader ? "Ẩn đầu đề Sở/Trường" : "Hiện đầu đề Sở/Trường chuẩn"}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>{showStandardHeader ? "Đã bật đầu đề" : "Hiện đầu đề"}</span>
          </button>

          <div className="mx-1 h-5 w-[1px] bg-slate-200" />

          {/* Text Style Dropdown */}
          <div className="relative z-50" ref={styleMenuRef}>
            <button
              type="button"
              onClick={() => {
                setIsStyleMenuOpen((prev) => !prev);
                setIsFontMenuOpen(false);
              }}
              className="flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium hover:bg-slate-100 text-slate-700 transition cursor-pointer"
              title="Định dạng kiểu văn bản (Ctrl+Alt+0...3)"
            >
              <span>{TEXT_STYLES.find((s) => s.id === currentTextStyle)?.label || "Văn bản thường"}</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {isStyleMenuOpen && (
              <div
                className="absolute left-0 top-full mt-1.5 z-50 w-72 rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl text-left"
              >
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Kiểu văn bản & Đề mục
                </div>
                <div className="space-y-0.5">
                  {TEXT_STYLES.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => handleApplyTextStyle(st.id)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors cursor-pointer ${
                        currentTextStyle === st.id ? "bg-primary/10 text-primary font-semibold" : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className={`text-xs ${st.previewClass} truncate`}>{st.label}</div>
                        <div className="text-[10px] text-slate-400 truncate">{st.desc}</div>
                      </div>
                      <span className="shrink-0 text-[10px] font-mono text-slate-400 bg-slate-100 px-1 py-0.5 rounded">
                        {st.shortcut}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Font Family Dropdown */}
          <div className="relative z-50" ref={fontMenuRef}>
            <button
              type="button"
              onClick={() => {
                setIsFontMenuOpen((prev) => !prev);
                setIsStyleMenuOpen(false);
              }}
              className="flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-semibold hover:bg-slate-100 text-slate-800 transition cursor-pointer"
              title="Đổi phông chữ toàn bộ đề thi"
            >
              <span style={{ fontFamily }}>{fontFamily}</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {isFontMenuOpen && (
              <div
                className="absolute left-0 top-full mt-1.5 z-50 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl text-left"
              >
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Phông chữ đề thi (Toàn bộ)
                </div>
                <div className="space-y-0.5">
                  {FONT_FAMILIES.map((fn) => (
                    <button
                      key={fn.id}
                      type="button"
                      onClick={() => {
                        setFontFamily(fn.name);
                        setIsFontMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors cursor-pointer ${
                        fontFamily === fn.name ? "bg-primary/10 text-primary font-semibold" : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div>
                        <div className="text-xs font-medium" style={{ fontFamily: fn.fontStack }}>
                          {fn.name}
                        </div>
                        <div className="text-[10px] text-slate-400">{fn.desc}</div>
                      </div>
                      {fontFamily === fn.name && <Check className="h-4 w-4 text-primary shrink-0 ml-2" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mx-1 h-5 w-[1px] bg-slate-200" />

          {/* Font Size */}
          <div className="flex items-center rounded border border-slate-200 bg-slate-50">
            <button
              onClick={() => setFontSize(Math.max(10, fontSize - 1))}
              className="px-1.5 py-0.5 text-xs hover:bg-slate-200"
            >
              -
            </button>
            <span className="w-6 text-center text-xs font-medium">{fontSize}</span>
            <button
              onClick={() => setFontSize(Math.min(24, fontSize + 1))}
              className="px-1.5 py-0.5 text-xs hover:bg-slate-200"
            >
              +
            </button>
          </div>

          <div className="mx-1 h-5 w-[1px] bg-slate-200" />

          {/* Formatting: Bold, Italic, Underline */}
          <button
            onClick={() => setIsBold(!isBold)}
            className={`rounded p-1.5 font-bold hover:bg-slate-100 ${isBold ? "bg-slate-200 text-slate-900" : ""}`}
            title="In đậm"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsItalic(!isItalic)}
            className={`rounded p-1.5 italic hover:bg-slate-100 ${isItalic ? "bg-slate-200 text-slate-900" : ""}`}
            title="In nghiêng"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsUnderline(!isUnderline)}
            className={`rounded p-1.5 underline hover:bg-slate-100 ${isUnderline ? "bg-slate-200 text-slate-900" : ""}`}
            title="Gạch chân"
          >
            <Underline className="h-4 w-4" />
          </button>

          {/* Math Equation */}
          <button
            onClick={() => handleInsertFormula("math")}
            title="Bộ soạn thảo công thức Toán & Hoá học"
            className="flex items-center rounded p-1.5 hover:bg-blue-50 text-blue-600 transition"
          >
            <Sigma className="h-4 w-4" />
          </button>

          {/* Text Color / Highlight */}
          <div className="flex items-center rounded p-1 hover:bg-slate-100 cursor-pointer" title="Màu chữ">
            <span className="text-xs font-bold text-slate-900 border-b-2 border-slate-900 px-0.5">A</span>
          </div>
          <button title="Bút dạ quang" className="rounded p-1.5 hover:bg-slate-100">
            <Highlighter className="h-4 w-4 text-amber-500" />
          </button>

          {/* Mode preview toggle */}
          <button
            onClick={() => setTeacherMode(!teacherMode)}
            className="ml-2 flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
            title="Bật/Tắt hiển thị đáp án và lời giải"
          >
            {teacherMode ? <Eye className="h-3.5 w-3.5 text-blue-600" /> : <EyeOff className="h-3.5 w-3.5 text-slate-500" />}
            <span className="hidden md:inline">{teacherMode ? "Hiện đáp án" : "Ẩn đáp án"}</span>
          </button>


          {/* Quick Presentation / Teach Mode */}
          {examId && (
            <button
              onClick={() => router.push(`/teach/${examId}`)}
              className="ml-2 hidden sm:flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-300 px-3 py-1 text-xs font-bold text-amber-800 hover:bg-amber-100 shadow-2xs transition cursor-pointer"
              title="Mở Bục Giảng Số: Trình chiếu câu hỏi phông lớn kết hợp Bảng nháp Excalidraw (Gói PRO)"
            >
              <Presentation className="h-3.5 w-3.5 text-amber-600" />
              <span>Bục Giảng Số</span>
            </button>
          )}
        </div>

        {/* Word count & Total questions */}
        <div className="hidden xl:flex items-center gap-2 text-xs text-muted-foreground shrink-0 whitespace-nowrap pl-2">
          <span>{questions.length} câu hỏi</span>
          <span>•</span>
          <span>Thang điểm: 10</span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. THREE-COLUMN MAIN WORKSPACE                                 */}
      {/* ============================================================== */}
      <div className="flex flex-1 overflow-hidden">
        {/* ============================================================ */}
        {/* LEFT COLUMN: TÀI LIỆU (MỤC LỤC & MẪU ĐỀ THI)                */}
        {/* ============================================================ */}
        {/* Responsive backdrop for tablet & mobile (CRT-16) */}
        {leftSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
            onClick={() => setLeftSidebarOpen(false)}
          />
        )}
        {leftSidebarOpen ? (
          <aside
            style={{ width: `${leftWidth}px` }}
            className={`fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col border-r border-slate-200 bg-white shadow-2xl lg:static lg:z-auto lg:shadow-none ${
              isDraggingLeft ? "transition-none select-none" : "transition-[width] duration-200 ease-out"
            }`}
          >
            <div className="flex h-12 items-center justify-between border-b border-slate-100 px-4">
              <span className="text-sm font-semibold text-slate-700">Tài liệu</span>
              <button
                onClick={() => toggleLeftSidebar(false)}
                title="Thu gọn thanh tài liệu"
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>

            {/* Tabs: Mục lục | Mẫu đề thi */}
            <div className="p-3">
              <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium">
                <button
                  onClick={() => setActiveLeftTab("toc")}
                  className={`flex-1 rounded-md py-1.5 transition ${
                    activeLeftTab === "toc"
                      ? "bg-white font-semibold text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Mục lục
                </button>
                <button
                  onClick={() => setActiveLeftTab("templates")}
                  className={`flex-1 rounded-md py-1.5 transition ${
                    activeLeftTab === "templates"
                      ? "bg-white font-semibold text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Mẫu đề thi
                </button>
              </div>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto px-3 pb-4">
              {activeLeftTab === "toc" ? (
                <div className="space-y-3">
                  {/* Thanh Theo Dõi Cấu Trúc Điểm Chuẩn GDPT 2025 (Live Score Bar) */}
                  <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1">
                        <Scale className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
                        Cấu trúc GDPT 2025
                      </span>
                      <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-black text-white tabular-nums">
                        {Number((
                          Math.min(3.0, questions.filter((q) => !q.blockType || q.blockType === "question" || q.type === "multiple_choice").length * 0.25) +
                          Math.min(4.0, questions.filter((q) => q.blockType === "true_false" || q.type === "true_false").length * 1.0) +
                          Math.min(3.0, questions.filter((q) => q.blockType === "short_answer" || q.type === "short_answer").length * 0.5) +
                          questions.filter((q) => q.blockType === "essay" || q.type === "essay").length * 1.0
                        ).toFixed(1))} / 10.0 đ
                      </span>
                    </div>

                    {/* Fixed 2-column grid layout for zero-reflow resizing */}
                    <div className="space-y-1 text-[11px]">
                      <div className="grid grid-cols-[1fr_auto] items-center gap-x-2 py-0.5 whitespace-nowrap text-slate-700">
                        <span className="truncate">Phần I (MCQ):</span>
                        <span className="font-semibold tabular-nums text-slate-900">
                          {questions.filter((q) => !q.blockType || q.blockType === "question" || q.type === "multiple_choice").length}/12 câu (3.0đ)
                        </span>
                      </div>
                      <div className="grid grid-cols-[1fr_auto] items-center gap-x-2 py-0.5 whitespace-nowrap text-slate-700">
                        <span className="truncate">Phần II (Đúng/Sai):</span>
                        <span className="font-semibold tabular-nums text-slate-900">
                          {questions.filter((q) => q.blockType === "true_false" || q.type === "true_false").length}/4 câu (4.0đ)
                        </span>
                      </div>
                      <div className="grid grid-cols-[1fr_auto] items-center gap-x-2 py-0.5 whitespace-nowrap text-slate-700">
                        <span className="truncate">Phần III (Trả lời ngắn):</span>
                        <span className="font-semibold tabular-nums text-slate-900">
                          {questions.filter((q) => q.blockType === "short_answer" || q.type === "short_answer").length}/6 câu (3.0đ)
                        </span>
                      </div>
                      {questions.some((q) => q.blockType === "essay" || q.type === "essay") && (
                        <div className="grid grid-cols-[1fr_auto] items-center gap-x-2 py-0.5 whitespace-nowrap text-slate-700">
                          <span className="truncate">Phần Tự luận:</span>
                          <span className="font-semibold tabular-nums text-slate-900">
                            {questions.filter((q) => q.blockType === "essay" || q.type === "essay").length} câu
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="w-full bg-blue-200/60 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, ((
                            Math.min(3.0, questions.filter((q) => !q.blockType || q.blockType === "question" || q.type === "multiple_choice").length * 0.25) +
                            Math.min(4.0, questions.filter((q) => q.blockType === "true_false" || q.type === "true_false").length * 1.0) +
                            Math.min(3.0, questions.filter((q) => q.blockType === "short_answer" || q.type === "short_answer").length * 0.5)
                          ) / 10.0) * 100)}%`
                        }}
                      />
                    </div>
                  </div>

                  {questions.length === 0 ? (
                    <div className="mt-6 flex flex-col items-center justify-center text-center text-slate-400">
                      <List className="mb-2 h-7 w-7 stroke-[1.5] text-slate-300" aria-hidden="true" />
                      <p className="px-3 text-xs leading-relaxed">
                        Danh sách câu hỏi sẽ hiển thị ở đây để Thầy/Cô nhảy nhanh tới từng phần.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        CÁC CÂU HỎI ({questions.length})
                      </p>
                    {questions.map((q, idx) => {
                      let label = `Câu ${idx + 1}`;
                      let typeLabel = "Trắc nghiệm";
                      if (q.blockType === "true_false") typeLabel = "Đúng / Sai";
                      else if (q.blockType === "short_answer") typeLabel = "Trả lời ngắn";
                      else if (q.blockType === "essay") typeLabel = "Tự luận";
                      else if (q.blockType === "section_title") {
                        label = "§";
                        typeLabel = "Phần đề mục";
                      } else if (q.blockType === "header_custom") {
                        label = "Đầu đề";
                        typeLabel = "Tiêu đề";
                      } else if (q.blockType === "formula") {
                        label = "∑";
                        typeLabel = "Công thức";
                      } else if (q.blockType === "svg") {
                        label = "📐";
                        typeLabel = "Hình vẽ";
                      }

                      // Clean math preview from raw $math$ LaTeX
                      const cleanedPreview = q.content
                        ? q.content
                            .replace(/\$([^$]+)\$/g, " $1 ")
                            .replace(/\\(frac|sqrt|times|cdot|le|ge|pm|approx)/g, "")
                            .replace(/[{}]/g, "")
                            .replace(/\s+/g, " ")
                            .trim()
                        : q.sectionTitle || "";

                      return (
                        <button
                          key={q.id}
                          onClick={() => scrollToQuestion(idx)}
                          title={q.content || `${label}: ${typeLabel}`}
                          className="group flex w-full flex-col items-start gap-0.5 rounded-lg px-2.5 py-1.5 text-left text-xs transition hover:bg-slate-100 cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5 w-full">
                            <span className="font-bold text-blue-600 text-xs shrink-0">{label}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium shrink-0 truncate max-w-[120px]">
                              {typeLabel}
                            </span>
                          </div>
                          <span className="truncate text-[11px] text-slate-500 group-hover:text-slate-800 w-full pl-0.5">
                            {cleanedPreview || "Nội dung mục..."}
                          </span>
                        </button>
                      );
                    })}
                    <div className="relative mt-3">
                      <div className="flex rounded-lg border border-slate-300 bg-white shadow-sm overflow-hidden">
                        <button
                          onClick={() => handleAddQuestion("multiple_choice")}
                          className="flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Plus className="h-3.5 w-3.5 text-slate-500" /> Thêm câu hỏi
                        </button>
                        <button
                          onClick={() => setShowAddTypeMenu(!showAddTypeMenu)}
                          className="border-l border-slate-200 px-2 hover:bg-slate-50 text-slate-500"
                          title="Chọn loại câu hỏi"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </div>
                      {showAddTypeMenu && (
                        <div
                          onMouseLeave={() => setShowAddTypeMenu(false)}
                          className="absolute left-0 bottom-full mb-1 z-50 w-full rounded-lg border border-slate-200 bg-white py-1 shadow-xl text-xs space-y-0.5"
                        >
                          <button
                            onClick={() => handleAddQuestion("multiple_choice")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-50 text-slate-700"
                          >
                            <span className="font-bold text-blue-600 text-[10px] w-6">MCQ</span>
                            <span>Trắc nghiệm 4 lựa chọn</span>
                          </button>
                          <button
                            onClick={() => handleAddQuestion("true_false")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-50 text-slate-700"
                          >
                            <span className="font-bold text-emerald-600 text-[10px] w-6">Đ/S</span>
                            <span>Trắc nghiệm Đúng / Sai</span>
                          </button>
                          <button
                            onClick={() => handleAddQuestion("short_answer")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-50 text-slate-700"
                          >
                            <span className="font-bold text-amber-600 text-[10px] w-6">TN</span>
                            <span>Trả lời ngắn</span>
                          </button>
                          <button
                            onClick={() => handleAddQuestion("essay")}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-50 text-slate-700"
                          >
                            <span className="font-bold text-purple-600 text-[10px] w-6">TL</span>
                            <span>Tự luận</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
                /* Templates Tab */
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    CẤU TRÚC MA TRẬN CHUẨN GDPT 2025
                  </p>
                  <div
                    className="rounded-xl border border-slate-200 bg-white p-3 transition shadow-xs hover:border-blue-400 hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900">Đề giữa kì I môn Toán</p>
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">90 phút</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                      12 câu MCQ (3đ) + 4 câu Đúng/Sai (4đ) + 6 câu Trả lời ngắn (3đ)
                    </p>
                    <button
                      type="button"
                      onClick={() => executeAiGenerate("Soạn đề giữa kì I môn Toán chuẩn ma trận Bộ GD&ĐT 2025 gồm đầy đủ 3 phần: 12 trắc nghiệm, 4 đúng/sai, 6 trả lời ngắn")}
                      className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-50 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-600 hover:text-white transition cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Dùng mẫu này
                    </button>
                  </div>

                  <div
                    className="rounded-xl border border-slate-200 bg-white p-3 transition shadow-xs hover:border-emerald-400 hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900">Kiểm tra 15 phút (Đánh giá nhanh)</p>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">15 phút</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                      10 câu trắc nghiệm 4 lựa chọn lấy điểm hệ số 1
                    </p>
                    <button
                      type="button"
                      onClick={() => executeAiGenerate("Soạn đề kiểm tra 15 phút môn Toán 10 câu trắc nghiệm nhanh")}
                      className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-50 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-600 hover:text-white transition cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Dùng mẫu này
                    </button>
                  </div>

                  <div
                    className="rounded-xl border border-slate-200 bg-white p-3 transition shadow-xs hover:border-purple-400 hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900">Đề thi học kì I (Tốt nghiệp THPT)</p>
                      <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">120 phút</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                      Đầy đủ 3 phần format mới Bộ GD&ĐT kèm câu hỏi phân hóa cao
                    </p>
                    <button
                      type="button"
                      onClick={() => executeAiGenerate("Soạn đề thi học kì I môn Toán lớp 12 chuẩn cấu trúc Bộ GD&ĐT 2025 có tính phân hóa")}
                      className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-purple-50 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-600 hover:text-white transition cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Dùng mẫu này
                    </button>
                  </div>
                </div>
              )}
            </div>
          </aside>
        ) : (
          <aside className="w-10 shrink-0 border-r border-slate-200 bg-slate-50/90 flex flex-col items-center py-3 gap-3 z-30 transition-all duration-200 select-none">
            <button
              onClick={() => toggleLeftSidebar(true)}
              title="Mở thanh tài liệu & Mục lục (Ctrl+\)"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-xs transition cursor-pointer"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
            <div className="w-5 h-[1px] bg-slate-200" />
            <button
              onClick={() => {
                setActiveLeftTab("toc");
                toggleLeftSidebar(true);
              }}
              title="Mục lục các câu hỏi"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-blue-600 hover:shadow-xs transition cursor-pointer"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setActiveLeftTab("templates");
                toggleLeftSidebar(true);
              }}
              title="Mẫu ma trận đề thi"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-blue-600 hover:shadow-xs transition cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4" />
            </button>
            <div className="mt-auto">
              <span className="text-[10px] font-bold text-slate-400 rotate-90 block tracking-wider uppercase">
                Tài liệu
              </span>
            </div>
          </aside>
        )}

        {/* Left Resizer Drag Handle */}
        {leftSidebarOpen && (
          <div
            onMouseDown={() => setIsDraggingLeft(true)}
            className="w-2 hover:w-2.5 cursor-col-resize hover:bg-blue-500/50 active:bg-blue-600 bg-slate-200/80 transition-colors shrink-0 z-20 select-none group relative"
            title="Kéo sang trái/phải để chỉnh độ rộng (hoặc kéo dưới 180px để thu gọn)"
          >
            <div className="absolute inset-y-0 -left-1 -right-1 cursor-col-resize" />
          </div>
        )}

        {/* ============================================================ */}
        {/* CENTER COLUMN: A4 DOCUMENT CANVAS                            */}
        {/* ============================================================ */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center min-w-0">
          <div
            style={{
              fontFamily: FONT_FAMILIES.find((f) => f.name === fontFamily)?.fontStack || fontFamily,
              fontSize: `${fontSize}px`,
              lineHeight: lineSpacing,
              textAlign: textAlign,
              color: textColor,
              textDecoration: [
                isUnderline ? "underline" : "",
                isStrikethrough ? "line-through" : "",
              ].filter(Boolean).join(" ") || undefined,
              fontWeight: isBold ? "bold" : "normal",
              fontStyle: isItalic ? "italic" : "normal",
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top center",
            }}
            className="w-[820px] min-h-[1160px] shrink-0 mx-auto rounded-sm border border-slate-200/80 bg-white p-12 shadow-[0_4px_24px_rgba(0,0,0,0.06)] print:shadow-none print:border-none print:m-0 print:p-8"
          >
            {/* Standard Vietnamese School Exam Header (Optional - Toggleable) */}
            {showStandardHeader && (
              <>
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-300 text-center">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-900">
                      SỞ GIÁO DỤC VÀ ĐÀO TẠO
                    </p>
                    <p className="text-xs font-semibold text-slate-700">
                      TRƯỜNG ....................................................
                    </p>
                    <p className="text-[11px] text-slate-500 italic mt-0.5">Mã đề thi: 101</p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-900">
                      ĐỀ KIỂM TRA ĐÁNH GIÁ GIỮA KỲ I
                    </p>
                    <p className="text-xs font-bold text-slate-800">
                      Môn: {subject} - Khối {grade}
                    </p>
                    <p className="text-[11px] text-slate-500 italic mt-0.5">
                      Thời gian làm bài: {duration} phút (không kể thời gian phát đề)
                    </p>
                  </div>
                </div>

                {/* Student info line */}
                <div className="mt-3 flex items-center justify-between text-xs text-slate-600 italic">
                  <span>Họ và tên học sinh: .....................................................................</span>
                  <span>Lớp: ................. SBD: .........</span>
                </div>
              </>
            )}

            {/* Questions Container (Supports 1/2/3 columns and Border Box) */}
            <div
              className={`mt-8 space-y-6 ${
                columnCount === 2
                  ? "columns-2 gap-8 [column-rule:1px_solid_#e2e8f0]"
                  : columnCount === 3
                  ? "columns-3 gap-6 [column-rule:1px_solid_#e2e8f0]"
                  : ""
              } ${isBorderBox ? "rounded-lg border border-slate-300 p-4 shadow-sm" : ""}`}
            >
              {questions.length === 0 ? (
                /* Blank state: Prompt to write or use AI */
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <p className="text-base text-slate-400 italic">Bắt đầu soạn đề...</p>
                  <p className="mt-2 text-xs text-slate-400 max-w-sm">
                    Gợi ý: Nhập câu hỏi thủ công hoặc sử dụng <strong>Trợ lý AI</strong> ở khung bên phải để tự động tạo toàn bộ đề thi chuẩn ma trận trong tích tắc.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <div className="relative">
                      <div className="flex items-center rounded-lg border border-slate-300 bg-white shadow-sm hover:border-slate-400">
                        <button
                          onClick={() => handleAddQuestion("multiple_choice")}
                          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-l-lg"
                        >
                          <Plus className="h-4 w-4 text-slate-500" /> Thêm câu hỏi thủ công
                        </button>
                        <button
                          onClick={() => setShowEmptyAddTypeMenu(!showEmptyAddTypeMenu)}
                          className="border-l border-slate-200 px-2 py-2 hover:bg-slate-50 rounded-r-lg text-slate-500"
                          title="Chọn dạng câu hỏi"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {showEmptyAddTypeMenu && (
                        <div
                          onMouseLeave={() => setShowEmptyAddTypeMenu(false)}
                          className="absolute left-0 top-full mt-1 z-50 w-60 rounded-lg border border-slate-200 bg-white py-1.5 shadow-xl text-xs space-y-0.5 text-left"
                        >
                          <p className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            Chọn dạng câu hỏi
                          </p>
                          <button
                            onClick={() => handleAddQuestion("multiple_choice")}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 text-slate-800"
                          >
                            <span className="flex h-5 w-5 items-center justify-center rounded bg-blue-50 text-[11px] font-bold text-blue-600">MCQ</span>
                            <div>
                              <p className="font-semibold">Trắc nghiệm 4 lựa chọn</p>
                              <p className="text-[10px] text-slate-400">Phương án A, B, C, D</p>
                            </div>
                          </button>
                          <button
                            onClick={() => handleAddQuestion("true_false")}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 text-slate-800"
                          >
                            <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald-50 text-[11px] font-bold text-emerald-600">Đ/S</span>
                            <div>
                              <p className="font-semibold">Trắc nghiệm Đúng / Sai</p>
                              <p className="text-[10px] text-slate-400">4 khẳng định a, b, c, d</p>
                            </div>
                          </button>
                          <button
                            onClick={() => handleAddQuestion("short_answer")}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 text-slate-800"
                          >
                            <span className="flex h-5 w-5 items-center justify-center rounded bg-amber-50 text-[11px] font-bold text-amber-600">TN</span>
                            <div>
                              <p className="font-semibold">Câu trả lời ngắn</p>
                              <p className="text-[10px] text-slate-400">Điền đáp số vào ô trống</p>
                            </div>
                          </button>
                          <button
                            onClick={() => handleAddQuestion("essay")}
                            className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 text-slate-800"
                          >
                            <span className="flex h-5 w-5 items-center justify-center rounded bg-purple-50 text-[11px] font-bold text-purple-600">TL</span>
                            <div>
                              <p className="font-semibold">Câu hỏi Tự luận</p>
                              <p className="text-[10px] text-slate-400">Đề bài kèm barem điểm</p>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => executeAiGenerate("Soạn đề giữa kì I Hóa học 9 gồm trắc nghiệm, đúng-sai và tự luận, thang điểm 10 kèm đáp án chi tiết")}
                      className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
                    >
                      <Sparkles className="h-4 w-4" /> AI tạo đề mẫu ngay
                    </button>
                  </div>
                </div>
              ) : (
                /* Render questions list */
                questions.map((q, idx) => {
                  const opts = (typeof q.options === "object" && q.options !== null ? q.options : {}) as Record<string, string>;
                  const isEditingThis = editingQuestionId === q.id;

                  // 1. Custom Header
                  if (q.blockType === "header_custom") {
                    return (
                      <div key={q.id} id={`question-anchor-${idx}`} className="group relative mb-4 rounded-lg border border-transparent p-2 transition hover:border-slate-200 hover:bg-slate-50/50">
                        <div className="absolute top-1 right-1 hidden items-center gap-1 rounded-md border border-slate-200 bg-white p-1 shadow-sm group-hover:flex print:hidden">
                          <button onClick={() => handleDeleteQuestion(q.id)} title="Xóa đầu đề" className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {q.headerType === "two_col" && (
                          <div className="grid grid-cols-2 gap-4 border-b-2 border-slate-800 pb-3 text-center">
                            <div className="text-xs font-semibold uppercase leading-relaxed text-slate-800">
                              <p>SỞ GIÁO DỤC VÀ ĐÀO TẠO ...</p>
                              <p className="font-bold">TRƯỜNG THPT CHUYÊN ...</p>
                              <p className="font-normal text-[11px] text-slate-600">ĐỀ THI KHẢO SÁT CHẤT LƯỢNG</p>
                            </div>
                            <div className="text-xs font-semibold uppercase leading-relaxed text-slate-800">
                              <p className="font-bold">KỲ THI TỐT NGHIỆP THPT NĂM 2025</p>
                              <p className="text-primary font-bold">MÔN THI: {subject.toUpperCase()}</p>
                              <p className="font-normal text-[11px] text-slate-600">Thời gian làm bài: 90 phút (không kể phát đề)</p>
                            </div>
                          </div>
                        )}
                        {q.headerType === "centered" && (
                          <div className="text-center border-b-2 border-slate-800 pb-3">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-600">BỘ GIÁO DỤC VÀ ĐÀO TẠO</p>
                            <h2 className="text-sm sm:text-base font-extrabold uppercase mt-1 text-slate-900">
                              ĐỀ THI THAM KHẢO KỲ THI TỐT NGHIỆP TRUNG HỌC PHỔ THÔNG NĂM 2025
                            </h2>
                            <p className="text-xs font-semibold text-slate-700 mt-1">
                              Môn: {subject} - Lớp {grade} | Thời gian làm bài: 90 phút
                            </p>
                          </div>
                        )}
                        {q.headerType === "student_info" && (
                          <div className="rounded border border-slate-300 p-2.5 text-xs text-slate-800 bg-white">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>Họ và tên thí sinh: ....................................................................................</div>
                              <div>Số báo danh: .....................</div>
                              <div>Mã đề: <span className="font-bold">101</span></div>
                            </div>
                          </div>
                        )}
                        {q.headerType === "grading_guide" && (
                          <div className="text-center border-b-2 border-slate-800 pb-2">
                            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-900">HƯỚNG DẪN CHẤM VÀ BIỂU ĐIỂM CHI TIẾT</h3>
                            <p className="text-[11px] text-slate-500 italic mt-0.5">(Tài liệu lưu hành nội bộ - Bản dành cho giáo viên)</p>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // 2. Section Title
                  if (q.blockType === "section_title") {
                    return (
                      <div key={q.id} id={`question-anchor-${idx}`} className="group relative my-3">
                        <div className="absolute top-1 right-1 hidden items-center gap-1 rounded-md border border-slate-200 bg-white p-1 shadow-sm group-hover:flex print:hidden">
                          <button onClick={() => handleDeleteQuestion(q.id)} title="Xóa phần" className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="rounded-md bg-slate-100/90 px-3.5 py-2 font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wide border-l-4 border-slate-800">
                          {q.sectionTitle || q.content}
                        </div>
                      </div>
                    );
                  }

                  // 2b. Heading 2 (Tiêu đề 2)
                  if (q.blockType === "heading_2") {
                    return (
                      <div key={q.id} id={`question-anchor-${idx}`} className="group relative my-3">
                        <div className="absolute top-1 right-1 hidden items-center gap-1 rounded-md border border-slate-200 bg-white p-1 shadow-sm group-hover:flex print:hidden">
                          <button onClick={() => handleDeleteQuestion(q.id)} title="Xóa đề mục" className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <h2 className="font-bold text-slate-800 text-sm sm:text-base border-b border-slate-200 pb-1">
                          {q.content}
                        </h2>
                      </div>
                    );
                  }

                  // 2c. Heading 3 (Tiêu đề 3)
                  if (q.blockType === "heading_3") {
                    return (
                      <div key={q.id} id={`question-anchor-${idx}`} className="group relative my-2">
                        <div className="absolute top-1 right-1 hidden items-center gap-1 rounded-md border border-slate-200 bg-white p-1 shadow-sm group-hover:flex print:hidden">
                          <button onClick={() => handleDeleteQuestion(q.id)} title="Xóa tiểu mục" className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <h3 className="font-semibold text-slate-700 text-xs sm:text-sm">
                          {q.content}
                        </h3>
                      </div>
                    );
                  }

                  // 3. Divider
                  if (q.blockType === "divider") {
                    return (
                      <div key={q.id} id={`question-anchor-${idx}`} className="group relative my-4">
                        <div className="absolute -top-3 right-1 hidden items-center rounded-md border border-slate-200 bg-white p-0.5 shadow-sm group-hover:flex print:hidden">
                          <button onClick={() => handleDeleteQuestion(q.id)} title="Xóa đường kẻ" className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        <hr className="border-t-2 border-slate-300" />
                      </div>
                    );
                  }

                  // 4. Page Break
                  if (q.blockType === "page_break") {
                    return (
                      <div key={q.id} id={`question-anchor-${idx}`} className="group relative my-6">
                        <div className="absolute top-0 right-1 hidden items-center rounded-md border border-slate-200 bg-white p-0.5 shadow-sm group-hover:flex print:hidden">
                          <button onClick={() => handleDeleteQuestion(q.id)} title="Xóa ngắt trang" className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="border-b-2 border-dashed border-slate-300 py-1.5 text-center text-[11px] text-slate-400 font-mono tracking-widest bg-slate-50/70 select-none">
                          --- NGẮT TRANG (TRANG MỚI) ---
                        </div>
                      </div>
                    );
                  }

                  // 5. Callout / Notice
                  if (q.blockType === "callout") {
                    return (
                      <div key={q.id} id={`question-anchor-${idx}`} className="group relative my-3">
                        <div className="absolute top-2 right-2 hidden items-center rounded-md border border-slate-200 bg-white p-1 shadow-sm group-hover:flex print:hidden">
                          <button onClick={() => handleDeleteQuestion(q.id)} title="Xóa ghi chú" className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="rounded-lg border border-amber-300 bg-amber-50/90 p-3 text-xs text-amber-900 font-medium flex items-start gap-2.5 shadow-sm">
                          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                          <div className="leading-relaxed">{q.content}</div>
                        </div>
                      </div>
                    );
                  }

                  // 6. Dotted Lines
                  if (q.blockType === "dotted_lines") {
                    return (
                      <div key={q.id} id={`question-anchor-${idx}`} className="group relative my-3">
                        <div className="absolute top-0 right-1 hidden items-center rounded-md border border-slate-200 bg-white p-1 shadow-sm group-hover:flex print:hidden">
                          <button onClick={() => handleDeleteQuestion(q.id)} title="Xóa dòng kẻ chấm" className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="space-y-3.5 py-2 text-slate-400 font-mono tracking-[0.25em] text-xs select-none">
                          <div>...................................................................................................................................</div>
                          <div>...................................................................................................................................</div>
                          <div>...................................................................................................................................</div>
                        </div>
                      </div>
                    );
                  }

                  // 7. Bubble Sheet
                  if (q.blockType === "bubble_sheet") {
                    return (
                      <div key={q.id} id={`question-anchor-${idx}`} className="group relative my-4 rounded-lg border border-slate-300 bg-white p-4">
                        <div className="absolute top-2 right-2 hidden items-center rounded-md border border-slate-200 bg-white p-1 shadow-sm group-hover:flex print:hidden">
                          <button onClick={() => handleDeleteQuestion(q.id)} title="Xóa phiếu" className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <h4 className="text-center text-xs font-bold uppercase tracking-wider mb-3 text-slate-800">PHIẾU TRẢ LỜI TRẮC NGHIỆM</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                          {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-1.5 border border-slate-200 rounded p-1.5 justify-between">
                              <span className="font-semibold text-slate-700">{i + 1}</span>
                              <div className="flex gap-1">
                                {["A", "B", "C", "D"].map((c) => (
                                  <span key={c} className="h-5 w-5 rounded-full border border-slate-400 flex items-center justify-center text-[10px] text-slate-600 hover:bg-slate-800 hover:text-white cursor-pointer select-none">
                                    {c}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  // 8. Image
                  if (q.blockType === "image") {
                    return (
                      <div key={q.id} id={`question-anchor-${idx}`} className="group relative my-4 flex flex-col items-center">
                        <div className="absolute top-2 right-2 hidden items-center rounded-md border border-slate-200 bg-white p-1 shadow-sm group-hover:flex print:hidden">
                          <button onClick={() => handleDeleteQuestion(q.id)} title="Xóa hình" className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {q.imageUrl && (
                          <img src={q.imageUrl} alt="Hình minh họa" className="max-h-80 max-w-full rounded border border-slate-200 shadow-sm" />
                        )}
                      </div>
                    );
                  }

                  // 9. Table
                  if (q.blockType === "table") {
                    return (
                      <div key={q.id} id={`question-anchor-${idx}`} className="group relative my-3">
                        <div className="absolute top-1 right-1 hidden items-center gap-1 rounded-md border border-slate-200 bg-white p-1 shadow-sm group-hover:flex print:hidden">
                          <button onClick={() => handleDeleteQuestion(q.id)} title="Xóa bảng" className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {q.content && <p className="text-xs font-semibold text-slate-800 mb-2">{q.content}</p>}
                        <div className="overflow-x-auto rounded border border-slate-300">
                          <table className="w-full text-xs border-collapse">
                            <tbody>
                              {(q.tableRows || [["Ô 1", "Ô 2"], ["Ô 3", "Ô 4"]]).map((row, rIdx) => (
                                <tr key={rIdx} className={rIdx === 0 ? "bg-slate-100 font-semibold" : ""}>
                                  {row.map((cell, cIdx) => (
                                    <td key={cIdx} className="border border-slate-300 p-2 text-center text-slate-700">
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  }

                  // 10. Passage
                  if (q.blockType === "passage") {
                    return (
                      <div key={q.id} id={`question-anchor-${idx}`} className="group relative rounded-lg border border-transparent p-3 transition hover:border-slate-200 hover:bg-slate-50/50">
                        <div className="absolute top-2 right-2 hidden items-center gap-1 rounded-md border border-slate-200 bg-white p-1 shadow-sm group-hover:flex print:hidden">
                          <button onClick={() => handleStartEdit(q)} title="Sửa câu" className="rounded p-1 text-slate-500 hover:bg-slate-100"><Edit3 className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDeleteQuestion(q.id)} title="Xóa" className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                        {q.passageContent && (
                          <div className="mb-3 rounded-r-md border-l-4 border-blue-500 bg-blue-50/40 p-3.5 text-xs text-slate-700 leading-relaxed italic">
                            <p className="font-bold not-italic text-blue-900 mb-1">Đoạn ngữ liệu:</p>
                            {q.passageContent}
                          </div>
                        )}
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-slate-900 shrink-0">Câu {idx + 1}.</span>
                          <div className="flex-1 leading-relaxed text-slate-800"><LatexRenderer content={q.content} /></div>
                        </div>
                        {Object.keys(opts).length > 0 && (
                          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 pl-6 sm:grid-cols-4">
                            {["A", "B", "C", "D"].map((key) => {
                              if (!opts[key]) return null;
                              const isCorrect = q.correct_answer === key;
                              return (
                                <div key={key} className={`flex items-start gap-1.5 text-slate-800 ${teacherMode && isCorrect ? "font-semibold text-green-700 underline underline-offset-4" : ""}`}>
                                  <span className="font-bold">{key}.</span>
                                  <div><LatexRenderer content={opts[key]} /></div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  // 11. True / False (Format 2025)
                  if (q.blockType === "true_false") {
                    return (
                      <div key={q.id} id={`question-anchor-${idx}`} className="group relative rounded-lg border border-transparent p-3 transition hover:border-slate-200 hover:bg-slate-50/50">
                        <div className="absolute top-2 right-2 flex items-center gap-1 rounded-lg border border-slate-200/90 bg-white/95 backdrop-blur-xs p-0.5 shadow-xs opacity-60 group-hover:opacity-100 focus-within:opacity-100 transition-opacity print:hidden z-10">
                          <button onClick={() => handleStartEdit(q)} title="Chỉnh sửa câu hỏi" className="h-7 w-7 flex items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"><Edit3 className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDuplicateQuestion(q)} title="Nhân bản câu hỏi" className="h-7 w-7 flex items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"><Copy className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDeleteQuestion(q.id)} title="Xóa câu hỏi" className="h-7 w-7 flex items-center justify-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="font-bold text-slate-900">Câu {idx + 1}.</span>
                            {renderQuestionTypeBadge(q)}
                          </div>
                          <div className="flex-1 leading-relaxed text-slate-800"><LatexRenderer content={q.content} /></div>
                        </div>
                        <div className="mt-3 overflow-hidden rounded border border-slate-200">
                          <table className="w-full text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200">
                              <tr>
                                <th className="p-2 text-left font-semibold text-slate-700">Mệnh đề / Khẳng định</th>
                                <th className="p-2 w-20 text-center font-semibold text-slate-700">Đúng</th>
                                <th className="p-2 w-20 text-center font-semibold text-slate-700">Sai</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {(q.trueFalseItems || []).map((tf, tfIdx) => (
                                <tr key={tfIdx} className="hover:bg-slate-50/50">
                                  <td className="p-2 text-slate-800">
                                    <span className="font-bold">{tf.label})</span> <LatexRenderer content={tf.statement} />
                                  </td>
                                  <td className="p-2 text-center">
                                    {teacherMode && tf.isCorrect ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs">
                                        <Check className="h-3.5 w-3.5" /> Đúng
                                      </span>
                                    ) : (
                                      <div className="h-4 w-4 rounded-full border-2 border-slate-300 mx-auto" />
                                    )}
                                  </td>
                                  <td className="p-2 text-center">
                                    {teacherMode && !tf.isCorrect ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-100 text-rose-800 border border-rose-300 font-bold text-xs">
                                        <X className="h-3.5 w-3.5" /> Sai
                                      </span>
                                    ) : (
                                      <div className="h-4 w-4 rounded-full border-2 border-slate-300 mx-auto" />
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {teacherMode && q.explanation && (
                          <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/40 p-3 text-xs text-slate-700 print:hidden">
                            <div className="flex items-center gap-1.5 font-semibold text-blue-800 mb-1">
                              <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                              <span>Đáp án: {q.correct_answer}</span>
                            </div>
                            <div className="leading-relaxed"><LatexRenderer content={q.explanation} /></div>
                          </div>
                        )}

                        {renderInlineEditForm(q, idx)}
                      </div>
                    );
                  }

                  // 12. Short Answer (Format 2025)
                  if (q.blockType === "short_answer") {
                    return (
                      <div key={q.id} id={`question-anchor-${idx}`} className="group relative rounded-lg border border-transparent p-3 transition hover:border-slate-200 hover:bg-slate-50/50">
                        <div className="absolute top-2 right-2 flex items-center gap-1 rounded-lg border border-slate-200/90 bg-white/95 backdrop-blur-xs p-0.5 shadow-xs opacity-60 group-hover:opacity-100 focus-within:opacity-100 transition-opacity print:hidden z-10">
                          <button onClick={() => handleStartEdit(q)} title="Chỉnh sửa câu hỏi" className="h-7 w-7 flex items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"><Edit3 className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDuplicateQuestion(q)} title="Nhân bản câu hỏi" className="h-7 w-7 flex items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"><Copy className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDeleteQuestion(q.id)} title="Xóa câu hỏi" className="h-7 w-7 flex items-center justify-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="font-bold text-slate-900">Câu {idx + 1}.</span>
                            {renderQuestionTypeBadge(q)}
                          </div>
                          <div className="flex-1 leading-relaxed text-slate-800"><LatexRenderer content={q.content} /></div>
                        </div>
                        <div className="mt-3 flex items-center gap-3 text-xs pl-6">
                          <span className="font-semibold text-slate-700">Đáp số:</span>
                          <div className="h-8 w-36 rounded border border-slate-300 bg-slate-50/50 flex items-center justify-center font-mono font-bold text-slate-800">
                            {teacherMode ? q.correct_answer : ""}
                          </div>
                        </div>
                        {teacherMode && q.explanation && (
                          <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/40 p-3 text-xs text-slate-700 print:hidden">
                            <div className="flex items-center gap-1.5 font-semibold text-blue-800 mb-1">
                              <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                              <span>Lời giải chi tiết:</span>
                            </div>
                            <div className="leading-relaxed"><LatexRenderer content={q.explanation} /></div>
                          </div>
                        )}

                        {renderInlineEditForm(q, idx)}
                      </div>
                    );
                  }

                  // 13. Essay
                  if (q.blockType === "essay") {
                    return (
                      <div key={q.id} id={`question-anchor-${idx}`} className="group relative rounded-lg border border-transparent p-3 transition hover:border-slate-200 hover:bg-slate-50/50">
                        <div className="absolute top-2 right-2 flex items-center gap-1 rounded-lg border border-slate-200/90 bg-white/95 backdrop-blur-xs p-0.5 shadow-xs opacity-60 group-hover:opacity-100 focus-within:opacity-100 transition-opacity print:hidden z-10">
                          <button onClick={() => handleStartEdit(q)} title="Chỉnh sửa câu hỏi" className="h-7 w-7 flex items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"><Edit3 className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDuplicateQuestion(q)} title="Nhân bản câu hỏi" className="h-7 w-7 flex items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"><Copy className="h-3.5 w-3.5" /></button>
                          <button onClick={() => handleDeleteQuestion(q.id)} title="Xóa câu hỏi" className="h-7 w-7 flex items-center justify-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="font-bold text-slate-900">Câu {idx + 1}.</span>
                            {renderQuestionTypeBadge(q)}
                          </div>
                          <div className="flex-1 leading-relaxed text-slate-800 font-normal"><LatexRenderer content={q.content} /></div>
                        </div>
                        <div className="mt-3 space-y-3 py-2 text-slate-300 font-mono tracking-widest text-xs select-none">
                          <div>...................................................................................................................................</div>
                          <div>...................................................................................................................................</div>
                        </div>
                        {teacherMode && (q.explanation || q.correct_answer) && (
                          <div className="mt-3.5 rounded-lg border border-blue-100 bg-blue-50/40 p-3 text-xs text-slate-700 print:hidden">
                            <div className="flex items-center gap-1.5 font-semibold text-blue-800 mb-1">
                              <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                              <span>Hướng dẫn giải:</span>
                            </div>
                            <div className="leading-relaxed"><LatexRenderer content={q.explanation || q.correct_answer || ""} /></div>
                          </div>
                        )}

                        {renderInlineEditForm(q, idx)}
                      </div>
                    );
                  }

                  // Formula Standalone Block
                  if (q.blockType === "formula") {
                    return (
                      <div key={q.id} id={`question-anchor-${idx}`} className="group relative my-3 rounded-lg border border-transparent p-2 transition hover:border-blue-200 hover:bg-blue-50/20">
                        <div className="absolute top-1 right-1 hidden items-center gap-1 rounded-md border border-slate-200 bg-white p-1 shadow-sm group-hover:flex print:hidden">
                          <button onClick={() => handleOpenFormulaModalForEdit(q)} title="Sửa công thức" className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDeleteQuestion(q.id)} title="Xóa công thức" className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="flex justify-center py-2 cursor-pointer" onClick={() => handleOpenFormulaModalForEdit(q)}>
                          <LatexRenderer content={q.content} />
                        </div>
                      </div>
                    );
                  }

                  // Rubric Table Block
                  if (q.blockType === "rubric_table") {
                    return (
                      <div key={q.id} id={`question-anchor-${idx}`} className="group relative my-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                        <div className="absolute top-2 right-2 hidden items-center gap-1 rounded-md border border-slate-200 bg-white p-1 shadow-sm group-hover:flex print:hidden">
                          <button onClick={() => handleDeleteQuestion(q.id)} title="Xóa barem" className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mb-2 font-bold text-xs uppercase tracking-wide text-slate-800">
                          <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                          <span>{q.content || "Bảng barem điểm chi tiết"}</span>
                        </div>
                        <div className="overflow-x-auto rounded border border-slate-300">
                          <table className="w-full text-xs border-collapse">
                            <tbody>
                              {(q.tableRows || [
                                ["Ý / Câu", "Nội dung đáp án & Phương pháp giải", "Điểm"],
                                ["a)", "Viết đúng công thức / phương trình", "0.25"],
                                ["b)", "Thay số, tính toán và giải thích", "0.50"],
                                ["c)", "Kết luận và đối chiếu điều kiện", "0.25"],
                              ]).map((row, rIdx) => (
                                <tr key={rIdx} className={rIdx === 0 ? "bg-slate-100 font-bold text-slate-800" : "hover:bg-slate-50"}>
                                  {row.map((cell, cIdx) => (
                                    <td key={cIdx} className={`border border-slate-300 p-2 ${cIdx === row.length - 1 ? "text-center font-semibold" : "text-left"} text-slate-700`}>
                                      <LatexRenderer content={cell} />
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  }

                  // Rubric With Geometry Block
                  if (q.blockType === "rubric_with_geometry") {
                    return (
                      <div key={q.id} id={`question-anchor-${idx}`} className="group relative my-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                        <div className="absolute top-2 right-2 hidden items-center gap-1 rounded-md border border-slate-200 bg-white p-1 shadow-sm group-hover:flex print:hidden">
                          <button onClick={() => handleDeleteQuestion(q.id)} title="Xóa barem hình học" className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mb-2 font-bold text-xs uppercase tracking-wide text-slate-800">
                          <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                          <span>{q.content || "Barem điểm bài toán hình học"}</span>
                        </div>
                        <div
                          className="my-3 flex justify-center cursor-pointer transition hover:opacity-95"
                          title="Bấm để chỉnh sửa hình vẽ hình học"
                          onClick={() => {
                            setEditingGeomId(q.id);
                            setCurrentGeomData(q.geometryData || null);
                            setIsGeomModalOpen(true);
                          }}
                        >
                          {q.geometryData ? (
                            <GeometrySvgRenderer data={q.geometryData} />
                          ) : (
                            <GeometryDiagramSvg onDelete={() => handleDeleteQuestion(q.id)} />
                          )}
                        </div>
                        <div className="overflow-x-auto rounded border border-slate-300">
                          <table className="w-full text-xs border-collapse">
                            <tbody>
                              {(q.tableRows || [
                                ["Ý", "Nội dung chứng minh", "Điểm"],
                                ["1", "Vẽ hình đúng, chứng minh tam giác đồng dạng", "0.50"],
                                ["2", "Suy ra hệ thức liên hệ cạnh và đường cao AH", "0.50"],
                              ]).map((row, rIdx) => (
                                <tr key={rIdx} className={rIdx === 0 ? "bg-slate-100 font-bold text-slate-800" : "hover:bg-slate-50"}>
                                  {row.map((cell, cIdx) => (
                                    <td key={cIdx} className={`border border-slate-300 p-2 ${cIdx === row.length - 1 ? "text-center font-semibold" : "text-left"} text-slate-700`}>
                                      <LatexRenderer content={cell} />
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  }

                  // 14. SVG Illustration (Screenshot 2 & 5)
                  if (q.blockType === "svg") {
                    return (
                      <div key={q.id} id={`question-anchor-${idx}`} className="group relative rounded-lg border border-transparent p-3 transition hover:border-slate-200 hover:bg-slate-50/50">
                        <div className="absolute top-2 right-2 hidden items-center gap-1 rounded-md border border-slate-200 bg-white p-1 shadow-sm group-hover:flex print:hidden">
                          <button onClick={() => handleDeleteQuestion(q.id)} title="Xóa hình" className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-slate-900 shrink-0">Câu {idx + 1}.</span>
                          <div className="flex-1 leading-relaxed text-slate-800 font-normal"><LatexRenderer content={q.content} /></div>
                        </div>
                        {/* Centered SVG diagram */}
                        <div className="my-3 flex justify-center">
                          {q.svgType === "sheet_box" && <SheetBoxSvg onDelete={() => handleDeleteQuestion(q.id)} />}
                          {q.svgType === "heater" && <HeaterCircuitSvg onDelete={() => handleDeleteQuestion(q.id)} />}
                          {q.svgType === "radiation" && <RadiationHazardSvg onDelete={() => handleDeleteQuestion(q.id)} />}
                          {q.svgType === "variation_table" && (
                            <div
                              className="cursor-pointer transition hover:opacity-95"
                              title="Bấm để chỉnh sửa bảng biến thiên"
                              onClick={() => {
                                setEditingVarTableId(q.id);
                                setCurrentVarTableData(q.variationTableData || null);
                                setIsVarTableModalOpen(true);
                              }}
                            >
                              {q.variationTableData ? (
                                <VariationTableRenderer data={q.variationTableData} />
                              ) : (
                                <VariationTableSvg onDelete={() => handleDeleteQuestion(q.id)} />
                              )}
                            </div>
                          )}
                          {q.svgType === "function_graph" && (
                            <div
                              className="cursor-pointer transition hover:opacity-95"
                              title="Bấm để chỉnh sửa đồ thị hàm số"
                              onClick={() => {
                                setEditingGraphId(q.id);
                                setCurrentGraphData(q.functionGraphData || null);
                                setIsGraphModalOpen(true);
                              }}
                            >
                              {q.functionGraphData ? (
                                <FunctionGraphRenderer data={q.functionGraphData} />
                              ) : (
                                <FunctionGraphSvg onDelete={() => handleDeleteQuestion(q.id)} />
                              )}
                            </div>
                          )}
                          {q.svgType === "chart" && (
                            <div
                              className="cursor-pointer transition hover:opacity-95"
                              title="Bấm để chỉnh sửa biểu đồ thống kê"
                              onClick={() => {
                                setEditingChartId(q.id);
                                setCurrentChartData(q.chartData || null);
                                setIsChartModalOpen(true);
                              }}
                            >
                              {q.chartData ? (
                                <ChartSvgRenderer data={q.chartData} />
                              ) : (
                                <StatisticsChartSvg onDelete={() => handleDeleteQuestion(q.id)} />
                              )}
                            </div>
                          )}
                          {q.svgType === "geometry" && (
                            <div
                              className="cursor-pointer transition hover:opacity-95"
                              title="Bấm để chỉnh sửa hình vẽ hình học"
                              onClick={() => {
                                setEditingGeomId(q.id);
                                setCurrentGeomData(q.geometryData || null);
                                setIsGeomModalOpen(true);
                              }}
                            >
                              {q.geometryData ? (
                                <GeometrySvgRenderer data={q.geometryData} />
                              ) : (
                                <GeometryDiagramSvg onDelete={() => handleDeleteQuestion(q.id)} />
                              )}
                            </div>
                          )}
                        </div>
                        {/* Options */}
                        {Object.keys(opts).length > 0 && (
                          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 pl-6 sm:grid-cols-4">
                            {["A", "B", "C", "D"].map((key) => {
                              if (!opts[key]) return null;
                              const isCorrect = q.correct_answer === key;
                              return (
                                <div key={key} className={`flex items-start gap-1.5 text-slate-800 ${teacherMode && isCorrect ? "font-semibold text-green-700 underline underline-offset-4" : ""}`}>
                                  <span className="font-bold">{key}.</span>
                                  <div><LatexRenderer content={opts[key]} /></div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {teacherMode && q.explanation && (
                          <div className="mt-3.5 rounded-lg border border-blue-100 bg-blue-50/40 p-3 text-xs text-slate-700 print:hidden">
                            <div className="flex items-center gap-1.5 font-semibold text-blue-800 mb-1">
                              <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                              <span>Đáp án đúng: {q.correct_answer}</span>
                            </div>
                            <div className="leading-relaxed"><LatexRenderer content={q.explanation} /></div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // 15. Standard MCQ (Default)
                  return (
                    <div
                      key={q.id}
                      id={`question-anchor-${idx}`}
                      className="group relative rounded-lg border border-transparent p-3 transition hover:border-slate-200 hover:bg-slate-50/50"
                    >
                      {/* Floating actions menu */}
                      <div className="absolute top-2 right-2 flex items-center gap-1 rounded-lg border border-slate-200/90 bg-white/95 backdrop-blur-xs p-0.5 shadow-xs opacity-60 group-hover:opacity-100 focus-within:opacity-100 transition-opacity print:hidden z-10">
                        <button
                          onClick={() => handleStartEdit(q)}
                          title="Chỉnh sửa câu hỏi"
                          className="h-7 w-7 flex items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicateQuestion(q)}
                          title="Nhân bản câu hỏi"
                          className="h-7 w-7 flex items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          title="Xóa câu hỏi"
                          className="h-7 w-7 flex items-center justify-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Question Stem */}
                      <div className="flex items-start gap-2">
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="font-bold text-slate-900">
                            Câu {idx + 1}.
                          </span>
                          {renderQuestionTypeBadge(q)}
                        </div>
                        <div className="flex-1 leading-relaxed text-slate-800 font-normal">
                          <LatexRenderer content={q.content} />
                        </div>
                      </div>

                      {/* Options (A, B, C, D) */}
                      {Object.keys(opts).length > 0 && (
                        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 pl-6 sm:grid-cols-4">
                          {["A", "B", "C", "D"].map((key) => {
                            if (!opts[key]) return null;
                            const isCorrect = q.correct_answer === key;

                            return (
                              <div
                                key={key}
                                className={`flex items-start gap-1.5 text-slate-800 ${
                                  teacherMode && isCorrect
                                    ? "font-semibold text-green-700 underline underline-offset-4"
                                    : ""
                                }`}
                              >
                                <span className="font-bold">{key}.</span>
                                <div>
                                  <LatexRenderer content={opts[key]} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Teacher mode: Explanation & Answer */}
                      {teacherMode && q.explanation && (
                        <div className="mt-3.5 rounded-lg border border-blue-100 bg-blue-50/40 p-3 text-xs text-slate-700 print:hidden">
                          <div className="flex items-center gap-1.5 font-semibold text-blue-800 mb-1">
                            <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                            <span>Đáp án đúng: {q.correct_answer}</span>
                          </div>
                          <div className="leading-relaxed">
                            <LatexRenderer content={q.explanation} />
                          </div>
                        </div>
                      )}

                      {/* Inline Edit Form */}
                      {renderInlineEditForm(q, idx)}
                    </div>
                  );
                })
              )}

              {/* End of paper footer */}
              {questions.length > 0 && (
                <div className="pt-8 text-center text-xs text-slate-500 font-semibold tracking-wider">
                  <p>---------- HẾT ----------</p>
                  <p className="mt-1 font-normal italic text-slate-400">
                    Cán bộ coi thi không giải thích gì thêm.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: TRỢ LÝ AI SOẠN ĐỀ (EXACT MATCHING SCREENSHOT)   */}
        {/* ============================================================ */}
        {/* Right Resizer Drag Handle */}
        {aiSidebarOpen && (
          <div
            onMouseDown={() => setIsDraggingRight(true)}
            className="w-1.5 cursor-col-resize hover:w-2 hover:bg-primary/50 active:bg-primary bg-slate-200 transition-all shrink-0 z-20 select-none"
            title="Kéo sang trái/phải để chỉnh độ rộng bảng Trợ lý AI"
          />
        )}

        {/* Responsive backdrop for tablet & mobile (CRT-16) */}
        {aiSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
            onClick={() => setAiSidebarOpen(false)}
          />
        )}
        {aiSidebarOpen ? (
          <aside
            style={{ width: `${rightWidth}px` }}
            className="fixed inset-y-0 right-0 z-50 flex shrink-0 flex-col border-l border-slate-200 bg-white shadow-2xl lg:static lg:z-auto lg:shadow-none"
          >
            {/* Header: Title + Trí nhớ badge + Actions */}
            <div className="flex h-12 items-center justify-between border-b border-slate-100 px-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-800">Trợ lý AI soạn đề</span>
                <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                  Trí nhớ
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setAiStatusMessage(null);
                    setAiPrompt("");
      setAttachedImage(null);
      setAttachedDoc(null);
                  }}
                  title="Làm mới cuộc trò chuyện"
                  className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setAiSidebarOpen(false)}
                  title="Đóng trợ lý AI"
                  className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Headline with 1-line clean title */}
              <div className="py-1 text-center">
                <h3 className="text-sm font-bold leading-normal text-blue-600 truncate">
                  {`Soạn đề ${subject || "Toán"} ${grade || "12"} theo cấu trúc nào Thầy/Cô nhỉ?`}
                </h3>
              </div>

              {/* Status Message */}
              {aiStatusMessage && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800 shadow-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-600 shrink-0" />
                  <span>{aiStatusMessage}</span>
                </div>
              )}

              {/* Suggestions Cards (Exact matching user screenshot) */}
              <div className="space-y-2.5">
                {/* Card 1 */}
                <div
                  onClick={() =>
                    handleSelectSuggestion(
                      `Soạn đề kiểm tra ${subject || "Toán"} ${grade || "12"} chuẩn Bộ GD&ĐT gồm 3 phần: Trắc nghiệm 4 lựa chọn, Đúng/Sai và Trả lời ngắn, thang điểm 10 kèm đáp án chi tiết`
                    )
                  }
                  className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:border-blue-400 hover:shadow-md"
                >
                  <p className="text-xs font-medium leading-relaxed text-slate-700 group-hover:text-blue-600">
                    {`Soạn đề kiểm tra ${subject || "Toán"} ${grade || "12"} chuẩn GDPT 2025: Trắc nghiệm, Đúng/Sai, Trả lời ngắn, thang điểm 10 kèm đáp án chi tiết`}
                  </p>
                  <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium text-purple-700">
                    <Clock className="h-3 w-3" />
                    <span>Theo môn & khối lớp của bạn</span>
                  </div>
                </div>

                {/* Card 2 */}
                <div
                  onClick={() =>
                    handleSelectSuggestion(
                      `Ra 3 mã đề ${subject || "Toán"} ${grade || "12"} song song có độ khó tương đương, mức 8+, 9+, 10 điểm có câu vận dụng thực tế`
                    )
                  }
                  className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:border-blue-400 hover:shadow-md"
                >
                  <p className="text-xs font-medium leading-relaxed text-slate-700 group-hover:text-blue-600">
                    {`Ra 3 mã đề ${subject || "Toán"} ${grade || "12"} song song, mức 8+, 9+, 10 điểm, có câu vận dụng thực tế`}
                  </p>
                  <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium text-purple-700">
                    <Clock className="h-3 w-3" />
                    <span>Theo cách bạn hay ra đề</span>
                  </div>
                </div>

                {/* Card 3 */}
                <div
                  onClick={() =>
                    handleSelectSuggestion(
                      `Soạn đề ôn tập học kỳ môn ${subject || "Toán"} ${grade || "12"} bám sát ma trận năng lực, kèm hướng dẫn giải và ma trận đề`
                    )
                  }
                  className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:border-blue-400 hover:shadow-md"
                >
                  <p className="text-xs font-medium leading-relaxed text-slate-700 group-hover:text-blue-600">
                    {`Soạn đề ôn tập ${subject || "Toán"} ${grade || "12"}: ma trận năng lực Bộ GD&ĐT, kèm hướng dẫn giải`}
                  </p>
                  <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium text-amber-600">
                    <Calendar className="h-3 w-3" />
                    <span>Đang mùa kiểm tra định kỳ</span>
                  </div>
                </div>
              </div>

              {/* Source Knowledge Section */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                    NGUỒN CHO TRỢ LÝ
                  </span>
                  <span className="text-[11px] text-slate-400">Chọn đề mẫu, ma trận từ kho tài liệu</span>
                </div>
                <button
                  onClick={() => setActiveLeftTab("templates")}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/80 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                >
                  <Plus className="h-3.5 w-3.5" /> Thêm từ kho
                </button>
              </div>
            </div>

            {/* Bottom Input Area */}
            <div className="p-3 border-t border-slate-100 bg-white">
              {/* Hidden file inputs for OCR and Document attachments */}
              <input
                ref={ocrImageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 10 * 1024 * 1024) {
                    showToast("Vui lòng chọn ảnh dung lượng dưới 10MB", "warning");
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    setAttachedImage({
                      name: file.name,
                      dataUrl: event.target?.result as string,
                      size: `${(file.size / 1024).toFixed(0)} KB`,
                    });
                  };
                  reader.readAsDataURL(file);
                  e.target.value = "";
                }}
              />
              <input
                ref={docAttachmentInputRef}
                type="file"
                accept=".txt,.md,.pdf,.docx,.doc"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 10 * 1024 * 1024) {
                    showToast("Vui lòng chọn tệp dung lượng dưới 10MB", "warning");
                    return;
                  }
                  const sizeStr = `${(file.size / 1024).toFixed(0)} KB`;
                  try {
                    const parsed = await parseDocumentFile(file);
                    if (parsed.error && !parsed.text) {
                      showToast(parsed.error, "error");
                      return;
                    }
                    const textContent = parsed.text || `[Tài liệu: ${file.name} - ${sizeStr}]`;
                    setAttachedDoc({
                      name: file.name,
                      content: textContent,
                      size: `${sizeStr} • ${parsed.charCount.toLocaleString()} ký tự`,
                    });
                    showToast(`Đã trích xuất ${parsed.charCount.toLocaleString()} ký tự từ ${file.name}`, "success");
                  } catch (err: any) {
                    setAttachedDoc({
                      name: file.name,
                      content: `[Tệp đính kèm: ${file.name} - Dung lượng: ${sizeStr}]`,
                      size: sizeStr,
                    });
                  }
                  e.target.value = "";
                }}
              />

              <div className="rounded-2xl border border-slate-300 bg-white p-2.5 shadow-sm focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                {/* Attachment previews (Chips) */}
                {(attachedImage || attachedDoc) && (
                  <div className="flex flex-wrap gap-1.5 mb-2 pb-1.5 border-b border-slate-100">
                    {attachedImage && (
                      <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-2 py-1 text-[11px] text-blue-700 border border-blue-200 shadow-xs">
                        <ImageIcon className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                        <span className="max-w-[120px] truncate font-medium">{attachedImage.name}</span>
                        <span className="text-[10px] text-blue-500">({attachedImage.size})</span>
                        <button
                          type="button"
                          onClick={() => setAttachedImage(null)}
                          className="ml-0.5 rounded-full p-0.5 hover:bg-blue-200 text-blue-600 transition cursor-pointer"
                          title="Gỡ ảnh"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    {attachedDoc && (
                      <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] text-emerald-700 border border-emerald-200 shadow-xs">
                        <Paperclip className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        <span className="max-w-[120px] truncate font-medium">{attachedDoc.name}</span>
                        <span className="text-[10px] text-emerald-500">({attachedDoc.size})</span>
                        <button
                          type="button"
                          onClick={() => setAttachedDoc(null)}
                          className="ml-0.5 rounded-full p-0.5 hover:bg-emerald-200 text-emerald-600 transition cursor-pointer"
                          title="Gỡ tệp"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      executeAiGenerate();
                    }
                  }}
                  placeholder={
                    attachedImage
                      ? "Nhập chỉ dẫn cho ảnh đã tải lên (hoặc nhấn Gửi để AI tự động trích xuất đề)..."
                      : attachedDoc
                      ? "Nhập yêu cầu tạo đề theo tài liệu đính kèm..."
                      : "Nhập yêu cầu tạo, sửa, giải đề thi..."
                  }
                  rows={2}
                  className="w-full resize-none border-none p-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                />

                <div className="mt-2 flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-100">
                  {/* Left: Consolidated "+" Attachment and Modes Menu */}
                  <div className="relative" ref={aiAttachmentMenuRef}>
                    <button
                      type="button"
                      onClick={() => setShowAiAttachmentMenu(!showAiAttachmentMenu)}
                      title="Thêm đính kèm hoặc chế độ nhân bản"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                    </button>

                    {showAiAttachmentMenu && (
                      <div className="absolute left-0 bottom-full mb-1.5 z-50 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl text-xs space-y-0.5 text-left font-normal animate-in fade-in slide-in-from-bottom-1 duration-150">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAiAttachmentMenu(false);
                            ocrImageInputRef.current?.click();
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition cursor-pointer"
                        >
                          <ImageIcon className="h-4 w-4 text-blue-600 shrink-0" />
                          <span className="font-medium">Quét ảnh OCR nhận diện đề</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAiAttachmentMenu(false);
                            docAttachmentInputRef.current?.click();
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 transition cursor-pointer"
                        >
                          <Paperclip className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span className="font-medium">Kẹp file tài liệu (.docx, .pdf)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAiAttachmentMenu(false);
                            if (!isMaxUser(profile)) {
                              setShowUpgradeModal("max");
                              return;
                            }
                            setAiPrompt("Hãy phân tích toàn bộ các câu hỏi hiện có trong đề thi này và tạo ra một đề thi MỚI tương đương (cùng ma trận kiến thức, cùng dạng bài toán và độ khó, nhưng thay đổi toàn bộ số liệu, ngữ cảnh và các phương án gây nhiễu chuẩn Bộ GD&ĐT 2025).");
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-amber-50 text-amber-900 font-semibold transition cursor-pointer"
                        >
                          <Crown className="h-4 w-4 text-amber-600 shrink-0" />
                          <span>Clone đề tương đương (MAX)</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right: Unified AI Model & Effort Selector & Send button */}
                  <div className="flex items-center gap-2 ml-auto">
                    <select
                      value={`${aiModelTier}-${aiThinkingEffort}`}
                      onChange={(e) => {
                        const [m, t] = e.target.value.split("-") as ["medium" | "high", "low" | "medium" | "high"];
                        setAiModelTier(m);
                        setAiThinkingEffort(t);
                      }}
                      aria-label="Cấu hình mô hình AI"
                      className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer shadow-2xs"
                    >
                      <option value="medium-medium">⚡ Flash · Cân bằng (500 cr)</option>
                      <option value="medium-low">⚡ Flash · Siêu tốc (500 cr)</option>
                      <option value="high-medium">✨ Pro · Chuẩn ma trận (1.600 cr)</option>
                      <option value="high-high">🧠 Pro · Suy luận sâu (1.600 cr)</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => executeAiGenerate()}
                      disabled={isGenerating || (!aiPrompt.trim() && !attachedImage && !attachedDoc)}
                      aria-label={isGenerating ? "Đang xử lý yêu cầu sinh đề..." : "Gửi yêu cầu tới AI"}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white shadow-xs transition hover:bg-slate-800 disabled:opacity-40 shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      title="Gửi yêu cầu tới AI"
                    >
                      {isGenerating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowUp className="h-4 w-4 stroke-[2.5]" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <p className="mt-2 text-center text-xs text-slate-500 font-medium">
                Trợ lý AI có thể mắc sai sót. Hãy đối soát kỹ đề thi trước khi in nhé.
              </p>
            </div>
          </aside>
        ) : null}

        {/* Floating AI Assistant Launcher when panel is closed */}
        {!aiSidebarOpen && (
          <button
            onClick={() => setAiSidebarOpen(true)}
            className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 shadow-xl transition-all cursor-pointer hover:scale-105 active:scale-95"
            title="Mở bảng Trợ lý AI soạn đề"
          >
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-bold">Trợ lý AI</span>
          </button>
        )}
      </div>

      {/* Visual Formula Editor Modal (Math & Chemistry) */}
      <FormulaEditorModal
        isOpen={isFormulaModalOpen}
        initialMode={formulaModalMode}
        initialFormula={formulaModalInitialFormula}
        initialDisplayMode={formulaModalDisplayMode}
        onClose={() => setIsFormulaModalOpen(false)}
        onSave={handleSaveFormula}
      />

      {/* Find & Replace Modal (Ctrl+F, Ctrl+H) */}
      <FindReplaceModal
        isOpen={isFindReplaceOpen}
        initialMode={findReplaceMode}
        onClose={() => setIsFindReplaceOpen(false)}
        onFind={handleFind}
        onReplace={handleReplace}
        onReplaceAll={handleReplaceAll}
        matchIndex={searchMatches.length > 0 ? currentMatchIdx + 1 : 0}
        totalMatches={searchMatches.length}
      />

      {/* Variation Table Interactive Modal */}
      <VariationTableModal
        isOpen={isVarTableModalOpen}
        initialData={currentVarTableData}
        onClose={() => setIsVarTableModalOpen(false)}
        onSave={handleSaveVariationTable}
      />

      {/* Function Graph Interactive Modal */}
      <FunctionGraphModal
        isOpen={isGraphModalOpen}
        initialData={currentGraphData}
        onClose={() => setIsGraphModalOpen(false)}
        onSave={handleSaveFunctionGraph}
      />

      {/* Chart Interactive Modal */}
      <ChartEditorModal
        isOpen={isChartModalOpen}
        initialData={currentChartData}
        onClose={() => setIsChartModalOpen(false)}
        onSave={handleSaveChart}
      />

      {/* Geometry Interactive Modal */}
      <GeometryEditorModal
        isOpen={isGeomModalOpen}
        initialData={currentGeomData}
        onClose={() => setIsGeomModalOpen(false)}
        onSave={handleSaveGeometry}
      />

      {/* Quota Exhausted & Viral Referral Modal */}
      <QuotaExhaustedModal
        isOpen={showQuotaModal}
        onClose={() => setShowQuotaModal(false)}
        referralCode={userReferralCode}
        dailyQuota={dailyQuota}
        dailyUsed={dailyUsed}
        userId={user?.id || "TEACHER"}
      />

      {/* Multi-version Exam Shuffler & Answer Matrix Modal */}
      <ShuffleExamModal
        isOpen={showShuffleModal}
        onClose={() => setShowShuffleModal(false)}
        examName={title}
        subject={subject}
        grade={grade}
        durationMinutes={parseInt(duration, 10) || 45}
        originalQuestions={questions}
        isPro={isProUser(profile) || isProUser(user)}
        isMax={isMaxUser(profile) || isMaxUser(user)}
      />

      {/* Share Exam Modal */}
      <ShareExamModal
        isOpen={showShareExamModal}
        onClose={() => setShowShareExamModal(false)}
        examId={examId}
        examTitle={title}
        questionCount={questions.length}
      />

      {/* Upgrade Tier Modal */}
      {showUpgradeModal && (
        <UpgradeTierModal
          isOpen={!!showUpgradeModal}
          onClose={() => setShowUpgradeModal(null)}
          requiredTier={showUpgradeModal}
          onSelectPlan={(plan) => {
            setShowUpgradeModal(null);
            setCheckoutPlan(plan);
          }}
        />
      )}

      {/* Payment Checkout Modal */}
      {checkoutPlan && (
        <PaymentCheckoutModal
          isOpen={!!checkoutPlan}
          onClose={() => setCheckoutPlan(null)}
          selectedPlan={checkoutPlan}
          onSuccess={() => {
            setCheckoutPlan(null);
            setShowUpgradeModal(null);
            window.location.reload();
          }}
        />
      )}

      {/* Non-blocking Toast Notification (WCAG aria-live polite) */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-xl transition-all animate-in fade-in slide-in-from-bottom-2 duration-200"
          style={{
            backgroundColor:
              toast.type === "success"
                ? "#f0fdf4"
                : toast.type === "error"
                ? "#fef2f2"
                : toast.type === "warning"
                ? "#fffbeb"
                : "#ffffff",
            borderColor:
              toast.type === "success"
                ? "#bbf7d0"
                : toast.type === "error"
                ? "#fecaca"
                : toast.type === "warning"
                ? "#fde68a"
                : "#e2e8f0",
            color:
              toast.type === "success"
                ? "#15803d"
                : toast.type === "error"
                ? "#b91c1c"
                : toast.type === "warning"
                ? "#b45309"
                : "#1e293b",
          }}
        >
          {toast.type === "success" && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />}
          {toast.type === "error" && <AlertCircle className="h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />}
          {toast.type === "warning" && <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />}
          {(!toast.type || toast.type === "info") && <Sparkles className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}
          <span className="font-medium">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 rounded p-1 hover:bg-black/5 transition cursor-pointer"
            aria-label="Đóng thông báo"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
