"use client";
import { useToast } from "@/context/toast-context";
import { useConfirm } from "@/context/confirm-dialog-context";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  Upload,
  Link as LinkIcon,
  Printer,
  MoreHorizontal,
  Search,
  RefreshCw,
  FileSpreadsheet,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  X,
  Copy,
  Check,
  QrCode,
  ExternalLink,
  ChevronDown,
  Trash2,
  Eye,
  Share2,
  Zap,
  Sparkles,
  Users,
  ShieldCheck,
  AlertTriangle,
  Crown,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { isProUser, isMaxUser, PricingPlan } from "@/lib/payment/plans";
import { UpgradeTierModal } from "@/components/modals/upgrade-tier-modal";
import { PaymentCheckoutModal } from "@/components/modals/payment-checkout-modal";
import { ZaloShareModal } from "./zalo-share-modal";
import { RemediationModal } from "./remediation-modal";

export interface GradedStudent {
  id: string;
  studentName: string;
  studentCode: string;
  className?: string;
  examCode?: string;
  score: number;
  correctCount: number;
  incorrectCount: number;
  emptyCount?: number;
  gradedAt: string;
  source?: "student_self" | "teacher_scan";
  studentAnswers: Record<number, string>;
  details?: Array<{
    questionNumber: number;
    studentAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }>;
}

export interface ExamSession {
  id: string;
  name: string;
  subject: string;
  grade: string;
  sheetType: "20" | "40" | "50" | "2025";
  questionCount: number;
  answerKey: Record<number, string>;
  createdAt: string;
  examId?: string;
  gradedStudents: GradedStudent[];
}

interface SessionDetailViewProps {
  session: ExamSession;
  onBack: () => void;
  onUpdateSession: (updated: ExamSession) => void;
  onOpenScanModal: (session: ExamSession, mode: "phone" | "camera" | "upload") => void;
  onOpenPrintModal: (session: ExamSession) => void;
  onDeleteSession: (sessionId: string, sessionName: string) => void;
}

