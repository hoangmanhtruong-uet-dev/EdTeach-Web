"use client";

import React, { useEffect } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Clock } from "lucide-react";

export interface TeachTimerProps {
  seconds: number;
  isRunning: boolean;
  onToggleRunning: () => void;
  onSetSeconds: (sec: number) => void;
  onReset: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  mode: "countdown" | "stopwatch";
  onSetMode: (mode: "countdown" | "stopwatch") => void;
}

// Gentle Web Audio API beep sound for classroom
function playAlarmChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.3); // A6 note

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.45);
  } catch {
    // ignore
  }
}

export function TeachTimer({
  seconds,
  isRunning,
  onToggleRunning,
  onSetSeconds,
  onReset,
  soundEnabled,
  onToggleSound,
  mode,
  onSetMode,
}: TeachTimerProps) {
  // Format minutes & seconds
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const formattedTime = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  const isLowTime = mode === "countdown" && seconds <= 10 && seconds > 0;
  const isTimeUp = mode === "countdown" && seconds === 0;

  // Beep when reaching 0
  useEffect(() => {
    if (isTimeUp && soundEnabled) {
      playAlarmChime();
    }
  }, [isTimeUp, soundEnabled]);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/95 p-4 text-slate-100 shadow-xl max-w-sm select-none">
      {/* Header with Mode toggle */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            {mode === "countdown" ? "Đếm ngược làm bài" : "Bấm giờ câu hỏi"}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onSetMode("countdown")}
            className={`rounded-lg px-2 py-0.5 text-[11px] font-bold transition cursor-pointer ${
              mode === "countdown" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
            }`}
          >
            Đếm ngược
          </button>
          <button
            type="button"
            onClick={() => onSetMode("stopwatch")}
            className={`rounded-lg px-2 py-0.5 text-[11px] font-bold transition cursor-pointer ${
              mode === "stopwatch" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
            }`}
          >
            Bấm giờ
          </button>
        </div>
      </div>

      {/* Large Digital Clock Face */}
      <div className="flex items-center justify-center py-2">
        <div
          className={`font-mono tabular-nums text-4xl sm:text-5xl font-black px-6 py-2 rounded-2xl border transition-all ${
            isLowTime
              ? "bg-red-950/60 border-red-500 text-red-400 animate-pulse shadow-lg shadow-red-900/40"
              : isTimeUp
              ? "bg-red-950 border-red-600 text-red-300"
              : isRunning
              ? "bg-slate-950 border-amber-500/50 text-amber-300 shadow-md"
              : "bg-slate-950 border-slate-800 text-slate-300"
          }`}
        >
          {formattedTime}
        </div>
      </div>

      {/* Countdown Presets */}
      {mode === "countdown" && (
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {[60, 120, 180, 300].map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => onSetSeconds(sec)}
              className={`rounded-xl px-2.5 py-1 text-xs font-bold border transition cursor-pointer ${
                seconds === sec
                  ? "bg-amber-500/20 border-amber-500/60 text-amber-300"
                  : "bg-slate-800/80 border-slate-700/80 text-slate-400 hover:text-white"
              }`}
            >
              {sec / 60} phút
            </button>
          ))}
        </div>
      )}

      {/* Action Controls: Start/Pause, Reset, Sound toggle */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
        <button
          type="button"
          onClick={onToggleSound}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
          title={soundEnabled ? "Tắt âm báo hết giờ" : "Bật âm báo hết giờ"}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
          <span className="text-[11px]">{soundEnabled ? "Âm thanh" : "Tắt âm"}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
            title="Đặt lại đồng hồ"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Đặt lại</span>
          </button>

          <button
            type="button"
            onClick={onToggleRunning}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-bold transition cursor-pointer shadow-md ${
              isRunning
                ? "bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-amber-500/30"
                : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30"
            }`}
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isRunning ? "Tạm dừng" : "Bắt đầu"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
