"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FlaskConical,
  Search,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Home,
  ExternalLink,
  Layers,
  BookOpen,
} from "lucide-react";
import {
  LABS,
  SUBJECT_LABEL,
  SUBJECT_COLOR,
  labCoverUrl,
  type LabSubject,
  type LabLesson,
} from "@/data/labs";

export default function StudentLabsPage() {
  const [selectedSubject, setSelectedSubject] = useState<"all" | LabSubject>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const subjects: LabSubject[] = ["phys", "chem", "bio", "geo"];

  const filteredLabs = LABS.filter((lab) => {
    if (selectedSubject !== "all" && lab.subject !== selectedSubject) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = lab.titleVi.toLowerCase().includes(q);
      const matchGdpt = (lab.gdpt || "").toLowerCase().includes(q);
      const matchQuestion = (lab.questionVi || "").toLowerCase().includes(q);
      return matchTitle || matchGdpt || matchQuestion;
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Nút quay về trang chủ */}
      <div className="flex items-center justify-between">
        <Link
          href="/student"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700/80 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all shadow-2xs group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
          <Home className="h-4 w-4 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
          <span>Quay về trang chủ</span>
        </Link>
        <Link
          href="/"
          className="text-xs font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
        >
          Trang chủ EduTest ➔
        </Link>
      </div>

      {/* 1. HERO BANNER */}
      <div className="bg-linear-to-r from-blue-600 via-indigo-600 to-cyan-600 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-cyan-100 text-xs font-semibold">
              <FlaskConical className="w-3.5 h-3.5 text-cyan-200" />
              <span>Phòng Thí Nghiệm 3D Trực Quan</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              54+ Phòng Thí Nghiệm Ảo GDPT 2025
            </h1>
            <p className="text-sm text-cyan-50 leading-relaxed">
              Tự do thao tác thí nghiệm tương tác 3D Vật lý, Hóa học, Sinh học ngay trên trình duyệt điện thoại hoặc máy tính mà không lo cháy nổ hay thiếu hóa chất.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center gap-4 shrink-0 shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-white/20 text-white flex items-center justify-center shadow-md">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-xs font-bold text-cyan-200 uppercase tracking-wider">
                Kho Mô Phỏng
              </div>
              <div className="text-xl font-black text-white">{LABS.length} Bài Thực Hành</div>
              <div className="text-[11px] text-white/80">
                100% bám sát khung GDPT 2018 - 2025
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. FILTER & SEARCH */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Subject Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setSelectedSubject("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedSubject === "all"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            Tất cả ({LABS.length})
          </button>
          {subjects.map((sub) => {
            const count = LABS.filter((l) => l.subject === sub).length;
            return (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedSubject === sub
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                {SUBJECT_LABEL[sub]} ({count})
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên bài, khái niệm GDPT..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 3. LABS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredLabs.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <FlaskConical className="w-10 h-10 text-slate-400 mx-auto" />
            <div className="text-base font-bold text-slate-900 dark:text-white">
              Không tìm thấy mô phỏng thí nghiệm phù hợp
            </div>
            <p className="text-xs text-slate-500">
              Hãy thử tìm kiếm với từ khóa khác như &quot;quang điện&quot;, &quot;sóng&quot;, &quot;tế bào&quot;...
            </p>
          </div>
        ) : (
          filteredLabs.map((lab) => {
            const cover = labCoverUrl(lab.slug);
            const badgeColor = SUBJECT_COLOR[lab.subject];

            return (
              <div
                key={lab.slug}
                className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <img
                      src={cover}
                      alt={lab.titleVi}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      loading="lazy"
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badgeColor}`}
                      >
                        {SUBJECT_LABEL[lab.subject]}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-2">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition line-clamp-2">
                      {lab.titleVi}
                    </h3>

                    {lab.gdpt && (
                      <div className="text-[11px] text-slate-500 line-clamp-1">
                        📚 {lab.gdpt}
                      </div>
                    )}

                    {lab.questionVi && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 italic line-clamp-2 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg">
                        &quot;{lab.questionVi}&quot;
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 pt-0">
                  <Link
                    href={`/labs/${lab.slug}`}
                    className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-blue-600 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>Mở thí nghiệm 3D</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
