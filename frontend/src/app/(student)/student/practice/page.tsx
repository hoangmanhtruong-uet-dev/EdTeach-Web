"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Zap,
  Sparkles,
  Brain,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  BookOpen,
  Award,
  Layers,
  ChevronRight,
  Loader2,
  Flame,
} from "lucide-react";
import { StudentPracticeItem } from "@/lib/student/student-store";

export default function StudentPracticePage() {
  const [loading, setLoading] = useState(true);
  const [practices, setPractices] = useState<StudentPracticeItem[]>([]);

  useEffect(() => {
    async function loadPractice() {
      try {
        setLoading(true);
        const res = await fetch("/api/student/practice");
        if (res.ok) {
          const data = await res.json();
          if (data.success && (data.practices || data.sheets)) {
            setPractices(data.practices || data.sheets);
          }
        }
      } catch (err) {
        console.error("Failed to load practice sheets:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPractice();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* 1. HERO BANNER */}
      <div className="bg-linear-to-r from-teal-600 via-emerald-600 to-cyan-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-emerald-100 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Cơ Chế Khắc Phục Lỗ Hổng Cá Nhân Hóa</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Luyện Bù Lỗ Hổng Kiến Thức — AI Tutor
            </h1>
            <p className="text-sm text-emerald-50 leading-relaxed">
              Sai sót là cơ hội tốt nhất để tiến bộ. Trợ lý AI sẽ hướng dẫn em giải quyết từng câu sai, nắm vững bản chất và không bao giờ lặp lại lỗi cũ.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center gap-4 shrink-0 shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-linear-to-tr from-amber-400 to-yellow-500 text-white flex items-center justify-center shadow-md">
              <Brain className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-200 uppercase tracking-wider">
                Phương Pháp Sư Phạm
              </div>
              <div className="text-xl font-black text-white">Luyện Bù Mục Tiêu</div>
              <div className="text-[11px] text-white/80">
                100% bám sát ma trận GDPT 2025
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. HOW IT WORKS EXPLAINER */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-teal-600" />
          <span>Quy Trình Luyện Bù 4 Bước Tự Động</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5">
            <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-bold text-xs flex items-center justify-center">
              01
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              Phát Hiện Lỗ Hổng
            </div>
            <div className="text-[11px] text-slate-500">
              Quét câu sai từ bài kiểm tra Thầy Cô giao qua OMR Camera hoặc Online.
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
              02
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              Sinh Câu Hỏi Tương Đương
            </div>
            <div className="text-[11px] text-slate-500">
              AI sinh 3 câu tương đương cùng dạng nhận thức GDPT để em làm lại.
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">
              03
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              Gia Sư AI Chỉ Dẫn
            </div>
            <div className="text-[11px] text-slate-500">
              Lời giải chi tiết từng bước, gợi ý tư duy khi em gặp khó khăn.
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5">
            <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center">
              04
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              Cập Nhật Hồ Sơ Năng Lực
            </div>
            <div className="text-[11px] text-slate-500">
              Điểm số và độ thuần thục trên Radar Chart lập tức tăng lên.
            </div>
          </div>
        </div>
      </div>

      {/* 3. PRACTICE SHEETS LIST */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-600" />
            <span>Phiếu Luyện Bù Cá Nhân Của Bạn</span>
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            {practices.length} phiếu đã tạo
          </span>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-16 space-y-3">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-500">Đang tải phiếu luyện bù...</p>
            </div>
          ) : practices.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Chưa có phiếu luyện bù nào!
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Khi Thầy Cô trả bài kiểm tra hoặc khi em làm bài thi có câu sai, hãy bấm nút &quot;Luyện Bù Câu Sai&quot; trên phiếu báo cáo để AI kích hoạt nhé!
              </p>
              <Link
                href="/student/exams"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition"
              >
                <span>Xem danh sách bài thi</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            practices.map((item) => {
              const isCompleted = item.status === "completed";

              return (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                        {item.subject}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isCompleted
                            ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                            : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        {isCompleted ? "✓ Đã hoàn thành" : "⏳ Đang luyện tập"}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {item.examTitle}
                    </h3>

                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>
                        Tạo ngày:{" "}
                        {new Date(item.enrolledAt).toLocaleDateString("vi-VN")}
                      </span>
                      {item.score !== undefined && item.score !== null && (
                        <>
                          <span>•</span>
                          <span className="font-bold text-teal-600">
                            Điểm: {item.score.toFixed(1)}/10
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Link
                      href={`/practice/${item.sheetToken}`}
                      target="_blank"
                      className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <span>Vào phòng giải bài AI</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
