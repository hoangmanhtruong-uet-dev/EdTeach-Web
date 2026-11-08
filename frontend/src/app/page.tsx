"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  FileText,
  ArrowRight,
  Check,
  Crown,
  Presentation,
  FlaskConical,
  Wand2,
  Layers,
  Flame,
  Calculator,
  MessageSquare,
  FileCheck2,
  CheckCircle2,
  Columns2,
  ScanLine,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default function LandingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "semester">("monthly");



  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-[#070b14] text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar />

      <main className="flex-1">
        {/* ================= 1. HERO SECTION ================= */}
        <section className="relative overflow-hidden pt-12 pb-20 sm:pt-16 sm:pb-28">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-50/70 via-slate-50/40 to-white dark:from-blue-950/20 dark:via-slate-950/50 dark:to-[#070b14]" />
          
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl space-y-6">
              {/* Beta v1.0.0 Notice Pill with link to v2.0.0 updates */}
              <Link
                href="/updates"
                className="group inline-flex items-center gap-2.5 rounded-full bg-slate-900 px-4 py-1.5 text-xs text-white shadow-md shadow-slate-900/15 border border-slate-700/80 transition-all hover:bg-slate-950 hover:border-blue-400 hover:scale-[1.02]"
              >
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-950">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-900 animate-pulse" />
                  PHIÊN BẢN MỚI
                </span>
                <span className="font-semibold text-slate-100">
                  EduTest • Nền tảng Bục Giảng Số 4.0 & Tạo đề thi chuẩn GDPT
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 font-bold text-amber-300 group-hover:text-amber-200 transition-colors">
                  <span>Xem Lộ Trình v2.0</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>

              {/* Main Heading */}
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl leading-[1.15]">
                Hệ sinh thái Bục Giảng Số &
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Soạn Đề AI Chuẩn GDPT 2025
                </span>
              </h1>

              {/* Subtitle */}
              <p className="mx-auto max-w-2xl text-base text-slate-700 dark:text-slate-300 sm:text-lg leading-relaxed font-normal">
                Không chỉ là soạn đề tự động — <strong>EdTeach</strong> biến màn hình lớp học thành <strong>Bục Giảng Số 4.0</strong> với Chế độ Split-Screen, Kính vẽ trong suốt đè lên 54+ Phòng TN 3D, Đẻ câu luyện tập 2 phút tại chỗ và Chữa nóng câu sai từ chấm thi OMR.
              </p>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex h-12 items-center gap-2.5 rounded-xl bg-blue-600 px-7 text-sm font-bold text-white shadow-md shadow-blue-500/25 transition-all hover:bg-blue-700 hover:scale-[1.02]"
                >
                  <span>Dùng thử 14 ngày miễn phí</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="#features"
                  className="inline-flex h-12 items-center gap-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 text-sm font-bold text-slate-800 dark:text-slate-200 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 shadow-xs"
                >
                  <Presentation className="h-4 w-4 text-blue-600" />
                  <span>Khám phá Bục Giảng Số</span>
                </Link>
                <Link
                  href="#pricing"
                  className="inline-flex h-12 items-center gap-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 text-sm font-bold text-slate-800 dark:text-slate-200 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 shadow-xs"
                >
                  <Crown className="h-4 w-4 text-amber-500" />
                  <span>Xem Bảng giá</span>
                </Link>
              </div>

              {/* Trust Badges */}
              <p className="mt-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                ✨ Không cần thẻ tín dụng • Tặng 5.000 credits & Chấm trắc nghiệm OMR 100% miễn phí • Mở khóa toàn quyền trải nghiệm 14 ngày
              </p>
            </div>
          </div>

          {/* ================= BENTO GRID HERO SHOWCASE ================= */}
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-12 sm:mt-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-left">
              
              {/* BENTO CARD 1: BỤC GIẢNG SỐ 4.0 (Split-Screen & Bảng nháp) - Chiếm 7 cột */}
              <div className="lg:col-span-7 rounded-3xl border-2 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 shadow-md hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden relative group">
                <div className="space-y-2 mb-4 relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 rounded-full bg-blue-600 text-white px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                      <Presentation className="w-3 h-3" /> Flagship 4.0
                    </span>
                    <span className="text-xs font-bold text-blue-600">
                      Chế Độ Chiếu Split-Screen Có Thanh Kéo
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight">
                    Bục Giảng Số 4.0 & Bảng Vẽ Nháp Excalidraw
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                    Màn hình lớp học chia đôi hoàn hảo: Bên trái là câu hỏi chuẩn ma trận phông chữ lớn kèm 3 lớp gợi ý mở dần; Bên phải là Bảng nháp Excalidraw lưu nét vẽ từng câu và tính năng Đẻ câu tương tự luyện tập 2 phút.
                  </p>
                </div>

                {/* Live Mockup Box (Classroom Simulator Screen) */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950 text-white p-3.5 sm:p-4 shadow-xl overflow-hidden relative font-sans">
                  {/* Top bar mockup */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 font-bold">
                        BỤC GIẢNG PRO
                      </span>
                      <span className="text-slate-300 font-medium truncate max-w-[180px] sm:max-w-xs">
                        Đề kiểm tra Hóa học 12 – Ôn tập este & lipit
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px]">
                      <span className="rounded bg-blue-600 px-2 py-0.5 font-bold text-white">50:50</span>
                      <span className="rounded bg-slate-800 text-slate-300 px-1.5 py-0.5 hidden sm:inline">70% Đề</span>
                      <span className="rounded bg-slate-800 text-slate-300 px-1.5 py-0.5 hidden sm:inline">Cỡ A+</span>
                    </div>
                  </div>

                  {/* Split content */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-h-[190px]">
                    {/* Left Question Side */}
                    <div className="rounded-xl bg-slate-900/90 p-3.5 border border-slate-800 flex flex-col justify-between space-y-2">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-black text-blue-400">CÂU 1 / 12</span>
                          <span className="text-[10px] text-amber-300 bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-700/60 font-semibold">
                            ⏱️ 02:00
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-100 leading-snug">
                          Cho 8,8g este X no, đơn chức tác dụng hết với 100ml dung dịch NaOH 1M. Tên gọi của X là?
                        </p>
                      </div>

                      {/* 3 Layer Pills */}
                      <div className="space-y-1 text-[10px]">
                        <div className="flex items-center justify-between px-2 py-1 rounded bg-amber-950/60 border border-amber-700/60 text-amber-300 font-semibold">
                          <span>💡 Lớp 1: Gợi ý phương pháp</span>
                          <span className="text-[9px] underline">Hiện</span>
                        </div>
                        <div className="flex items-center justify-between px-2 py-1 rounded bg-blue-950/60 border border-blue-700/60 text-blue-300 font-semibold">
                          <span>📐 Lớp 2: Công thức cốt lõi</span>
                          <span className="text-[9px] underline">Hiện</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Whiteboard Side */}
                    <div className="rounded-xl bg-white text-slate-900 p-3.5 border border-slate-200 flex flex-col justify-between shadow-xs">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 text-[10px] font-bold text-slate-600">
                        <span>✏️ Bảng Nháp Excalidraw</span>
                        <div className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                          <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                        </div>
                      </div>

                      <div className="py-2 text-center text-xs">
                        <p className="font-mono text-slate-800 not-italic font-bold text-left text-[11px] leading-relaxed">
                          n(NaOH) = 0.1 mol ➔ M(X) = 88 g/mol<br />
                          ➔ C₄H₈O₂ (Etyl axetat)
                        </p>
                      </div>

                      <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-600 font-bold">
                        <span>Đã lưu vào bộ đề</span>
                        <span className="text-blue-600">Kéo co giãn ⇆</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* BENTO RIGHT STACK: 2 CARDS (OMR & LABS 3D) - Chiếm 5 cột */}
              <div className="lg:col-span-5 flex flex-col gap-5">
                
                {/* BENTO CARD 2: CHẤM THI OMR 0.3s */}
                <div className="rounded-3xl border-2 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 shadow-md hover:shadow-lg transition-all flex-1 flex flex-col justify-between group">
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 rounded-full bg-purple-600 text-white px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                        <ScanLine className="w-3 h-3" /> OpenCV 0.3s
                      </span>
                      <span className="text-xs font-bold text-purple-600">
                        Chấm Tự Động Bằng Camera
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-950 dark:text-white tracking-tight">
                      Máy Chấm Thi OMR Không Cần Máy Quét Đắt Tiền
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Chỉ cần giơ phiếu thi trước webcam laptop hoặc điện thoại: Tự động căn góc, nhận diện tô chì theo barem GDPT 2025 và xuất Excel 1 chạm.
                    </p>
                  </div>

                  {/* Mockup Scanner Card */}
                  <div className="rounded-2xl border border-purple-200 dark:border-purple-800/80 bg-purple-50/70 dark:bg-purple-950/40 p-3.5 flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <ScanLine className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          Trần Thị Mai Anh • SBD: 12045
                        </p>
                        <p className="text-[11px] text-purple-700 dark:text-purple-300 font-semibold">
                          Mã đề 102 • 19/20 câu đúng
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-2xl font-black text-purple-700 dark:text-purple-300 tabular-nums">
                        9.5
                      </span>
                      <p className="text-[9px] uppercase font-bold text-emerald-600">Đã chấm</p>
                    </div>
                  </div>
                </div>

                {/* BENTO CARD 3: 54+ PHÒNG THÍ NGHIỆM 3D */}
                <div className="rounded-3xl border-2 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 shadow-md hover:shadow-lg transition-all flex-1 flex flex-col justify-between group">
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 rounded-full bg-emerald-600 text-white px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                        <FlaskConical className="w-3 h-3" /> 54+ Mô Phỏng
                      </span>
                      <span className="text-xs font-bold text-emerald-700">
                        Trực Quan Hóa Bài Học
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-950 dark:text-white tracking-tight">
                      Cả Phòng Thí Nghiệm 3D Ngay Trong Tiết Dạy
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Vật lý, Hóa học, Sinh học, Địa lý bám sát SGK mới. Thầy cô tương tác kéo thả thanh trượt số đo thời gian thực, không còn phải dạy chay.
                    </p>
                  </div>

                  {/* Mockup 3D badges */}
                  <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                    <span className="rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 px-3 py-1 font-bold text-blue-700 dark:text-blue-300 shadow-2xs">
                      ⚡ Đo suất điện động nguồn
                    </span>
                    <span className="rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-3 py-1 font-bold text-emerald-700 dark:text-emerald-300 shadow-2xs">
                      🧬 Vận chuyển qua màng tế bào
                    </span>
                    <span className="rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 px-3 py-1 font-bold text-amber-800 dark:text-amber-300 shadow-2xs">
                      🌍 Địa hình & Dòng biển El Niño
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* ================= 2. FEATURES SECTION (#features) ================= */}
        <section id="features" className="py-20 bg-white dark:bg-[#070b14] border-y border-slate-200/90 dark:border-slate-800 scroll-mt-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-3.5 py-1 text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Tính Năng Vượt Trội Chuẩn GDPT 2025
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                Bộ giải pháp đột phá dành riêng cho Giáo viên Việt Nam
              </h2>
              <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                Giải quyết triệt để nỗi đau chiếu file Word chữ nhỏ, học sinh không hiểu bài vận dụng cao và chấm thi mất hàng giờ mỗi tuần.
              </p>
            </div>

            {/* NHÓM 1: BỤC GIẢNG SỐ 4.0 (GÓI PRO) */}
            <div className="space-y-6">
              <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-3">
                <span className="flex items-center gap-1.5 rounded-lg bg-blue-600 text-white px-3 py-1 text-xs font-black uppercase tracking-wider shadow-xs">
                  <Presentation className="w-4 h-4" /> Bục Giảng Số 4.0
                </span>
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2.5 py-0.5 rounded-md">
                  Đặc quyền Gói PRO
                </span>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white hidden sm:inline">
                  Trình chiếu & Tương tác thời gian thực trên máy chiếu
                </h3>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {/* Feature 1 */}
                <div className="rounded-2xl border-2 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:bg-slate-50/80 dark:hover:bg-slate-800/90 p-6 space-y-3 hover:border-blue-500 hover:shadow-lg transition-all">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                    <Columns2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-950 dark:text-white">
                    Chế độ Chiếu đề Split-Screen (50:50)
                  </h4>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-normal">
                    Màn hình chia đôi chuyên nghiệp: Cột trái chiếu câu hỏi với phông lớn sắc nét cho máy chiếu (hỗ trợ 3 lớp mở dần: <em>Gợi ý ➔ Công thức ➔ Lời giải chi tiết</em>). Cột phải là Bảng nháp Excalidraw tự động lưu nét vẽ riêng cho từng câu hỏi.
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="rounded-2xl border-2 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:bg-slate-50/80 dark:hover:bg-slate-800/90 p-6 space-y-3 hover:border-blue-500 hover:shadow-lg transition-all">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
                    <FlaskConical className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-950 dark:text-white">
                    Kính Vẽ Trong Suốt đè lên Phòng TN 3D
                  </h4>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-normal">
                    Khi mở 54+ mô hình 3D (Vật lý, Hóa học, Sinh học, Địa lý), giáo viên bấm 1 nút để bật lớp kính vẽ trong suốt đè trực tiếp lên thí nghiệm. Thầy/Cô vừa cho con lắc dao động hoặc phản ứng chạy, vừa vẽ vector lực, khoanh kết tủa ngay trên màn hình.
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="rounded-2xl border-2 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:bg-slate-50/80 dark:hover:bg-slate-800/90 p-6 space-y-3 hover:border-blue-500 hover:shadow-lg transition-all">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                    <FileCheck2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-slate-950 dark:text-white">
                    Xuất Bộ Đề Kép Word Giảng Dạy (.docx)
                  </h4>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-normal">
                    Tải về cùng lúc 2 bản Word chuẩn sạch 100% không watermark: <strong>Bản học sinh</strong> (chừa sẵn 3 dòng kẻ chấm dưới mỗi câu cho học sinh ghi chép khi nghe giảng) và <strong>Bản giáo viên</strong> (in kèm đáp án & các bước giải tóm tắt cầm tay).
                  </p>
                </div>
              </div>
            </div>

            {/* NHÓM 2: LUYỆN THI & CHỮA BÀI CHUYÊN SÂU (GÓI MAX VIP) */}
            <div className="space-y-6 pt-6">
              <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-3">
                <span className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 px-3 py-1 text-xs font-black uppercase tracking-wider shadow-xs">
                  <Crown className="w-4 h-4" /> Luyện Thi Chuyên Sâu
                </span>
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2.5 py-0.5 rounded-md">
                  Vũ khí VIP Gói MAX
                </span>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white hidden sm:inline">
                  Công cụ chữa bài vận dụng cao và giải quyết dứt điểm câu sai tại chỗ
                </h3>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {/* Feature 4 */}
                <div className="rounded-2xl border-2 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:bg-slate-50/80 dark:hover:bg-slate-800/90 p-6 space-y-3 hover:border-amber-500 dark:hover:border-amber-500 hover:shadow-lg transition-all">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center justify-center">
                    <Wand2 className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-slate-950 dark:text-white">
                      Đẻ Câu Tương Tự & Timer 2 Phút
                    </h4>
                    <span className="text-[10px] font-black uppercase text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                      MAX
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-normal">
                    Vừa chữa xong câu khó, nhìn xuống lớp thấy học sinh lơ mơ? Bấm nút <strong>"Đẻ câu tương tự"</strong>: AI sinh ngay câu hỏi mới giữ nguyên dạng bài nhưng đổi số liệu số đẹp, kèm đồng hồ đếm ngược ⏱️ 02:00 để cả lớp vận dụng làm thử ngay tại chỗ.
                  </p>
                </div>

                {/* Feature 5 */}
                <div className="rounded-2xl border-2 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:bg-slate-50/80 dark:hover:bg-slate-800/90 p-6 space-y-3 hover:border-amber-500 dark:hover:border-amber-500 hover:shadow-lg transition-all">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-slate-950 dark:text-white">
                      Bẻ Nhỏ Câu Khó 3 Bước (Scaffolding)
                    </h4>
                    <span className="text-[10px] font-black uppercase text-indigo-800 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                      MAX
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-normal">
                    Với các bài toán phức tạp, AI tự động tách câu hỏi lớn thành 3 câu hỏi phụ dẫn dắt: <em>Bước 1: Khai thác giả thiết & Đổi đơn vị ➔ Bước 2: Thiết lập phương trình cốt lõi ➔ Bước 3: Biện luận chốt đáp số</em> giúp học sinh tự tư duy từ gốc tới ngọn.
                  </p>
                </div>

                {/* Feature 6 */}
                <div className="rounded-2xl border-2 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:bg-slate-50/80 dark:hover:bg-slate-800/90 p-6 space-y-3 hover:border-amber-500 dark:hover:border-amber-500 hover:shadow-lg transition-all">
                  <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 flex items-center justify-center">
                    <Flame className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-slate-950 dark:text-white">
                      Chữa Nóng OMR Sang Bục Giảng
                    </h4>
                    <span className="text-[10px] font-black uppercase text-red-800 dark:text-red-300 bg-red-100 dark:bg-red-950/80 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800">
                      MAX
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-normal">
                    Sau khi quét camera chấm bài 15 phút tại lớp, giáo viên bấm <strong>"Chữa nóng trên Bục Giảng"</strong>: Hệ thống tự lọc ra các câu có tỷ lệ học sinh làm sai trên 40% và phương án bẫy phổ biến để thầy cô chữa dứt điểm ngay trong tiết học.
                  </p>
                </div>

                {/* Feature 7 */}
                <div className="rounded-2xl border-2 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:bg-slate-50/80 dark:hover:bg-slate-800/90 p-6 space-y-3 hover:border-amber-500 dark:hover:border-amber-500 hover:shadow-lg transition-all">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
                    <Calculator className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-slate-950 dark:text-white">
                      Giải Đa Cách 15s & Tuyệt Kỹ Casio
                    </h4>
                    <span className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      MAX
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-normal">
                    Cung cấp cùng lúc 3 góc nhìn giải: <strong>Cách 1:</strong> Tự luận bản chất chuẩn GDPT 2018; <strong>Cách 2:</strong> Tuyệt kỹ trắc nghiệm 15s & Định luật bảo toàn; <strong>Cách 3:</strong> Hướng dẫn bấm máy tính Casio fx-580 / Mẹo nhớ siêu tốc.
                  </p>
                </div>

                {/* Feature 8 */}
                <div className="rounded-2xl border-2 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:bg-slate-50/80 dark:hover:bg-slate-800/90 p-6 space-y-3 hover:border-amber-500 dark:hover:border-amber-500 hover:shadow-lg transition-all">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-slate-950 dark:text-white">
                      Phiếu Nhận Xét AI Gửi Zalo Phụ Huynh
                    </h4>
                    <span className="text-[10px] font-black uppercase text-purple-800 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                      MAX
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-normal">
                    AI tự động tổng hợp ưu/nhược điểm từng học sinh dựa trên các câu đúng/sai sau khi chấm bài, xuất mẫu tin nhắn trang trọng và chu đáo để giáo viên sao chép gửi thẳng vào Zalo phụ huynh chỉ với 1 chạm.
                  </p>
                </div>

                {/* Feature 9 */}
                <div className="rounded-2xl border-2 border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:bg-slate-50/80 dark:hover:bg-slate-800/90 p-6 space-y-3 hover:border-blue-500 hover:shadow-lg transition-all">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-slate-950 dark:text-white">
                      Soạn Đề GDPT 2025 & OMR 0đ
                    </h4>
                    <span className="text-[10px] font-black uppercase text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                      MIỄN PHÍ
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-normal">
                    Soạn đề chuẩn ma trận 3 phần Bộ GD&ĐT 2025 (Nhiều lựa chọn, Đúng/Sai 4 ý, Trả lời ngắn). Chấm trắc nghiệm OpenCV OMR qua camera điện thoại 100% miễn phí (0 credits) và xuất bảng điểm Excel chuẩn UTF-8.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 3. HOW IT WORKS (3 BƯỚC ĐƠN GIẢN) ================= */}
        <section className="py-20 bg-slate-50 dark:bg-slate-950 border-b border-slate-200/90 dark:border-slate-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Quy Trình Giảng Dạy 4.0</span>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                Đơn giản chỉ trong 3 bước lên lớp
              </h2>
            </div>

            <div className="mt-14 grid gap-8 md:grid-cols-3">
              <div className="rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 p-7 text-center space-y-4 shadow-sm hover:shadow-md transition">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-xl font-black text-white shadow-md">
                  1
                </div>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white">Soạn Đề Chuẩn Ma Trận 2025</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  Nhập chủ đề hoặc dán link web, tải PDF cũ lên để AI tự động xây dựng đề thi theo ma trận 3 phần của Bộ GD&ĐT, trộn 4-12 mã đề kèm đáp án.
                </p>
              </div>

              <div className="rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 p-7 text-center space-y-4 shadow-sm hover:shadow-md transition">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-black text-white shadow-md">
                  2
                </div>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white">Chiếu Lên Bục Giảng Số</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  Bật Bục Giảng Số Split-Screen để trình chiếu: Cột trái câu hỏi phông lớn mở từng lớp lời giải, cột phải vẽ nháp Excalidraw, bung Phòng TN 3D và đẻ câu tương tự tại chỗ.
                </p>
              </div>

              <div className="rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 p-7 text-center space-y-4 shadow-sm hover:shadow-md transition">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-xl font-black text-white shadow-md">
                  3
                </div>
                <h3 className="text-lg font-bold text-slate-950 dark:text-white">Chấm OMR 0đ & Chữa Nóng</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  Quét camera chấm nhanh cả lớp trong 3 phút, tự động thống kê câu sai nhiều nhất và đẩy ngược lại Bục Giảng Số để chữa dứt điểm ngay trong tiết học.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 4. PRICING SECTION (#pricing) ================= */}
        <section id="pricing" className="py-20 bg-white dark:bg-[#070b14] scroll-mt-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-3.5 py-1 text-xs font-black uppercase tracking-wider">
                <Crown className="w-3.5 h-3.5 text-amber-600" /> Bảng Giá Minh Bạch & Tiết Kiệm
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                Chọn gói vũ khí phù hợp cho Bục Giảng của Thầy/Cô
              </h2>
              <p className="text-base text-slate-600 dark:text-slate-300">
                Đăng ký tài khoản hôm nay để nhận ngay <strong>5.000 credits miễn phí</strong> trải nghiệm tạo đề AI và Bục Giảng Số!
              </p>

              {/* Billing Cycle Toggle */}
              <div className="pt-4 flex items-center justify-center">
                <div className="flex items-center rounded-2xl bg-slate-100 dark:bg-slate-900 p-1.5 border border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setBillingCycle("monthly")}
                    className={`rounded-xl px-5 py-2 text-xs font-bold transition cursor-pointer ${
                      billingCycle === "monthly"
                        ? "bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white"
                    }`}
                  >
                    Gia hạn từng tháng
                  </button>
                  <button
                    onClick={() => setBillingCycle("semester")}
                    className={`flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold transition cursor-pointer ${
                      billingCycle === "semester"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-950"
                    }`}
                  >
                    <span>Theo Học kỳ (5 Tháng)</span>
                    <span className="rounded bg-amber-400 px-1.5 py-0.2 text-[10px] font-black text-slate-950 uppercase">
                      Tiết kiệm 20%
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* 3 Pricing Cards */}
            <div className="grid gap-8 lg:grid-cols-3">
              {/* PLAN 1: FREE */}
              <div className="rounded-3xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 space-y-6 flex flex-col justify-between shadow-xs hover:shadow-md transition">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                      Cơ bản
                    </span>
                    <span className="text-xs font-semibold text-slate-500">Dùng vĩnh viễn</span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-950 dark:text-white">Gói Miễn Phí</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Phù hợp cho Thầy/Cô làm quen với AI soạn đề và chấm trắc nghiệm cơ bản.
                  </p>

                  <div className="pt-2">
                    <span className="text-4xl font-extrabold text-slate-950 dark:text-white">0₫</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">/tháng</span>
                    <p className="text-xs font-bold text-blue-600 mt-1">Tặng 5.000 credits khi đăng ký</p>
                  </div>

                  <ul className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Tặng 5.000 credits (soạn ~10 đề Flash hoặc ~3 đề Pro)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Chấm trắc nghiệm OpenCV OMR</strong> qua camera 100% miễn phí (0 credits)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Dùng thử 1 bài học 3D miễn phí cho mỗi môn</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Bóc tách câu hỏi tự động từ link web hoặc file văn bản</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Xuất file Word & PDF chuẩn Bộ GD&ĐT</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/register"
                  className="w-full rounded-xl border-2 border-slate-300 dark:border-slate-700 py-3 text-center text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition block focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Bắt đầu Miễn phí
                </Link>
              </div>

              {/* PLAN 2: PRO */}
              <div className="relative rounded-3xl border-2 border-blue-600 bg-white dark:bg-slate-900 p-7 space-y-6 flex flex-col justify-between shadow-xl ring-2 ring-blue-600/20">
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-1 text-xs font-black uppercase text-white shadow-md">
                  Khuyên Dùng Cho GV Đứng Lớp
                </span>

                <div className="space-y-4 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                      Bục Giảng Số 4.0
                    </span>
                    <span className="text-xs font-bold text-emerald-600">Tiêu chuẩn</span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-950 dark:text-white">Gói Giáo Viên PRO</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Biến máy chiếu lớp học thành Bục Giảng Số tương tác đỉnh cao & 54+ Phòng TN 3D.
                  </p>

                  <div className="pt-2">
                    {billingCycle === "monthly" ? (
                      <>
                        <span className="text-4xl font-extrabold text-slate-950 dark:text-white">149.000₫</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">/tháng</span>
                        <p className="text-xs font-bold text-blue-600 mt-1">+30.000 credits/tháng vào ví</p>
                      </>
                    ) : (
                      <>
                        <span className="text-4xl font-extrabold text-slate-950 dark:text-white">599.000₫</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">/học kỳ (5 tháng)</span>
                        <p className="text-xs font-bold text-emerald-600 mt-1">
                          +150.000 credits • Tiết kiệm 146.000₫
                        </p>
                      </>
                    )}
                  </div>

                  <ul className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span><strong>Bục Giảng Số Split-Screen:</strong> Chiếu đề phông lớn + Bảng nháp Excalidraw tự lưu nét vẽ</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span><strong>Lớp Kính Vẽ Trong Suốt:</strong> Mở khóa 54+ Phòng TN 3D (Lý, Hóa, Sinh, Địa)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span><strong>Xuất Bộ Đề Kép Word:</strong> Bản học sinh chừa dòng kẻ & Bản giáo viên có lời giải</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>Xuất Word (.docx) & PDF sạch 100% <strong>không dính watermark</strong></span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>Trộn 4 mã đề chuẩn GDPT 2025 kèm ma trận đặc tả</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>Xuất bảng điểm Excel UTF-8 BOM chuẩn Bộ GD&ĐT</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/register?plan=pro"
                  className="w-full rounded-xl bg-blue-600 py-3 text-center text-xs font-bold text-white hover:bg-blue-700 transition shadow-md shadow-blue-500/25 block focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  Nâng cấp Gói PRO
                </Link>
              </div>

              {/* PLAN 3: MAX */}
              <div className="relative rounded-3xl border-2 border-amber-500 bg-white dark:bg-slate-900 p-7 space-y-6 flex flex-col justify-between shadow-xl ring-2 ring-amber-500/20">
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-1 text-xs font-black uppercase text-slate-950 shadow-md">
                  Vũ Khí VIP Luyện Thi & Dạy Thêm
                </span>

                <div className="space-y-4 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-amber-900 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-lg">
                      Luyện Thi MAX
                    </span>
                    <span className="text-xs font-bold text-amber-700">Cao cấp VIP</span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-950 dark:text-white">Gói Luyện Thi MAX</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Giải pháp tối thượng cho giáo viên dạy đội tuyển, dạy thêm và trung tâm luyện thi.
                  </p>

                  <div className="pt-2">
                    {billingCycle === "monthly" ? (
                      <>
                        <span className="text-4xl font-extrabold text-slate-950 dark:text-white">229.000₫</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">/tháng</span>
                        <p className="text-xs font-bold text-amber-700 mt-1">+100.000 credits/tháng (Gemini 3.8-flash / 3.1 pro Deep Reasoning)</p>
                      </>
                    ) : (
                      <>
                        <span className="text-4xl font-extrabold text-slate-950 dark:text-white">899.000₫</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">/học kỳ (5 tháng)</span>
                        <p className="text-xs font-bold text-emerald-600 mt-1">
                          +500.000 credits • Tiết kiệm 246.000₫
                        </p>
                      </>
                    )}
                  </div>

                  <ul className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                    <li className="flex items-start gap-2.5 font-bold text-slate-950 dark:text-white">
                      <Crown className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>Bao gồm TOÀN BỘ đặc quyền của Gói PRO</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span><strong>Đẻ câu tương tự tại chỗ (Live Cloner):</strong> Giữ nguyên dạng bài + Đồng hồ ⏱️ 02:00</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span><strong>Bẻ nhỏ câu khó 3 bước (AI Scaffolding):</strong> Dẫn dắt sư phạm từ giả thiết đến kết luận</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span><strong>Giải đa cách 15s & Tuyệt kỹ Casio:</strong> Tự luận bản chất ⇄ 15s Trắc nghiệm ⇄ Casio fx-580</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span><strong>Chữa nóng OMR sang Bục giảng:</strong> Đẩy câu sai trên 40% lên bảng giảng chữa ngay</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span><strong>Phiếu nhận xét AI gửi Zalo phụ huynh:</strong> Tự động phân tích ưu/nhược điểm từng học sinh</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>Đóng dấu Watermark thương hiệu riêng của Thầy/Cô chống lộ đề</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/register?plan=max"
                  className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-center text-xs font-black text-slate-950 hover:brightness-105 transition shadow-md shadow-amber-500/20 block focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
                >
                  Nâng cấp Gói MAX VIP
                </Link>
              </div>
            </div>

            {/* Trial Banner */}
            <div className="rounded-3xl border-2 border-amber-300 dark:border-amber-800/80 bg-amber-50/80 dark:bg-amber-950/30 p-6 text-center space-y-2 shadow-xs">
              <div className="flex items-center justify-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Chính sách minh bạch — Phục vụ trọn vẹn mọi nhu cầu giảng dạy</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 max-w-2xl mx-auto font-medium">
                Tài khoản Miễn phí tặng sẵn 5.000 credits và mở 1 bài thí nghiệm mẫu cho mỗi môn học. Nâng cấp Gói Giáo Viên PRO hoặc Gói Luyện Thi MAX bất kỳ lúc nào để mở khóa toàn bộ 54+ phòng thí nghiệm 3D và bục giảng số không giới hạn!
              </p>
            </div>
          </div>
        </section>

        {/* ================= 5. CTA SECTION ================= */}
        <section className="border-t border-slate-200 dark:border-slate-800 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-[#070b14] py-20">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 space-y-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              Sẵn sàng nâng tầm tiết học với EduTest?
            </h2>
            <p className="text-base text-slate-700 leading-relaxed max-w-xl mx-auto font-normal">
              Tham gia cùng hàng nghìn thầy cô đang tiết kiệm hàng giờ soạn đề và biến từng tiết chữa đề thành trải nghiệm tương tác số cuốn hút học sinh.
            </p>
            <div className="pt-2">
              <Link
                href="/register"
                className="inline-flex h-12 items-center gap-2.5 rounded-xl bg-blue-600 px-8 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700 hover:scale-105"
              >
                <span>Bắt đầu dùng thử 14 ngày miễn phí</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <p className="text-xs text-slate-500">
              Không yêu cầu thông tin thanh toán • Đăng ký bằng Google hoặc Email chỉ mất 30 giây
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
