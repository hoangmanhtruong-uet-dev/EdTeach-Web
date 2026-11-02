"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Lightbulb,
  FileCode2,
  CheckCircle2,
  Sparkles,
  Camera,
  Trash2,
  Crown,
  Type,
  Eye,
  EyeOff,
  Layers,
  BookOpen,
  Columns2,
  HelpCircle,
  Loader2,
  Play,
  Pause,
  RotateCcw,
  Timer,
  Wand2,
  Flame,
  ShieldAlert,
  Cpu,
  Calculator,
  ExternalLink,
  FlaskConical,
  GraduationCap,
  AlertTriangle,
  GripVertical,
  PenTool,
} from "lucide-react";
import { TransparentWhiteboardOverlay } from "@/components/labs/transparent-whiteboard-overlay";
import { getExamById, ExamWithQuestions, Question } from "@/lib/api/exams";
import { getTeachWhiteboard, saveTeachWhiteboard } from "@/lib/api/whiteboard";
import { useAuth } from "@/context/auth-context";
import { isProUser, isMaxUser, PricingPlan } from "@/lib/payment/plans";
import { LatexRenderer } from "@/components/ui/latex-renderer";
import { LABS, LabLesson, SUBJECT_LABEL } from "@/data/labs";
import { UpgradeTierModal } from "@/components/modals/upgrade-tier-modal";
import { PaymentCheckoutModal } from "@/components/modals/payment-checkout-modal";

// Dynamic import Excalidraw Canvas (Client-only)
const WhiteboardCanvas = dynamic(
  () => import("@/components/whiteboard/whiteboard-canvas"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-muted/10">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <p className="text-xs font-semibold">Đang chuẩn bị Bảng nháp Excalidraw…</p>
        </div>
      </div>
    ),
  }
);

type ExcalidrawAPI = {
  getSceneElements: () => unknown[];
  updateScene: (sceneData: { elements?: unknown[]; appState?: Record<string, unknown> }) => void;
};

const EMPTY_DRAWING_ELEMENTS: Record<string, unknown>[] = [];

// Keyword mapping helper for 3D Labs
function findAutoMatchingLab(content: string, subject?: string): LabLesson | null {
  if (!content) return null;
  const lower = content.toLowerCase();

  // 1. Direct keyword match
  const keywordMatches: Array<{ keywords: string[]; slug: string }> = [
    { keywords: ["quang điện", "lượng tử", "hạt photon", "công thoát"], slug: "photoelectric-step" },
    { keywords: ["tụ điện", "điện dung", "nạp điện", "phóng điện", "điện trường"], slug: "capacitor-step" },
    { keywords: ["lực lorenxơ", "lorentz", "từ trường", "hạt mang điện"], slug: "lorentz-force-step" },
    { keywords: ["sóng cơ", "sóng dừng", "giao thoa sóng", "bước sóng"], slug: "wave-superposition-step" },
    { keywords: ["khúc xạ", "phản xạ toàn phần", "chiết suất", "lăng kính"], slug: "refraction-step" },
    { keywords: ["este", "xà phòng hóa", "thủy phân", "chất béo"], slug: "saponification-step" },
    { keywords: ["điện phân", "anot", "catot", "dung dịch cus04"], slug: "electrolysis-step" },
    { keywords: ["axit", "bazo", "ph", "chuẩn độ", "quỳ tím"], slug: "titration-step" },
    { keywords: ["quang hợp", "diệp lục", "lục lạp", "co2"], slug: "photosynthesis-step" },
    { keywords: ["hô hấp", "tế bào", "ty thể", "atp"], slug: "respiration-step" },
    { keywords: ["núi lửa", "mác ma", "phun trào"], slug: "volcano-step" },
    { keywords: ["thổ nhưỡng", "đất", "xói mòn"], slug: "soil-formation-step" },
  ];

  for (const item of keywordMatches) {
    if (item.keywords.some((kw) => lower.includes(kw))) {
      const found = LABS.find((l) => l.slug === item.slug);
      if (found) return found;
    }
  }

  // 2. Fallback by subject
  if (subject) {
    const subLower = subject.toLowerCase();
    if (subLower.includes("lý") || subLower.includes("vật")) {
      return LABS.find((l) => l.subject === "phys") || null;
    }
    if (subLower.includes("hóa")) {
      return LABS.find((l) => l.subject === "chem") || null;
    }
    if (subLower.includes("sinh")) {
      return LABS.find((l) => l.subject === "bio") || null;
    }
    if (subLower.includes("địa")) {
      return LABS.find((l) => l.subject === "geo") || null;
    }
  }

  return LABS[0] || null;
}

