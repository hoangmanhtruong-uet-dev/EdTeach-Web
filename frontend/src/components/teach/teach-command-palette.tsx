"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  FileText,
  Clock,
  Radio,
  Eye,
  Maximize2,
  PenTool,
  FlaskConical,
  Sparkles,
  Layers,
  Wand2,
  Columns2,
  Keyboard,
  Pin,
  Flame,
  X,
} from "lucide-react";

export interface CommandItem {
  id: string;
  title: string;
  category: "Câu hỏi" | "Công cụ trình chiếu" | "Bố cục & Chế độ xem" | "AI & Trợ giảng";
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
}

export interface TeachCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  totalQuestions: number;
  onGoToQuestion: (idx: number) => void;
  // Tools
  onToggleTimer: () => void;
  onToggleLaser: () => void;
  onToggleSpotlight: () => void;
  onToggleProjectorMode: () => void;
  onToggleFullscreen: () => void;
  onSetSplitRatio: (ratio: number) => void;
  onSelectRightTab: (tab: "whiteboard" | "lab3d" | "multi_method") => void;
  onPinQuestionToBoard: () => void;
  onTriggerLiveClone: () => void;
  onTriggerScaffold: () => void;
  onToggleLivePoll: () => void;
  onOpenShortcuts: () => void;
}

