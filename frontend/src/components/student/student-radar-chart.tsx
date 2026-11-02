"use client";

import React, { useState, useEffect, useId } from "react";
import { BarChart3, Table, Eye, CheckCircle2, AlertCircle } from "lucide-react";

export interface RadarLevels {
  recognition: number;
  comprehension: number;
  application: number;
  advancedApplication: number;
}

export interface StudentRadarChartProps {
  radarLevels: RadarLevels;
  claimedReportsCount?: number;
  title?: string;
  description?: string;
  className?: string;
  defaultView?: "chart" | "table";
}

interface CompetencyLevelMeta {
  key: keyof RadarLevels;
  name: string;
  shortName: string;
  angleDeg: number;
  color: string;
  badgeClass: string;
  description: string;
  benchmark: number;
}

const COMPETENCY_LEVELS: CompetencyLevelMeta[] = [
  {
    key: "recognition",
    name: "Nhận biết (Recognition)",
    shortName: "Nhận biết",
    angleDeg: -90, // Top
    color: "#10b981", // Emerald
    badgeClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    description: "Ghi nhớ định lý, khái niệm, công thức nền tảng",
    benchmark: 80,
  },
  {
    key: "comprehension",
    name: "Thông hiểu (Comprehension)",
    shortName: "Thông hiểu",
    angleDeg: 0, // Right
    color: "#3b82f6", // Blue
    badgeClass: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    description: "Hiểu bản chất, suy luận trực tiếp từ giả thiết đề bài",
    benchmark: 70,
  },
  {
    key: "application",
    name: "Vận dụng (Application)",
    shortName: "Vận dụng",
    angleDeg: 90, // Bottom
    color: "#6366f1", // Indigo
    badgeClass: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
    description: "Kết hợp đa chuyên đề, giải toán liên kết chương",
    benchmark: 60,
  },
  {
    key: "advancedApplication",
    name: "Vận dụng cao (Advanced Application)",
    shortName: "VD Cao",
    angleDeg: 180, // Left
    color: "#a855f7", // Purple
    badgeClass: "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 border-purple-200 dark:border-purple-800",
    description: "Bài toán thực tế, liên môn, câu hỏi phân loại điểm 9-10",
    benchmark: 50,
  },
];

