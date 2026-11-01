"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Flame,
  FileText,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Clock,
  ArrowRight,
  Sparkles,
  Zap,
  FlaskConical,
  Award,
  BookOpen,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import {
  StudentDashboardStats,
  StudentExamItem,
} from "@/lib/student/student-store";

export default function StudentDashboardPage() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StudentDashboardStats | null>(null);

  const studentName =
    profile?.name ||
    profile?.full_name ||
    user?.email?.split("@")[0] ||
    "Học Sinh";

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const res = await fetch("/api/student/dashboard");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.stats) {
            setStats(data.stats);
          }
        }
      } catch (err) {
        console.error("Failed to load student dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const streak = stats?.streakDays ?? 5;
  const completedCount = stats?.completedExamsCount ?? 0;
  const pendingCount = stats?.pendingExamsCount ?? 0;
  const avgScore = stats?.averageScore ?? 0;
  const weakCount = stats?.weakTopicsCount ?? 0;
  const recentExams = stats?.recentExams ?? [];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* 1. WELCOME HERO BANNER */}
      <div className="relative rounded-3xl bg-linear-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white p-6 sm:p-8 shadow-xl overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-emerald-400/20 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-emerald-100 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Cổng Học Tập Cá Nhân Hóa GDPT 2025</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Xin chào, {studentName}! 👋
            </h1>
            <p className="text-sm text-emerald-50 leading-relaxed">
              Mỗi bài tập hôm nay là một bước tiến gần hơn tới ước mơ. Hãy hoàn thành các thử thách và củng cố lỗ hổng kiến thức nhé!
            </p>
          </div>

          {/* Streak Flame Badge */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center gap-4 shrink-0 shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-linear-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/30">
              <Flame className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-200 uppercase tracking-wider">
                Chuỗi Học Tập (Streak)
              </div>
              <div className="text-2xl font-black text-white">
                {streak} Ngày Liên Tiếp
              </div>
              <div className="text-[11px] text-white/80">
                Tuyệt vời, giữ vững phong độ! 🔥
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Completed Exams */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Bài Thi Đã Nộp
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {completedCount}
            </span>
            <span className="text-xs text-slate-500">bài khảo sát</span>
          </div>
        </div>

        {/* Card 2: Pending Exams */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Cần Làm Ngay
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {pendingCount}
            </span>
            <span className="text-xs text-amber-600 font-semibold">bài chờ nộp</span>
          </div>
        </div>

        {/* Card 3: Average Score */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Điểm Trung Bình
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {avgScore.toFixed(1)}
            </span>
            <span className="text-xs text-slate-500">/ 10.0</span>
          </div>
        </div>

        {/* Card 4: Weak Topics */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Cần Khắc Phục
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {weakCount}
            </span>
            <span className="text-xs text-rose-600 font-semibold">chủ đề</span>
          </div>
        </div>
      </div>

      {/* 3. QUICK ACTIONS SHORTCUTS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Shortcut 1: Vào phòng thi */}
        <Link
          href="/student/exams"
          className="group p-5 rounded-2xl bg-linear-to-br from-indigo-500 to-indigo-700 text-white shadow-lg shadow-indigo-500/20 flex items-center justify-between hover:scale-[1.01] transition"
        >
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase text-indigo-200 tracking-wider">
              Phòng Thi Trực Tuyến
            </div>
            <div className="text-lg font-black">Nhập Mã Thi / Làm Bài</div>
            <div className="text-xs text-indigo-100">
              Kiểm tra đề thầy cô giao & bấm nộp
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/20 group-hover:bg-white/30 flex items-center justify-center transition">
            <ArrowRight className="w-5 h-5 text-white" />
          </div>
        </Link>

        {/* Shortcut 2: Luyện bù AI */}
        <Link
          href="/student/practice"
          className="group p-5 rounded-2xl bg-linear-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/20 flex items-center justify-between hover:scale-[1.01] transition"
        >
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase text-emerald-200 tracking-wider">
              AI Trợ Lý Cá Nhân
            </div>
            <div className="text-lg font-black">Luyện Bù Lỗ Hổng</div>
            <div className="text-xs text-emerald-100">
              Khắc phục câu sai với lời giải AI
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/20 group-hover:bg-white/30 flex items-center justify-center transition">
            <Zap className="w-5 h-5 text-white" />
          </div>
        </Link>

        {/* Shortcut 3: 3D Virtual Labs */}
        <Link
          href="/student/labs"
          className="group p-5 rounded-2xl bg-linear-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-blue-500/20 flex items-center justify-between hover:scale-[1.01] transition"
        >
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase text-cyan-200 tracking-wider">
              54+ Mô Phỏng Tương Tác
            </div>
            <div className="text-lg font-black">Phòng Thí Nghiệm 3D</div>
            <div className="text-xs text-cyan-100">
              Thực hành Lý, Hóa, Sinh trực quan
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/20 group-hover:bg-white/30 flex items-center justify-center transition">
            <FlaskConical className="w-5 h-5 text-white" />
          </div>
        </Link>
      </div>

      {/* 4. RECENT EXAMS & ACTIVITIES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Recent Exams */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Bài Kiểm Tra Gần Đây
              </h2>
            </div>
            <Link
              href="/student/exams"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentExams.length === 0 ? (
              <div className="text-center py-10 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                  <FileText className="w-6 h-6" />
                </div>
                <p className="text-sm text-slate-500">
                  Bạn chưa có bài thi nào được giao gần đây.
                </p>
                <Link
                  href="/student/exams"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition"
                >
                  <span>Nhập mã bài thi để tham gia</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              recentExams.map((exam) => (
                <div
                  key={exam.id}
                  className="p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        {exam.subject}
                      </span>
                      {exam.teacherName && (
                        <span className="text-xs text-slate-500 truncate">
                          • {exam.teacherName}
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {exam.examTitle}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-3">
                      <span>Thời lượng: {exam.durationMinutes || 45} phút</span>
                      <span>•</span>
                      <span>
                        {new Date(exam.assignedAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {exam.status === "completed" ? (
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs text-slate-500">Điểm số</div>
                          <div className="text-base font-black text-emerald-600">
                            {exam.score?.toFixed(1) || "10.0"}/10
                          </div>
                        </div>
                        {exam.reportToken && (
                          <Link
                            href={`/report/${exam.reportToken}`}
                            target="_blank"
                            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 text-xs font-bold transition flex items-center gap-1.5"
                          >
                            <span>Xem báo cáo</span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                          </Link>
                        )}
                      </div>
                    ) : (
                      <Link
                        href="/student/exams"
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                      >
                        <span>Làm bài</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column (1 col): GDPT Progress Sneak Peek */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Năng Lực GDPT 2025
                </h2>
              </div>
              <Link
                href="/student/progress"
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
              >
                Chi tiết
              </Link>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Hệ thống theo dõi độ thuần thục 4 cấp độ tư duy theo chuẩn Bộ Giáo Dục:
            </p>

            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Nhận biết</span>
                  <span className="text-emerald-600 font-bold">85%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: "85%" }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Thông hiểu</span>
                  <span className="text-blue-600 font-bold">75%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: "75%" }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Vận dụng</span>
                  <span className="text-indigo-600 font-bold">60%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-500"
                    style={{ width: "60%" }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Vận dụng cao</span>
                  <span className="text-purple-600 font-bold">45%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-purple-500"
                    style={{ width: "45%" }}
                  />
                </div>
              </div>
            </div>
          </div>

          <Link
            href="/student/progress"
            className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs font-bold text-center block transition text-slate-700 dark:text-slate-300"
          >
            Mở Biểu Đồ Radar Đầy Đủ
          </Link>
        </div>
      </div>
    </div>
  );
}
