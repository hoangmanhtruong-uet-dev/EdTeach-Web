"use client";

import React, { useState } from "react";
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
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Layers,
  Sigma,
  QrCode,
  Download,
  Smartphone,
  ShieldCheck,
  Check,
} from "lucide-react";
import { SUPPORT_EMAIL } from "@/lib/constants";

const guideTopics = [
  {
    id: "create-exam",
    label: "1. Soạn đề thi AI chuẩn 2025",
    icon: FileText,
    badge: "Cốt lõi",
  },
  {
    id: "shuffle-exam",
    label: "2. Trộn 4 mã đề & Ma trận",
    icon: Shuffle,
    badge: "Mới",
  },
  {
    id: "print-sheet",
    label: "3. In phiếu tô A4 chuẩn",
    icon: Printer,
    badge: "Bộ GD&ĐT",
  },
  {
    id: "ai-grading",
    label: "4. Chấm Camera & Nộp QR",
    icon: Camera,
    badge: "PRO VIP",
  },
  {
    id: "export-score",
    label: "5. Xuất bảng điểm Excel",
    icon: FileSpreadsheet,
    badge: "Báo cáo",
  },
];

const faqs = [
  {
    q: "Mỗi ngày tôi được tạo bao nhiêu đề thi miễn phí?",
    a: "Mỗi tài khoản được cấp sẵn 3 lượt tạo đề thi hoàn toàn miễn phí mỗi ngày (tự động làm mới lúc 00:00). Ngoài ra, khi mới đăng ký tài khoản, Thầy/Cô được tặng thêm 100 Credits trong ví để dự phòng khi cần tạo nhiều đề.",
  },
  {
    q: "Gói PRO có những đặc quyền gì vượt trội so với gói Free?",
    a: "Gói Giáo Viên PRO (149.000đ/tháng) mở khóa 100% tính năng Chấm trắc nghiệm AI qua camera điện thoại, mở khóa tính năng Học sinh tự nộp bài online qua Link & Mã QR, tặng kèm 30.000 Credits tạo đề mỗi tháng và không giới hạn số lượt tạo đề hàng ngày.",
  },
  {
    q: "Làm sao để thanh toán qua cổng PayOS / VietQR?",
    a: "Thầy/Cô vào mục 'Nạp điểm' hoặc bấm nút 'Nâng cấp PRO' ở thanh trên cùng. Hệ thống sẽ tạo mã QR thanh toán động qua PayOS. Thầy/Cô chỉ cần mở App ngân hàng quét mã VietQR và xác nhận chuyển khoản. Hệ thống tự động kích hoạt gói trong vòng 3 - 5 giây.",
  },
  {
    q: "Học sinh nộp bài qua mã QR có cần đăng ký tài khoản không?",
    a: "Không cần! Học sinh chỉ cần dùng điện thoại quét mã QR hoặc bấm vào đường link giáo viên gửi, điền Họ tên, Số báo danh, Lớp và tiến hành làm bài thi trực tiếp trên trình duyệt. Điểm số sẽ tự động đồng bộ vào bảng điểm của giáo viên.",
  },
  {
    q: "Phiếu in trả lời trắc nghiệm có nhận diện chính xác 100% không?",
    a: "Phiếu trả lời được thiết kế theo tỷ lệ chuẩn A4 của Bộ GD&ĐT với các điểm mốc định vị 4 góc. Khi chụp phiếu bằng camera, hệ thống AI tự động cân chỉnh góc nghiêng và đọc đáp án tô bút chì 2B với độ chính xác cao.",
  },
  {
    q: "Tôi cần hỗ trợ kỹ thuật hoặc góp ý tính năng thì liên hệ ở đâu?",
    a: `Thầy/Cô có thể gửi email về hòm thư hỗ trợ chính thức: ${SUPPORT_EMAIL} hoặc tham gia nhóm Zalo Hỗ trợ giáo viên toàn quốc để được giải đáp 24/7.`,
  },
];

