"use client";

import React, { useState } from "react";
import { useToast } from "@/context/toast-context";
import { Download, Edit3, Trash2 } from "lucide-react";

interface SvgWrapperProps {
  children: React.ReactNode;
  title: string;
  onDelete?: () => void;
}

export function SvgIllustrationWrapper({ children, title, onDelete }: SvgWrapperProps) {
  const { showToast } = useToast();
  const [isSelected, setIsSelected] = useState(false);

  const handleDownload = () => {
    // Download SVG as file
    const svgEl = document.getElementById(`svg-${title}`);
    if (svgEl) {
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/\s+/g, "_")}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div
      onClick={() => setIsSelected(!isSelected)}
      className={`relative my-4 inline-block rounded-sm p-4 transition cursor-pointer select-none ${
        isSelected
          ? "border-2 border-blue-500 bg-blue-50/10 shadow-sm"
          : "border border-slate-200 hover:border-blue-300"
      }`}
    >
      {/* Floating Action Buttons (Screenshot 2: Download & Sửa hình) */}
      <div className="absolute top-2 right-2 flex items-center gap-1.5 rounded-md border border-slate-200 bg-white/95 px-2 py-1 shadow-sm backdrop-blur-sm z-10 print:hidden">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDownload();
          }}
          title="Tải ảnh SVG về máy"
          className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        >
          <Download className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            showToast("Chế độ chỉnh sửa hình ảnh SVG đang được cập nhật.", "info");
          }}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
        >
          <Edit3 className="h-3 w-3" />
          <span>Sửa hình</span>
        </button>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Xóa hình này"
            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div id={`svg-${title}`} className="flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

// 1. Tấm nhôm và hộp không nắp (Exact match with Screenshot 2)
export function SheetBoxSvg({ onDelete }: { onDelete?: () => void }) {
  return (
    <SvgIllustrationWrapper title="tam_nhom_va_hop" onDelete={onDelete}>
      <svg
        width="280"
        height="320"
        viewBox="0 0 280 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="font-serif"
      >
        <defs>
          {/* Shading for corner squares */}
          <pattern id="diagHatch" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="6" stroke="#475569" strokeWidth="1" />
          </pattern>
          {/* Arrow markers */}
          <marker id="arrStart" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 5 L 10 2 L 10 8 z" fill="#1e293b" />
          </marker>
          <marker id="arrEnd" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 2 L 10 5 L 0 8 z" fill="#1e293b" />
          </marker>
        </defs>

        {/* --- Top Drawing: Metal Sheet with Cut Corners --- */}
        {/* Main sheet outline */}
        <rect x="50" y="35" width="160" height="110" stroke="#0f172a" strokeWidth="1.8" fill="#ffffff" />

        {/* 4 Corner cutout squares with hatched pattern */}
        {/* Top-Left */}
        <rect x="50" y="35" width="22" height="22" fill="url(#diagHatch)" stroke="#0f172a" strokeWidth="1.2" />
        {/* Top-Right */}
        <rect x="188" y="35" width="22" height="22" fill="url(#diagHatch)" stroke="#0f172a" strokeWidth="1.2" />
        {/* Bottom-Left */}
        <rect x="50" y="123" width="22" height="22" fill="url(#diagHatch)" stroke="#0f172a" strokeWidth="1.2" />
        {/* Bottom-Right */}
        <rect x="188" y="123" width="22" height="22" fill="url(#diagHatch)" stroke="#0f172a" strokeWidth="1.2" />

        {/* Dimension labels for corner a */}
        <text x="60" y="27" fontSize="11" fontStyle="italic" fill="#0f172a" textAnchor="middle">a</text>
        <text x="40" y="48" fontSize="11" fontStyle="italic" fill="#0f172a" textAnchor="middle">a</text>
        <text x="219" y="48" fontSize="11" fontStyle="italic" fill="#0f172a" textAnchor="middle">a</text>
        <text x="40" y="137" fontSize="11" fontStyle="italic" fill="#0f172a" textAnchor="middle">a</text>
        <text x="219" y="137" fontSize="11" fontStyle="italic" fill="#0f172a" textAnchor="middle">a</text>
        <text x="60" y="155" fontSize="11" fontStyle="italic" fill="#0f172a" textAnchor="middle">a</text>
        <text x="200" y="155" fontSize="11" fontStyle="italic" fill="#0f172a" textAnchor="middle">a</text>

        {/* Vertical dimension: 5 dm with arrow */}
        <line x1="32" y1="35" x2="32" y2="145" stroke="#0f172a" strokeWidth="1" markerStart="url(#arrStart)" markerEnd="url(#arrEnd)" />
        <text x="25" y="94" fontSize="11" fontStyle="italic" fill="#0f172a" textAnchor="middle">5 dm</text>

        {/* Horizontal dimension: 8 dm with arrow */}
        <line x1="50" y1="162" x2="210" y2="162" stroke="#0f172a" strokeWidth="1" markerStart="url(#arrStart)" markerEnd="url(#arrEnd)" />
        <text x="130" y="176" fontSize="11" fontStyle="italic" fill="#0f172a" textAnchor="middle">8 dm</text>

        {/* --- Bottom Drawing: 3D Folded Open Box --- */}
        <g transform="translate(65, 215)">
          {/* Front face */}
          <polygon points="0,35 95,35 95,65 0,65" fill="#ffffff" stroke="#0f172a" strokeWidth="1.5" />
          {/* Right face */}
          <polygon points="95,35 130,10 130,40 95,65" fill="#f8fafc" stroke="#0f172a" strokeWidth="1.5" />
          {/* Back top edge */}
          <line x1="35" y1="10" x2="130" y2="10" stroke="#0f172a" strokeWidth="1.5" />
          {/* Left top edge */}
          <line x1="0" y1="35" x2="35" y2="10" stroke="#0f172a" strokeWidth="1.5" />
          {/* Hidden back-left vertical line (dashed) */}
          <line x1="35" y1="10" x2="35" y2="40" stroke="#64748b" strokeWidth="1.2" strokeDasharray="3 3" />
          {/* Hidden bottom edges (dashed) */}
          <line x1="0" y1="65" x2="35" y2="40" stroke="#64748b" strokeWidth="1.2" strokeDasharray="3 3" />
          <line x1="35" y1="40" x2="130" y2="40" stroke="#64748b" strokeWidth="1.2" strokeDasharray="3 3" />
        </g>
      </svg>
    </SvgIllustrationWrapper>
  );
}

