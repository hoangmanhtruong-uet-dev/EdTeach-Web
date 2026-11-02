"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, ZoomIn, ZoomOut, RotateCcw, Check, Loader2 } from "lucide-react";

interface AvatarCropModalProps {
  imageSrc: string;
  onCancel: () => void;
  onConfirm: (result: { blob: Blob; dataUrl: string }) => void;
}

export function AvatarCropModal({
  imageSrc,
  onCancel,
  onConfirm,
}: AvatarCropModalProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [processing, setProcessing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Keyboard navigation (ESC to cancel)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch drag for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleCropAndSave = useCallback(async () => {
    if (!imgRef.current) return;
    setProcessing(true);

    try {
      const img = imgRef.current;
      const targetSize = 256;
      const canvas = document.createElement("canvas");
      canvas.width = targetSize;
      canvas.height = targetSize;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Không thể khởi tạo canvas xử lý ảnh.");
      }

      // Draw circular mask for clean circular preview & crop
      const previewSize = 220; // Size of the circular window in UI
      const ratio = targetSize / previewSize;

      // Base dimension scaled to cover circular frame
      const naturalW = img.naturalWidth;
      const naturalH = img.naturalHeight;
      const minDim = Math.min(naturalW, naturalH);

      // Draw high resolution image centered and scaled according to user pan & zoom
      ctx.save();
      ctx.beginPath();
      ctx.arc(targetSize / 2, targetSize / 2, targetSize / 2, 0, Math.PI * 2);
      ctx.clip();

      // Background fill in case of transparency
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      // Calculation of destination rect
      const baseDrawSize = Math.max(naturalW, naturalH);
      const drawW = (naturalW / minDim) * targetSize * scale;
      const drawH = (naturalH / minDim) * targetSize * scale;
      const drawX = (targetSize - drawW) / 2 + position.x * ratio;
      const drawY = (targetSize - drawH) / 2 + position.y * ratio;

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.restore();

      const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            onConfirm({ blob, dataUrl });
          } else {
            throw new Error("Lỗi nén ảnh.");
          }
        },
        "image/jpeg",
        0.88
      );
    } catch (err) {
      console.error("Lỗi cắt ảnh:", err);
      setProcessing(false);
    }
  }, [position, scale, onConfirm]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="crop-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200 select-none"
    >
      <div className="bg-card text-card-foreground border border-border rounded-2xl max-w-sm w-full p-5 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h3 id="crop-modal-title" className="text-sm font-bold text-foreground">
            Cắt & Điều chỉnh ảnh đại diện
          </h3>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Đóng cửa sổ"
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Circular Preview Viewport */}
        <div className="my-5 flex flex-col items-center justify-center">
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
            className="relative w-[220px] h-[220px] rounded-full overflow-hidden border-4 border-primary shadow-lg cursor-grab active:cursor-grabbing bg-slate-900"
          >
            {/* Underlying Scaled and Moved Image */}
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Ảnh xem trước"
              draggable={false}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transformOrigin: "center center",
                transition: isDragging ? "none" : "transform 0.05s ease-out",
              }}
              className="w-full h-full object-cover pointer-events-none select-none max-w-none"
            />
          </div>

          <p className="text-[11px] text-muted-foreground mt-2">
            Kéo thả để căn chỉnh vị trí · Dùng thanh trượt dưới để phóng to
          </p>
        </div>

        {/* Zoom & Reset Controls */}
        <div className="space-y-3 bg-muted/40 p-3 rounded-xl border border-border">
          <div className="flex items-center gap-3">
            <ZoomOut className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="range"
              min="1"
              max="2.5"
              step="0.05"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              aria-label="Độ thu phóng ảnh"
              className="w-full accent-primary cursor-pointer"
            />
            <ZoomIn className="w-4 h-4 text-muted-foreground shrink-0" />
            <button
              type="button"
              onClick={handleReset}
              title="Đặt lại vị trí ban đầu"
              className="p-1.5 rounded-lg border border-border hover:bg-card text-muted-foreground hover:text-foreground transition cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onCancel}
            disabled={processing}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-border hover:bg-muted transition cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleCropAndSave}
            disabled={processing}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            {processing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>{processing ? "Đang xử lý…" : "Áp dụng ảnh này"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default AvatarCropModal;
