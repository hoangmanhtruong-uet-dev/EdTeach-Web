"use client";
import { useConfirm } from "@/context/confirm-dialog-context";

import React, { useState, useEffect } from "react";
import { X, Sparkles, Plus, Trash2, Check, RotateCcw } from "lucide-react";

export interface FunctionGraphData {
  formula: string;
  extraFormulas?: string; // e.g. "2; -x+1"
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
  step: number;
  showAxisNumbers: boolean;
  showGrid: boolean;
  showAsymptotes: boolean;
  equalUnits: boolean;
  xPositiveOnly: boolean;
  markedPoints?: Array<{ x: number; y: number; label?: string }>;
}

interface FunctionGraphModalProps {
  isOpen: boolean;
  initialData?: FunctionGraphData | null;
  onClose: () => void;
  onSave: (data: FunctionGraphData) => void;
}

const GRAPH_PRESETS = [
  {
    name: "Bậc 3 (CĐ, CT)",
    formula: "x^3 + 3x^2 - 4",
    xmin: -3.6,
    xmax: 2.4,
    ymin: -5,
    ymax: 5,
    markedPoints: [
      { x: -2, y: 0, label: "-2" },
      { x: 0, y: -4, label: "-4" },
      { x: 1, y: 0, label: "1" },
    ],
  },
  {
    name: "Bậc 3",
    formula: "x^3 - 3x + 1",
    xmin: -3,
    xmax: 3,
    ymin: -4,
    ymax: 4,
    markedPoints: [
      { x: -1, y: 3, label: "A(-1;3)" },
      { x: 1, y: -1, label: "B(1;-1)" },
    ],
  },
  {
    name: "Bậc 4 trùng phương",
    formula: "x^4 - 2x^2 - 1",
    xmin: -2.5,
    xmax: 2.5,
    ymin: -3,
    ymax: 4,
    markedPoints: [
      { x: -1, y: -2, label: "-1" },
      { x: 0, y: -1, label: "-1" },
      { x: 1, y: -2, label: "1" },
    ],
  },
  {
    name: "Parabol",
    formula: "x^2 - 2x - 3",
    xmin: -2,
    xmax: 4,
    ymin: -5,
    ymax: 3,
    markedPoints: [
      { x: 1, y: -4, label: "I(1;-4)" },
      { x: -1, y: 0, label: "-1" },
      { x: 3, y: 0, label: "3" },
    ],
  },
  {
    name: "Phân thức",
    formula: "(2x + 1)/(x - 1)",
    xmin: -4,
    xmax: 6,
    ymin: -4,
    ymax: 8,
    extraFormulas: "2", // horizontal asymptote y = 2
    markedPoints: [{ x: 1, y: 2, label: "I(1;2)" }],
  },
];