// 2. Sơ đồ máy sưởi (Thermal Circuit)
export function HeaterCircuitSvg({ onDelete }: { onDelete?: () => void }) {
  return (
    <SvgIllustrationWrapper title="so_do_may_suoi" onDelete={onDelete}>
      <svg width="280" height="180" viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="20" width="240" height="140" rx="6" stroke="#334155" strokeWidth="1.8" fill="#ffffff" />
        <text x="140" y="42" fontSize="12" fontWeight="bold" fill="#0f172a" textAnchor="middle">SƠ ĐỒ NGUYÊN LÝ MÁY SƯỞI</text>

        {/* Power AC source */}
        <circle cx="55" cy="100" r="16" stroke="#0f172a" strokeWidth="1.5" fill="#f1f5f9" />
        <path d="M 47 100 Q 51 93 55 100 Q 59 107 63 100" stroke="#0f172a" strokeWidth="1.5" fill="none" />
        <text x="55" y="130" fontSize="10" fill="#475569" textAnchor="middle">220V ~</text>

        {/* Circuit lines */}
        <line x1="55" y1="84" x2="55" y2="65" stroke="#0f172a" strokeWidth="1.5" />
        <line x1="55" y1="65" x2="105" y2="65" stroke="#0f172a" strokeWidth="1.5" />

        {/* Switch K */}
        <circle cx="105" cy="65" r="2.5" fill="#0f172a" />
        <line x1="105" y1="65" x2="128" y2="52" stroke="#dc2626" strokeWidth="2" />
        <circle cx="132" cy="65" r="2.5" fill="#0f172a" />
        <text x="118" y="48" fontSize="11" fontWeight="bold" fill="#dc2626">K</text>

        <line x1="132" y1="65" x2="170" y2="65" stroke="#0f172a" strokeWidth="1.5" />

        {/* Heating Resistor R */}
        <rect x="170" y="55" width="55" height="20" stroke="#0f172a" strokeWidth="1.5" fill="#fef3c7" />
        <path d="M 175 65 L 180 58 L 190 72 L 200 58 L 210 72 L 215 65" stroke="#d97706" strokeWidth="1.5" fill="none" />
        <text x="197" y="50" fontSize="11" fontStyle="italic" fontWeight="bold" fill="#0f172a" textAnchor="middle">R (Mayso)</text>

        {/* Return lines */}
        <line x1="225" y1="65" x2="235" y2="65" stroke="#0f172a" strokeWidth="1.5" />
        <line x1="235" y1="65" x2="235" y2="135" stroke="#0f172a" strokeWidth="1.5" />
        <line x1="235" y1="135" x2="55" y2="135" stroke="#0f172a" strokeWidth="1.5" />
        <line x1="55" y1="135" x2="55" y2="116" stroke="#0f172a" strokeWidth="1.5" />
      </svg>
    </SvgIllustrationWrapper>
  );
}

