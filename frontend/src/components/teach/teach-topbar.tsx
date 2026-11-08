"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Columns2,
  Maximize2,
  Minimize2,
  MoreVertical,
  Flame,
  Crown,
  Timer as TimerIcon,
  Sparkles,
  FlaskConical,
  Wand2,
  Layers,
  Search,
  Keyboard,
  Radio,
  Eye,
  Sliders,
  Volume2,
  VolumeX,
  FileText,
  Square,
  Pin,
  Presentation,
  ChevronDown,
  Loader2,
} from "lucide-react";

export interface TeachTopbarProps {
  examName: string;
  isMax: boolean;
  isPro: boolean;
  splitRatio: number;
  onSetSplitRatio: (ratio: number) => void;
  fontSizeMultiplier: number;
  onSetFontSizeMultiplier: (mul: number) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  // Timer
  timerSeconds: number;
  isTimerRunning: boolean;
  onToggleTimer: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  // Live Poll
  livePollSession: Record<string, unknown> | null;
  onToggleLivePoll: () => void;
  // Projector Tools
  isLaserActive: boolean;
  onToggleLaser: () => void;
  isSpotlightActive: boolean;
  onToggleSpotlight: () => void;
  isProjectorMode: boolean;
  onToggleProjectorMode: () => void;
  // Right Tab Selectors & AI triggers
  activeRightTab: "whiteboard" | "lab3d" | "multi_method";
  onSelectRightTab: (tab: "whiteboard" | "lab3d" | "multi_method") => void;
  onPinQuestionToBoard: () => void;
  onTriggerLiveClone: () => void;
  isCloning: boolean;
  onTriggerScaffold: () => void;
  isScaffolding: boolean;
  onTriggerMultiMethod: () => void;
  isSolvingMultiMethod: boolean;
  // Modals
  onOpenShortcuts: () => void;
  onOpenCommandPalette: () => void;
}