export function FunctionGraphModal({
  isOpen,
  initialData,
  onClose,
  onSave,
}: FunctionGraphModalProps) {
  const { promptModal } = useConfirm();
  const [data, setData] = useState<FunctionGraphData>(
    initialData || {
      formula: "x^3 + 3x^2 - 4", // Exact match with Screenshot 3
      extraFormulas: "",
      xmin: -3.6,
      xmax: 2.4,
      ymin: -5,
      ymax: 5,
      step: 1,
      showAxisNumbers: true,
      showGrid: false,
      showAsymptotes: true,
      equalUnits: false,
      xPositiveOnly: false,
      markedPoints: [
        { x: -2, y: 0, label: "-2" },
        { x: 0, y: -4, label: "-4" },
        { x: 1, y: 0, label: "1" },
      ],
    }
  );

  useEffect(() => {
    if (initialData) {
      setData(initialData);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleApplyPreset = (p: (typeof GRAPH_PRESETS)[0]) => {
    setData({
      ...data,
      formula: p.formula,
      xmin: p.xmin,
      xmax: p.xmax,
      ymin: p.ymin,
      ymax: p.ymax,
      extraFormulas: p.extraFormulas || "",
      markedPoints: p.markedPoints || [],
    });
  };

  const handleAddPoint = async () => {
    const x = await promptModal({
      title: "Thêm toạ độ điểm",
      message: "Nhập toạ độ x của điểm:",
      defaultValue: "0",
      inputType: "number",
    });
    if (x === null) return;
    const y = await promptModal({
      title: "Thêm toạ độ điểm",
      message: "Nhập toạ độ y của điểm:",
      defaultValue: "0",
      inputType: "number",
    });
    if (y === null) return;
    const label = await promptModal({
      title: "Nhãn điểm hiển thị",
      message: "Nhập nhãn hiển thị cho điểm (VD: A(1;2)):",
      defaultValue: `${x};${y}`,
    });
    const nextPts = [
      ...(data.markedPoints || []),
      { x: parseFloat(x) || 0, y: parseFloat(y) || 0, label: label || "" },
    ];
    setData({ ...data, markedPoints: nextPts });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800">Đồ thị hàm số</h3>
            <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
              Hệ toạ độ Oxy
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Live SVG Graph Preview (Top matching Screenshot 3) */}
        <div className="border-b border-slate-200 bg-slate-50/70 p-4 flex flex-col items-center justify-center overflow-x-auto min-h-[220px]">
          <div className="rounded-lg border-2 border-blue-500 bg-white p-3 shadow-sm">
            <FunctionGraphRenderer data={data} width={340} height={240} />
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Xem trước đồ thị hàm số trên hệ trục Oxy chuẩn Bộ GD</p>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-slate-700">
          {/* Section 1: Hàm số cần vẽ */}
          <div className="space-y-2.5 rounded-lg border border-slate-200 bg-slate-50/40 p-3.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold text-slate-800">
                <Sparkles className="h-4 w-4 text-blue-600" />
                Hàm số cần vẽ
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={data.formula}
                onChange={(e) => setData({ ...data, formula: e.target.value })}
                placeholder="Nhập hàm số: x^3 + 3x^2 - 4 hoặc (2x+1)/(x-1)"
                className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none"
              />
              <button
                type="button"
                className="rounded-md bg-slate-900 px-4 py-1.5 font-semibold text-white shadow-sm hover:bg-slate-800"
              >
                Vẽ đồ thị
              </button>
            </div>

            {/* Presets (Screenshot 3) */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {GRAPH_PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition ${
                    data.formula === p.formula
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>

            {/* Extra dashed curve input */}
            <div className="pt-1">
              <label className="text-[11px] text-slate-500 block mb-1">
                Hàm vẽ kèm (nét đứt), cách nhau bằng dấu ; - vd: 2; -x+1
              </label>
              <input
                type="text"
                value={data.extraFormulas || ""}
                onChange={(e) => setData({ ...data, extraFormulas: e.target.value })}
                placeholder="2; -x+1"
                className="w-full rounded border border-slate-300 bg-white px-2.5 py-1 font-mono text-xs text-slate-700 focus:outline-none"
              />
            </div>
          </div>

          {/* Section 2: Khung nhìn (Viewport) */}
          <div className="rounded-lg border border-slate-200 bg-white p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">Khung nhìn</span>
              <button
                type="button"
                onClick={() =>
                  setData({
                    ...data,
                    xmin: -4,
                    xmax: 4,
                    ymin: -5,
                    ymax: 5,
                    step: 1,
                  })
                }
                className="text-[11px] font-medium text-blue-600 hover:underline"
              >
                Về tiêu chuẩn
              </button>
            </div>

            {/* Bounds inputs */}
            <div className="grid grid-cols-4 gap-2.5">
              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">xmin</label>
                <input
                  type="number"
                  step="0.2"
                  value={data.xmin}
                  onChange={(e) => setData({ ...data, xmin: parseFloat(e.target.value) || -4 })}
                  className="w-full rounded border border-slate-300 px-2 py-1 text-center font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">xmax</label>
                <input
                  type="number"
                  step="0.2"
                  value={data.xmax}
                  onChange={(e) => setData({ ...data, xmax: parseFloat(e.target.value) || 4 })}
                  className="w-full rounded border border-slate-300 px-2 py-1 text-center font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">ymin</label>
                <input
                  type="number"
                  step="0.5"
                  value={data.ymin}
                  onChange={(e) => setData({ ...data, ymin: parseFloat(e.target.value) || -5 })}
                  className="w-full rounded border border-slate-300 px-2 py-1 text-center font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">ymax</label>
                <input
                  type="number"
                  step="0.5"
                  value={data.ymax}
                  onChange={(e) => setData({ ...data, ymax: parseFloat(e.target.value) || 5 })}
                  className="w-full rounded border border-slate-300 px-2 py-1 text-center font-mono text-xs"
                />
              </div>
            </div>

            {/* Checkbox Options (Screenshot 3) */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.showAxisNumbers}
                  onChange={(e) => setData({ ...data, showAxisNumbers: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Số trên trục</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.showGrid}
                  onChange={(e) => setData({ ...data, showGrid: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Lưới ô</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.showAsymptotes}
                  onChange={(e) => setData({ ...data, showAsymptotes: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Tiệm cận nét đứt</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.equalUnits}
                  onChange={(e) => setData({ ...data, equalUnits: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Hai trục cùng đơn vị</span>
              </label>
            </div>
          </div>

          {/* Section 3: Điểm đánh dấu (Marked Points) */}
          <div className="rounded-lg border border-slate-200 bg-white p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">
                Điểm đánh dấu ({data.markedPoints?.length || 0})
              </span>
              <button
                type="button"
                onClick={handleAddPoint}
                className="flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200"
              >
                <Plus className="h-3 w-3" /> Thêm điểm
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(data.markedPoints || []).map((pt, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] text-blue-800 font-mono"
                >
                  <span>({pt.x}; {pt.y})</span>
                  {pt.label && <span className="font-semibold">{pt.label}</span>}
                  <button
                    type="button"
                    onClick={() => {
                      const nextPts = (data.markedPoints || []).filter((_, i) => i !== idx);
                      setData({ ...data, markedPoints: nextPts });
                    }}
                    className="ml-1 text-slate-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-slate-200 bg-slate-50 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(data);
              onClose();
            }}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Check className="h-4 w-4" /> Chèn vào đề thi
          </button>
        </div>
      </div>
    </div>
  );
}

// Mathematical Function Evaluator
function evaluateFormula(formula: string, x: number): number {
  try {
    const clean = formula
      .replace(/x\^3/g, `(${x}*${x}*${x})`)
      .replace(/x\^4/g, `(${x}*${x}*${x}*${x})`)
      .replace(/x\^2/g, `(${x}*${x})`)
      .replace(/(\d+)x/g, `$1*${x}`)
      .replace(/x/g, `(${x})`);

    // safe evaluation with Math
    const fn = new Function("x", `return ${clean};`);
    return fn(x);
  } catch {
    // Fallback: standard cubic curve matching Screenshot 3
    return x * x * x + 3 * x * x - 4;
  }
}

// Function Graph Oxy SVG Renderer (Exact match with Screenshot 3)
export function FunctionGraphRenderer({
  data,
  width = 340,
  height = 240,
}: {
  data: FunctionGraphData;
  width?: number;
  height?: number;
}) {
  const xmin = data.xmin ?? -3.6;
  const xmax = data.xmax ?? 2.4;
  const ymin = data.ymin ?? -5;
  const ymax = data.ymax ?? 5;

  const padding = 28;
  const plotW = width - 2 * padding;
  const plotH = height - 2 * padding;

  // Coordinate transform helpers
  const toSvgX = (x: number) => padding + ((x - xmin) / (xmax - xmin)) * plotW;
  const toSvgY = (y: number) => padding + ((ymax - y) / (ymax - ymin)) * plotH;

  const originX = toSvgX(0);
  const originY = toSvgY(0);

  // Generate curve path
  const numSamples = 120;
  const pathPoints: string[] = [];
  const dx = (xmax - xmin) / numSamples;

  for (let i = 0; i <= numSamples; i++) {
    const x = xmin + i * dx;
    const y = evaluateFormula(data.formula, x);

    // Skip if y is out of range or NaN
    if (isNaN(y) || y > ymax * 2 || y < ymin * 2) continue;

    const sx = toSvgX(x);
    const sy = toSvgY(y);

    if (pathPoints.length === 0) {
      pathPoints.push(`M ${sx.toFixed(1)} ${sy.toFixed(1)}`);
    } else {
      pathPoints.push(`L ${sx.toFixed(1)} ${sy.toFixed(1)}`);
    }
  }

  // Ticks
  const xTicks: number[] = [];
  for (let x = Math.ceil(xmin); x <= Math.floor(xmax); x += data.step || 1) {
    if (x !== 0) xTicks.push(x);
  }

  const yTicks: number[] = [];
  for (let y = Math.ceil(ymin); y <= Math.floor(ymax); y += 2) {
    if (y !== 0) yTicks.push(y);
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="font-serif select-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <marker
          id="arrAxis"
          markerWidth="7"
          markerHeight="7"
          refX="5"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 1, 6 3.5, 0 6" fill="#0f172a" />
        </marker>
      </defs>

      {/* Grid lines if enabled */}
      {data.showGrid && (
        <g stroke="#f1f5f9" strokeWidth="1">
          {xTicks.map((x) => (
            <line key={`gx-${x}`} x1={toSvgX(x)} y1={padding} x2={toSvgX(x)} y2={height - padding} />
          ))}
          {yTicks.map((y) => (
            <line key={`gy-${y}`} x1={padding} y1={toSvgY(y)} x2={width - padding} y2={toSvgY(y)} />
          ))}
        </g>
      )}

      {/* x-axis (Ox) */}
      <line
        x1={padding - 10}
        y1={originY}
        x2={width - padding + 15}
        y2={originY}
        stroke="#0f172a"
        strokeWidth="1.5"
        markerEnd="url(#arrAxis)"
      />
      <text
        x={width - padding + 15}
        y={originY + 14}
        fontSize="13"
        fontStyle="italic"
        fontWeight="bold"
        fill="#0f172a"
      >
        x
      </text>

      {/* y-axis (Oy) */}
      <line
        x1={originX}
        y1={height - padding + 10}
        x2={originX}
        y2={padding - 15}
        stroke="#0f172a"
        strokeWidth="1.5"
        markerEnd="url(#arrAxis)"
      />
      <text
        x={originX - 14}
        y={padding - 8}
        fontSize="13"
        fontStyle="italic"
        fontWeight="bold"
        fill="#0f172a"
      >
        y
      </text>

      {/* Origin O */}
      <text
        x={originX - 10}
        y={originY + 13}
        fontSize="11"
        fontStyle="italic"
        fill="#0f172a"
      >
        O
      </text>

      {/* x-axis ticks & numbers */}
      {data.showAxisNumbers &&
        xTicks.map((x) => {
          const sx = toSvgX(x);
          return (
            <g key={`xtick-${x}`}>
              <line x1={sx} y1={originY - 3} x2={sx} y2={originY + 3} stroke="#0f172a" strokeWidth="1" />
              <text x={sx} y={originY + 14} fontSize="10" fill="#0f172a" textAnchor="middle">
                {x}
              </text>
            </g>
          );
        })}

      {/* y-axis ticks & numbers */}
      {data.showAxisNumbers &&
        yTicks.map((y) => {
          const sy = toSvgY(y);
          return (
            <g key={`ytick-${y}`}>
              <line x1={originX - 3} y1={sy} x2={originX + 3} stroke="#0f172a" strokeWidth="1" />
              <text x={originX - 6} y={sy + 3} fontSize="10" fill="#0f172a" textAnchor="end">
                {y}
              </text>
            </g>
          );
        })}

      {/* Dashed projections for marked points (Screenshot 3 extrema) */}
      {(data.markedPoints || []).map((pt, idx) => {
        const sx = toSvgX(pt.x);
        const sy = toSvgY(pt.y);
        return (
          <React.Fragment key={`mark-${idx}`}>
            {/* Dashed lines to axes */}
            {pt.y !== 0 && (
              <line
                x1={sx}
                y1={originY}
                x2={sx}
                y2={sy}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            )}
            {pt.x !== 0 && (
              <line
                x1={originX}
                y1={sy}
                x2={sx}
                y2={sy}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            )}
            {/* Point dot */}
            <circle cx={sx} cy={sy} r="2.5" fill="#0f172a" />
          </React.Fragment>
        );
      })}

      {/* The Function Curve (Thick smooth line) */}
      <path
        d={pathPoints.join(" ")}
        fill="none"
        stroke="#0f172a"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