// 3. Biển cảnh báo phóng xạ (Radiation Hazard Warning Sign)
export function RadiationHazardSvg({ onDelete }: { onDelete?: () => void }) {
  return (
    <SvgIllustrationWrapper title="bien_canh_bao_phong_xa" onDelete={onDelete}>
      <svg width="200" height="190" viewBox="0 0 200 190" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Equilateral warning triangle */}
        <polygon points="100,15 188,168 12,168" fill="#facc15" stroke="#0f172a" strokeWidth="7" strokeLinejoin="round" />
        <polygon points="100,28 176,160 24,160" fill="#facc15" stroke="#0f172a" strokeWidth="2" strokeLinejoin="round" />

        {/* Trefoil symbol in center */}
        <g transform="translate(100, 114)">
          {/* Center black circle */}
          <circle cx="0" cy="0" r="10" fill="#0f172a" />
          {/* 3 Blades */}
          <path d="M 0 -13 A 38 38 0 0 1 29 -25 L 17 -11 A 20 20 0 0 0 0 -13 Z" fill="#0f172a" />
          <path d="M 0 -13 A 38 38 0 0 0 -29 -25 L -17 -11 A 20 20 0 0 1 0 -13 Z" fill="#0f172a" />
          <path d="M 12 6 A 38 38 0 0 1 37 13 L 20 8 A 20 20 0 0 0 12 6 Z" fill="#0f172a" />
          <path d="M 12 6 A 38 38 0 0 1 -7 38 L -4 20 A 20 20 0 0 0 12 6 Z" fill="#0f172a" />
          <path d="M -12 6 A 38 38 0 0 0 -37 13 L -20 8 A 20 20 0 0 1 -12 6 Z" fill="#0f172a" />
          <path d="M -12 6 A 38 38 0 0 0 7 38 L 4 20 A 20 20 0 0 1 -12 6 Z" fill="#0f172a" />
        </g>
        <text x="100" y="184" fontSize="10" fontWeight="bold" fill="#0f172a" textAnchor="middle" letterSpacing="0.5">
          NGUY HIỂM PHÓNG XẠ
        </text>
      </svg>
    </SvgIllustrationWrapper>
  );
}

// 4. Bảng biến thiên (Math Variation Table)
export function VariationTableSvg({ onDelete }: { onDelete?: () => void }) {
  return (
    <SvgIllustrationWrapper title="bang_bien_thien" onDelete={onDelete}>
      <svg width="340" height="150" viewBox="0 0 340 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="font-serif">
        {/* Outer border & Grid lines */}
        <rect x="10" y="10" width="320" height="130" stroke="#0f172a" strokeWidth="1.5" fill="#ffffff" />
        <line x1="55" y1="10" x2="55" y2="140" stroke="#0f172a" strokeWidth="1.2" />
        <line x1="10" y1="42" x2="330" y2="42" stroke="#0f172a" strokeWidth="1.2" />
        <line x1="10" y1="74" x2="330" y2="74" stroke="#0f172a" strokeWidth="1.2" />

        {/* Row 1: x */}
        <text x="32" y="30" fontSize="13" fontStyle="italic" fontWeight="bold" fill="#0f172a" textAnchor="middle">x</text>
        <text x="75" y="30" fontSize="12" fill="#0f172a" textAnchor="middle">-∞</text>
        <text x="140" y="30" fontSize="12" fill="#0f172a" textAnchor="middle">-1</text>
        <text x="230" y="30" fontSize="12" fill="#0f172a" textAnchor="middle">2</text>
        <text x="305" y="30" fontSize="12" fill="#0f172a" textAnchor="middle">+∞</text>

        {/* Row 2: y' */}
        <text x="32" y="62" fontSize="13" fontStyle="italic" fontWeight="bold" fill="#0f172a" textAnchor="middle">y'</text>
        <text x="105" y="62" fontSize="14" fontWeight="bold" fill="#2563eb" textAnchor="middle">+</text>
        <text x="140" y="62" fontSize="13" fill="#0f172a" textAnchor="middle">0</text>
        <text x="185" y="62" fontSize="14" fontWeight="bold" fill="#dc2626" textAnchor="middle">-</text>
        <text x="230" y="62" fontSize="13" fill="#0f172a" textAnchor="middle">0</text>
        <text x="270" y="62" fontSize="14" fontWeight="bold" fill="#2563eb" textAnchor="middle">+</text>

        {/* Row 3: y (variation arrows) */}
        <text x="32" y="112" fontSize="13" fontStyle="italic" fontWeight="bold" fill="#0f172a" textAnchor="middle">y</text>

        <text x="75" y="132" fontSize="11" fill="#64748b" textAnchor="middle">-∞</text>
        {/* Arrow up to local maximum */}
        <line x1="85" y1="126" x2="130" y2="88" stroke="#0f172a" strokeWidth="1.4" markerEnd="url(#arrEnd)" />
        <text x="140" y="86" fontSize="13" fontWeight="bold" fill="#0f172a" textAnchor="middle">5</text>

        {/* Arrow down to local minimum */}
        <line x1="150" y1="90" x2="220" y2="128" stroke="#0f172a" strokeWidth="1.4" markerEnd="url(#arrEnd)" />
        <text x="230" y="134" fontSize="13" fontWeight="bold" fill="#0f172a" textAnchor="middle">-2</text>

        {/* Arrow up to +infinity */}
        <line x1="240" y1="126" x2="295" y2="88" stroke="#0f172a" strokeWidth="1.4" markerEnd="url(#arrEnd)" />
        <text x="305" y="86" fontSize="11" fill="#64748b" textAnchor="middle">+∞</text>
      </svg>
    </SvgIllustrationWrapper>
  );
}

