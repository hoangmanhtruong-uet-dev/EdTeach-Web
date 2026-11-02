"use client";

import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { BoardTheme } from "@/lib/whiteboard/board-themes";

// Cấu hình Excalidraw tự nạp font nội bộ từ /fonts/ trên origin cục bộ, ngắt kết nối unpkg.com / esm.sh CDN (WBD-10)
if (typeof window !== "undefined") {
  (window as any).EXCALIDRAW_ASSET_PATH = "/";

  // Lớp phòng vệ chống crash Excalidraw: Tự động chữa lành phần tử nếu thiếu groupIds/points
  if (!(window as any).__excalidrawFilterPatched) {
    (window as any).__excalidrawFilterPatched = true;
    const origFilter = Array.prototype.filter;
    Array.prototype.filter = function (fn: any, thisArg: any) {
      if (typeof fn !== "function") return origFilter.call(this, fn, thisArg);
      return origFilter.call(
        this,
        function (item: any, index: number, array: any[]) {
          if (item && typeof item === "object" && item.type) {
            if (!Array.isArray(item.groupIds)) {
              item.groupIds = [];
            }
          }
          try {
            return fn.call(thisArg, item, index, array);
          } catch (err: any) {
            if (err && typeof err.message === "string" && err.message.includes("reading 'length'")) {
              if (item && typeof item === "object") {
                if (!Array.isArray(item.groupIds)) item.groupIds = [];
                if (item.boundElements === undefined) item.boundElements = null;
                if (
                  !Array.isArray(item.points) &&
                  (item.type === "line" || item.type === "arrow" || item.type === "freedraw")
                ) {
                  item.points = [[0, 0], [item.width || 100, item.height || 100]];
                }
              }
              try {
                return fn.call(thisArg, item, index, array);
              } catch {
                return false;
              }
            }
            throw err;
          }
        },
        thisArg
      );
    };
  }
}

import { Excalidraw, MainMenu } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import "./whiteboard-custom.css";
import { FileDown, ArrowLeft, Trash2 } from "lucide-react";
import {
  sanitizeExcalidrawElements,
  sanitizeExcalidrawFiles,
  sanitizeExcalidrawAppState,
} from "@/lib/whiteboard/sanitize-elements";

export type ExcalidrawImperativeAPI = {
  updateLibrary: (opts: { libraryItems: unknown[]; merge?: boolean; openLibraryMenu?: boolean }) => void;
  getSceneElements: () => unknown[];
  updateScene: (sceneData: { elements?: unknown[]; appState?: Record<string, unknown> }) => void;
  addFiles?: (files: unknown[]) => void;
  getFiles?: () => Record<string, unknown>;
  scrollToContent?: (target?: unknown, opts?: Record<string, unknown>) => void;
  setActiveTool?: (tool: { type: string } | { type: "custom"; customType: string }) => void;
  getAppState?: () => Record<string, unknown>;
};

interface WhiteboardCanvasProps {
  initialElements?: Record<string, unknown>[];
  initialAppState?: Record<string, unknown>;
  initialFiles?: Record<string, unknown> | unknown[];
  theme?: BoardTheme;
  isPro?: boolean;
  height?: string;
  className?: string;
  onChange?: (
    elements: readonly Record<string, unknown>[],
    appState: Record<string, unknown>,
    files?: Record<string, unknown>
  ) => void;
  onApiReady?: (api: ExcalidrawImperativeAPI) => void;
  onDoubleClickElement?: (element: Record<string, unknown>) => void;
  onExportPdf?: () => void;
  onOpenMathModal?: () => void;
  onClearCurrentPage?: () => void;
}