export function TeachCommandPalette({
  isOpen,
  onClose,
  totalQuestions,
  onGoToQuestion,
  onToggleTimer,
  onToggleLaser,
  onToggleSpotlight,
  onToggleProjectorMode,
  onToggleFullscreen,
  onSetSplitRatio,
  onSelectRightTab,
  onPinQuestionToBoard,
  onTriggerLiveClone,
  onTriggerScaffold,
  onToggleLivePoll,
  onOpenShortcuts,
}: TeachCommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Build command list
  const commands = useMemo<CommandItem[]>(() => {
    const list: CommandItem[] = [];

    // Jump to questions
    for (let i = 1; i <= totalQuestions; i++) {
      const idx = i - 1;
      list.push({
        id: `q_${i}`,
        title: `Nhảy tới Câu ${i}`,
        category: "Câu hỏi",
        shortcut: `Câu ${i}`,
        icon: <FileText className="w-4 h-4 text-blue-400" />,
        action: () => {
          onGoToQuestion(idx);
          onClose();
        },
      });
    }

    // Presentation Tools
    list.push(
      {
        id: "tool_laser",
        title: "Bật / Tắt Laser Pointer vệt sáng đỏ",
        category: "Công cụ trình chiếu",
        shortcut: "L",
        icon: <span className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-xs" />,
        action: () => {
          onToggleLaser();
          onClose();
        },
      },
      {
        id: "tool_spotlight",
        title: "Bật / Tắt Spotlight tiêu điểm tập trung",
        category: "Công cụ trình chiếu",
        shortcut: "S",
        icon: <Radio className="w-4 h-4 text-amber-400" />,
        action: () => {
          onToggleSpotlight();
          onClose();
        },
      },
      {
        id: "tool_projector",
        title: "Bật / Tắt Chế độ Máy chiếu (Tương phản cao)",
        category: "Công cụ trình chiếu",
        shortcut: "P",
        icon: <Eye className="w-4 h-4 text-blue-400" />,
        action: () => {
          onToggleProjectorMode();
          onClose();
        },
      },
      {
        id: "tool_timer",
        title: "Bắt đầu / Dừng đồng hồ đếm giờ",
        category: "Công cụ trình chiếu",
        shortcut: "T",
        icon: <Clock className="w-4 h-4 text-amber-400" />,
        action: () => {
          onToggleTimer();
          onClose();
        },
      },
      {
        id: "tool_poll",
        title: "Mở phòng Live Poll khảo sát học sinh",
        category: "Công cụ trình chiếu",
        shortcut: "Live Poll",
        icon: <Flame className="w-4 h-4 text-emerald-400" />,
        action: () => {
          onToggleLivePoll();
          onClose();
        },
      },
      {
        id: "tool_fullscreen",
        title: "Toàn màn hình trình chiếu",
        category: "Công cụ trình chiếu",
        shortcut: "F",
        icon: <Maximize2 className="w-4 h-4 text-slate-300" />,
        action: () => {
          onToggleFullscreen();
          onClose();
        },
      }
    );

    // Layout commands
    list.push(
      {
        id: "layout_5050",
        title: "Chia đôi màn hình 50:50 (Đề & Bảng)",
        category: "Bố cục & Chế độ xem",
        shortcut: "\\",
        icon: <Columns2 className="w-4 h-4 text-blue-400" />,
        action: () => {
          onSetSplitRatio(50);
          onClose();
        },
      },
      {
        id: "layout_100",
        title: "Chỉ xem câu hỏi (100% Đề)",
        category: "Bố cục & Chế độ xem",
        icon: <FileText className="w-4 h-4 text-slate-300" />,
        action: () => {
          onSetSplitRatio(100);
          onClose();
        },
      },
      {
        id: "layout_0",
        title: "Chỉ xem cột phải (100% Bảng / 3D)",
        category: "Bố cục & Chế độ xem",
        icon: <PenTool className="w-4 h-4 text-slate-300" />,
        action: () => {
          onSetSplitRatio(0);
          onClose();
        },
      },
      {
        id: "tab_whiteboard",
        title: "Chuyển sang Bảng nháp Sư phạm",
        category: "Bố cục & Chế độ xem",
        icon: <PenTool className="w-4 h-4 text-amber-400" />,
        action: () => {
          onSelectRightTab("whiteboard");
          onClose();
        },
      },
      {
        id: "tab_lab3d",
        title: "Chuyển sang Phòng thí nghiệm 3D",
        category: "Bố cục & Chế độ xem",
        icon: <FlaskConical className="w-4 h-4 text-indigo-400" />,
        action: () => {
          onSelectRightTab("lab3d");
          onClose();
        },
      },
      {
        id: "tab_multimethod",
        title: "Chuyển sang Giải đa cách (15s & Casio)",
        category: "Bố cục & Chế độ xem",
        icon: <Sparkles className="w-4 h-4 text-amber-400" />,
        action: () => {
          onSelectRightTab("multi_method");
          onClose();
        },
      }
    );

    // AI & Teaching
    list.push(
      {
        id: "ai_pin",
        title: "Đưa câu hỏi hiện tại lên bảng vẽ canvas",
        category: "AI & Trợ giảng",
        icon: <Pin className="w-4 h-4 text-blue-400" />,
        action: () => {
          onPinQuestionToBoard();
          onClose();
        },
      },
      {
        id: "ai_clone",
        title: "Đẻ câu tương tự tại chỗ (2 phút áp dụng)",
        category: "AI & Trợ giảng",
        shortcut: "MAX",
        icon: <Wand2 className="w-4 h-4 text-amber-400" />,
        action: () => {
          onTriggerLiveClone();
          onClose();
        },
      },
      {
        id: "ai_scaffold",
        title: "Bẻ nhỏ bài toán thành 3 bước gợi mở tư duy",
        category: "AI & Trợ giảng",
        shortcut: "MAX",
        icon: <Layers className="w-4 h-4 text-indigo-400" />,
        action: () => {
          onTriggerScaffold();
          onClose();
        },
      },
      {
        id: "misc_shortcuts",
        title: "Mở bảng tra cứu phím tắt",
        category: "AI & Trợ giảng",
        shortcut: "?",
        icon: <Keyboard className="w-4 h-4 text-slate-300" />,
        action: () => {
          onOpenShortcuts();
          onClose();
        },
      }
    );

    return list;
  }, [
    totalQuestions,
    onGoToQuestion,
    onClose,
    onToggleLaser,
    onToggleSpotlight,
    onToggleProjectorMode,
    onToggleTimer,
    onToggleLivePoll,
    onToggleFullscreen,
    onSetSplitRatio,
    onSelectRightTab,
    onPinQuestionToBoard,
    onTriggerLiveClone,
    onTriggerScaffold,
    onOpenShortcuts,
  ]);

  // Filter commands
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const lower = query.toLowerCase().trim();
    return commands.filter(
      (c) =>
        c.title.toLowerCase().includes(lower) ||
        c.category.toLowerCase().includes(lower) ||
        (c.shortcut && c.shortcut.toLowerCase().includes(lower))
    );
  }, [commands, query]);

  // Keyboard navigation inside palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev === 0 ? Math.max(0, filteredCommands.length - 1) : prev - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-md pt-[12vh] p-4 animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[70vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-3 bg-slate-950/80">
          <Search className="w-5 h-5 text-blue-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Tìm nhanh câu hỏi, công cụ, hoặc chế độ xem..."
            className="flex-1 bg-transparent text-sm font-medium text-white placeholder-slate-500 outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-slate-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="rounded-md bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-400">
            Esc
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              Không tìm thấy lệnh nào phù hợp với &ldquo;{query}&rdquo;
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  type="button"
                  onClick={cmd.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs text-left transition cursor-pointer ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-md font-semibold"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-lg shrink-0 ${
                        isSelected ? "bg-white/20 text-white" : "bg-slate-800"
                      }`}
                    >
                      {cmd.icon}
                    </div>
                    <div className="truncate">
                      <p className="truncate font-medium">{cmd.title}</p>
                      <p
                        className={`text-[10px] ${
                          isSelected ? "text-blue-100" : "text-slate-500"
                        }`}
                      >
                        {cmd.category}
                      </p>
                    </div>
                  </div>

                  {cmd.shortcut && (
                    <kbd
                      className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold shrink-0 ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}
                    >
                      {cmd.shortcut}
                    </kbd>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="border-t border-slate-800 px-4 py-2 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>↑↓ để di chuyển</span>
            <span>↵ để chọn</span>
            <span>Esc để đóng</span>
          </div>
          <span>EdTeach Projector OS</span>
        </div>
      </div>
    </div>
  );
}