// 5. Đồ thị hàm số (Coordinate Axis & Function Graph)
export function FunctionGraphSvg({ onDelete }: { onDelete?: () => void }) {
  return (
    <SvgIllustrationWrapper title="do_thi_ham_so" onDelete={onDelete}>
      <svg width="280" height="230" viewBox="0 0 280 230" fill="none" xmlns="http://www.w3.org/2000/svg" className="font-serif">
        {/* Axes Oxy */}
        {/* x-axis */}
        <line x1="20" y1="130" x2="260" y2="130" stroke="#0f172a" strokeWidth="1.5" markerEnd="url(#arrEnd)" />
        <text x="255" y="145" fontSize="13" fontStyle="italic" fontWeight="bold" fill="#0f172a">x</text>

        {/* y-axis */}
        <line x1="140" y1="210" x2="140" y2="20" stroke="#0f172a" strokeWidth="1.5" markerEnd="url(#arrEnd)" />
        <text x="125" y="28" fontSize="13" fontStyle="italic" fontWeight="bold" fill="#0f172a">y</text>

        {/* Origin O */}
        <text x="128" y="145" fontSize="12" fontStyle="italic" fill="#0f172a">O</text>

        {/* Ticks & coordinates */}
        <line x1="180" y1="127" x2="180" y2="133" stroke="#0f172a" strokeWidth="1" />
        <text x="180" y="145" fontSize="11" fill="#0f172a" textAnchor="middle">1</text>

        <line x1="100" y1="127" x2="100" y2="133" stroke="#0f172a" strokeWidth="1" />
        <text x="100" y="145" fontSize="11" fill="#0f172a" textAnchor="middle">-1</text>

        <line x1="137" y1="80" x2="143" y2="80" stroke="#0f172a" strokeWidth="1" />
        <text x="130" y="84" fontSize="11" fill="#0f172a" textAnchor="end">3</text>

        {/* Dashed lines for vertex */}
        <line x1="140" y1="80" x2="180" y2="80" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="180" y1="80" x2="180" y2="130" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" />

        {/* Parabola Curve: y = - (x - 1)^2 + 3 */}
        <path
          d="M 60 200 Q 140 30 180 80 T 250 205"
          stroke="#2563eb"
          strokeWidth="2.2"
          fill="none"
        />

        {/* Label */}
        <text x="215" y="65" fontSize="11" fontStyle="italic" fill="#2563eb">y = f(x)</text>
      </svg>
    </SvgIllustrationWrapper>
  );
}

