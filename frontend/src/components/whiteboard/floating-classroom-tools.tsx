"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  X,
  Radio,
  Volume2,
  VolumeX,
  Calculator,
  FlaskConical,
  Box,
  GripVertical,
} from "lucide-react";

interface FloatingClassroomToolsProps {
  isZenMode: boolean;
  onToggleZenMode: () => void;
  isLaserActive: boolean;
  onToggleLaser: () => void;
  onOpenMathModal?: () => void;
  onOpenCasioModal?: () => void;
  onOpenPipLabModal?: () => void;
}

/**
 * Phát âm thanh chuông kết thúc bằng Web Audio API thuần (không cần tệp mp3 ngoài)
 */
function playChimeSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Chuông ding-dong 2 âm
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, now); // Note A5
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.8);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1174.66, now + 0.2); // Note D6
    gain2.gain.setValueAtTime(0.4, now + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.2);
    osc2.stop(now + 1.2);
  } catch {
    // ignore
  }
}

export function FloatingClassroomTools({
  isZenMode,
  onToggleZenMode,
  isLaserActive,
  onToggleLaser,
  onOpenMathModal,
  onOpenCasioModal,
  onOpenPipLabModal,
}: FloatingClassroomToolsProps) {
  // Timer state
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(120); // Mặc định 2:00
  const [timeLeft, setTimeLeft] = useState(120);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Countdown effect
  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsTimerRunning(false);
            if (soundEnabled) playChimeSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, timeLeft, soundEnabled]);

  const handleStartTimer = (seconds?: number) => {
    const target = seconds !== undefined ? seconds : timeLeft > 0 ? timeLeft : totalSeconds;
    if (seconds !== undefined) {
      setTotalSeconds(seconds);
      setTimeLeft(seconds);
    }
    setIsTimerRunning(true);
    setShowTimerModal(true);
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
  };

  const handleResetTimer = (seconds = totalSeconds) => {
    setIsTimerRunning(false);
    setTimeLeft(seconds);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<HTMLElement>(null);
  const isDraggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0, initialLeft: 0, initialTop: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("input")) return;
    if (!dragRef.current) return;

    const rect = dragRef.current.getBoundingClientRect();
    isDraggingRef.current = true;
    startPosRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialLeft: rect.left,
      initialTop: rect.top,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !dragRef.current) return;
    const dx = e.clientX - startPosRef.current.x;
    const dy = e.clientY - startPosRef.current.y;
    const rect = dragRef.current.getBoundingClientRect();

    const minX = 8;
    const maxX = window.innerWidth - rect.width - 8;
    const minY = 56;
    const maxY = window.innerHeight - rect.height - 8;

    const newX = Math.min(Math.max(minX, startPosRef.current.initialLeft + dx), maxX);
    const newY = Math.min(Math.max(minY, startPosRef.current.initialTop + dy), maxY);

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  return (
    <>
      {/* 1. THANH CÔNG CỤ NỔI (HỖ TRỢ KÉO THẢ TỰ DO ĐẾN BẤT KỲ VỊ TRÍ NÀO) */}
      <aside
        ref={dragRef}
        aria-label="Thanh công cụ bục giảng nổi"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={
          position
            ? { left: `${position.x}px`, top: `${position.y}px`, transform: "none", bottom: "auto", right: "auto" }
            : undefined
        }
        className={`fixed z-40 flex items-center gap-1 rounded-full border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-2 py-1.5 shadow-xl backdrop-blur-md select-none touch-none ${
          !position ? "bottom-4 right-14 max-xl:bottom-16 max-xl:left-1/2 max-xl:-translate-x-1/2 max-xl:right-auto" : ""
        }`}
      >
        {/* Nút tay cầm kéo thả */}
        <div
          className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center touch-none rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="Giữ chuột và kéo để di chuyển thanh công cụ bục giảng đến bất kỳ vị trí nào"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </div>
        {/* Nút Timer Mini */}
        <button
          onClick={() => setShowTimerModal(!showTimerModal)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition ${
            isTimerRunning
              ? timeLeft <= 30
                ? "bg-red-500 text-white animate-pulse"
                : "bg-amber-500 text-slate-950 font-black"
              : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
          title="Đồng hồ đếm ngược ⏱️ 02:00 luyện tập tại chỗ"
        >
          <Timer className="h-4 w-4" />
          <span className="tabular-nums font-mono">
            {formatTime(timeLeft)}
          </span>
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

        {/* Nút Bút Laser */}
        <button
          onClick={onToggleLaser}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition cursor-pointer ${
            isLaserActive
              ? "bg-red-600 text-white shadow-md shadow-red-500/30"
              : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
          title="Bút Laser chỉ bảng trên máy chiếu"
        >
          <Radio className="h-4 w-4" />
          <span className="hidden sm:inline">Laser</span>
        </button>

        {/* Nút Gõ Công thức f(x) */}
        {onOpenMathModal && (
          <>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
            <button
              onClick={onOpenMathModal}
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-serif italic font-black text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition cursor-pointer"
              title="Gõ công thức Toán / Khoa học KaTeX (LaTeX)"
            >
              <span>f(x)</span>
              <span className="font-sans not-italic text-[10px] hidden sm:inline">Toán</span>
            </button>
          </>
        )}

        {/* Nút Máy tính Casio fx-580 */}
        {onOpenCasioModal && (
          <>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
            <button
              onClick={onOpenCasioModal}
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition cursor-pointer"
              title="Mở máy tính Casio fx-580VN X ảo nổi"
            >
              <Calculator className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Casio</span>
            </button>
          </>
        )}

        {/* Nút Mô hình 3D */}
        {onOpenPipLabModal && (
          <>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
            <button
              onClick={onOpenPipLabModal}
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 transition cursor-pointer"
              title="Mở Trung tâm Mô hình 3D Giáo dục (Toán, Hóa, Sinh, Địa) & Tải file .glb"
            >
              <Box className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Mô hình 3D</span>
            </button>
          </>
        )}

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

        {/* Nút Zen Fullscreen */}
        <button
          onClick={onToggleZenMode}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition ${
            isZenMode
              ? "bg-blue-600 text-white shadow-md"
              : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
          title={isZenMode ? "Thoát toàn màn hình (Esc)" : "Toàn màn hình giảng dạy (Zen Mode)"}
        >
          {isZenMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          <span className="hidden sm:inline">{isZenMode ? "Thu nhỏ" : "Toàn màn hình"}</span>
        </button>
      </aside>

      {/* 2. CỬA SỔ TIMER ĐẾM NGƯỢC NỔI (KHI MỞ CHI TIẾT) */}
      {showTimerModal && (
        <div
          style={
            position
              ? {
                  left: `${Math.min(Math.max(10, position.x), typeof window !== "undefined" ? window.innerWidth - 330 : 600)}px`,
                  top: position.y > 320 ? `${position.y - 250}px` : `${position.y + 55}px`,
                  bottom: "auto",
                  right: "auto",
                  transform: "none",
                }
              : undefined
          }
          className={`fixed z-50 w-80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 ${
            !position ? "bottom-16 right-14 max-xl:bottom-28 max-xl:left-1/2 max-xl:-translate-x-1/2 max-xl:right-auto" : ""
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Đồng Hồ Bục Giảng
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                title={soundEnabled ? "Tắt âm báo" : "Bật âm báo"}
              >
                {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => setShowTimerModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Mặt số to rõ */}
          <div className="py-4 text-center">
            <div
              className={`text-5xl font-black tabular-nums font-mono tracking-tight transition ${
                timeLeft === 0
                  ? "text-red-600 animate-bounce"
                  : timeLeft <= 30
                  ? "text-red-500 animate-pulse"
                  : "text-slate-900 dark:text-white"
              }`}
            >
              {formatTime(timeLeft)}
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              {timeLeft === 0 ? "⏱️ Hết giờ làm bài!" : isTimerRunning ? "Đang đếm ngược..." : "Tạm dừng"}
            </p>
          </div>

          {/* Nút Preset nhanh */}
          <div className="grid grid-cols-3 gap-2 pb-3">
            <button
              onClick={() => handleResetTimer(60)}
              className={`py-1.5 text-xs font-bold rounded-lg border transition ${
                totalSeconds === 60
                  ? "bg-amber-500 text-slate-950 border-amber-500"
                  : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              1 Phút
            </button>
            <button
              onClick={() => handleResetTimer(120)}
              className={`py-1.5 text-xs font-bold rounded-lg border transition ${
                totalSeconds === 120
                  ? "bg-amber-500 text-slate-950 border-amber-500"
                  : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              2 Phút
            </button>
            <button
              onClick={() => handleResetTimer(300)}
              className={`py-1.5 text-xs font-bold rounded-lg border transition ${
                totalSeconds === 300
                  ? "bg-amber-500 text-slate-950 border-amber-500"
                  : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              5 Phút
            </button>
          </div>

          {/* Điều khiển Play/Pause/Reset */}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            {isTimerRunning ? (
              <button
                onClick={handlePauseTimer}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold shadow-sm hover:brightness-105 transition"
              >
                <Pause className="h-4 w-4" />
                <span>Tạm Dừng</span>
              </button>
            ) : (
              <button
                onClick={() => handleStartTimer()}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-sm hover:bg-blue-700 transition"
              >
                <Play className="h-4 w-4" />
                <span>{timeLeft === 0 ? "Bắt Đầu Lại" : "Tiếp Tục"}</span>
              </button>
            )}
            <button
              onClick={() => handleResetTimer()}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Đặt lại thời gian"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3. HIỆU ỨNG LASER POINTER KHI BẬT */}
      {isLaserActive && <LaserPointerOverlay />}
    </>
  );
}

/**
 * Hiệu ứng Laser Pointer phủ trên màn hình
 */
function LaserPointerOverlay() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [trail, setTrail] = useState<Array<{ x: number; y: number; id: number }>>([]);

  useEffect(() => {
    let idCounter = 0;
    const handleMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      idCounter++;
      setTrail((prev) => [...prev.slice(-12), { x: e.clientX, y: e.clientY, id: idCounter }]);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {/* Vệt đuôi mờ */}
      {trail.map((p, idx) => {
        const opacity = (idx + 1) / trail.length;
        return (
          <div
            key={p.id}
            className="absolute rounded-full bg-red-500 blur-[1px] transition-opacity"
            style={{
              left: p.x - 3,
              top: p.y - 3,
              width: 6,
              height: 6,
              opacity: opacity * 0.4,
            }}
          />
        );
      })}

      {/* Chấm Laser chính */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          left: pos.x,
          top: pos.y,
          width: 14,
          height: 14,
          background: "radial-gradient(circle, #ff0000 0%, #ff4d4d 60%, rgba(255, 0, 0, 0) 100%)",
          boxShadow: "0 0 12px 4px rgba(255, 0, 0, 0.8), 0 0 24px 8px rgba(255, 50, 50, 0.5)",
        }}
      />
    </div>
  );
}
