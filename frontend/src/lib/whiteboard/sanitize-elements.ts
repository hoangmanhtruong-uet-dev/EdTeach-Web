/**
 * Utility chuẩn hóa các Excalidraw Elements & Files
 * Khắc phục triệt để lỗi:
 * 1. "Cannot read properties of undefined (reading 'length') at Array.filter at canvas"
 *    khi các elements (từ templates, đề thi, AI) thiếu trường groupIds, boundElements, v.v.
 * 2. Đảm bảo files luôn là Object Record (Dictionary), không bao giờ là Array [] hay null.
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

  return {
    ...el,
    id: el.id || `elem_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 7)}`,
    type: el.type || "rectangle",
    x: typeof el.x === "number" ? el.x : 0,
    y: typeof el.y === "number" ? el.y : 0,
    width: typeof el.width === "number" ? el.width : 100,
    height: typeof el.height === "number" ? el.height : 100,
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