export default function GuidePage() {
  const [activeTab, setActiveTab] = useState<string>("create-exam");
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            Cẩm Nang Hướng Dẫn Sử Dụng
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Làm chủ nền tảng EduTest AI
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Tài liệu hướng dẫn trực quan từng bước giúp Thầy/Cô khai thác tối đa sức mạnh của AI trong soạn đề, trộn đề và tự động hóa khâu chấm thi.
          </p>
        </div>

        <Link
          href="/exams/create"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 shadow-sm transition"
        >
          <Sparkles className="w-4 h-4" />
          <span>Thử soạn đề ngay</span>
        </Link>
      </div>

      {/* Main Topics Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {guideTopics.map((topic) => {
          const isActive = activeTab === topic.id;
          const Icon = topic.icon;
          return (
            <button
              key={topic.id}
              onClick={() => setActiveTab(topic.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{topic.label}</span>
              <span
                className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-md ${
                  isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                {topic.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Topic Content Panel */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-6">
        {/* CHUYÊN ĐỀ 1: SOẠN ĐỀ AI */}
        {activeTab === "create-exam" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-border pb-4">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Chuyên đề 1</span>
              <h2 className="text-xl font-bold text-foreground mt-1">
                Soạn đề thi thông minh chuẩn Bộ GD&ĐT 2025
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Tạo đề thi tự động bằng trí tuệ nhân tạo hoặc trích xuất từ văn bản và link web giáo dục.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <h3 className="font-bold text-sm text-foreground">Chọn môn & khối lớp</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tại màn hình Soạn đề, chọn môn học (Toán, Lý, Hóa, Sinh, Sử, Địa, GDCD, Ngoại ngữ...) và khối lớp tương ứng từ lớp 1 đến 12.
                </p>
              </div>

              <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <h3 className="font-bold text-sm text-foreground">Cấu trúc 3 phần 2025</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Bật tùy chọn <strong>Chuẩn Bộ GD&ĐT 2025</strong> để AI tạo đủ: Phần I (Trắc nghiệm 4 lựa chọn), Phần II (Đúng/Sai 4 ý a-b-c-d) và Phần III (Trả lời ngắn).
                </p>
              </div>

              <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <h3 className="font-bold text-sm text-foreground">Biên tập chuyên sâu</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Dùng thanh công cụ Studio để gõ công thức Toán KaTeX, chèn bảng biến thiên, đồ thị hàm số và hình học không gian có sẵn.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-blue-50/70 border border-blue-200 p-4 text-xs text-blue-900 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-primary" /> Mẹo cho Thầy/Cô:
              </p>
              <p>• Thầy/Cô có thể dán trực tiếp một đoạn văn bản đề thi cũ vào ô AI để hệ thống tự động bóc tách thành các câu trắc nghiệm.</p>
              <p>• Tại trang <strong>Soạn đề</strong>, Thầy/Cô có thể dán link các trang giáo dục (như VietJack, Hoc247...) hoặc tải file Word để AI chuyển đổi đề trong 5 giây.</p>
            </div>
          </div>
        )}

        {/* CHUYÊN ĐỀ 2: TRỘN 4 MÃ ĐỀ */}
        {activeTab === "shuffle-exam" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-border pb-4">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Chuyên đề 2</span>
              <h2 className="text-xl font-bold text-foreground mt-1">
                Trộn đề thi tự động ra 4 mã đề & Bảng ma trận đối chiếu
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Giải pháp chống gian lận thi cử hoàn hảo, xuất 1 file Word trọn gói cho toàn phòng thi.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0 mt-0.5">
                  <Shuffle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Bấm nút "Trộn 4 mã đề (.docx)" trên thanh công cụ</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Tại Studio soạn đề, bấm nút màu xanh trên thanh công cụ hoặc vào menu <strong>Tệp $\rightarrow$ Trộn bộ 4 mã đề</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Hoán vị thông minh & Tra cứu ma trận</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Hệ thống sẽ tự động đảo vị trí các câu hỏi trong từng phần, đảo ngẫu nhiên 4 phương án A, B, C, D và tự tính lại đáp án đúng mới. Thầy/Cô có thể bấm vào từng tab <strong>Mã 101, Mã 102, Mã 103, Mã 104</strong> để xem trước.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-700 shrink-0 mt-0.5">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Tải về 1 file Word (.docx) duy nhất</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Bấm <strong>Tải trọn bộ mã đề (.docx)</strong>, file Word tải về đã được phân trang sẵn cho từng mã đề, có tiêu đề trường lớp, dòng họ tên thí sinh và trang cuối cùng là <strong>BẢNG MA TRẬN ĐỐI CHIẾU ĐÁP ÁN</strong> để giáo viên chấm tay hoặc đối chiếu siêu tốc.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CHUYÊN ĐỀ 3: IN PHIẾU TÔ A4 */}
        {activeTab === "print-sheet" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-border pb-4">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Chuyên đề 3</span>
              <h2 className="text-xl font-bold text-foreground mt-1">
                Quy chuẩn In phiếu tô trả lời trắc nghiệm chuẩn A4
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Hướng dẫn in phiếu và dặn dò học sinh tô chì để đạt độ nhận diện 100%.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-2">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Các mẫu phiếu hỗ trợ
                </h3>
                <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                  <li>Phiếu 20 câu: Dành cho bài kiểm tra 15 phút, 1 tiết.</li>
                  <li>Phiếu 40 câu: Dành cho đề thi tốt nghiệp THPT, học kỳ.</li>
                  <li>Phiếu 50 câu: Dành cho đề thi thử đại học.</li>
                  <li>Phiếu chuẩn 2025: Chia rõ 3 phần trắc nghiệm, đúng sai và số.</li>
                </ul>
              </div>

              <div className="rounded-xl border border-border p-4 bg-muted/20 space-y-2">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Printer className="w-4 h-4 text-primary" />
                  Lưu ý khi in ra giấy
                </h3>
                <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                  <li>In trên giấy A4 trắng tiêu chuẩn (định lượng 70gsm trở lên).</li>
                  <li>Tại mục In của trình duyệt, chọn <strong>Scale: 100%</strong> hoặc <strong>Fit to page</strong>.</li>
                  <li>Đảm bảo 4 ô vuông định vị ở 4 góc phiếu không bị mất viền.</li>
                  <li>Dặn học sinh dùng <strong>bút chì 2B hoặc 3B</strong> để tô kín vòng tròn.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* CHUYÊN ĐỀ 4: CHẤM CAMERA & QR */}
        {activeTab === "ai-grading" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-border pb-4">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Chuyên đề 4 (PRO EXCLUSIVE)</span>
              <h2 className="text-xl font-bold text-foreground mt-1">
                Chấm bài tự động qua Camera & Học sinh tự nộp qua QR
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Tự động hóa hoàn toàn khâu chấm thi, không cần chấm tay từng bài.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50/50 p-5 space-y-3">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <Smartphone className="w-4 h-4" />
                  <span>Cách 1: Chấm bằng Camera điện thoại</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tại trang <strong>Chấm trắc nghiệm</strong>, bấm nút <strong>Chấm bài AI</strong> $\rightarrow$ Quét mã QR kết nối điện thoại. Camera điện thoại sẽ biến thành máy quét OMR, chụp đến đâu nhận điểm và phân tích đúng/sai đến đó trong 1 giây.
                </p>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-neutral-50/50 p-5 space-y-3">
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                  <QrCode className="w-4 h-4" />
                  <span>Cách 2: Học sinh tự nộp bài online</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Bấm vào kỳ thi $\rightarrow$ chọn <strong>Tạo link nộp bài</strong>. Chiếu mã QR lên máy chiếu lớp học hoặc gửi link vào nhóm Zalo lớp. Học sinh điền tên, làm bài và nộp trực tiếp. Hệ thống tự cộng điểm vào danh sách lớp.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CHUYÊN ĐỀ 5: XUẤT EXCEL */}
        {activeTab === "export-score" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-border pb-4">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Chuyên đề 5</span>
              <h2 className="text-xl font-bold text-foreground mt-1">
                Xuất bảng điểm lớp file Excel UTF-8 BOM chuẩn Bộ GD&ĐT
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Bảng điểm chuẩn tương thích 100% với VnEdu, SMAS và Microsoft Excel mọi phiên bản.
              </p>
            </div>

            <div className="rounded-xl border border-border p-5 space-y-3 bg-muted/20">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Dữ liệu có trong file Excel tải về:
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-card rounded-lg border border-border text-center font-semibold">
                  Họ tên & Lớp học
                </div>
                <div className="p-3 bg-card rounded-lg border border-border text-center font-semibold">
                  Mã đề thi học sinh làm
                </div>
                <div className="p-3 bg-card rounded-lg border border-border text-center font-semibold text-emerald-600">
                  Điểm số thang 10
                </div>
                <div className="p-3 bg-card rounded-lg border border-border text-center font-semibold">
                  Số câu đúng / sai / bỏ
                </div>
              </div>
              <p className="text-xs text-muted-foreground pt-2">
                Thầy/Cô chỉ cần bấm nút <strong>Xuất Excel bảng điểm</strong> ở góc phải màn hình chi tiết kỳ thi là file tự động tải về máy.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* FAQ SECTION */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Câu hỏi thường gặp (FAQ)</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIdx === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-border bg-card overflow-hidden transition-all shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left font-bold text-sm text-foreground hover:bg-muted/40 transition cursor-pointer"
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
      </div>
    </div>
  );
}
