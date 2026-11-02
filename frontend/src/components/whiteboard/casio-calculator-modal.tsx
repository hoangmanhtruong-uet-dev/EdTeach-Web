"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Minimize2,
  Maximize2,
  Calculator,
  RotateCcw,
  Sparkles,
  ClipboardCopy,
} from "lucide-react";

interface CasioCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPasteToCanvas?: (content: string) => void;
}

export function CasioCalculatorModal({
  isOpen,
  onClose,
  onPasteToCanvas,
}: CasioCalculatorModalProps) {
  // Draggable position
  const [position, setPosition] = useState({ x: 80, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Dragging handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("input")) {
      return;
    }
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({
        x: Math.max(10, Math.min(window.innerWidth - 380, e.clientX - dragStartRef.current.x)),
        y: Math.max(10, Math.min(window.innerHeight - 80, e.clientY - dragStartRef.current.y)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  // Listen for paste message from Casio emulator iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "CASIO_PASTE_RESULT" && e.data?.text) {
        onPasteToCanvas?.(e.data.text);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onPasteToCanvas]);

  const handleReloadEmulator = () => {
    if (iframeRef.current) {
      iframeRef.current.src = "/casio/index.html?t=" + Date.now();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: "none",
      }}
      className={`fixed z-50 flex flex-col rounded-2xl border border-slate-700/80 bg-slate-950 text-slate-100 shadow-2xl transition-all select-none ${
        isMinimized ? "w-64" : "w-[360px] sm:w-[410px]"
      }`}
    >
      {/* Draggable Title Bar */}
      <div
        onMouseDown={handleMouseDown}
        className="flex items-center justify-between rounded-t-2xl border-b border-slate-800 bg-linear-to-r from-slate-900 via-slate-850 to-slate-900 px-3.5 py-2.5 cursor-grab active:cursor-grabbing text-xs"
      >
        <div className="flex items-center gap-2 font-bold tracking-wide text-amber-400">
          <Calculator className="h-4 w-4" />
          <span className="font-mono text-xs">CASIO fx-580VN X</span>
          <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[9px] font-semibold text-amber-300">
            ClassWiz
          </span>
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          <button
            type="button"
            onClick={handleReloadEmulator}
            className="rounded p-1 hover:bg-slate-800 hover:text-white transition cursor-pointer"
            title="Khởi động lại máy tính"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="rounded p-1 hover:bg-slate-800 hover:text-white transition cursor-pointer"
            title={isMinimized ? "Phóng to máy tính" : "Thu nhỏ"}
          >
            {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 hover:bg-rose-500/20 hover:text-rose-400 transition cursor-pointer"
            title="Đóng máy tính"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Main Body: Authentic Casio fx-580VN X Web Emulator */}
      {!isMinimized && (
        <div className="relative w-full h-[620px] max-h-[75vh] overflow-hidden rounded-b-2xl bg-[#0d1117]">
          <iframe
            ref={iframeRef}
            src="/casio/index.html"
            className="w-full h-full border-0 bg-[#0d1117]"
            title="Máy Tính Casio fx-580VN X ClassWiz"
            allow="autoplay"
          />
        </div>
      )}
    </div>
  );
}
