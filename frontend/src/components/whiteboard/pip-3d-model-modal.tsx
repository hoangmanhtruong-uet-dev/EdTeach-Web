"use client";

import React, { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  X,
  Minimize2,
  Maximize2,
  Box,
  ExternalLink,
  Search,
  ArrowLeft,
  Upload,
  Sparkles,
  FileCode,
  Loader2,
} from "lucide-react";
import {
  EDUCATIONAL_3D_MODELS,
  Model3DItem,
  Model3DSubject,
  MODEL_SUBJECT_LABEL,
  MODEL_SUBJECT_BADGE,
} from "@/data/models-3d";

const Interactive3DViewer = dynamic(
  () => import("./interactive-3d-viewer").then((mod) => mod.Interactive3DViewer),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[280px] flex flex-col items-center justify-center p-8 bg-slate-900 text-white space-y-3 rounded-2xl">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
        <p className="text-xs text-slate-400 font-medium">Đang khởi tạo không gian 3D Three.js...</p>
      </div>
    ),
  }
);

interface Pip3DModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSnapshotToCanvas?: (snapshot: { dataUrl: string; modelName: string; subject: string }) => void;
}

export function Pip3DModelModal({
  isOpen,
  onClose,
  onSnapshotToCanvas,
}: Pip3DModelModalProps) {
  const [position, setPosition] = useState({ x: 90, y: 75 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // Active Model selection
  const [selectedModel, setSelectedModel] = useState<Model3DItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<"all" | Model3DSubject | "upload">("all");

  // Custom Uploaded 3D File (.glb / .gltf)
  const [customFileBuffer, setCustomFileBuffer] = useState<ArrayBuffer | null>(null);
  const [customFileName, setCustomFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dragging handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (
      (e.target as HTMLElement).closest("button") ||
      (e.target as HTMLElement).closest("input") ||
      (e.target as HTMLElement).closest("canvas")
    ) {
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

  const filteredModels = EDUCATIONAL_3D_MODELS.filter((item) => {
    const matchSubject = subjectFilter === "all" || item.subject === subjectFilter;
    const matchQuery =
      !searchQuery.trim() ||
      item.nameVi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.categoryVi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.gdpt && item.gdpt.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchSubject && matchQuery;
  });

  // Xử lý khi Thầy Cô tải tệp .glb / .gltf từ máy tính
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result instanceof ArrayBuffer) {
        setCustomFileBuffer(event.target.result);
        setCustomFileName(fileName);
        setSelectedModel(null); // Mở chế độ xem tệp custom
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleBackToCatalog = () => {
    setSelectedModel(null);
    setCustomFileBuffer(null);
    setCustomFileName("");
  };

  if (!isOpen) return null;

  const modalWidth = isMaximized ? "w-[92vw] max-w-6xl" : isMinimized ? "w-80" : "w-[680px]";
  const modalHeight = isMaximized ? "h-[88vh]" : isMinimized ? "auto" : "h-[560px]";

  const isViewing3D = selectedModel !== null || customFileBuffer !== null;

  return (
    <div
      style={isMaximized ? { left: "4vw", top: "4vh" } : { left: `${position.x}px`, top: `${position.y}px` }}
      className={`fixed z-50 select-none shadow-2xl rounded-2xl border border-border bg-card text-card-foreground overflow-hidden flex flex-col transition-all duration-150 ${modalWidth} ${modalHeight}`}
    >
      {/* 1. TOP DRAG HANDLE BAR */}
      <div
        onMouseDown={handleMouseDown}
        className="flex items-center justify-between px-4 py-2.5 bg-muted/80 border-b border-border cursor-move shrink-0"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-600 text-white shadow-xs">
            <Box className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-foreground truncate max-w-[280px]">
            {customFileName
              ? `Tệp 3D: ${customFileName}`
              : selectedModel
              ? selectedModel.nameVi
              : "Trung tâm Mô hình 3D Giáo dục"}
          </span>
          {selectedModel && (
            <span
              className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border ${
                MODEL_SUBJECT_BADGE[selectedModel.subject]
              }`}
            >
              {MODEL_SUBJECT_LABEL[selectedModel.subject]}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Nút Quay lại danh mục khi đang xem 3D */}
          {isViewing3D && (
            <button
              onClick={handleBackToCatalog}
              className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold flex items-center gap-1 mr-1 transition cursor-pointer"
              title="Quay lại kho mô hình 3D"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Danh sách</span>
            </button>
          )}

          {/* Nút mở nhanh Phòng thí nghiệm PhET 54 bài sang tab mới */}
          <a
            href="/labs"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 px-2 py-0.8 rounded-lg border border-border hover:bg-muted text-[11px] font-medium text-muted-foreground hover:text-foreground transition mr-1"
            title="Mở Phòng thí nghiệm PhET & Tongjiang (54 bài) trong tab mới"
          >
            <ExternalLink className="w-3 h-3" />
            <span className="hidden md:inline">Thí nghiệm PhET (54 bài) ↗</span>
          </a>

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
            title="Đóng cửa sổ"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. BODY CONTENT */}
      {!isMinimized && (
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
          {isViewing3D ? (
            /* VIEW 2: TRÌNH HIỂN THỊ VẬT THỂ 3D TƯƠNG TÁC THỜI GIAN THỰC */
            <Interactive3DViewer
              modelItem={selectedModel}
              customFileBuffer={customFileBuffer}
              customFileName={customFileName}
              onSnapshotToCanvas={onSnapshotToCanvas}
            />
          ) : (
            /* VIEW 1: KHO MÔ HÌNH 3D ĐA MÔN & TẢI TỆP */
            <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-3">
              {/* Tabs Lọc bộ môn & Ô tìm kiếm */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg text-xs overflow-x-auto w-full sm:w-auto">
                  {(
                    [
                      { key: "all", label: `Tất cả (${EDUCATIONAL_3D_MODELS.length})` },
                      { key: "math", label: "📐 Toán & 3D" },
                      { key: "chem", label: "🧪 Hóa học" },
                      { key: "bio", label: "🧬 Sinh học" },
                      { key: "geo", label: "🌍 Địa & Lý" },
                      { key: "upload", label: "📁 Tải file .glb" },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setSubjectFilter(t.key)}
                      className={`px-2.5 py-1 rounded-md font-semibold whitespace-nowrap transition cursor-pointer ${
                        subjectFilter === t.key
                          ? "bg-card text-foreground shadow-xs font-bold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {subjectFilter !== "upload" && (
                  <div className="relative flex-1 w-full">
                    <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm mô hình (chóp, lăng trụ, ADN, nước, tim, trái đất...)"
                      className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                )}
              </div>

              {/* View Upload File 3D (.glb / .gltf) */}
              {subjectFilter === "upload" ? (
                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-sky-500 rounded-2xl p-8 text-center transition bg-muted/20">
                  <div className="h-14 w-14 rounded-2xl bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-600 mb-3 shadow-xs">
                    <Upload className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground">
                    Tải tệp mô hình 3D (.glb / .gltf) từ máy tính
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-md mt-1 mb-4">
                    Thầy Cô có thể tải mô hình 3D bài học từ Sketchfab, Thingiverse hoặc xuất từ phần mềm 3D để chiếu trực tiếp trên bục giảng số.
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".glb,.gltf"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
                  >
                    <FileCode className="w-4 h-4" />
                    <span>Chọn tệp .glb / .gltf từ máy tính</span>
                  </button>
                </div>
              ) : (
                /* Grid Danh sách các mô hình 3D chuẩn GDPT */
                <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {filteredModels.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-xs text-muted-foreground">
                      Không tìm thấy mô hình 3D phù hợp với từ khóa "{searchQuery}"
                    </div>
                  ) : (
                    filteredModels.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedModel(item)}
                        className="p-3 rounded-xl border border-border bg-card hover:border-sky-500 hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-2 group"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                                MODEL_SUBJECT_BADGE[item.subject]
                              }`}
                            >
                              {MODEL_SUBJECT_LABEL[item.subject]}
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate max-w-[130px]">
                              {item.categoryVi}
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-foreground line-clamp-1 group-hover:text-sky-600 transition">
                            {item.nameVi}
                          </h4>

                          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                            {item.descriptionVi}
                          </p>
                        </div>

                        <div className="pt-1.5 border-t border-border/60 flex items-center justify-between text-[11px] font-semibold text-sky-600">
                          <span>Mở tương tác 3D</span>
                          <span className="group-hover:translate-x-0.5 transition">→</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
