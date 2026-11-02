/**
 * Utility chuẩn hóa các Excalidraw Elements, Files & AppState
 * Khắc phục triệt để lỗi:
 * 1. "Cannot read properties of undefined (reading 'length') at Array.filter at canvas"
 *    khi các elements (từ templates, đề thi, AI) thiếu trường groupIds, boundElements, points, v.v.
 * 2. Đảm bảo files luôn là Object Record (Dictionary), không bao giờ là Array [] hay null.
 * 3. Chuẩn hóa AppState: Lọc bỏ các trạng thái tạm thời (elementsToHighlight, frameToHighlight, selection) gây crash render.
 */

export function sanitizeExcalidrawElement(el: any, index = 0): Record<string, unknown> {
  if (!el || typeof el !== "object") {
    return {
      id: `elem_${Date.now()}_${index}`,
      type: "rectangle",
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      angle: 0,
      strokeColor: "#1e1e1e",
      backgroundColor: "transparent",
      fillStyle: "solid",
      strokeWidth: 1,
      strokeStyle: "solid",
      roughness: 0,
      opacity: 100,
      groupIds: [],
      frameId: null,
      roundness: null,
      seed: Math.floor(Math.random() * 100000),
      version: 1,
      versionNonce: 0,
      isDeleted: false,
      boundElements: null,
      updated: Date.now(),
      link: null,
      locked: false,
    };
  }

  const width = typeof el.width === "number" ? el.width : 100;
  const height = typeof el.height === "number" ? el.height : 100;
  const type = el.type || "rectangle";

  const sanitized: Record<string, unknown> = {
    ...el,
    id: el.id || `elem_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 7)}`,
    type,
    x: typeof el.x === "number" ? el.x : 0,
    y: typeof el.y === "number" ? el.y : 0,
    width,
    height,
    angle: typeof el.angle === "number" ? el.angle : 0,
    strokeColor: el.strokeColor || "#1e1e1e",
    backgroundColor: el.backgroundColor || "transparent",
    fillStyle: el.fillStyle || "solid",
    strokeWidth: typeof el.strokeWidth === "number" ? el.strokeWidth : 1,
    strokeStyle: el.strokeStyle || "solid",
    roughness: typeof el.roughness === "number" ? el.roughness : 0,
    opacity: typeof el.opacity === "number" ? el.opacity : 100,
    roundness: el.roundness !== undefined ? el.roundness : null,
    seed: typeof el.seed === "number" ? el.seed : Math.floor(Math.random() * 100000),
    version: typeof el.version === "number" ? el.version : 1,
    versionNonce: typeof el.versionNonce === "number" ? el.versionNonce : 0,
    isDeleted: Boolean(el.isDeleted),
    updated: typeof el.updated === "number" ? el.updated : Date.now(),
    link: el.link || null,
    locked: Boolean(el.locked),
    // BẮT BUỘC CHO EXCALIDRAW: groupIds phải là mảng
    groupIds: Array.isArray(el.groupIds) ? el.groupIds : [],
    // BẮT BUỘC: boundElements phải là mảng hoặc null
    boundElements: Array.isArray(el.boundElements) ? el.boundElements : null,
  };

  // Chuẩn hóa phần tử đường cong/mũi tên (linear elements)
  if (type === "arrow" || type === "line" || type === "freedraw") {
    if (Array.isArray(el.points) && el.points.length > 0) {
      sanitized.points = el.points;
    } else {
      sanitized.points = [[0, 0], [width, height]];
    }
    if (type === "arrow") {
      sanitized.endArrowhead = el.endArrowhead || "arrow";
      sanitized.startArrowhead = el.startArrowhead || null;
      sanitized.startBinding = el.startBinding || null;
      sanitized.endBinding = el.endBinding || null;
    }
  }

  // Chuẩn hóa văn bản
  if (type === "text") {
    const textStr = typeof el.text === "string" ? el.text : "";
    sanitized.text = textStr;
    sanitized.originalText = el.originalText || textStr;
    sanitized.fontSize = typeof el.fontSize === "number" ? el.fontSize : 20;
    sanitized.fontFamily = typeof el.fontFamily === "number" ? el.fontFamily : 1;
    sanitized.textAlign = el.textAlign || "left";
    sanitized.verticalAlign = el.verticalAlign || "top";
    sanitized.lineHeight = el.lineHeight || 1.25;
  }

  return sanitized;
}

export function sanitizeExcalidrawElements(elements: unknown): Record<string, unknown>[] {
  if (!Array.isArray(elements)) return [];
  return elements
    .filter((el) => el !== null && typeof el === "object")
    .map((el, i) => sanitizeExcalidrawElement(el, i));
}

export function sanitizeExcalidrawFiles(files: unknown): Record<string, unknown> {
  if (files && typeof files === "object" && !Array.isArray(files)) {
    return files as Record<string, unknown>;
  }
  return {};
}

export function sanitizeExcalidrawAppState(
  appState: any,
  themeFallback?: { viewBackgroundColor?: string; defaultStrokeColor?: string; gridSize?: number; id?: string }
): Record<string, unknown> {
  const safeBg =
    themeFallback?.viewBackgroundColor || (appState?.viewBackgroundColor as string) || "#ffffff";
  const safeStroke =
    themeFallback?.defaultStrokeColor || (appState?.currentItemStrokeColor as string) || "#1e1e1e";
  const safeGrid =
    (themeFallback?.gridSize ?? appState?.gridSize ?? 20) as number;

  return {
    viewBackgroundColor: safeBg,
    currentItemStrokeColor: safeStroke,
    gridSize: safeGrid,
    zoom:
      appState?.zoom && typeof appState.zoom === "object" && typeof appState.zoom.value === "number"
        ? appState.zoom
        : { value: 1 },
    scrollX: typeof appState?.scrollX === "number" ? appState.scrollX : 0,
    scrollY: typeof appState?.scrollY === "number" ? appState.scrollY : 0,
    theme: appState?.theme === "dark" ? "dark" : "light",
    theme_preset: appState?.theme_preset || themeFallback?.id || "modern_white",
    // Xóa triệt để các selection / highlight rác từ runtime trước đó
    elementsToHighlight: null,
    frameToHighlight: null,
    editingLinearElement: null,
    editingTextElement: null,
    selectedLinearElement: null,
    selectionElement: null,
    selectedElementIds: {},
    selectedGroupIds: {},
  };
}
