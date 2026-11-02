"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo, useSyncExternalStore, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Crown,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  PenTool,
  Wand2,
} from "lucide-react";
import { getExamById, ExamWithQuestions, Question } from "@/lib/api/exams";
import { getTeachWhiteboard, saveTeachWhiteboard } from "@/lib/api/whiteboard";
import { useAuth } from "@/context/auth-context";
import { isProUser, isMaxUser, PricingPlan } from "@/lib/payment/plans";
import { LatexRenderer } from "@/components/ui/latex-renderer";
import { LABS, LabLesson } from "@/data/labs";
import { UpgradeTierModal } from "@/components/modals/upgrade-tier-modal";
import { PaymentCheckoutModal } from "@/components/modals/payment-checkout-modal";
import { TransparentWhiteboardOverlay } from "@/components/labs/transparent-whiteboard-overlay";
import { convertQuestionToExcalidrawCard } from "@/lib/whiteboard/question-to-excalidraw";
import { sanitizeExcalidrawElements } from "@/lib/whiteboard/sanitize-elements";

// New Modular Teach Components
import { TeachTopbar } from "@/components/teach/teach-topbar";
import { QuestionPanel } from "@/components/teach/question-panel";
import { TeachSplitPane } from "@/components/teach/teach-split-pane";
import { TeachWhiteboardWrapper } from "@/components/teach/teach-whiteboard-wrapper";
import { TeachShortcutsDialog } from "@/components/teach/teach-shortcuts-dialog";
import { TeachCommandPalette } from "@/components/teach/teach-command-palette";
import { TeachProjectorOverlays } from "@/components/teach/teach-projector-overlays";
import { useFontMultiplier } from "@/lib/teach/use-auto-fit-text";
import { triggerConfetti } from "@/lib/teach/confetti";

type ExcalidrawAPI = {
  getSceneElements: () => unknown[];
  updateScene: (sceneData: { elements?: unknown[]; appState?: Record<string, unknown> }) => void;
};