export default function WhiteboardCanvas({
  initialElements,
  initialAppState,
  initialFiles,
  theme,
  isPro = false,
  height,
  className,
  onChange,
  onApiReady,
  onDoubleClickElement,
  onExportPdf,
  onOpenMathModal,
  onClearCurrentPage,
}: WhiteboardCanvasProps) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const excalidrawAPIRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const onApiReadyCalledRef = useRef(false);

  // Lưu góc nhìn (pan/zoom) để render Backdrop SVG hoàn toàn khớp với tọa độ canvas Excalidraw
  const [viewTransform, setViewTransform] = useState<{ scrollX: number; scrollY: number; zoom: number }>({
    scrollX: typeof initialAppState?.scrollX === "number" ? initialAppState.scrollX : 0,
    scrollY: typeof initialAppState?.scrollY === "number" ? initialAppState.scrollY : 0,
    zoom: (initialAppState?.zoom as any)?.value || 1,
  });

  const onApiReadyRef = useRef(onApiReady);
  onApiReadyRef.current = onApiReady;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const onDoubleClickElementRef = useRef(onDoubleClickElement);
  onDoubleClickElementRef.current = onDoubleClickElement;

  const handleExcalidrawRef = useCallback((api: any) => {
    if (api && api !== excalidrawAPIRef.current) {
      excalidrawAPIRef.current = api as ExcalidrawImperativeAPI;
      setExcalidrawAPI(api as ExcalidrawImperativeAPI);
    }
  }, []);

  useEffect(() => {
    if (excalidrawAPI) {
      if (!onApiReadyCalledRef.current) {
        onApiReadyCalledRef.current = true;
        onApiReadyRef.current?.(excalidrawAPI);
      }
    }
  }, [excalidrawAPI]);

  const handleExcalidrawChange = useCallback((elements: readonly any[], appState: any, files?: any) => {
    if (appState) {
      const currentZoom = appState.zoom?.value ?? 1;
      const currentScrollX = appState.scrollX ?? 0;
      const currentScrollY = appState.scrollY ?? 0;
      setViewTransform((prev) => {
        if (
          Math.abs(prev.zoom - currentZoom) < 0.0001 &&
          Math.abs(prev.scrollX - currentScrollX) < 0.5 &&
          Math.abs(prev.scrollY - currentScrollY) < 0.5
        ) {
          return prev;
        }
        return { zoom: currentZoom, scrollX: currentScrollX, scrollY: currentScrollY };
      });
    }

    onChangeRef.current?.(
      elements as unknown as readonly Record<string, unknown>[],
      appState as unknown as Record<string, unknown>,
      files as unknown as Record<string, unknown>
    );
  }, []);

  // Xử lý sự kiện nhấp đúp để mở lại modal sửa công thức LaTeX
  const handleContainerDoubleClick = useCallback(() => {
    if (!excalidrawAPIRef.current) return;
    try {
      const elements = (excalidrawAPIRef.current.getSceneElements?.() || []) as any[];
      const appState = (excalidrawAPIRef.current as any).getAppState?.();
      const selectedIds = appState?.selectedElementIds || {};

      const target = elements.find((el) => selectedIds[el.id] && !el.isDeleted);
      if (target && target.customData?.type === "latex") {
        onDoubleClickElementRef.current?.(target);
      }
    } catch (e) {
      console.warn("Lỗi kiểm tra phần tử nhấp đúp:", e);
    }
  }, []);

  const initialData = useMemo(() => {
    const rawElements = Array.isArray(initialElements) ? initialElements : [];
    const elements = sanitizeExcalidrawElements(rawElements);
    const files = sanitizeExcalidrawFiles(initialFiles);
    const safeAppState = sanitizeExcalidrawAppState(initialAppState);

    return {
      elements: elements as any,
      appState: safeAppState as any,
      files: files as any,
      scrollToContent: true,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tính toán thông số lưới Sư phạm theo pan & zoom
  const currentPattern = theme?.pattern || "none";
  const zoom = viewTransform.zoom;
  const sx = viewTransform.scrollX * zoom;
  const sy = viewTransform.scrollY * zoom;

  // 1. Giấy kẻ ô ly học sinh: 20px (ô nhỏ 5x5mm) và 100px (ô lớn 5x5 ô nhỏ)
  const minorGridSize = 20 * zoom;
  const majorGridSize = 100 * zoom;
  const gridOffsetX = ((sx % majorGridSize) + majorGridSize) % majorGridSize;
  const gridOffsetY = ((sy % majorGridSize) + majorGridSize) % majorGridSize;
  const marginLineX = sx + 120 * zoom;

  // 2. Giấy kẻ ngang giáo án: 32px (dòng ngang 8mm)
  const lineSpacing = 32 * zoom;
  const lineOffsetY = ((sy % lineSpacing) + lineSpacing) % lineSpacing;
  const teacherMarginX = sx + 130 * zoom;

  return (
    <div
      className={`w-full h-full relative overflow-hidden select-none ${className || ""}`}
      style={{ height: height || "calc(100vh - 65px)" }}
      onDoubleClick={handleContainerDoubleClick}
    >
      {/* LỚP NỀN SƯ PHẠM ĐỘNG (SVG BACKDROP TỰ ĐỘNG KHỚP PAN/ZOOM) */}
      <div
        className="absolute inset-0 pointer-events-none z-0 transition-colors duration-200"
        style={{
          backgroundColor:
            currentPattern === "student_grid"
              ? theme?.isDark ? "#0b1220" : "#f8fafc"
              : currentPattern === "lined_notebook"
              ? "#fcfbfa"
              : currentPattern === "chalkboard"
              ? theme?.viewBackgroundColor || "#0b3b2c"
              : currentPattern === "coord_oxy"
              ? theme?.viewBackgroundColor || "#0b1220"
              : theme?.viewBackgroundColor || "#ffffff",
        }}
      >
        {/* Phông 1: Giấy kẻ ô ly học sinh (chuẩn vở Việt Nam) */}
        {currentPattern === "student_grid" && (
          <svg className="w-full h-full opacity-90" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="minor-grid"
                width={minorGridSize}
                height={minorGridSize}
                patternUnits="userSpaceOnUse"
                x={gridOffsetX}
                y={gridOffsetY}
              >
                <path
                  d={`M ${minorGridSize} 0 L 0 0 0 ${minorGridSize}`}
                  fill="none"
                  stroke={theme?.isDark ? "#1e293b" : "#93c5fd"}
                  strokeWidth="0.75"
                  strokeOpacity={theme?.isDark ? "0.6" : "0.45"}
                />
              </pattern>
              <pattern
                id="major-grid"
                width={majorGridSize}
                height={majorGridSize}
                patternUnits="userSpaceOnUse"
                x={gridOffsetX}
                y={gridOffsetY}
              >
                <rect width={majorGridSize} height={majorGridSize} fill="url(#minor-grid)" />
                <path
                  d={`M ${majorGridSize} 0 L 0 0 0 ${majorGridSize}`}
                  fill="none"
                  stroke={theme?.isDark ? "#334155" : "#3b82f6"}
                  strokeWidth="1.2"
                  strokeOpacity={theme?.isDark ? "0.7" : "0.6"}
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#major-grid)" />
            {/* Đường lề đỏ vở học sinh */}
            {marginLineX > -50 && marginLineX < 4000 && (
              <line
                x1={marginLineX}
                y1="0"
                x2={marginLineX}
                y2="100%"
                stroke="#f87171"
                strokeWidth="1.5"
                strokeOpacity="0.8"
              />
            )}
          </svg>
        )}

        {/* Phông 3: Hệ trục tọa độ Oxy (Toán học chuẩn) */}
        {currentPattern === "coord_oxy" && (
          <svg className="w-full h-full opacity-90" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="oxy-grid"
                width={minorGridSize * 2}
                height={minorGridSize * 2}
                patternUnits="userSpaceOnUse"
                x={gridOffsetX}
                y={gridOffsetY}
              >
                <path
                  d={`M ${minorGridSize * 2} 0 L 0 0 0 ${minorGridSize * 2}`}
                  fill="none"
                  stroke={theme?.isDark ? "#1e293b" : "#cbd5e1"}
                  strokeWidth="0.75"
                  strokeOpacity="0.6"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#oxy-grid)" />
            {/* Trục hoành Ox */}
            <line
              x1="0"
              y1={sy + 300 * zoom}
              x2="100%"
              y2={sy + 300 * zoom}
              stroke={theme?.isDark ? "#38bdf8" : "#2563eb"}
              strokeWidth="2"
            />
            {/* Trục tung Oy */}
            <line
              x1={sx + 300 * zoom}
              y1="0"
              x2={sx + 300 * zoom}
              y2="100%"
              stroke={theme?.isDark ? "#38bdf8" : "#2563eb"}
              strokeWidth="2"
            />
            {/* Gốc tọa độ O và nhãn x, y */}
            <text
              x={sx + 305 * zoom}
              y={sy + 320 * zoom}
              fill={theme?.isDark ? "#94a3b8" : "#475569"}
              fontSize={Math.max(12, 14 * zoom)}
              fontWeight="bold"
            >
              O
            </text>
            <text
              x="96%"
              y={sy + 295 * zoom}
              fill={theme?.isDark ? "#38bdf8" : "#2563eb"}
              fontSize={Math.max(12, 14 * zoom)}
              fontWeight="bold"
            >
              x
            </text>
            <text
              x={sx + 315 * zoom}
              y="28"
              fill={theme?.isDark ? "#38bdf8" : "#2563eb"}
              fontSize={Math.max(12, 14 * zoom)}
              fontWeight="bold"
            >
              y
            </text>
          </svg>
        )}

        {/* Phông 2: Giấy kẻ ngang giáo án (cách đều 8mm) */}
        {currentPattern === "lined_notebook" && (
          <svg className="w-full h-full opacity-90" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="lined-pattern"
                width="100%"
                height={lineSpacing}
                patternUnits="userSpaceOnUse"
                y={lineOffsetY}
              >
                <line
                  x1="0"
                  y1={lineSpacing}
                  x2="100%"
                  y2={lineSpacing}
                  stroke="#cbd5e1"
                  strokeWidth="1"
                  strokeOpacity="0.85"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#lined-pattern)" />
            {/* Đường lề đỏ trang giáo án */}
            {teacherMarginX > -50 && teacherMarginX < 4000 && (
              <line
                x1={teacherMarginX}
                y1="0"
                x2={teacherMarginX}
                y2="100%"
                stroke="#ef4444"
                strokeWidth="1.5"
                strokeOpacity="0.75"
              />
            )}
          </svg>
        )}
      </div>

      {/* LỚP BẢNG VẼ EXCALIDRAW (NỀN TRONG SUỐT ĐỂ HIỆN RÕ PATTERN, z-auto để popover context menu không bị giới hạn stacking context) */}
      <div className="w-full h-full relative [&_.excalidraw]:bg-transparent!">
        <Excalidraw
          excalidrawAPI={handleExcalidrawRef}
          initialData={initialData}
          onChange={handleExcalidrawChange}
          langCode="vi-VN"
          UIOptions={{
            canvasActions: {
              export: false,
              saveToActiveFile: false,
              loadScene: false,
              saveAsImage: false,
              toggleTheme: false,
              changeViewBackgroundColor: false,
            },
          }}
        >
          {/* Menu Hamburger được chọn lọc và tối ưu cho giáo viên dạy học */}
          <MainMenu>
            <MainMenu.DefaultItems.SearchMenu />
            <MainMenu.DefaultItems.Help />
            <MainMenu.Separator />
            {onExportPdf && (
              <MainMenu.Item
                icon={<FileDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                onSelect={onExportPdf}
              >
                Xuất file PDF bài giảng
              </MainMenu.Item>
            )}
            {onOpenMathModal && (
              <MainMenu.Item
                icon={<span className="font-serif italic font-black text-blue-600 dark:text-blue-400 text-xs">f(x)</span>}
                onSelect={onOpenMathModal}
              >
                Chèn công thức f(x)
              </MainMenu.Item>
            )}
            <MainMenu.Item
              icon={<ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />}
              onSelect={() => {
                if (typeof window !== "undefined") {
                  window.location.href = "/whiteboard";
                }
              }}
            >
              Về danh sách bảng vẽ
            </MainMenu.Item>
            {onClearCurrentPage && (
              <>
                <MainMenu.Separator />
                <MainMenu.Item
                  icon={<Trash2 className="w-4 h-4 text-red-500" />}
                  className="text-red-600! dark:text-red-400! hover:bg-red-50! dark:hover:bg-red-950/40!"
                  onSelect={() => {
                    const confirmed = window.confirm(
                      "Bạn có chắc chắn muốn xóa toàn bộ nét vẽ và nội dung trên trang này không?\n\nLưu ý: Hành động này không thể hoàn tác sau khi lưu."
                    );
                    if (confirmed) {
                      onClearCurrentPage();
                    }
                  }}
                >
                  Xóa toàn bộ trang hiện tại
                </MainMenu.Item>
              </>
            )}
          </MainMenu>
        </Excalidraw>
      </div>
    </div>
  );
}
