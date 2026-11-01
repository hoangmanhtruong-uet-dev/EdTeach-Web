"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  StudentReportData,
  QuestionDetailItem,
  CompetencyLevel,
} from "@/lib/reports/student-report-store";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Zap,
  Loader2,
  Trophy,
  Target,
  Award,
  Calendar,
  User,
  GraduationCap,
  ShieldCheck,
  Share2,
  Printer,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Brain,
  HeartHandshake,
  BookOpen,
} from "lucide-react";
import { PedagogicalViralFooter } from "@/components/public/pedagogical-viral-footer";

interface ReportViewProps {
  report: StudentReportData;
}

export function ReportView({ report }: ReportViewProps) {
  const [filter, setFilter] = useState<"all" | "correct" | "incorrect">("all");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [openingRemediation, setOpeningRemediation] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimMsg, setClaimMsg] = useState<string | null>(null);

  const handleClaimReport = async () => {
    if (claiming || claimed) return;
    try {
      setClaiming(true);
      setClaimMsg(null);

      if (typeof window !== "undefined") {
        localStorage.setItem("edutest_pending_claim_report", report.token);
      }

      const res = await fetch("/api/student/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: report.token,
          studentId: report.studentId,
        }),
      });

      const data = await res.json();
      setClaimed(true);
      if (res.ok && data.success) {
        setClaimMsg("Đã lưu thành công vào Hồ sơ Cổng Học Sinh!");
      } else {
        setClaimMsg("Đã lưu tạm trên thiết bị! Đăng nhập để đồng bộ vĩnh viễn.");
      }
    } catch {
      setClaimed(true);
      setClaimMsg("Đã lưu tạm vào trình duyệt!");
    } finally {
      setClaiming(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyZaloMessage = () => {
    const text =
      `Kính gửi Quý Phụ huynh em ${report.studentName}${report.className ? ` (Lớp ${report.className})` : ""}:\n\n` +
      `Thầy/Cô xin gửi phiếu báo cáo kết quả bài kiểm tra "${report.sessionName}" (Môn ${report.subject}):\n` +
      `📊 Điểm số: ${report.score}/10 | Xếp hạng: #${report.rank}/${report.totalStudents} học sinh\n` +
      `🎯 Tỉ lệ đúng: ${report.correctCount}/${report.questionCount} câu (${report.accuracyPercent}%)\n\n` +
      `👉 Xem chi tiết ma trận năng lực GDPT & nhận xét tại: ${typeof window !== "undefined" ? window.location.href : ""}\n\n` +
      `Thầy/Cô chúc em luôn giữ vững phong độ và tiến bộ mỗi ngày!`;

    navigator.clipboard.writeText(text);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2500);
  };

  const handleOpenRemediation = async () => {
    if (openingRemediation) return;
    setOpeningRemediation(true);

    try {
      const wrongList = report.details
        .filter((d) => !d.isCorrect)
        .map((d) => ({
          questionNumber: d.questionNumber,
          cognitiveLevel: d.cognitiveLabel || "Thông hiểu",
          studentAnswer: d.studentAnswer,
          correctAnswer: d.correctAnswer,
        }));

      if (wrongList.length === 0) {
        alert("Tuyệt vời! Em đã làm đúng 100% bài thi, không có câu nào cần luyện bù.");
        setOpeningRemediation(false);
        return;
      }

      const res = await fetch("/api/remediation/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: report.sessionId,
          reportToken: report.token,
          studentId: report.studentId,
          studentName: report.studentName,
          studentCode: report.studentCode,
          className: report.className,
          subject: report.subject,
          grade: report.grade,
          examTitle: report.sessionName,
          wrongQuestions: wrongList,
        }),
      });

      if (!res.ok) {
        throw new Error("Không thể tạo bài luyện bù.");
      }

      const data = await res.json();
      if (data.practiceUrl) {
        window.open(data.practiceUrl, "_blank");
      }
    } catch (e: any) {
      alert("Đã xảy ra lỗi khi mở bài luyện bù: " + e.message);
    } finally {
      setOpeningRemediation(false);
    }
  };

  const filteredDetails = report.details.filter((item) => {
    if (filter === "correct") return item.isCorrect;
    if (filter === "incorrect") return !item.isCorrect;
    return true;
  });

  const getScoreClassification = (score: number) => {
    if (score >= 9.0) return { label: "Xuất sắc", color: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800" };
    if (score >= 8.0) return { label: "Giỏi", color: "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-800" };
    if (score >= 6.5) return { label: "Khá", color: "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800" };
    if (score >= 5.0) return { label: "Trung bình", color: "text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/50 border-orange-300 dark:border-orange-800" };
    return { label: "Cần cố gắng", color: "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800" };
  };

  const classification = getScoreClassification(report.score);
  const competencyList: CompetencyLevel[] = Object.values(report.competencies || {}) as CompetencyLevel[];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-slate-950 text-neutral-900 dark:text-slate-100 font-sans antialiased pb-16 selection:bg-blue-500 selection:text-white">
      {/* 1. STICKY TOP BRANDING BAR */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-neutral-200 dark:border-slate-800 px-4 py-3 print:hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-sm shrink-0">
              E
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-neutral-900 dark:text-white">
                  EduTest AI
                </span>
                <span className="text-[10px] uppercase font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
                  Tutor OS
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-slate-400 truncate">
                Phiếu Báo Cáo Kết Quả Học Tập Số
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-neutral-700 dark:text-slate-200 hover:bg-neutral-100 dark:hover:bg-slate-700 text-xs font-semibold transition cursor-pointer shadow-2xs"
              title="Sao chép đường dẫn báo cáo"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-bold">Đã sao chép</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Chia sẻ link</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-neutral-700 dark:text-slate-200 hover:bg-neutral-100 dark:hover:bg-slate-700 text-xs font-semibold transition cursor-pointer shadow-2xs"
              title="In phiếu kết quả học tập"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">In phiếu</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        {/* 2. STUDENT & EXAM HEADER CARD */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-neutral-200 dark:border-slate-800 p-5 md:p-6 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/10 via-indigo-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 relative z-10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-2.5">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>
                  Môn {report.subject} · Lớp {report.grade || report.className || "10"}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                {report.studentName}
              </h1>
              <p className="text-sm font-medium text-neutral-600 dark:text-slate-300 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                {report.studentCode && <span>SBD: <strong>{report.studentCode}</strong></span>}
                {report.className && <span>Lớp: <strong>{report.className}</strong></span>}
                {report.examCode && <span>Mã đề: <strong>{report.examCode}</strong></span>}
              </p>
              <p className="text-xs text-neutral-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                <span>Bài kiểm tra: <strong>{report.sessionName}</strong></span>
              </p>
            </div>

            {/* Teacher verification stamp */}
            <div className="bg-neutral-50 dark:bg-slate-800/80 border border-neutral-200 dark:border-slate-700 rounded-xl p-3 text-xs md:max-w-xs shrink-0">
              <div className="flex items-center gap-1.5 font-bold text-neutral-900 dark:text-white">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{report.teacherName || "Thầy/Cô EduTest"}</span>
                {report.isTeacherVerified && (
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 rounded font-extrabold">
                    ✓ Giáo viên xác thực
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-slate-400 mt-1">
                Phiếu phân tích kết quả điện tử được cấp phát và đồng bộ tự động từ hệ thống chấm thi EduTest AI.
              </p>
            </div>
          </div>
        </section>

        {/* 2.5 STUDENT AUTO-CLAIM BANNER */}
        <section className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-200">
                  Cổng Học Sinh EduTest
                </span>
                {claimed && (
                  <span className="text-[10px] bg-white text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                    ✓ Đã đồng bộ
                  </span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-black text-white">
                Lưu Báo Cáo Này Vào Hồ Sơ Năng Lực Của Em
              </h3>
              <p className="text-xs text-emerald-100 max-w-xl">
                Tự động tích hợp điểm số vào Biểu Đồ Radar 4 Cấp Độ Tư Duy GDPT 2025 và kích hoạt lộ trình học tập cá nhân.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            {claimed ? (
              <Link
                href="/student/progress"
                className="px-4 py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <span>Xem Hồ Sơ Năng Lực</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleClaimReport}
                disabled={claiming}
                className="px-5 py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {claiming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>Lưu vào Hồ sơ Học sinh</span>
                  </>
                )}
              </button>
            )}
          </div>
        </section>

        {/* 3. HERO SCORECARD & KEY METRICS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Main Score Box */}
          <div className="sm:col-span-2 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase font-extrabold tracking-wider text-blue-100/90">
                  Điểm số tổng kết
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl sm:text-5xl font-black tracking-tight">
                    {report.score.toFixed(1)}
                  </span>
                  <span className="text-blue-200 text-lg font-semibold">/ 10</span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide bg-white/20 backdrop-blur-sm text-white border border-white/30">
                {classification.label}
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs text-blue-100">
              <span>Tỉ lệ chính xác bài làm:</span>
              <strong className="text-sm text-white font-bold">
                {report.accuracyPercent}% ({report.correctCount}/{report.questionCount} câu)
              </strong>
            </div>
          </div>

          {/* Rank in Class Box */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-neutral-200 dark:border-slate-800 p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-neutral-500 dark:text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Xếp hạng</span>
              <Trophy className="w-4 h-4 text-amber-500" />
            </div>
            <div className="my-2">
              <div className="text-3xl font-black text-neutral-900 dark:text-white">
                #{report.rank}
              </div>
              <p className="text-xs text-neutral-500 dark:text-slate-400 mt-0.5">
                Trên tổng số {report.totalStudents} học sinh
              </p>
            </div>
            <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>
                Top {Math.max(1, Math.round((report.rank / Math.max(1, report.totalStudents)) * 100))}% học sinh cao điểm
              </span>
            </div>
          </div>

          {/* Breakdown Stats Box */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-neutral-200 dark:border-slate-800 p-5 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-neutral-500 dark:text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Chi tiết câu</span>
              <Target className="w-4 h-4 text-blue-500" />
            </div>
            <div className="space-y-1.5 my-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đúng:
                </span>
                <span className="font-bold text-neutral-900 dark:text-white">{report.correctCount} câu</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-rose-600 font-semibold">
                  <XCircle className="w-3.5 h-3.5" /> Sai:
                </span>
                <span className="font-bold text-neutral-900 dark:text-white">{report.incorrectCount} câu</span>
              </div>
              {report.emptyCount > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-neutral-500 font-semibold">
                    <HelpCircle className="w-3.5 h-3.5" /> Chưa điền:
                  </span>
                  <span className="font-bold text-neutral-900 dark:text-white">{report.emptyCount} câu</span>
                </div>
              )}
            </div>
            <div className="text-[11px] text-neutral-500 dark:text-slate-400">
              Tổng số câu: {report.questionCount} câu hỏi
            </div>
          </div>
        </section>

        {/* 4. GDPT 2018 4-LEVEL COMPETENCY RADAR / BARS */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-neutral-200 dark:border-slate-800 p-5 md:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-base font-bold text-neutral-900 dark:text-white tracking-tight">
                  Ma Trận Năng Lực 4 Cấp Độ (Chuẩn GDPT 2018)
                </h2>
              </div>
              <p className="text-xs text-neutral-500 dark:text-slate-400 mt-1">
                Phân tích độ vững kiến thức của học sinh từ tư duy nhận biết căn bản đến vận dụng giải quyết bài toán khó.
              </p>
            </div>
            <span className="self-start sm:self-center text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
              Bộ GD&ĐT
            </span>
          </div>

          <div className="space-y-4">
            {competencyList.map((comp) => {
              const pct = comp.percentage || 0;
              return (
                <div key={comp.level} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: comp.color }}
                      />
                      <span className="font-bold text-neutral-800 dark:text-slate-200">
                        {comp.label}
                      </span>
                      <span className="text-neutral-500 dark:text-slate-400 text-[11px]">
                        ({comp.correct}/{comp.total} câu)
                      </span>
                    </div>
                    <span className="font-extrabold text-neutral-900 dark:text-white">
                      {pct}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2.5 bg-neutral-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: comp.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 pt-4 border-t border-neutral-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-neutral-500 dark:text-slate-400">
            <div>
              <strong className="text-emerald-600 block">1. Nhận biết:</strong>
              Nhớ công thức, định nghĩa cơ bản.
            </div>
            <div>
              <strong className="text-blue-600 block">2. Thông hiểu:</strong>
              Hiểu bản chất và giải bài tập mẫu.
            </div>
            <div>
              <strong className="text-amber-600 block">3. Vận dụng:</strong>
              Giải bài toán kết hợp nhiều bước.
            </div>
            <div>
              <strong className="text-purple-600 block">4. Vận dụng cao:</strong>
              Tư duy phân hóa và giải bài toán mới.
            </div>
          </div>
        </section>

        {/* 5. AI PEDAGOGICAL INSIGHT CARD (NHẬN XÉT SƯ PHẠM) */}
        <section className="bg-gradient-to-br from-indigo-50/70 via-white to-amber-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 p-5 md:p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                Nhận Xét Sư Phạm Toàn Diện Từ AI Tutor OS
              </h2>
              <p className="text-[11px] text-neutral-500 dark:text-slate-400">
                Được cá nhân hóa dựa trên ma trận câu hỏi và phương thức tư duy làm bài của học sinh
              </p>
            </div>
          </div>

          {/* Overview text */}
          <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-indigo-100 dark:border-slate-700 text-xs sm:text-sm text-neutral-800 dark:text-slate-200 leading-relaxed font-medium">
            {report.aiComment.overview}
          </div>

          {/* Strengths & Weaknesses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-4">
            {/* Strengths */}
            <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Điểm sáng nổi bật:</span>
              </div>
              <ul className="space-y-1.5 text-xs text-emerald-950 dark:text-emerald-200">
                {report.aiComment.strengths.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 mb-2">
                <Target className="w-4 h-4 text-amber-600" />
                <span>Nội dung cần củng cố & lưu ý:</span>
              </div>
              <ul className="space-y-1.5 text-xs text-amber-950 dark:text-amber-200">
                {report.aiComment.weaknesses.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Parental Advice */}
          <div className="mt-3.5 p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-start gap-3">
            <HeartHandshake className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-blue-900 dark:text-blue-300">
                Lời khuyên dành cho Quý Phụ huynh:
              </p>
              <p className="text-xs text-blue-950 dark:text-blue-200 mt-1 leading-relaxed">
                {report.aiComment.parentAdvice}
              </p>
            </div>
          </div>

          {/* Teacher custom note if present */}
          {report.teacherNote && (
            <div className="mt-3.5 p-3.5 rounded-xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60">
              <p className="text-xs font-bold text-purple-900 dark:text-purple-300">
                Lời dặn riêng từ Thầy/Cô {report.teacherName || ""}:
              </p>
              <p className="text-xs text-purple-950 dark:text-purple-200 mt-1 italic leading-relaxed">
                "{report.teacherNote}"
              </p>
            </div>
          )}
        </section>

        {/* 5.5. AI REMEDIATION SECTION (SPRINT 2) */}
        <section className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white rounded-2xl p-5 md:p-6 shadow-md relative overflow-hidden print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-amber-100 text-[11px] font-black uppercase tracking-wider mb-2 border border-white/20">
                <Zap className="w-3.5 h-3.5" />
                <span>Bước 5: Vòng lặp Sư phạm Khép kín</span>
              </div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                Bài Tập Luyện Bù Lỗ Hổng Kiến Thức Cho Con
              </h3>
              <p className="text-xs text-amber-100 mt-1 max-w-lg leading-relaxed">
                Hệ thống AI tự động phân tích {report.incorrectCount + report.emptyCount} câu con làm sai để sinh đề tương tự với số liệu số đẹp, giúp con củng cố lại bài học và tự chấm điểm ngay tại nhà.
              </p>
            </div>

            <button
              type="button"
              disabled={openingRemediation}
              onClick={handleOpenRemediation}
              className="px-5 py-3 rounded-xl bg-white text-neutral-900 hover:bg-neutral-100 font-black text-xs sm:text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2 shrink-0 self-start sm:self-center disabled:opacity-50"
            >
              {openingRemediation ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                  <span>AI đang sinh đề...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-600 fill-amber-600" />
                  <span>Cho con mở bài luyện bù online</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* 6. QUESTION-BY-QUESTION BREAKDOWN WITH INTERACTIVE FILTERS */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-neutral-200 dark:border-slate-800 p-5 md:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                Bảng Chi Tiết Từng Câu Hỏi
              </h2>
              <p className="text-xs text-neutral-500 dark:text-slate-400 mt-0.5">
                Đối chiếu đáp án học sinh đã chọn với đáp án chuẩn của bài thi
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="inline-flex rounded-xl bg-neutral-100 dark:bg-slate-800 p-1 text-xs font-bold self-start sm:self-center">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  filter === "all"
                    ? "bg-white dark:bg-slate-700 text-neutral-900 dark:text-white shadow-2xs"
                    : "text-neutral-500 hover:text-neutral-800 dark:text-slate-400"
                }`}
              >
                Tất cả ({report.questionCount})
              </button>
              <button
                onClick={() => setFilter("correct")}
                className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  filter === "correct"
                    ? "bg-emerald-500 text-white shadow-2xs"
                    : "text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-700"
                }`}
              >
                Đúng ({report.correctCount})
              </button>
              <button
                onClick={() => setFilter("incorrect")}
                className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  filter === "incorrect"
                    ? "bg-rose-500 text-white shadow-2xs"
                    : "text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-700"
                }`}
              >
                Sai ({report.incorrectCount + report.emptyCount})
              </button>
            </div>
          </div>

          {/* Grid of Question Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
            {filteredDetails.map((item) => {
              const isCorrect = item.isCorrect;
              const isEmpty = item.isEmpty;

              let cardBg = "border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200";
              if (isEmpty) {
                cardBg = "border-neutral-200 bg-neutral-50 dark:bg-slate-800/60 text-neutral-600 dark:text-slate-400";
              } else if (!isCorrect) {
                cardBg = "border-rose-200 bg-rose-50/60 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200";
              }

              return (
                <div
                  key={item.questionNumber}
                  className={`p-2.5 rounded-xl border flex flex-col justify-between transition ${cardBg}`}
                >
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <span>Câu {item.questionNumber}</span>
                    {isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : isEmpty ? (
                      <HelpCircle className="w-4 h-4 text-neutral-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] opacity-75">Chọn:</span>
                    <strong className="text-sm font-black">
                      {item.studentAnswer || "-"}
                    </strong>
                  </div>

                  {!isCorrect && (
                    <div className="flex items-center justify-between text-[11px] pt-1 mt-1 border-t border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300">
                      <span>Đúng:</span>
                      <strong className="font-bold">{item.correctAnswer}</strong>
                    </div>
                  )}

                  <div className="mt-1 pt-1 text-[9px] text-right font-medium opacity-60">
                    {item.cognitiveLabel}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 7. QUICK ACTION FOOTER (ZALO CONNECT & SHARING) */}
        <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-5 md:p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <div>
            <h3 className="text-base font-extrabold tracking-tight">
              Gửi tin nhắn hoặc trao đổi với Thầy/Cô qua Zalo
            </h3>
            <p className="text-xs text-blue-100 mt-1 max-w-lg">
              Phụ huynh có thể sao chép bản tin nhắn tóm tắt kết quả hoặc mở ứng dụng Zalo để trực tiếp trao đổi kế hoạch học tập cùng Thầy/Cô.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleCopyZaloMessage}
              className="px-4 py-2.5 rounded-xl bg-white text-blue-900 hover:bg-blue-50 text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              {copiedMessage ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Đã copy tin nhắn Zalo</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-blue-600" />
                  <span>Copy tin nhắn gửi Zalo</span>
                </>
              )}
            </button>

            <a
              href="https://zalo.me"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-blue-700/80 hover:bg-blue-800 text-white text-xs font-bold shadow-xs transition inline-flex items-center gap-1.5 border border-white/20"
            >
              <span>Mở Zalo Web</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </section>

        {/* 8. PEDAGOGICAL VIRAL FOOTER */}
        <PedagogicalViralFooter
          teacherName={report.teacherName || "Thầy Cô Sư Phạm"}
          teacherSchool={report.teacherSchool}
          teacherSubject={report.subject}
          isVerified={report.isTeacherVerified ?? true}
          referralCode={report.teacherReferralCode || "EDUTEST2026"}
        />

        {/* 9. FOOTER STAMP */}
        <footer className="text-center text-xs text-neutral-400 dark:text-slate-500 py-6 space-y-1">
          <p className="font-semibold text-neutral-500 dark:text-slate-400">
            Hệ thống Báo cáo Khảo thí & Chăm sóc Phụ huynh số 1 Việt Nam — EduTest AI Tutor OS
          </p>
          <p className="text-[11px]">
            Phiếu số: #{report.token} · Đồng bộ tự động theo thời gian thực
          </p>
        </footer>
      </main>
    </div>
  );
}