// Keyword mapping helper for 3D Labs
function findAutoMatchingLab(content: string, subject?: string): LabLesson | null {
  if (!content) return null;
  const lower = content.toLowerCase();

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

const emptySubscribe = () => () => {};

function TeachingStudioContent() {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

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

  // Toast Notification
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
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);

  // Font Size Multiplier (0.9, 1.0, 1.2, 1.4) saved in localStorage
  const [fontSizeMultiplier, setFontSizeMultiplier] = useFontMultiplier(1.0);

  // Split Ratio (0 to 100) & Dragging
  const [splitRatio, setSplitRatio] = useState<number>(50);
  const [isDragging, setIsDragging] = useState(false);

  // Fullscreen
  const [isFullscreen, setIsFullscreen] = useState(false);
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  // Right Column 3 Tabs: "whiteboard" | "lab3d" | "multi_method"
  const [activeRightTab, setActiveRightTab] = useState<"whiteboard" | "lab3d" | "multi_method">("whiteboard");

  // Per-Question Drawing Storage
  const drawingsMapRef = useRef<Record<string, unknown[]>>({});
  const [questionsWithDrawings, setQuestionsWithDrawings] = useState<Record<string, boolean>>({});
  const excalidrawApiRef = useRef<ExcalidrawAPI | null>(null);
  const currentIdxRef = useRef(currentIdx);
  useEffect(() => {
    currentIdxRef.current = currentIdx;
  }, [currentIdx]);

  // 3D Lab Selection per question
  const [selectedLabSlug, setSelectedLabSlug] = useState<string>("");
  const [isGlassOverlayActive, setIsGlassOverlayActive] = useState(false);

  // MAX Feature 1: Live Question Cloner
  const [clonedQuestionsMap, setClonedQuestionsMap] = useState<
    Record<string, { content: string; options: string[]; correct_answer: string; explanation: string }>
  >({});
  const [isCloning, setIsCloning] = useState(false);
  const [showClonedTab, setShowClonedTab] = useState<Record<string, boolean>>({});

  // Countdown / Stopwatch Timer with Sound
  const [timerSeconds, setTimerSeconds] = useState(120);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<"countdown" | "stopwatch">("countdown");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Presentation Overlays: Laser, Spotlight, Projector Mode
  const [isLaserActive, setIsLaserActive] = useState(false);
  const [isSpotlightActive, setIsSpotlightActive] = useState(false);
  const [isProjectorMode, setIsProjectorMode] = useState(false);

  // Modals: Shortcuts Dialog, Command Palette
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Live Poll State
  const [showLivePollModal, setShowLivePollModal] = useState(false);
  const [livePollSession, setLivePollSession] = useState<any | null>(null);
  const [isOpeningPoll, setIsOpeningPoll] = useState(false);

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

  // Timer Tick
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (timerMode === "countdown") {
            if (prev <= 1) {
              setIsTimerRunning(false);
              return 0;
            }
            return prev - 1;
          } else {
            return prev + 1;
          }
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerMode]);

  // Whiteboard Persistence (Autosave to LocalStorage & Supabase)
  const teachSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const triggerTeachSave = useCallback((newMap: Record<string, unknown[]>) => {
    if (!examId) return;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`edteach_teach_drawings_${examId}`, JSON.stringify(newMap));
      } catch {
        // ignore
      }
    }
    if (teachSaveTimerRef.current) {
      clearTimeout(teachSaveTimerRef.current);
    }
    teachSaveTimerRef.current = setTimeout(() => {
      saveTeachWhiteboard(examId, newMap, exam?.name);
    }, 3000);
  }, [examId, exam?.name]);

  // Load Exam or Hotfix OMR Session
  useEffect(() => {
    async function loadData() {
      if (!examId) return;
      try {
        setLoading(true);

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

        // Standard Exam from DB (fetch drawings & exam in parallel)
        const [savedExamDrawings, data] = await Promise.all([
          getTeachWhiteboard(examId).catch((): Record<string, unknown[]> => ({})),
          getExamById(examId),
        ]);
        if (savedExamDrawings && Object.keys(savedExamDrawings).length > 0) {
          drawingsMapRef.current = savedExamDrawings;
          const initMap: Record<string, boolean> = {};
          for (const qId of Object.keys(savedExamDrawings)) {
            if (savedExamDrawings[qId]?.length > 0) initMap[qId] = true;
          }
          setQuestionsWithDrawings(initMap);
        }

        if (!data) {
          setError("Không tìm thấy đề thi hoặc đề thi đã bị xóa.");
        } else {
          if (data.questions && Array.isArray(data.questions)) {
            data.questions.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));

            if (isHotfixMode && hotfixPayload?.topMissedQuestions?.length) {
              const missedNums = new Set(hotfixPayload.topMissedQuestions.map((q: any) => Number(q.questionNum)));
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

  // Save current question drawing
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
  }, [exam, triggerTeachSave]);

  // Switch to question index
  const goToQuestion = useCallback(
    (newIdx: number) => {
      if (!exam?.questions || newIdx < 0 || newIdx >= exam.questions.length) return;

      saveCurrentQuestionDrawing();

      setSelectedOption(null);
      setShowCorrectAnswer(false);
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

      if (nextQ) {
        const autoLab = findAutoMatchingLab(nextQ.content, exam?.subject);
        if (autoLab) {
          setSelectedLabSlug(autoLab.slug);
        }
      }

      // Check if user completed the exam
      if (newIdx === exam.questions.length - 1) {
        triggerConfetti();
      }
    },
    [exam, saveCurrentQuestionDrawing]
  );

  // Stable handlers for WhiteboardCanvas in Teach Mode
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

  // Initial lab setup
  useEffect(() => {
    if (exam?.questions?.[0]) {
      const initialLab = findAutoMatchingLab(exam.questions[0].content, exam.subject);
      if (initialLab) {
        setSelectedLabSlug(initialLab.slug);
      }
    }
  }, [exam]);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      // Ctrl + K -> Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
        return;
      }

      if (e.key === "?") {
        e.preventDefault();
        setShortcutsOpen((prev) => !prev);
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToQuestion(currentIdx - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToQuestion(currentIdx + 1);
      } else if (e.key.toLowerCase() === "t") {
        e.preventDefault();
        setIsTimerRunning((prev) => !prev);
      } else if (e.key.toLowerCase() === "l") {
        e.preventDefault();
        setIsLaserActive((prev) => !prev);
      } else if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        setIsSpotlightActive((prev) => !prev);
      } else if (e.key.toLowerCase() === "p") {
        e.preventDefault();
        setIsProjectorMode((prev) => !prev);
      } else if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        toggleFullscreen();
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
  }, [currentIdx, goToQuestion, toggleFullscreen]);

  // Clear current drawing
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
      showToast("Đã xóa sạch nháp câu này.", "info");
    }
  };

  // Pin Question to Canvas ("Đưa đề lên bảng")
  const handlePinQuestionToBoard = useCallback(() => {
    if (!excalidrawApiRef.current || !exam?.questions) return;
    const originalQ = exam.questions[currentIdx];
    if (!originalQ) return;

    // Nếu đang xem câu hỏi biến thể AI (cloned), đưa câu biến thể lên; ngược lại đưa câu gốc
    const isViewingClonedNow = !!showClonedTab[originalQ.id];
    const currentClonedNow = clonedQuestionsMap[originalQ.id];
    const targetQ = isViewingClonedNow && currentClonedNow ? {
      ...originalQ,
      content: currentClonedNow.content,
      options: currentClonedNow.options,
      correct_answer: currentClonedNow.correct_answer,
      explanation: currentClonedNow.explanation,
    } : originalQ;

    try {
      const cardElements = convertQuestionToExcalidrawCard(targetQ, {
        startX: 120,
        startY: 100,
        isDarkTheme: true,
        subject: exam.subject,
        grade: Number(exam.grade) || 12,
        questionIndex: currentIdx + 1,
      });

      const currentElements = (excalidrawApiRef.current.getSceneElements?.() || []) as Record<string, unknown>[];
      const merged = sanitizeExcalidrawElements([...currentElements, ...cardElements]);

      excalidrawApiRef.current.updateScene({ elements: merged as any });
      drawingsMapRef.current[originalQ.id] = merged;
      setQuestionsWithDrawings((prev) => ({ ...prev, [originalQ.id]: true }));
      triggerTeachSave(drawingsMapRef.current);

      if (splitRatio === 100) setSplitRatio(50);
      setActiveRightTab("whiteboard");
      showToast(`📌 Đã đưa CÂU ${currentIdx + 1} lên bảng vẽ canvas!`, "success");
    } catch (err: any) {
      showToast("Lỗi đưa câu hỏi lên bảng: " + err.message, "error");
    }
  }, [exam, currentIdx, showClonedTab, clonedQuestionsMap, splitRatio, triggerTeachSave, showToast]);

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
        "Đặc quyền gói MAX: AI tự động sinh câu hỏi đẳng cấu giữ nguyên dạng bài nhưng thay đổi số liệu, kèm bộ đếm ngược 2 phút cho học sinh làm thử ngay tại lớp."
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
          [currentQ.id]: 1,
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
        setActiveRightTab("multi_method");
        if (splitRatio === 100) setSplitRatio(50);
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

  // Live Poll Interval Hook
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
          showToast("Lỗi mở phòng Live Poll: " + err.message, "error");
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
      showToast("Lỗi khóa bình chọn: " + err.message, "error");
    }
  };

  const currentScaffolding = currentQ ? scaffoldMap[currentQ.id] : undefined;
  const currentRevealedStep = currentQ ? revealedStepCount[currentQ.id] || 0 : 0;
  const currentMultiMethods = currentQ ? multiMethodMap[currentQ.id] : undefined;
  const activeLab = LABS.find((l) => l.slug === selectedLabSlug) || LABS[0];

  const isOverallLoading = loading || authLoading;

  if (!isClient || isOverallLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-9 w-9 animate-spin text-blue-500" />
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
        <h2 className="text-2xl font-bold text-white">Bục Giảng Số Dành Riêng Cho Gói PRO & MAX</h2>
        <p className="mt-3 text-sm text-slate-400 max-w-lg leading-relaxed">
          Trải nghiệm giao diện trình chiếu tự động đo cỡ chữ, bảng nháp Sư phạm đồng bộ theme tối, thí nghiệm mô phỏng 3D và trợ giảng đa cách giải.
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

        <UpgradeTierModal
          isOpen={upgradeModalOpen}
          onClose={() => setUpgradeModalOpen(false)}
          requiredTier="pro"
          featureTitle="Trình chiếu Bục Giảng Số 4.0"
          featureDesc="Nâng cấp lên gói PRO để mở khóa toàn bộ tính năng Bục Giảng Số, bảng nháp thông minh và kho phòng thí nghiệm 3D."
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
          className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md cursor-pointer hover:bg-blue-500"
        >
          Quay lại danh sách đề thi
        </button>
      </div>
    );
  }

  return (
    <div
      className={`flex h-screen h-[100dvh] w-screen flex-col overflow-hidden select-none transition-colors ${
        isProjectorMode ? "bg-black text-white" : "bg-slate-950 text-slate-100"
      }`}
    >
      {/* 1. TOPBAR GỘP DUY NHẤT CAO 56PX */}
      <TeachTopbar
        examName={exam.name}
        isMax={isMax}
        isPro={isPro}
        splitRatio={splitRatio}
        onSetSplitRatio={setSplitRatio}
        fontSizeMultiplier={fontSizeMultiplier}
        onSetFontSizeMultiplier={setFontSizeMultiplier}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        timerSeconds={timerSeconds}
        isTimerRunning={isTimerRunning}
        onToggleTimer={() => setIsTimerRunning((v) => !v)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((v) => !v)}
        livePollSession={livePollSession}
        onToggleLivePoll={handleToggleLivePoll}
        isLaserActive={isLaserActive}
        onToggleLaser={() => setIsLaserActive((v) => !v)}
        isSpotlightActive={isSpotlightActive}
        onToggleSpotlight={() => setIsSpotlightActive((v) => !v)}
        isProjectorMode={isProjectorMode}
        onToggleProjectorMode={() => setIsProjectorMode((v) => !v)}
        activeRightTab={activeRightTab}
        onSelectRightTab={setActiveRightTab}
        onPinQuestionToBoard={handlePinQuestionToBoard}
        onTriggerLiveClone={handleLiveCloneQuestion}
        isCloning={isCloning}
        onTriggerScaffold={handleScaffoldQuestion}
        isScaffolding={isScaffolding}
        onTriggerMultiMethod={handleFetchMultiMethod}
        isSolvingMultiMethod={isSolvingMultiMethod}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
      />

      {/* 2. SPLIT PANE (LEFT QUESTION, RIGHT WHITEBOARD / 3D LAB / MULTI-METHOD) */}
      <TeachSplitPane
        splitRatio={splitRatio}
        onSetSplitRatio={setSplitRatio}
        isDragging={isDragging}
        setIsDragging={setIsDragging}
        leftPane={
          <QuestionPanel
            isDraggingSplitter={isDragging}
            questionNumber={currentIdx + 1}
            totalQuestions={totalQuestions}
            question={currentQ}
            clonedQuestion={currentCloned}
            isViewingCloned={isViewingCloned}
            onToggleCloned={(show) =>
              setShowClonedTab((prev) => ({
                ...prev,
                [currentQ?.id || ""]: show,
              }))
            }
            selectedOption={selectedOption}
            onSelectOption={setSelectedOption}
            showCorrectAnswer={showCorrectAnswer}
            onToggleCorrectAnswer={() => {
              setShowCorrectAnswer((prev) => {
                const next = !prev;
                if (next) triggerConfetti();
                return next;
              });
            }}
            onPrevQuestion={() => goToQuestion(currentIdx - 1)}
            onNextQuestion={() => goToQuestion(currentIdx + 1)}
            onGoToQuestion={goToQuestion}
            canPrev={currentIdx > 0}
            canNext={currentIdx < totalQuestions - 1}
            questionsWithDrawings={questionsWithDrawings}
            clonedQuestionsMap={clonedQuestionsMap}
            fontSizeMultiplier={fontSizeMultiplier}
            missedStat={currentMissedStat}
            scaffoldingSteps={currentScaffolding}
            revealedScaffoldCount={currentRevealedStep}
            onRevealNextScaffoldStep={(step) =>
              setRevealedStepCount((prev) => ({
                ...prev,
                [currentQ?.id || ""]: step,
              }))
            }
            onTriggerLiveClone={handleLiveCloneQuestion}
            isCloning={isCloning}
            onTriggerScaffold={handleScaffoldQuestion}
            isScaffolding={isScaffolding}
          />
        }
        rightPane={
          <div className="flex flex-col h-full w-full overflow-hidden bg-slate-950">
            {/* TAB 1: BẢNG NHÁP SƯ PHẠM */}
            {activeRightTab === "whiteboard" && (
              <TeachWhiteboardWrapper
                isPro={isPro}
                onApiReady={handleCanvasApiReady}
                onChange={handleCanvasChange}
                onClearDrawing={handleClearCurrentDrawing}
                onPinQuestion={handlePinQuestionToBoard}
                isMaximized={splitRatio === 0}
                onToggleMaximize={() => setSplitRatio(splitRatio === 0 ? 50 : 0)}
                hasSavedDrawing={!!questionsWithDrawings[currentQ?.id || ""]}
              />
            )}

            {/* TAB 2: PHÒNG THÍ NGHIỆM 3D */}
            {activeRightTab === "lab3d" && (
              <div className="flex-1 w-full h-full flex flex-col bg-slate-900">
                <div className="flex items-center justify-between bg-slate-950 px-4 py-2 border-b border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-indigo-500/20 text-indigo-300 px-2 py-0.5 font-bold">
                      {activeLab.titleVi}
                    </span>
                    <span className="text-slate-400 hidden sm:inline">{activeLab.gdpt}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsGlassOverlayActive((prev) => !prev)}
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
                      className="p-1 rounded bg-slate-800 text-slate-400 hover:text-white"
                      title="Mở toàn màn hình tab mới"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
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
              <div className="flex-1 w-full h-full overflow-y-auto bg-slate-900 p-6 space-y-6">
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
        }
      />

      {/* 3. PROJECTOR TOOLS OVERLAYS (LASER, SPOTLIGHT, AUTO-HIDE CURSOR) */}
      <TeachProjectorOverlays
        isLaserActive={isLaserActive}
        onToggleLaser={() => setIsLaserActive((v) => !v)}
        isSpotlightActive={isSpotlightActive}
        onToggleSpotlight={() => setIsSpotlightActive((v) => !v)}
        isProjectorMode={isProjectorMode}
      />

      {/* 4. KEYBOARD SHORTCUTS MODAL */}
      <TeachShortcutsDialog
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />

      {/* 5. COMMAND PALETTE (CTRL+K) */}
      <TeachCommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        totalQuestions={totalQuestions}
        onGoToQuestion={goToQuestion}
        onToggleTimer={() => setIsTimerRunning((v) => !v)}
        onToggleLaser={() => setIsLaserActive((v) => !v)}
        onToggleSpotlight={() => setIsSpotlightActive((v) => !v)}
        onToggleProjectorMode={() => setIsProjectorMode((v) => !v)}
        onToggleFullscreen={toggleFullscreen}
        onSetSplitRatio={setSplitRatio}
        onSelectRightTab={setActiveRightTab}
        onPinQuestionToBoard={handlePinQuestionToBoard}
        onTriggerLiveClone={handleLiveCloneQuestion}
        onTriggerScaffold={handleScaffoldQuestion}
        onToggleLivePoll={handleToggleLivePoll}
        onOpenShortcuts={() => setShortcutsOpen(true)}
      />

      {/* 6. UPGRADE TIER MODAL (MAX FEATURES) */}
      <UpgradeTierModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        requiredTier="max"
        featureTitle={upgradeFeature?.title || "Nâng cấp gói MAX"}
        featureDesc={upgradeFeature?.desc || "Mở khóa toàn bộ bộ công cụ Luyện thi & Chữa bài Chuyên sâu."}
        onSelectPlan={(plan) => setCheckoutPlan(plan)}
      />

      {/* 7. PAYOS CHECKOUT MODAL */}
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

      {/* 8. IN-APP TOAST NOTIFICATION */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-3 duration-200 text-xs font-bold max-w-md select-none ${
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

      {/* 9. TEACHER LIVE POLL PROJECTOR MODAL */}
      {showLivePollModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-slate-700 shadow-2xl relative space-y-6 animate-in fade-in zoom-in-95 duration-200 select-none">
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
          <Loader2 className="h-9 w-9 animate-spin text-blue-500" />
        </div>
      }
    >
      <TeachingStudioContent />
    </Suspense>
  );
}
