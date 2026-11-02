"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CloudUpload,
  CloudOff,
  Sparkles,
  Star,
  Crown,
  Lock,
  Plus,
  BookOpen,
  Palette,
  ChevronDown,
  Minimize2,
  Maximize2,
  School,
  Square,
  Grid,
  AlignJustify,
  Maximize,
  FlaskConical,
  ExternalLink,
} from "lucide-react";
import { Whiteboard } from "@/types/whiteboard";
import { updateWhiteboard } from "@/lib/api/whiteboard";
import { STEM_LIBRARY_ITEMS, ExcalidrawLibraryItem } from "@/lib/whiteboard/stem-libraries";
import { BOARD_THEMES, BoardTheme, getThemeById } from "@/lib/whiteboard/board-themes";
import { convertQuestionToExcalidrawCard } from "@/lib/whiteboard/question-to-excalidraw";
import { ExamDrawer } from "@/components/whiteboard/exam-drawer";
import { FloatingClassroomTools } from "@/components/whiteboard/floating-classroom-tools";

type ExcalidrawEditorAPI = {
  getSceneElements: () => Record<string, unknown>[];
  updateScene: (sceneData: { elements?: Record<string, unknown>[]; appState?: Record<string, unknown> }) => void;
  setActiveTool?: (tool: { type: string } | { type: "custom"; customType: string }) => void;
};

/**
 * Xuất ảnh WebP thu nhỏ 360x225px nhẹ (~10-15KB) làm Thumbnail thật cho thẻ bảng vẽ
 */
async function generateThumbnailWebP(
  elements: Record<string, unknown>[],
  appState: Record<string, unknown>
): Promise<string | null> {
  if (!elements || elements.length === 0) return null;
  try {
    const { exportToBlob } = await import("@excalidraw/excalidraw");
    const blob = await exportToBlob({
      elements: elements as any,
      appState: {
        ...appState,
        exportWithDarkMode: false,
        exportBackground: true,
        viewBackgroundColor: (appState?.viewBackgroundColor as string) || "#ffffff",
      } as any,
      files: null,
      mimeType: "image/webp",
      quality: 0.55,
      maxWidthOrHeight: 360,
    });
    if (!blob) return null;
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn("Lỗi sinh thumbnail WebP:", err);
    return null;
  }
}

// Dynamic import Canvas with ssr: false
const WhiteboardCanvas = dynamic(
  () => import("@/components/whiteboard/whiteboard-canvas"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[calc(100vh-65px)] w-full items-center justify-center bg-muted/20">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium">Đang tải không gian Bảng trắng Excalidraw...</p>
        </div>
      </div>
    ),
  }
);

interface WhiteboardEditorProps {
  initialBoard: Whiteboard;
  isPro: boolean;
}

