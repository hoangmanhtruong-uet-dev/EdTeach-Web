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
import { MathFormulaModal } from "@/components/whiteboard/math-formula-modal";
import { CasioCalculatorModal } from "@/components/whiteboard/casio-calculator-modal";
import { PipLabModal } from "@/components/whiteboard/pip-lab-modal";
import { BottomSlideBar } from "@/components/whiteboard/bottom-slide-bar";
import { detectStemShapeIdForQuestion } from "@/lib/whiteboard/question-to-excalidraw";
import { WhiteboardPage } from "@/types/whiteboard";
import { Calculator } from "lucide-react";

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

  // Multi-page state (Sprint STEM-1)
  const initialPages: WhiteboardPage[] =
    initialBoard.pages && initialBoard.pages.length > 0
      ? initialBoard.pages
      : (initialBoard.app_state as any)?.pages && (initialBoard.app_state as any).pages.length > 0
      ? (initialBoard.app_state as any).pages
      : [
          {
            id: "page_1",
            title: "Trang 1",
            elements: initialBoard.elements || [],
            app_state: initialBoard.app_state || {},
            files: initialBoard.files || {},
            thumbnail_url: initialBoard.thumbnail_url,
          },
        ];
  const [pages, setPages] = useState<WhiteboardPage[]>(initialPages);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);

  // STEM Floating Modals
  const [showMathModal, setShowMathModal] = useState(false);
  const [showCasioModal, setShowCasioModal] = useState(false);
  const [showPipLabModal, setShowPipLabModal] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

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

  // Auto-save logic với tự động sinh Thumbnail ngầm & lưu Multi-page
  const performSave = useCallback(
    async (
      elements: Record<string, unknown>[],
      appState: Record<string, unknown>,
      newTitle?: string,
      files?: Record<string, unknown> | unknown[],
      updatedPagesList?: WhiteboardPage[]
    ) => {
      setSaveStatus("saving");
      try {
        const pagesToSave = updatedPagesList || pages.map((p, idx) =>
          idx === currentPageIndex
            ? { ...p, elements, app_state: appState, files: files || p.files }
            : p
        );

        if (typeof window !== "undefined") {
          localStorage.setItem(
            localCacheKey,
            JSON.stringify({
              elements,
              appState,
              pages: pagesToSave,
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
          pages: pagesToSave,
          app_state: {
            viewBackgroundColor: (appState?.viewBackgroundColor as string) || currentTheme.viewBackgroundColor,
            currentItemStrokeColor: (appState?.currentItemStrokeColor as string) || currentTheme.defaultStrokeColor,
            gridSize: (appState?.gridSize as number) ?? currentTheme.gridSize ?? 20,
            theme_preset: currentTheme.id,
            pages: pagesToSave,
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
    [board.id, title, localCacheKey, currentTheme, pages, currentPageIndex]
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

  // ================= MULTI-PAGE SLIDE HANDLERS =================
  const handleSelectPage = (targetIndex: number) => {
    if (targetIndex === currentPageIndex || targetIndex < 0 || targetIndex >= pages.length) return;

    // 1. Lưu dữ liệu trang hiện tại
    const currentElements = excalidrawAPI ? (excalidrawAPI.getSceneElements() as any[]) : latestDataRef.current.elements;
    const currentFiles = (excalidrawAPI as any)?.getFiles ? (excalidrawAPI as any).getFiles() : latestDataRef.current.files;

    const updatedPages = pages.map((p, idx) =>
      idx === currentPageIndex
        ? {
            ...p,
            elements: currentElements,
            app_state: latestDataRef.current.appState,
            files: currentFiles,
          }
        : p
    );
    setPages(updatedPages);
    setCurrentPageIndex(targetIndex);

    // 2. Chuyển sang trang đích
    const targetPage = updatedPages[targetIndex];
    latestDataRef.current = {
      elements: targetPage.elements || [],
      appState: {
        ...targetPage.app_state,
        viewBackgroundColor: currentTheme.viewBackgroundColor,
        currentItemStrokeColor: currentTheme.defaultStrokeColor,
      },
      files: targetPage.files || {},
    };

    if (excalidrawAPI) {
      if ((excalidrawAPI as any).addFiles && targetPage.files) {
        const filesArr = Array.isArray(targetPage.files)
          ? targetPage.files
          : Object.values(targetPage.files);
        if (filesArr.length > 0) {
          (excalidrawAPI as any).addFiles(filesArr);
        }
      }

      excalidrawAPI.updateScene({
        elements: targetPage.elements || [],
        appState: {
          ...targetPage.app_state,
          viewBackgroundColor: currentTheme.viewBackgroundColor,
          currentItemStrokeColor: currentTheme.defaultStrokeColor,
        },
      });
    }

    performSave(targetPage.elements || [], targetPage.app_state || {}, undefined, targetPage.files, updatedPages);
  };

  const handleAddPage = () => {
    const newPageNum = pages.length + 1;
    const newPage: WhiteboardPage = {
      id: `page_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: `Trang ${newPageNum}`,
      elements: [],
      app_state: {
        viewBackgroundColor: currentTheme.viewBackgroundColor,
        currentItemStrokeColor: currentTheme.defaultStrokeColor,
      },
      files: {},
    };
    const nextPages = [...pages, newPage];
    setPages(nextPages);
    handleSelectPage(nextPages.length - 1);
  };

  const handleDuplicatePage = (idx: number) => {
    const srcPage = pages[idx];
    if (!srcPage) return;
    const duplicatedElements = (srcPage.elements || []).map((el: any) => ({
      ...el,
      id: `${el.type || "el"}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    }));
    const newPage: WhiteboardPage = {
      id: `page_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: `${srcPage.title} (Bản sao)`,
      elements: duplicatedElements,
      app_state: { ...srcPage.app_state },
      files: srcPage.files ? { ...srcPage.files } : {},
    };
    const nextPages = [...pages.slice(0, idx + 1), newPage, ...pages.slice(idx + 1)];
    setPages(nextPages);
    handleSelectPage(idx + 1);
  };

  const handleDeletePage = (idx: number) => {
    if (pages.length <= 1) return;
    const nextPages = pages.filter((_, i) => i !== idx);
    setPages(nextPages);
    const nextIndex = Math.min(currentPageIndex, nextPages.length - 1);
    handleSelectPage(nextIndex);
  };

  const handleRenamePage = (idx: number, newTitle: string) => {
    const nextPages = pages.map((p, i) => (i === idx ? { ...p, title: newTitle } : p));
    setPages(nextPages);
    performSave(latestDataRef.current.elements, latestDataRef.current.appState, undefined, undefined, nextPages);
  };

  // ================= STEM TOOLS INSERTION HANDLERS =================
  const handleInsertFormula = (svgDataUrl: string, width: number, height: number, rawLatex: string) => {
    if (!excalidrawAPI) return;

    const fileId = `math_file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newFile = {
      id: fileId,
      dataURL: svgDataUrl,
      mimeType: "image/svg+xml",
      created: Date.now(),
    };

    if ((excalidrawAPI as any).addFiles) {
      (excalidrawAPI as any).addFiles([newFile]);
    }

    const currentElements = excalidrawAPI.getSceneElements() as any[];
    let maxY = 100;
    currentElements.forEach((el) => {
      if (el && typeof el.y === "number" && typeof el.height === "number") {
        const bottom = el.y + el.height;
        if (bottom > maxY) maxY = bottom;
      }
    });

    const newElement: any = {
      id: `math_el_${Date.now()}`,
      type: "image",
      fileId,
      status: "saved",
      x: 140,
      y: currentElements.length === 0 ? 100 : maxY + 40,
      width: Math.max(120, width),
      height: Math.max(50, height),
      scale: [1, 1],
      isDeleted: false,
      customData: { type: "latex", rawLatex },
    };

    excalidrawAPI.updateScene({
      elements: [...currentElements, newElement],
    });

    latestDataRef.current.elements = [...currentElements, newElement];
    performSave(latestDataRef.current.elements, latestDataRef.current.appState);
  };

  const handlePasteFromCasio = (calcText: string) => {
    if (!excalidrawAPI || !calcText.trim()) return;
    const currentElements = excalidrawAPI.getSceneElements() as any[];
    let maxY = 100;
    currentElements.forEach((el) => {
      if (el && typeof el.y === "number" && typeof el.height === "number") {
        const bottom = el.y + el.height;
        if (bottom > maxY) maxY = bottom;
      }
    });

    const textElement: any = {
      id: `casio_calc_${Date.now()}`,
      type: "text",
      x: 140,
      y: currentElements.length === 0 ? 100 : maxY + 30,
      text: `[CASIO fx-580] ${calcText}`,
      fontSize: 20,
      fontFamily: 2,
      textAlign: "left",
      verticalAlign: "top",
      strokeColor: "#f59e0b",
      backgroundColor: "transparent",
      isDeleted: false,
    };

    excalidrawAPI.updateScene({
      elements: [...currentElements, textElement],
    });
    latestDataRef.current.elements = [...currentElements, textElement];
    performSave(latestDataRef.current.elements, latestDataRef.current.appState);
  };

  const handleSnapshotFromLab = (lab: any) => {
    if (!excalidrawAPI || !lab) return;
    const currentElements = excalidrawAPI.getSceneElements() as any[];
    let maxY = 100;
    currentElements.forEach((el) => {
      if (el && typeof el.y === "number" && typeof el.height === "number") {
        const bottom = el.y + el.height;
        if (bottom > maxY) maxY = bottom;
      }
    });

    const labBox: any = {
      id: `lab_box_${Date.now()}`,
      type: "rectangle",
      x: 140,
      y: currentElements.length === 0 ? 100 : maxY + 30,
      width: 480,
      height: 90,
      strokeColor: "#059669",
      backgroundColor: currentTheme.isDark ? "#064e3b33" : "#ecfdf5",
      fillStyle: "solid",
      strokeWidth: 2,
      roundness: { type: 3 },
      isDeleted: false,
    };

    const labText: any = {
      id: `lab_txt_${Date.now()}`,
      type: "text",
      x: 160,
      y: (currentElements.length === 0 ? 100 : maxY + 30) + 16,
      text: `🧪 THÍ NGHIỆM STEM: ${lab.titleVi.toUpperCase()}\n${lab.gdpt || "Chương trình GDPT 2018"} • Thầy cô ghi chú số liệu tại đây`,
      fontSize: 15,
      fontFamily: 2,
      textAlign: "left",
      verticalAlign: "top",
      strokeColor: currentTheme.isDark ? "#6ee7b7" : "#047857",
      isDeleted: false,
    };

    excalidrawAPI.updateScene({
      elements: [...currentElements, labBox, labText],
    });
    latestDataRef.current.elements = [...currentElements, labBox, labText];
    performSave(latestDataRef.current.elements, latestDataRef.current.appState);
  };

  const handleTriggerAiGeometryDraw = (question: any) => {
    if (!excalidrawAPI || !question) return;
    const shapeId = detectStemShapeIdForQuestion(question.content);
    if (!shapeId) return;

    const matchedItem =
      STEM_LIBRARY_ITEMS.find(
        (item) =>
          (item as any).id === shapeId ||
          (item as any).name?.toLowerCase().includes("chóp") ||
          (item as any).name?.toLowerCase().includes("mạch")
      ) || STEM_LIBRARY_ITEMS[0];

    if (matchedItem) {
      handleInsertStemItem(matchedItem);
    }
  };

  const handleExportAllPagesPdf = async () => {
    setIsExportingPdf(true);
    try {
      const { exportToBlob } = await import("@excalidraw/excalidraw");
      const currentElements = excalidrawAPI ? (excalidrawAPI.getSceneElements() as any[]) : latestDataRef.current.elements;
      const currentFiles = (excalidrawAPI as any)?.getFiles ? (excalidrawAPI as any).getFiles() : latestDataRef.current.files;

      const allPagesSnapshot = pages.map((p, idx) =>
        idx === currentPageIndex ? { ...p, elements: currentElements, files: currentFiles } : p
      );

      const pageImages: string[] = [];
      for (const p of allPagesSnapshot) {
        if (!p.elements || p.elements.length === 0) continue;
        const blob = await exportToBlob({
          elements: p.elements as any,
          appState: {
            exportWithDarkMode: currentTheme.isDark,
            exportBackground: true,
            viewBackgroundColor: currentTheme.viewBackgroundColor,
          } as any,
          files: (p.files || {}) as any,
          mimeType: "image/png",
          quality: 0.95,
        });
        if (blob) {
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          pageImages.push(dataUrl);
        }
      }

      if (pageImages.length === 0) {
        alert("Chưa có trang nào có nội dung để xuất PDF.");
        return;
      }

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${title} - Toàn Bộ Bài Giảng</title>
              <style>
                @page { size: landscape; margin: 0; }
                body { margin: 0; padding: 0; background: #fff; }
                .slide-page { width: 100vw; height: 100vh; page-break-after: always; display: flex; align-items: center; justify-content: center; }
                .slide-page img { max-width: 100%; max-height: 100%; object-fit: contain; }
              </style>
            </head>
            <body>
              ${pageImages.map((src, i) => `<div class="slide-page"><img src="${src}" alt="Trang ${i + 1}" /></div>`).join("")}
              <script>
                window.onload = function() {
                  setTimeout(function() { window.print(); }, 400);
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } catch (err) {
      console.error("Lỗi xuất PDF toàn bộ bài giảng:", err);
      alert("Đã xảy ra lỗi khi tạo tệp PDF bài giảng.");
    } finally {
      setIsExportingPdf(false);
    }
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

          {/* Nút Gõ Công thức f(x) */}
          <button
            onClick={() => setShowMathModal(true)}
            className="hidden sm:flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/70 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300 transition cursor-pointer"
            title="Gõ công thức Toán / Khoa học KaTeX chuẩn nét"
          >
            <span className="font-serif italic font-black">f(x)</span>
            <span>Công thức</span>
          </button>

          {/* Nút Máy tính Casio fx-580 */}
          <button
            onClick={() => setShowCasioModal(true)}
            className="hidden md:flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300 transition cursor-pointer"
            title="Mở máy tính Casio fx-580VN X ảo nổi trên bục giảng"
          >
            <Calculator className="h-3.5 w-3.5 text-amber-600" />
            <span>Casio fx-580</span>
          </button>

          {/* NÚT PHÒNG THÍ NGHIỆM 3D (PiP Modal) */}
          <button
            onClick={() => setShowPipLabModal(true)}
            className="hidden lg:flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 transition cursor-pointer"
            title="Mở 54+ Phòng Thí Nghiệm 3D (Vật lý, Hóa học, Sinh học, Địa lý) cửa sổ nổi"
          >
            <FlaskConical className="h-3.5 w-3.5 text-emerald-600" />
            <span>Mô phỏng 3D</span>
          </button>

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

        {/* 3. BỘ CÔNG CỤ BỤC GIẢNG NỔI (Timer, Laser, Fullscreen, Math, Casio, Labs) */}
        <FloatingClassroomTools
          isZenMode={isZenMode}
          onToggleZenMode={() => setIsZenMode(!isZenMode)}
          isLaserActive={isLaserActive}
          onToggleLaser={handleToggleLaser}
          onOpenMathModal={() => setShowMathModal(true)}
          onOpenCasioModal={() => setShowCasioModal(true)}
          onOpenPipLabModal={() => setShowPipLabModal(true)}
        />

        {/* 4. THANH ĐIỀU HƯỚNG SLIDE NHIỀU TRANG CHÂN TRANG */}
        <BottomSlideBar
          pages={pages}
          currentPageIndex={currentPageIndex}
          onSelectPage={handleSelectPage}
          onAddPage={handleAddPage}
          onDuplicatePage={handleDuplicatePage}
          onDeletePage={handleDeletePage}
          onRenamePage={handleRenamePage}
          onExportAllPagesPdf={handleExportAllPagesPdf}
          isExportingPdf={isExportingPdf}
        />

        {/* 5. NGĂN KÉO KHO ĐỀ THI & CHÈN CÂU HỎI (KÈM REVEAL & AI DỰNG HÌNH) */}
        <ExamDrawer
          isOpen={showExamDrawer}
          onClose={() => setShowExamDrawer(false)}
          onInsertQuestion={handleInsertQuestion}
          onInsertAllQuestions={handleInsertAllQuestions}
          onTriggerLiveClone={handleTriggerLiveClone}
          onTriggerScaffold={handleTriggerScaffold}
          onTriggerAiGeometryDraw={handleTriggerAiGeometryDraw}
          isDarkTheme={currentTheme.isDark}
        />

        {/* 6. MODAL GÕ CÔNG THỨC TOÁN KATEX / LATEX */}
        <MathFormulaModal
          isOpen={showMathModal}
          onClose={() => setShowMathModal(false)}
          onInsertFormula={handleInsertFormula}
          themeTextColor={currentTheme.defaultStrokeColor}
        />

        {/* 7. MÁY TÍNH CASIO FX-580VN X ẢO NỔI */}
        <CasioCalculatorModal
          isOpen={showCasioModal}
          onClose={() => setShowCasioModal(false)}
          onPasteToCanvas={handlePasteFromCasio}
        />

        {/* 8. CỬA SỔ THÍ NGHIỆM MÔ PHỎNG NỔI (PIP LABS) */}
        <PipLabModal
          isOpen={showPipLabModal}
          onClose={() => setShowPipLabModal(false)}
          onSnapshotToCanvas={handleSnapshotFromLab}
        />
      </main>
    </div>
  );
}
