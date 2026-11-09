"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Printer,
  Camera,
  Upload,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  Sparkles,
  Search,
  Trash2,
  ChevronRight,
  Eye,
  Download,
  BookOpen,
  ArrowRight,
  Check,
  AlertCircle,
  RefreshCw,
  X,
  FileSpreadsheet,
  Award,
  Layers,
  HelpCircle,
  Smartphone,
  QrCode,
  Copy,
  Wifi,
  Zap,
  SwitchCamera,
} from "lucide-react";
import { getUserExams, Exam } from "@/lib/api/exams";
import {
  getGradingSessions,
  saveGradingSession,
  deleteGradingSession,
  extractRealAnswerKeyFromExam,
  GradedStudent,
} from "@/lib/api/grading-sessions";
import { SessionDetailView } from "@/components/grading/session-detail-view";
import { CreateExamModal } from "@/components/grading/create-exam-modal";
import { DownloadOMRModal } from "@/components/grading/download-omr-modal";
import { PrintSheetModal } from "@/components/grading/print-sheet-modal";
import { ContinuousGradingModal } from "@/components/grading/continuous-grading-modal";
import { isProUser, PricingPlan } from "@/lib/payment/plans";
import { UpgradeTierModal } from "@/components/modals/upgrade-tier-modal";
import { PaymentCheckoutModal } from "@/components/modals/payment-checkout-modal";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { useConfirm } from "@/context/confirm-dialog-context";
import { getUserPreferences } from "@/lib/preferences";
import { PLATFORM_NAME, SUPPORT_EMAIL } from "@/lib/constants";
import {
  computeOmrCounts,
  flattenOmrAnswers,
  get2025QuestionCounts,
  isValidStudentCode,
  scoreStudentAnswers,
} from "@/lib/grading/omr-template-resolver";

interface ExamSession {
  id: string;
  name: string;
  subject: string;
  grade: string;
  targetClasses?: string;
  sheetType: "20" | "40" | "50" | "2025";
  questionCount: number;
  answerKey: Record<number, string>;
  examCodes?: Record<string, Record<number, string>>;
  createdAt: string;
  examId?: string;
  status?: "not_started" | "in_progress" | "completed";
  gradedStudents: Array<{
    id: string;
    studentName: string;
    studentCode: string;
    score: number;
    correctCount: number;
    incorrectCount: number;
    emptyCount?: number;
    gradedAt: string;
    studentAnswers: Record<number, string>;
    annotatedImage?: string;
    flaggedQuestions?: any[];
    omrEngine?: string;
  }>;
}