export default function WhiteboardEditor({
  initialBoard,
  isPro,
}: WhiteboardEditorProps) {
  const [board] = useState<Whiteboard>(initialBoard);
  const [title, setTitle] = useState(initialBoard.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved" | "error">("saved");
  const [isFavorite, setIsFavorite] = useState(initialBoard.is_favorite);
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawEditorAPI | null>(null);

  // Sprint W-2: Themes, Drawer, Classroom Tools
  const initialThemeId = (initialBoard.app_state as any)?.theme_preset || "modern_white";
  const [currentTheme, setCurrentTheme] = useState<BoardTheme>(getThemeById(initialThemeId));
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showStemMenu, setShowStemMenu] = useState(false);
  const [showExamDrawer, setShowExamDrawer] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [isLaserActive, setIsLaserActive] = useState(false);

  const handleToggleLaser = useCallback(() => {
    setIsLaserActive((prev) => {
      const next = !prev;
      if (excalidrawAPI && typeof (excalidrawAPI as any).setActiveTool === "function") {
        try {
          (excalidrawAPI as any).setActiveTool({ type: next ? "laser" : "selection" });
        } catch (e) {
          console.warn("Excalidraw laser tool fallback:", e);
        }
      }
      return next;
    });
  }, [excalidrawAPI]);

  // References for debounce
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMountRef = useRef<boolean>(true);
  const latestDataRef = useRef<{
    elements: Record<string, unknown>[];
    appState: Record<string, unknown>;
    files?: Record<string, unknown> | unknown[];
  }>({
    elements: initialBoard.elements || [],
    appState: initialBoard.app_state || {},
    files: initialBoard.files || {},
  });

  const localCacheKey = `edteach_wb_${initialBoard.id}`;
  const lastThumbHashRef = useRef<number>(initialBoard.elements?.length || 0);
  const currentThumbUrlRef = useRef<string | null>(initialBoard.thumbnail_url);

  // Auto-save logic với tự động sinh Thumbnail ngầm (Sprint W-1)
  const performSave = useCallback(
    async (
      elements: Record<string, unknown>[],
      appState: Record<string, unknown>,
      newTitle?: string,
      files?: Record<string, unknown> | unknown[]
    ) => {
      setSaveStatus("saving");
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem(
            localCacheKey,
            JSON.stringify({
              elements,
              appState,
              title: newTitle || title,
              savedAt: Date.now(),
            })
          );
        }

        let nextThumbnailUrl = currentThumbUrlRef.current;
        if (elements.length > 0 && elements.length !== lastThumbHashRef.current) {
          const generatedThumb = await generateThumbnailWebP(elements, appState);
          if (generatedThumb) {
            nextThumbnailUrl = generatedThumb;
            currentThumbUrlRef.current = generatedThumb;
            lastThumbHashRef.current = elements.length;
          }
        }

        const updatePayload: any = {
          title: newTitle || title,
          elements,
          app_state: {
            viewBackgroundColor: (appState?.viewBackgroundColor as string) || currentTheme.viewBackgroundColor,
            currentItemStrokeColor: (appState?.currentItemStrokeColor as string) || currentTheme.defaultStrokeColor,
            gridSize: (appState?.gridSize as number) ?? currentTheme.gridSize ?? 20,
            theme_preset: currentTheme.id,
          },
        };

        if (files !== undefined) {
          updatePayload.files = files;
        }

        if (nextThumbnailUrl) {
          updatePayload.thumbnail_url = nextThumbnailUrl;
        }

        const { success, error } = await updateWhiteboard(board.id, updatePayload);

        if (success) {
          setSaveStatus("saved");
        } else {
          console.error("Auto-save failed:", error);
          setSaveStatus("unsaved");
        }
      } catch (err) {
        console.error("Auto-save exception:", err);
        setSaveStatus("unsaved");
      }
    },
    [board.id, title, localCacheKey, currentTheme]
  );

  // Lưu trước khi rời trang
  useEffect(() => {
    return () => {
      if (latestDataRef.current?.elements?.length) {
        performSave(
          latestDataRef.current.elements,
          latestDataRef.current.appState,
          undefined,
          latestDataRef.current.files
        );
      }
    };
  }, [performSave]);

  // Phím tắt Esc thoát Zen Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isZenMode) {
        setIsZenMode(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isZenMode]);

  const handleCanvasChange = (
    elements: readonly Record<string, unknown>[],
    appState: Record<string, unknown>,
    files?: Record<string, unknown>
  ) => {
    latestDataRef.current = {
      elements: [...elements],
      appState: { ...appState },
      files: files ? { ...files } : latestDataRef.current?.files,
    };

    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    setSaveStatus("unsaved");

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      performSave(
        latestDataRef.current.elements,
        latestDataRef.current.appState,
        undefined,
        latestDataRef.current.files
      );
    }, 2500);
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (title.trim() !== board.title) {
      const cleanTitle = title.trim() || "Bảng vẽ chưa đặt tên";
      setTitle(cleanTitle);
      performSave(latestDataRef.current.elements, latestDataRef.current.appState, cleanTitle);
    }
  };

  const handleToggleFavorite = async () => {
    const nextVal = !isFavorite;
    setIsFavorite(nextVal);
    await updateWhiteboard(board.id, { is_favorite: nextVal });
  };

  // Đổi phông nền Sư phạm
  const handleSelectTheme = (theme: BoardTheme) => {
    setCurrentTheme(theme);
    setShowThemeMenu(false);

    if (excalidrawAPI) {
      const updatedAppState = {
        ...latestDataRef.current.appState,
        viewBackgroundColor: theme.viewBackgroundColor,
        currentItemStrokeColor: theme.defaultStrokeColor,
        gridSize: theme.gridSize || 20,
        theme_preset: theme.id,
      };

      excalidrawAPI.updateScene({
        appState: updatedAppState,
      });

      performSave(latestDataRef.current.elements, updatedAppState);
    }
  };

  // Chèn Mẫu vẽ STEM
  const handleInsertStemItem = (item: ExcalidrawLibraryItem) => {
    if (!excalidrawAPI) return;
    if (!isPro) {
      alert("Tính năng chèn nhanh hình mẫu STEM thuộc gói Pro. Vui lòng nâng cấp để sử dụng!");
      return;
    }

    const currentElements = excalidrawAPI.getSceneElements();
    const newElements = item.elements.map((el) => ({
      ...el,
      id: `${(el as any).type || "item"}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      x: ((el as any).x || 0) + 120,
      y: ((el as any).y || 0) + 100,
    }));

    excalidrawAPI.updateScene({
      elements: [...currentElements, ...newElements],
    });
    setShowStemMenu(false);
  };

  // Chèn một câu hỏi vào canvas Excalidraw
  const handleInsertQuestion = (
    question: any,
    options?: { includeExplanation?: boolean; subject?: string; grade?: number }
  ) => {
    if (!excalidrawAPI) return;

    const currentElements = excalidrawAPI.getSceneElements();

    // Tính toán tọa độ chèn thông minh: tìm điểm Y thấp nhất của các phần tử hiện tại
    let maxY = 80;
    currentElements.forEach((el: any) => {
      if (el && typeof el.y === "number" && typeof el.height === "number") {
        const bottom = el.y + el.height;
        if (bottom > maxY) maxY = bottom;
      }
    });

    const startX = 120;
    const startY = currentElements.length === 0 ? 80 : maxY + 60;

    const newQuestionElements = convertQuestionToExcalidrawCard(question, {
      startX,
      startY,
      includeExplanation: options?.includeExplanation,
      isDarkTheme: currentTheme.isDark,
      subject: options?.subject,
      grade: options?.grade,
    });

    excalidrawAPI.updateScene({
      elements: [...currentElements, ...newQuestionElements],
    });

    try {
      (excalidrawAPI as any).scrollToContent?.(newQuestionElements, { fitToViewport: false, animate: true });
    } catch {
      // fallback
    }

    latestDataRef.current.elements = [...currentElements, ...newQuestionElements];
    performSave(latestDataRef.current.elements, latestDataRef.current.appState);
  };

  // Chèn toàn bộ đề vào canvas
  const handleInsertAllQuestions = (questions: any[], subject?: string, grade?: number) => {
    if (!excalidrawAPI || !questions.length) return;

    const currentElements = excalidrawAPI.getSceneElements();
    let currentY = 80;

    // Tìm vị trí Y cuối cùng
    currentElements.forEach((el: any) => {
      if (el && typeof el.y === "number" && typeof el.height === "number") {
        const bottom = el.y + el.height;
        if (bottom > currentY) currentY = bottom;
      }
    });

    if (currentElements.length > 0) currentY += 60;

    const batchElements: Record<string, unknown>[] = [];

    questions.forEach((q) => {
      const qElements = convertQuestionToExcalidrawCard(q, {
        startX: 120,
        startY: currentY,
        includeExplanation: false,
        isDarkTheme: currentTheme.isDark,
        subject,
        grade,
      });

      batchElements.push(...qElements);
      currentY += 280;
    });

    excalidrawAPI.updateScene({
      elements: [...currentElements, ...batchElements],
    });

    latestDataRef.current.elements = [...currentElements, ...batchElements];
    performSave(latestDataRef.current.elements, latestDataRef.current.appState);
  };

  // AI Live Cloner: Đẻ câu tương tự đặt cạnh câu hỏi
  const handleTriggerLiveClone = async (question: any, subject?: string, grade?: number) => {
    try {
      const res = await fetch("/api/ai/live-clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.content,
          options: question.options,
          subject: subject || "Toán",
          grade: grade || 12,
          currentAnswer: question.correct_answer,
          explanation: question.explanation,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.cloned_question) {
        alert(data.error || "Không thể sinh câu hỏi tương tự bằng AI. Vui lòng thử lại!");
        return;
      }

      const cloned = {
        ...data.cloned_question,
        order: question.order ? `${question.order} (Biến thể ⏱️ 02:00)` : "Tương tự",
        difficulty: question.difficulty,
      };

      if (excalidrawAPI) {
        const currentElements = excalidrawAPI.getSceneElements();
        const cloneElements = convertQuestionToExcalidrawCard(cloned, {
          startX: 800,
          startY: 80,
          includeExplanation: true,
          isDarkTheme: currentTheme.isDark,
          subject,
          grade,
        });

        excalidrawAPI.updateScene({
          elements: [...currentElements, ...cloneElements],
        });

        latestDataRef.current.elements = [...currentElements, ...cloneElements];
        performSave(latestDataRef.current.elements, latestDataRef.current.appState);
      }
    } catch (err: any) {
      console.error("Lỗi Live Clone:", err);
      alert("Lỗi kết nối AI: " + err.message);
    }
  };

  // AI Scaffolding: Bẻ nhỏ câu khó 3 bước
  const handleTriggerScaffold = async (question: any, subject?: string, grade?: number) => {
    try {
      const res = await fetch("/api/ai/scaffold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.content,
          options: question.options,
          subject: subject || "Toán",
          grade: grade || 12,
          currentAnswer: question.correct_answer,
          explanation: question.explanation,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.steps) {
        alert(data.error || "Không thể tách câu hỏi bằng AI. Vui lòng thử lại!");
        return;
      }

      if (excalidrawAPI) {
        const currentElements = excalidrawAPI.getSceneElements();
        const scaffoldCards: Record<string, unknown>[] = [];
        let yOffset = 80;

        data.steps.forEach((step: any, idx: number) => {
          const stepQuestion = {
            order: `Bước ${idx + 1}: ${step.title || "Tư duy"}`,
            content: step.prompt || step.content || "",
            options: step.options || [],
            explanation: step.explanation || step.hint || "",
            difficulty: idx === 0 ? "easy" : idx === 1 ? "medium" : "hard",
          };

          const stepEls = convertQuestionToExcalidrawCard(stepQuestion, {
            startX: 800,
            startY: yOffset,
            includeExplanation: true,
            isDarkTheme: currentTheme.isDark,
            subject,
            grade,
          });

          scaffoldCards.push(...stepEls);
          yOffset += 240;
        });

        excalidrawAPI.updateScene({
          elements: [...currentElements, ...scaffoldCards],
        });

        latestDataRef.current.elements = [...currentElements, ...scaffoldCards];
        performSave(latestDataRef.current.elements, latestDataRef.current.appState);
      }
    } catch (err: any) {
      console.error("Lỗi Scaffolding:", err);
      alert("Lỗi kết nối AI: " + err.message);
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">
      {/* 1. TOPBAR (TỰ ĐỘNG ẨN KHI Ở ZEN FULLSCREEN MODE) */}
      <header
        className={`flex h-[60px] w-full items-center justify-between border-b bg-card px-4 z-20 transition-all duration-300 ${
          isZenMode ? "-mt-[60px] opacity-0 pointer-events-none" : "mt-0 opacity-100"
        }`}
      >
        {/* Left: Back & Title */}
        <div className="flex items-center gap-3">
          <Link
            href="/whiteboard"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground"
            title="Quay lại danh sách bảng vẽ"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="flex items-center gap-2">
            {isEditingTitle ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={(e) => e.key === "Enter" && handleTitleBlur()}
                autoFocus
                className="rounded-md border border-primary px-2.5 py-1 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20"
              />
            ) : (
              <button
                onClick={() => setIsEditingTitle(true)}
                className="group flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-semibold text-foreground hover:bg-muted transition"
                title="Bấm để đổi tên bảng vẽ"
              >
                <span>{title}</span>
                <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition">
                  (sửa)
                </span>
              </button>
            )}

            <button
              onClick={handleToggleFavorite}
              className={`rounded-md p-1.5 transition ${
                isFavorite
                  ? "text-amber-500 hover:text-amber-600"
                  : "text-muted-foreground hover:bg-muted"
              }`}
              title={isFavorite ? "Bỏ yêu thích" : "Đánh dấu yêu thích"}
            >
              <Star className={`h-4 w-4 ${isFavorite ? "fill-amber-500" : ""}`} />
            </button>
          </div>
        </div>

        {/* Center: Save Status */}
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1.5 text-primary">
              <CloudUpload className="h-4 w-4 animate-pulse" />
              Đang lưu đám mây...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1.5 text-emerald-600">
              <Check className="h-4 w-4" />
              Đã lưu an toàn
            </span>
          )}
          {saveStatus === "unsaved" && (
            <span className="flex items-center gap-1.5 text-amber-500">
              <CloudOff className="h-4 w-4" />
              Chưa lưu thay đổi
            </span>
          )}
        </div>

        {/* Right: Actions, Themes, Exam Drawer & Utilities */}
        <div className="flex items-center gap-2">
          {/* NÚT CHÈN ĐỀ THI */}
          <button
            onClick={() => setShowExamDrawer(true)}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Chèn Đề Thi</span>
          </button>

          {/* MENU PHÔNG NỀN BẢNG SƯ PHẠM */}
          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition"
              title="Chọn phông nền bảng lớp học"
            >
              <Palette className="h-3.5 w-3.5 text-blue-600" />
              <span className="hidden sm:inline">{currentTheme.name}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>

            {showThemeMenu && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-border bg-card p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                <div className="px-2 py-1.5 text-[11px] font-bold text-muted-foreground border-b border-border/60 mb-1">
                  PHÔNG NỀN BẢNG SƯ PHẠM
                </div>
                <div className="space-y-1">
                  {BOARD_THEMES.map((theme) => {
                    const isSelected = currentTheme.id === theme.id;
                    return (
                      <button
                        key={theme.id}
                        onClick={() => handleSelectTheme(theme)}
                        className={`flex w-full items-center gap-3 rounded-xl p-2 text-left text-xs transition ${
                          isSelected
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold"
                            : "hover:bg-muted text-foreground"
                        }`}
                      >
                        <div
                          className="h-7 w-7 rounded-lg border flex items-center justify-center shrink-0 shadow-2xs"
                          style={{ backgroundColor: theme.viewBackgroundColor }}
                        >
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: theme.defaultStrokeColor }}
                          />
                        </div>
                        <div className="flex-1 truncate">
                          <p className="font-semibold text-xs truncate">{theme.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{theme.description}</p>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-blue-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* NÚT PHÒNG THÍ NGHIỆM 3D */}
          <Link
            href="/labs"
            target="_blank"
            className="hidden lg:flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 transition"
            title="Mở 54+ Phòng Thí Nghiệm 3D (Vật lý, Hóa học, Sinh học, Địa lý) kèm kính vẽ"
          >
            <FlaskConical className="h-3.5 w-3.5 text-indigo-600" />
            <span>Phòng TN 3D</span>
            <ExternalLink className="h-3 w-3 text-indigo-400" />
          </Link>

          {/* STEM Library Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowStemMenu(!showStemMenu)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                isPro
                  ? "border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300"
                  : "border-border bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-violet-600" />
              <span className="hidden sm:inline">Mẫu vẽ STEM</span>
              {isPro ? (
                <span className="rounded bg-violet-600 px-1 py-0.2 text-[10px] text-white">PRO</span>
              ) : (
                <Lock className="h-3 w-3 text-muted-foreground" />
              )}
            </button>

            {/* Dropdown Menu */}
            {showStemMenu && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-border bg-card p-3 shadow-xl z-50 animate-in fade-in zoom-in-95">
                <div className="mb-2 flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    <Sparkles className="h-4 w-4 text-violet-600" />
                    <span>Thư viện Giáo dục & Vật lý</span>
                  </div>
                  {!isPro && (
                    <Link
                      href="/wallet"
                      className="text-[11px] font-semibold text-primary hover:underline"
                    >
                      Nâng cấp Pro
                    </Link>
                  )}
                </div>

                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {STEM_LIBRARY_ITEMS.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleInsertStemItem(item)}
                      className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition hover:bg-muted group"
                    >
                      <div>
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="text-[11px] text-muted-foreground">{item.category}</p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition">
                        <Plus className="h-4 w-4 text-primary" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. KHÔNG GIAN BẢNG VẼ EXCALIDRAW */}
      <main className="flex-1 w-full h-[calc(100vh-60px)] relative">
        <WhiteboardCanvas
          initialElements={board.elements}
          initialAppState={{
            ...board.app_state,
            viewBackgroundColor: currentTheme.viewBackgroundColor,
            currentItemStrokeColor: currentTheme.defaultStrokeColor,
            gridSize: currentTheme.gridSize || 20,
          }}
          initialFiles={board.files}
          isPro={isPro}
          onChange={handleCanvasChange}
          onApiReady={(api) => setExcalidrawAPI(api as unknown as ExcalidrawEditorAPI)}
        />

        {/* Nút thoát Zen Mode khi Topbar đang ẩn */}
        {isZenMode && (
          <button
            onClick={() => setIsZenMode(false)}
            className="fixed top-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white px-3.5 py-1 text-xs font-bold shadow-lg backdrop-blur-md transition"
          >
            <Minimize2 className="h-3.5 w-3.5" />
            <span>Thoát Zen Mode (Esc)</span>
          </button>
        )}

        {/* 3. BỘ CÔNG CỤ BỤC GIẢNG NỔI (Timer, Laser, Fullscreen) */}
        <FloatingClassroomTools
          isZenMode={isZenMode}
          onToggleZenMode={() => setIsZenMode(!isZenMode)}
          isLaserActive={isLaserActive}
          onToggleLaser={handleToggleLaser}
        />

        {/* 4. NGĂN KÉO KHO ĐỀ THI & CHÈN CÂU HỎI */}
        <ExamDrawer
          isOpen={showExamDrawer}
          onClose={() => setShowExamDrawer(false)}
          onInsertQuestion={handleInsertQuestion}
          onInsertAllQuestions={handleInsertAllQuestions}
          onTriggerLiveClone={handleTriggerLiveClone}
          onTriggerScaffold={handleTriggerScaffold}
          isDarkTheme={currentTheme.isDark}
        />
      </main>
    </div>
  );
}