export function SessionDetailView({
  session,
  onBack,
  onUpdateSession,
  onOpenScanModal,
  onOpenPrintModal,
  onDeleteSession,
}: SessionDetailViewProps) {
  const router = useRouter();
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const { profile } = useAuth();
  const isPro = isProUser(profile);

  // Modal states
  const [showCreateLinkModal, setShowCreateLinkModal] = useState(false);
  const [showCreatedLinkModal, setShowCreatedLinkModal] = useState<{
    token: string;
    linkUrl: string;
    qrUrl: string;
    className: string;
    durationMinutes: number;
    expiresAt: number;
  } | null>(null);
  const [showAllLinksModal, setShowAllLinksModal] = useState(false);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<GradedStudent | null>(null);
  const [zaloShareStudent, setZaloShareStudent] = useState<GradedStudent | null>(null);
  const [remediationStudent, setRemediationStudent] = useState<GradedStudent | null>(null);
  const [showPrintDropdown, setShowPrintDropdown] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  // Form states for creating student link
  const [linkClassInput, setLinkClassInput] = useState("");
  const [linkDurationMinutes, setLinkDurationMinutes] = useState(60);
  const [isCreatingLink, setIsCreatingLink] = useState(false);

  // Active links list fetched from server
  const [sessionLinks, setSessionLinks] = useState<any[]>([]);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Table filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Polling to fetch student submissions & active links
  const fetchSessionData = async () => {
    try {
      const res = await fetch(`/api/grading/student-links?sessionId=${session.id}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        if (data.links) {
          setSessionLinks(data.links);
        }

        // Merge student submissions into session if any new
        if (data.submissions && data.submissions.length > 0) {
          const currentIds = new Set(session.gradedStudents.map((s) => s.id));
          const newOnes = data.submissions.filter((s: any) => !currentIds.has(s.id));

          if (newOnes.length > 0) {
            const formattedNew = newOnes.map((sub: any) => ({
              id: sub.id,
              studentName: sub.studentName,
              studentCode: sub.studentCode,
              className: sub.className,
              examCode: sub.examCode,
              score: sub.score,
              correctCount: sub.correctCount,
              incorrectCount: sub.incorrectCount,
              emptyCount: sub.emptyCount,
              gradedAt: sub.submittedAt,
              source: "student_self" as const,
              studentAnswers: sub.studentAnswers,
              details: sub.details,
            }));

            const updatedList = [...formattedNew, ...session.gradedStudents];
            onUpdateSession({
              ...session,
              gradedStudents: updatedList,
            });
          }
        }
      }
    } catch {
      // silent polling error
    }
  };

  // Initial fetch and 4s interval polling
  useEffect(() => {
    fetchSessionData();
    const interval = setInterval(fetchSessionData, 4000);
    return () => clearInterval(interval);
  }, [session.id]);

  // Handle manual refresh button
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchSessionData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Handle create submission link
  const handleCreateStudentLink = async () => {
    try {
      setIsCreatingLink(true);
      const res = await fetch("/api/grading/student-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          sessionName: session.name,
          subject: session.subject,
          grade: session.grade,
          className: linkClassInput.trim(),
          durationMinutes: linkDurationMinutes,
          questionCount: session.questionCount,
          sheetType: session.sheetType,
          answerKey: session.answerKey,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || "Không thể tạo link nộp bài.", "error");
        return;
      }

      setShowCreateLinkModal(false);
      setShowCreatedLinkModal({
        token: data.link.token,
        linkUrl: data.link.linkUrl,
        qrUrl: data.link.qrUrl,
        className: data.link.className,
        durationMinutes: data.link.durationMinutes,
        expiresAt: data.link.expiresAt,
      });

      // Refresh list
      fetchSessionData();
    } catch (err: any) {
      showToast("Lỗi tạo link: " + err.message, "error");
    } finally {
      setIsCreatingLink(false);
    }
  };

  // Handle close link early
  const handleCloseLink = async (token: string) => {
    const isOk = await confirm({
      title: "Đóng nhận bài thi",
      message: "Bạn có chắc chắn muốn đóng nhận bài cho liên kết này? Học sinh sẽ không thể nộp bài được nữa.",
      confirmText: "Đóng nhận bài",
      cancelText: "Hủy",
      variant: "warning",
    });
    if (!isOk) return;

    try {
      const res = await fetch(`/api/grading/student-links/${token}/close`, {
        method: "POST",
      });
      if (res.ok) {
        fetchSessionData();
      }
    } catch {
      // silent
    }
  };

  // Copy link helper
  const handleCopy = (text: string, token: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  // Export Excel / CSV
  const handleExportExcel = () => {
    if (session.gradedStudents.length === 0) {
      showToast("Chưa có học sinh nào được chấm trong kỳ thi này.", "warning");
      return;
    }

    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += "STT,Số Báo Danh,Họ và Tên,Lớp,Mã Đề,Điểm Số,Số Câu Đúng,Số Câu Sai,Thời Gian Nộp,Nguồn Bài\n";

    session.gradedStudents.forEach((std, idx) => {
      const sourceStr = std.source === "student_self" ? "Học sinh tự nộp" : "Giáo viên quét";
      csvContent += `"${idx + 1}","${std.studentCode}","${std.studentName}","${std.className || ""}","${std.examCode || ""}","${std.score}","${std.correctCount}","${std.incorrectCount}","${std.gradedAt}","${sourceStr}"\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Ket_Qua_${session.name.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Stats calculation
  const totalGraded = session.gradedStudents.length;
  const avgScore =
    totalGraded > 0
      ? Math.round(
          (session.gradedStudents.reduce((acc, curr) => acc + curr.score, 0) / totalGraded) * 10
        ) / 10
      : 0;

  // Filter students
  const filteredStudents = session.gradedStudents.filter((std) => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      std.studentName.toLowerCase().includes(q) ||
      std.studentCode.toLowerCase().includes(q) ||
      (std.examCode && std.examCode.toLowerCase().includes(q));

    const matchClass =
      selectedClassFilter === "all" ||
      (std.className && std.className.toLowerCase() === selectedClassFilter.toLowerCase());

    return matchQuery && matchClass;
  });

  // Extract distinct classes
  const distinctClasses = Array.from(
    new Set(session.gradedStudents.map((s) => s.className).filter(Boolean))
  ) as string[];

  // Active links count
  const activeLinksCount = sessionLinks.filter((l) => !l.isClosed && Date.now() < l.expiresAt).length;

  const [upgradeTier, setUpgradeTier] = useState<"pro" | "max" | null>(null);
  const [upgradeFeatureInfo, setUpgradeFeatureInfo] = useState<{ title: string; desc: string } | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<PricingPlan | null>(null);
  const [zaloNoteModal, setZaloNoteModal] = useState<{
    isOpen: boolean;
    studentName: string;
    text: string;
    copied: boolean;
  } | null>(null);

  // Top missed questions calculation
  const topMissedQuestions = useMemo(() => {
    if (session.gradedStudents.length === 0 || !session.answerKey) return [];
    const questionStats: Record<
      number,
      { wrongCount: number; total: number; correctAns: string; wrongAnswers: Record<string, number> }
    > = {};

    Object.keys(session.answerKey).forEach((qKey) => {
      const qNum = Number(qKey);
      questionStats[qNum] = {
        wrongCount: 0,
        total: 0,
        correctAns: (session.answerKey[qNum] || "").toUpperCase(),
        wrongAnswers: {},
      };
    });

    session.gradedStudents.forEach((std) => {
      if (!std.studentAnswers) return;
      Object.entries(std.studentAnswers).forEach(([qStr, rawStudentAns]) => {
        const qNum = Number(qStr);
        if (!questionStats[qNum]) return;
        questionStats[qNum].total += 1;
        const studentAns = (rawStudentAns || "").toUpperCase();
        const correct = questionStats[qNum].correctAns;
        if (studentAns && studentAns !== correct) {
          questionStats[qNum].wrongCount += 1;
          questionStats[qNum].wrongAnswers[studentAns] =
            (questionStats[qNum].wrongAnswers[studentAns] || 0) + 1;
        }
      });
    });

    return Object.entries(questionStats)
      .map(([qNumStr, stat]) => {
        const wrongPct = stat.total > 0 ? Math.round((stat.wrongCount / stat.total) * 100) : 0;
        const mostChosenWrong =
          Object.entries(stat.wrongAnswers).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
        return {
          questionNum: Number(qNumStr),
          wrongCount: stat.wrongCount,
          total: stat.total,
          wrongPct,
          correctAns: stat.correctAns,
          mostChosenWrong,
        };
      })
      .filter((q) => q.wrongCount > 0)
      .sort((a, b) => b.wrongCount - a.wrongCount)
      .slice(0, 5);
  }, [session.gradedStudents, session.answerKey]);

  const handlePushToTeachingWhiteboard = () => {
    if (!isMaxUser(profile)) {
      setUpgradeFeatureInfo({
        title: "Đẩy câu sai lên Bục Giảng chữa nóng ngay (OMR-to-Whiteboard)",
        desc: "Đặc quyền gói MAX: Tự động trích xuất các câu có tỷ lệ học sinh làm sai cao (>40%) và phương án bẫy để đưa thẳng sang Bục Giảng Số chữa nóng tại chỗ kèm đồng hồ bấm giờ và đẻ câu luyện tập.",
      });
      setUpgradeTier("max");
      return;
    }

    const targetExamId = session.examId || `omr-${session.id}`;
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "teach_hotfix_data",
        JSON.stringify({
          sessionId: session.id,
          sessionName: session.name,
          examId: session.examId,
          subject: session.subject,
          grade: session.grade,
          topMissedQuestions,
          answerKey: session.answerKey,
        })
      );
    }
    router.push(`/teach/${targetExamId}?focus=missed&session=${session.id}`);
  };

  const handleGenerateZaloNote = (student: GradedStudent) => {
    if (!isMaxUser(profile)) {
      setUpgradeFeatureInfo({
        title: "Tạo phiếu nhận xét AI gửi Zalo Phụ huynh",
        desc: "Đặc quyền gói MAX: AI tự động phân tích ưu/nhược điểm từng học sinh dựa trên các câu đúng/sai để xuất mẫu tin nhắn trang trọng, chuyên nghiệp gửi trực tiếp cho phụ huynh qua Zalo.",
      });
      setUpgradeTier("max");
      return;
    }

    const review =
      student.score >= 8
        ? "Em nắm rất vững kiến thức nền tảng và tư duy vận dụng tốt các câu hỏi khó. Hãy tiếp tục duy trì phong độ này!"
        : student.score >= 5
        ? "Em có cố gắng và nắm được cấu trúc bài cơ bản. Tuy nhiên còn một số câu nhầm lẫn đáng tiếc, cần chú ý đọc kỹ đề và luyện tập thêm."
        : "Em cần dành thêm thời gian ôn lại lý thuyết trọng tâm và làm lại các dạng bài cơ bản để cải thiện điểm số ở lần thi tới.";

    const zaloText = `Kính gửi Quý phụ huynh em ${student.studentName} (Lớp ${
      student.className || session.grade || ""
    }):\nThầy/Cô xin gửi thông báo kết quả bài kiểm tra "${session.name}":\n- Điểm số: ${
      student.score
    }/10 (${student.correctCount}/${session.questionCount} câu đúng, ${
      student.incorrectCount
    } câu chưa chính xác)\n- Đánh giá từ giáo viên: ${review}\nThầy/Cô chúc em luôn học tốt và ngày càng tiến bộ!`;

    setZaloNoteModal({
      isOpen: true,
      studentName: student.studentName,
      text: zaloText,
      copied: false,
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 font-sans">
      {/* 1. Header Match Screenshot */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 dark:text-slate-400 hover:text-neutral-900 dark:hover:text-white transition mb-3 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Các kỳ thi</span>
        </button>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">
              {session.name}
            </h1>
            <p className="mt-1 text-xs text-neutral-500 dark:text-slate-400">
              {session.questionCount} câu trắc nghiệm · tổng 10 điểm · {session.sheetType} câu · Môn{" "}
              {session.subject}
            </p>
          </div>

          {/* Action buttons on the right */}
          <div className="flex items-center gap-2">
            {/* Nút Link đã tạo */}
            <button
              onClick={() => {
                fetchSessionData();
                setShowAllLinksModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition shadow-xs cursor-pointer"
            >
              <LinkIcon className="w-3.5 h-3.5 text-neutral-500" />
              <span>Link đã tạo</span>
              {activeLinksCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px]">
                  {activeLinksCount}
                </span>
              )}
            </button>

            {/* Dropdown In phiếu đáp án */}
            <div className="relative">
              <button
                onClick={() => setShowPrintDropdown(!showPrintDropdown)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-neutral-600" />
                <span>In phiếu đáp án</span>
                <ChevronDown className="w-3 h-3 text-neutral-400" />
              </button>

              {showPrintDropdown && (
                <div
                  onMouseLeave={() => setShowPrintDropdown(false)}
                  className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-border bg-card py-1 shadow-lg z-30 text-xs text-foreground"
                >
                  <button
                    onClick={() => {
                      setShowPrintDropdown(false);
                      onOpenPrintModal(session);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-foreground hover:bg-muted"
                  >
                    <Printer className="w-3.5 h-3.5 text-neutral-500" />
                    <span>In phiếu tô A4 chuẩn</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowPrintDropdown(false);
                      window.print();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-foreground hover:bg-muted"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-neutral-500" />
                    <span>In bảng đáp án mẫu</span>
                  </button>
                </div>
              )}
            </div>

            {/* Menu Options ... */}
            <div className="relative">
              <button
                onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                className="p-2 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground transition shadow-xs cursor-pointer"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {showOptionsMenu && (
                <div
                  onMouseLeave={() => setShowOptionsMenu(false)}
                  className="absolute right-0 top-full mt-1 w-40 rounded-xl border border-border bg-card py-1 shadow-lg z-30 text-xs text-foreground"
                >
                  <button
                    onClick={() => {
                      setShowOptionsMenu(false);
                      onDeleteSession(session.id, session.name);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xoá kỳ thi này</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. 3 Stat Cards (Đã chấm, Điểm trung bình, Cần xem lại) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-5 shadow-xs">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Đã chấm
          </div>
          <div className="text-3xl font-extrabold text-foreground">{totalGraded}</div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5 shadow-xs">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Điểm trung bình
          </div>
          <div className="text-3xl font-extrabold text-foreground">
            {totalGraded > 0 ? avgScore.toFixed(1) : "—"}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5 shadow-xs">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Cần xem lại
          </div>
          <div className="text-3xl font-extrabold text-foreground">0</div>
        </div>
      </div>

      {/* 3. 2 Action Cards (Chấm bài từ ảnh VS Học sinh tự nộp) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Card 1: Chấm bài từ ảnh */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-foreground">
                <Camera className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-foreground">Chấm bài từ ảnh</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-5">
              Chọn hoặc kéo thả ảnh phiếu, sau đó bắt đầu chấm
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => onOpenScanModal(session, "camera")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition cursor-pointer shadow-xs"
              >
                <Camera className="w-3.5 h-3.5 text-neutral-600" />
                <span>Chụp phiếu</span>
              </button>

              <button
                onClick={() => onOpenScanModal(session, "upload")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition cursor-pointer shadow-xs"
              >
                <Upload className="w-3.5 h-3.5 text-neutral-600" />
                <span>Chọn ảnh</span>
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Miễn phí 100% (Chấm tự động không giới hạn bằng OpenCV OMR)</span>
          </div>
        </div>

        {/* Card 2: Học sinh tự nộp (Match Exact Screenshot) */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Users className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-foreground">Để học sinh tự nộp</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
              Gửi link hoặc mã QR. Học sinh tự tải ảnh, nhận điểm ngay sau khi nộp tại đây. Không cần
              tài khoản học sinh. Có thể gắn lớp để theo dõi và xuất kết quả.
            </p>

            <div>
              <button
                onClick={() => setShowCreateLinkModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition cursor-pointer shadow-xs"
              >
                <LinkIcon className="w-3.5 h-3.5 text-neutral-600" />
                <span>Tạo link / mã QR nộp bài</span>
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Tự động chấm bằng OpenCV OMR & lưu vào bảng điểm (0 credits)</span>
          </div>
        </div>
      </div>

      {/* Top câu hỏi cả lớp sai nhiều nhất (Gói PRO & MAX) */}
      {topMissedQuestions.length > 0 && (
        <div className="bg-card rounded-2xl border border-red-200/80 dark:border-red-900/60 p-5 shadow-xs mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <h3 className="font-bold text-sm text-foreground">
                Top {topMissedQuestions.length} câu hỏi cả lớp sai nhiều nhất (Cần chữa bài trên lớp)
              </h3>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handlePushToTeachingWhiteboard}
                className="inline-flex items-center gap-1.5 rounded-xl bg-linear-to-r from-red-600 to-rose-600 px-4 py-2 min-h-[36px] text-xs font-bold text-white hover:from-red-500 hover:to-rose-500 shadow-sm hover:shadow transition cursor-pointer shrink-0"
                title="Đẩy trực tiếp các câu cả lớp hay sai lên Bục Giảng Số để thầy/cô chữa nóng tại lớp"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Chữa nóng trên Bục Giảng</span>
                <span className="rounded bg-black/25 px-1 py-0.2 text-[9px] font-black uppercase text-amber-300">
                  MAX
                </span>
              </button>
              <span className="text-[10px] font-black uppercase text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md hidden md:inline">
                Phân tích lỗi sai
              </span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mb-4">
            Thống kê tự động từ {session.gradedStudents.length} bài thi đã quét giúp giáo viên giải thích trọng tâm các điểm học sinh hay nhầm lẫn:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {topMissedQuestions.map((q) => (
              <div
                key={q.questionNum}
                className="p-3.5 rounded-xl border border-border bg-muted/40 hover:border-red-300 dark:hover:border-red-700 transition"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-sm text-foreground">Câu {q.questionNum}</span>
                  <span className="text-xs font-black text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
                    {q.wrongPct}% sai
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground space-y-1">
                  <div>
                    Đáp án đúng: <strong className="text-emerald-600 font-bold">{q.correctAns}</strong>
                  </div>
                  <div>
                    Học sinh sai: <strong>{q.wrongCount}/{q.total} em</strong>
                  </div>
                  {q.mostChosenWrong && (
                    <div className="text-amber-800">
                      Bẫy nhiều ở: <strong>{q.mostChosenWrong}</strong>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Kết quả chấm bài Header & Table */}
      <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
        <div className="p-5 border-b border-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-base font-bold text-foreground">Kết quả chấm bài</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Bài học sinh tự nộp cũng xuất hiện tại đây. Kết quả tự cập nhật khi có bài mới.
              </p>
            </div>

            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[36px] rounded-xl border border-border hover:bg-muted text-foreground text-xs font-semibold transition shadow-xs self-start md:self-auto cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Xuất Excel</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên học sinh, SBD hoặc mã đề..."
                className="w-full text-xs pl-9 pr-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-background text-foreground"
              />
            </div>

            {/* Filter by class */}
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="text-xs border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">Tất cả lớp</option>
              {distinctClasses.map((cls) => (
                <option key={cls} value={cls}>
                  Lớp {cls}
                </option>
              ))}
            </select>

            {/* Refresh Button */}
            <button
              onClick={handleManualRefresh}
              className={`p-2 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground transition cursor-pointer shadow-xs ${
                isRefreshing ? "animate-spin text-neutral-900" : ""
              }`}
              title="Làm mới kết quả bài nộp"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Submissions Table */}
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-neutral-400">
            <Users className="w-10 h-10 mx-auto mb-2 text-neutral-300 stroke-1" />
            <p className="text-sm font-medium text-neutral-600">Chưa có bài nộp nào</p>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
              Chia sẻ link hoặc mã QR cho học sinh tự nộp, hoặc dùng tính năng Chụp phiếu để bắt đầu
              chấm.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-12 text-center">STT</th>
                  <th className="py-3 px-4">Số báo danh</th>
                  <th className="py-3 px-4">Họ và tên</th>
                  <th className="py-3 px-4">Lớp</th>
                  <th className="py-3 px-4">Mã đề</th>
                  <th className="py-3 px-4">Điểm số</th>
                  <th className="py-3 px-4">Đúng / Sai</th>
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4">Nguồn</th>
                  <th className="py-3 px-4 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground">
                {filteredStudents.map((std, idx) => (
                  <tr key={std.id} className="hover:bg-muted/50 transition">
                    <td className="py-3 px-4 text-center text-muted-foreground font-mono">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-foreground">
                      {std.studentCode}
                    </td>
                    <td className="py-3 px-4 font-semibold text-foreground">{std.studentName}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {std.className ? (
                        <span className="px-2 py-0.5 rounded bg-muted text-foreground font-medium">
                          {std.className}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-neutral-600">{std.examCode || "101"}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-black font-mono ${
                          std.score >= 8
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : std.score >= 5
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {std.score}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      <span className="text-emerald-600 font-medium">{std.correctCount}</span> /{" "}
                      <span className="text-red-500 font-medium">{std.incorrectCount}</span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-[11px]">{std.gradedAt}</td>
                    <td className="py-3 px-4">
                      {std.source === "student_self" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          Học sinh nộp
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          Giáo viên quét
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setRemediationStudent(std)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold transition cursor-pointer border border-amber-200 shadow-2xs"
                          title="AI tạo phiếu luyện bù lỗ hổng"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Luyện bù</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setZaloShareStudent(std)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition cursor-pointer border border-blue-200 shadow-2xs"
                          title="Gửi báo cáo qua Zalo cho Phụ huynh"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Gửi Zalo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedStudentDetail(std)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900 text-xs font-semibold cursor-pointer"
                          title="Xem chi tiết bài làm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: NHỜ HỌC SINH NỘP BÀI (EXACT PIXEL MATCH WITH SCREENSHOT) */}
      {/* ========================================================= */}
      {showCreateLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-card text-card-foreground rounded-2xl max-w-lg w-full p-6 md:p-7 shadow-2xl border border-border relative">
            <button
              onClick={() => setShowCreateLinkModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-neutral-900 mb-1.5">Nhờ học sinh nộp bài</h3>
            <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
              Chọn lớp và thời hạn nhận bài. Sau khi tạo, bạn sẽ nhận link cùng mã QR để gửi cho học
              sinh, không cần đăng nhập.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Cột Trái: Lớp (không bắt buộc) */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-2">
                  Lớp (không bắt buộc)
                </label>
                <input
                  type="text"
                  value={linkClassInput}
                  onChange={(e) => setLinkClassInput(e.target.value)}
                  placeholder="Ví dụ: 12A1"
                  className="w-full text-sm border border-blue-400 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              {/* Cột Phải: Thời hạn link - tối đa 120 phút */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-2">
                  Thời hạn link - tối đa 120 phút
                </label>

                {/* Minute wheel / picker matching screenshot */}
                <div className="border border-neutral-200 rounded-xl p-2 bg-neutral-50/50 flex flex-col items-center justify-center space-y-1 select-none">
                  <div
                    onClick={() => setLinkDurationMinutes((m) => Math.max(5, m - 1))}
                    className="text-[11px] text-neutral-400 hover:text-neutral-700 cursor-pointer py-0.5"
                  >
                    {Math.max(5, linkDurationMinutes - 1)} phút
                  </div>

                  <div className="w-full py-1.5 rounded-lg bg-white border border-neutral-200 shadow-xs text-center font-bold text-sm text-neutral-900">
                    {linkDurationMinutes} phút
                  </div>

                  <div
                    onClick={() => setLinkDurationMinutes((m) => Math.min(120, m + 1))}
                    className="text-[11px] text-neutral-400 hover:text-neutral-700 cursor-pointer py-0.5"
                  >
                    {Math.min(120, linkDurationMinutes + 1)} phút
                  </div>
                </div>

                {/* Quick Minute Selection */}
                <div className="flex items-center justify-between gap-1 mt-2">
                  {[15, 30, 45, 60, 90, 120].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setLinkDurationMinutes(mins)}
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium transition cursor-pointer ${
                        linkDurationMinutes === mins
                          ? "bg-neutral-900 text-white font-bold"
                          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                      }`}
                    >
                      {mins}p
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-neutral-500 mb-6 leading-relaxed">
              Link có hiệu lực kể từ lúc tạo. Để trống lớp thì bài nộp không được gắn lớp. Phí chấm tính
              vào tài khoản giáo viên theo mức hiện tại.
            </p>

            <button
              onClick={handleCreateStudentLink}
              disabled={isCreatingLink}
              className="w-full py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isCreatingLink ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang tạo link...</span>
                </>
              ) : (
                <>
                  <LinkIcon className="w-4 h-4" />
                  <span>Tạo link nộp bài</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: LINK & MÃ QR VỪA TẠO THÀNH CÔNG */}
      {/* ========================================================= */}
      {showCreatedLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-card text-card-foreground rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border text-center relative">
            <button
              onClick={() => setShowCreatedLinkModal(null)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-bold text-neutral-900 mb-1">Đã tạo link nộp bài!</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Thời hạn {showCreatedLinkModal.durationMinutes} phút
              {showCreatedLinkModal.className && ` • Lớp: ${showCreatedLinkModal.className}`}
            </p>

            {/* QR Code image */}
            <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 inline-block mx-auto mb-4">
              <img
                src={showCreatedLinkModal.qrUrl}
                alt="QR nộp bài"
                className="w-48 h-48 rounded-xl object-contain bg-white p-2"
              />
              <div className="text-[11px] text-neutral-400 mt-1 font-medium">
                Chiếu mã QR này cho học sinh quét
              </div>
            </div>

            {/* Copyable link input */}
            <div className="flex items-center gap-2 mb-4">
              <input
                type="text"
                readOnly
                value={showCreatedLinkModal.linkUrl}
                className="flex-1 text-xs border border-neutral-200 rounded-xl px-3 py-2 bg-neutral-50 text-neutral-700 font-mono select-all"
              />
              <button
                onClick={() =>
                  handleCopy(showCreatedLinkModal.linkUrl, showCreatedLinkModal.token)
                }
                className="px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold flex items-center gap-1 transition shrink-0 cursor-pointer"
              >
                {copiedToken === showCreatedLinkModal.token ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={showCreatedLinkModal.linkUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Mở xem thử</span>
              </a>

              <button
                onClick={() => setShowCreatedLinkModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold transition cursor-pointer"
              >
                Hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: DANH SÁCH TẤT CẢ LINK ĐÃ TẠO */}
      {/* ========================================================= */}
      {showAllLinksModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-card text-card-foreground rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-border relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-base text-neutral-900">Các link nộp bài đã tạo</h3>
              </div>
              <button
                onClick={() => setShowAllLinksModal(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 overflow-y-auto flex-1 space-y-3">
              {sessionLinks.length === 0 ? (
                <div className="text-center py-8 text-neutral-400 text-xs">
                  Chưa có liên kết nộp bài nào được tạo cho kỳ thi này.
                </div>
              ) : (
                sessionLinks.map((lnk) => {
                  const now = Date.now();
                  const isExpired = lnk.isClosed || now > lnk.expiresAt;
                  const remainingMinutes = Math.max(0, Math.ceil((lnk.expiresAt - now) / 60000));

                  return (
                    <div
                      key={lnk.token}
                      className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-xs text-neutral-900">
                            {lnk.className ? `Lớp ${lnk.className}` : "Tự do (Không gắn lớp)"}
                          </span>
                          {isExpired ? (
                            <span className="px-2 py-0.2 rounded text-[10px] font-semibold bg-neutral-200 text-neutral-600">
                              Đã đóng / Hết hạn
                            </span>
                          ) : (
                            <span className="px-2 py-0.2 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                              Đang nhận bài ({remainingMinutes}p)
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-neutral-400 font-mono truncate max-w-xs">
                          {lnk.linkUrl}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleCopy(lnk.linkUrl, lnk.token)}
                          className="px-2.5 py-1.5 rounded-lg border border-neutral-200 hover:bg-white text-neutral-700 text-xs font-medium flex items-center gap-1 transition cursor-pointer shadow-xs"
                        >
                          {copiedToken === lnk.token ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>Copy link</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowAllLinksModal(false);
                            setShowCreatedLinkModal(lnk);
                          }}
                          className="p-1.5 rounded-lg border border-neutral-200 hover:bg-white text-neutral-700 transition cursor-pointer shadow-xs"
                          title="Xem mã QR"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>

                        {!isExpired && (
                          <button
                            onClick={() => handleCloseLink(lnk.token)}
                            className="px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium transition cursor-pointer"
                            title="Khóa nhận bài sớm"
                          >
                            Đóng sớm
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
              <button
                onClick={() => {
                  setShowAllLinksModal(false);
                  setShowCreateLinkModal(true);
                }}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                + Tạo thêm link mới
              </button>

              <button
                onClick={() => setShowAllLinksModal(false)}
                className="px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: CHI TIẾT BÀI LÀM CỦA HỌC SINH */}
      {/* ========================================================= */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-card text-card-foreground rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-border relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedStudentDetail(null)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-base">
                {selectedStudentDetail.score}
              </div>
              <div>
                <h3 className="font-bold text-base text-neutral-900">
                  {selectedStudentDetail.studentName}
                </h3>
                <p className="text-xs text-neutral-500">
                  SBD: {selectedStudentDetail.studentCode}
                  {selectedStudentDetail.className && ` • Lớp ${selectedStudentDetail.className}`}
                  {selectedStudentDetail.examCode && ` • Mã đề ${selectedStudentDetail.examCode}`}
                  {` • Nộp lúc: ${selectedStudentDetail.gradedAt}`}
                </p>
              </div>
            </div>

            {/* Answer breakdown */}
            <div className="rounded-xl border border-neutral-200 p-4 bg-neutral-50/50 mb-5">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <div className="text-neutral-400">Số câu đúng</div>
                  <div className="text-base font-bold text-emerald-600">
                    {selectedStudentDetail.correctCount} câu
                  </div>
                </div>
                <div>
                  <div className="text-neutral-400">Số câu sai</div>
                  <div className="text-base font-bold text-red-600">
                    {selectedStudentDetail.incorrectCount} câu
                  </div>
                </div>
                <div>
                  <div className="text-neutral-400">Điểm số</div>
                  <div className="text-base font-black text-blue-700">
                    {selectedStudentDetail.score} / 10
                  </div>
                </div>
              </div>
            </div>

            {/* Zalo Teacher Feedback Card for MAX */}
            <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-950">
              <div className="flex items-start gap-2.5">
                <Crown className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-neutral-900">Phiếu nhận xét AI gửi Zalo Phụ huynh</p>
                    <span className="rounded bg-amber-200 text-amber-900 text-[9px] font-black px-1.5 py-0.2">MAX</span>
                  </div>
                  <p className="text-[11px] text-neutral-600 mt-0.5">
                    AI tự động tổng hợp ưu điểm & các câu làm sai thành lời nhận xét ân cần để gửi Zalo cho phụ huynh.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setRemediationStudent(selectedStudentDetail)}
                  className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>⚡ Luyện bù AI</span>
                </button>
                <button
                  type="button"
                  onClick={() => setZaloShareStudent(selectedStudentDetail)}
                  className="px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Phiếu Zalo</span>
                </button>
              </div>
            </div>

            {/* Question detail grid */}
            <h4 className="font-semibold text-xs text-neutral-700 uppercase tracking-wider mb-2.5">
              Chi tiết câu trả lời
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {Array.from({ length: session.questionCount }).map((_, idx) => {
                const qNum = idx + 1;
                const studentAns = (selectedStudentDetail.studentAnswers[qNum] || "").toUpperCase();
                const correctAns = (session.answerKey[qNum] || "A").toUpperCase();
                const isCorrect = studentAns === correctAns;

                return (
                  <div
                    key={qNum}
                    className={`p-2 rounded-lg border text-center text-xs ${
                      isCorrect
                        ? "border-emerald-200 bg-emerald-50/60"
                        : studentAns
                        ? "border-red-200 bg-red-50/60"
                        : "border-neutral-200 bg-neutral-50"
                    }`}
                  >
                    <div className="text-[10px] text-neutral-400 font-semibold">Câu {qNum}</div>
                    <div className="font-mono font-bold mt-0.5">
                      <span className={isCorrect ? "text-emerald-700" : "text-red-600"}>
                        {studentAns || "—"}
                      </span>
                      {!isCorrect && (
                        <span className="text-emerald-600 text-[11px] ml-1">({correctAns})</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-100 text-right">
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Zalo Teacher Note (Gói MAX) */}
      {zaloNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-card text-card-foreground rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-border relative text-left">
            <button
              onClick={() => setZaloNoteModal(null)}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Crown className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-neutral-900">
                  Phiếu nhận xét học sinh (Gửi Zalo Phụ huynh)
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Học sinh: <strong>{zaloNoteModal.studentName}</strong>
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-xs text-neutral-800 font-mono whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto mb-4">
              {zaloNoteModal.text}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-[11px] text-neutral-400">
                Sao chép và dán trực tiếp vào khung chat Zalo của phụ huynh.
              </p>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(zaloNoteModal.text);
                  setZaloNoteModal({ ...zaloNoteModal, copied: true });
                  setTimeout(() => {
                    setZaloNoteModal((prev) => (prev ? { ...prev, copied: false } : null));
                  }, 2500);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition shadow-xs cursor-pointer"
              >
                {zaloNoteModal.copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{zaloNoteModal.copied ? "Đã sao chép!" : "Sao chép gửi Zalo"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sprint 2: AI Remediation Sheet Modal */}
      <RemediationModal
        isOpen={!!remediationStudent}
        onClose={() => setRemediationStudent(null)}
        student={remediationStudent}
        session={session}
        teacherName={profile?.full_name || undefined}
        isTeacherVerified={profile?.is_verified_teacher}
      />

      {/* Sprint 1: Zalo Parent Report Share Modal */}
      <ZaloShareModal
        isOpen={!!zaloShareStudent}
        onClose={() => setZaloShareStudent(null)}
        student={zaloShareStudent}
        session={session}
        teacherName={profile?.full_name || undefined}
        isTeacherVerified={profile?.is_verified_teacher}
      />

      {/* Upgrade Tier Modal */}
      <UpgradeTierModal
        isOpen={!!upgradeTier}
        onClose={() => {
          setUpgradeTier(null);
          setUpgradeFeatureInfo(null);
        }}
        requiredTier={upgradeTier || "max"}
        featureTitle={upgradeFeatureInfo?.title || "Nâng cấp gói MAX"}
        featureDesc={upgradeFeatureInfo?.desc || "Mở khóa toàn bộ tính năng Luyện thi & Chữa bài Chuyên sâu."}
        onSelectPlan={(plan) => setCheckoutPlan(plan)}
      />

      {/* PayOS Checkout Modal */}
      {checkoutPlan && (
        <PaymentCheckoutModal
          isOpen={!!checkoutPlan}
          onClose={() => setCheckoutPlan(null)}
          selectedPlan={checkoutPlan}
          onSuccess={() => {
            setCheckoutPlan(null);
            setUpgradeTier(null);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
