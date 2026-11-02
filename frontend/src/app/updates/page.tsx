"use client";

import { useToast } from "@/context/toast-context";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Video,
  Gamepad2,
  FileSpreadsheet,
  Bot,
  PenTool,
  FileText,
  Users,
  Bell,
  ShieldCheck,
  FileCode,
  CheckCircle2,
  ArrowRight,
  Clock,
  Zap,
  Check,
  Flame,
  Layers,
  Send,
  Star,
  BookOpen,
  Cpu,
  Columns2,
  Presentation,
  CheckCheck,
  AlertCircle,
  HelpCircle,
  ChevronRight,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

interface FeatureIdea {
  id: string;
  category: "teaching" | "assessment" | "management";
  title: string;
  badge: string;
  badgeColor: string;
  icon: any;
  iconBg: string;
  iconColor: string;
  summary: string;
  highlights: string[];
  solvedPain: string;
  timeline: string;
}

const FEATURE_IDEAS: FeatureIdea[] = [
  {
    id: "live-classroom",
    category: "teaching",
    title: "Lớp Học Trực Tuyến Tương Tác Sâu (EdTeach Live Classroom)",
    badge: "Tính năng Trọng tâm",
    badgeColor: "bg-red-500/10 text-red-600 border-red-200 dark:border-red-900",
    icon: Video,
    iconBg: "bg-red-500/10",
    iconColor: "text-red-600",
    summary:
      "Phòng học ảo chuẩn WebRTC độ trễ siêu thấp tích hợp liền mạch với Bục Giảng Số 4.0. Thầy cô chiếu đề, vẽ trên bảng nháp hay xoay mô hình thí nghiệm 3D, học sinh quan sát con trỏ laser và tương tác thời gian thực.",
    highlights: [
      "Đồng bộ bảng vẽ tương tác 2 chiều (Excalidraw Live Sync) giữa giáo viên và học sinh",
      "Pop-up câu hỏi trắc nghiệm kiểm tra tức thì 30s giữa tiết giảng, đếm ngược tự động",
      "Nút giơ tay phát biểu kèm hệ thống bấm chuông giành quyền trả lời (Buzzer)",
      "Lưu video buổi dạy và xuất toàn bộ nét vẽ/ghi chú thành file PDF sau buổi học",
    ],
    solvedPain: "Khắc phục triệt để tình trạng dạy qua Zoom/Meet học sinh mất tập trung, không tương tác được với bài toán đồ thị và thí nghiệm 3D.",
    timeline: "Giai đoạn Alpha Q1/2026",
  },
  {
    id: "quiz-arena",
    category: "teaching",
    title: "Đấu Trường Đố Vui Thời Gian Thực (Live Quiz Arena)",
    badge: "Gamification",
    badgeColor: "bg-amber-500/10 text-amber-700 border-amber-200",
    icon: Gamepad2,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600",
    summary:
      "Biến mọi đề thi đã soạn trên EdTeach thành phòng game show trắc nghiệm đối kháng thời gian thực như Kahoot/Quizizz nhưng tối ưu 100% cho đề thi Toán, Lý, Hóa Việt Nam.",
    highlights: [
      "Học sinh quét mã QR bằng điện thoại thông minh tham gia ngay, không cần đăng ký tài khoản",
      "Hiển thị bảng vàng Top 5 điểm cao nhất theo thời gian thực kèm hiệu ứng âm thanh kịch tính",
      "Hỗ trợ gõ công thức Toán KaTeX chuẩn nét trên màn hình điện thoại học sinh",
      "Báo cáo ngay 'Top 3 câu học sinh bị lừa nhiều nhất' để giáo viên giải thích tức thì",
    ],
    solvedPain: "Học sinh hào hứng ôn tập đầu giờ hoặc củng cố kiến thức cuối tiết mà giáo viên không tốn công nhập thủ công sang nền tảng ngoài.",
    timeline: "Dự kiến ra mắt Q1/2026",
  },
  {
    id: "smart-gradebook",
    category: "management",
    title: "Sổ Điểm Tự Động & Thống Kê Phổ Điểm Chuẩn SMAS / VnEdu",
    badge: "Tối ưu Quản lý",
    badgeColor: "bg-blue-500/10 text-blue-700 border-blue-200",
    icon: FileSpreadsheet,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-600",
    summary:
      "Tự động tập hợp điểm số từ bài chấm thi OMR quang học, bài thi online và bài kiểm tra trên lớp vào sổ điểm điện tử theo từng lớp học, xuất Excel chuẩn mẫu Bộ GD&ĐT.",
    highlights: [
      "1-Click xuất file Excel cấu trúc chuẩn cột điểm để nhập thẳng vào phần mềm SMAS hoặc VnEdu",
      "Vẽ biểu đồ phổ điểm hình chuông, tự động phân loại học lực: Giỏi, Khá, Đạt, Chưa đạt",
      "Radar đánh giá 5 phẩm chất & 10 năng lực cốt lõi theo đúng chương trình GDPT 2018/2025",
      "Cảnh báo thông minh các học sinh có xu hướng giảm sút điểm số qua 3 bài gần nhất",
    ],
    solvedPain: "Chấm dứt cảnh giáo viên ngồi gõ tay từng con điểm vào Excel rồi copy thủ công vào cổng thông tin trường học.",
    timeline: "Đang thử nghiệm nội bộ",
  },
  {
    id: "socratic-ai-tutor",
    category: "teaching",
    title: "AI Gia Sư 1-kèm-1 Theo Phương Pháp Socratic",
    badge: "Trí Tuệ Nhân Tạo",
    badgeColor: "bg-purple-500/10 text-purple-700 border-purple-200",
    icon: Bot,
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-600",
    summary:
      "Trợ lý gia sư AI đồng hành cùng học sinh khi làm bài tập về nhà. Khi gặp câu khó hoặc làm sai, AI gợi mở từng bước tư duy (Scaffolding), hướng dẫn học sinh tự tìm ra cách giải chứ không mớm đáp án.",
    highlights: [
      "Phương pháp vấn đáp Socrates: Hỏi ngược lại kiến thức nền tảng để học sinh tự bứt phá",
      "Tự động sinh 2 câu hỏi biến thể tương đương để học sinh tự làm lại kiểm chứng",
      "Giọng văn sư phạm gần gũi, khích lệ tinh thần học tập, hạn chế phụ thuộc AI gian lận",
      "Báo cáo lịch sử trao đổi của học sinh gửi về bảng điều khiển của giáo viên bộ môn",
    ],
    solvedPain: "Giáo viên không thể trực tiếp trả lời tin nhắn hỏi bài của 40-50 học sinh mỗi tối.",
    timeline: "Kế hoạch Q2/2026",
  },
  {
    id: "ai-handwriting-essay",
    category: "assessment",
    title: "AI Chấm Tự Luận & Nhận Diện Chữ Viết Tay Tiếng Việt",
    badge: "Công Nghệ Đột Phá",
    badgeColor: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
    icon: PenTool,
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600",
    summary:
      "Học sinh làm bài tự luận trên giấy, chụp ảnh nộp qua link Web; AI Vision OCR nhận diện chính xác nét chữ viết tay tiếng Việt và ký hiệu Toán/Lý/Hóa, đối chiếu barem điểm của giáo viên để chấm chi tiết từng bước.",
    highlights: [
      "Nhận diện chữ viết tay và biểu thức công thức phân số, tích phân, căn bậc hai phức tạp",
      "Chấm điểm từng ý theo Barem điểm chi tiết của Bộ GD&ĐT (0.25đ - 0.5đ mỗi bước)",
      "Khoanh đỏ chỗ sai trực tiếp lên hình ảnh bài làm của học sinh kèm lời nhận xét sư phạm",
      "Giáo viên có bảng duyệt lại điểm trước khi chốt kết quả và công bố cho lớp",
    ],
    solvedPain: "Giáo viên Ngữ văn, Toán và KHTN mất hàng chục tiếng đồng hồ chấm bài tự luận mỗi kỳ kiểm tra giữa kỳ, học kỳ.",
    timeline: "Nghiên cứu & Thử nghiệm R&D",
  },
  {
    id: "lesson-plan-5512",
    category: "management",
    title: "Trợ Lý Soạn Kế Hoạch Bài Dạy Chuẩn Công Văn 5512",
    badge: "Hành Chính Sư Phạm",
    badgeColor: "bg-indigo-500/10 text-indigo-700 border-indigo-200",
    icon: FileText,
    iconBg: "bg-indigo-500/10",
    iconColor: "text-indigo-600",
    summary:
      "Tự động khởi tạo giáo án chuẩn quy chuẩn Công văn 5512/BGDĐT-GDTrH: Mục tiêu (Kiến thức, Năng lực, Phẩm chất), Thiết bị dạy học và Tiến trình dạy học gồm 4 hoạt động chuẩn mực.",
    highlights: [
      "Phân chia chuẩn 4 hoạt động: Khởi động ➔ Hình thành kiến thức ➔ Luyện tập ➔ Vận dụng",
      "Tự động liên kết câu hỏi từ đề thi đã tạo và mô hình phòng thí nghiệm 3D vào hoạt động học",
      "Xuất file Word (.docx) định dạng bảng kẻ chuẩn chỉnh, có sẵn mục ký duyệt của Ban giám hiệu",
      "Hỗ trợ cả 3 bộ sách giáo khoa mới: Kết Nối Tri Thức, Cánh Diều, Chân Trời Sáng Tạo",
    ],
    solvedPain: "Giáo viên không còn phải thức trắng đêm copy-paste giáo án và canh chỉnh bảng kẻ Word đối phó kiểm tra chuyên môn.",
    timeline: "Dự kiến ra mắt Q1/2026",
  },
  {
    id: "school-workspace",
    category: "management",
    title: "Không Gian Cộng Tác Tổ Chuyên Môn & Ngân Hàng Đề Trường",
    badge: "Dành Cho Trường Học",
    badgeColor: "bg-sky-500/10 text-sky-700 border-sky-200",
    icon: Users,
    iconBg: "bg-sky-500/10",
    iconColor: "text-sky-600",
    summary:
      "Môi trường số hóa dành cho Tổ chuyên môn nhà trường: Giáo viên cùng đóng góp câu hỏi, phản biện duyệt đề thi chéo, tạo ngân hàng câu hỏi dùng chung toàn trường có phân quyền bảo mật.",
    highlights: [
      "Phân quyền rõ ràng: Tổ trưởng chuyên môn duyệt đề ➔ Giáo viên bộ môn soạn và sử dụng",
      "Ngân hàng đề thi phân loại theo ma trận cấp độ nhận thức dùng chung cho toàn khối",
      "Theo dõi lịch sử chỉnh sửa đề thi, phục hồi các phiên bản câu hỏi cũ dễ dàng",
      "Xuất đề thi đồng loạt cho các phòng thi kèm ma trận tráo mã đề đồng bộ",
    ],
    solvedPain: "Tránh tình trạng câu hỏi bị trùng lặp, rò rỉ đề thi hoặc các thầy cô trong cùng tổ bộ môn không có công cụ chia sẻ tài nguyên số chung.",
    timeline: "Giai đoạn Alpha Q2/2026",
  },
  {
    id: "parent-portal",
    category: "management",
    title: "Cổng Thông Báo Phụ Huynh Qua Zalo ZNS Tự Động",
    badge: "Kết Nối Gia Đình",
    badgeColor: "bg-teal-500/10 text-teal-700 border-teal-200",
    icon: Bell,
    iconBg: "bg-teal-500/10",
    iconColor: "text-teal-600",
    summary:
      "Tự động gửi thông báo kết quả bài kiểm tra, biểu đồ tiến độ học tập và lời khuyên bồi dưỡng của giáo viên/AI trực tiếp đến Zalo của phụ huynh chỉ bằng 1 nút bấm.",
    highlights: [
      "Gửi tin nhắn Zalo ZNS chính thức, phụ huynh không cần cài thêm ứng dụng phức tạp",
      "Báo cáo trực quan: Điểm số, thứ hạng trong lớp, dạng toán con đang yếu cần rèn thêm",
      "Tính năng gửi thư khen ngợi tự động khi học sinh có bước tiến vượt bậc",
      "Kênh tiếp nhận phản hồi nhanh giữa phụ huynh và giáo viên chủ nhiệm/bộ môn",
    ],
    solvedPain: "Giáo viên không phải tốn hàng giờ nhắn tin gọi điện cho từng phụ huynh sau mỗi kỳ thi khảo sát.",
    timeline: "Kế hoạch Q2/2026",
  },
  {
    id: "anti-cheat-proctor",
    category: "assessment",
    title: "Chế Độ Chống Gian Lận Độc Quyền (Smart Lockdown)",
    badge: "Bảo Mật Khảo Thí",
    badgeColor: "bg-rose-500/10 text-rose-700 border-rose-200",
    icon: ShieldCheck,
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-600",
    summary:
      "Bảo đảm tính công bằng tuyệt đối cho các bài kiểm tra trực tuyến: Khóa màn hình làm bài toàn phần (Kiosk Lockdown), kết hợp AI Vision giám sát qua camera phát hiện hành vi gian lận.",
    highlights: [
      "Khóa toàn màn hình: Cảnh báo và tự động nộp bài nếu học sinh mở tab mới hoặc chia màn hình",
      "AI Camera thông minh phát hiện: Có người thứ 2 xuất hiện, quay mặt ra ngoài quá 5 giây",
      "Vô hiệu hóa phím tắt chụp màn hình, chuột phải, copy-paste câu hỏi lên Google/ChatGPT",
      "Nhật ký giám thị chi tiết ghi lại từng giây hành vi bất thường kèm ảnh chụp bằng chứng",
    ],
    solvedPain: "Giải quyết triệt để nỗi lo học sinh tra cứu tài liệu hoặc nhờ người làm hộ khi tổ chức kiểm tra online.",
    timeline: "Dự kiến ra mắt Q2/2026",
  },
  {
    id: "legacy-converter",
    category: "teaching",
    title: "Số Hóa & Phục Chế Đề Thi Cũ (Legacy Word/PDF to Exam)",
    badge: "Công Cụ Tiện Ích",
    badgeColor: "bg-orange-500/10 text-orange-700 border-orange-200",
    icon: FileCode,
    iconBg: "bg-orange-500/10",
    iconColor: "text-orange-600",
    summary:
      "Chỉ cần tải lên file Word tài liệu cũ bị lỗi font (VNI, TCVN3, MathType cũ) hoặc file PDF scan mờ, AI sẽ tự động sửa font Unicode, bóc tách câu hỏi, dựng lại công thức KaTeX và đưa vào Exam Studio.",
    highlights: [
      "Chuyển đổi hoàn hảo font VNI-Times, .VnTime cổ xưa sang Unicode chuẩn UTF-8",
      "Nhận diện công thức MathType cũ bị biến thành ảnh và chuyển đổi thành KaTeX sắc nét",
      "Bóc tách riêng biệt Đề bài, 4 phương án, Đáp án đúng và Lời giải thích",
      "Cho phép chỉnh sửa, tráo mã đề hoặc xuất lại Word chuẩn GDPT 2025 ngay lập tức",
    ],
    solvedPain: "Giáo viên sở hữu kho tư liệu đề thi nhiều năm nhưng không thể tận dụng vì lỗi font chữ hoặc định dạng cũ kỹ.",
    timeline: "Dự kiến ra mắt Q1/2026",
  },
];

