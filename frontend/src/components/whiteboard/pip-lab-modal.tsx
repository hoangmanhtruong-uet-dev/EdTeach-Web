"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Minimize2,
  Maximize2,
  FlaskConical,
  ExternalLink,
  Camera,
  Search,
  Check,
  ArrowLeft,
  Sparkles,
  Layers,
} from "lucide-react";
import { LABS, LabLesson, LabSubject, SUBJECT_LABEL, labFileUrl } from "@/data/labs";

interface PipLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSnapshotToCanvas?: (lab: LabLesson) => void;
}

export function PipLabModal({
  isOpen,
  onClose,
  onSnapshotToCanvas,
}: PipLabModalProps) {
  const [position, setPosition] = useState({ x: 80, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // Active Lab selection
  const [selectedLab, setSelectedLab] = useState<LabLesson | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<"all" | LabSubject>("all");
  const [snapshotSuccess, setSnapshotSuccess] = useState(false);

  // Dragging handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("input") || (e.target as HTMLElement).closest("iframe")) {
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
        x: Math.max(10, Math.min(window.innerWidth - 450, e.clientX - dragStartRef.current.x)),
        y: Math.max(10, Math.min(window.innerHeight - 150, e.clientY - dragStartRef.current.y)),
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

  const filteredLabs = LABS.filter((lab) => {
    const matchSubject = subjectFilter === "all" || lab.subject === subjectFilter;
    const matchQuery =
      !searchQuery.trim() ||
      lab.titleVi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lab.gdpt && lab.gdpt.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchSubject && matchQuery;
  });

  const handleSnapshot = () => {
    if (!selectedLab || !onSnapshotToCanvas) return;
    onSnapshotToCanvas(selectedLab);
    setSnapshotSuccess(true);
    setTimeout(() => setSnapshotSuccess(false), 2200);
  };

  if (!isOpen) return null;

  const modalWidth = isMaximized ? "w-[90vw] max-w-5xl" : isMinimized ? "w-80" : "w-[620px]";
  const modalHeight = isMaximized ? "h-[85vh]" : isMinimized ? "auto" : "h-[540px]";

  return (
    <div
      style={isMaximized ? { left: "5vw", top: "5vh" } : { left: `${position.x}px`, top: `${position.y}px` }}
      className={`fixed z-50 select-none shadow-2xl rounded-2xl border border-border bg-card text-card-foreground overflow-hidden flex flex-col transition-all duration-150 ${modalWidth} ${modalHeight}`}
    >
      {/* Top Drag Handle Bar */}
      <div
        onMouseDown={handleMouseDown}
        className="flex items-center justify-between px-4 py-2.5 bg-muted/80 border-b border-border cursor-move shrink-0"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <FlaskConical className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-foreground truncate max-w-[280px]">
            {selectedLab ? selectedLab.titleVi : "Thí nghiệm STEM 3D Mô phỏng"}
          </span>
          {selectedLab && (
            <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
              {SUBJECT_LABEL[selectedLab.subject]}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {selectedLab && (
            <button
              onClick={() => setSelectedLab(null)}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-medium flex items-center gap-1 mr-1"
              title="Quay lại danh mục"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Danh sách</span>
            </button>
          )}

          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            title={isMinimized ? "Mở rộng" : "Thu nhỏ"}
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            title={isMaximized ? "Kích thước gốc" : "Toàn màn hình"}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
            title="Đóng"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
          {selectedLab ? (
            /* LAB RUNNER VIEW */
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Lab Control Bar */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/40 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {selectedLab.gdpt || "Chương trình GDPT 2018"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSnapshot}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs cursor-pointer text-xs"
                    title="Chụp trạng thái thí nghiệm dán vào bảng để phân tích"
                  >
                    {snapshotSuccess ? <Check className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
                    <span>{snapshotSuccess ? "Đã dán vào Bảng!" : "Chụp dán lên Bảng"}</span>
                  </button>

                  <a
                    href={`/labs/${selectedLab.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border hover:bg-muted text-foreground transition"
                  >
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                    <span>Mở tab mới</span>
                  </a>
                </div>
              </div>

              {/* Embedded Lab Iframe (Trực tiếp Canvas WebGL 3D từ courses/*.html) */}
              <div className="flex-1 w-full bg-slate-950 relative">
                <iframe
                  src={labFileUrl(selectedLab.slug)}
                  className="w-full h-full border-0"
                  title={selectedLab.titleVi}
                  allow="fullscreen; accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                />
              </div>
            </div>
          ) : (
            /* LAB CATALOG SELECTION VIEW */
            <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-3">
              {/* Subject Tabs & Search */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg text-xs overflow-x-auto w-full sm:w-auto">
                  {(["all", "phys", "chem", "bio", "geo"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSubjectFilter(s)}
                      className={`px-2.5 py-1 rounded-md font-semibold transition ${
                        subjectFilter === s
                          ? "bg-card text-foreground shadow-xs font-bold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {s === "all" ? "Tất cả (54)" : SUBJECT_LABEL[s]}
                    </button>
                  ))}
                </div>

                <div className="relative flex-1 w-full">
                  <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm thí nghiệm (lực, thấu kính, điện trở, sóng, hóa học...)"
                    className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Lab List Grid */}
              <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredLabs.map((lab) => (
                  <div
                    key={lab.slug}
                    onClick={() => setSelectedLab(lab)}
                    className="p-3 rounded-xl border border-border bg-card hover:border-emerald-500 hover:shadow-xs transition cursor-pointer flex flex-col justify-between space-y-1.5"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                          {SUBJECT_LABEL[lab.subject]}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {lab.steps} bước thí nghiệm
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-foreground line-clamp-1">
                        {lab.titleVi}
                      </h4>
                      {lab.gdpt && (
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                          {lab.gdpt}
                        </p>
                      )}
                    </div>

                    <div className="pt-1 border-t border-border/60 flex items-center justify-between text-[11px] text-emerald-600 font-medium">
                      <span>Mở tương tác 3D →</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