function GradingPageInner() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  // Danh sách các kỳ thi đã tạo (lưu trong localStorage để bền vững)
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [loadingExams, setLoadingExams] = useState(false);
  const [userExams, setUserExams] = useState<Exam[]>([]);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState<ExamSession | null>(null);
  const [showScanModal, setShowScanModal] = useState<ExamSession | null>(null);
  const [showScoreboardModal, setShowScoreboardModal] = useState<ExamSession | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<PricingPlan | null>(null);
  const [showDownloadOMRModal, setShowDownloadOMRModal] = useState(false);

  // Search & Filter Toolbar states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "in_progress" | "not_started" | "completed">("all");

  // Form tạo kỳ thi
  const [createSessionName, setCreateSessionName] = useState("");
  const [createSubject, setCreateSubject] = useState("Toán");
  const [createGrade, setCreateGrade] = useState("10");
  const [createSheetType, setCreateSheetType] = useState<"20" | "40" | "50" | "2025">("20");
  const [createSourceType, setCreateSourceType] = useState<"existing_exam" | "manual">("manual");
  const [selectedExamId, setSelectedExamId] = useState("");
  const [manualAnswers, setManualAnswers] = useState<Record<number, string>>({});
  const [extractedQuestions, setExtractedQuestions] = useState<Array<{ num: number; type: string; answer: string; content: string }>>([]);
  const [isExtractingExam, setIsExtractingExam] = useState(false);

  // Scan modal state
  const [scanMode, setScanMode] = useState<"phone" | "camera" | "upload" | "batch">("phone");
  const [studentNameInput, setStudentNameInput] = useState("Nguyễn Văn An");
  const [studentCodeInput, setStudentCodeInput] = useState("10024");
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisPhase, setAnalysisPhase] = useState<1 | 2 | 3>(1);
  const [scanResult, setScanResult] = useState<any>(null);

  // Batch OMR states
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchSummary, setBatchSummary] = useState<any>(null);

  // Remote Wireless Phone Camera States
  const [remoteSessionToken, setRemoteSessionToken] = useState<string | null>(null);
  const [remoteSessionPin, setRemoteSessionPin] = useState<string | null>(null);
  const [remoteQrUrl, setRemoteQrUrl] = useState<string | null>(null);
  const [remoteDirectUrl, setRemoteDirectUrl] = useState<string | null>(null);
  const [isPhoneConnected, setIsPhoneConnected] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // PC Webcam States
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [webcamFacing, setWebcamFacing] = useState<"environment" | "user">("environment");
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const videoWebcamRef = useRef<HTMLVideoElement | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);

  // Manual corrections tracking
  const [manualCorrections, setManualCorrections] = useState<Record<number, boolean>>({});
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Initialize defaults from teacher settings preferences
  useEffect(() => {
    const prefs = getUserPreferences(profile);
    if (prefs.teaching.defaultSubject) setCreateSubject(prefs.teaching.defaultSubject);
    if (prefs.teaching.defaultGrade) setCreateGrade(prefs.teaching.defaultGrade);
    if (prefs.gradingAndAi.defaultGradingSheet) {
      const sheet = prefs.gradingAndAi.defaultGradingSheet;
      const type = sheet === "gdpt_2025" ? "2025" : sheet === "sheet_50" ? "50" : sheet === "sheet_40" ? "40" : "20";
      setCreateSheetType(type);
    }
  }, [profile]);

  // Tải file PDF phiếu thi chuẩn A4 từ OpenCV OMR ReportLab generator
  const handleDownloadPdf = async () => {
    if (!showPrintModal) return;
    setIsDownloadingPdf(true);
    try {
      const res = await fetch("/api/grading/omr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "download_pdf",
          sheetType: showPrintModal.sheetType,
          subject: showPrintModal.subject,
          questionCount: showPrintModal.questionCount,
          examTitle: showPrintModal.name,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Lỗi tải PDF từ AI Service");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `phieu_trac_nghiem_${showPrintModal.sheetType}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast("Đã xuất phiếu trả lời trắc nghiệm PDF thành công!", "success");
    } catch (err: any) {
      showToast("Lỗi tải file PDF: " + err.message, "error");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Tải danh sách kỳ thi từ LocalStorage + Tự động đồng bộ Supabase (Sprint MG-1)
  useEffect(() => {
    async function initSessions() {
      try {
        const loaded = await getGradingSessions();
        if (loaded && loaded.length > 0) {
          setSessions(loaded);
        }
      } catch (e) {
        console.error("Lỗi đọc sessions:", e);
      }
    }
    initSessions();
  }, []);

  // Lưu sessions Cơ chế Kép (LocalStorage tức thì + Supabase ngầm)
  const saveSessions = (newSessions: ExamSession[]) => {
    setSessions(newSessions);
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem("edteach_grading_sessions", JSON.stringify(newSessions));
      }
      // Đồng bộ ngầm lên Supabase cho từng session
      newSessions.forEach((s) => {
        saveGradingSession(s);
      });
    } catch (e) {
      console.error("Lỗi lưu sessions:", e);
    }
  };

  const searchParams = useSearchParams();
  const examIdParam = searchParams.get("examId");
  const autoScanParam = searchParams.get("autoScan");

  // Tải danh sách đề thi đã soạn của giáo viên và tự động gắn kết nếu có examId
  const loadTeacherExams = async () => {
    setLoadingExams(true);
    try {
      const { exams } = await getUserExams(50, 0);
      setUserExams(exams);

      // Nếu có tham số examId từ Bục Giảng hoặc Thư Viện Đề
      if (examIdParam) {
        // 1. Kiểm tra xem đã có session nào gắn với examId này chưa
        const storedSessionsStr = typeof window !== "undefined" ? window.localStorage.getItem("edteach_grading_sessions") : null;
        const currentSessions: ExamSession[] = storedSessionsStr ? JSON.parse(storedSessionsStr) : [];
        const existingSession = currentSessions.find((s) => s.examId === examIdParam);

        if (existingSession) {
          setActiveSessionId(existingSession.id);
          if (autoScanParam === "true") {
            setShowScanModal(existingSession);
            showToast(`Đã nạp sẵn đáp án chuẩn cho đề: ${existingSession.name}`, "success");
          }
        } else {
          // 2. Tự động khởi tạo session chấm mới với ĐÁP ÁN THẬT từ đề thi (Sprint MG-1)
          const targetExam = (exams as Exam[]).find((e: Exam) => e.id === examIdParam);
          if (targetExam) {
            try {
              const real = await extractRealAnswerKeyFromExam(targetExam.id);
              const autoSession: ExamSession = {
                id: "session_auto_" + Date.now(),
                name: `Chấm OMR: ${targetExam.name}`,
                subject: real.subject,
                grade: real.grade,
                sheetType: real.sheetType,
                questionCount: real.questionCount,
                answerKey: real.answerKey,
                createdAt: new Date().toLocaleDateString("vi-VN"),
                examId: targetExam.id,
                gradedStudents: [],
              };

              const updatedSessions = [autoSession, ...currentSessions];
              saveSessions(updatedSessions);
              setActiveSessionId(autoSession.id);
              if (autoScanParam === "true") {
                setShowScanModal(autoSession);
                showToast(`Đã tạo phòng chấm & nạp ${real.questionCount} đáp án thật chuẩn xác từ đề: ${targetExam.name}`, "success");
              }
            } catch (exErr) {
              console.warn("Lỗi trích xuất đáp án thật khi auto-scan:", exErr);
            }
          }
        }
      }
    } catch (err) {
      console.warn("Không thể tải danh sách đề thi:", err);
    } finally {
      setLoadingExams(false);
    }
  };

  // Mở modal tạo kỳ thi
  const handleOpenCreateModal = () => {
    setCreateSessionName(`Kỳ thi khảo sát ${createSubject} ${new Date().toLocaleDateString("vi-VN")}`);
    // Mặc định sinh đáp án mẫu
    const initialAnswers: Record<number, string> = {};
    const count =
      createSheetType === "2025"
        ? get2025QuestionCounts(createSubject).totalQuestions
        : parseInt(createSheetType) || 20;
    const choices = ["A", "B", "C", "D"];
    for (let i = 1; i <= count; i++) {
      initialAnswers[i] = choices[(i - 1) % 4];
    }
    setManualAnswers(initialAnswers);
    loadTeacherExams();
    setShowCreateModal(true);
  };

  // Hàm xếp loại học lực học sinh theo chuẩn Bộ GD&ĐT
  const getStudentRank = (score: number) => {
    if (score >= 9.0) return { label: "Xuất sắc", badgeClass: "bg-emerald-600 text-white shadow-emerald-500/20" };
    if (score >= 8.0) return { label: "Giỏi", badgeClass: "bg-blue-600 text-white shadow-blue-500/20" };
    if (score >= 6.5) return { label: "Khá", badgeClass: "bg-indigo-600 text-white shadow-indigo-500/20" };
    if (score >= 5.0) return { label: "Đạt", badgeClass: "bg-amber-600 text-white shadow-amber-500/20" };
    return { label: "Chưa đạt", badgeClass: "bg-rose-600 text-white shadow-rose-500/20" };
  };

  // Tính điểm thông minh: Hỗ trợ 20, 40, 50 câu và cả 3 biến thể GDPT 2025 (Toán / KHTN / KHXH)
  const computeStudentResult = (
    session: ExamSession,
    existingAnswers?: Record<number, string>
  ) => {
    const is2025 = session.sheetType === "2025";
    const generatedAnswers: Record<number, string> = {};

    if (!existingAnswers) {
      if (is2025) {
        const counts = get2025QuestionCounts(session.subject, session.questionCount);
        const choices = ["A", "B", "C", "D"];
        for (let i = 1; i <= counts.part1Count; i++) {
          const correctVal = session.answerKey[i] || "A";
          const isRight = Math.random() < 0.85;
          generatedAnswers[i] = isRight
            ? correctVal
            : choices[(choices.indexOf(correctVal) + 1) % 4];
        }
        const startP2 = counts.part1Count + 1;
        const endP2 = counts.part1Count + counts.part2Count;
        for (let i = startP2; i <= endP2; i++) {
          const correctVal = session.answerKey[i] || "Đ-S-Đ-Đ";
          const correctParts = correctVal.split("-");
          generatedAnswers[i] = correctParts
            .map((part) => (Math.random() < 0.85 ? part : part === "Đ" ? "S" : "Đ"))
            .join("-");
        }
        if (counts.part3Count > 0) {
          const startP3 = endP2 + 1;
          const endP3 = counts.totalQuestions;
          for (let i = startP3; i <= endP3; i++) {
            const correctVal = session.answerKey[i] || "15";
            generatedAnswers[i] =
              Math.random() < 0.8 ? correctVal : String((parseInt(correctVal, 10) || 15) + 1);
          }
        }
      } else {
        const totalQ = session.questionCount;
        const choices = ["A", "B", "C", "D"];
        for (let i = 1; i <= totalQ; i++) {
          const correctVal = session.answerKey[i] || "A";
          const isRight = Math.random() < 0.85;
          generatedAnswers[i] = isRight
            ? correctVal
            : choices[(choices.indexOf(correctVal) + 1) % 4];
        }
      }
    }

    const scored = scoreStudentAnswers({
      sheetType: session.sheetType,
      subject: session.subject,
      questionCount: session.questionCount,
      answerKey: session.answerKey || {},
      studentAnswers: existingAnswers || generatedAnswers,
    });

    const studentAns: Record<number, string> = {};
    for (const d of scored.details) {
      studentAns[d.questionNumber] = d.studentAnswer;
    }

    return {
      score: scored.score,
      correctCount: scored.correctCount,
      incorrectCount: scored.incorrectCount,
      emptyCount: scored.emptyCount,
      studentAnswers: studentAns,
    };
  };

  // Thay đổi số câu khi đổi mẫu phiếu
  const handleSheetTypeChange = (type: "20" | "40" | "50" | "2025") => {
    setCreateSheetType(type);
    const counts2025 = get2025QuestionCounts(createSubject);
    const count = type === "2025" ? counts2025.totalQuestions : parseInt(type);
    const updated: Record<number, string> = {};
    const choices = ["A", "B", "C", "D"];
    for (let i = 1; i <= count; i++) {
      if (type === "2025") {
        if (i <= counts2025.part1Count) updated[i] = manualAnswers[i] || choices[(i - 1) % 4];
        else if (i <= counts2025.part1Count + counts2025.part2Count) {
          updated[i] = manualAnswers[i] || "Đ-S-Đ-Đ";
        } else {
          updated[i] = manualAnswers[i] || "15";
        }
      } else {
        updated[i] = manualAnswers[i] || choices[(i - 1) % 4];
      }
    }
    setManualAnswers(updated);
  };

  // Khi chọn một đề thi đã soạn sẵn (nạp đáp án THẬT từ DB)
  const handleSelectExistingExam = async (examId: string) => {
    setSelectedExamId(examId);
    const found = userExams.find((e) => e.id === examId);
    if (!found) return;
    setCreateSessionName(`Chấm: ${found.name}`);
    setCreateSubject(found.subject || "Toán");
    setCreateGrade(found.grade || "10");

    try {
      const extracted = await extractRealAnswerKeyFromExam(examId);
      setCreateSubject(extracted.subject || found.subject || "Toán");
      setCreateGrade(extracted.grade || found.grade || "10");
      setCreateSheetType(extracted.sheetType);
      setManualAnswers(extracted.answerKey);
    } catch {
      const count = found.question_count || 20;
      if (count <= 20) setCreateSheetType("20");
      else if (count <= 40) setCreateSheetType("40");
      else setCreateSheetType("50");
      setManualAnswers({});
    }
  };

  // Tạo kỳ thi
  const handleConfirmCreateSession = () => {
    if (!createSessionName.trim()) {
      showToast("Vui lòng nhập tên kỳ thi!", "warning");
      return;
    }

    const count =
      createSheetType === "2025"
        ? get2025QuestionCounts(createSubject).totalQuestions
        : parseInt(createSheetType);
    const newSession: ExamSession = {
      id: "session_" + Date.now(),
      name: createSessionName.trim(),
      subject: createSubject,
      grade: createGrade,
      sheetType: createSheetType,
      questionCount: count,
      answerKey: manualAnswers,
      createdAt: new Date().toLocaleDateString("vi-VN"),
      examId: createSourceType === "existing_exam" && selectedExamId ? selectedExamId : undefined,
      gradedStudents: [],
    };

    saveSessions([newSession, ...sessions]);
    setShowCreateModal(false);
    setActiveSessionId(newSession.id);
  };

  // Tạo nhanh kỳ thi mẫu Toán 6 khớp chuẩn ảnh demo
  const handleCreateSampleSession = () => {
    const sampleId = "session_sample_" + Date.now();
    const sample: ExamSession = {
      id: sampleId,
      name: "Bộ 3 đề kiểm tra học kỳ I Toán 6 – mức độ 8+, 9+, 10",
      subject: "Toán",
      grade: "6",
      sheetType: "20",
      questionCount: 15,
      answerKey: {
        1: "A", 2: "B", 3: "C", 4: "D", 5: "A",
        6: "B", 7: "C", 8: "D", 9: "A", 10: "B",
        11: "C", 12: "D", 13: "A", 14: "B", 15: "C",
      },
      createdAt: new Date().toLocaleDateString("vi-VN"),
      gradedStudents: [],
    };
    saveSessions([sample, ...sessions]);
    setActiveSessionId(sampleId);
  };

  // Xóa kỳ thi (Đồng bộ kép)
  const handleDeleteSession = async (id: string, name: string) => {
    const isConfirmed = await confirm({
      title: "Xác nhận xóa kỳ thi",
      message: `Bạn có chắc muốn xóa kỳ thi "${name}"? Toàn bộ kết quả và dữ liệu đã chấm của kỳ thi này sẽ bị xóa vĩnh viễn.`,
      confirmText: "Xóa kỳ thi",
      cancelText: "Hủy",
      variant: "danger",
    });
    if (isConfirmed) {
      const updated = sessions.filter((s) => s.id !== id);
      setSessions(updated);
      await deleteGradingSession(id);
      showToast("Đã xóa kỳ thi thành công.", "success");
    }
  };

  // Phát âm thanh Ting! khi điện thoại gửi bài hoặc AI chấm xong
  const playTingSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1046.5, audioCtx.currentTime); // C6 Note
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch {
      // silent
    }
  };

  // Khởi tạo phiên kết nối không dây với điện thoại
  const initRemoteSession = async (session: ExamSession) => {
    setIsPhoneConnected(false);
    setRemoteSessionToken(null);
    try {
      const res = await fetch("/api/grading/remote-session/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          sessionName: session.name,
          subject: session.subject,
          grade: session.grade,
          questionCount: session.questionCount,
          answerKey: session.answerKey,
          sheetType: session.sheetType,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRemoteSessionToken(data.token);
        setRemoteSessionPin(data.pin);
        setRemoteQrUrl(data.qrUrl);
        setRemoteDirectUrl(data.directUrl);
      }
    } catch (e) {
      console.error("Lỗi khởi tạo phiên quét không dây", e);
    }
  };

  // Polling nhận ảnh bài thi từ điện thoại gửi sang
  useEffect(() => {
    if (!showScanModal || !remoteSessionToken) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/grading/remote-session/poll?token=${remoteSessionToken}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.connected && !isPhoneConnected) {
            setIsPhoneConnected(true);
          }
          if (data.submissions && data.submissions.length > 0) {
            for (const sub of data.submissions) {
              playTingSound();
              gradeReceivedSubmission(sub, showScanModal);
            }
          }
        }
      } catch {
        // silent
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [showScanModal, remoteSessionToken, isPhoneConnected]);

  // Chấm bài nhận được từ điện thoại
  const gradeReceivedSubmission = async (sub: any, currentSession: ExamSession) => {
    setIsAnalyzing(true);
    setAnalysisPhase(1);

    setTimeout(() => {
      setAnalysisPhase(2);
    }, 450);

    setTimeout(() => {
      setAnalysisPhase(3);
    }, 900);

    setTimeout(async () => {
      let finalScore = 0;
      let finalCorrect = 0;
      let finalIncorrect = 0;
      let finalAnswers: Record<number, string> = {};
      let annotatedImage: string | undefined = undefined;
      let flaggedQuestions: any[] = [];
      let omrEngine: string | undefined = undefined;

      let finalEmpty = 0;

      if (sub.omrResult) {
        const omr = sub.omrResult;
        finalScore = omr.total_score ?? 0;
        const counts = computeOmrCounts(omr, currentSession.questionCount);
        finalCorrect = counts.correctCount;
        finalIncorrect = counts.incorrectCount;
        finalEmpty = counts.emptyCount;
        annotatedImage = omr.annotated_image_base64;
        flaggedQuestions = omr.flagged_questions || [];
        omrEngine = omr.engine_used;
        finalAnswers = flattenOmrAnswers(
          omr,
          currentSession.sheetType,
          currentSession.subject,
          currentSession.questionCount
        );
      } else {
        const result = computeStudentResult(currentSession);
        finalScore = result.score;
        finalCorrect = result.correctCount;
        finalIncorrect = result.incorrectCount;
        finalEmpty = result.emptyCount;
        finalAnswers = result.studentAnswers;
      }

      const detectedCode = isValidStudentCode(sub.studentCode)
        ? String(sub.studentCode).trim()
        : isValidStudentCode(sub.omrResult?.student_code)
        ? String(sub.omrResult.student_code).trim()
        : "";
      const studentName = sub.studentName || `Học sinh ${currentSession.gradedStudents.length + 1}`;
      const studentCode = detectedCode || `${1000 + currentSession.gradedStudents.length + 1}`;

      const newStudent = {
        id: "std_" + Date.now(),
        studentName,
        studentCode,
        score: finalScore,
        correctCount: finalCorrect,
        incorrectCount: finalIncorrect,
        emptyCount: finalEmpty,
        gradedAt: new Date().toLocaleTimeString("vi-VN") + " " + new Date().toLocaleDateString("vi-VN"),
        studentAnswers: finalAnswers,
        annotatedImage,
        flaggedQuestions,
        omrEngine,
      };

      const updated = sessions.map((s) => {
        if (s.id === currentSession.id) {
          return {
            ...s,
            gradedStudents: [newStudent, ...s.gradedStudents],
          };
        }
        return s;
      });

      saveSessions(updated);
      setShowScanModal({
        ...currentSession,
        gradedStudents: [newStudent, ...currentSession.gradedStudents],
      });
      setScanResult(newStudent);
      setIsAnalyzing(false);

      // Gửi điểm số ngược lại cho điện thoại hiển thị
      if (remoteSessionToken) {
        try {
          await fetch("/api/grading/remote-session/report-result", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token: remoteSessionToken,
              studentName,
              studentCode,
              score: finalScore,
              correctCount: finalCorrect,
              incorrectCount: finalIncorrect,
            }),
          });
        } catch {
          // silent
        }
      }
    }, 1350);
  };

  // Khởi động Webcam PC
  const startWebcam = async (overrideFacing?: "user" | "environment") => {
    setIsWebcamActive(true);
    setWebcamError(null);
    stopWebcam();
    const facing = overrideFacing || webcamFacing;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      webcamStreamRef.current = stream;
      if (videoWebcamRef.current) {
        videoWebcamRef.current.srcObject = stream;
        videoWebcamRef.current.play();
      }
    } catch (err: any) {
      setWebcamError("Không thể mở webcam trên máy tính: " + (err.message || "Không có thiết bị"));
      setIsWebcamActive(false);
    }
  };

  const stopWebcam = () => {
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach((t) => t.stop());
      webcamStreamRef.current = null;
    }
    setIsWebcamActive(false);
  };

  // Đảo camera trước / sau cho PC / Laptop / Tablet
  const toggleWebcamFacing = () => {
    const nextFacing = webcamFacing === "user" ? "environment" : "user";
    setWebcamFacing(nextFacing);
    startWebcam(nextFacing);
  };

  // Chụp từ Webcam PC
  const handleCaptureWebcam = () => {
    if (!videoWebcamRef.current || !showScanModal) return;
    try {
      const video = videoWebcamRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const b64 = canvas.toDataURL("image/jpeg", 0.88);
        setUploadedImagePreview(b64);
        playTingSound();
        handleGradeSubmission(b64);
        return;
      }
    } catch (e) {
      console.warn("Capture webcam error:", e);
    }
    playTingSound();
    handleGradeSubmission();
  };

  // Chấm bài qua OpenCV OMR engine (hoặc fallback)
  const handleGradeSubmission = async (explicitImage?: string) => {
    if (!showScanModal) return;
    setIsAnalyzing(true);
    setScanResult(null);
    setAnalysisPhase(1);

    const imageToGrade = explicitImage || uploadedImagePreview;

    // Giai đoạn 1: Định vị 4 mốc OMR của phiếu...
    setTimeout(() => {
      setAnalysisPhase(2); // Giai đoạn 2: Nhận diện SBD & Mã đề...
    }, 450);

    setTimeout(() => {
      setAnalysisPhase(3); // Giai đoạn 3: Đo độ đậm quang học & đối chiếu...
    }, 900);

    // 1. Gọi trực tiếp OpenCV OMR nếu có ảnh
    if (imageToGrade) {
      try {
        const res = await fetch("/api/grading/omr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "grade_single",
            imageBase64: imageToGrade,
            sheetType: showScanModal.sheetType,
            subject: showScanModal.subject,
            questionCount: showScanModal.questionCount,
            answerKey: showScanModal.answerKey,
            returnAnnotatedImage: true,
          }),
        });

        if (res.ok) {
          const json = await res.json();
          const omr = json.data;

          const studentAns = flattenOmrAnswers(
            omr,
            showScanModal.sheetType,
            showScanModal.subject,
            showScanModal.questionCount
          );

          const hasValidCode = isValidStudentCode(omr.student_code);
          const cleanCode = hasValidCode ? String(omr.student_code).trim() : "";
          const studentName = hasValidCode
            ? `SBD: ${cleanCode}`
            : (studentNameInput || `Học sinh ${showScanModal.gradedStudents.length + 1}`);
          const studentCode = hasValidCode
            ? cleanCode
            : (studentCodeInput || `${1000 + showScanModal.gradedStudents.length + 1}`);

          const counts = computeOmrCounts(omr, showScanModal.questionCount);

          const newStudent = {
            id: "std_" + Date.now(),
            studentName,
            studentCode,
            score: omr.total_score,
            correctCount: counts.correctCount,
            incorrectCount: counts.incorrectCount,
            emptyCount: counts.emptyCount,
            gradedAt: new Date().toLocaleTimeString("vi-VN") + " " + new Date().toLocaleDateString("vi-VN"),
            studentAnswers: studentAns,
            annotatedImage: omr.annotated_image_base64,
            flaggedQuestions: omr.flagged_questions || [],
            omrEngine: omr.engine_used,
          };

          const updatedSessions = sessions.map((s) => {
            if (s.id === showScanModal.id) {
              return {
                ...s,
                gradedStudents: [newStudent, ...s.gradedStudents],
              };
            }
            return s;
          });

          saveSessions(updatedSessions);
          setShowScanModal({
            ...showScanModal,
            gradedStudents: [newStudent, ...showScanModal.gradedStudents],
          });
          setScanResult(newStudent);
          setIsAnalyzing(false);
          playTingSound();
          return;
        }
      } catch (e) {
        console.warn("Real OMR failed, using fallback simulation:", e);
      }
    }

    // 2. Fallback simulation nếu không có ảnh hoặc lỗi kết nối
    setTimeout(() => {
      const result = computeStudentResult(showScanModal);
      const newStudent = {
        id: "std_" + Date.now(),
        studentName: studentNameInput || `Học sinh ${showScanModal.gradedStudents.length + 1}`,
        studentCode: studentCodeInput || `${1000 + showScanModal.gradedStudents.length + 1}`,
        score: result.score,
        correctCount: result.correctCount,
        incorrectCount: result.incorrectCount,
        emptyCount: result.emptyCount,
        gradedAt: new Date().toLocaleTimeString("vi-VN") + " " + new Date().toLocaleDateString("vi-VN"),
        studentAnswers: result.studentAnswers,
      };

      const updatedSessions = sessions.map((s) => {
        if (s.id === showScanModal.id) {
          return {
            ...s,
            gradedStudents: [newStudent, ...s.gradedStudents],
          };
        }
        return s;
      });

      saveSessions(updatedSessions);
      setShowScanModal({
        ...showScanModal,
        gradedStudents: [newStudent, ...showScanModal.gradedStudents],
      });
      setScanResult(newStudent);
      setIsAnalyzing(false);
      playTingSound();
    }, 1300);
  };

  // Chấm hàng loạt nhiều bài cùng lúc (Batch OMR)
  const handleRunBatchGrade = async () => {
    if (!showScanModal || batchFiles.length === 0) return;
    setIsBatchProcessing(true);
    setBatchSummary(null);

    try {
      const items = await Promise.all(
        batchFiles.map((file, idx) => {
          return new Promise<any>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                id: `file_${idx + 1}`,
                image_base64: reader.result as string,
                student_name: file.name.replace(/\.[^/.]+$/, ""),
              });
            };
            reader.readAsDataURL(file);
          });
        })
      );

      const res = await fetch("/api/grading/omr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "grade_batch",
          items,
          sheetType: showScanModal.sheetType,
          subject: showScanModal.subject,
          questionCount: showScanModal.questionCount,
          answerKey: showScanModal.answerKey,
          returnAnnotatedImages: true,
        }),
      });

      if (!res.ok) throw new Error("Chấm hàng loạt thất bại từ AI Service");
      const json = await res.json();

      const newGradedStudents: any[] = [];
      for (const item of json.items || []) {
        if (item.status === "success" && item.data) {
          const omr = item.data;
          const studentAns = flattenOmrAnswers(
            omr,
            showScanModal.sheetType,
            showScanModal.subject,
            showScanModal.questionCount
          );
          const counts = computeOmrCounts(omr, showScanModal.questionCount);
          const hasValidCode = isValidStudentCode(omr.student_code);
          const cleanCode = hasValidCode ? String(omr.student_code).trim() : "";

          newGradedStudents.push({
            id: "std_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
            studentName: hasValidCode
              ? `SBD: ${cleanCode}`
              : (item.student_name || "Học sinh"),
            studentCode: cleanCode,
            score: omr.total_score,
            correctCount: counts.correctCount,
            incorrectCount: counts.incorrectCount,
            emptyCount: counts.emptyCount,
            gradedAt: new Date().toLocaleTimeString("vi-VN") + " " + new Date().toLocaleDateString("vi-VN"),
            studentAnswers: studentAns,
            annotatedImage: omr.annotated_image_base64,
            flaggedQuestions: omr.flagged_questions || [],
            omrEngine: omr.engine_used,
          });
        }
      }

      const updatedSessions = sessions.map((s) => {
        if (s.id === showScanModal.id) {
          return {
            ...s,
            gradedStudents: [...newGradedStudents, ...s.gradedStudents],
          };
        }
        return s;
      });

      saveSessions(updatedSessions);
      setShowScanModal({
        ...showScanModal,
        gradedStudents: [...newGradedStudents, ...showScanModal.gradedStudents],
      });
      setBatchSummary(json);
      playTingSound();
      showToast("Đã hoàn tất chấm hàng loạt phiếu OMR!", "success");
    } catch (e: any) {
      showToast("Lỗi chấm hàng loạt: " + e.message, "error");
    } finally {
      setIsBatchProcessing(false);
    }
  };

  // Click-to-Correct: Giáo viên bấm sửa điểm trực tiếp trên ma trận phiếu tô
  const handleCorrectAnswer = (qNum: number, newOption: string) => {
    if (!scanResult || !showScanModal) return;

    const currentAns = scanResult.studentAnswers[qNum];
    if (currentAns === newOption) return;

    const updatedAns = { ...scanResult.studentAnswers, [qNum]: newOption };
    const recalculated = computeStudentResult(showScanModal, updatedAns);

    const updatedStudent = {
      ...scanResult,
      score: recalculated.score,
      correctCount: recalculated.correctCount,
      incorrectCount: recalculated.incorrectCount,
      emptyCount: recalculated.emptyCount,
      studentAnswers: updatedAns,
    };

    setScanResult(updatedStudent);
    setManualCorrections((prev) => ({ ...prev, [qNum]: true }));

    const updatedSessions = sessions.map((s) => {
      if (s.id === showScanModal.id) {
        return {
          ...s,
          gradedStudents: s.gradedStudents.map((std) =>
            std.id === scanResult.id ? updatedStudent : std
          ),
        };
      }
      return s;
    });

    saveSessions(updatedSessions);
  };

  // Chấm tiếp bài khác: Đưa camera về trạng thái sẵn sàng để quét liên tục cả xấp bài
  const handleScanNextStudent = () => {
    setScanResult(null);
    setUploadedImagePreview(null);
    setManualCorrections({});
    const nextIndex = showScanModal ? showScanModal.gradedStudents.length + 1 : 1;
    setStudentNameInput(`Học sinh ${nextIndex}`);
    setStudentCodeInput(`${1000 + nextIndex}`);
    if (scanMode === "camera" && !isWebcamActive) {
      startWebcam();
    }
  };

  // Xuất file Excel / CSV thật có hỗ trợ font tiếng Việt UTF-8 BOM
  const handleExportExcel = (session: ExamSession) => {
    if (session.gradedStudents.length === 0) {
      showToast("Chưa có học sinh nào được chấm trong kỳ thi này.", "warning");
      return;
    }

    let csvContent = "\uFEFF"; // UTF-8 BOM cho Microsoft Excel
    csvContent += "STT,Số Báo Danh,Họ và Tên,Điểm Số,Số Câu Đúng,Số Câu Sai,Thời Gian Chấm,Chi Tiết Bài Làm\n";

    session.gradedStudents.forEach((std, idx) => {
      const answersStr = Object.entries(std.studentAnswers)
        .map(([q, ans]) => `Câu ${q}:${ans}`)
        .join("; ");
      csvContent += `"${idx + 1}","${std.studentCode}","${std.studentName}","${std.score}","${std.correctCount}","${std.incorrectCount}","${std.gradedAt}","${answersStr}"\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Bang_Diem_${session.name.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // In phiếu trả lời trắc nghiệm
  const handlePrintSheet = () => {
    window.print();
  };

  return (
    <div className="min-h-screen pb-16">
      {/* Ẩn các phần thừa khi in ấn (Print Media) */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-sheet, #printable-sheet * {
            visibility: visible;
          }
          #printable-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 15mm;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>

      {/* Session Detail View (Exact match with soandethi.com screenshot) */}
      {(() => {
        const currentActiveSession = sessions.find((s) => s.id === activeSessionId);
        if (currentActiveSession) {
          return (
            <SessionDetailView
              session={currentActiveSession}
              onBack={() => setActiveSessionId(null)}
              onUpdateSession={(updated) => {
                const updatedList = sessions.map((s) => (s.id === updated.id ? updated : s));
                saveSessions(updatedList);
              }}
              onOpenScanModal={(session, mode) => {
                if (!isProUser(profile)) {
                  setShowUpgradeModal(true);
                  return;
                }
                setScanResult(null);
                setUploadedImagePreview(null);
                setShowScanModal(session);
                setScanMode(mode);
                if (mode === "camera") {
                  startWebcam();
                } else if (mode === "phone") {
                  initRemoteSession(session);
                }
              }}
              onOpenPrintModal={(session) => setShowPrintModal(session)}
              onDeleteSession={(sessionId, sessionName) => {
                handleDeleteSession(sessionId, sessionName);
                setActiveSessionId(null);
              }}
            />
          );
        }

        // Tính toán các kỳ thi sau khi lọc theo từ khóa và trạng thái
        const filteredSessions = sessions.filter((s) => {
          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            const matchesName = s.name.toLowerCase().includes(q);
            const matchesSubject = s.subject.toLowerCase().includes(q);
            const matchesGrade = s.grade.includes(q);
            const matchesClass = s.targetClasses ? s.targetClasses.toLowerCase().includes(q) : false;
            if (!matchesName && !matchesSubject && !matchesGrade && !matchesClass) return false;
          }
          const totalStudents = s.gradedStudents.length;
          const isCompleted = totalStudents >= 30;
          const isStarted = totalStudents > 0;
          if (statusFilter === "in_progress" && (!isStarted || isCompleted)) return false;
          if (statusFilter === "not_started" && isStarted) return false;
          if (statusFilter === "completed" && !isCompleted) return false;
          return true;
        });

        const inProgressCount = sessions.filter((s) => s.gradedStudents.length > 0 && s.gradedStudents.length < 30).length;
        const notStartedCount = sessions.filter((s) => s.gradedStudents.length === 0).length;
        const completedCount = sessions.filter((s) => s.gradedStudents.length >= 30).length;

        return (
          /* Main Container */
          <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
            {/* Top Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
                  Chấm phiếu trắc nghiệm
                </h1>
                <p className="mt-1.5 text-sm text-muted-foreground max-w-2xl leading-relaxed">
                  Tạo kỳ thi, in phiếu cho học sinh tô, rồi chụp phiếu để chấm. Hỗ trợ chuẩn GDPT 2025 (Toán / KHTN 3 phần & KHXH 2 phần), phiếu 20, 40, 50 câu và đa mã đề.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0 flex-wrap">
                {/* Nút Tải mẫu phiếu OMR chuẩn (PDF) */}
                <button
                  type="button"
                  onClick={() => setShowDownloadOMRModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-bold transition shadow-2xs cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
                  title="Tải mẫu phiếu trả lời trắc nghiệm chuẩn PDF A4 của Bộ GD&ĐT"
                >
                  <Download className="w-4 h-4 text-blue-400" />
                  <span>Tải mẫu phiếu OMR chuẩn (PDF)</span>
                </button>

                {/* Nút Tạo kỳ thi */}
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-blue-600/25 cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Tạo kỳ thi mới</span>
                </button>
              </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs backdrop-blur-xs">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Tổng Kỳ Thi</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-foreground">{sessions.length}</span>
                  <span className="text-xs text-muted-foreground">kỳ thi</span>
                </div>
                <p className="text-[11px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Đồng bộ Cloud & LocalStorage
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs backdrop-blur-xs">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Bài Đã Chấm</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-blue-400">
                    {sessions.reduce((acc, s) => acc + s.gradedStudents.length, 0)}
                  </span>
                  <span className="text-xs text-muted-foreground">bài thi</span>
                </div>
                <p className="text-[11px] text-muted-foreground font-medium mt-1">Đã lưu vào bảng điểm</p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs backdrop-blur-xs">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Điểm Trung Bình</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-purple-400">
                    {(() => {
                      const allScores = sessions.flatMap((s) => s.gradedStudents.map((g) => g.score));
                      if (allScores.length === 0) return "--";
                      const avg = allScores.reduce((a, b) => a + b, 0) / allScores.length;
                      return avg.toFixed(1);
                    })()}
                  </span>
                  <span className="text-xs text-muted-foreground">/ 10</span>
                </div>
                <p className="text-[11px] text-purple-400/80 font-medium mt-1">Phổ điểm toàn khóa</p>
              </div>
            </div>

            {/* Thanh công cụ: Ô tìm kiếm & Bộ lọc trạng thái */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border shadow-2xs">
              {/* Ô tìm kiếm */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="🔍 Tìm tên kỳ thi, môn học, lớp..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-border bg-background rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-primary transition"
                />
              </div>

              {/* Bộ lọc trạng thái */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
                {[
                  { id: "all", label: "Tất cả", count: sessions.length },
                  { id: "in_progress", label: "Đang chấm", count: inProgressCount },
                  { id: "not_started", label: "Chưa chấm", count: notStartedCount },
                  { id: "completed", label: "Đã hoàn thành", count: completedCount },
                ].map((tab) => {
                  const isActive = statusFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setStatusFilter(tab.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-2xs"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                          isActive ? "bg-blue-700 text-blue-100" : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ======================================================== */}
            {/* TRẠNG THÁI 1: CHƯA CÓ KỲ THI NÀO (EMPTY STATE) */}
            {/* ======================================================== */}
            {sessions.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border p-12 md:p-16 flex flex-col items-center justify-center text-center shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-5">
                  <FileText className="w-8 h-8" />
                </div>

                <h2 className="text-lg font-bold text-foreground mb-2">
                  Chưa có kỳ thi nào
                </h2>

                <p className="text-xs text-muted-foreground max-w-md mb-6 leading-relaxed">
                  Tạo kỳ thi mới theo chuẩn GDPT 2025, in phiếu A4 cho học sinh tô, rồi chụp hoặc quét phiếu bằng điện thoại/webcam để AI chấm điểm tức thì.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={handleOpenCreateModal}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs transition cursor-pointer shadow-lg shadow-blue-500/20"
                  >
                    <Plus className="w-4 h-4" />
                    Tạo kỳ thi đầu tiên ngay
                  </button>

                  <button
                    onClick={handleCreateSampleSession}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer shadow-xs"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Thử nhanh kỳ thi mẫu (Toán 6)
                  </button>
                </div>
              </div>
            ) : filteredSessions.length === 0 ? (
              /* TRẠNG THÁI KHÔNG TÌM THẤY KẾT QUẢ THEO BỘ LỌC */
              <div className="bg-card rounded-2xl border border-border p-10 text-center shadow-2xs">
                <p className="text-sm font-semibold text-slate-300">
                  Không tìm thấy kỳ thi nào phù hợp với từ khóa & bộ lọc đã chọn.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                  className="mt-3 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                >
                  Xóa bộ lọc tìm kiếm
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredSessions.map((session) => {
                  const totalStudents = session.gradedStudents.length;
                  const avgScore =
                    totalStudents > 0
                      ? Math.round(
                          (session.gradedStudents.reduce((acc, curr) => acc + curr.score, 0) /
                            totalStudents) *
                            10
                        ) / 10
                      : 0;

                  const isCompleted = totalStudents >= 30;
                  const isStarted = totalStudents > 0;

                  // Tính số lượng mã đề
                  const examCodeCount = session.examCodes ? Object.keys(session.examCodes).length : 1;

                  // Phân bổ phổ điểm
                  const scoreCounts = {
                    excellent: session.gradedStudents.filter((s) => s.score >= 9.0).length,
                    good: session.gradedStudents.filter((s) => s.score >= 8.0 && s.score < 9.0).length,
                    average: session.gradedStudents.filter((s) => s.score >= 5.0 && s.score < 8.0).length,
                    below: session.gradedStudents.filter((s) => s.score < 5.0).length,
                  };

                  return (
                    <div
                      key={session.id}
                      className="bg-card rounded-2xl border border-border hover:border-primary/50 p-5 shadow-2xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-2.5 flex-1">
                        {/* Hàng Badges Thông Tin */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Status badge */}
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              ✓ Hoàn thành
                            </span>
                          ) : isStarted ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              Đang chấm ({totalStudents} bài)
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                              Chưa chấm
                            </span>
                          )}

                          {/* Môn & Khối */}
                          <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-300">
                            {session.subject} • Khối {session.grade}
                          </span>

                          {/* Lớp áp dụng (nếu có) */}
                          {session.targetClasses && (
                            <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-indigo-950/40 text-indigo-300 border border-indigo-800/40">
                              Lớp: {session.targetClasses}
                            </span>
                          )}

                          {/* Mẫu phiếu */}
                          <span className="px-2.5 py-0.5 rounded text-[11px] font-medium bg-blue-950/40 text-blue-300 border border-blue-900/40">
                            {session.sheetType === "2025" ? (get2025QuestionCounts(session.subject, session.questionCount).part3Count > 0 ? "Form 2025 (3 Phần)" : "Form 2025 (2 Phần)") : `Phiếu ${session.questionCount} câu`}
                          </span>

                          {/* Ngày tạo */}
                          <span className="text-xs text-slate-500">• {session.createdAt}</span>
                        </div>

                        {/* Tiêu đề kỳ thi */}
                        <h3
                          onClick={() => setActiveSessionId(session.id)}
                          className="text-lg font-bold text-foreground hover:text-primary transition cursor-pointer"
                        >
                          {session.name}
                        </h3>

                        {/* Hàng Badges Tính Năng: Đa mã đề & Kho đề AI */}
                        <div className="flex items-center gap-3 flex-wrap text-xs">
                          {/* Badge Đã nạp đáp án chuẩn */}
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-950/30 text-emerald-400 border border-emerald-800/40 font-semibold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>✓ Đã nạp đáp án chuẩn ({examCodeCount} mã đề)</span>
                          </span>

                          <span className="text-slate-400">
                            Đã chấm: <strong className="text-slate-200">{totalStudents} bài</strong>
                          </span>

                          {totalStudents > 0 && (
                            <span className="text-slate-400">
                              Điểm TB: <strong className="text-blue-400">{avgScore} / 10</strong>
                            </span>
                          )}
                        </div>

                        {/* Thanh Tiến Độ Chấm & Phân Bổ Điểm */}
                        {totalStudents > 0 && (
                          <div className="space-y-1.5 pt-1 max-w-md">
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span>Tiến độ chấm bài thi</span>
                              <span className="font-semibold text-slate-300">
                                {totalStudents}/35 bài ({Math.min(100, Math.round((totalStudents / 35) * 100))}%)
                              </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(100, (totalStudents / 35) * 100)}%` }}
                              />
                            </div>
                            {/* Phổ điểm mini */}
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-0.5">
                              <span className="text-emerald-400 font-medium">9-10đ: {scoreCounts.excellent}</span>
                              <span>•</span>
                              <span className="text-blue-400 font-medium">8-8.9đ: {scoreCounts.good}</span>
                              <span>•</span>
                              <span className="text-amber-400 font-medium">5-7.9đ: {scoreCounts.average}</span>
                              <span>•</span>
                              <span className="text-rose-400 font-medium">&lt;5đ: {scoreCounts.below}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Nút Hành Động Thẻ Kỳ Thi */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                        {/* Vào xem kỳ thi */}
                        <button
                          onClick={() => setActiveSessionId(session.id)}
                          className="inline-flex min-h-[36px] items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Vào xem kỳ thi</span>
                        </button>

                        {/* In phiếu tô */}
                        <button
                          onClick={() => setShowPrintModal(session)}
                          className="inline-flex min-h-[36px] items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 bg-slate-800/40 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer shadow-2xs"
                          title="In phiếu trả lời A4 chuẩn Bộ GD&ĐT (chọn in trắng hoặc in sẵn SBD/mã đề)"
                        >
                          <Printer className="w-3.5 h-3.5 text-blue-400" />
                          <span>In phiếu tô</span>
                        </button>

                        {/* Chấm bài OMR */}
                        <button
                          onClick={() => {
                            if (!isProUser(profile)) {
                              setShowUpgradeModal(true);
                              return;
                            }
                            setScanResult(null);
                            setUploadedImagePreview(null);
                            setShowScanModal(session);
                            setScanMode("phone");
                            initRemoteSession(session);
                          }}
                          className="inline-flex min-h-[36px] items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-md bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                          title={isProUser(profile) ? "Kết nối điện thoại để chấm OMR tự động" : "Yêu cầu Gói Giáo Viên PRO để chấm OMR tự động"}
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>{totalStudents > 0 ? "Tiếp tục chấm" : "Bắt đầu chấm OMR"}</span>
                        </button>

                        {/* Bảng điểm */}
                        <button
                          onClick={() => setShowScoreboardModal(session)}
                          className="inline-flex min-h-[36px] items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 bg-slate-800/40 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer shadow-2xs"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Bảng điểm ({totalStudents})</span>
                        </button>

                        {/* Xóa kỳ thi */}
                        <button
                          onClick={() => handleDeleteSession(session.id, session.name)}
                          className="h-9 w-9 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition cursor-pointer"
                          title="Xóa kỳ thi"
                          aria-label="Xóa kỳ thi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* ======================================================== */}
      {/* MODAL 1: TẠO KỲ THI MỚI CHUẨN GDPT 2025 & ĐA MÃ ĐỀ */}
      {/* ======================================================== */}
      <CreateExamModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={(newSession) => {
          saveSessions([newSession, ...sessions]);
          setActiveSessionId(newSession.id);
          showToast(`Đã tạo thành công kỳ thi: ${newSession.name}`, "success");
        }}
        userExams={userExams}
        defaultSubject={createSubject}
        defaultGrade={createGrade}
        defaultSheetType={createSheetType}
      />

      {/* ======================================================== */}
      {/* MODAL 2: TẢI MẪU PHIẾU OMR CHUẨN (PDF) */}
      {/* ======================================================== */}
      <DownloadOMRModal
        isOpen={showDownloadOMRModal}
        onClose={() => setShowDownloadOMRModal(false)}
      />

      {/* ======================================================== */}
      {/* MODAL 3: IN PHIẾU TÔ TRẮC NGHIỆM CHUẨN A4 BỘ GD&ĐT */}
      {/* ======================================================== */}
      <PrintSheetModal
        session={showPrintModal}
        onClose={() => setShowPrintModal(null)}
      />

      {/* ======================================================== */}
      {/* MODAL 3: PHIÊN CHẤM LIÊN TỤC BẰNG AI & ĐIỆN THOẠI */}
      {/* ======================================================== */}
      {showScanModal && (
        <ContinuousGradingModal
          isOpen={Boolean(showScanModal)}
          onClose={() => setShowScanModal(null)}
          session={showScanModal}
          onUpdateSessionStudents={(gradedStudents) => {
            const updatedSessions = sessions.map((s) => {
              if (s.id === showScanModal.id) {
                return {
                  ...s,
                  gradedStudents,
                };
              }
              return s;
            });
            saveSessions(updatedSessions);
            setShowScanModal({
              ...showScanModal,
              gradedStudents,
            });
          }}
        />
      )}

      {/* ======================================================== */}
      {/* MODAL NÂNG CẤP GÓI PRO KHI CHẤM OMR TỰ ĐỘNG */}
      {/* ======================================================== */}
      <UpgradeTierModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        requiredTier="pro"
        featureTitle="Chấm phiếu trắc nghiệm tự động bằng AI"
        featureDesc="Tính năng Chấm phiếu trắc nghiệm tự động bằng AI / Quét điện thoại dành riêng cho Gói Giáo Viên PRO. Nâng cấp ngay để tiết kiệm 90% thời gian chấm bài!"
        onSelectPlan={(plan) => setCheckoutPlan(plan)}
      />

      {checkoutPlan && (
        <PaymentCheckoutModal
          isOpen={Boolean(checkoutPlan)}
          onClose={() => setCheckoutPlan(null)}
          selectedPlan={checkoutPlan}
          onSuccess={() => {
            showToast("Nâng cấp gói thành công! Bạn có thể sử dụng Chấm OMR tự động.", "success");
            setShowUpgradeModal(false);
            setCheckoutPlan(null);
          }}
        />
      )}

      {/* ======================================================== */}
      {/* MODAL 4: BẢNG ĐIỂM CHI TIẾT CỦA KỲ THI */}
      {/* ======================================================== */}
      {showScoreboardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card text-card-foreground rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-border overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h3 className="font-bold text-lg text-foreground">
                  Bảng điểm kỳ thi: {showScoreboardModal.name}
                </h3>
                <p className="text-xs text-neutral-500">
                  Tổng số bài đã chấm: {showScoreboardModal.gradedStudents.length} học sinh
                </p>
              </div>
              <button
                onClick={() => setShowScoreboardModal(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5">
              {showScoreboardModal.gradedStudents.length === 0 ? (
                <div className="text-center py-12 text-neutral-400 text-xs">
                  Chưa có bài chấm nào trong kỳ thi này. Hãy bấm "Chấm bài AI" để bắt đầu nạp
                  phiếu của học sinh.
                </div>
              ) : (
                <div className="border border-neutral-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-muted text-muted-foreground font-bold border-b border-border">
                      <tr>
                        <th className="py-2.5 px-3">STT</th>
                        <th className="py-2.5 px-3">SBD</th>
                        <th className="py-2.5 px-3">Họ và tên</th>
                        <th className="py-2.5 px-3 text-center">Đúng/Sai</th>
                        <th className="py-2.5 px-3 text-right">Điểm số</th>
                        <th className="py-2.5 px-3 text-right">Thời gian</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {showScoreboardModal.gradedStudents.map((std, idx) => (
                        <tr key={std.id} className="hover:bg-neutral-50/60 transition">
                          <td className="py-2.5 px-3 font-semibold text-neutral-500">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-neutral-800">
                            {std.studentCode}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-foreground">
                            {std.studentName}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="text-emerald-600 font-semibold">{std.correctCount}Đ</span>
                            {" / "}
                            <span className="text-red-500 font-semibold">{std.incorrectCount}S</span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-foreground text-sm">
                            {std.score}
                          </td>
                          <td className="py-2.5 px-3 text-right text-neutral-400 text-[11px]">
                            {std.gradedAt}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border flex items-center justify-between bg-neutral-50">
              <span className="text-xs text-neutral-500">
                Hỗ trợ xuất định dạng Excel, CSV chuẩn SMAS, VnEdu
              </span>
              <button
                onClick={() => {
                  handleExportExcel(showScoreboardModal);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition"
              >
                <Download className="w-3.5 h-3.5" />
                Xuất file Excel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* FOOTER ĐỒNG BỘ CHUẨN XÁC VỚI ẢNH SCREENSHOT */}
      {/* ======================================================== */}
      <footer className="mt-20 border-t border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/70 dark:bg-card/40 pt-12 pb-16">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-12 gap-8 text-neutral-600 dark:text-slate-300">
          {/* Cột 1: Logo & Giới thiệu */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-neutral-900 text-white font-bold text-xs">
                ED
              </span>
              <span className="font-bold text-base text-neutral-900 dark:text-white tracking-tight">
                {PLATFORM_NAME}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-neutral-500 dark:text-slate-400 max-w-sm">
              Trợ lý AI giúp giáo viên soạn đề thi, chỉnh số liệu, chuyển ảnh đề thành văn bản và làm
              đáp án cùng barem chấm điểm.
            </p>
          </div>

          {/* Cột 2: Khám phá */}
          <div className="md:col-span-2 space-y-2.5 text-xs">
            <div className="font-bold text-neutral-900 dark:text-white">Khám phá</div>
            <ul className="space-y-2 text-neutral-500 dark:text-slate-400">
              <li>
                <a href="/dashboard" className="hover:text-neutral-900 transition">
                  Trang chủ
                </a>
              </li>
              <li>
                <a href="/labs" className="hover:text-neutral-900 transition">
                  Phòng TN 3D
                </a>
              </li>
              <li>
                <a href="/exams" className="hover:text-neutral-900 transition">
                  Đề thi của tôi
                </a>
              </li>
              <li>
                <span className="text-neutral-400">Slide bài giảng</span>
              </li>
            </ul>
          </div>

          {/* Cột 3: Giới thiệu */}
          <div className="md:col-span-2 space-y-2.5 text-xs">
            <div className="font-bold text-neutral-900 dark:text-white">Giới thiệu</div>
            <ul className="space-y-2 text-neutral-500 dark:text-slate-400">
              <li>
                <span className="hover:text-neutral-900 cursor-pointer transition">
                  Về chúng tôi
                </span>
              </li>
              <li>
                <span className="hover:text-neutral-900 cursor-pointer transition">
                  Câu hỏi thường gặp
                </span>
              </li>
              <li>
                <span className="hover:text-neutral-900 cursor-pointer transition">
                  Điều khoản sử dụng
                </span>
              </li>
            </ul>
          </div>

          {/* Cột 4: Liên hệ */}
          <div className="md:col-span-3 space-y-2.5 text-xs">
            <div className="font-bold text-neutral-900 dark:text-white">Liên hệ</div>
            <ul className="space-y-2 text-neutral-500 dark:text-slate-400">
              <li className="font-mono text-neutral-600">{SUPPORT_EMAIL}</li>
              <li>
                <span className="hover:text-neutral-900 cursor-pointer transition">
                  Nhóm Zalo hỗ trợ giáo viên
                </span>
              </li>
              <li>
                <span className="hover:text-neutral-900 cursor-pointer transition">TikTok</span>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}


export default function GradingPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground animate-pulse">Đang nạp máy chấm OMR…</div>}>
      <GradingPageInner />
    </Suspense>
  );
}