// 6. Biểu đồ thống kê (Statistics Bar Chart)
export function StatisticsChartSvg({ onDelete }: { onDelete?: () => void }) {
  return (
    <SvgIllustrationWrapper title="bieu_do_thong_ke" onDelete={onDelete}>
      <svg width="300" height="190" viewBox="0 0 300 190" fill="none" xmlns="http://www.w3.org/2000/svg">
        <text x="150" y="22" fontSize="12" fontWeight="bold" fill="#0f172a" textAnchor="middle">BIỂU ĐỒ TẦN SỐ ĐIỂM SỐ</text>

        {/* Axes */}
        <line x1="45" y1="150" x2="280" y2="150" stroke="#334155" strokeWidth="1.5" />
        <line x1="45" y1="150" x2="45" y2="35" stroke="#334155" strokeWidth="1.5" />

        {/* Grid lines & Y values */}
        <text x="38" y="153" fontSize="10" fill="#64748b" textAnchor="end">0</text>
        <line x1="45" y1="115" x2="280" y2="115" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
        <text x="38" y="118" fontSize="10" fill="#64748b" textAnchor="end">10</text>
        <line x1="45" y1="80" x2="280" y2="80" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
        <text x="38" y="83" fontSize="10" fill="#64748b" textAnchor="end">20</text>
        <line x1="45" y1="45" x2="280" y2="45" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
        <text x="38" y="48" fontSize="10" fill="#64748b" textAnchor="end">30</text>

        {/* Bars */}
        {/* Bar 1 */}
        <rect x="65" y="105" width="32" height="45" fill="#3b82f6" rx="2" />
        <text x="81" y="98" fontSize="10" fontWeight="bold" fill="#1d4ed8" textAnchor="middle">12</text>
        <text x="81" y="167" fontSize="10" fill="#334155" textAnchor="middle">Điểm 6</text>

        {/* Bar 2 */}
        <rect x="115" y="65" width="32" height="85" fill="#3b82f6" rx="2" />
        <text x="131" y="58" fontSize="10" fontWeight="bold" fill="#1d4ed8" textAnchor="middle">24</text>
        <text x="131" y="167" fontSize="10" fill="#334155" textAnchor="middle">Điểm 7</text>

        {/* Bar 3 */}
        <rect x="165" y="50" width="32" height="100" fill="#3b82f6" rx="2" />
        <text x="181" y="43" fontSize="10" fontWeight="bold" fill="#1d4ed8" textAnchor="middle">28</text>
        <text x="181" y="167" fontSize="10" fill="#334155" textAnchor="middle">Điểm 8</text>

        {/* Bar 4 */}
        <rect x="215" y="90" width="32" height="60" fill="#3b82f6" rx="2" />
        <text x="231" y="83" fontSize="10" fontWeight="bold" fill="#1d4ed8" textAnchor="middle">16</text>
        <text x="231" y="167" fontSize="10" fill="#334155" textAnchor="middle">Điểm 9</text>
      </svg>
    </SvgIllustrationWrapper>
  );
}

// 7. Hình học phẳng (Geometry Triangle with Altitude)
export function GeometryDiagramSvg({ onDelete }: { onDelete?: () => void }) {
  return (
    <SvgIllustrationWrapper title="hinh_hoc_tam_giac" onDelete={onDelete}>
      <svg width="260" height="200" viewBox="0 0 260 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="font-serif">
        {/* Right-angled triangle ABC with altitude AH */}
        {/* Main Triangle */}
        <polygon points="50,160 220,160 100,45" fill="#f8fafc" stroke="#0f172a" strokeWidth="1.8" />

        {/* Altitude AH */}
        <line x1="100" y1="45" x2="100" y2="160" stroke="#dc2626" strokeWidth="1.5" strokeDasharray="4 3" />

        {/* Right angle marks at A and H */}
        <rect x="100" y="148" width="12" height="12" fill="none" stroke="#0f172a" strokeWidth="1.2" />

        {/* Vertex Labels */}
        <text x="96" y="35" fontSize="14" fontWeight="bold" fill="#0f172a" textAnchor="middle">A</text>
        <text x="35" y="168" fontSize="14" fontWeight="bold" fill="#0f172a" textAnchor="middle">B</text>
        <text x="235" y="168" fontSize="14" fontWeight="bold" fill="#0f172a" textAnchor="middle">C</text>
        <text x="100" y="178" fontSize="13" fontStyle="italic" fill="#dc2626" textAnchor="middle">H</text>

        {/* Side notations */}
        <text x="65" y="100" fontSize="11" fontStyle="italic" fill="#64748b">c</text>
        <text x="170" y="95" fontSize="11" fontStyle="italic" fill="#64748b">b</text>
        <text x="135" y="180" fontSize="11" fontStyle="italic" fill="#64748b">a</text>
      </svg>
    </SvgIllustrationWrapper>
  );
}