function TeachingStudioContent() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const examId = params.examId as string;
  const { user, profile, isLoading: authLoading } = useAuth();

  const isPro = isProUser(profile) || isProUser(user);
  const isMax = isMaxUser(profile) || isMaxUser(user);

  // Upgrade Modal State
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<{ title: string; desc: string } | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<PricingPlan | null>(null);

  const requireMax = (featureTitle: string, featureDesc: string): boolean => {
    if (!isMax) {
      setUpgradeFeature({ title: featureTitle, desc: featureDesc });
      setUpgradeModalOpen(true);
      return false;
    }
    return true;
  };

  // In-app Toast notification (replacing disruptive browser alerts)
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" | "info" } | null>(null);
  const showToast = useCallback((message: string, type: "error" | "success" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  }, []);

  const [exam, setExam] = useState<ExamWithQuestions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Focus & Hotfix Mode from OMR Grading
  const focusParam = searchParams?.get("focus");
  const isHotfixMode = focusParam === "missed";
  const [hotfixData, setHotfixData] = useState<{
    sessionId: string;
    sessionName: string;
    topMissedQuestions: any[];
    answerKey: Record<number, string>;
    subject?: string;
    grade?: string;
  } | null>(null);

  // Question State
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showFormula, setShowFormula] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Layout & Font Size for Projector
  const [splitRatio, setSplitRatio] = useState<number>(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Dragging handlers for resizable split pane
  const startDragging = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const offsetX = clientX - rect.left;
      let newRatio = Math.round((offsetX / rect.width) * 100);
      // Clamp between 15% and 85%
      newRatio = Math.max(15, Math.min(85, newRatio));
      setSplitRatio(newRatio);
    };

    const handleUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleUp);
    };
  }, [isDragging]);
  const [fontSize, setFontSize] = useState<"md" | "lg" | "xl">("lg");

  // Live Poll State (Sprint 6)
  const [showLivePollModal, setShowLivePollModal] = useState(false);
  const [livePollSession, setLivePollSession] = useState<any | null>(null);
  const [isOpeningPoll, setIsOpeningPoll] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Right Column 3 Tabs: "whiteboard" | "lab3d" | "multi_method"
  const [activeRightTab, setActiveRightTab] = useState<"whiteboard" | "lab3d" | "multi_method">("whiteboard");

  // Per-Question Drawing Storage (using Ref to prevent React re-render loops with Excalidraw onChange)
  const drawingsMapRef = useRef<Record<string, unknown[]>>({});
  const [questionsWithDrawings, setQuestionsWithDrawings] = useState<Record<string, boolean>>({});
  const excalidrawApiRef = useRef<ExcalidrawAPI | null>(null);
  const currentIdxRef = useRef(currentIdx);
  currentIdxRef.current = currentIdx;

  // 3D Lab Selection per question
  const [selectedLabSlug, setSelectedLabSlug] = useState<string>("");
  const [isGlassOverlayActive, setIsGlassOverlayActive] = useState(false);

  // MAX Feature 1: Live Question Cloner
  const [clonedQuestionsMap, setClonedQuestionsMap] = useState<
    Record<string, { content: string; options: string[]; correct_answer: string; explanation: string }>
  >({});
  const [isCloning, setIsCloning] = useState(false);
  const [showClonedTab, setShowClonedTab] = useState<Record<string, boolean>>({});

  // Floating 2-Minute Timer
  const [timerSeconds, setTimerSeconds] = useState(120);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Teach Mode Persistence (Sprint W-1)
  const teachSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const triggerTeachSave = useCallback((newMap: Record<string, unknown[]>) => {
    if (!examId) return;
    // Lưu tức thì LocalStorage
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`edteach_teach_drawings_${examId}`, JSON.stringify(newMap));
      } catch {
        // ignore
      }
    }
    // Debounce lưu Supabase
    if (teachSaveTimerRef.current) {
      clearTimeout(teachSaveTimerRef.current);
    }
    teachSaveTimerRef.current = setTimeout(() => {
      saveTeachWhiteboard(examId, newMap, exam?.name);
    }, 3000);
  }, [examId, exam?.name]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSeconds]);

  // MAX Feature 2: Step-by-Step Scaffolding
  const [scaffoldMap, setScaffoldMap] = useState<
    Record<string, Array<{ step_number: number; title: string; question: string; hint: string }>>
  >({});
  const [isScaffolding, setIsScaffolding] = useState(false);
  const [revealedStepCount, setRevealedStepCount] = useState<Record<string, number>>({});

  // MAX Feature 3: Multi-Method AI Solver
  const [multiMethodMap, setMultiMethodMap] = useState<
    Record<string, Array<{ id: string; name: string; badge: string; summary: string; content: string }>>
  >({});
  const [isSolvingMultiMethod, setIsSolvingMultiMethod] = useState(false);
  const [selectedMethodId, setSelectedMethodId] = useState<string>("tu-luan");

  // Load Exam or Hotfix OMR Session
  useEffect(() => {
    async function loadData() {
      if (!examId) return;
      try {
        setLoading(true);

        // Check if this is an OMR virtual exam session
        let hotfixPayload: any = null;
        if (typeof window !== "undefined") {
          const rawHotfix = sessionStorage.getItem("teach_hotfix_data");
          if (rawHotfix) {
            try {
              hotfixPayload = JSON.parse(rawHotfix);
              setHotfixData(hotfixPayload);
            } catch {
              // ignore
            }
          }
        }

        if (examId.startsWith("omr-") && hotfixPayload) {
          // Construct virtual exam from OMR missed questions
          const missedList = hotfixPayload.topMissedQuestions || [];
          const virtualQuestions: Question[] = missedList.map((m: any, idx: number) => ({
            id: `q_omr_${m.questionNum}`,
            exam_id: examId,
            content: `**Câu ${m.questionNum} (Trích từ bài kiểm tra ${hotfixPayload.sessionName}):**\n\nĐây là câu hỏi có tỷ lệ học sinh làm sai cao nhất lớp (**${m.wrongPct}% sai**, ${m.wrongCount}/${m.total} học sinh bị bẫy ở phương án **${m.mostChosenWrong || "khác"}**). Giáo viên hãy phân tích bẫy và cùng học sinh giải quyết dứt điểm câu hỏi này.`,
            type: "multiple_choice",
            order_index: idx + 1,
            options: [
              `A. Phương án A ${m.correctAns === "A" ? "(Đáp án đúng)" : m.mostChosenWrong === "A" ? "(Bẫy sai phổ biến)" : ""}`,
              `B. Phương án B ${m.correctAns === "B" ? "(Đáp án đúng)" : m.mostChosenWrong === "B" ? "(Bẫy sai phổ biến)" : ""}`,
              `C. Phương án C ${m.correctAns === "C" ? "(Đáp án đúng)" : m.mostChosenWrong === "C" ? "(Bẫy sai phổ biến)" : ""}`,
              `D. Phương án D ${m.correctAns === "D" ? "(Đáp án đúng)" : m.mostChosenWrong === "D" ? "(Bẫy sai phổ biến)" : ""}`,
            ],
            correct_answer: m.correctAns || "A",
            explanation: `Thống kê chấm OMR: Tỷ lệ làm sai ${m.wrongPct}%. Học sinh nhầm lẫn nhiều nhất vào phương án ${m.mostChosenWrong}. Đáp án chính xác theo ma trận là ${m.correctAns}.`,
            difficulty: m.wrongPct >= 50 ? "very_hard" : "hard",
            created_at: new Date().toISOString(),
          }));

          // Tải nét vẽ đã lưu cho OMR virtual exam
          const savedOMRDrawings = await getTeachWhiteboard(examId);
          if (savedOMRDrawings && Object.keys(savedOMRDrawings).length > 0) {
            drawingsMapRef.current = savedOMRDrawings;
            const initMap: Record<string, boolean> = {};
            for (const qId of Object.keys(savedOMRDrawings)) {
              if (savedOMRDrawings[qId]?.length > 0) initMap[qId] = true;
            }
            setQuestionsWithDrawings(initMap);
          }

          setExam({
            id: examId,
            name: `Chữa nóng OMR: ${hotfixPayload.sessionName}`,

            subject: hotfixPayload.subject || "Toán",
            grade: hotfixPayload.grade || "12",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_id: user?.id || "",
            questions: virtualQuestions,
          } as ExamWithQuestions);
          return;
        }

        // Standard Exam from DB
        // Tải nét vẽ đã lưu per-exam (Sprint W-1)
        const savedExamDrawings = await getTeachWhiteboard(examId);
        if (savedExamDrawings && Object.keys(savedExamDrawings).length > 0) {
          drawingsMapRef.current = savedExamDrawings;
          const initMap: Record<string, boolean> = {};
          for (const qId of Object.keys(savedExamDrawings)) {
            if (savedExamDrawings[qId]?.length > 0) initMap[qId] = true;
          }
          setQuestionsWithDrawings(initMap);
        }

        const data: any = await getExamById(examId);
        if (!data) {
          setError("Không tìm thấy đề thi hoặc đề thi đã bị xóa.");
        } else {
          if (data.questions && Array.isArray(data.questions)) {
            data.questions.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));

            // If focus=missed and we have hotfix questions, filter or sort to prioritize missed
            if (isHotfixMode && hotfixPayload?.topMissedQuestions?.length) {
              const missedNums = new Set(hotfixPayload.topMissedQuestions.map((q: any) => Number(q.questionNum)));
              // Reorder questions so that missed ones appear first
              const missedQuestions = data.questions.filter((_: any, i: number) => missedNums.has(i + 1));
              const otherQuestions = data.questions.filter((_: any, i: number) => !missedNums.has(i + 1));
              data.questions = missedQuestions.length > 0 ? [...missedQuestions, ...otherQuestions] : data.questions;
            }
          }
          setExam(data);
        }
      } catch (err: any) {
        setError(err.message || "Lỗi tải đề thi.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [examId, isHotfixMode, user?.id]);

  // Helper save current drawing
  const saveCurrentQuestionDrawing = useCallback(() => {
    if (!excalidrawApiRef.current || !exam?.questions) return;
    const currentQ = exam.questions[currentIdxRef.current];
    if (!currentQ) return;

    try {
      const elements = excalidrawApiRef.current.getSceneElements();
      drawingsMapRef.current[currentQ.id] = elements;
      if (elements && elements.length > 0) {
        setQuestionsWithDrawings((prev) => ({ ...prev, [currentQ.id]: true }));
      }
      triggerTeachSave(drawingsMapRef.current);
    } catch {
      // ignore
    }
  }, [exam]);

  // Switch to question index
  const goToQuestion = useCallback(
    (newIdx: number) => {
      if (!exam?.questions || newIdx < 0 || newIdx >= exam.questions.length) return;

      saveCurrentQuestionDrawing();

      setShowHint(false);
      setShowFormula(false);
      setShowSolution(false);
      setSelectedOption(null);
      setTimerSeconds(120);
      setIsTimerRunning(false);

      setCurrentIdx(newIdx);

      const nextQ = exam.questions[newIdx];
      if (nextQ && excalidrawApiRef.current) {
        const savedElements = drawingsMapRef.current[nextQ.id] || [];
        try {
          excalidrawApiRef.current.updateScene({ elements: savedElements });
        } catch {
          // ignore
        }
      }

      // Auto update matching lab
      if (nextQ) {
        const autoLab = findAutoMatchingLab(nextQ.content, exam?.subject);
        if (autoLab) {
          setSelectedLabSlug(autoLab.slug);
        }
      }
    },
    [exam, saveCurrentQuestionDrawing]
  );

  // Stable handlers for WhiteboardCanvas in Teach Mode (prevents infinite re-render loop)
  const handleCanvasApiReady = useCallback((api: any) => {
    excalidrawApiRef.current = api as unknown as ExcalidrawAPI;
    const q = exam?.questions?.[currentIdxRef.current];
    if (q && drawingsMapRef.current[q.id]) {
      try {
        api.updateScene({ elements: drawingsMapRef.current[q.id] });
      } catch {
        // ignore
      }
    }
  }, [exam]);

  const handleCanvasChange = useCallback((elements: readonly Record<string, unknown>[]) => {
    const q = exam?.questions?.[currentIdxRef.current];
    if (q) {
      const elList = elements as unknown[];
      drawingsMapRef.current[q.id] = elList;
      const hasDrawing = elList.length > 0;
      setQuestionsWithDrawings((prev) => {
        if (prev[q.id] === hasDrawing) return prev;
        return { ...prev, [q.id]: hasDrawing };
      });
      triggerTeachSave(drawingsMapRef.current);
    }
  }, [exam, triggerTeachSave]);

  // Set initial lab when exam loads
  useEffect(() => {
    if (exam?.questions?.[0]) {
      const initialLab = findAutoMatchingLab(exam.questions[0].content, exam.subject);
      if (initialLab) {
        setSelectedLabSlug(initialLab.slug);
      }
    }
  }, [exam]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToQuestion(currentIdx - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToQuestion(currentIdx + 1);
      } else if (e.key === "1") {
        setShowHint((prev) => !prev);
      } else if (e.key === "2") {
        setShowFormula((prev) => !prev);
      } else if (e.key === "3") {
        setShowSolution((prev) => !prev);
      } else if (e.key === "[") {
        setSplitRatio((prev) => Math.max(15, prev - 5));
      } else if (e.key === "]") {
        setSplitRatio((prev) => Math.min(85, prev + 5));
      } else if (e.key === "\\") {
        setSplitRatio(50);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIdx, goToQuestion]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Clear drawing for current question
  const handleClearCurrentDrawing = () => {
    if (!excalidrawApiRef.current || !exam?.questions) return;
    const currentQ = exam.questions[currentIdx];
    if (!currentQ) return;

    if (confirm("Thầy/Cô có chắc chắn muốn xóa sạch nháp của câu này?")) {
      excalidrawApiRef.current.updateScene({ elements: [] });
      drawingsMapRef.current[currentQ.id] = [];
      setQuestionsWithDrawings((prev) => {
        const next = { ...prev };
        delete next[currentQ.id];
        return next;
      });
    }
  };

  const currentQ: Question | undefined = exam?.questions?.[currentIdx];
  const totalQuestions = exam?.questions?.length || 0;

  // Options parsing helper
  let parsedOptions: string[] = [];
  if (currentQ?.options) {
    if (Array.isArray(currentQ.options)) {
      parsedOptions = currentQ.options as string[];
    } else if (typeof currentQ.options === "object") {
      parsedOptions = Object.values(currentQ.options as Record<string, string>);
    }
  }

  // Active question to display: Original or Cloned
  const isViewingCloned = currentQ ? !!showClonedTab[currentQ.id] : false;
  const currentCloned = currentQ ? clonedQuestionsMap[currentQ.id] : undefined;

  // Handler: Live Question Clone
  const handleLiveCloneQuestion = async () => {
    if (!currentQ) return;
    if (
      !requireMax(
        "Đẻ câu tương tự tại chỗ (Live Question Cloner)",
        "Đặc quyền gói MAX: AI tự động sinh câu hỏi đẳng cấu giữ nguyên dạng bài nhưng thay đổi số liệu/chất hóa học, kèm bộ đếm ngược 2 phút cho học sinh làm thử ngay tại lớp."
      )
    ) {
      return;
    }

    try {
      setIsCloning(true);
      const res = await fetch("/api/ai/live-clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQ.content,
          options: parsedOptions,
          subject: exam?.subject,
          grade: exam?.grade,
          currentAnswer: currentQ.correct_answer,
        }),
      });

      const data = await res.json();
      if (data.success && data.question) {
        setClonedQuestionsMap((prev) => ({
          ...prev,
          [currentQ.id]: data.question,
        }));
        setShowClonedTab((prev) => ({
          ...prev,
          [currentQ.id]: true,
        }));
        // Reset and start 2-minute timer
        setTimerSeconds(120);
        setIsTimerRunning(true);
        showToast("✨ Đã tạo câu hỏi luyện tập 2 phút thành công!", "success");
      } else {
        showToast(data.error || "Không thể sinh câu hỏi tương tự.", "error");
      }
    } catch (err: any) {
      showToast("Lỗi kết nối AI: " + err.message, "error");
    } finally {
      setIsCloning(false);
    }
  };

  // Handler: Scaffolding
  const handleScaffoldQuestion = async () => {
    if (!currentQ) return;
    if (
      !requireMax(
        "Bẻ nhỏ bài toán thành 3 bước gợi mở (AI Scaffolding)",
        "Đặc quyền gói MAX: Tự động tách các câu vận dụng cao thành 3 câu hỏi phụ dẫn dắt sư phạm giúp học sinh tự tư duy từ nhận diện giả thiết đến phương trình then chốt."
      )
    ) {
      return;
    }

    try {
      setIsScaffolding(true);
      const res = await fetch("/api/ai/scaffold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQ.content,
          options: parsedOptions,
          subject: exam?.subject,
          grade: exam?.grade,
          currentAnswer: currentQ.correct_answer,
        }),
      });

      const data = await res.json();
      if (data.success && data.scaffolding?.steps) {
        setScaffoldMap((prev) => ({
          ...prev,
          [currentQ.id]: data.scaffolding.steps,
        }));
        setRevealedStepCount((prev) => ({
          ...prev,
          [currentQ.id]: 1, // reveal step 1 initially
        }));
        showToast("🧩 Đã phân tách 3 bước gợi mở tư duy!", "success");
      } else {
        showToast(data.error || "Không thể phân tách các bước gợi mở.", "error");
      }
    } catch (err: any) {
      showToast("Lỗi kết nối AI: " + err.message, "error");
    } finally {
      setIsScaffolding(false);
    }
  };

  // Handler: Multi-Method Solver
  const handleFetchMultiMethod = async () => {
    if (!currentQ) return;
    if (
      !requireMax(
        "Giải đa cách 15s & Tuyệt kỹ Casio",
        "Đặc quyền gói MAX: AI cung cấp đồng thời 3 góc nhìn giải toán: Tự luận bản chất GDPT 2018, Tuyệt kỹ trắc nghiệm 15 giây và Hướng dẫn bấm máy tính Casio fx-580VN X."
      )
    ) {
      return;
    }

    try {
      setIsSolvingMultiMethod(true);
      const res = await fetch("/api/ai/multi-method", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQ.content,
          options: parsedOptions,
          subject: exam?.subject,
          grade: exam?.grade,
          currentAnswer: currentQ.correct_answer,
          explanation: currentQ.explanation,
        }),
      });

      const data = await res.json();
      if (data.success && data.data?.methods) {
        setMultiMethodMap((prev) => ({
          ...prev,
          [currentQ.id]: data.data.methods,
        }));
        showToast("⚡ Đã phân tích 3 phương pháp giải toán!", "success");
      } else {
        showToast(data.error || "Không thể phân tích đa phương pháp.", "error");
      }
    } catch (err: any) {
      showToast("Lỗi kết nối AI: " + err.message, "error");
    } finally {
      setIsSolvingMultiMethod(false);
    }
  };

  // Check if current question has an OMR error statistic
  const currentMissedStat = useMemo(() => {
    if (!hotfixData?.topMissedQuestions) return null;
    return hotfixData.topMissedQuestions.find(
      (m: any) => m.questionNum === currentIdx + 1 || `q_omr_${m.questionNum}` === currentQ?.id
    );
  }, [hotfixData, currentIdx, currentQ]);

  // Live Poll Interval Hook (Sprint 6) - Placed before any early returns to strictly adhere to React Rules of Hooks
  useEffect(() => {
    if (!showLivePollModal || !livePollSession?.roomCode) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/teach/live-poll/poll?roomCode=${livePollSession.roomCode}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.session) {
            setLivePollSession(data.session);
          }
        }
      } catch {
        // ignore
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [showLivePollModal, livePollSession?.roomCode]);

  const handleToggleLivePoll = async () => {
    if (!showLivePollModal) {
      setShowLivePollModal(true);
      if (!livePollSession) {
        try {
          setIsOpeningPoll(true);
          const currentQ = exam?.questions?.[currentIdx];
          const res = await fetch("/api/teach/live-poll/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              examId,
              questionIndex: currentIdx + 1,
              questionTitle: currentQ?.content || `Câu hỏi số ${currentIdx + 1}`,
              options: ["A", "B", "C", "D"],
              correctAnswer: currentQ?.correct_answer || "A",
            }),
          });
          const data = await res.json();
          if (res.ok && data.success) {
            setLivePollSession(data.session);
          }
        } catch (err: any) {
          alert("Lỗi mở phòng Live Poll: " + err.message);
        } finally {
          setIsOpeningPoll(false);
        }
      }
    } else {
      setShowLivePollModal(false);
    }
  };

  const handleCloseLivePoll = async () => {
    if (!livePollSession?.roomCode) return;
    try {
      const res = await fetch("/api/teach/live-poll/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode: livePollSession.roomCode }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLivePollSession(data.session);
      }
    } catch (err: any) {
      alert("Lỗi khóa bình chọn: " + err.message);
    }
  };

  const currentScaffolding = currentQ ? scaffoldMap[currentQ.id] : undefined;
  const currentRevealedStep = currentQ ? revealedStepCount[currentQ.id] || 0 : 0;
  const currentMultiMethods = currentQ ? multiMethodMap[currentQ.id] : undefined;

  // Active question text and options to render
  const displayContent = isViewingCloned && currentCloned ? currentCloned.content : currentQ?.content || "";
  const displayOptions = isViewingCloned && currentCloned ? currentCloned.options : parsedOptions;
  const displayAnswer = isViewingCloned && currentCloned ? currentCloned.correct_answer : currentQ?.correct_answer;
  const displayExplanation = isViewingCloned && currentCloned ? currentCloned.explanation : currentQ?.explanation;

  const contentFontSizeClass =
    fontSize === "xl" ? "text-2xl leading-relaxed" : fontSize === "lg" ? "text-xl leading-relaxed" : "text-base leading-normal";
  const optionFontSizeClass =
    fontSize === "xl" ? "text-xl" : fontSize === "lg" ? "text-lg" : "text-sm";

  // Active lab selected
  const activeLab = LABS.find((l) => l.slug === selectedLabSlug) || LABS[0];

  const isOverallLoading = loading || authLoading;

  if (!mounted || isOverallLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-9 w-9 animate-spin text-amber-400" />
          <p className="text-sm font-semibold tracking-wide">Đang khởi tạo Bục Giảng Số 4.0…</p>
        </div>
      </div>
    );
  }

  // EXL-05: PRO Tier Gate for Bục Giảng Số
  if (!isPro) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 p-6 text-center text-white">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-4">
          <Crown className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">Bục Giảng Số 4.0 Dành Riêng Cho Gói PRO & MAX</h2>
        <p className="mt-3 text-sm text-slate-400 max-w-lg leading-relaxed">
          Trải nghiệm trình chiếu chữa bài thông minh, phóng to công thức LaTeX, vẽ phác thảo thời gian thực với bảng nháp Excalidraw, thí nghiệm mô phỏng 3D và giao đề kép chuyên nghiệp.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={() => setUpgradeModalOpen(true)}
            className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-500/25 hover:from-amber-600 hover:to-amber-700 transition cursor-pointer"
          >
            Nâng cấp Gói PRO ngay
          </button>
          <button
            onClick={() => router.push("/exams")}
            className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 transition cursor-pointer"
          >
            Quay lại danh sách đề thi
          </button>
        </div>

        {/* Upgrade Modal */}
        <UpgradeTierModal
          isOpen={upgradeModalOpen}
          onClose={() => setUpgradeModalOpen(false)}
          requiredTier="pro"
          featureTitle="Trình chiếu Bục Giảng Số 4.0"
          featureDesc="Nâng cấp lên gói PRO để mở khóa toàn bộ tính năng Bục Giảng Số, bảng nháp thông minh, xuất file đề kép song song và kho phòng thí nghiệm 3D."
          onSelectPlan={(plan) => {
            setUpgradeModalOpen(false);
            setCheckoutPlan(plan);
          }}
        />

        {checkoutPlan && (
          <PaymentCheckoutModal
            isOpen={!!checkoutPlan}
            onClose={() => setCheckoutPlan(null)}
            selectedPlan={checkoutPlan}
            onSuccess={() => {
              setCheckoutPlan(null);
              window.location.reload();
            }}
          />
        )}
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 p-6 text-center text-white">
        <h2 className="text-xl font-bold text-red-400">Không thể mở Bục Giảng Số</h2>
        <p className="mt-2 text-sm text-slate-400 max-w-md">{error || "Đề thi không tồn tại."}</p>
        <button
          onClick={() => router.push("/exams")}
          className="mt-5 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md cursor-pointer hover:bg-primary/90"
        >
          Quay lại danh sách đề thi
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-950 text-slate-100 select-none">
      {/* 1. TOP BAR: Header Bục Giảng Số */}
      <header className="flex h-14 flex-none items-center justify-between border-b border-slate-800 bg-slate-900/95 px-4 backdrop-blur-md z-30">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/exams"
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
            title="Thoát Bục Giảng & Quay lại đề thi"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Thoát</span>
          </Link>

          <span className="h-4 w-px bg-slate-700 hidden sm:inline" />

          <div className="flex items-center gap-2 min-w-0">
            {isMax ? (
              <span className="flex items-center gap-1 rounded-md bg-linear-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider shrink-0 shadow-xs">
                <Crown className="w-3.5 h-3.5 text-amber-400" /> Bục Giảng MAX VIP
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider shrink-0">
                <Crown className="w-3 h-3 text-amber-400" /> Bục Giảng Số PRO
              </span>
            )}
            <h1 className="truncate text-sm font-bold text-white max-w-xs md:max-w-md" title={exam.name}>
              {exam.name}
            </h1>
          </div>
        </div>

        {/* Center: Split View Controls with Resizing Presets */}
        <div className="hidden lg:flex items-center gap-1 rounded-xl bg-slate-800 p-1 border border-slate-700/80 text-xs">
          <button
            onClick={() => setSplitRatio(100)}
            title="Chỉ xem Đề thi (100% Câu hỏi) [Alt+1]"
            className={`rounded-lg px-2.5 py-1 font-semibold transition cursor-pointer ${
              splitRatio === 100 ? "bg-primary text-white shadow-xs" : "text-slate-400 hover:text-white"
            }`}
          >
            Chỉ xem Đề
          </button>
          <button
            onClick={() => setSplitRatio(70)}
            title="Ưu tiên Đề thi (70% Đề - 30% Cột phải) [Alt+2]"
            className={`rounded-lg px-2.5 py-1 font-semibold transition cursor-pointer ${
              splitRatio === 70 ? "bg-primary text-white shadow-xs" : "text-slate-400 hover:text-white"
            }`}
          >
            70% Đề
          </button>
          <button
            onClick={() => setSplitRatio(50)}
            title="Chia đôi màn hình (50% Đề - 50% Bảng nháp / 3D / Đa cách) [Alt+3 hoặc phím \]"
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold transition cursor-pointer ${
              splitRatio === 50 ? "bg-primary text-white shadow-xs" : "text-slate-400 hover:text-white"
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" /> 50:50
          </button>
          <button
            onClick={() => setSplitRatio(30)}
            title="Ưu tiên Bảng nháp / 3D (30% Đề - 70% Cột phải) [Alt+4]"
            className={`rounded-lg px-2.5 py-1 font-semibold transition cursor-pointer ${
              splitRatio === 30 ? "bg-primary text-white shadow-xs" : "text-slate-400 hover:text-white"
            }`}
          >
            30% Đề
          </button>
          <button
            onClick={() => setSplitRatio(0)}
            title="Bung toàn màn hình Cột phải (100% Bảng nháp / 3D) [Alt+5]"
            className={`rounded-lg px-2.5 py-1 font-semibold transition cursor-pointer ${
              splitRatio === 0 ? "bg-primary text-white shadow-xs" : "text-slate-400 hover:text-white"
            }`}
          >
            Chỉ xem Cột phải
          </button>

          {/* Custom ratio badge when dragged freely */}
          {![0, 30, 50, 70, 100].includes(splitRatio) && (
            <span className="flex items-center gap-1.5 rounded-lg bg-blue-950/70 border border-blue-500/40 px-2 py-0.5 text-[11px] font-bold text-blue-300 tabular-nums shadow-xs">
              <span>{splitRatio}% : {100 - splitRatio}%</span>
              <button
                type="button"
                onClick={() => setSplitRatio(50)}
                title="Nhấp để đặt lại về 50:50"
                className="hover:text-white cursor-pointer text-slate-400 text-xs transition"
              >
                ↺
              </button>
            </span>
          )}
        </div>

        {/* Right Tools: Font Size, Fullscreen */}
        <div className="flex items-center gap-2">
          {/* Cỡ chữ máy chiếu */}
          <div className="flex items-center rounded-lg bg-slate-800 border border-slate-700 px-1 py-0.5 text-xs">
            <span className="text-[11px] font-bold text-slate-400 px-1.5 hidden sm:inline">Cỡ chữ:</span>
            <button
              onClick={() => setFontSize("md")}
              className={`rounded px-1.5 py-0.5 font-bold cursor-pointer ${
                fontSize === "md" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              A
            </button>
            <button
              onClick={() => setFontSize("lg")}
              className={`rounded px-1.5 py-0.5 font-bold cursor-pointer text-sm ${
                fontSize === "lg" ? "bg-slate-700 text-amber-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              A+
            </button>
            <button
              onClick={() => setFontSize("xl")}
              className={`rounded px-1.5 py-0.5 font-bold cursor-pointer text-base ${
                fontSize === "xl" ? "bg-slate-700 text-amber-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              A++
            </button>
          </div>

          {/* Live Poll Button (Sprint 6) */}
          <button
            onClick={handleToggleLivePoll}
            title="Mở khảo sát / bình chọn đáp án thời gian thực với học sinh"
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/50 bg-emerald-950/80 hover:bg-emerald-900 px-3 py-1.5 text-xs font-bold text-emerald-300 transition cursor-pointer shadow-sm"
          >
            <Flame className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
            <span className="hidden sm:inline">Live Poll</span>
            {livePollSession && (
              <span className="rounded bg-emerald-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2">
                {livePollSession.roomCode}
              </span>
            )}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            title="Toàn màn hình trình chiếu (F11)"
            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* 2. BODY: SPLIT VIEW (LEFT QUESTION, RIGHT 3-TAB PANE) */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden relative">
        {/* Invisible overlay during drag to prevent iframe / canvas event capturing */}
        {isDragging && (
          <div className="fixed inset-0 z-50 cursor-col-resize select-none" />
        )}
        {/* ================= LEFT PANE: CÂU HỎI & MỞ TỪNG LỚP ĐÁP ÁN ================= */}
        {splitRatio > 0 && (
          <div
            className="flex flex-col border-r border-slate-800 bg-slate-900 overflow-y-auto"
            style={{ width: splitRatio === 100 ? "100%" : `${splitRatio}%` }}
          >
            {currentQ ? (
              <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between max-w-4xl mx-auto w-full">
                <div className="space-y-6">
                  {/* HOTFIX OMR WARNING BANNER */}
                  {currentMissedStat && (
                    <div className="rounded-2xl border border-red-500/60 bg-red-950/40 p-4 shadow-sm animate-pulse-subtle">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wide">
                          <Flame className="w-4 h-4 text-red-500 animate-bounce" />
                          <span>Chữa nóng OMR: Câu hỏi cả lớp sai nhiều</span>
                        </div>
                        <span className="rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-black text-red-300 border border-red-500/30">
                          {currentMissedStat.wrongPct}% học sinh sai ({currentMissedStat.wrongCount}/{currentMissedStat.total} em)
                        </span>
                      </div>
                      {currentMissedStat.mostChosenWrong && (
                        <p className="mt-2 text-xs text-red-200">
                          ⚠️ <strong>Bẫy điển hình:</strong> Đa số học sinh bị nhầm lẫn chọn phương án{" "}
                          <strong className="text-amber-300 font-black">{currentMissedStat.mostChosenWrong}</strong>. Hãy nhấn mạnh sự khác biệt giữa phương án {currentMissedStat.mostChosenWrong} và đáp án đúng {currentMissedStat.correctAns}!
                        </p>
                      )}
                    </div>
                  )}

                  {/* Question Meta & Cloned Switcher */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-3.5 py-1 text-sm font-black text-white shadow-xs">
                        CÂU {currentIdx + 1}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">
                        / {totalQuestions} câu
                      </span>

                      {/* Tab Switcher between Original & Cloned (If Cloned Exists) */}
                      {currentCloned && (
                        <div className="flex items-center rounded-lg bg-slate-800 p-0.5 border border-slate-700 ml-2">
                          <button
                            onClick={() =>
                              setShowClonedTab((prev) => ({
                                ...prev,
                                [currentQ.id]: false,
                              }))
                            }
                            className={`rounded px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                              !isViewingCloned ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                            }`}
                          >
                            Câu gốc
                          </button>
                          <button
                            onClick={() =>
                              setShowClonedTab((prev) => ({
                                ...prev,
                                [currentQ.id]: true,
                              }))
                            }
                            className={`flex items-center gap-1 rounded px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                              isViewingCloned ? "bg-amber-500 text-slate-950 font-black" : "text-amber-400 hover:text-amber-300"
                            }`}
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Câu {currentIdx + 1}+ (Luyện tập)</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons: Live Cloner, Scaffolding & Quick Maximize */}
                    <div className="flex items-center gap-2">
                      {/* Quick Maximize / Restore Left Pane */}
                      <button
                        type="button"
                        onClick={() => setSplitRatio(splitRatio === 100 ? 50 : 100)}
                        title={splitRatio === 100 ? "Thu nhỏ Đề thi về chia đôi 50:50" : "Phóng to tối đa Đề thi (100%)"}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800/90 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label={splitRatio === 100 ? "Thu nhỏ Đề thi về chia đôi" : "Phóng to tối đa Đề thi"}
                      >
                        {splitRatio === 100 ? (
                          <>
                            <Minimize2 className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
                            <span className="hidden xl:inline">Thu nhỏ</span>
                          </>
                        ) : (
                          <>
                            <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span className="hidden xl:inline">Bung to Đề</span>
                          </>
                        )}
                      </button>
                      {/* Live 1-Click Question Cloner (MAX) */}
                      <button
                        onClick={handleLiveCloneQuestion}
                        disabled={isCloning}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition cursor-pointer disabled:opacity-50"
                        title="Đẻ 1 câu hỏi tương tự giữ nguyên dạng bài nhưng đổi số liệu để học sinh luyện thử 2 phút"
                      >
                        {isCloning ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                        ) : (
                          <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        <span>{isCloning ? "Đang sinh câu mới…" : "Đẻ câu tương tự (MAX)"}</span>
                      </button>

                      {/* AI Step-by-Step Scaffolding (MAX) */}
                      <button
                        onClick={handleScaffoldQuestion}
                        disabled={isScaffolding}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-3 py-1.5 text-xs font-bold text-indigo-300 hover:bg-indigo-500/20 transition cursor-pointer disabled:opacity-50"
                        title="Bẻ nhỏ bài toán thành 3 bước gợi mở sư phạm dẫn dắt học sinh"
                      >
                        {isScaffolding ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                        ) : (
                          <Layers className="w-3.5 h-3.5 text-indigo-400" />
                        )}
                        <span>{isScaffolding ? "Đang chia nhỏ…" : "Bẻ nhỏ 3 bước (MAX)"}</span>
                      </button>
                    </div>
                  </div>

                  {/* 2-MINUTE FLOATING TIMER (When viewing cloned practice question) */}
                  {isViewingCloned && (
                    <div className="flex items-center justify-between rounded-2xl border border-amber-500/50 bg-linear-to-r from-amber-950/40 to-orange-950/40 p-3.5 shadow-sm">
                      <div className="flex items-center gap-2.5">
                        <Timer className={`w-5 h-5 ${isTimerRunning ? "text-amber-400 animate-spin" : "text-amber-500"}`} />
                        <div>
                          <p className="text-xs font-bold text-amber-200">
                            Thử thách 2 phút áp dụng tại lớp:
                          </p>
                          <p className="text-[11px] text-amber-300/80">
                            Cả lớp vận dụng phương pháp vừa chữa để chọn đáp án cho câu mới
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div
                          className={`font-mono tabular-nums text-2xl font-black px-3 py-1 rounded-xl border ${
                            timerSeconds <= 20
                              ? "bg-red-500/30 border-red-500 text-red-400 animate-pulse"
                              : "bg-slate-900 border-amber-500/40 text-amber-300"
                          }`}
                        >
                          {String(Math.floor(timerSeconds / 60)).padStart(2, "0")}:
                          {String(timerSeconds % 60).padStart(2, "0")}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setIsTimerRunning((v) => !v)}
                            aria-label={isTimerRunning ? "Tạm dừng đếm ngược" : "Bắt đầu đếm ngược"}
                            className="p-2 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                            title={isTimerRunning ? "Tạm dừng" : "Bắt đầu đếm ngược"}
                          >
                            {isTimerRunning ? <Pause className="w-4 h-4" aria-hidden="true" /> : <Play className="w-4 h-4" aria-hidden="true" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsTimerRunning(false);
                              setTimerSeconds(120);
                            }}
                            aria-label="Đặt lại bộ đếm 2 phút"
                            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                            title="Đặt lại 2 phút"
                          >
                            <RotateCcw className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Question Content (Large Projector Typography + LaTeX) */}
                  <div className={`font-semibold text-slate-100 ${contentFontSizeClass}`}>
                    <LatexRenderer content={displayContent} />
                  </div>

                  {/* Options (If multiple choice) */}
                  {displayOptions.length > 0 && (
                    <div className="grid gap-3 pt-2 sm:grid-cols-2">
                      {displayOptions.map((opt, oIdx) => {
                        const optKey = ["A", "B", "C", "D", "E"][oIdx] || `P${oIdx + 1}`;
                        const isCorrectOption =
                          showSolution &&
                          displayAnswer &&
                          displayAnswer.trim().toUpperCase().startsWith(optKey);
                        const isUserClicked = selectedOption === optKey;

                        return (
                          <button
                            key={oIdx}
                            type="button"
                            onClick={() => setSelectedOption(optKey)}
                            className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition cursor-pointer shadow-xs ${
                              isCorrectOption
                                ? "border-emerald-500 bg-emerald-950/40 text-emerald-200 ring-2 ring-emerald-500"
                                : isUserClicked
                                ? "border-blue-500 bg-blue-950/40 text-blue-200 ring-1 ring-blue-500"
                                : "border-slate-800 bg-slate-800/60 text-slate-200 hover:border-slate-700 hover:bg-slate-800"
                            }`}
                          >
                            <span
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                                isCorrectOption
                                  ? "bg-emerald-500 text-white"
                                  : isUserClicked
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-700 text-slate-200"
                              }`}
                            >
                              {optKey}
                            </span>
                            <div className={`pt-0.5 font-medium ${optionFontSizeClass}`}>
                              <LatexRenderer content={opt.replace(/^[A-D]\.\s*/, "")} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* AI STEP-BY-STEP SCAFFOLDING ACCORDION (If generated) */}
                  {currentScaffolding && currentScaffolding.length > 0 && (
                    <div className="rounded-2xl border border-indigo-500/40 bg-indigo-950/30 p-5 space-y-4">
                      <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-indigo-400" />
                          <h4 className="text-xs font-bold text-indigo-200 uppercase tracking-wide">
                            Dẫn dắt 3 bước gợi mở tư duy (AI Scaffolding)
                          </h4>
                        </div>
                        <span className="text-[11px] text-indigo-300">
                          Đã mở {currentRevealedStep}/3 bước
                        </span>
                      </div>

                      <div className="space-y-3">
                        {currentScaffolding.map((step) => {
                          const isRevealed = currentRevealedStep >= step.step_number;
                          return (
                            <div
                              key={step.step_number}
                              className={`rounded-xl border p-3.5 transition ${
                                isRevealed
                                  ? "border-indigo-500/40 bg-slate-900/90 text-slate-100"
                                  : "border-slate-800 bg-slate-900/30 text-slate-500"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-indigo-300">
                                  {step.title}
                                </span>
                                {!isRevealed ? (
                                  <button
                                    onClick={() =>
                                      setRevealedStepCount((prev) => ({
                                        ...prev,
                                        [currentQ.id]: step.step_number,
                                      }))
                                    }
                                    className="rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-indigo-500 transition cursor-pointer shadow-xs"
                                  >
                                    Mở Bước {step.step_number}
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Đã mở
                                  </span>
                                )}
                              </div>

                              {isRevealed && (
                                <div className="mt-2.5 space-y-2 text-xs leading-relaxed border-t border-indigo-500/20 pt-2 text-slate-200">
                                  <p className="font-semibold text-indigo-100">
                                    ❓ <strong>Câu hỏi gợi ý:</strong> {step.question}
                                  </p>
                                  <div className="text-slate-300 bg-indigo-950/40 p-2.5 rounded-lg border border-indigo-500/20">
                                    💡 <strong>Hướng dẫn:</strong> <LatexRenderer content={step.hint} />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ================= 3 PROGRESSIVE DISCLOSURE LAYERS ================= */}
                  <div className="space-y-3 pt-4">
                    {/* Layer 1: Gợi ý tư duy */}
                    <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 transition-all">
                      <button
                        onClick={() => setShowHint((v) => !v)}
                        className="flex w-full items-center justify-between text-xs font-bold text-amber-300 cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-amber-400" />
                          <span>LỚP 1: GỢI Ý PHƯƠNG PHÁP TƯ DUY (Phím tắt: 1)</span>
                        </span>
                        <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px]">
                          {showHint ? "Ẩn gợi ý" : "Hiện gợi ý"}
                        </span>
                      </button>

                      {showHint && (
                        <div className="mt-3 text-sm text-amber-200/90 leading-relaxed pt-2 border-t border-amber-500/20">
                          {displayExplanation ? (
                            <LatexRenderer
                              content={
                                displayExplanation.split("\n")[0] ||
                                "Xác định các đại lượng đã biết, phân tích mối liên hệ và áp dụng công thức tương ứng."
                              }
                            />
                          ) : (
                            <p>Xác định giả thiết bài toán, phân tích câu hỏi và áp dụng định lý cơ bản.</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Layer 2: Công thức trọng tâm */}
                    <div className="rounded-2xl border border-blue-500/30 bg-blue-950/20 p-4 transition-all">
                      <button
                        onClick={() => setShowFormula((v) => !v)}
                        className="flex w-full items-center justify-between text-xs font-bold text-blue-300 cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <FileCode2 className="w-4 h-4 text-blue-400" />
                          <span>LỚP 2: CÔNG THỨC & KIẾN THỨC CỐT LÕI (Phím tắt: 2)</span>
                        </span>
                        <span className="rounded bg-blue-500/20 px-2 py-0.5 text-[10px]">
                          {showFormula ? "Ẩn công thức" : "Hiện công thức"}
                        </span>
                      </button>

                      {showFormula && (
                        <div className="mt-3 text-sm text-blue-200/90 leading-relaxed pt-2 border-t border-blue-500/20">
                          {displayExplanation && displayExplanation.includes("$") ? (
                            <LatexRenderer content={displayExplanation} />
                          ) : (
                            <p>Áp dụng hệ quả và công thức biến đổi tương đương theo chương trình GDPT 2025.</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Layer 3: Đáp án đúng & Lời giải chi tiết */}
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 transition-all">
                      <button
                        onClick={() => setShowSolution((v) => !v)}
                        className="flex w-full items-center justify-between text-xs font-bold text-emerald-300 cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>LỚP 3: ĐÁP ÁN ĐÚNG & LỜI GIẢI CHI TIẾT (Phím tắt: 3)</span>
                        </span>
                        <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px]">
                          {showSolution ? "Ẩn lời giải" : "Xem toàn bộ lời giải"}
                        </span>
                      </button>

                      {showSolution && (
                        <div className="mt-3 space-y-2.5 text-sm text-emerald-200 leading-relaxed pt-2 border-t border-emerald-500/20">
                          {displayAnswer && (
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-emerald-400">Đáp án chuẩn:</span>
                              <span className="inline-block rounded-lg bg-emerald-500 px-3 py-1 font-black text-white shadow-xs">
                                {displayAnswer}
                              </span>
                            </div>
                          )}
                          <div className="pt-2 text-slate-200">
                            {displayExplanation ? (
                              <LatexRenderer content={displayExplanation} />
                            ) : (
                              <p className="italic text-slate-400">Chưa có bản ghi lời giải chi tiết cho câu hỏi này.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Question Navigation Bar (Bottom of Left Pane) */}
                <div className="mt-8 border-t border-slate-800 pt-5 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <button
                      onClick={() => goToQuestion(currentIdx - 1)}
                      disabled={currentIdx === 0}
                      className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Câu trước (←)</span>
                    </button>

                    <span className="text-xs font-bold text-slate-400">
                      Câu {currentIdx + 1} / {totalQuestions}
                    </span>

                    <button
                      onClick={() => goToQuestion(currentIdx + 1)}
                      disabled={currentIdx === totalQuestions - 1}
                      className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-md"
                    >
                      <span>Câu tiếp (→)</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quick Question Dots / Grid */}
                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2 max-h-24 overflow-y-auto">
                    {exam.questions?.map((q, idx) => {
                      const isCurrent = idx === currentIdx;
                      const hasDrawing = !!questionsWithDrawings[q.id] || (drawingsMapRef.current[q.id]?.length || 0) > 0;
                      const hasCloned = !!clonedQuestionsMap[q.id];

                      return (
                        <button
                          key={q.id || idx}
                          onClick={() => goToQuestion(idx)}
                          title={`Nhảy tới Câu ${idx + 1}${hasDrawing ? " (Có nháp)" : ""}${hasCloned ? " (Đã có câu luyện tập)" : ""}`}
                          className={`relative h-8 w-8 rounded-lg text-xs font-bold transition cursor-pointer ${
                            isCurrent
                              ? "bg-amber-500 text-slate-950 font-black shadow-md ring-2 ring-amber-400"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          {idx + 1}
                          {hasDrawing && !isCurrent && (
                            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-400" />
                          )}
                          {hasCloned && (
                            <span className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-blue-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center text-slate-500">
                Chưa có câu hỏi nào trong đề thi này.
              </div>
            )}
          </div>
        )}

        {/* ================= DRAGGABLE RESIZE DIVIDER (THU PHÓNG KÉO THẢ) ================= */}
        {splitRatio > 0 && splitRatio < 100 && (
          <div
            onMouseDown={startDragging}
            onTouchStart={startDragging}
            onDoubleClick={() => setSplitRatio(50)}
            role="separator"
            aria-orientation="vertical"
            aria-valuenow={splitRatio}
            aria-valuemin={15}
            aria-valuemax={85}
            aria-label="Kéo để thay đổi độ rộng giữa cột đề thi và cột bảng nháp"
            title="Kéo sang trái/phải để thu phóng kích thước các tab (Nhấp đúp để chia đều 50:50)"
            className={`group relative z-30 flex w-2.5 shrink-0 cursor-col-resize items-center justify-center bg-slate-900 border-x border-slate-800 hover:bg-blue-600 transition-colors select-none ${
              isDragging ? "bg-blue-600 border-blue-500" : ""
            }`}
          >
            {/* Visual Grip Handle in Center */}
            <div className="absolute flex h-14 w-4 items-center justify-center rounded-full bg-slate-800 text-slate-400 shadow-md border border-slate-700 group-hover:bg-blue-500 group-hover:text-white group-hover:border-blue-400 transition-all pointer-events-none">
              <GripVertical className="h-3.5 w-3.5" aria-hidden="true" />
            </div>

            {/* Quick 1-click resize arrows on hover */}
            <div className="absolute top-1/2 -translate-y-1/2 hidden group-hover:flex flex-col gap-1 z-40 pointer-events-auto">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSplitRatio((prev) => Math.max(15, prev - 10));
                }}
                className="h-5 w-5 -left-6 absolute -top-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 flex items-center justify-center text-[10px] shadow-lg cursor-pointer"
                title="Thu nhỏ Đề thi (-10%)"
                aria-label="Thu nhỏ Đề thi (-10%)"
              >
                ◀
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSplitRatio(50);
                }}
                className="h-5 w-5 -left-2.5 absolute -top-2.5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[9px] shadow-lg cursor-pointer"
                title="Đặt lại chia đôi 50:50"
                aria-label="Đặt lại chia đôi 50:50"
              >
                =
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSplitRatio((prev) => Math.min(85, prev + 10));
                }}
                className="h-5 w-5 left-1 absolute -top-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 flex items-center justify-center text-[10px] shadow-lg cursor-pointer"
                title="Phóng to Đề thi (+10%)"
                aria-label="Phóng to Đề thi (+10%)"
              >
                ▶
              </button>
            </div>
          </div>
        )}

        {/* ================= RIGHT PANE: CỘT PHẢI ĐA NĂNG 3 TAB ================= */}
        {splitRatio < 100 && (
          <div
            className="flex flex-col bg-slate-950 overflow-hidden relative"
            style={{ width: splitRatio === 0 ? "100%" : `${100 - splitRatio}%` }}
          >
            {/* 3-TAB SELECTOR HEADER */}
            <div className="flex h-12 items-center justify-between border-b border-slate-800 bg-slate-900 px-3 z-20">
              <div className="flex items-center gap-1 rounded-xl bg-slate-950 p-1 border border-slate-800">
                <button
                  onClick={() => setActiveRightTab("whiteboard")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition cursor-pointer ${
                    activeRightTab === "whiteboard"
                      ? "bg-slate-800 text-amber-400 shadow-xs"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span>✏️ Bảng nháp</span>
                </button>
                <button
                  onClick={() => setActiveRightTab("lab3d")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition cursor-pointer ${
                    activeRightTab === "lab3d"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  <span>🔬 TN 3D</span>
                </button>
                <button
                  onClick={() => setActiveRightTab("multi_method")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition cursor-pointer ${
                    activeRightTab === "multi_method"
                      ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                      : "text-amber-400/80 hover:text-amber-300"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>⚡ Giải đa cách (MAX)</span>
                </button>
              </div>

              {/* Actions for right tab & Quick Maximize */}
              <div className="flex items-center gap-1.5">
                {activeRightTab === "whiteboard" && (
                  <button
                    onClick={handleClearCurrentDrawing}
                    title="Xóa trắng bảng nháp của câu này"
                    className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-red-400 hover:bg-red-950/40 transition cursor-pointer shadow-2xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Xóa nháp</span>
                  </button>
                )}

                {/* Quick Maximize / Restore Right Tab */}
                <button
                  type="button"
                  onClick={() => setSplitRatio(splitRatio === 0 ? 50 : 0)}
                  title={splitRatio === 0 ? "Thu nhỏ Cột phải về chia đôi 50:50" : "Phóng to tối đa Cột phải (100%)"}
                  className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label={splitRatio === 0 ? "Thu nhỏ Cột phải về chia đôi 50:50" : "Phóng to tối đa Cột phải"}
                >
                  {splitRatio === 0 ? (
                    <>
                      <Minimize2 className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                      <span className="hidden sm:inline">Thu nhỏ</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span className="hidden sm:inline">Bung to Tab</span>
                    </>
                  )}
                </button>
              </div>

              {activeRightTab === "whiteboard" && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="hidden sm:inline">Tự lưu nét vẽ theo câu</span>
                  <span className="sm:hidden">Đã tự lưu</span>
                </div>
              )}

              {activeRightTab === "lab3d" && (
                <div className="flex items-center gap-2">
                  <select
                    value={selectedLabSlug}
                    onChange={(e) => setSelectedLabSlug(e.target.value)}
                    className="rounded-lg bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-slate-200 font-medium cursor-pointer"
                  >
                    {LABS.map((lab) => (
                      <option key={lab.slug} value={lab.slug}>
                        [{SUBJECT_LABEL[lab.subject]}] {lab.titleVi}
                      </option>
                    ))}
                  </select>
                  <a
                    href={`/labs/${selectedLabSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
                    title="Mở toàn màn hình thí nghiệm tab mới"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {activeRightTab === "multi_method" && (
                <button
                  onClick={handleFetchMultiMethod}
                  disabled={isSolvingMultiMethod}
                  className="flex items-center gap-1.5 rounded-lg bg-linear-to-r from-amber-500 to-orange-500 px-3 py-1 text-xs font-bold text-slate-950 hover:brightness-110 transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSolvingMultiMethod ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Calculator className="w-3.5 h-3.5" />
                  )}
                  <span>Phân tích 3 cách giải</span>
                </button>
              )}
            </div>

            {/* TAB 1: BẢNG TRẮNG EXCALIDRAW */}
            {activeRightTab === "whiteboard" && (
              <div className="flex-1 w-full h-[calc(100%-48px)] relative bg-white">
                <WhiteboardCanvas
                  height="100%"
                  isPro={isPro}
                  initialElements={EMPTY_DRAWING_ELEMENTS}
                  onApiReady={handleCanvasApiReady}
                  onChange={handleCanvasChange}
                />
              </div>
            )}

            {/* TAB 2: PHÒNG THÍ NGHIỆM 3D LIÊN KẾT */}
            {activeRightTab === "lab3d" && (
              <div className="flex-1 w-full h-[calc(100%-48px)] flex flex-col bg-slate-900">
                <div className="flex items-center justify-between bg-slate-950/80 px-4 py-2 border-b border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-indigo-500/20 text-indigo-300 px-2 py-0.5 font-bold">
                      {activeLab.titleVi}
                    </span>
                    <span className="text-slate-400 hidden sm:inline">{activeLab.gdpt}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsGlassOverlayActive((prev) => !prev)}
                      title="Bật/Tắt Lớp kính vẽ trong suốt đè trực tiếp lên mô hình thí nghiệm 3D (Gói PRO)"
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                        isGlassOverlayActive
                          ? "bg-amber-500 text-slate-950 shadow-xs ring-2 ring-amber-400"
                          : "bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30"
                      }`}
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      <span>{isGlassOverlayActive ? "Tắt kính vẽ" : "Kính vẽ đè lên 3D"}</span>
                    </button>
                    <Link
                      href={`/labs/${selectedLabSlug}`}
                      target="_blank"
                      className="flex items-center gap-1 text-slate-400 hover:text-white text-[11px] px-1.5 py-1 rounded transition"
                      title="Mở toàn màn hình trong tab mới"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                <div className="flex-1 w-full h-full relative bg-slate-950">
                  <iframe
                    src={`/labs/courses/${selectedLabSlug}.html`}
                    className="w-full h-full border-0"
                    title={activeLab.titleVi}
                    sandbox="allow-scripts allow-same-origin"
                  />
                  <TransparentWhiteboardOverlay
                    isOpen={isGlassOverlayActive}
                    onClose={() => setIsGlassOverlayActive(false)}
                    labTitle={activeLab.titleVi}
                  />
                </div>
              </div>
            )}

            {/* TAB 3: GIẢI ĐA CÁCH 15S & CASIO (MAX) */}
            {activeRightTab === "multi_method" && (
              <div className="flex-1 w-full h-[calc(100%-48px)] overflow-y-auto bg-slate-900 p-6 space-y-6">
                {!currentMultiMethods ? (
                  <div className="flex h-full flex-col items-center justify-center text-center p-8 space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Sparkles className="w-7 h-7" />
                    </div>
                    <div className="max-w-md space-y-2">
                      <h3 className="font-bold text-base text-slate-100">
                        Chưa phân tích đa phương pháp cho câu này
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Hệ thống sẽ dùng AI phân tích 3 góc nhìn giải: Tự luận bản chất GDPT 2018, Tuyệt kỹ trắc nghiệm 15 giây và Hướng dẫn bấm máy tính Casio fx-580.
                      </p>
                    </div>
                    <button
                      onClick={handleFetchMultiMethod}
                      disabled={isSolvingMultiMethod}
                      className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:brightness-110 shadow-md transition cursor-pointer"
                    >
                      {isSolvingMultiMethod ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Wand2 className="w-4 h-4" />
                      )}
                      <span>Phân tích 3 cách giải ngay (MAX)</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Sub-tab Pills */}
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                      {currentMultiMethods.map((method) => {
                        const isSelected = selectedMethodId === method.id;
                        return (
                          <button
                            key={method.id}
                            onClick={() => setSelectedMethodId(method.id)}
                            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer border ${
                              isSelected
                                ? "bg-amber-500 text-slate-950 border-amber-400 shadow-xs"
                                : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750"
                            }`}
                          >
                            <span>{method.name}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Active Method Details */}
                    {(() => {
                      const activeMethod =
                        currentMultiMethods.find((m) => m.id === selectedMethodId) ||
                        currentMultiMethods[0];
                      if (!activeMethod) return null;

                      return (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 space-y-4 shadow-sm">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <div>
                              <span className="rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                                {activeMethod.badge}
                              </span>
                              <h3 className="text-base font-bold text-white mt-1.5">
                                {activeMethod.name}
                              </h3>
                            </div>
                          </div>

                          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3.5 text-xs text-amber-200/90 italic">
                            📌 <strong>Ý tưởng:</strong> {activeMethod.summary}
                          </div>

                          <div className="text-sm leading-relaxed text-slate-200 space-y-3 pt-2">
                            <LatexRenderer content={activeMethod.content} />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upgrade Tier Modal */}
      <UpgradeTierModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        requiredTier="max"
        featureTitle={upgradeFeature?.title || "Nâng cấp gói MAX"}
        featureDesc={upgradeFeature?.desc || "Mở khóa toàn bộ bộ công cụ Luyện thi & Chữa bài Chuyên sâu."}
        onSelectPlan={(plan) => setCheckoutPlan(plan)}
      />

      {/* PayOS Checkout Modal */}
      {checkoutPlan && (
        <PaymentCheckoutModal
          isOpen={!!checkoutPlan}
          onClose={() => setCheckoutPlan(null)}
          selectedPlan={checkoutPlan}
          onSuccess={() => {
            setCheckoutPlan(null);
            setUpgradeModalOpen(false);
            window.location.reload();
          }}
        />
      )}
      {/* In-app Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-3 duration-200 text-xs font-bold max-w-md ${
            toast.type === "error"
              ? "border-red-500/50 bg-red-950/95 text-red-200 shadow-red-950/50"
              : toast.type === "success"
              ? "border-emerald-500/50 bg-emerald-950/95 text-emerald-200 shadow-emerald-950/50"
              : "border-blue-500/50 bg-slate-900/95 text-slate-100 shadow-slate-950/50"
          }`}
        >
          {toast.type === "error" ? (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          ) : toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
      {/* 5. TEACHER LIVE POLL PROJECTOR MODAL (SPRINT 6) */}
      {showLivePollModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-slate-700 shadow-2xl relative space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Header with Room Code */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shadow-lg font-black text-xl">
                  ⚡
                </div>
                <div>
                  <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                    Phòng Khảo Sát Thời Gian Thực (Live Poll)
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-2xl sm:text-3xl font-mono font-black text-amber-300 tracking-wider">
                      MÃ PHÒNG: {livePollSession?.roomCode || "..."}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowLivePollModal(false)}
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Instruction Banner */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <span className="text-emerald-200">
                  Học sinh vào <strong>Cổng Học Sinh (/student/exams)</strong> và nhập mã{" "}
                  <strong className="text-amber-300 font-mono text-sm">{livePollSession?.roomCode}</strong> để bình chọn!
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-900/60 font-bold text-emerald-300 shrink-0">
                {livePollSession?.stats?.totalVotes || 0} học sinh đã vote
              </span>
            </div>

            {/* Question Snapshot */}
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1">
              <div className="text-[11px] font-bold uppercase text-slate-400">
                Câu hỏi đang chiếu ({currentIdx + 1}/{exam?.questions?.length || 1}):
              </div>
              <div className="text-sm font-semibold text-slate-200 line-clamp-2">
                {exam?.questions?.[currentIdx]?.content || "Câu hỏi hiện tại"}
              </div>
            </div>

            {/* Animated Distribution Bars */}
            <div className="space-y-3 py-2">
              {["A", "B", "C", "D"].map((opt) => {
                const count = livePollSession?.stats?.counts?.[opt] || 0;
                const pct = livePollSession?.stats?.percentages?.[opt] || 0;
                const isCorrect = !livePollSession?.isOpen && opt === livePollSession?.correctAnswer;

                return (
                  <div key={opt} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className={`flex items-center gap-2 ${isCorrect ? "text-emerald-400 font-black text-sm" : "text-slate-300"}`}>
                        <span className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center font-mono">
                          {opt}
                        </span>
                        <span>{isCorrect ? "✓ (ĐÁP ÁN CHUẨN)" : `Phương án ${opt}`}</span>
                      </span>
                      <span className="text-sm font-mono font-black text-amber-300">
                        {pct}% <span className="text-xs text-slate-400 font-normal">({count} em)</span>
                      </span>
                    </div>

                    <div className="h-4 rounded-xl bg-slate-800 overflow-hidden p-0.5 border border-slate-700">
                      <div
                        className={`h-full rounded-lg transition-all duration-500 ${
                          isCorrect
                            ? "bg-linear-to-r from-emerald-500 to-teal-400"
                            : "bg-linear-to-r from-blue-500 to-indigo-500"
                        }`}
                        style={{ width: `${Math.max(pct, count > 0 ? 3 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <div className="text-xs text-slate-400">
                {livePollSession?.isOpen ? (
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Đang nhận bình chọn trực tiếp...
                  </span>
                ) : (
                  <span className="text-amber-400 font-bold">
                    ✓ Đã khóa bình chọn & công bố đáp án
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {livePollSession?.isOpen ? (
                  <button
                    onClick={handleCloseLivePoll}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs transition shadow-lg shadow-emerald-600/30 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Khóa Vote & Hiện Đáp Án</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setLivePollSession(null);
                      handleToggleLivePoll();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
                  >
                    Mở Khảo Sát Mới
                  </button>
                )}

                <button
                  onClick={() => setShowLivePollModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  Thu Nhỏ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TeachingStudioPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white">
          <Loader2 className="h-9 w-9 animate-spin text-amber-400" />
        </div>
      }
    >
      <TeachingStudioContent />
    </Suspense>
  );
}