const FIXES_LIST = [
  {
    title: "Tốc Độ Sinh Đề AI Dual-Agent",
    v1: "Thời gian xử lý trung bình 30 - 45 giây/đề; đôi khi học sinh/giáo viên phải chờ đợi lâu.",
    v2: "Công nghệ Turbo Streaming < 8 giây; tối ưu mô hình Gemini 2.0 Flash & Gemini 2.0 Thinking với độ chính xác học thuật cao.",
    icon: Zap,
  },
  {
    title: "Độ Chuẩn Xác Ma Trận Barem GDPT 2025",
    v1: "Đôi lúc xảy ra tình trạng làm tròn điểm phần Đúng/Sai (Phần II) chưa hoàn toàn khớp với barem mẫu của một số Sở.",
    v2: "Engine Ma trận Barem Thông minh: Tự động cân đối điểm 100% chuẩn quy chế Bộ GD&ĐT (1 ý: 0.1đ, 2 ý: 0.25đ, 3 ý: 0.5đ, 4 ý: 1đ).",
    icon: CheckCheck,
  },
  {
    title: "Bục Giảng Số 4.0 Trên Màn Hình Máy Chiếu",
    v1: "Giao diện web thông thường đôi khi hiện thanh cuộn và thanh địa chỉ trình duyệt gây vướng mắt.",
    v2: "Chế độ Kiosk Toàn Màn Hình 1 chạm (Full-Screen Immersive) tối ưu độ phân giải 4K cho Tivi cường lực & Bảng tương tác.",
    icon: Presentation,
  },
  {
    title: "Quét Chấm Thi OMR Bằng Điện Thoại",
    v1: "Cần căn góc chụp chuẩn, dễ bị bóng đèn tuýp lớp học hoặc nếp nhăn giấy gây sai lệch.",
    v2: "AI Vision Auto-Align 2.0: Tự động khử bóng lóa, tự làm phẳng giấy cong vênh, quét siêu tốc 0.3s/bài không cần căn chỉnh.",
    icon: CheckCircle2,
  },
  {
    title: "Xuất File Word (.docx) Chuẩn Quy Cách",
    v1: "Bảng ma trận và một số hình vẽ vector đôi khi cần chỉnh lại lề thủ công trên các bản Office cũ.",
    v2: "Bộ Stylesheet Native Word độc quyền: Tương thích 100% từ Word 2010 đến Microsoft 365, giữ nguyên font Times New Roman và hình vẽ sắc nét.",
    icon: FileText,
  },
];

