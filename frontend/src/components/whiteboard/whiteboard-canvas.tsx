"use client";

import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";

// Cấu hình Excalidraw tự nạp font nội bộ từ /fonts/ trên origin cục bộ, ngắt kết nối unpkg.com / esm.sh CDN (WBD-10)
if (typeof window !== "undefined") {
  (window as any).EXCALIDRAW_ASSET_PATH = "/";
}

import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import { STEM_LIBRARY_ITEMS } from "@/lib/whiteboard/stem-libraries";
import {
  sanitizeExcalidrawElements,
  sanitizeExcalidrawFiles,
} from "@/lib/whiteboard/sanitize-elements";

type ExcalidrawImperativeAPI = {
  updateLibrary: (opts: { libraryItems: unknown[]; merge?: boolean; openLibraryMenu?: boolean }) => void;
  getSceneElements: () => unknown[];
  updateScene: (sceneData: { elements?: unknown[]; appState?: Record<string, unknown> }) => void;
  addFiles?: (files: unknown[]) => void;
  getFiles?: () => Record<string, unknown>;
  scrollToContent?: (target?: unknown, opts?: Record<string, unknown>) => void;
  setActiveTool?: (tool: { type: string } | { type: "custom"; customType: string }) => void;
};

interface WhiteboardCanvasProps {
  initialElements?: Record<string, unknown>[];
  initialAppState?: Record<string, unknown>;
  initialFiles?: Record<string, unknown> | unknown[];
  isPro?: boolean;
  height?: string;
  className?: string;
  onChange?: (
    elements: readonly Record<string, unknown>[],
    appState: Record<string, unknown>,
    files?: Record<string, unknown>
  ) => void;
  onApiReady?: (api: ExcalidrawImperativeAPI) => void;
}

export default function WhiteboardCanvas({
  initialElements,
  initialAppState,
  initialFiles,
  isPro = false,
  height,
  className,
  onChange,
  onApiReady,
}: WhiteboardCanvasProps) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const excalidrawAPIRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const isLibraryLoadedRef = useRef(false);
  const onApiReadyCalledRef = useRef(false);

  // Keep callback refs stable to prevent dependency cascade
  const onApiReadyRef = useRef(onApiReady);
  onApiReadyRef.current = onApiReady;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Stable callback for Excalidraw API initialization
  const handleExcalidrawRef = useCallback((api: any) => {
    if (api && api !== excalidrawAPIRef.current) {
      excalidrawAPIRef.current = api as ExcalidrawImperativeAPI;
      setExcalidrawAPI(api as ExcalidrawImperativeAPI);
    }
  }, []);

  // One-time API ready notification and Pro library loading
  useEffect(() => {
    if (excalidrawAPI) {
      if (!onApiReadyCalledRef.current) {
        onApiReadyCalledRef.current = true;
        onApiReadyRef.current?.(excalidrawAPI);
      }

      // Nếu là gói Pro, tự động load thư viện STEM giáo dục vào kho Excalidraw Library
      if (isPro && !isLibraryLoadedRef.current) {
        try {
          const sanitizedLibrary = STEM_LIBRARY_ITEMS.map((item) => ({
            ...item,
            elements: sanitizeExcalidrawElements(item.elements),
          }));
          excalidrawAPI.updateLibrary({
            libraryItems: sanitizedLibrary,
            merge: true,
            openLibraryMenu: false,
          });
          isLibraryLoadedRef.current = true;
        } catch (e) {
          console.error("Lỗi khi nạp STEM Library vào Excalidraw:", e);
        }
      }
    }
  }, [excalidrawAPI, isPro]);

  // Stable onChange handler passed to Excalidraw
  const handleExcalidrawChange = useCallback((elements: readonly any[], appState: any, files?: any) => {
    onChangeRef.current?.(
      elements as unknown as readonly Record<string, unknown>[],
      appState as unknown as Record<string, unknown>,
      files as unknown as Record<string, unknown>
    );
  }, []);

  // Stable initial data (Excalidraw only consumes this on initial mount)
  const initialData = useMemo(() => {
    const rawElements = Array.isArray(initialElements) ? initialElements : [];
    const elements = sanitizeExcalidrawElements(rawElements);
    const files = sanitizeExcalidrawFiles(initialFiles);

    return {
      elements: elements as any,
      appState: {
        viewBackgroundColor: (initialAppState?.viewBackgroundColor as string) || "#ffffff",
        currentItemStrokeColor: (initialAppState?.currentItemStrokeColor as string) || "#1e1e1e",
        gridSize: (initialAppState?.gridSize as number) ?? 20,
        ...initialAppState,
      } as any,
      files: files as any,
      scrollToContent: true,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`w-full h-full relative ${className || ""}`} style={{ height: height || "calc(100vh - 65px)" }}>
      <Excalidraw
        excalidrawAPI={handleExcalidrawRef}
        initialData={initialData}
        onChange={handleExcalidrawChange}
        UIOptions={{
          canvasActions: {
            export: {
              saveFileToDisk: true,
            },
            saveToActiveFile: false,
            loadScene: true,
            toggleTheme: true,
          },
        }}
      />
    </div>
  );
}
