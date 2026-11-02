"use client";

import React, { useEffect } from "react";
import { Keyboard, X } from "lucide-react";

export interface TeachShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUT_GROUPS = [
  {
    title: "Điều hướng & Chữa bài",
    shortcuts: [
      { key: "← / →", desc: "Chuyển câu trước / câu tiếp theo" },
      { key: "1 / 2 / 3", desc: "Mở Lớp 1 (Gợi ý) / Lớp 2 (Công thức) / Lớp 3 (Lời giải)" },
      { key: "A, B, C, D", desc: "Chọn nhanh phương án trắc nghiệm" },
      { key: "Enter", desc: "Hiện đáp án đúng & lời giải" },
      { key: "Esc", desc: "Đóng các panel trượt / tắt Spotlight / đóng modal" },
    ],
  },
  {
    title: "Công cụ Giảng dạy & Máy chiếu",
    shortcuts: [
      { key: "L", desc: "Bật / Tắt Laser Pointer vệt sáng đỏ" },
      { key: "S", desc: "Bật / Tắt Spotlight tiêu điểm tập trung" },
      { key: "P", desc: "Bật / Tắt Chế độ Máy chiếu (chữ to, tương phản cao, ẩn chuột)" },
      { key: "T", desc: "Bắt đầu / Tạm dừng đồng hồ đếm giờ" },
      { key: "F", desc: "Bật / Tắt toàn màn hình trình chiếu" },
    ],
  },
  {
    title: "Bố cục & Tìm kiếm",
    shortcuts: [
      { key: "Ctrl + K", desc: "Mở Command Palette tìm nhanh lệnh hoặc nhảy tới câu" },
      { key: "[ / ]", desc: "Thu nhỏ (-5%) / Mở rộng (+5%) cột câu hỏi" },
      { key: "\\", desc: "Đặt lại tỉ lệ chia đôi màn hình 50:50" },
      { key: "?", desc: "Mở bảng trợ giúp phím tắt này" },
    ],
  },
];

export function TeachShortcutsDialog({ isOpen, onClose }: TeachShortcutsDialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150 select-none">
      <div className="relative w-full max-w-xl rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-100 space-y-5 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Bảng Phím Tắt Bục Giảng Số</h2>
              <p className="text-xs text-slate-400">Thao tác nhanh bằng phím không cần dùng chuột</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts list grouped */}
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          {SHORTCUT_GROUPS.map((grp) => (
            <div key={grp.title} className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">
                {grp.title}
              </h3>
              <div className="grid gap-1.5 rounded-2xl border border-slate-800 bg-slate-950/60 p-2.5">
                {grp.shortcuts.map((sc) => (
                  <div
                    key={sc.key}
                    className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-800/50 transition text-xs"
                  >
                    <span className="text-slate-300">{sc.desc}</span>
                    <kbd className="rounded-lg bg-slate-800 border border-slate-700 px-2 py-1 font-mono text-[11px] font-bold text-amber-300 shadow-xs shrink-0">
                      {sc.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer tip */}
        <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-[11px] text-slate-400">
          <span>💡 Nhấn phím bất kỳ lúc đang chiếu để kích hoạt lệnh tương ứng</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-blue-600 px-4 py-1.5 font-bold text-white hover:bg-blue-500 transition cursor-pointer text-xs"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
}