export function TeachTopbar({
  examName,
  isMax,
  isPro,
  splitRatio,
  onSetSplitRatio,
  fontSizeMultiplier,
  onSetFontSizeMultiplier,
  isFullscreen,
  onToggleFullscreen,
  timerSeconds,
  isTimerRunning,
  onToggleTimer,
  soundEnabled,
  onToggleSound,
  livePollSession,
  onToggleLivePoll,
  isLaserActive,
  onToggleLaser,
  isSpotlightActive,
  onToggleSpotlight,
  isProjectorMode,
  onToggleProjectorMode,
  activeRightTab,
  onSelectRightTab,
  onPinQuestionToBoard,
  onTriggerLiveClone,
  isCloning,
  onTriggerScaffold,
  isScaffolding,
  onTriggerMultiMethod,
  isSolvingMultiMethod,
  onOpenShortcuts,
  onOpenCommandPalette,
}: TeachTopbarProps) {
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);

  const toolsRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setToolsDropdownOpen(false);
      }
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Format timer text
  const mins = Math.floor(timerSeconds / 60);
  const secs = timerSeconds % 60;
  const timeFormatted = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return (
    <header
      className={`h-14 flex-none border-b border-slate-800 bg-slate-950/95 px-3 backdrop-blur-md z-30 flex items-center justify-between text-xs select-none ${
        isProjectorMode ? "bg-black border-slate-700" : ""
      }`}
    >
      {/* 1. LEFT: Thoát + Tên Đề + MAX badge */}
      <div className="flex items-center gap-2.5 min-w-0">
        <Link
          href="/exams"
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer shrink-0"
          title="Thoát Bục Giảng & quay lại danh sách đề thi"
          aria-label="Thoát bục giảng"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Thoát</span>
        </Link>

        <span className="h-4 w-px bg-slate-800 hidden sm:inline" />

        <div className="flex items-center gap-2 min-w-0">
          {isMax ? (
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0"
              title="Tài khoản Gói MAX VIP"
            >
              MAX
            </span>
          ) : isPro ? (
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0"
              title="Tài khoản Gói PRO"
            >
              PRO
            </span>
          ) : null}

          <h1
            className="truncate font-bold text-white text-sm max-w-[140px] sm:max-w-[220px] md:max-w-xs lg:max-w-sm"
            title={examName}
          >
            {examName}
          </h1>
        </div>
      </div>

      {/* 2. CENTER: Chế độ xem (Segmented Control) + Dropdown Công cụ */}
      <div className="hidden md:flex items-center gap-2">
        {/* Layout Presets Segmented Control */}
        <div
          role="group"
          aria-label="Chế độ xem màn hình"
          className="flex items-center rounded-xl bg-slate-900 p-0.5 border border-slate-800"
        >
          <button
            type="button"
            onClick={() => onSetSplitRatio(100)}
            title="Chỉ câu hỏi (100% Đề)"
            aria-label="Chỉ xem câu hỏi"
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold whitespace-nowrap transition cursor-pointer ${
              splitRatio === 100
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden lg:inline">Chỉ câu hỏi</span>
          </button>
          <button
            type="button"
            onClick={() => onSetSplitRatio(70)}
            title="Tỉ lệ 70% Đề - 30% Cột phải"
            aria-label="Chia tỉ lệ 70:30"
            className={`rounded-lg px-2 py-1 font-semibold whitespace-nowrap transition cursor-pointer ${
              splitRatio === 70
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            70:30
          </button>
          <button
            type="button"
            onClick={() => onSetSplitRatio(50)}
            title="Chia đôi 50:50 (Đề & Bảng/3D/Giải đa cách)"
            aria-label="Chia đôi 50:50"
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold whitespace-nowrap transition cursor-pointer ${
              splitRatio === 50
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>50:50</span>
          </button>
          <button
            type="button"
            onClick={() => onSetSplitRatio(30)}
            title="Tỉ lệ 30% Đề - 70% Cột phải"
            aria-label="Chia tỉ lệ 30:70"
            className={`rounded-lg px-2 py-1 font-semibold whitespace-nowrap transition cursor-pointer ${
              splitRatio === 30
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            30:70
          </button>
          <button
            type="button"
            onClick={() => onSetSplitRatio(0)}
            title="Chỉ bảng (100% Cột phải)"
            aria-label="Chỉ xem bảng vẽ"
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold whitespace-nowrap transition cursor-pointer ${
              splitRatio === 0
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Square className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden lg:inline">Chỉ bảng</span>
          </button>
        </div>

        {/* Dropdown "Công cụ" */}
        <div ref={toolsRef} className="relative">
          <button
            type="button"
            onClick={() => setToolsDropdownOpen((v) => !v)}
            aria-expanded={toolsDropdownOpen}
            aria-haspopup="menu"
            aria-label="Mở danh mục công cụ trợ giảng"
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-1 font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer whitespace-nowrap"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
            <span>Công cụ</span>
            <ChevronDown className="w-3 h-3 text-slate-400" aria-hidden="true" />
          </button>

          {toolsDropdownOpen && (
            <div
              role="menu"
              className="absolute left-0 top-full mt-1.5 w-60 rounded-2xl border border-slate-800 bg-slate-900/98 p-1.5 shadow-2xl backdrop-blur-md z-50 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1">
                Cột phải & Trợ giảng
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onSelectRightTab("whiteboard");
                  if (splitRatio === 100) onSetSplitRatio(50);
                  setToolsDropdownOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-xs text-left transition ${
                  activeRightTab === "whiteboard"
                    ? "bg-blue-600/20 text-blue-300 font-bold"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <span>✏️ Bảng nháp Sư phạm</span>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onSelectRightTab("lab3d");
                  if (splitRatio === 100) onSetSplitRatio(50);
                  setToolsDropdownOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-xs text-left transition ${
                  activeRightTab === "lab3d"
                    ? "bg-indigo-600/20 text-indigo-300 font-bold"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <FlaskConical className="w-3.5 h-3.5 text-indigo-400" />
                <span>Phòng thí nghiệm 3D</span>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onSelectRightTab("multi_method");
                  if (splitRatio === 100) onSetSplitRatio(50);
                  onTriggerMultiMethod();
                  setToolsDropdownOpen(false);
                }}
                disabled={isSolvingMultiMethod}
                className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs text-left transition ${
                  activeRightTab === "multi_method"
                    ? "bg-amber-500/20 text-amber-300 font-bold"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  {isSolvingMultiMethod ? (
                    <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span>Giải đa cách (15s & Casio)</span>
                </span>
                <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[9px] font-black text-amber-400">
                  MAX
                </span>
              </button>

              <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 mt-2 mb-1">
                Tương tác bài giảng
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onPinQuestionToBoard();
                  setToolsDropdownOpen(false);
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-xs text-left text-slate-300 hover:bg-slate-800 transition"
              >
                <Pin className="w-3.5 h-3.5 text-blue-400" />
                <span>Đưa đề lên bảng vẽ</span>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onTriggerLiveClone();
                  setToolsDropdownOpen(false);
                }}
                disabled={isCloning}
                className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs text-left text-slate-300 hover:bg-slate-800 transition disabled:opacity-50"
              >
                <span className="flex items-center gap-2.5">
                  <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Đẻ câu tương tự 2 phút</span>
                </span>
                <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[9px] font-black text-amber-400">
                  MAX
                </span>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onTriggerScaffold();
                  setToolsDropdownOpen(false);
                }}
                disabled={isScaffolding}
                className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs text-left text-slate-300 hover:bg-slate-800 transition disabled:opacity-50"
              >
                <span className="flex items-center gap-2.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Bẻ nhỏ bài toán 3 bước</span>
                </span>
                <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[9px] font-black text-amber-400">
                  MAX
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. RIGHT: Đồng hồ + Live Poll + Cỡ chữ + Toàn màn hình + Menu ⋯ */}
      <div className="flex items-center gap-2">
        {/* Đồng hồ đếm ngược nút bấm */}
        <button
          type="button"
          onClick={onToggleTimer}
          title={isTimerRunning ? "Tạm dừng đồng hồ (Phím T)" : "Bắt đầu đếm giờ (Phím T)"}
          aria-label={isTimerRunning ? "Dừng đồng hồ" : "Chạy đồng hồ"}
          className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1 font-mono font-bold transition cursor-pointer tabular-nums ${
            timerSeconds <= 10 && timerSeconds > 0
              ? "border-red-500 bg-red-950/60 text-red-300 animate-pulse"
              : isTimerRunning
              ? "border-amber-500/50 bg-amber-950/40 text-amber-300"
              : "border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800"
          }`}
        >
          <TimerIcon className={`w-3.5 h-3.5 ${isTimerRunning ? "text-amber-400 animate-spin" : "text-slate-400"}`} />
          <span>{timeFormatted}</span>
        </button>

        {/* Live Poll Nút bấm */}
        <button
          type="button"
          onClick={onToggleLivePoll}
          title="Mở phòng khảo sát đáp án Live Poll thời gian thực"
          aria-label="Mở phòng live poll"
          className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/50 hover:bg-emerald-900/60 px-2.5 py-1 font-bold text-emerald-300 transition cursor-pointer"
        >
          <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" aria-hidden="true" />
          <span className="hidden sm:inline">Live Poll</span>
          {Boolean(livePollSession?.roomCode) && (
            <span className="rounded bg-emerald-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2">
              {String(livePollSession?.roomCode)}
            </span>
          )}
        </button>

        {/* Bộ chọn cỡ chữ: 0.9 / 1.0 / 1.2 / 1.4 */}
        <div
          role="group"
          aria-label="Cỡ chữ máy chiếu"
          className="flex items-center rounded-xl bg-slate-900 p-0.5 border border-slate-800"
        >
          <button
            type="button"
            onClick={() => onSetFontSizeMultiplier(0.9)}
            title="Cỡ chữ nhỏ (0.9x)"
            aria-label="Cỡ chữ nhỏ 0.9x"
            className={`rounded-lg px-2.5 py-1 min-h-[30px] text-xs font-bold transition cursor-pointer ${
              fontSizeMultiplier === 0.9
                ? "bg-slate-800 text-blue-400 shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            A-
          </button>
          <button
            type="button"
            onClick={() => onSetFontSizeMultiplier(1.0)}
            title="Cỡ chữ chuẩn (1.0x)"
            aria-label="Cỡ chữ chuẩn 1.0x"
            className={`rounded-lg px-2.5 py-1 min-h-[30px] text-xs font-bold transition cursor-pointer ${
              fontSizeMultiplier === 1.0
                ? "bg-slate-800 text-blue-400 shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            A
          </button>
          <button
            type="button"
            onClick={() => onSetFontSizeMultiplier(1.2)}
            title="Cỡ chữ to (1.2x)"
            aria-label="Cỡ chữ to 1.2x"
            className={`rounded-lg px-2.5 py-1 min-h-[30px] text-xs font-bold transition cursor-pointer ${
              fontSizeMultiplier === 1.2
                ? "bg-slate-800 text-amber-400 shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            A+
          </button>
          <button
            type="button"
            onClick={() => onSetFontSizeMultiplier(1.4)}
            title="Cỡ chữ cực đại cho máy chiếu xa (1.4x)"
            aria-label="Cỡ chữ cực đại 1.4x"
            className={`rounded-lg px-2.5 py-1 min-h-[30px] text-xs font-bold transition cursor-pointer ${
              fontSizeMultiplier === 1.4
                ? "bg-slate-800 text-amber-400 shadow-xs"
                : "text-slate-400 hover:text-white"
            }`}
          >
            A++
          </button>
        </div>

        {/* Nút Toàn màn hình duy nhất */}
        <button
          type="button"
          onClick={onToggleFullscreen}
          title={isFullscreen ? "Thoát toàn màn hình (Phím F)" : "Toàn màn hình trình chiếu (Phím F)"}
          aria-label={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Maximize2 className="h-4 w-4" aria-hidden="true" />
          )}
        </button>

        {/* Menu ⋯ (More tools & Settings) */}
        <div ref={moreRef} className="relative">
          <button
            type="button"
            onClick={() => setMoreDropdownOpen((v) => !v)}
            aria-expanded={moreDropdownOpen}
            aria-haspopup="menu"
            aria-label="Cài đặt và công cụ trình chiếu mở rộng"
            title="Menu công cụ mở rộng"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <MoreVertical className="h-4 w-4" aria-hidden="true" />
          </button>

          {moreDropdownOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-1.5 w-64 rounded-2xl border border-slate-800 bg-slate-900/98 p-1.5 shadow-2xl backdrop-blur-md z-50 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="md:hidden px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1">
                Bục Giảng & Công Cụ Sư Phạm
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onSelectRightTab("whiteboard");
                  if (splitRatio === 100) onSetSplitRatio(50);
                  setMoreDropdownOpen(false);
                }}
                className={`md:hidden flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-xs text-left transition ${
                  activeRightTab === "whiteboard"
                    ? "bg-blue-600/20 text-blue-300 font-bold"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <Presentation className="w-3.5 h-3.5 text-blue-400" />
                <span>Bảng nháp Excalidraw</span>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onSelectRightTab("lab3d");
                  if (splitRatio === 100) onSetSplitRatio(50);
                  setMoreDropdownOpen(false);
                }}
                className={`md:hidden flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-xs text-left transition ${
                  activeRightTab === "lab3d"
                    ? "bg-indigo-600/20 text-indigo-300 font-bold"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <FlaskConical className="w-3.5 h-3.5 text-indigo-400" />
                <span>Phòng thí nghiệm 3D</span>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onTriggerLiveClone();
                  setMoreDropdownOpen(false);
                }}
                disabled={isCloning}
                className="md:hidden flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs text-left text-slate-300 hover:bg-slate-800 transition disabled:opacity-50"
              >
                <span className="flex items-center gap-2.5">
                  <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Đẻ câu tương tự 2 phút</span>
                </span>
                <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[9px] font-black text-amber-400">
                  MAX
                </span>
              </button>
              <div className="md:hidden border-b border-slate-800 my-1" />

              <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1">
                Công cụ Trình chiếu
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onToggleLaser();
                  setMoreDropdownOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs text-left transition ${
                  isLaserActive
                    ? "bg-red-500/20 text-red-300 font-bold"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500 shadow-xs" />
                  <span>Laser pointer</span>
                </span>
                <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">L</kbd>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onToggleSpotlight();
                  setMoreDropdownOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs text-left transition ${
                  isSpotlightActive
                    ? "bg-amber-500/20 text-amber-300 font-bold"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-amber-400" />
                  <span>Spotlight tiêu điểm</span>
                </span>
                <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">S</kbd>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onToggleProjectorMode();
                  setMoreDropdownOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs text-left transition ${
                  isProjectorMode
                    ? "bg-blue-600/20 text-blue-300 font-bold"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                  <span>Chế độ Máy chiếu</span>
                </span>
                <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">P</kbd>
              </button>

              <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 mt-2 mb-1">
                Hỗ trợ & Tìm kiếm
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onOpenCommandPalette();
                  setMoreDropdownOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs text-left text-slate-300 hover:bg-slate-800 transition"
              >
                <span className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <span>Tìm nhanh lệnh / câu hỏi</span>
                </span>
                <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">Ctrl+K</kbd>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onOpenShortcuts();
                  setMoreDropdownOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs text-left text-slate-300 hover:bg-slate-800 transition"
              >
                <span className="flex items-center gap-2">
                  <Keyboard className="w-3.5 h-3.5 text-slate-400" />
                  <span>Bảng phím tắt</span>
                </span>
                <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">?</kbd>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={onToggleSound}
                className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs text-left text-slate-300 hover:bg-slate-800 transition"
              >
                <span className="flex items-center gap-2">
                  {soundEnabled ? (
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span>Âm báo đồng hồ</span>
                </span>
                <span className="text-[10px] text-slate-400">{soundEnabled ? "Bật" : "Tắt"}</span>
              </button>

              <div className="border-t border-slate-800 mt-2 pt-2 px-2.5 pb-1 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-400" />
                  <span>Gói tài khoản</span>
                </span>
                <span className="font-bold text-amber-400">
                  {isMax ? "Bục Giảng MAX VIP" : isPro ? "Bục Giảng PRO" : "Miễn phí"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