export default function StudentRadarChart({
  radarLevels,
  claimedReportsCount = 1,
  title = "Biểu Đồ Radar 4 Cấp Độ Tư Duy",
  description = "Độ rộng của vùng màu tím phản ánh năng lực toàn diện. Mở rộng vùng Vận dụng & Vận dụng cao sẽ giúp bạn bứt phá điểm 9-10.",
  className = "",
  defaultView = "chart",
}: StudentRadarChartProps) {
  const chartId = useId();
  const titleId = `${chartId}-title`;
  const descId = `${chartId}-desc`;
  const tableId = `${chartId}-table`;

  const [activeView, setActiveView] = useState<"chart" | "table">(defaultView);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Monitor prefers-reduced-motion media query
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    if (mq.addEventListener) {
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    } else {
      mq.addListener(handler);
      return () => mq.removeListener(handler);
    }
  }, []);

  // Center & Geometry
  const cx = 120;
  const cy = 120;
  const maxR = 90;

  const getCoordinates = (value: number, angleDeg: number) => {
    const angleRad = (angleDeg * Math.PI) / 180;
    const clampedVal = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
    const r = (clampedVal / 100) * maxR;
    return {
      x: cx + r * Math.cos(angleRad),
      y: cy + r * Math.sin(angleRad),
    };
  };

  const p1 = getCoordinates(radarLevels.recognition, -90); // Top
  const p2 = getCoordinates(radarLevels.comprehension, 0); // Right
  const p3 = getCoordinates(radarLevels.application, 90); // Bottom
  const p4 = getCoordinates(radarLevels.advancedApplication, 180); // Left
  const polygonPoints = `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`;

  const summaryText = `Mức độ nhận thức: Nhận biết ${radarLevels.recognition}%, Thông hiểu ${radarLevels.comprehension}%, Vận dụng ${radarLevels.application}%, Vận dụng cao ${radarLevels.advancedApplication}%.`;

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between ${className}`}
    >
      {/* 1. Header & Controls */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600 shrink-0" />
          <span>{title}</span>
        </h2>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
            {claimedReportsCount} Phiếu đã tổng hợp
          </span>

          {/* Accessible Toggle Button between Graphical Radar and HTML Data Table */}
          <button
            type="button"
            onClick={() => setActiveView((prev) => (prev === "chart" ? "table" : "chart"))}
            aria-expanded={activeView === "table"}
            aria-controls={tableId}
            aria-label={activeView === "chart" ? "Chuyển sang xem bảng dữ liệu tiếp cận (A11y)" : "Chuyển sang xem biểu đồ radar"}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border border-slate-300 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            {activeView === "chart" ? (
              <>
                <Table className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="hidden sm:inline">Bảng số liệu</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="hidden sm:inline">Biểu đồ</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Permanent Screen-Reader-Only Data Table (WCAG 2.1 AA Compliance) */}
      <div className="sr-only">
        <table>
          <caption>Ma trận 4 cấp độ tư duy nhận thức chuẩn GDPT 2025</caption>
          <thead>
            <tr>
              <th scope="col">Cấp độ tư duy</th>
              <th scope="col">Tỉ lệ đạt</th>
              <th scope="col">Chuẩn tối thiểu</th>
              <th scope="col">Mô tả năng lực</th>
              <th scope="col">Đánh giá</th>
            </tr>
          </thead>
          <tbody>
            {COMPETENCY_LEVELS.map((lvl) => {
              const val = radarLevels[lvl.key];
              const isPassed = val >= lvl.benchmark;
              return (
                <tr key={lvl.key}>
                  <th scope="row">{lvl.name}</th>
                  <td>{val}%</td>
                  <td>{lvl.benchmark}%</td>
                  <td>{lvl.description}</td>
                  <td>{isPassed ? "Đạt chuẩn" : "Cần rèn luyện thêm"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 3. Main Body: Switchable between SVG Radar and Accessible HTML Table */}
      {activeView === "chart" ? (
        <div className="relative py-4 flex flex-col items-center">
          <svg
            width="240"
            height="240"
            viewBox="0 0 240 240"
            className="overflow-visible"
            role="img"
            aria-labelledby={`${titleId} ${descId}`}
          >
            <title id={titleId}>{title}</title>
            <desc id={descId}>{summaryText}</desc>

            {/* Boundary circles */}
            <circle cx={cx} cy={cy} r={maxR} fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="1" />
            <circle cx={cx} cy={cy} r={maxR * 0.75} fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="3 3" strokeWidth="1" />
            <circle cx={cx} cy={cy} r={maxR * 0.5} fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="3 3" strokeWidth="1" />
            <circle cx={cx} cy={cy} r={maxR * 0.25} fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="3 3" strokeWidth="1" />

            {/* Cross Axis Lines */}
            <line x1={cx} y1={cy - maxR} x2={cx} y2={cy + maxR} stroke="currentColor" className="text-slate-300 dark:text-slate-700" strokeWidth="1" />
            <line x1={cx - maxR} y1={cy} x2={cx + maxR} y2={cy} stroke="currentColor" className="text-slate-300 dark:text-slate-700" strokeWidth="1" />

            {/* Data Polygon with motion-reduce awareness */}
            <polygon
              points={polygonPoints}
              fill="rgba(99, 102, 241, 0.25)"
              stroke="#6366f1"
              strokeWidth="2.5"
              className={
                prefersReducedMotion
                  ? ""
                  : "transition-all duration-500 ease-out motion-reduce:transition-none motion-reduce:duration-0"
              }
            />

            {/* Vertices */}
            <circle cx={p1.x} cy={p1.y} r="4.5" className="fill-indigo-600 stroke-white stroke-2" />
            <circle cx={p2.x} cy={p2.y} r="4.5" className="fill-indigo-600 stroke-white stroke-2" />
            <circle cx={p3.x} cy={p3.y} r="4.5" className="fill-indigo-600 stroke-white stroke-2" />
            <circle cx={p4.x} cy={p4.y} r="4.5" className="fill-indigo-600 stroke-white stroke-2" />
          </svg>

          {/* Polar Axis Labels */}
          <div className="w-full relative max-w-[280px] h-0 pointer-events-none">
            <div className="absolute -top-[235px] left-1/2 -translate-x-1/2 text-[11px] font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
              Nhận biết ({radarLevels.recognition}%)
            </div>
            <div className="absolute -top-[125px] right-0 translate-x-3 text-[11px] font-bold text-slate-700 dark:text-slate-300 text-left whitespace-nowrap">
              Thông hiểu ({radarLevels.comprehension}%)
            </div>
            <div className="absolute -top-[15px] left-1/2 -translate-x-1/2 text-[11px] font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
              Vận dụng ({radarLevels.application}%)
            </div>
            <div className="absolute -top-[125px] left-0 -translate-x-3 text-[11px] font-bold text-slate-700 dark:text-slate-300 text-right whitespace-nowrap">
              VD Cao ({radarLevels.advancedApplication}%)
            </div>
          </div>
        </div>
      ) : (
        /* Accessible HTML Data Table View */
        <div id={tableId} className="w-full my-3 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <caption className="text-left font-semibold text-slate-600 dark:text-slate-400 mb-2">
              Bảng dữ liệu chi tiết độ thuần thục 4 cấp độ nhận thức GDPT 2025
            </caption>
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th scope="col" className="py-2 pr-3 font-semibold">Cấp độ tư duy</th>
                <th scope="col" className="py-2 px-3 font-semibold text-right">Tỉ lệ</th>
                <th scope="col" className="py-2 px-3 font-semibold text-right">Chuẩn</th>
                <th scope="col" className="py-2 pl-3 font-semibold">Đánh giá</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {COMPETENCY_LEVELS.map((lvl) => {
                const val = radarLevels[lvl.key];
                const isPassed = val >= lvl.benchmark;
                return (
                  <tr key={lvl.key} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <th scope="row" className="py-2.5 pr-3 font-medium text-slate-900 dark:text-white">
                      <div>{lvl.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{lvl.description}</div>
                    </th>
                    <td className="py-2.5 px-3 text-right font-black" style={{ color: lvl.color }}>
                      {val}%
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500">
                      {lvl.benchmark}%
                    </td>
                    <td className="py-2.5 pl-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isPassed
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                        }`}
                      >
                        {isPassed ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Đạt chuẩn</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            <span>Cần rèn luyện</span>
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. Footer Explanation Note */}
      <p className="text-xs text-slate-500 dark:text-slate-400 text-center max-w-sm mx-auto mt-4">
        {description}
      </p>
    </div>
  );
}