export default function UpdatesPage() {
  const [selectedCategory, setSelectedCategory] = useState<"all" | "teaching" | "assessment" | "management">("all");
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    subject: "Toán học",
    favoriteFeature: "live-classroom",
    feedback: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const { showToast } = useToast();

  const filteredFeatures = FEATURE_IDEAS.filter((feat) => {
    if (selectedCategory === "all") return true;
    return feat.category === selectedCategory;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone) {
      showToast("Vui lòng điền đầy đủ Họ tên và Số điện thoại / Zalo để nhận thư mời trải nghiệm!", "warning");
      return;
    }

    try {
      const existing = JSON.parse(localStorage.getItem("edteach_early_access_registrations") || "[]");
      existing.push({
        ...formData,
        submittedAt: new Date().toISOString(),
      });
      localStorage.setItem("edteach_early_access_registrations", JSON.stringify(existing));
    } catch (err) {
      console.warn("Local storage write error:", err);
    }

    setSubmitted(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#ebf3fb]">
      <Navbar />

      <main className="flex-1">
        {/* ================= 1. HERO HEADER ================= */}
        <section className="relative overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-24 border-b border-blue-200/60 bg-linear-to-b from-blue-100/70 via-background/50 to-background">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 border border-slate-700/80 px-4 py-1.5 text-xs text-white shadow-lg shadow-blue-900/10">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-bold text-amber-300">LỘ TRÌNH NÂNG CẤP CHÍNH THỨC</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-200">Chuẩn GDPT 2018 & 2025</span>
            </div>

            {/* Main Title */}
            <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl leading-[1.15] max-w-4xl mx-auto">
              EdTeach{" "}
              <span className="bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                v2.0.0 Official
              </span>
              <br />
              Hoàn Thiện Bục Giảng Số & Lớp Học Thông Minh
            </h1>

            {/* Subtitle */}
            <p className="mx-auto max-w-3xl text-base text-neutral-600 sm:text-lg leading-relaxed">
              Bản thử nghiệm <strong>v1.0.0 Beta</strong> đã hỗ trợ hàng nghìn thầy cô giáo tạo đề và trình chiếu thành công. Với bản chính thức <strong>v2.0.0</strong>, EdTeach hoàn thiện triệt để mọi thiếu sót, đồng thời ra mắt hệ sinh thái <strong>10 siêu tính năng đột phá</strong> — trong đó có <strong>Lớp học trực tuyến tương tác cao</strong> và <strong>Đấu trường Live Quiz thời gian thực</strong>.
            </p>

            {/* Quick Stats or Highlights */}
            <div className="grid grid-cols-2 gap-3 pt-4 sm:grid-cols-4 max-w-3xl mx-auto">
              <div className="rounded-xl border border-blue-200/80 bg-white/90 p-3 shadow-xs">
                <div className="text-xl sm:text-2xl font-black text-blue-600">100%</div>
                <div className="text-xs text-neutral-600 font-medium">Khắc phục tồn đọng v1.0</div>
              </div>
              <div className="rounded-xl border border-blue-200/80 bg-white/90 p-3 shadow-xs">
                <div className="text-xl sm:text-2xl font-black text-indigo-600">10+</div>
                <div className="text-xs text-neutral-600 font-medium">Tính năng mới v2.0.0</div>
              </div>
              <div className="rounded-xl border border-blue-200/80 bg-white/90 p-3 shadow-xs">
                <div className="text-xl sm:text-2xl font-black text-emerald-600">&lt; 8s</div>
                <div className="text-xs text-neutral-600 font-medium">Tốc độ AI Turbo Stream</div>
              </div>
              <div className="rounded-xl border border-blue-200/80 bg-white/90 p-3 shadow-xs">
                <div className="text-xl sm:text-2xl font-black text-purple-600">Miễn phí</div>
                <div className="text-xs text-neutral-600 font-medium">Ưu tiên thử nghiệm sớm</div>
              </div>
            </div>

            {/* CTA jump buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <a
                href="#features-showcase"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:scale-[1.02]"
              >
                <Sparkles className="h-4 w-4" />
                <span>Khám phá 10 tính năng mới</span>
              </a>
              <a
                href="#improvements"
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-neutral-300 bg-white px-5 text-sm font-bold text-neutral-800 transition-colors hover:bg-neutral-50 shadow-xs"
              >
                <CheckCheck className="h-4 w-4 text-emerald-600" />
                <span>Xem cải tiến từ v1.0.0</span>
              </a>
              <a
                href="#early-access"
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-5 text-sm font-bold text-amber-900 transition-colors hover:bg-amber-100 shadow-xs"
              >
                <Star className="h-4 w-4 text-amber-600 fill-amber-500" />
                <span>Đăng ký Early Access</span>
              </a>
            </div>
          </div>
        </section>

        {/* ================= 2. KHỐI 1: KHẮC PHỤC THIẾU SÓT BẢN V1.0.0 ================= */}
        <section id="improvements" className="py-16 sm:py-20 bg-white scroll-mt-14 border-b border-neutral-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 px-3.5 py-1 text-xs font-black uppercase tracking-wider">
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                Hoàn Thiện Chất Lượng Cốt Lõi
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight text-neutral-900 sm:text-3xl lg:text-4xl">
                Bản v2.0.0 khắc phục những thiếu sót nào của v1.0.0?
              </h2>
              <p className="text-sm sm:text-base text-neutral-600">
                Lắng nghe trực tiếp hàng nghìn ý kiến đóng góp từ các thầy cô trong giai đoạn thử nghiệm 14 ngày Beta v1.0.0, đội ngũ kỹ sư EdTeach đã tối ưu hóa toàn diện:
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {FIXES_LIST.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={index}
                    className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-6 space-y-4 hover:border-blue-400 hover:shadow-md transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <h3 className="text-base font-bold text-neutral-900 leading-snug">
                        {item.title}
                      </h3>
                    </div>

                    <div className="space-y-3 text-xs leading-relaxed">
                      {/* v1.0 */}
                      <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-3 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-amber-800">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Thiếu sót ở v1.0.0 Beta:</span>
                        </div>
                        <p className="text-neutral-700">{item.v1}</p>
                      </div>

                      {/* v2.0 */}
                      <div className="rounded-xl border border-emerald-200/90 bg-emerald-50/80 p-3 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Đột phá ở v2.0.0 Official:</span>
                        </div>
                        <p className="text-neutral-800 font-medium">{item.v2}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================= 3. KHỐI 2: 10 TÍNH NĂNG MỚI CHO BẢN V2.0.0 ================= */}
        <section id="features-showcase" className="py-16 sm:py-24 bg-[#ebf3fb] scroll-mt-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 text-white px-3.5 py-1 text-xs font-black uppercase tracking-wider shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Hệ Sinh Thái Đột Phá
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl">
                10 Ý Tưởng Tính Năng Flagship Cho Bản v2.0.0
              </h2>
              <p className="text-base text-neutral-600">
                Từ nhu cầu thực tế của các tiết học hiện đại, EdTeach v2.0.0 mở rộng thành hệ sinh thái toàn diện: Lớp học trực tuyến tương tác, Đấu trường game thi đấu, Sổ điểm tự động và AI chấm viết tay.
              </p>

              {/* Category Filter Tabs */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs ${
                    selectedCategory === "all"
                      ? "bg-primary text-white shadow-md"
                      : "bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200"
                  }`}
                >
                  Tất cả tính năng ({FEATURE_IDEAS.length})
                </button>
                <button
                  onClick={() => setSelectedCategory("teaching")}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs ${
                    selectedCategory === "teaching"
                      ? "bg-primary text-white shadow-md"
                      : "bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200"
                  }`}
                >
                  Giảng dạy & Lớp học
                </button>
                <button
                  onClick={() => setSelectedCategory("assessment")}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs ${
                    selectedCategory === "assessment"
                      ? "bg-primary text-white shadow-md"
                      : "bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200"
                  }`}
                >
                  Khảo thí & Chấm điểm
                </button>
                <button
                  onClick={() => setSelectedCategory("management")}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs ${
                    selectedCategory === "management"
                      ? "bg-primary text-white shadow-md"
                      : "bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200"
                  }`}
                >
                  Quản lý & Học liệu
                </button>
              </div>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid gap-6 md:grid-cols-2">
              {filteredFeatures.map((feat, index) => {
                const IconComponent = feat.icon;
                return (
                  <div
                    key={feat.id}
                    className="flex flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-6 sm:p-7 shadow-xs hover:shadow-lg hover:border-blue-400 transition-all group"
                  >
                    <div className="space-y-4">
                      {/* Header with icon + badges */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-12 h-12 rounded-2xl ${feat.iconBg} ${feat.iconColor} flex items-center justify-center shrink-0 shadow-xs group-hover:scale-110 transition-transform`}
                          >
                            <IconComponent className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                              Ý TƯỞNG #{index + 1}
                            </span>
                            <h3 className="text-lg font-bold text-neutral-900 group-hover:text-blue-600 transition-colors">
                              {feat.title}
                            </h3>
                          </div>
                        </div>
                      </div>

                      {/* Badges row */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-md border px-2.5 py-0.5 text-xs font-bold ${feat.badgeColor}`}>
                          {feat.badge}
                        </span>
                        <span className="rounded-md bg-neutral-100 text-neutral-600 border border-neutral-200 px-2.5 py-0.5 text-xs font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 text-neutral-500" />
                          {feat.timeline}
                        </span>
                      </div>

                      {/* Summary */}
                      <p className="text-sm text-neutral-600 leading-relaxed">
                        {feat.summary}
                      </p>

                      {/* Highlights checklist */}
                      <div className="rounded-xl bg-neutral-50 border border-neutral-200/80 p-3.5 space-y-2">
                        <div className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                          Đặc điểm nổi bật:
                        </div>
                        <ul className="space-y-1.5">
                          {feat.highlights.map((point, pIdx) => (
                            <li key={pIdx} className="text-xs text-neutral-700 flex items-start gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Solved pain */}
                      <div className="text-xs text-neutral-500 italic bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
                        💡 <strong>Giải quyết:</strong> {feat.solvedPain}
                      </div>
                    </div>

                    {/* Bottom CTA / Vote */}
                    <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center justify-between">
                      <span className="text-xs text-neutral-400 font-medium">Bản quyền thiết kế EdTeach v2.0</span>
                      <a
                        href="#early-access"
                        onClick={() => setFormData({ ...formData, favoriteFeature: feat.id })}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 group/link"
                      >
                        <span>Bình chọn tính năng này</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================= 4. KHỐI 3: BẢNG SO SÁNH QUYỀN LỢI GÓI CƯỚC V2.0 ================= */}
        <section className="py-16 sm:py-20 bg-white border-y border-neutral-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 text-purple-800 px-3.5 py-1 text-xs font-black uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5 text-purple-600" />
                Quyền Lợi & Phân Quyền
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight text-neutral-900 sm:text-3xl lg:text-4xl">
                Cơ Cấu Tính Năng Theo Gói Cước v2.0.0
              </h2>
              <p className="text-sm sm:text-base text-neutral-600">
                Chính sách rõ ràng, minh bạch giúp thầy cô cá nhân hoặc trường học dễ dàng lựa chọn gói cước phù hợp.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
              {/* FREE Tier */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="inline-block rounded-md bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-700 uppercase">
                    Gói Miễn Phí (Starter)
                  </div>
                  <div>
                    <div className="text-2xl font-black text-neutral-900">0 VNĐ</div>
                    <div className="text-xs text-neutral-500">Dành cho giáo viên mới làm quen</div>
                  </div>
                  <ul className="space-y-2 text-xs text-neutral-600">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" /> Soạn đề AI cơ bản (5 đề/tháng)
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" /> Trộn 4 mã đề & Xuất Word cơ bản
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" /> Chấm OMR qua Webcam miễn phí
                    </li>
                    <li className="flex items-center gap-2 text-neutral-400">
                      <span className="w-4 h-4 flex items-center justify-center font-bold">✕</span> Lớp học trực tuyến Live Sync
                    </li>
                    <li className="flex items-center gap-2 text-neutral-400">
                      <span className="w-4 h-4 flex items-center justify-center font-bold">✕</span> AI Chấm tự luận viết tay
                    </li>
                  </ul>
                </div>
                <Link
                  href="/register"
                  className="w-full text-center py-2.5 rounded-xl border border-neutral-300 font-bold text-xs text-neutral-700 hover:bg-neutral-50"
                >
                  Bắt đầu miễn phí
                </Link>
              </div>

              {/* PRO Tier */}
              <div className="relative rounded-2xl border-2 border-blue-600 bg-blue-50/30 p-6 space-y-5 flex flex-col justify-between shadow-md">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                  Phổ biến nhất
                </div>
                <div className="space-y-4">
                  <div className="inline-block rounded-md bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800 uppercase">
                    Gói Giáo Viên PRO
                  </div>
                  <div>
                    <div className="text-2xl font-black text-neutral-900">149.000đ <span className="text-xs font-normal text-neutral-500">/tháng</span></div>
                    <div className="text-xs text-blue-700 font-medium">Toàn quyền bục giảng số & lớp học</div>
                  </div>
                  <ul className="space-y-2 text-xs text-neutral-700">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-600 font-bold" /> Toàn bộ quyền lợi gói Starter
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-600 font-bold" /> Bục giảng số Split-Screen & Kính vẽ
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-600 font-bold" /> Đấu trường Quiz Arena thời gian thực
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-600 font-bold" /> Sổ điểm tự động xuất Excel SMAS/VnEdu
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-600 font-bold" /> Soạn giáo án chuẩn Công văn 5512
                    </li>
                  </ul>
                </div>
                <Link
                  href="/register"
                  className="w-full text-center py-2.5 rounded-xl bg-blue-600 font-bold text-xs text-white hover:bg-blue-700 shadow-sm"
                >
                  Dùng thử 14 ngày Pro
                </Link>
              </div>

              {/* MAX Tier */}
              <div className="rounded-2xl border border-amber-300 bg-amber-50/30 p-6 space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="inline-block rounded-md bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 uppercase">
                    Gói MAX & Trường Học
                  </div>
                  <div>
                    <div className="text-2xl font-black text-neutral-900">Liên hệ <span className="text-xs font-normal text-neutral-500">/theo quy mô</span></div>
                    <div className="text-xs text-amber-800 font-medium">Dành cho Tổ bộ môn & Trường học</div>
                  </div>
                  <ul className="space-y-2 text-xs text-neutral-700">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-amber-600 font-bold" /> Toàn bộ quyền lợi gói PRO
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-amber-600 font-bold" /> Không gian làm việc chung Tổ chuyên môn
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-amber-600 font-bold" /> Lớp học trực tuyến Live Classroom HD
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-amber-600 font-bold" /> AI Chấm bài tự luận viết tay & Báo cáo Zalo
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-amber-600 font-bold" /> Hỗ trợ kỹ thuật 1-kèm-1 & Ký hợp đồng
                    </li>
                  </ul>
                </div>
                <a
                  href="#early-access"
                  className="w-full text-center py-2.5 rounded-xl border border-amber-400 bg-amber-100 font-bold text-xs text-amber-900 hover:bg-amber-200"
                >
                  Đăng ký tư vấn trường
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 5. KHỐI 4: FORM ĐĂNG KÝ EARLY ACCESS & GÓP Ý ================= */}
        <section id="early-access" className="py-16 sm:py-24 bg-linear-to-b from-[#ebf3fb] to-white scroll-mt-14">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-blue-200 bg-white p-8 sm:p-12 shadow-xl space-y-8">
              <div className="text-center space-y-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-800 px-3.5 py-1 text-xs font-black uppercase tracking-wider">
                  <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                  Đặc Quyền Giáo Viên Tiên Phong
                </span>
                <h2 className="text-2xl font-extrabold tracking-tight text-neutral-900 sm:text-3xl">
                  Đăng Ký Nhận Vé Trải Nghiệm Sớm EdTeach v2.0.0
                </h2>
                <p className="text-sm sm:text-base text-neutral-600 max-w-2xl mx-auto">
                  Các thầy cô đăng ký hôm nay sẽ được <strong>tặng thêm 30 ngày sử dụng gói PRO/MAX v2.0.0 chính thức hoàn toàn miễn phí</strong> ngay khi ra mắt, kèm quyền tham gia nhóm Zalo cố vấn tính năng trực tiếp cùng đội ngũ phát triển.
                </p>
              </div>

              {submitted ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-emerald-900">
                    Đăng Ký Thành Công! Cảm Ơn Thầy/Cô {formData.fullName}
                  </h3>
                  <p className="text-sm text-emerald-700 max-w-md mx-auto">
                    Hệ thống đã ghi nhận thông tin của Thầy/Cô. Đội ngũ EdTeach sẽ liên hệ qua số điện thoại/Zalo <strong>{formData.phone}</strong> để cấp tài khoản VIP thử nghiệm sớm bản v2.0.0!
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => setSubmitted(false)}
                      className="text-xs font-bold text-emerald-800 underline hover:text-emerald-900"
                    >
                      Gửi thêm góp ý khác
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    {/* Họ và tên */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                        Họ và Tên Giáo Viên <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="Thầy/Cô Nguyễn Văn A..."
                        className="w-full rounded-xl border border-neutral-300 bg-neutral-50/50 px-4 py-3 text-sm text-neutral-900 focus:border-blue-500 focus:bg-white focus:outline-hidden"
                      />
                    </div>

                    {/* Số điện thoại / Zalo */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                        Số Điện Thoại / Zalo <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="0987xxxxxx (để nhận mã kích hoạt sớm)..."
                        className="w-full rounded-xl border border-neutral-300 bg-neutral-50/50 px-4 py-3 text-sm text-neutral-900 focus:border-blue-500 focus:bg-white focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    {/* Môn giảng dạy */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                        Môn Giảng Dạy & Cấp Học
                      </label>
                      <select
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full rounded-xl border border-neutral-300 bg-neutral-50/50 px-4 py-3 text-sm text-neutral-900 focus:border-blue-500 focus:bg-white focus:outline-hidden"
                      >
                        <option value="Toán học">Toán học (THCS / THPT)</option>
                        <option value="Vật lý">Vật lý (KHTN / THPT)</option>
                        <option value="Hóa học">Hóa học (KHTN / THPT)</option>
                        <option value="Sinh học">Sinh học (KHTN / THPT)</option>
                        <option value="Tiếng Anh">Tiếng Anh</option>
                        <option value="Ngữ văn">Ngữ văn</option>
                        <option value="Lịch sử - Địa lý">Lịch sử & Địa lý</option>
                        <option value="Khác">Môn học khác / Ban Giám Hiệu</option>
                      </select>
                    </div>

                    {/* Tính năng mong đợi nhất */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                        Tính Năng v2.0 Thầy/Cô Hóng Nhất?
                      </label>
                      <select
                        value={formData.favoriteFeature}
                        onChange={(e) => setFormData({ ...formData, favoriteFeature: e.target.value })}
                        className="w-full rounded-xl border border-neutral-300 bg-neutral-50/50 px-4 py-3 text-sm text-neutral-900 focus:border-blue-500 focus:bg-white focus:outline-hidden"
                      >
                        {FEATURE_IDEAS.map((feat) => (
                          <option key={feat.id} value={feat.id}>
                            {feat.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Feedback / Đóng góp ý tưởng */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                      Ý Kiến Đóng Góp Thêm Cho Phiên Bản v2.0.0 (Tùy chọn)
                    </label>
                    <textarea
                      rows={3}
                      value={formData.feedback}
                      onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                      placeholder="Thầy/Cô có góp ý gì để EdTeach v2.0 hoàn hảo hơn trong thực tế giảng dạy? Hãy chia sẻ với chúng tôi..."
                      className="w-full rounded-xl border border-neutral-300 bg-neutral-50/50 p-4 text-sm text-neutral-900 focus:border-blue-500 focus:bg-white focus:outline-hidden"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-lg shadow-blue-500/25 transition-all hover:bg-primary/90 hover:scale-[1.01]"
                  >
                    <Send className="w-5 h-5" />
                    <span>Đăng Ký Giữ Chỗ Trải Nghiệm v2.0 Miễn Phí</span>
                  </button>

                  <p className="text-center text-xs text-neutral-500">
                    🔒 Cam kết bảo mật thông tin giáo viên 100%. Không spam, không chia sẻ cho bên thứ ba.
                  </p>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
