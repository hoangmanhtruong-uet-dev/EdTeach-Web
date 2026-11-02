"use client";
import { useToast } from "@/context/toast-context";
import { useConfirm } from "@/context/confirm-dialog-context";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  MousePointer,
  PenTool,
  Highlighter,
  Eraser,
  RotateCcw,
  Trash2,
  Camera,
  X,
  Palette,
  Sparkles,
  Move,
} from "lucide-react";

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  size: number;
  isHighlighter: boolean;
  isEraser: boolean;
}

const NEON_COLORS = [
  { id: "#FFEA00", name: "Vàng neon" },
  { id: "#FF3366", name: "Đỏ hồng neon" },
  { id: "#00F0FF", name: "Xanh Cyan" },
  { id: "#00FF66", name: "Xanh lục neon" },
  { id: "#FFFFFF", name: "Trắng dạ quang" },
];

interface TransparentWhiteboardOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  labTitle?: string;
}

export function TransparentWhiteboardOverlay({
  isOpen,
  onClose,
  labTitle = "Thí nghiệm 3D",
}: TransparentWhiteboardOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const [mode, setMode] = useState<"interact" | "draw">("draw");
  const [activeColor, setActiveColor] = useState<string>("#FFEA00");
  const [tool, setTool] = useState<"pen" | "highlighter" | "eraser">("pen");
  const [penSize, setPenSize] = useState<number>(4);

  // Stroke history for Undo
  const strokesRef = useRef<Stroke[]>([]);
  const currentStrokeRef = useRef<Stroke | null>(null);
  const isDrawingRef = useRef(false);

  // Canvas redraw helper
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const dpr = window.devicePixelRatio || 1;

    strokesRef.current.forEach((stroke) => {
      if (stroke.points.length < 2) return;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x * dpr, stroke.points[0].y * dpr);

      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x * dpr, stroke.points[i].y * dpr);
      }

      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (stroke.isEraser) {
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = stroke.size * 5 * dpr;
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = (stroke.isHighlighter ? stroke.size * 3.5 : stroke.size) * dpr;
        ctx.globalAlpha = stroke.isHighlighter ? 0.35 : 1.0;
        // Subtle glow for neon effect
        ctx.shadowColor = stroke.color;
        ctx.shadowBlur = stroke.isHighlighter ? 0 : 4 * dpr;
      }

      ctx.stroke();
      ctx.restore();
    });
  }, []);

  // Resize canvas to match window
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      redrawCanvas();
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen, redrawCanvas]);

  // Pointer event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (mode !== "draw") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    isDrawingRef.current = true;
    currentStrokeRef.current = {
      points: [{ x, y }],
      color: activeColor,
      size: penSize,
      isHighlighter: tool === "highlighter",
      isEraser: tool === "eraser",
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    currentStrokeRef.current.points.push({ x, y });

    // Draw segment in real-time
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const points = currentStrokeRef.current.points;
    const p1 = points[points.length - 2];
    const p2 = points[points.length - 1];

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(p1.x * dpr, p1.y * dpr);
    ctx.lineTo(p2.x * dpr, p2.y * dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (currentStrokeRef.current.isEraser) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = penSize * 5 * dpr;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = (tool === "highlighter" ? penSize * 3.5 : penSize) * dpr;
      ctx.globalAlpha = tool === "highlighter" ? 0.35 : 1.0;
      ctx.shadowColor = activeColor;
      ctx.shadowBlur = tool === "highlighter" ? 0 : 4 * dpr;
    }

    ctx.stroke();
    ctx.restore();
  };

  const handlePointerUp = () => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return;
    isDrawingRef.current = false;
    strokesRef.current.push(currentStrokeRef.current);
    currentStrokeRef.current = null;
  };

  // Undo
  const handleUndo = () => {
    if (strokesRef.current.length === 0) return;
    strokesRef.current.pop();
    redrawCanvas();
  };

  // Clear all drawings
  const handleClear = async () => {
    if (strokesRef.current.length === 0) return;
    const ok = await confirm({
      title: "Xóa toàn bộ nét vẽ",
      message: "Thầy/Cô có muốn xóa toàn bộ nét vẽ trên kính ghi chú?",
      confirmText: "Xóa nét vẽ",
      cancelText: "Hủy",
      variant: "danger",
    });
    if (ok) {
      strokesRef.current = [];
      redrawCanvas();
    }
  };

  // Screenshot / Snapshot
  const handleSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `Bai_Giang_3D_${labTitle.replace(/\s+/g, "_")}_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      showToast("Đã lưu hình ảnh ghi chú bài giảng.", "success");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-40 overflow-hidden pointer-events-none select-none">
      {/* Canvas Layer */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="w-full h-full absolute inset-0 cursor-crosshair"
        style={{
          pointerEvents: mode === "draw" ? "auto" : "none",
        }}
      />

      {/* Floating Pen Toolbar (Draggable/Fixed at Bottom-Center) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto z-50">
        <div className="flex items-center gap-1.5 rounded-2xl border border-slate-700/80 bg-slate-900/95 p-2 text-white shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
          {/* Mode Switch: 3D Interact vs Draw */}
          <div className="flex items-center rounded-xl bg-slate-800 p-1 border border-slate-700/60">
            <button
              type="button"
              onClick={() => setMode("interact")}
              title="Chế độ Tương tác 3D: Cho phép click kéo thanh trượt, xoay mô phỏng bên dưới"
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                mode === "interact"
                  ? "bg-primary text-white shadow-md ring-1 ring-primary/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <MousePointer className="h-4 w-4" />
              <span>Thao tác 3D</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("draw");
                if (tool === "eraser") setTool("pen");
              }}
              title="Chế độ Bút vẽ: Viết chữ, vẽ vector lực, khoanh tròn đè lên mô phỏng"
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                mode === "draw"
                  ? "bg-amber-500 text-slate-950 shadow-md ring-1 ring-amber-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <PenTool className="h-4 w-4" />
              <span>Bút vẽ lên kính</span>
            </button>
          </div>

          <span className="h-5 w-px bg-slate-700 mx-0.5" />

          {/* Tools: Pen, Highlighter, Eraser */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setMode("draw");
                setTool("pen");
              }}
              title="Bút vẽ dạ quang nét mảnh"
              className={`rounded-lg p-2 transition cursor-pointer ${
                mode === "draw" && tool === "pen"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <PenTool className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("draw");
                setTool("highlighter");
              }}
              title="Bút dạ quang đánh dấu (Highlighter)"
              className={`rounded-lg p-2 transition cursor-pointer ${
                mode === "draw" && tool === "highlighter"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Highlighter className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("draw");
                setTool("eraser");
              }}
              title="Cục tẩy nét vẽ"
              className={`rounded-lg p-2 transition cursor-pointer ${
                mode === "draw" && tool === "eraser"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Eraser className="h-4 w-4" />
            </button>
          </div>

          <span className="h-5 w-px bg-slate-700 mx-0.5" />

          {/* Neon Colors */}
          <div className="flex items-center gap-1.5 px-1">
            {NEON_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setActiveColor(c.id);
                  if (tool === "eraser") setTool("pen");
                  setMode("draw");
                }}
                title={c.name}
                style={{ backgroundColor: c.id }}
                className={`h-5 w-5 rounded-full transition-transform cursor-pointer ${
                  activeColor === c.id && tool !== "eraser"
                    ? "scale-125 ring-2 ring-white shadow-md"
                    : "opacity-75 hover:opacity-100 hover:scale-110"
                }`}
              />
            ))}
          </div>

          <span className="h-5 w-px bg-slate-700 mx-0.5" />

          {/* Actions: Undo, Clear, Snapshot, Close */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleUndo}
              title="Hoàn tác nét vẽ trước (Ctrl+Z)"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={handleClear}
              title="Xóa sạch toàn bộ nét vẽ trên kính"
              className="rounded-lg p-2 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={handleSnapshot}
              title="Chụp ảnh lưu nét vẽ bài giảng"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-amber-400 transition cursor-pointer"
            >
              <Camera className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              title="Đóng kính vẽ và quay lại xem bình thường"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer ml-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Top Banner Notice when active */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none z-50">
        <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-slate-900/90 px-4 py-1 text-xs font-semibold text-amber-300 backdrop-blur-md shadow-lg">
          <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
          <span>
            {mode === "draw"
              ? "Đang ở chế độ Bút vẽ trên Kính (Click & Kéo để vẽ)"
              : "Đang ở chế độ Thao tác 3D (Click & Kéo điều khiển mô phỏng bên dưới)"}
          </span>
        </div>
      </div>
    </div>
  );
}
