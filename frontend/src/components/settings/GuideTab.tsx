"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import {
  BookOpen,
  FileText,
  Shuffle,
  Printer,
  Camera,
  FileSpreadsheet,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Layers,
  QrCode,
  Download,
  Smartphone,
  ArrowRight,
  Search,
  X,
  Zap,
} from "lucide-react";
import { SUPPORT_EMAIL } from "@/lib/constants";

export const guideTopics = [
  {
    id: "create-exam",
    number: "1",
    label: "1. Soạn đề thi AI chuẩn 2025",
    shortLabel: "1. Soạn đề AI 2025",
    icon: FileText,
    badge: "Cốt lõi",
    badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  {
    id: "shuffle-exam",
    number: "2",
    label: "2. Trộn 4 mã đề & Ma trận",
    shortLabel: "2. Trộn 4 mã đề",
    icon: Shuffle,
    badge: "Mới",
    badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  {
    id: "print-sheet",
    number: "3",
    label: "3. In phiếu tô A4 chuẩn",
    shortLabel: "3. In phiếu A4",
    icon: Printer,
    badge: "Bộ GD&ĐT",
    badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  {
    id: "ai-grading",
    number: "4",
    label: "4. Chấm Camera & Nộp QR",
    shortLabel: "4. Chấm Camera",
    icon: Camera,
    badge: "PRO VIP",
    badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  },
  {
    id: "export-score",
    number: "5",
    label: "5. Xuất bảng điểm Excel",
    shortLabel: "5. Xuất Excel",
    icon: FileSpreadsheet,
    badge: "Báo cáo",
    badgeColor: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  },
];

export const faqs = [
  {
    category: "credits",
    q: "Mỗi ngày tôi được tạo bao nhiêu đề thi miễn phí và chính sách Credits như thế nào?",
    a: "Khi đăng ký tài khoản mới, Thầy/Cô được tặng ngay 5.000 Credits chào mừng (tương đương ~10 lượt tạo đề thi chuẩn GDPT 2025 miễn phí) ngay lập tức. Bên cạnh đó, mỗi tài khoản được cấp sẵn 3 lượt tạo đề miễn phí mỗi ngày (tự động làm mới lúc 00:00). Đặc biệt, khi Thầy/Cô giới thiệu đồng nghiệp đăng ký và tạo đề thi đầu tiên, Thầy/Cô nhận thêm ngay +10.000 Credits thưởng vào ví!",
  },
  {
    category: "plan",
    q: "Gói Giáo Viên PRO và Luyện Thi MAX có những đặc quyền và số lượng Credits thế nào?",
    a: "Gói Giáo Viên PRO (149.000đ/tháng hoặc 596.000đ/học kỳ 5 tháng) mở khóa 100% tính năng Chấm trắc nghiệm AI qua camera điện thoại không giới hạn, Học sinh tự nộp bài online qua Link & QR, tặng kèm 30.000 Credits tạo đề mỗi tháng và không giới hạn số lượt tạo đề hàng ngày. Gói Luyện Thi MAX (229.000đ/tháng hoặc 916.000đ/học kỳ) tặng kèm 100.000 Credits mỗi tháng, mở khóa toàn bộ mô hình Gemini Thinking suy luận sâu, bóc tách đề từ PDF/Ảnh phức tạp và xuất bảng điểm phân tích nâng cao.",
  },
  {
    category: "payment",
    q: "Làm sao để thanh toán qua cổng VietQR PayOS 24/7?",
    a: "Thầy/Cô vào tab 'Nạp điểm' hoặc 'Gói cước'. Hệ thống sẽ tạo mã QR thanh toán động qua cổng thanh toán tự động VietQR PayOS 24/7. Thầy/Cô chỉ cần mở App ngân hàng bất kỳ (Napas247) quét mã VietQR và xác nhận chuyển khoản. Hệ thống tự động kích hoạt gói và cộng Credits vào ví ngay lập tức trong 3 - 5 giây.",
  },
  {
    category: "credits",
    q: "Bảng định mức tiêu hao Credits cho từng tính năng như thế nào?",
    a: "Định mức tiêu hao rõ ràng và minh bạch: Tạo đề thi chuẩn GDPT 2025: 500 credits/đề; Suy luận sâu (Gemini Thinking): 1.000 credits/đề; Bóc tách đề thi từ file PDF/Ảnh AI: 300 credits/trang; Chấm phiếu trắc nghiệm OMR: 50 credits/bài (hoàn toàn miễn phí không giới hạn cho gói PRO và MAX).",
  },
  {
    category: "exam",
    q: "Học sinh nộp bài qua mã QR có cần đăng ký tài khoản không?",
    a: "Hoàn toàn không cần! Học sinh chỉ cần dùng camera điện thoại quét mã QR hoặc bấm vào đường link giáo viên gửi, điền Họ tên, Số báo danh, Lớp và tiến hành làm bài thi trực tiếp trên trình duyệt. Điểm số sẽ tự động đồng bộ vào bảng điểm của giáo viên.",
  },
  {
    category: "exam",
    q: "Phiếu in trả lời trắc nghiệm có nhận diện chính xác 100% không?",
    a: "Phiếu trả lời được thiết kế theo tỷ lệ chuẩn A4 của Bộ GD&ĐT với các điểm mốc định vị 4 góc. Khi chụp phiếu bằng camera điện thoại hoặc webcam, hệ thống AI tự động cân chỉnh góc nghiêng và đọc đáp án tô bút chì 2B/3B với độ chính xác cao.",
  },
  {
    category: "partner",
    q: "Chính sách đối tác giới thiệu nhận hoa hồng và rút tiền mặt như thế nào?",
    a: "Thầy/Cô chia sẻ link hoặc mã QR giới thiệu (tab 'Đối tác & Hoa hồng'). Mỗi khi đồng nghiệp đăng ký và nâng cấp gói PRO/MAX hoặc nạp Credits, Thầy/Cô nhận ngay 20% hoa hồng trọn đời. Thầy/Cô có thể rút tiền mặt về tài khoản ngân hàng VietQR khi đạt từ 200.000đ, hoặc quy đổi sang AI Credits bất kỳ lúc nào từ 10.000đ với ưu đãi tặng thêm +20% giá trị Credits.",
  },
  {
    category: "support",
    q: "Tôi cần hỗ trợ kỹ thuật hoặc góp ý tính năng thì liên hệ ở đâu?",
    a: `Thầy/Cô có thể gửi email về hòm thư hỗ trợ chính thức: ${SUPPORT_EMAIL} hoặc tham gia nhóm Zalo Hỗ trợ giáo viên toàn quốc để được giải đáp 24/7.`,
  },
];

export function GuideTab() {
  const [activeTab, setActiveTab] = useState<string>("create-exam");
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const [faqSearchQuery, setFaqSearchQuery] = useState<string>("");

  const topicsContainerRef = useRef<HTMLDivElement>(null);

  const scrollTopics = (direction: "left" | "right") => {
    if (topicsContainerRef.current) {
      const offset = direction === "left" ? -240 : 240;
      topicsContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  // Filter FAQs based on search
  const filteredFaqs = faqs.filter((faq) => {
    if (!faqSearchQuery.trim()) return true;
    const q = faqSearchQuery.toLowerCase();
    return faq.q.toLowerCase().includes(q) || faq.a.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-8">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            Cẩm Nang Hướng Dẫn Sử Dụng
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Làm chủ nền tảng EduTest AI
          </h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Tài liệu hướng dẫn trực quan từng bước giúp Thầy/Cô khai thác tối đa sức mạnh của AI trong soạn đề chuẩn 2025, trộn 4 mã đề, in phiếu A4 và tự động hóa khâu chấm thi.
          </p>
        </div>

        <Link
          href="/exams/create"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 shadow-sm transition shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Thử soạn đề ngay</span>
        </Link>
      </div>

      {/* 2. Main 5 Topics Bar - FIXED OVERFLOW & VISIBLE CHUYÊN ĐỀ 5 */}
      <div className="space-y-2">
        <div className="relative">
          {/* Scroll arrow buttons for small screens */}
          <button
            type="button"
            onClick={() => scrollTopics("left")}
            aria-label="Cuộn sang trái"
            className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-slate-900/90 text-white border border-slate-700 shadow-md flex items-center justify-center cursor-pointer hover:bg-slate-800 lg:hidden"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => scrollTopics("right")}
            aria-label="Cuộn sang phải"
            className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-slate-900/90 text-white border border-slate-700 shadow-md flex items-center justify-center cursor-pointer hover:bg-slate-800 lg:hidden"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Topics Grid / Horizontal Scroll with Fade */}
          <div
            ref={topicsContainerRef}
            className="flex lg:grid lg:grid-cols-5 gap-2.5 overflow-x-auto pb-2 scrollbar-none px-1"
          >
            {guideTopics.map((topic) => {
              const isActive = activeTab === topic.id;
              const Icon = topic.icon;
              return (
                <button
                  key={topic.id}
                  onClick={() => setActiveTab(topic.id)}
                  type="button"
                  className={`flex items-center justify-between gap-2 px-3.5 py-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer shrink-0 min-w-[210px] lg:min-w-0 ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-sm ring-2 ring-primary/20"
                      : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="truncate">{topic.label}</span>
                  </div>
                  <span
                    className={`ml-1 text-[10px] px-2 py-0.5 rounded-md shrink-0 font-medium ${
                      isActive
                        ? "bg-white/25 text-white"
                        : "bg-muted/80 text-muted-foreground"
                    }`}
                  >
                    {topic.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Detailed Topic Content Panel */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-6">
        {/* CHUYÊN ĐỀ 1: SOẠN ĐỀ AI CHUẨN 2025 */}
        {activeTab === "create-exam" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Chuyên đề 1 • Cốt lõi</span>
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-1">
                  Soạn đề thi thông minh chuẩn Bộ GD&ĐT 2025
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Tạo đề thi tự động bằng trí tuệ nhân tạo hoặc trích xuất từ văn bản cũ, file Word/PDF và link web giáo dục.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-500/20 shrink-0 self-start sm:self-auto">
                Form 3 phần mới
              </span>
            </div>

            {/* 3 Steps with mini UI mockups */}
            <div className="grid gap-6 md:grid-cols-3">
              {/* Step 1 */}
              <div className="rounded-2xl border border-border p-4 bg-muted/20 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                      1
                    </div>
                    <h4 className="font-bold text-sm text-foreground">Chọn môn & Khối lớp</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Tại màn hình Soạn đề, chọn môn học (Toán, Lý, Hóa, Sinh, Sử, Địa, GDCD, Ngoại ngữ...) và khối lớp từ 1 đến 12.
                  </p>
                </div>

                {/* Mini UI Mockup */}
                <div className="p-3 bg-slate-950 text-slate-200 rounded-xl border border-slate-800 text-[11px] font-mono space-y-1.5 shadow-inner">
                  <div className="text-[10px] text-slate-400 font-sans font-bold">MINI UI PREVIEW:</div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-blue-900/60 text-blue-300 border border-blue-700/50">
                      Môn: Toán ▼
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                      Lớp 12 ▼
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                      ✓ Chuẩn GDPT 2025
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="rounded-2xl border border-border p-4 bg-muted/20 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                      2
                    </div>
                    <h4 className="font-bold text-sm text-foreground">Cấu trúc 3 phần 2025</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Bật tùy chọn <strong>Chuẩn Bộ GD&ĐT 2025</strong> để AI tạo trọn vẹn 3 phần: Trắc nghiệm 4 lựa chọn, Đúng/Sai 4 ý và Trả lời ngắn.
                  </p>
                </div>

                {/* Mini UI Mockup */}
                <div className="p-3 bg-slate-950 text-slate-200 rounded-xl border border-slate-800 text-[10px] space-y-1 shadow-inner font-sans">
                  <div className="flex items-center justify-between text-blue-400">
                    <span>Phần I: 12 câu ABCD</span>
                    <span className="font-bold">3.0đ</span>
                  </div>
                  <div className="flex items-center justify-between text-amber-400">
                    <span>Phần II: 4 câu Đúng/Sai (a,b,c,d)</span>
                    <span className="font-bold">4.0đ</span>
                  </div>
                  <div className="flex items-center justify-between text-emerald-400">
                    <span>Phần III: 6 câu Trả lời ngắn</span>
                    <span className="font-bold">3.0đ</span>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="rounded-2xl border border-border p-4 bg-muted/20 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                      3
                    </div>
                    <h4 className="font-bold text-sm text-foreground">Biên tập KaTeX & Đồ thị</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Dùng thanh Studio để gõ công thức Toán KaTeX, chèn bảng biến thiên, đồ thị hàm số và hình học không gian có sẵn.
                  </p>
                </div>

                {/* Mini UI Mockup */}
                <div className="p-3 bg-slate-950 text-slate-200 rounded-xl border border-slate-800 text-[11px] font-mono space-y-1.5 shadow-inner">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <span>Studio:</span>
                    <span className="text-indigo-400">[f(x) KaTeX]</span>
                    <span className="text-pink-400">[Bảng BT]</span>
                    <span className="text-emerald-400">[Đồ thị]</span>
                  </div>
                  <div className="text-slate-300 italic text-[11px]">
                    f(x) = 2x³ - 3x² + 5
                  </div>
                </div>
              </div>
            </div>

            {/* Mẹo cho Thầy/Cô */}
            <div className="rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 p-4 sm:p-5 text-xs text-indigo-950 dark:text-indigo-200 space-y-2">
              <p className="font-bold flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Mẹo chuyên gia dành cho Thầy/Cô:</span>
              </p>
              <ul className="space-y-1 text-slate-700 dark:text-slate-300 list-disc list-inside">
                <li>
                  Thầy/Cô có thể dán trực tiếp một đoạn văn bản đề thi cũ vào ô AI để hệ thống tự động bóc tách thành các câu trắc nghiệm chuẩn.
                </li>
                <li>
                  Tại trang <strong>Soạn đề</strong>, Thầy/Cô có thể dán link các trang giáo dục (như VietJack, Hoc247...) hoặc tải file Word để AI chuyển đổi đề trong 5 giây.
                </li>
              </ul>
            </div>

            {/* Quick Navigation CTA */}
            <div className="pt-2 flex items-center justify-end">
              <Link
                href="/exams/create"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition shadow-sm"
              >
                <span>Tới Studio Soạn đề AI ngay</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* CHUYÊN ĐỀ 2: TRỘN 4 MÃ ĐỀ & MA TRẬN */}
        {activeTab === "shuffle-exam" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Chuyên đề 2 • Chống gian lận</span>
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-1">
                  Trộn đề thi tự động ra 4 mã đề & Bảng ma trận đối chiếu
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Giải pháp chống quay cóp hoàn hảo, tự động xuất 1 file Word trọn gói cho toàn bộ phòng thi.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/20 shrink-0 self-start sm:self-auto">
                Mã 101, 102, 103, 104
              </span>
            </div>

            {/* 3 Steps with mini UI mockups */}
            <div className="grid gap-6 md:grid-cols-3">
              {/* Step 1 */}
              <div className="rounded-2xl border border-border p-4 bg-muted/20 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                      1
                    </div>
                    <h4 className="font-bold text-sm text-foreground">Kích hoạt trộn 4 mã đề</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Tại Studio soạn đề, bấm nút <strong>Trộn bộ 4 mã đề (.docx)</strong> trên thanh công cụ hoặc vào menu <strong>Tệp → Trộn đề</strong>.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 text-slate-200 rounded-xl border border-slate-800 text-[11px] font-mono space-y-1.5 shadow-inner">
                  <div className="text-[10px] text-slate-400 font-sans font-bold">MINI UI PREVIEW:</div>
                  <div className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-center text-xs">
                    ⚡ Trộn bộ 4 mã đề (.docx)
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="rounded-2xl border border-border p-4 bg-muted/20 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                      2
                    </div>
                    <h4 className="font-bold text-sm text-foreground">Hoán vị & Tra cứu ma trận</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Hệ thống tự động đảo vị trí các câu hỏi trong từng phần, đảo ngẫu nhiên 4 phương án A-B-C-D và tự tính lại đáp án đúng mới.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 text-slate-200 rounded-xl border border-slate-800 text-[10px] space-y-1.5 shadow-inner">
                  <div className="flex items-center gap-1 justify-between">
                    <span className="px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300">Mã 101</span>
                    <span className="px-1.5 py-0.5 rounded bg-indigo-900/60 text-indigo-300">Mã 102</span>
                    <span className="px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-300">Mã 103</span>
                    <span className="px-1.5 py-0.5 rounded bg-pink-900/60 text-pink-300">Mã 104</span>
                  </div>
                  <div className="text-emerald-400 text-[10px]">✓ Ma trận đảo đều 100%</div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="rounded-2xl border border-border p-4 bg-muted/20 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                      3
                    </div>
                    <h4 className="font-bold text-sm text-foreground">Tải 1 file Word duy nhất</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    File Word tải về đã được phân trang sẵn cho từng mã đề, có dòng tên thí sinh và trang cuối là <strong>BẢNG MA TRẬN ĐỐI CHIẾU</strong>.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 text-slate-200 rounded-xl border border-slate-800 text-[11px] font-mono space-y-1 shadow-inner">
                  <div className="flex items-center gap-1 text-slate-300">
                    <Download className="w-3.5 h-3.5 text-blue-400" />
                    <span>de_thi_4_ma_de.docx</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Trang cuối: Ma trận đối chiếu</div>
                </div>
              </div>
            </div>

            {/* Mẹo cho Thầy/Cô */}
            <div className="rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 p-4 sm:p-5 text-xs text-amber-950 dark:text-amber-200 space-y-2">
              <p className="font-bold flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Mẹo in ấn & Quản lý phòng thi:</span>
              </p>
              <ul className="space-y-1 text-slate-700 dark:text-slate-300 list-disc list-inside">
                <li>
                  Không cần cài thêm phần mềm trộn đề phức tạp (McMix, Young Mix). Tất cả xử lý đám mây trong 3 giây.
                </li>
                <li>
                  Giáo viên chỉ cần photo 1 file Word duy nhất, máy in tự chia đều từng mã đề cho các dãy bàn học sinh.
                </li>
              </ul>
            </div>

            {/* Quick Navigation CTA */}
            <div className="pt-2 flex items-center justify-end">
              <Link
                href="/exams/create"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition shadow-sm"
              >
                <span>Mở công cụ Trộn 4 mã đề</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* CHUYÊN ĐỀ 3: IN PHIẾU TÔ A4 CHUẨN */}
        {activeTab === "print-sheet" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  <Printer className="w-3.5 h-3.5" />
                  <span>Chuyên đề 3 • Tiêu chuẩn in ấn</span>
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-1">
                  Quy chuẩn In phiếu tô trả lời trắc nghiệm chuẩn A4
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Hướng dẫn in ấn chuẩn xác và dặn dò học sinh tô chì để đạt độ nhận diện 100% bằng camera.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20 shrink-0 self-start sm:self-auto">
                Khổ A4 Chuẩn
              </span>
            </div>

            {/* 3 Steps with mini UI mockups */}
            <div className="grid gap-6 md:grid-cols-3">
              {/* Step 1 */}
              <div className="rounded-2xl border border-border p-4 bg-muted/20 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                      1
                    </div>
                    <h4 className="font-bold text-sm text-foreground">Chọn mẫu phiếu phù hợp</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Hệ thống cung cấp 4 mẫu: Phiếu 20 câu (15p), Phiếu 40 câu (Học kỳ), Phiếu 50 câu (Tốt nghiệp) và Phiếu Form 2025 (3 phần).
                  </p>
                </div>

                <div className="p-3 bg-slate-950 text-slate-200 rounded-xl border border-slate-800 text-[10px] space-y-1 shadow-inner">
                  <div className="text-slate-400 font-bold">MẪU PHIẾU HỖ TRỢ:</div>
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <span className="p-1 rounded bg-slate-900 border border-slate-800 text-center">20 câu</span>
                    <span className="p-1 rounded bg-slate-900 border border-slate-800 text-center">40 câu</span>
                    <span className="p-1 rounded bg-slate-900 border border-slate-800 text-center">50 câu</span>
                    <span className="p-1 rounded bg-emerald-900/60 border border-emerald-700/50 text-center text-emerald-300 font-bold">Form 2025</span>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="rounded-2xl border border-border p-4 bg-muted/20 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                      2
                    </div>
                    <h4 className="font-bold text-sm text-foreground">Cài đặt máy in chuẩn</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    In trên giấy A4 trắng tiêu chuẩn (định lượng 70-80gsm trở lên). Tại hộp thoại in, chọn <strong>Scale: 100%</strong> (Fit to page).
                  </p>
                </div>

                <div className="p-3 bg-slate-950 text-slate-200 rounded-xl border border-slate-800 text-[10px] space-y-1 shadow-inner font-mono">
                  <div className="text-blue-400">• Khổ giấy: A4 (210 x 297 mm)</div>
                  <div className="text-emerald-400">• Tỷ lệ: 100% (No Scaling)</div>
                  <div className="text-amber-400">• 4 mốc đen góc: Giữ nguyên</div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="rounded-2xl border border-border p-4 bg-muted/20 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
                      3
                    </div>
                    <h4 className="font-bold text-sm text-foreground">Dặn học sinh tô bút chì 2B</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Học sinh dùng <strong>bút chì 2B hoặc 3B</strong> tô kín vòng tròn, ghi rõ Số báo danh và Mã đề để máy quét nhận diện trong 0.2s.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 text-slate-200 rounded-xl border border-slate-800 text-[10px] space-y-1 shadow-inner">
                  <div className="text-emerald-400 flex items-center gap-1 font-bold">
                    <span>✓</span>
                    <span>Tô kín vòng tròn (Bút chì 2B/3B)</span>
                  </div>
                  <div className="text-rose-400 flex items-center gap-1">
                    <span>✗</span>
                    <span>Không gạch chéo, không đánh dấu tick</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mẹo cho Thầy/Cô */}
            <div className="rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 p-4 sm:p-5 text-xs text-emerald-950 dark:text-emerald-200 space-y-2">
              <p className="font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Lưu ý quan trọng khi in ấn hàng loạt:</span>
              </p>
              <ul className="space-y-1 text-slate-700 dark:text-slate-300 list-disc list-inside">
                <li>
                  Đảm bảo 4 ô vuông định vị ở 4 góc phiếu không bị mất viền hoặc xô lệch khi photo nhân bản.
                </li>
                <li>
                  Thầy/Cô có thể in sẵn Số báo danh và Mã đề vào phiếu tô của từng học sinh để giảm thiểu nhầm lẫn khi chấm bài.
                </li>
              </ul>
            </div>

            {/* Quick Navigation CTA */}
            <div className="pt-2 flex items-center justify-end">
              <Link
                href="/grading"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm"
              >
                <span>Tải mẫu phiếu tô A4 chuẩn (PDF)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* CHUYÊN ĐỀ 4: CHẤM CAMERA & NỘP QR */}
        {activeTab === "ai-grading" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Chuyên đề 4 • PRO VIP Độc Quyền</span>
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-1">
                  Chấm bài tự động qua Camera & Học sinh tự nộp qua QR
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Tự động hóa hoàn toàn khâu chấm thi: dùng camera điện thoại quét 1 giây/bài hoặc gửi link nộp online.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold border border-purple-500/20 shrink-0 self-start sm:self-auto">
                Tốc độ 1s / bài
              </span>
            </div>

            {/* 3 Steps with mini UI mockups */}
            <div className="grid gap-6 md:grid-cols-3">
              {/* Step 1 */}
              <div className="rounded-2xl border border-border p-4 bg-muted/20 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
                      1
                    </div>
                    <h4 className="font-bold text-sm text-foreground">Kết nối Camera điện thoại</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Tại trang <strong>Chấm trắc nghiệm</strong>, bấm nút <strong>Chấm bài AI</strong> và quét mã QR để biến điện thoại thành máy quét OMR siêu tốc.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 text-slate-200 rounded-xl border border-slate-800 text-[10px] space-y-1 shadow-inner">
                  <div className="flex items-center gap-1 text-purple-400 font-bold">
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Quét QR kết nối điện thoại</span>
                  </div>
                  <div className="text-slate-400">Không cần cài app, chạy trực tiếp Web</div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="rounded-2xl border border-border p-4 bg-muted/20 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                      2
                    </div>
                    <h4 className="font-bold text-sm text-foreground">Hướng camera vào phiếu thi</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Khung AI màu xanh tự động bắt 4 mốc định vị, cân chỉnh góc nghiêng và đọc điểm số học sinh tức thì trong 1 giây.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 text-slate-200 rounded-xl border border-slate-800 text-[10px] space-y-1 shadow-inner font-mono">
                  <div className="text-emerald-400 flex items-center gap-1">
                    <span>[+] Target Locked (4 góc)</span>
                  </div>
                  <div className="text-slate-300">Đọc SBD: 120405 • Mã 101</div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="rounded-2xl border border-border p-4 bg-muted/20 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                      3
                    </div>
                    <h4 className="font-bold text-sm text-foreground">Đồng bộ điểm vào danh sách lớp</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Kết quả điểm số thang 10, số câu đúng/sai được lưu tự động vào bảng điểm lớp và tạo phiếu báo điểm cho phụ huynh.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 text-slate-200 rounded-xl border border-slate-800 text-[10px] space-y-1 shadow-inner">
                  <div className="text-emerald-400 font-bold">Điểm số: 8.75 / 10</div>
                  <div className="text-slate-400">Đúng: 24/28 • Sai: 3 • Bỏ: 1</div>
                </div>
              </div>
            </div>

            {/* Mẹo cho Thầy/Cô */}
            <div className="rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 p-4 sm:p-5 text-xs text-purple-950 dark:text-purple-200 space-y-2">
              <p className="font-bold flex items-center gap-1.5 text-purple-700 dark:text-purple-300">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Mẹo tối ưu tốc độ chấm:</span>
              </p>
              <ul className="space-y-1 text-slate-700 dark:text-slate-300 list-disc list-inside">
                <li>
                  Giữ điện thoại cách mặt phiếu khoảng 25 - 35 cm, đảm bảo phòng đủ ánh sáng và tránh bóng đổ của tay lên mặt phiếu.
                </li>
                <li>
                  <strong>Tùy chọn Nộp bài online:</strong> Chiếu mã QR lên máy chiếu lớp học, học sinh điền tên và nộp bài trực tiếp không tốn 1 tờ giấy in!
                </li>
              </ul>
            </div>

            {/* Quick Navigation CTA */}
            <div className="pt-2 flex items-center justify-end">
              <Link
                href="/grading"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shadow-sm"
              >
                <span>Vào màn hình Chấm thi AI & Quét QR</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* CHUYÊN ĐỀ 5: XUẤT BẢNG ĐIỂM EXCEL */}
        {activeTab === "export-score" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Chuyên đề 5 • Báo cáo thống kê</span>
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-1">
                  Xuất bảng điểm lớp file Excel UTF-8 BOM chuẩn Bộ GD&ĐT
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Bảng điểm tương thích 100% với VnEdu, SMAS và Microsoft Excel mọi phiên bản, không bị lỗi font chữ tiếng Việt.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-500/20 shrink-0 self-start sm:self-auto">
                Chuẩn VnEdu / SMAS
              </span>
            </div>

            {/* 3 Steps with mini UI mockups */}
            <div className="grid gap-6 md:grid-cols-3">
              {/* Step 1 */}
              <div className="rounded-2xl border border-border p-4 bg-muted/20 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                      1
                    </div>
                    <h4 className="font-bold text-sm text-foreground">Chọn kỳ thi đã hoàn thành</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Vào trang <strong>Chấm thi</strong>, chọn kỳ thi đã chấm xong. Hệ thống hiển thị tổng quan phổ điểm và số bài đã chấm.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 text-slate-200 rounded-xl border border-slate-800 text-[10px] space-y-1 shadow-inner">
                  <div className="text-indigo-400 font-bold">Kỳ thi: Giữa kỳ 1 Toán 12</div>
                  <div className="text-emerald-400">✓ Đã chấm 45/45 học sinh (100%)</div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="rounded-2xl border border-border p-4 bg-muted/20 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                      2
                    </div>
                    <h4 className="font-bold text-sm text-foreground">Bấm Xuất Excel bảng điểm</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Bấm nút <strong>Xuất Excel bảng điểm</strong> ở góc trên bên phải màn hình chi tiết kỳ thi.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 text-slate-200 rounded-xl border border-slate-800 text-[11px] font-mono space-y-1.5 shadow-inner">
                  <div className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-bold text-center text-xs flex items-center justify-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>📥 Xuất bảng điểm (.xlsx)</span>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="rounded-2xl border border-border p-4 bg-muted/20 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                      3
                    </div>
                    <h4 className="font-bold text-sm text-foreground">Đồng bộ vào sổ điểm trường</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    File Excel tải về chứa đầy đủ: STT, Họ tên, SBD, Lớp, Mã đề, Điểm số và chi tiết câu đúng/sai từng phần.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 text-slate-200 rounded-xl border border-slate-800 text-[10px] space-y-1 shadow-inner font-mono">
                  <div className="text-slate-300">Cột: STT | Họ tên | Điểm</div>
                  <div className="text-emerald-400">Chuẩn mã hóa: UTF-8 BOM</div>
                </div>
              </div>
            </div>

            {/* Mẹo cho Thầy/Cô */}
            <div className="rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 p-4 sm:p-5 text-xs text-indigo-950 dark:text-indigo-200 space-y-2">
              <p className="font-bold flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Ưu điểm định dạng bảng điểm EduTest AI:</span>
              </p>
              <ul className="space-y-1 text-slate-700 dark:text-slate-300 list-disc list-inside">
                <li>
                  Sử dụng mã hóa UTF-8 BOM, mở trực tiếp trên Excel tiếng Việt không bao giờ bị lỗi font chữ.
                </li>
                <li>
                  Dễ dàng import hàng loạt dữ liệu vào hệ thống quản lý trường học VnEdu, SMAS hoặc Google Sheets chỉ bằng 1 thao tác.
                </li>
              </ul>
            </div>

            {/* Quick Navigation CTA */}
            <div className="pt-2 flex items-center justify-end">
              <Link
                href="/grading"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-sm"
              >
                <span>Xem Bảng điểm kỳ thi & Lớp học</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* 4. FAQ SECTION WITH SEARCH & SYNCHRONIZED NUMBERS */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-bold text-foreground">Câu hỏi thường gặp (FAQ)</h3>
          </div>

          {/* Search FAQ Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={faqSearchQuery}
              onChange={(e) => setFaqSearchQuery(e.target.value)}
              placeholder="🔍 Tìm câu hỏi hướng dẫn..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-border bg-card text-xs font-medium text-foreground outline-hidden focus:ring-2 focus:ring-primary shadow-2xs"
            />
            {faqSearchQuery && (
              <button
                type="button"
                onClick={() => setFaqSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* FAQ Results */}
        {filteredFaqs.length > 0 ? (
          <div className="space-y-3">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-border bg-card overflow-hidden transition-all shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-4 text-left font-bold text-xs sm:text-sm text-foreground hover:bg-muted/40 transition cursor-pointer gap-2"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0 ml-2 ${
                        isOpen ? "rotate-180 text-primary" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-muted-foreground leading-relaxed border-t border-border/50 animate-in fade-in duration-200">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-2">
            <p className="text-sm font-bold text-foreground">
              Không tìm thấy câu hỏi phù hợp với từ khóa &quot;{faqSearchQuery}&quot;
            </p>
            <p className="text-xs text-muted-foreground">
              Thầy/Cô hãy thử tìm kiếm với các từ khóa khác như &quot;Credits&quot;, &quot;PRO&quot;, &quot;In phiếu&quot;, &quot;VietQR&quot;...
            </p>
            <button
              type="button"
              onClick={() => setFaqSearchQuery("")}
              className="mt-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold transition hover:opacity-90 cursor-pointer"
            >
              Xóa tìm kiếm
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default GuideTab;
