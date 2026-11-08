"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Maximize2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  PenTool,
  Bot,
  FileQuestion,
  Info,
  ExternalLink,
  X,
  BookOpen,
  Copy,
  Check,
  PanelLeft,
  PanelLeftClose,
} from "lucide-react";
import {
  SUBJECT_LABEL,
  SUBJECT_COLOR,
  type LabLesson,
  labCoverUrl,
  labFileUrl,
  PHET_CC_ATTRIBUTION,
} from "@/data/labs";
import { useAuth } from "@/context/auth-context";
import { isProUser as checkIsPro, isMaxUser as checkIsMax, PRO_MONTHLY } from "@/lib/payment/plans";
import { TransparentWhiteboardOverlay } from "@/components/labs/transparent-whiteboard-overlay";

// ============================================================================
// MODAL: UPGRADE PRO VALUE-ADD FEATURES (Kính vẽ, Trợ lý AI, Sinh đề 3D)
// ============================================================================
interface LabFeatureUpgradeModalProps {
  feature: "whiteboard" | "ai_assistant" | "quiz_generator";
  lab: LabLesson;
  onClose: () => void;
}

function LabFeatureUpgradeModal({ feature, lab, onClose }: LabFeatureUpgradeModalProps) {
  const featureConfigs = {
    whiteboard: {
      tag: "Kính Vẽ Bục Giảng Tương Tác",
      title: "Vẽ Vector & Chú Thích Trực Tiếp Lên Mô Phỏng 3D",
      desc: "Công cụ kính vẽ sư phạm trong suốt cho phép Thầy/Cô vừa điều khiển mô phỏng vừa vẽ đường sức từ, phân tích lực hoặc khoanh vùng chú ý, chụp ảnh bài giảng độ nét cao cho học sinh.",
      benefits: [
        "Vẽ bút dạ quang neon, phân tích vector lực trực tiếp lên mô phỏng đang chạy",
        "Chuyển đổi tức thì giữa chế độ Thao tác 3D và Bút vẽ giảng bài",
        "Chụp ảnh bài giảng kèm chú thích và tải về máy chỉ với 1 click",
      ],
    },
    ai_assistant: {
      tag: "Trợ Lý AI Phân Tích Sư Phạm",
      title: "Trợ Lý AI Phân Tích Bản Chất & Bẫy Tư Duy Học Sinh",
      desc: `Trợ lý AI chuyên sâu phân tích hiện tượng thí nghiệm "${lab.titleVi}", cung cấp hệ thống câu hỏi dẫn dắt 5E và cảnh báo các quan niệm sai lầm học sinh hay mắc trong kỳ thi tốt nghiệp.`,
      benefits: [
        "Phân tích bản chất hiện tượng khoa học bám sát chương trình GDPT 2025",
        "Gợi ý bộ 5 câu hỏi gợi mở tư duy (phương pháp 5E: Engage - Explore - Explain)",
        "Liệt kê 3 ngộ nhận phổ biến học sinh hay mắc phải kèm giải thích chuẩn",
      ],
    },
    quiz_generator: {
      tag: "Sinh Bài Tập AI Từ Thí Nghiệm",
      title: "Tự Động Sinh Đề Kiểm Tra & Phiếu Học Tập Từ Mô Phỏng",
      desc: `Khởi tạo ngay bộ câu hỏi trắc nghiệm (Phần I, II, III chuẩn Bộ GD&ĐT 2025) gắn liền với thông số và hiện tượng của bài "${lab.titleVi}".`,
      benefits: [
        "Tạo đề kiểm tra 4 lựa chọn, Đúng/Sai và Trả lời ngắn theo ma trận chuẩn",
        "Đồng bộ trực tiếp sang Exam Studio để biên tập và trộn 4 mã đề",
        "Xuất file Word (.docx) sạch và phiếu bài tập in ngay cho cả lớp",
      ],
    },
  };

  const config = featureConfigs[feature];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative max-w-lg w-full rounded-2xl bg-white dark:bg-slate-900 p-6 sm:p-7 text-left shadow-2xl border border-slate-200 dark:border-slate-800">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <span className="rounded-full bg-linear-to-r from-amber-500 to-amber-600 px-3 py-1 text-[11px] font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
            <Sparkles className="w-3.5 h-3.5" /> Đặc Quyền Gói PRO
          </span>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {PRO_MONTHLY.price} / tháng
          </span>
        </div>

        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 leading-snug">
          {config.title}
        </h3>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
          {config.desc}
        </p>

        {/* Free CC BY-NC 4.0 reassurance */}
        <div className="mb-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/80 dark:bg-emerald-950/40 p-3 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <span>
            <strong>Lưu ý:</strong> Bản thân mô phỏng 3D luôn được mở <strong>miễn phí 100%</strong> cho mọi Thầy Cô & Học sinh theo giấy phép mở CC BY-NC 4.0. Gói PRO chỉ thu phí các công cụ AI và sư phạm độc quyền hỗ trợ giảng dạy.
          </span>
        </div>

        {/* Benefits List */}
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 p-4 space-y-2 mb-6 text-xs text-slate-700 dark:text-slate-200">
          <div className="font-bold text-slate-900 dark:text-white text-xs mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
            Đặc quyền nhận được khi nâng cấp Gói PRO:
          </div>
          {config.benefits.map((b, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>{b}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <Link
            href="/settings?tab=plan"
            className="w-full sm:flex-1 py-3 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Nâng cấp Gói PRO ({PRO_MONTHLY.price}/tháng)</span>
          </Link>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs transition cursor-pointer"
          >
            Tiếp tục xem 3D miễn phí
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// DRAWER: AI SIMULATION ASSISTANT (PRO Value-Add)
// ============================================================================
interface LabAIAssistantDrawerProps {
  lab: LabLesson;
  isOpen: boolean;
  onClose: () => void;
}

function LabAIAssistantDrawer({ lab, isOpen, onClose }: LabAIAssistantDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute top-0 right-0 bottom-0 w-full sm:w-96 z-30 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Trợ lý AI Sư Phạm</h3>
            <span className="text-[11px] text-slate-500">Phân tích chuyên sâu 3D</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Card 1: Bản chất khoa học */}
        <div className="rounded-xl border border-indigo-200/80 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20 p-3.5 space-y-2">
          <div className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            Bản chất hiện tượng ({lab.titleVi})
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            {lab.questionVi ??
              "Mô phỏng minh họa mối quan hệ giữa các đại lượng vật lý/hóa học thông qua tương tác trực quan thời gian thực."}
          </p>
          {lab.gdpt && (
            <div className="text-[11px] font-medium text-indigo-700 dark:text-indigo-300">
              Vị trí CT GDPT: {lab.gdpt}
            </div>
          )}
        </div>

        {/* Card 2: 5E Inquiry Questions */}
        <div className="rounded-xl border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 p-3.5 space-y-2">
          <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Bộ câu hỏi gợi mở 5E trên lớp
          </div>
          <ul className="list-disc pl-4 space-y-1.5 text-slate-600 dark:text-slate-300">
            <li><strong>Khám phá (Explore):</strong> Khi thay đổi thông số ở thanh trượt, đại lượng nào biến thiên tương ứng?</li>
            <li><strong>Giải thích (Explain):</strong> Tại sao hiện tượng này lại xảy ra theo quy luật bảo toàn / cân bằng?</li>
            <li><strong>Vận dụng (Elaborate):</strong> Ứng dụng thực tế của hiện tượng này trong công nghiệp / đời sống là gì?</li>
          </ul>
        </div>

        {/* Card 3: Cảnh báo quan niệm sai lầm */}
        <div className="rounded-xl border border-rose-200/80 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 p-3.5 space-y-2">
          <div className="font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            Bẫy tư duy học sinh hay mắc
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Học sinh thường nhầm lẫn giữa nguyên nhân trực tiếp và điều kiện cân bằng. Cần nhấn mạnh việc quan sát giá trị tới hạn trên mô phỏng.
          </p>
        </div>
      </div>

      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
        <Link
          href={`/exams/create?fromLab=${lab.slug}&subject=${lab.subject}&title=${encodeURIComponent(lab.titleVi)}`}
          className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition shadow-xs"
        >
          <FileQuestion className="w-4 h-4" />
          <span>Tạo đề kiểm tra từ bài này</span>
        </Link>
      </div>
    </div>
  );
}

// ============================================================================
// MODAL: QUIZ & WORKSHEET GENERATOR (PRO Value-Add)
// ============================================================================
interface LabQuizGeneratorModalProps {
  lab: LabLesson;
  isOpen: boolean;
  onClose: () => void;
}

function LabQuizGeneratorModal({ lab, isOpen, onClose }: LabQuizGeneratorModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const mockQuestions = [
    {
      type: "Phần I. Trắc nghiệm 4 lựa chọn",
      q: `Trong thí nghiệm 3D "${lab.titleVi}", yếu tố nào quyết định sự chuyển biến của hiện tượng?`,
      options: ["A. Năng lượng kích hoạt", "B. Nhiệt độ môi trường", "C. Áp suất hệ thống", "D. Nồng độ chất phản ứng"],
      ans: "A",
    },
    {
      type: "Phần II. Trắc nghiệm Đúng / Sai",
      q: `Xét các mệnh đề liên quan đến bài thực hành "${lab.titleVi}":`,
      options: [
        "a) Khi tăng cường độ tác nhân, tốc độ hiện tượng luôn tăng tuyến tính.",
        "b) Định luật bảo toàn được thỏa mãn ở mọi trạng thái quan sát.",
        "c) Thí nghiệm chứng minh sự phụ thuộc vào hằng số đặc trưng của vật liệu.",
        "d) Có thể đảo ngược chiều diễn tiến mà không cần cung cấp thêm năng lượng.",
      ],
      ans: "a-S, b-Đ, c-Đ, d-S",
    },
  ];

  const handleCopy = () => {
    const text = mockQuestions
      .map((item, idx) => `${idx + 1}. [${item.type}]\n${item.q}\n${item.options.join("\n")}\nĐáp án: ${item.ans}`)
      .join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative max-w-2xl w-full rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-left">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <span className="p-1.5 rounded-lg bg-pink-100 dark:bg-pink-950/80 text-pink-600 dark:text-pink-400">
            <FileQuestion className="w-4 h-4" />
          </span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Phiếu Bài Tập AI Từ Thí Nghiệm 3D: {lab.titleVi}
          </h3>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          Bộ câu hỏi chuẩn cấu trúc Bộ GD&ĐT 2025 được AI tự động sinh dựa trên tham số và hiện tượng của bài học.
        </p>

        <div className="max-h-80 overflow-y-auto space-y-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs">
          {mockQuestions.map((q, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="font-bold text-primary dark:text-blue-400">{q.type}</div>
              <div className="font-medium text-slate-800 dark:text-slate-100">{q.q}</div>
              <div className="space-y-1 text-slate-600 dark:text-slate-300 pl-2">
                {q.options.map((opt, oIdx) => (
                  <div key={oIdx}>{opt}</div>
                ))}
              </div>
              <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 pt-1">
                Gợi ý đáp án: {q.ans}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-200 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Đã sao chép" : "Sao chép câu hỏi"}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              href={`/exams/create?fromLab=${lab.slug}&subject=${lab.subject}&title=${encodeURIComponent(lab.titleVi)}`}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-primary/90 transition shadow-xs cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Chuyển vào Exam Studio để trộn đề</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT: LAB VIEWER (100% Free Open Access with PRO Value-Add Gating)
// ============================================================================
export function LabViewer({ lab }: { lab: LabLesson }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { user, profile } = useAuth();

  // State for value-add proprietary tools
  const [showGlassOverlay, setShowGlassOverlay] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showQuizGenerator, setShowQuizGenerator] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<"whiteboard" | "ai_assistant" | "quiz_generator" | null>(null);
  const [showAttributionModal, setShowAttributionModal] = useState(false);
  const [isLeftGuideOpen, setIsLeftGuideOpen] = useState(false);

  const isProUser = checkIsPro(profile) || checkIsPro(user) || checkIsMax(profile) || checkIsMax(user);

  // LAB-04 Fix: Dispose WebGL context when unmounting iframe to prevent GPU memory leaks
  useEffect(() => {
    return () => {
      if (iframeRef.current) {
        iframeRef.current.src = "about:blank";
      }
    };
  }, []);

  // Focus Mode Injection: Hide causality chain, footer micro-text, collapse left panel by default
  const injectFocusModeStyles = useCallback(() => {
    try {
      const doc = iframeRef.current?.contentDocument;
      if (!doc) return;

      // 1. Inject Focus Mode CSS
      const styleId = "edutest-focus-mode-styles";
      if (!doc.getElementById(styleId)) {
        const style = doc.createElement("style");
        style.id = styleId;
        style.textContent = `
          /* Focus Mode: Maximize canvas area & minimize clutter */
          #top .chain5 { display: none !important; }
          #top { height: 38px !important; }
          #steps { top: 40px !important; }
          #foot .foot2 { display: none !important; }
          #left { transition: transform 0.28s ease, opacity 0.28s ease !important; }
        `;
        doc.head.appendChild(style);
      }

      // 2. Collapse left panel by default for full-width 3D view
      const leftPanel = doc.getElementById("left");
      if (leftPanel) {
        if (!leftPanel.classList.contains("collapsed")) {
          leftPanel.classList.add("collapsed");
        }
        setIsLeftGuideOpen(false);

        // 3. Keep parent button state in sync if user toggles tab inside the iframe
        const observer = new MutationObserver(() => {
          setIsLeftGuideOpen(!leftPanel.classList.contains("collapsed"));
        });
        observer.observe(leftPanel, { attributes: true, attributeFilter: ["class"] });
      }
    } catch (err) {
      console.warn("Unable to inject focus mode styles into iframe:", err);
    }
  }, []);

  const handleToggleLeftGuide = useCallback(() => {
    try {
      const doc = iframeRef.current?.contentDocument;
      if (!doc) return;
      const leftPanel = doc.getElementById("left");
      if (leftPanel) {
        const isCollapsed = leftPanel.classList.contains("collapsed");
        if (isCollapsed) {
          leftPanel.classList.remove("collapsed");
          setIsLeftGuideOpen(true);
        } else {
          leftPanel.classList.add("collapsed");
          setIsLeftGuideOpen(false);
        }
      }
    } catch (err) {
      console.warn("Unable to toggle left guide in iframe:", err);
    }
  }, []);

  const handleFullscreen = useCallback(() => {
    const el = iframeRef.current;
    if (!el) return;
    if (el.requestFullscreen) el.requestFullscreen();
  }, []);

  // Handlers for value-add features with PRO gating
  const handleToggleWhiteboard = () => {
    if (!isProUser) {
      setUpgradeFeature("whiteboard");
      return;
    }
    setShowGlassOverlay((prev) => !prev);
  };

  const handleToggleAIAssistant = () => {
    if (!isProUser) {
      setUpgradeFeature("ai_assistant");
      return;
    }
    setShowAIAssistant((prev) => !prev);
  };

  const handleToggleQuizGenerator = () => {
    if (!isProUser) {
      setUpgradeFeature("quiz_generator");
      return;
    }
    setShowQuizGenerator((prev) => !prev);
  };

  return (
    <div className="flex flex-col relative h-screen w-screen overflow-hidden bg-slate-950">
      {/* Sleek Focus Top Bar (42px) */}
      <div className="flex h-11 flex-none items-center gap-2 sm:gap-2.5 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md px-3 sm:px-4 shadow-sm z-20">
        <Link
          href="/labs"
          title="Quay về Kho phòng thí nghiệm 3D"
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kho 3D</span>
        </Link>
        <span className="text-slate-700">|</span>

        <h1 className="truncate text-xs sm:text-sm font-semibold text-white max-w-[160px] sm:max-w-xs md:max-w-md lg:max-w-lg">
          {lab.titleVi}
        </h1>

        <span
          className={`hidden md:inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${SUBJECT_COLOR[lab.subject]}`}
        >
          {SUBJECT_LABEL[lab.subject]}
        </span>

        {/* CC BY-NC 4.0 Open Access Info Badge */}
        <button
          onClick={() => setShowAttributionModal(true)}
          title="Mô phỏng mở miễn phí theo giấy phép Creative Commons (CC BY-NC 4.0). Bấm để xem chi tiết bản quyền."
          className="hidden lg:flex items-center gap-1 rounded-full bg-emerald-950/60 hover:bg-emerald-900/80 px-2 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-800/60 transition cursor-pointer"
        >
          <span>CC BY-NC 4.0</span>
          <Info className="w-3 h-3 text-emerald-400 shrink-0" />
        </button>

        <div className="flex-1" />

        {/* Toggle Guide Panel */}
        <button
          onClick={handleToggleLeftGuide}
          title={isLeftGuideOpen ? "Thu gọn bảng hướng dẫn để mở rộng không gian 3D" : "Mở bảng hướng dẫn thí nghiệm từng bước"}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer border ${
            isLeftGuideOpen
              ? "bg-slate-800 border-slate-700 text-sky-400 hover:bg-slate-700"
              : "bg-sky-950/50 border-sky-800/60 text-sky-300 hover:bg-sky-900/60"
          }`}
        >
          {isLeftGuideOpen ? (
            <>
              <PanelLeftClose className="h-3.5 w-3.5 text-sky-400" />
              <span className="hidden sm:inline">Đóng hướng dẫn</span>
            </>
          ) : (
            <>
              <PanelLeft className="h-3.5 w-3.5 text-sky-400" />
              <span className="hidden sm:inline">Mở hướng dẫn</span>
            </>
          )}
        </button>

        {/* Proprietary Value-Add Action 1: Whiteboard Overlay (PRO) */}
        <button
          onClick={handleToggleWhiteboard}
          title={isProUser ? "Bật/Tắt Lớp kính vẽ trong suốt đè lên màn hình 3D" : "Nâng cấp Gói PRO để dùng Kính vẽ Bục giảng"}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
            showGlassOverlay
              ? "bg-amber-500 text-slate-950 shadow-xs ring-2 ring-amber-400"
              : "bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-700/80 shadow-2xs"
          }`}
        >
          <PenTool className="h-3.5 w-3.5" />
          <span className="hidden xl:inline">{showGlassOverlay ? "Tắt kính vẽ" : "Kính vẽ (PRO)"}</span>
        </button>

        {/* Proprietary Value-Add Action 2: AI Simulation Assistant (PRO) */}
        <button
          onClick={handleToggleAIAssistant}
          title={isProUser ? "Trợ lý AI phân tích bản chất hiện tượng & sư phạm" : "Nâng cấp Gói PRO để mở Trợ lý AI"}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
            showAIAssistant
              ? "bg-indigo-600 text-white shadow-xs"
              : "bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800 shadow-2xs"
          }`}
        >
          <Bot className="h-3.5 w-3.5 text-indigo-400" />
          <span className="hidden xl:inline">Trợ lý AI (PRO)</span>
        </button>

        {/* Proprietary Value-Add Action 3: Quiz Generator (PRO) */}
        <button
          onClick={handleToggleQuizGenerator}
          title={isProUser ? "Tự động sinh đề kiểm tra từ mô phỏng 3D" : "Nâng cấp Gói PRO để tự động sinh đề thi"}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold bg-pink-950/40 hover:bg-pink-900/60 text-pink-300 border border-pink-800 shadow-2xs transition cursor-pointer"
        >
          <FileQuestion className="h-3.5 w-3.5 text-pink-400" />
          <span className="hidden xl:inline">Sinh đề 3D (PRO)</span>
        </button>

        {/* Fullscreen Button */}
        <button
          onClick={handleFullscreen}
          title="Toàn màn hình (F11)"
          className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      {/* Main 3D Simulation Container - ALWAYS MOUNTED & 100% UNBLOCKED */}
      <div className="relative flex-1 w-full overflow-hidden bg-slate-950">
        <iframe
          ref={iframeRef}
          src={labFileUrl(lab.slug)}
          className="h-full w-full border-0"
          allow="fullscreen"
          title={lab.titleVi}
          onLoad={injectFocusModeStyles}
        />

        {/* Transparent Whiteboard Overlay Tool */}
        <TransparentWhiteboardOverlay
          isOpen={showGlassOverlay}
          onClose={() => setShowGlassOverlay(false)}
          labTitle={lab.titleVi}
        />

        {/* AI Assistant Drawer */}
        <LabAIAssistantDrawer
          lab={lab}
          isOpen={showAIAssistant}
          onClose={() => setShowAIAssistant(false)}
        />
      </div>

      {/* Upgrade Modal for PRO Value-Add Features */}
      {upgradeFeature && (
        <LabFeatureUpgradeModal
          feature={upgradeFeature}
          lab={lab}
          onClose={() => setUpgradeFeature(null)}
        />
      )}

      {/* Quiz Generator Modal */}
      <LabQuizGeneratorModal
        lab={lab}
        isOpen={showQuizGenerator}
        onClose={() => setShowQuizGenerator(false)}
      />

      {/* Attribution Modal */}
      {showAttributionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative max-w-lg w-full rounded-2xl bg-white dark:bg-slate-900 p-6 text-left shadow-2xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setShowAttributionModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Info className="w-5 h-5 text-emerald-600" />
              Giấy Phép Bản Quyền & Nguồn Gốc (CC BY-NC 4.0)
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              {PHET_CC_ATTRIBUTION.disclaimer}
            </p>

            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div>
                <strong>Nguồn mô phỏng:</strong>{" "}
                <a
                  href={PHET_CC_ATTRIBUTION.phetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  {PHET_CC_ATTRIBUTION.phetName}
                </a>{" "}
                &{" "}
                <a
                  href={PHET_CC_ATTRIBUTION.tongjiangUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  {PHET_CC_ATTRIBUTION.tongjiangName}
                </a>
              </div>
              <div>
                <strong>Giấy phép áp dụng:</strong>{" "}
                <a
                  href={PHET_CC_ATTRIBUTION.licenseUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline font-semibold"
                >
                  Creative Commons Attribution-NonCommercial 4.0 (CC BY-NC 4.0)
                </a>
              </div>
              <div>
                <strong>Thư viện đồ họa:</strong> Three.js (MIT License)
              </div>
              <div>
                <strong>Việt hóa & Công cụ sư phạm:</strong> EduTest AI Team
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowAttributionModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold cursor-pointer"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
