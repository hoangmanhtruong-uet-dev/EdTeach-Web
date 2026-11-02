"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  Award,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Link as LinkIcon,
  Check,
  ArrowRight,
  Zap,
  Loader2,
  Calendar,
  FileText,
} from "lucide-react";
import { StudentCompetencyProgress } from "@/lib/student/student-store";
import StudentRadarChart from "@/components/student/student-radar-chart";

export default function StudentProgressPage() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<StudentCompetencyProgress | null>(null);

  // Sync / Claim Token Input
  const [claimInput, setClaimInput] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [claimStatus, setClaimStatus] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/student/progress");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.progress) {
          setProgress(data.progress);
        }
      }
    } catch (err) {
      console.error("Failed to fetch progress:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  const handleClaimReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimInput.trim()) return;

    try {
      setClaiming(true);
      setClaimStatus(null);

      // Extract token if user pasted full URL
      let token = claimInput.trim();
      if (token.includes("/report/")) {
        token = token.split("/report/")[1]?.split("?")[0]?.split("#")[0] || token;
      }

      const res = await fetch("/api/student/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setClaimStatus({
          type: "error",
          text: data.error || "Không thể đồng bộ phiếu báo cáo này.",
        });
        return;
      }

      setClaimStatus({
        type: "success",
        text: data.message || "Đồng bộ phiếu báo cáo thành công!",
      });
      setClaimInput("");
      await fetchProgress();
    } catch (err: any) {
      setClaimStatus({
        type: "error",
        text: err.message || "Lỗi kết nối khi đồng bộ báo cáo.",
      });
    } finally {
      setClaiming(false);
    }
  };

  const radar = progress?.radarLevels ?? {
    recognition: 85,
    comprehension: 75,
    application: 60,
    advancedApplication: 45,
  };

  const scoreHistory = progress?.scoreHistory ?? [];
  const strengths = progress?.strengths ?? [];
  const weaknesses = progress?.weaknesses ?? [];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* 1. HERO HEADER */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-linear-to-bl from-indigo-500/10 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-700 dark:text-indigo-300">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>Chuẩn Khảo Thí Bộ GD&ĐT 2025</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Hồ Sơ Năng Lực & Ma Trận Nhận Thức
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Phân tích độ thuần thục qua 4 cấp độ tư duy khoa học, tự động tính toán từ các bài kiểm tra OMR camera và bài tập trực tuyến.
            </p>
          </div>

          {/* Sync Report Form */}
          <div className="w-full lg:w-auto bg-slate-50 dark:bg-slate-800/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shrink-0">
            <form onSubmit={handleClaimReport} className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-indigo-600" />
                <span>Đồng Bộ Báo Cáo Từ Zalo / Link:</span>
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Dán link hoặc mã báo cáo..."
                  value={claimInput}
                  onChange={(e) => setClaimInput(e.target.value)}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44 sm:w-56"
                />
                <button
                  type="submit"
                  disabled={claiming || !claimInput.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {claiming ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Đồng bộ</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

              {claimStatus && (
                <div
                  className={`text-xs font-semibold p-2 rounded-lg flex items-center gap-1.5 ${
                    claimStatus.type === "success"
                      ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200"
                      : "bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200"
                  }`}
                >
                  {claimStatus.type === "success" ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5" />
                  )}
                  <span>{claimStatus.text}</span>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* 2. RADAR & COMPETENCY LEVEL BARS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar SVG Visualizer & A11y Data Table */}
        <StudentRadarChart
          radarLevels={radar}
          claimedReportsCount={progress?.claimedReportsCount || 1}
        />

        {/* Competency Level Detail Cards */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Chi Tiết Mức Độ Thuần Thục GDPT 2025
          </h2>

          <div className="space-y-4">
            {/* Level 1 */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Cấp độ 1: Nhận biết (Recognition)
                  </span>
                </div>
                <span className="text-xs font-black text-emerald-600">
                  {radar.recognition}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${radar.recognition}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Ghi nhớ khái niệm, công thức, định lý cơ bản. Nền tảng vững chắc.
              </p>
            </div>

            {/* Level 2 */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Cấp độ 2: Thông hiểu (Comprehension)
                  </span>
                </div>
                <span className="text-xs font-black text-blue-600">
                  {radar.comprehension}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${radar.comprehension}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Giải thích bản chất, suy luận trực tiếp từ giả thiết đề bài.
              </p>
            </div>

            {/* Level 3 */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Cấp độ 3: Vận dụng (Application)
                  </span>
                </div>
                <span className="text-xs font-black text-indigo-600">
                  {radar.application}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                  style={{ width: `${radar.application}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Giải quyết bài toán kết hợp nhiều kiến thức trong cùng chương.
              </p>
            </div>

            {/* Level 4 */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Cấp độ 4: Vận dụng cao (Advanced Application)
                  </span>
                </div>
                <span className="text-xs font-black text-purple-600">
                  {radar.advancedApplication}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-purple-500 transition-all duration-500"
                  style={{ width: `${radar.advancedApplication}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Các câu phân loại thí sinh, mô hình bài toán thực tế, liên môn.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. STRENGTHS & WEAKNESSES + SCORE TIMELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strengths & AI Remediation Recommendations */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>Chủ Đề Thế Mạnh</span>
            </h3>

            <div className="flex flex-wrap gap-2">
              {strengths.length > 0 ? (
                strengths.map((str, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-300"
                  >
                    ✓ {str}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500">
                  Đang phân tích thêm bài làm của bạn.
                </span>
              )}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-500" />
                <span>Lỗ Hổng Cần Khắc Phục</span>
              </h3>
              <Link
                href="/student/practice"
                className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
              >
                <span>Luyện bù ngay</span>
                <Zap className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {weaknesses.length > 0 ? (
                weaknesses.map((weak, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/60 flex items-center justify-between gap-3"
                  >
                    <span className="text-xs font-semibold text-rose-800 dark:text-rose-200">
                      • {weak}
                    </span>
                    <Link
                      href="/student/practice"
                      className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition shrink-0"
                    >
                      Khắc phục
                    </Link>
                  </div>
                ))
              ) : (
                <span className="text-xs text-slate-500">
                  Không phát hiện lỗ hổng lớn nào!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Score History Timeline */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span>Lịch Sử Điểm Số Tăng Tiến</span>
            </h3>
            <span className="text-xs text-slate-500">
              {scoreHistory.length} bài gần nhất
            </span>
          </div>

          <div className="space-y-3">
            {scoreHistory.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Chưa có dữ liệu bài kiểm tra nào được ghi nhận.
              </div>
            ) : (
              scoreHistory.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{item.date}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-base font-black ${
                        item.score >= 8.0
                          ? "text-emerald-600"
                          : item.score >= 6.5
                          ? "text-blue-600"
                          : "text-amber-600"
                      }`}
                    >
                      {item.score.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-slate-500"> / 10</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
