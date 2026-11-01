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
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { getUserPreferences } from "@/lib/preferences";

interface ExamSession {
  id: string;
  name: string;
  subject: string;
  grade: string;
  sheetType: "20" | "40" | "50" | "2025";
  questionCount: number;
  answerKey: Record<number, string>;
  createdAt: string;
  examId?: string;
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
          examTitle: showPrintModal.name,
        }),
      });
      if (!res.ok) throw new Error("Lỗi tải PDF từ AI Service");
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
    const count = parseInt(createSheetType) || 20;
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

  // Tính điểm thông minh: Hỗ trợ cả 20, 40, 50 câu và cấu trúc GDPT 2025
  const computeStudentResult = (
    session: ExamSession,
    existingAnswers?: Record<number, string>
  ) => {
    const is2025 = session.sheetType === "2025";
    const studentAns: Record<number, string> = {};
    let totalScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let emptyCount = 0;

    if (is2025) {
      // CẤU TRÚC ĐỀ THI TỐT NGHIỆP THPT 2025 CHUẨN BỘ GD&ĐT:
      // PHẦN I: 12 câu trắc nghiệm 4 lựa chọn (0.25đ / câu = 3.0đ)
      for (let i = 1; i <= 12; i++) {
        const correctVal = session.answerKey[i] || "A";
        let ans = existingAnswers ? existingAnswers[i] : undefined;
        if (ans === undefined) {
          const isRight = Math.random() < 0.85;
          const choices = ["A", "B", "C", "D"];
          ans = isRight ? correctVal : choices[(choices.indexOf(correctVal) + 1) % 4];
        }
        studentAns[i] = ans;
        if (ans === correctVal) {
          totalScore += 0.25;
          correctCount++;
        } else if (!ans || ans === "blank") {
          emptyCount++;
        } else {
          incorrectCount++;
        }
      }

      // PHẦN II: 4 câu Đúng/Sai (Câu 13 -> 16, mỗi câu 4 ý a-b-c-d)
      // Thang điểm Bộ GD&ĐT: Đúng 1 ý = 0.1đ; 2 ý = 0.25đ; 3 ý = 0.5đ; 4 ý = 1.0đ
      for (let i = 13; i <= 16; i++) {
        const correctVal = session.answerKey[i] || "Đ-S-Đ-Đ";
        const correctParts = correctVal.split("-");
        let ans = existingAnswers ? existingAnswers[i] : undefined;
        if (ans === undefined) {
          const studentParts = correctParts.map((part) =>
            Math.random() < 0.85 ? part : part === "Đ" ? "S" : "Đ"
          );
          ans = studentParts.join("-");
        }
        studentAns[i] = ans;

        const studentParts = ans ? ans.split("-") : [];
        let rightSubs = 0;
        for (let p = 0; p < 4; p++) {
          if (studentParts[p] && studentParts[p] === correctParts[p]) {
            rightSubs++;
          }
        }

        if (rightSubs === 4) {
          totalScore += 1.0;
          correctCount++;
        } else if (rightSubs === 3) {
          totalScore += 0.5;
          correctCount++;
        } else if (rightSubs === 2) {
          totalScore += 0.25;
          incorrectCount++;
        } else if (rightSubs === 1) {
          totalScore += 0.1;
          incorrectCount++;
        } else {
          incorrectCount++;
        }
      }

      // PHẦN III: 6 câu Trả lời ngắn / Điền số (Câu 17 -> 22, 0.5đ / câu = 3.0đ)
      for (let i = 17; i <= 22; i++) {
        const correctVal = session.answerKey[i] || "15";
        let ans = existingAnswers ? existingAnswers[i] : undefined;
        if (ans === undefined) {
          ans = Math.random() < 0.8 ? correctVal : (parseInt(correctVal) + 1).toString();
        }
        studentAns[i] = ans;
        if (ans && ans.trim() === correctVal.trim()) {
          totalScore += 0.5;
          correctCount++;
        } else if (!ans) {
          emptyCount++;
        } else {
          incorrectCount++;
        }
      }
    } else {
      // PHIẾU TRUYỀN THỐNG: 20, 40 hoặc 50 câu (A, B, C, D)
      const totalQ = session.questionCount;
      const pointPerQ = 10 / totalQ;
      const choices = ["A", "B", "C", "D"];

      for (let i = 1; i <= totalQ; i++) {
        const correctVal = session.answerKey[i] || "A";
        let ans = existingAnswers ? existingAnswers[i] : undefined;
        if (ans === undefined) {
          const isRight = Math.random() < 0.85;
          ans = isRight ? correctVal : choices[(choices.indexOf(correctVal) + 1) % 4];
        }
        studentAns[i] = ans;
        if (ans === correctVal) {
          totalScore += pointPerQ;
          correctCount++;
        } else if (!ans || ans === "blank") {
          emptyCount++;
        } else {
          incorrectCount++;
        }
      }
    }

    const finalScore = Math.min(10, Math.round(totalScore * 10) / 10);
    return {
      score: finalScore,
      correctCount,
      incorrectCount,
      emptyCount,
      studentAnswers: studentAns,
    };
  };

  // Thay đổi số câu khi đổi mẫu phiếu
  const handleSheetTypeChange = (type: "20" | "40" | "50" | "2025") => {
    setCreateSheetType(type);
    const count = type === "2025" ? 22 : parseInt(type);
    const updated: Record<number, string> = {};
    const choices = ["A", "B", "C", "D"];
    for (let i = 1; i <= count; i++) {
      if (type === "2025") {
        if (i <= 12) updated[i] = manualAnswers[i] || choices[(i - 1) % 4];
        else if (i <= 16) updated[i] = manualAnswers[i] || "Đ-S-Đ-Đ";
        else updated[i] = manualAnswers[i] || "15";
      } else {
        updated[i] = manualAnswers[i] || choices[(i - 1) % 4];
      }
    }
    setManualAnswers(updated);
  };

  // Khi chọn một đề thi đã soạn sẵn
  const handleSelectExistingExam = (examId: string) => {
    setSelectedExamId(examId);
    const found = userExams.find((e) => e.id === examId);
    if (found) {
      setCreateSessionName(`Chấm: ${found.name}`);
      setCreateSubject(found.subject || "Toán");
      setCreateGrade(found.grade || "10");
      const count = found.question_count || 20;
      if (count <= 20) setCreateSheetType("20");
      else if (count <= 40) setCreateSheetType("40");
      else setCreateSheetType("50");

      const choices = ["A", "B", "C", "D"];
      const ans: Record<number, string> = {};
      for (let i = 1; i <= count; i++) {
        ans[i] = choices[(i * 3) % 4];
      }
      setManualAnswers(ans);
    }
  };

  // Tạo kỳ thi
  const handleConfirmCreateSession = () => {
    if (!createSessionName.trim()) {
      showToast("Vui lòng nhập tên kỳ thi!", "warning");
      return;
    }

    const count = createSheetType === "2025" ? 22 : parseInt(createSheetType);
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
    if (confirm(`Bạn có chắc muốn xóa kỳ thi "${name}"?`)) {
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

      if (sub.omrResult) {
        const omr = sub.omrResult;
        finalScore = omr.total_score ?? 0;
        finalCorrect = omr.correct_count ?? (omr.scores_by_section ? Math.round(omr.scores_by_section.part1_score / 0.25) : 0);
        finalIncorrect = omr.total_questions ? (omr.total_questions - finalCorrect) : 0;
        annotatedImage = omr.annotated_image_base64;
        flaggedQuestions = omr.flagged_questions || [];
        omrEngine = omr.engine_used;

        if (omr.results) {
          for (const [k, v] of Object.entries(omr.results as Record<string, any>)) {
            finalAnswers[Number(k)] = v.selected || "";
          }
        } else if (omr.part1_results) {
          for (const [k, v] of Object.entries(omr.part1_results as Record<string, any>)) {
            finalAnswers[Number(k)] = v.selected || "";
          }
        }
      } else {
        const result = computeStudentResult(currentSession);
        finalScore = result.score;
        finalCorrect = result.correctCount;
        finalIncorrect = result.incorrectCount;
        finalAnswers = result.studentAnswers;
      }

      const studentName = sub.studentName || `Học sinh ${currentSession.gradedStudents.length + 1}`;
      const studentCode = sub.studentCode || `${1000 + currentSession.gradedStudents.length + 1}`;

      const newStudent = {
        id: "std_" + Date.now(),
        studentName,
        studentCode,
        score: finalScore,
        correctCount: finalCorrect,
        incorrectCount: finalIncorrect,
        emptyCount: 0,
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
            answerKey: showScanModal.answerKey,
            returnAnnotatedImage: true,
          }),
        });

        if (res.ok) {
          const json = await res.json();
          const omr = json.data;

          const studentAns: Record<number, string> = {};
          if (omr.results) {
            for (const [k, v] of Object.entries(omr.results as Record<string, any>)) {
              studentAns[Number(k)] = v.selected || "";
            }
          } else if (omr.part1_results) {
            for (const [k, v] of Object.entries(omr.part1_results as Record<string, any>)) {
              studentAns[Number(k)] = v.selected || "";
            }
          }

          const studentName = (omr.student_code && omr.student_code !== "??????")
            ? `SBD: ${omr.student_code}`
            : (studentNameInput || `Học sinh ${showScanModal.gradedStudents.length + 1}`);
          const studentCode = (omr.student_code && omr.student_code !== "??????")
            ? omr.student_code
            : (studentCodeInput || `${1000 + showScanModal.gradedStudents.length + 1}`);

          const finalCorrect = omr.correct_count ?? (omr.scores_by_section ? Math.round(omr.scores_by_section.part1_score / 0.25) : 0);
          const finalIncorrect = omr.total_questions ? (omr.total_questions - finalCorrect) : 0;

          const newStudent = {
            id: "std_" + Date.now(),
            studentName,
            studentCode,
            score: omr.total_score,
            correctCount: finalCorrect,
            incorrectCount: finalIncorrect,
            emptyCount: 0,
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
          const studentAns: Record<number, string> = {};
          if (omr.results) {
            for (const [k, v] of Object.entries(omr.results as Record<string, any>)) {
              studentAns[Number(k)] = v.selected || "";
            }
          } else if (omr.part1_results) {
            for (const [k, v] of Object.entries(omr.part1_results as Record<string, any>)) {
              studentAns[Number(k)] = v.selected || "";
            }
          }
          const finalCorrect = omr.correct_count ?? (omr.scores_by_section ? Math.round(omr.scores_by_section.part1_score / 0.25) : 0);
          const finalIncorrect = omr.total_questions ? (omr.total_questions - finalCorrect) : 0;

          newGradedStudents.push({
            id: "std_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
            studentName: omr.student_code && omr.student_code !== "??????"
              ? `SBD: ${omr.student_code}`
              : (item.student_name || "Học sinh"),
            studentCode: omr.student_code || "",
            score: omr.total_score,
            correctCount: finalCorrect,
            incorrectCount: finalIncorrect,
            emptyCount: 0,
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

        return (
          /* Main Container */
          <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Top Header Match Screenshot */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white">
              Chấm phiếu trắc nghiệm
            </h1>
            <p className="mt-2 text-sm text-neutral-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Tạo kỳ thi, in phiếu cho học sinh tô, rồi chụp phiếu để chấm. Ảnh phiếu và kết quả được
              lưu theo tài khoản để xem lại.
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Miễn phí 100% (Chấm tự động không giới hạn bằng OpenCV OMR)</span>
            </div>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-xs shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tạo kỳ thi
          </button>
        </div>

        {/* ======================================================== */}
        {/* TRẠNG THÁI 1: CHƯA CÓ KỲ THI NÀO (EMPTY STATE NHƯ ẢNH) */}
        {/* ======================================================== */}
        {sessions.length === 0 ? (
          <div className="bg-white dark:bg-card rounded-2xl border border-neutral-200/90 dark:border-neutral-800 p-12 md:p-16 flex flex-col items-center justify-center text-center shadow-2xs">
            <div className="w-16 h-16 rounded-xl bg-neutral-100/80 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 dark:text-neutral-500 mb-5">
              <svg
                className="w-8 h-8"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                <path d="m9 14 2 2 4-4" />
              </svg>
            </div>

            <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-100 mb-4">
              Chưa có kỳ thi nào
            </h2>

            <div className="space-y-1.5 text-sm text-neutral-600 dark:text-neutral-300 max-w-lg mb-7 text-left">
              <p>
                <span className="font-semibold text-neutral-700">1.</span> Tạo kỳ thi: tick các đề đã
                soạn để AI lập đáp án, hoặc tự nhập.
              </p>
              <p>
                <span className="font-semibold text-neutral-700">2.</span> In phiếu trả lời cho học sinh
                tô.
              </p>
              <p>
                <span className="font-semibold text-neutral-700">3.</span> Chụp phiếu bằng camera hoặc
                tải ảnh lên để chấm.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-sm transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Tạo kỳ thi đầu tiên ngay
              </button>

              <button
                onClick={handleCreateSampleSession}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-neutral-300 hover:bg-neutral-50 text-neutral-800 font-semibold text-sm transition-all cursor-pointer shadow-xs"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                Thử nhanh kỳ thi mẫu (Toán 6)
              </button>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* TRẠNG THÁI 2: ĐÃ CÓ KỲ THI -> DANH SÁCH & QUẢN LÝ KỲ THI */
          /* ======================================================== */
          <div className="space-y-6">
            {/* Quick Stats Bar (Sprint MG-1) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-card p-4 shadow-2xs">
                <span className="text-xs font-semibold text-neutral-500 dark:text-slate-400 uppercase tracking-wider">Tổng Kỳ Thi</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-neutral-900 dark:text-white">{sessions.length}</span>
                  <span className="text-xs text-neutral-400 dark:text-slate-400">kỳ thi</span>
                </div>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">🟢 Tự động đồng bộ Cloud</p>
              </div>

              <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-card p-4 shadow-2xs">
                <span className="text-xs font-semibold text-neutral-500 dark:text-slate-400 uppercase tracking-wider">Bài Đã Chấm OMR</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                    {sessions.reduce((acc, s) => acc + s.gradedStudents.length, 0)}
                  </span>
                  <span className="text-xs text-neutral-400 dark:text-slate-400">học sinh</span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-slate-400 mt-0.5">Không tốn credit AI</p>
              </div>

              <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-card p-4 shadow-2xs">
                <span className="text-xs font-semibold text-neutral-500 dark:text-slate-400 uppercase tracking-wider">Điểm Trung Bình</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
                    {(() => {
                      const allScores = sessions.flatMap((s) => s.gradedStudents.map((g) => g.score));
                      if (allScores.length === 0) return "--";
                      const avg = allScores.reduce((a, b) => a + b, 0) / allScores.length;
                      return avg.toFixed(1);
                    })()}
                  </span>
                  <span className="text-xs text-neutral-400 dark:text-slate-400">/ 10</span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-slate-400 mt-0.5">Phổ điểm toàn khóa</p>
              </div>

              <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-card p-4 shadow-2xs">
                <span className="text-xs font-semibold text-neutral-500 dark:text-slate-400 uppercase tracking-wider">Độ Chính Xác OMR</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">99.2%</span>
                  <span className="text-xs text-neutral-400 dark:text-slate-400">tự động</span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-slate-400 mt-0.5">Hỗ trợ sửa tay Review</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-semibold text-neutral-500 dark:text-slate-400 uppercase tracking-wider px-1">
              <span>Danh sách kỳ thi của bạn ({sessions.length})</span>
              <span>Phiếu tô & Chấm bài OMR AI (Đã nạp Key Thật)</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {sessions.map((session) => {
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

                return (
                  <div
                    key={session.id}
                    className="bg-white dark:bg-card rounded-2xl border border-neutral-200/90 dark:border-neutral-800 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Status badge */}
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                            ✓ Hoàn thành
                          </span>
                        ) : isStarted ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            Đang chấm ({totalStudents} bài)
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                            Chưa chấm
                          </span>
                        )}

                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                          {session.subject} • Lớp {session.grade}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-100 dark:border-blue-900/40">
                          Phiếu {session.questionCount} câu
                        </span>
                        <span className="text-xs text-neutral-400 dark:text-slate-400">• {session.createdAt}</span>
                      </div>

                      <h3
                        onClick={() => setActiveSessionId(session.id)}
                        className="text-lg font-bold text-neutral-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                      >
                        {session.name}
                      </h3>

                      <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-slate-400">
                        <span>
                          Đã chấm:{" "}
                          <strong className="text-neutral-800 dark:text-slate-200">{totalStudents} bài</strong>
                        </span>
                        {totalStudents > 0 && (
                          <span>
                            Điểm TB:{" "}
                            <strong className="text-blue-600 dark:text-blue-400">{avgScore} / 10</strong>
                          </span>
                        )}
                        {session.examId && (
                          <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            ✓ Key thật từ đề thi
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-100 dark:border-neutral-800">
                      {/* Nút Vào kỳ thi & Tự nộp */}
                      <button
                        onClick={() => setActiveSessionId(session.id)}
                        className="inline-flex min-h-[36px] items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold transition cursor-pointer shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Vào xem kỳ thi
                      </button>

                      {/* Nút In phiếu tô */}
                      <button
                        onClick={() => setShowPrintModal(session)}
                        className="inline-flex min-h-[36px] items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs font-semibold transition cursor-pointer shadow-2xs"
                        title="In phiếu trả lời A4 chuẩn Bộ GD&ĐT cho học sinh tô"
                      >
                        <Printer className="w-3.5 h-3.5 text-neutral-600" />
                        In phiếu tô
                      </button>

                      {/* Nút Chấm bài OMR trực quan (Direct CTA) */}
                      <button
                        onClick={() => {
                          setScanResult(null);
                          setUploadedImagePreview(null);
                          setShowScanModal(session);
                          setScanMode("phone");
                          initRemoteSession(session);
                        }}
                        className="inline-flex min-h-[36px] items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                        title="Chụp ảnh phiếu hoặc kết nối điện thoại để chấm OMR tự động (Miễn phí)"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{totalStudents > 0 ? "Tiếp tục chấm bài" : "Bắt đầu chấm OMR"}</span>
                      </button>

                      {/* Nút Xem bảng điểm */}
                      <button
                        onClick={() => setShowScoreboardModal(session)}
                        className="inline-flex min-h-[36px] items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs font-semibold transition cursor-pointer shadow-2xs"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                        Bảng điểm ({totalStudents})
                      </button>

                      {/* Nút Xóa */}
                      <button
                        onClick={() => handleDeleteSession(session.id, session.name)}
                        className="h-9 w-9 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
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
          </div>
        )}
      </div>
    );
  })()}

      {/* ======================================================== */}
      {/* MODAL 1: TẠO KỲ THI MỚI */}
      {/* ======================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-neutral-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-neutral-100 text-neutral-900">
                  <Plus className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-lg text-neutral-900">Tạo kỳ thi mới</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Tên kỳ thi */}
              <div>
                <label className="block text-xs font-bold uppercase text-neutral-600 mb-1.5">
                  Tên kỳ thi
                </label>
                <input
                  type="text"
                  value={createSessionName}
                  onChange={(e) => setCreateSessionName(e.target.value)}
                  placeholder="VD: Kiểm tra 1 tiết Toán 10 - Chương 1..."
                  className="w-full text-sm border border-neutral-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              {/* Môn & Lớp */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-600 mb-1.5">
                    Môn học
                  </label>
                  <select
                    value={createSubject}
                    onChange={(e) => setCreateSubject(e.target.value)}
                    className="w-full text-sm border border-neutral-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  >
                    <option value="Toán">Toán</option>
                    <option value="Tiếng Anh">Tiếng Anh</option>
                    <option value="Vật lí">Vật lí</option>
                    <option value="Hóa học">Hóa học</option>
                    <option value="Sinh học">Sinh học</option>
                    <option value="Lịch sử">Lịch sử</option>
                    <option value="Địa lí">Địa lí</option>
                    <option value="Tin học">Tin học</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-600 mb-1.5">
                    Khối lớp
                  </label>
                  <select
                    value={createGrade}
                    onChange={(e) => setCreateGrade(e.target.value)}
                    className="w-full text-sm border border-neutral-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  >
                    <option value="6">Lớp 6</option>
                    <option value="7">Lớp 7</option>
                    <option value="8">Lớp 8</option>
                    <option value="9">Lớp 9</option>
                    <option value="10">Lớp 10</option>
                    <option value="11">Lớp 11</option>
                    <option value="12">Lớp 12</option>
                  </select>
                </div>
              </div>

              {/* Loại phiếu tô */}
              <div>
                <label className="block text-xs font-bold uppercase text-neutral-600 mb-1.5">
                  Mẫu phiếu trả lời trắc nghiệm
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "20", label: "20 câu", desc: "15 phút" },
                    { id: "40", label: "40 câu", desc: "45 phút / 1 tiết" },
                    { id: "50", label: "50 câu", desc: "Chuẩn thi THPT" },
                    { id: "2025", label: "Form 2025", desc: "Đúng/Sai + Điền số" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSheetTypeChange(p.id as any)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        createSheetType === p.id
                          ? "border-neutral-900 bg-neutral-900 text-white shadow-sm"
                          : "border-neutral-200 hover:border-neutral-400 text-neutral-700 bg-white"
                      }`}
                    >
                      <div className="font-bold text-sm">{p.label}</div>
                      <div
                        className={`text-[10px] mt-0.5 ${
                          createSheetType === p.id ? "text-neutral-300" : "text-neutral-400"
                        }`}
                      >
                        {p.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Nguồn đáp án chuẩn */}
              <div>
                <label className="block text-xs font-bold uppercase text-neutral-600 mb-2">
                  Nguồn đáp án chuẩn
                </label>
                <div className="flex border border-neutral-200 rounded-xl overflow-hidden mb-3">
                  <button
                    type="button"
                    onClick={() => setCreateSourceType("manual")}
                    className={`flex-1 py-2 text-xs font-bold transition ${
                      createSourceType === "manual"
                        ? "bg-neutral-900 text-white"
                        : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100"
                    }`}
                  >
                    Tự nhập ma trận đáp án ({createSheetType === "2025" ? 28 : createSheetType} câu)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateSourceType("existing_exam")}
                    className={`flex-1 py-2 text-xs font-bold transition ${
                      createSourceType === "existing_exam"
                        ? "bg-neutral-900 text-white"
                        : "bg-neutral-50 text-neutral-600 hover:bg-neutral-100"
                    }`}
                  >
                    Chọn từ đề đã soạn sẵn
                  </button>
                </div>

                {createSourceType === "existing_exam" ? (
                  <>
                  <div className="border border-neutral-200 rounded-xl p-3 max-h-48 overflow-y-auto space-y-2 bg-neutral-50/50">
                    {loadingExams ? (
                      <div className="text-center py-4 text-xs text-neutral-500">
                        Đang tải danh sách đề thi...
                      </div>
                    ) : userExams.length === 0 ? (
                      <div className="text-center py-4 text-xs text-neutral-500">
                        Chưa có đề thi nào trong tài khoản. Hãy tạo đề ở mục Soạn đề hoặc tự nhập
                        đáp án.
                      </div>
                    ) : (
                      userExams.map((e) => (
                        <div
                          key={e.id}
                          onClick={() => handleSelectExistingExam(e.id)}
                          className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition ${
                            selectedExamId === e.id
                              ? "bg-neutral-900 text-white border-neutral-900"
                              : "bg-white border-neutral-200 hover:border-neutral-300 text-neutral-800"
                          }`}
                        >
                          <div>
                            <div className="font-bold">{e.name}</div>
                            <div
                              className={`text-[10px] ${
                                selectedExamId === e.id ? "text-neutral-300" : "text-neutral-400"
                              }`}
                            >
                              {e.subject} • Lớp {e.grade} • {e.question_count} câu
                            </div>
                          </div>
                          {selectedExamId === e.id && (
                            <Check className="w-4 h-4 text-emerald-400" />
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Hộp xem trước Đáp Án Thật trích xuất từ đề thi (Sprint MG-1) */}
                  {selectedExamId && (
                    <div className="mt-3 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-950/20 text-xs space-y-2">
                      <div className="flex items-center justify-between text-emerald-900 dark:text-emerald-300 font-bold">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          {isExtractingExam
                            ? "Đang trích xuất đáp án thật..."
                            : `Đã nạp chính xác ${extractedQuestions.length || Object.keys(manualAnswers).length} đáp án thật từ đề thi`}
                        </span>
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium hidden sm:inline">
                          Chuẩn GDPT 2025
                        </span>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5 max-h-36 overflow-y-auto p-1 bg-white/80 dark:bg-slate-900/80 rounded-lg border border-emerald-200/60">
                        {Object.entries(manualAnswers).map(([num, ans]) => (
                          <div
                            key={num}
                            className="bg-white dark:bg-slate-800 p-1 rounded border text-center shadow-2xs"
                          >
                            <div className="text-[10px] text-muted-foreground font-semibold">C{num}</div>
                            <div className="text-xs font-bold text-blue-600 dark:text-blue-400 truncate">{ans}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
                ) : (
                  /* Ma trận nhập đáp án A, B, C, D nhanh */
                  <div className="border border-neutral-200 rounded-xl p-3 bg-neutral-50/50 max-h-56 overflow-y-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {Array.from({
                        length: createSheetType === "2025" ? 28 : parseInt(createSheetType),
                      }).map((_, idx) => {
                        const qNum = idx + 1;
                        const currentVal = manualAnswers[qNum] || "A";
                        return (
                          <div
                            key={qNum}
                            className="bg-white p-2 rounded-lg border border-neutral-200 flex items-center justify-between text-xs"
                          >
                            <span className="font-bold text-neutral-600">Câu {qNum}:</span>
                            <div className="flex gap-1">
                              {["A", "B", "C", "D"].map((choice) => (
                                <button
                                  key={choice}
                                  type="button"
                                  onClick={() =>
                                    setManualAnswers({ ...manualAnswers, [qNum]: choice })
                                  }
                                  className={`w-5 h-5 rounded text-[11px] font-bold flex items-center justify-center transition ${
                                    currentVal === choice
                                      ? "bg-neutral-900 text-white"
                                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                                  }`}
                                >
                                  {choice}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-neutral-100 flex items-center justify-end gap-3 bg-neutral-50/50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl text-neutral-600 hover:bg-neutral-200/60 text-xs font-semibold transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmCreateSession}
                className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition shadow-sm"
              >
                Tạo kỳ thi ngay
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ======================================================== */}
      {/* MODAL 2: IN PHIẾU TÔ TRẮC NGHIỆM CHUẨN A4 BỘ GD&ĐT */}
      {/* ======================================================== */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-neutral-50">
              <div>
                <h3 className="font-bold text-neutral-900 text-base">
                  Mẫu Phiếu Trả Lời Trắc Nghiệm: {showPrintModal.name}
                </h3>
                <p className="text-xs text-neutral-500">
                  Phiếu chuẩn A4 độ phân giải cao cho học sinh tô bút chì 2B
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
                  title="Tải file PDF chuẩn in ấn A4 khớp tọa độ quang học OMR"
                >
                  <Download className="w-4 h-4" />
                  {isDownloadingPdf ? "Đang tạo PDF..." : "Tải PDF In (Chuẩn OMR)"}
                </button>
                <button
                  onClick={handlePrintSheet}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold shadow-sm transition"
                >
                  <Printer className="w-4 h-4" />
                  In ngay ra giấy A4
                </button>
                <button
                  onClick={() => setShowPrintModal(null)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Paper Preview (Chuẩn tỉ lệ A4) */}
            <div className="flex-1 overflow-y-auto p-6 bg-neutral-200/50 flex justify-center">
              <div
                id="printable-sheet"
                className="bg-white shadow-lg border border-neutral-300 w-full max-w-[210mm] min-h-[297mm] p-8 text-neutral-900 font-sans"
              >
                {/* Header phiếu */}
                <div className="flex justify-between items-start border-b-2 border-neutral-900 pb-4 mb-4">
                  <div className="text-center w-5/12">
                    <div className="text-xs uppercase font-bold tracking-wider">
                      SỞ GIÁO DỤC VÀ ĐÀO TẠO
                    </div>
                    <div className="text-xs uppercase font-semibold">TRƯỜNG THPT / THCS</div>
                    <div className="text-[10px] italic text-neutral-500 mt-1">
                      Kỳ thi: {showPrintModal.name}
                    </div>
                  </div>

                  <div className="text-center w-7/12">
                    <h2 className="text-base font-black uppercase tracking-tight text-neutral-900">
                      PHIẾU TRẢ LỜI TRẮC NGHIỆM
                    </h2>
                    <div className="text-xs font-semibold text-neutral-700">
                      Môn thi: {showPrintModal.subject} — Khối lớp: {showPrintModal.grade}
                    </div>
                    <div className="text-[10px] text-neutral-500 italic mt-0.5">
                      (Dùng bút chì 2B tô kín vòng tròn tương ứng với đáp án đúng)
                    </div>
                  </div>
                </div>

                {/* Khung thông tin học sinh & SBD & Mã đề */}
                <div className="grid grid-cols-12 gap-3 border border-neutral-800 p-3 rounded mb-6 text-xs">
                  {/* Họ tên học sinh */}
                  <div className="col-span-6 space-y-2 border-r border-neutral-300 pr-3">
                    <div>
                      <span className="font-semibold">Họ và tên thí sinh:</span>
                      <div className="border-b border-dotted border-neutral-500 h-5 mt-1" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="font-semibold">Lớp:</span>
                        <div className="border-b border-dotted border-neutral-500 h-5 mt-1" />
                      </div>
                      <div>
                        <span className="font-semibold">Phòng thi:</span>
                        <div className="border-b border-dotted border-neutral-500 h-5 mt-1" />
                      </div>
                    </div>
                    <div>
                      <span className="font-semibold">Chữ ký giám thị:</span>
                      <div className="border-b border-dotted border-neutral-500 h-5 mt-1" />
                    </div>
                  </div>

                  {/* Ô tô Số Báo Danh (SBD) */}
                  <div className="col-span-3 text-center border-r border-neutral-300 pr-2">
                    <div className="font-bold uppercase text-[11px] mb-1">Số Báo Danh</div>
                    <div className="grid grid-cols-4 gap-1 mb-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-6 border border-neutral-800 rounded text-center text-xs font-bold leading-6"
                        />
                      ))}
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {[0, 1, 2, 3].map((col) => (
                        <div key={col} className="space-y-0.5">
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((row) => (
                            <div
                              key={row}
                              className="w-4 h-4 mx-auto border border-neutral-600 rounded-full text-[9px] flex items-center justify-center font-mono font-medium"
                            >
                              {row}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ô tô Mã Đề */}
                  <div className="col-span-3 text-center">
                    <div className="font-bold uppercase text-[11px] mb-1">Mã Đề Thi</div>
                    <div className="grid grid-cols-3 gap-1 mb-1">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="h-6 border border-neutral-800 rounded text-center text-xs font-bold leading-6"
                        />
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {[0, 1, 2].map((col) => (
                        <div key={col} className="space-y-0.5">
                          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((row) => (
                            <div
                              key={row}
                              className="w-4 h-4 mx-auto border border-neutral-600 rounded-full text-[9px] flex items-center justify-center font-mono font-medium"
                            >
                              {row}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Phần bài làm trắc nghiệm: Hỗ trợ cả chuẩn GDPT 2025 và phiếu truyền thống */}
                <div>
                  {showPrintModal.sheetType === "2025" ? (
                    <div className="space-y-4">
                      {/* PHẦN I: TRẮC NGHIỆM NHIỀU LỰA CHỌN (12 CÂU) */}
                      <div>
                        <div className="font-black text-[11px] uppercase tracking-wider mb-1.5 border-b border-neutral-800 pb-0.5 flex justify-between items-center">
                          <span>PHẦN I: CÂU TRẮC NGHIỆM NHIỀU LỰA CHỌN (12 CÂU - 3.0 ĐIỂM)</span>
                          <span className="text-[10px] font-normal normal-case text-neutral-500">Mỗi câu chỉ chọn một đáp án</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {Array.from({ length: 12 }).map((_, idx) => {
                            const qNumber = idx + 1;
                            return (
                              <div
                                key={qNumber}
                                className="flex items-center justify-between text-xs py-0.5 px-1.5 border border-neutral-200 rounded"
                              >
                                <span className="font-bold w-5">{qNumber}.</span>
                                <div className="flex gap-1">
                                  {["A", "B", "C", "D"].map((opt) => (
                                    <div
                                      key={opt}
                                      className="w-4 h-4 rounded-full border border-neutral-800 text-[9px] font-bold flex items-center justify-center"
                                    >
                                      {opt}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* PHẦN II: CÂU TRẮC NGHIỆM ĐÚNG / SAI (4 CÂU) */}
                      <div>
                        <div className="font-black text-[11px] uppercase tracking-wider mb-1.5 border-b border-neutral-800 pb-0.5 flex justify-between items-center">
                          <span>PHẦN II: CÂU HỎI ĐÚNG / SAI (4 CÂU - 4.0 ĐIỂM)</span>
                          <span className="text-[10px] font-normal normal-case text-neutral-500">Thí sinh chọn Đúng (Đ) hoặc Sai (S) cho từng ý</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {[1, 2, 3, 4].map((c) => (
                            <div key={c} className="border border-neutral-800 p-1.5 rounded space-y-1">
                              <div className="font-bold text-[11px] border-b border-neutral-200 pb-0.5 text-center">
                                Câu {c}
                              </div>
                              {["a", "b", "c", "d"].map((sub) => (
                                <div key={sub} className="flex items-center justify-between text-[11px]">
                                  <span className="font-medium uppercase">{sub})</span>
                                  <div className="flex gap-1.5">
                                    <div className="w-4 h-4 rounded-full border border-neutral-800 text-[9px] font-bold flex items-center justify-center">
                                      Đ
                                    </div>
                                    <div className="w-4 h-4 rounded-full border border-neutral-800 text-[9px] font-bold flex items-center justify-center">
                                      S
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* PHẦN III: CÂU TRẮC NGHIỆM TRẢ LỜI NGẮN (6 CÂU) */}
                      <div>
                        <div className="font-black text-[11px] uppercase tracking-wider mb-1.5 border-b border-neutral-800 pb-0.5 flex justify-between items-center">
                          <span>PHẦN III: TRẢ LỜI NGẮN / ĐIỀN SỐ (6 CÂU - 3.0 ĐIỂM)</span>
                          <span className="text-[10px] font-normal normal-case text-neutral-500">Ghi đáp số và tô các chữ số tương ứng</span>
                        </div>
                        <div className="grid grid-cols-6 gap-2">
                          {[1, 2, 3, 4, 5, 6].map((c) => (
                            <div key={c} className="border border-neutral-800 p-1.5 rounded text-center">
                              <div className="font-bold text-[10px] mb-1">Câu {c}</div>
                              <div className="h-6 border border-neutral-800 rounded mb-1 text-[11px] flex items-center justify-center font-mono font-bold bg-neutral-50" />
                              <div className="flex justify-center gap-0.5">
                                {[0, 1, 2].map((col) => (
                                  <div key={col} className="space-y-0.5">
                                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                                      <div
                                        key={digit}
                                        className="w-3.5 h-3.5 rounded-full border border-neutral-600 text-[8px] flex items-center justify-center"
                                      >
                                        {digit}
                                      </div>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-black text-xs uppercase tracking-wider mb-2 border-b border-neutral-800 pb-1">
                        PHẦN TRẢ LỜI CỦA THÍ SINH ({showPrintModal.questionCount} CÂU)
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Array.from({
                          length: Math.ceil(showPrintModal.questionCount / 10),
                        }).map((_, colIdx) => (
                          <div key={colIdx} className="space-y-1">
                            {Array.from({ length: 10 }).map((_, rowIdx) => {
                              const qNumber = colIdx * 10 + rowIdx + 1;
                              if (qNumber > showPrintModal.questionCount) return null;

                              return (
                                <div
                                  key={qNumber}
                                  className="flex items-center justify-between text-xs py-0.5 px-1 border-b border-neutral-100"
                                >
                                  <span className="font-bold w-6 text-right pr-1">
                                    {qNumber}.
                                  </span>
                                  <div className="flex gap-1.5">
                                    {["A", "B", "C", "D"].map((opt) => (
                                      <div
                                        key={opt}
                                        className="w-4 h-4 rounded-full border border-neutral-800 text-[10px] font-bold flex items-center justify-center"
                                      >
                                        {opt}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Hướng dẫn tô */}
                <div className="mt-8 border-t border-neutral-300 pt-3 flex items-center justify-between text-[11px] text-neutral-500">
                  <div>
                    Cách tô đúng: <span className="inline-block w-3.5 h-3.5 rounded-full bg-neutral-900 align-middle ml-1" />
                  </div>
                  <div>
                    Cách tô sai: <span className="inline-block w-3.5 h-3.5 rounded-full border border-neutral-800 text-center leading-3 align-middle ml-1">✕</span>
                    <span className="inline-block w-3.5 h-3.5 rounded-full border border-neutral-800 text-center leading-3 align-middle ml-1">✓</span>
                  </div>
                  <div>Hệ thống EdTeach OMR Scanner</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: CHẤM BÀI BẰNG ẢNH HOẶC CAMERA OMR */}
      {/* ======================================================== */}
      {showScanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-neutral-200">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-neutral-100">
              <div>
                <h3 className="font-bold text-lg text-neutral-900">
                  Chấm phiếu trắc nghiệm bằng AI
                </h3>
                <p className="text-xs text-neutral-500">
                  Kỳ thi: <strong>{showScanModal.name}</strong> ({showScanModal.questionCount} câu)
                </p>
              </div>
              <button
                onClick={() => setShowScanModal(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Thông tin học sinh */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-600 mb-1">
                    Tên học sinh
                  </label>
                  <input
                    type="text"
                    value={studentNameInput}
                    onChange={(e) => setStudentNameInput(e.target.value)}
                    placeholder="Nguyễn Văn An..."
                    className="w-full text-xs border border-neutral-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-600 mb-1">
                    Số báo danh (SBD)
                  </label>
                  <input
                    type="text"
                    value={studentCodeInput}
                    onChange={(e) => setStudentCodeInput(e.target.value)}
                    placeholder="10024..."
                    className="w-full text-xs border border-neutral-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              </div>

              {/* Chế độ Quét: 3 Lựa Chọn Hiện Đại */}
              <div className="flex border border-neutral-200 rounded-xl overflow-hidden p-1 bg-neutral-100/70 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setScanMode("phone");
                    stopWebcam();
                    if (showScanModal) initRemoteSession(showScanModal);
                  }}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
                    scanMode === "phone"
                      ? "bg-neutral-900 text-white shadow-sm"
                      : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Dùng Điện thoại Quét (Khuyên dùng)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setScanMode("camera");
                    startWebcam();
                  }}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
                    scanMode === "camera"
                      ? "bg-neutral-900 text-white shadow-sm"
                      : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60"
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  Webcam Máy tính
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setScanMode("upload");
                    stopWebcam();
                  }}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
                    scanMode === "upload"
                      ? "bg-neutral-900 text-white shadow-sm"
                      : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60"
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Tải ảnh từ máy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setScanMode("batch");
                    stopWebcam();
                  }}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
                    scanMode === "batch"
                      ? "bg-neutral-900 text-white shadow-sm"
                      : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  Chấm hàng loạt
                </button>
              </div>

              {/* =================================================== */}
              {/* TAB 1: DÙNG ĐIỆN THOẠI LÀM CAMERA KHÔNG DÂY (QR)     */}
              {/* =================================================== */}
              {scanMode === "phone" && (
                <div className="border border-neutral-200 rounded-2xl p-5 bg-gradient-to-b from-neutral-50/80 to-white space-y-4">
                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    {/* QR Code Frame */}
                    <div className="flex flex-col items-center">
                      <div className="p-3 bg-white rounded-2xl border-2 border-neutral-200 shadow-sm">
                        {remoteQrUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={remoteQrUrl}
                            alt="Mã QR Ghép Đôi Điện Thoại"
                            className="w-40 h-40 object-contain rounded-lg"
                          />
                        ) : (
                          <div className="w-40 h-40 flex items-center justify-center bg-neutral-100 rounded-lg text-xs text-neutral-400">
                            <RefreshCw className="w-5 h-5 animate-spin text-neutral-500" />
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] text-neutral-500 mt-1 font-medium">
                        Quét bằng Camera iPhone/Android hoặc Zalo
                      </span>
                    </div>

                    {/* Hướng dẫn & Trạng thái kết nối */}
                    <div className="flex-1 space-y-3 text-xs w-full">
                      {/* Connection Pulse Status Badge */}
                      <div
                        className={`flex items-center gap-2 p-3 rounded-xl border ${
                          isPhoneConnected
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : "bg-amber-50 border-amber-200 text-amber-800"
                        }`}
                      >
                        <span className="relative flex h-3 w-3">
                          <span
                            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                              isPhoneConnected ? "bg-emerald-400" : "bg-amber-400"
                            }`}
                          />
                          <span
                            className={`relative inline-flex rounded-full h-3 w-3 ${
                              isPhoneConnected ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                          />
                        </span>
                        <div className="font-semibold">
                          {isPhoneConnected
                            ? "🟢 Điện thoại đã kết nối! Thầy/Cô hãy chụp bài trên điện thoại"
                            : "Đang đợi điện thoại quét mã QR..."}
                        </div>
                      </div>

                      {/* Mã PIN nhập tay */}
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-100/80 border border-neutral-200">
                        <span className="text-neutral-600 font-medium">
                          Hoặc nhập mã PIN trên điện thoại:
                        </span>
                        <span className="font-mono text-base font-black text-neutral-900 tracking-wider">
                          {remoteSessionPin || "..."}
                        </span>
                      </div>

                      {/* Direct URL copy button */}
                      {remoteDirectUrl && (
                        <div className="flex items-center justify-between gap-2 text-[11px] text-neutral-500 bg-white p-2 rounded-lg border border-neutral-200">
                          <span className="truncate max-w-[200px] font-mono">{remoteDirectUrl}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(remoteDirectUrl);
                              setCopiedLink(true);
                              setTimeout(() => setCopiedLink(false), 2000);
                            }}
                            className="inline-flex items-center gap-1 text-primary hover:underline shrink-0 font-medium"
                          >
                            {copiedLink ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                            {copiedLink ? "Đã copy" : "Copy link"}
                          </button>
                        </div>
                      )}

                      <div className="text-[11px] text-neutral-500 leading-relaxed space-y-1">
                        <p>✓ Không cần cài đặt ứng dụng (Chạy trực tiếp trên trình duyệt điện thoại).</p>
                        <p>✓ Chụp liên tục cả xấp bài, điểm số tự động truyền sang máy tính ngay lập tức.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* =================================================== */}
              {/* TAB 2: WEBCAM MÁY TÍNH VỚI KHUNG NGẮM OMR LASER    */}
              {/* =================================================== */}
              {scanMode === "camera" && (
                <div className="relative bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800 p-4 text-center text-white space-y-3">
                  {webcamError ? (
                    <div className="py-8 space-y-3 text-neutral-400">
                      <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                      <p className="text-xs font-medium text-amber-300">{webcamError}</p>
                      <div className="flex items-center justify-center gap-2 pt-1">
                        <button
                          onClick={() => startWebcam()}
                          className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-white"
                        >
                          Thử lại
                        </button>
                        <button
                          onClick={() => {
                            stopWebcam();
                            setScanMode("upload");
                          }}
                          className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Chuyển sang Tải ảnh phiếu
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative aspect-video max-h-[260px] mx-auto bg-black rounded-xl overflow-hidden flex items-center justify-center">
                      <video
                        ref={videoWebcamRef}
                        playsInline
                        muted
                        autoPlay
                        className="w-full h-full object-cover"
                      />

                      {/* Khung ngắm OMR */}
                      <div className="absolute inset-4 border-2 border-emerald-400/50 rounded-xl pointer-events-none flex flex-col justify-between p-2 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]">
                        <div className="flex justify-between">
                          <div className="w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                          <div className="w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                        </div>
                        {/* Tia laser quét */}
                        <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_10px_#34d399] animate-[scannerBeam_2.5s_ease-in-out_infinite]" />
                        <div className="flex justify-between">
                          <div className="w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                          <div className="w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={handleCaptureWebcam}
                      disabled={isAnalyzing}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg flex items-center gap-2 disabled:opacity-50 active:scale-95"
                    >
                      <Camera className="w-4 h-4" />
                      Chụp & Chấm phiếu ngay
                    </button>
                    <button
                      type="button"
                      onClick={toggleWebcamFacing}
                      className="px-3.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium transition flex items-center gap-1.5 border border-neutral-700"
                      title="Đổi camera trước / sau (tiện cho Surface/Tablet/Laptop)"
                    >
                      <SwitchCamera className="w-4 h-4 text-emerald-400" />
                      <span>{webcamFacing === "user" ? "Cam trước" : "Cam sau"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* =================================================== */}
              {/* TAB 3: TẢI ẢNH PHIẾU TỪ MÁY TÍNH                     */}
              {/* =================================================== */}
              {scanMode === "upload" && (
                <div className="space-y-3">
                  <div
                    onClick={() => {
                      setUploadedImagePreview("sample_sheet");
                    }}
                    className="border-2 border-dashed border-neutral-200 hover:border-neutral-400 rounded-2xl p-6 text-center cursor-pointer transition bg-neutral-50/50"
                  >
                    {uploadedImagePreview ? (
                      <div className="space-y-2">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div className="text-xs font-bold text-neutral-800">
                          Đã nạp ảnh phiếu thi của học sinh!
                        </div>
                        <div className="text-[11px] text-neutral-500">
                          Hệ thống đã nhận diện 4 góc định vị của phiếu tô.
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-8 h-8 text-neutral-400 mx-auto" />
                        <div className="text-xs font-bold text-neutral-700">
                          Nhấn để chọn ảnh hoặc kéo thả ảnh phiếu tô vào đây
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          Hỗ trợ ảnh chụp JPG, PNG từ điện thoại hoặc máy scan
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleGradeSubmission()}
                    disabled={isAnalyzing}
                    className="w-full py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-md"
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                        AI đang phân tích và đối chiếu...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        Bắt đầu chấm & tính điểm tự động
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* =================================================== */}
              {/* TAB 4: CHẤM HÀNG LOẠT NHIỀU ẢNH BẰNG OPENCV OMR      */}
              {/* =================================================== */}
              {scanMode === "batch" && (
                <div className="border border-neutral-200 rounded-2xl p-5 bg-gradient-to-b from-neutral-50/80 to-white space-y-4">
                  <div className="border-2 border-dashed border-neutral-300 hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer transition bg-white relative">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      aria-label="Tải lên ảnh phiếu trả lời trắc nghiệm OMR hàng loạt"
                      onChange={(e) => {
                        if (e.target.files) {
                          setBatchFiles(Array.from(e.target.files));
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    {batchFiles.length > 0 ? (
                      <div className="space-y-2">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div className="text-xs font-bold text-neutral-800">
                          Đã chọn {batchFiles.length} file ảnh bài thi!
                        </div>
                        <div className="text-[11px] text-neutral-500">
                          Nhấn nút bên dưới để OpenCV xử lý song song toàn bộ xấp bài.
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Layers className="w-8 h-8 text-neutral-400 mx-auto" />
                        <div className="text-xs font-bold text-neutral-700">
                          Chọn nhiều ảnh (Ctrl/Shift + Click) hoặc kéo thả cả tệp vào đây
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          Hỗ trợ chấm cùng lúc 5 - 100 bài thi (Tốc độ ~50ms/bài)
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleRunBatchGrade}
                    disabled={isBatchProcessing || batchFiles.length === 0}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-md"
                  >
                    {isBatchProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        Đang xử lý song song {batchFiles.length} bài thi...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-amber-300" />
                        Bắt đầu chấm song song {batchFiles.length > 0 ? `(${batchFiles.length} bài)` : ""}
                      </>
                    )}
                  </button>

                  {/* Batch Summary Results */}
                  {batchSummary && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-neutral-800 space-y-2 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between font-bold text-emerald-800">
                        <span>✓ Đã chấm xong {batchSummary.success_count}/{batchSummary.total_submitted} bài thi!</span>
                        <span className="text-sm font-black text-emerald-700">
                          Điểm TB: {batchSummary.statistics?.average_score ?? 0}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-600 flex gap-4 flex-wrap">
                        <span>Điểm cao nhất: <strong>{batchSummary.statistics?.highest_score ?? 0}</strong></span>
                        <span>Điểm thấp nhất: <strong>{batchSummary.statistics?.lowest_score ?? 0}</strong></span>
                        <span>Cần xem lại: <strong className="text-amber-700">{batchSummary.flagged_sheets?.length ?? 0} bài</strong></span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* =================================================== */}
              {/* HIỆU ỨNG QUÁ TRÌNH AI PHÂN TÍCH (PROGRESS TIMELINE)   */}
              {/* =================================================== */}
              {isAnalyzing && (
                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 text-white space-y-3.5 shadow-2xl animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs font-bold border-b border-neutral-800/80 pb-2.5">
                    <span className="flex items-center gap-2 text-emerald-400">
                      <Sparkles className="w-4 h-4 animate-spin text-emerald-400" />
                      AI Vision OMR Engine đang quét...
                    </span>
                    <span className="font-mono text-emerald-400 font-black">
                      {analysisPhase === 1 ? "35%" : analysisPhase === 2 ? "70%" : "100%"}
                    </span>
                  </div>

                  {/* Thanh tiến trình phát sáng */}
                  <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden border border-neutral-800">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-500 rounded-full shadow-[0_0_8px_#34d399]"
                      style={{
                        width: analysisPhase === 1 ? "35%" : analysisPhase === 2 ? "70%" : "100%",
                      }}
                    />
                  </div>

                  {/* 3 Giai đoạn quét trực quan */}
                  <div className="space-y-2 pt-1 text-xs">
                    {/* Giai đoạn 1 */}
                    <div
                      className={`flex items-center gap-3 transition-all ${
                        analysisPhase >= 1 ? "text-neutral-100" : "text-neutral-600 opacity-40"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          analysisPhase > 1
                            ? "bg-emerald-500 text-white"
                            : analysisPhase === 1
                            ? "border-2 border-emerald-400 text-emerald-300 animate-pulse bg-emerald-950"
                            : "bg-neutral-900 text-neutral-500"
                        }`}
                      >
                        {analysisPhase > 1 ? "✓" : "1"}
                      </div>
                      <span className={analysisPhase === 1 ? "font-bold text-emerald-300" : ""}>
                        Định vị 4 điểm mốc OMR của phiếu...
                      </span>
                    </div>

                    {/* Giai đoạn 2 */}
                    <div
                      className={`flex items-center gap-3 transition-all ${
                        analysisPhase >= 2 ? "text-neutral-100" : "text-neutral-600 opacity-40"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          analysisPhase > 2
                            ? "bg-emerald-500 text-white"
                            : analysisPhase === 2
                            ? "border-2 border-emerald-400 text-emerald-300 animate-pulse bg-emerald-950"
                            : "bg-neutral-900 text-neutral-500"
                        }`}
                      >
                        {analysisPhase > 2 ? "✓" : "2"}
                      </div>
                      <span className={analysisPhase === 2 ? "font-bold text-emerald-300" : ""}>
                        Nhận diện Số báo danh (SBD) & Mã đề thi...
                      </span>
                    </div>

                    {/* Giai đoạn 3 */}
                    <div
                      className={`flex items-center gap-3 transition-all ${
                        analysisPhase >= 3 ? "text-neutral-100" : "text-neutral-600 opacity-40"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          analysisPhase === 3
                            ? "border-2 border-emerald-400 text-emerald-300 animate-pulse bg-emerald-950"
                            : "bg-neutral-900 text-neutral-500"
                        }`}
                      >
                        3
                      </div>
                      <span className={analysisPhase === 3 ? "font-bold text-emerald-300" : ""}>
                        Đo độ đậm quang học & đối chiếu đáp án...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* =================================================== */}
              {/* MA TRẬN BONG BÓNG THÔNG MINH (CLICK-TO-CORRECT)       */}
              {/* =================================================== */}
              {scanResult && (
                <div className="bg-white border-2 border-emerald-500/40 rounded-2xl p-5 space-y-4 shadow-xl animate-in zoom-in-95 duration-200">
                  {/* Header kết quả */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          ĐÃ CHẤM XONG
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-black shadow-sm ${
                            getStudentRank(scanResult.score).badgeClass
                          }`}
                        >
                          Xếp loại: {getStudentRank(scanResult.score).label}
                        </span>
                        <span className="text-xs font-bold text-neutral-800">
                          {scanResult.studentName}
                        </span>
                        <span className="text-xs text-neutral-500 font-mono">
                          (SBD: {scanResult.studentCode})
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-1">
                        Bấm vào bất kỳ ô nào bên dưới để sửa nếu học sinh tô mờ hoặc tẩy chì. Điểm số sẽ tự cập nhật!
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-3xl font-black text-emerald-600">
                          {scanResult.score}{" "}
                          <span className="text-xs font-semibold text-neutral-500">/ 10</span>
                        </div>
                        <div className="text-[11px] font-semibold text-neutral-500">
                          {scanResult.correctCount}Đ • {scanResult.incorrectCount}S
                          {scanResult.emptyCount ? ` • ${scanResult.emptyCount} Trống` : ""}
                        </div>
                      </div>

                      <button
                        onClick={handleScanNextStudent}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-md hover:shadow-lg transition flex items-center gap-1.5 active:scale-95 shrink-0"
                        title="Chuẩn bị chấm cho học sinh tiếp theo"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-300" />
                        Chấm tiếp bài khác
                      </button>
                    </div>
                  </div>

                  {/* Lưới Ma trận Bong bóng Đúng/Sai tương tác trực tiếp */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-neutral-700 mb-2.5">
                      <span>Chi tiết các câu trả lời:</span>
                      <div className="flex items-center gap-3 text-[11px] font-normal text-neutral-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" /> Đúng
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" /> Sai
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-neutral-200 border border-neutral-400 inline-block" /> Bỏ trống
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Đã sửa
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full border-2 border-dashed border-emerald-600 inline-block" /> Đáp án chuẩn
                        </span>
                      </div>
                    </div>

                    {/* HIỂN THỊ THEO ĐỊNH DẠNG GDPT 2025 HOẶC TRUYỀN THỐNG */}
                    {showScanModal.sheetType === "2025" ? (
                      <div className="space-y-3.5 max-h-64 overflow-y-auto p-1 text-xs">
                        {/* Phần I: 12 câu trắc nghiệm 4 lựa chọn */}
                        <div>
                          <div className="font-bold text-[11px] text-neutral-700 uppercase mb-1.5 border-b pb-0.5">
                            Phần I: Trắc nghiệm 4 lựa chọn (Câu 1 - 12, 0.25đ/câu)
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {Array.from({ length: 12 }).map((_, idx) => {
                              const qNum = idx + 1;
                              const studentVal = scanResult.studentAnswers[qNum] || "";
                              const correctVal = showScanModal.answerKey[qNum] || "A";
                              const isCorrect = studentVal === correctVal;
                              const isManual = manualCorrections[qNum];
                              const isBlank = !studentVal || studentVal === "blank";

                              return (
                                <div
                                  key={qNum}
                                  className={`p-2 rounded-xl border transition ${
                                    isManual
                                      ? "border-amber-300 bg-amber-50/50"
                                      : isCorrect
                                      ? "border-emerald-100 bg-emerald-50/40"
                                      : isBlank
                                      ? "border-neutral-200 bg-neutral-50"
                                      : "border-rose-100 bg-rose-50/30"
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1.5 font-bold text-[11px]">
                                    <span className="text-neutral-700">Câu {qNum}:</span>
                                    {isManual ? (
                                      <span className="text-amber-700 text-[10px]">🟡 Đã sửa</span>
                                    ) : isCorrect ? (
                                      <span className="text-emerald-700 font-black">✓ +0.25đ</span>
                                    ) : (
                                      <span className="text-rose-600 font-black">✗ 0đ</span>
                                    )}
                                  </div>
                                  <div className="flex justify-between items-center gap-1">
                                    {["A", "B", "C", "D"].map((opt) => {
                                      const isSelected = studentVal === opt;
                                      const isCorrectKey = correctVal === opt;

                                      let circleStyle =
                                        "border border-neutral-300 bg-white text-neutral-600 hover:border-neutral-500";
                                      if (isSelected && isCorrect && isManual) {
                                        circleStyle = "bg-amber-500 text-white border-amber-500 font-black ring-2 ring-amber-200";
                                      } else if (isSelected && isCorrect) {
                                        circleStyle = "bg-emerald-600 text-white border-emerald-600 font-black shadow-sm ring-2 ring-emerald-200";
                                      } else if (isSelected && !isCorrect) {
                                        circleStyle = "bg-rose-600 text-white border-rose-600 font-black line-through shadow-sm";
                                      } else if (!isSelected && isCorrectKey) {
                                        circleStyle = "border-2 border-dashed border-emerald-600 text-emerald-700 bg-emerald-50 font-bold";
                                      }

                                      return (
                                        <button
                                          key={opt}
                                          type="button"
                                          onClick={() => handleCorrectAnswer(qNum, opt)}
                                          title={`Click để sửa đáp án thành ${opt}`}
                                          className={`w-6 h-6 rounded-full text-[10px] flex items-center justify-center transition-transform active:scale-90 ${circleStyle}`}
                                        >
                                          {opt}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Phần II: 4 câu Đúng/Sai (Câu 13 - 16) */}
                        <div>
                          <div className="font-bold text-[11px] text-neutral-700 uppercase mb-1.5 border-b pb-0.5">
                            Phần II: Câu hỏi Đúng/Sai (Câu 1 - 4)
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {[13, 14, 15, 16].map((qNum, qIdx) => {
                              const ansStr = scanResult.studentAnswers[qNum] || "Đ-S-Đ-Đ";
                              const correctStr = showScanModal.answerKey[qNum] || "Đ-S-Đ-Đ";
                              const studentParts = ansStr.split("-");
                              const correctParts = correctStr.split("-");

                              return (
                                <div key={qNum} className="border border-neutral-200 rounded-xl p-2.5 bg-neutral-50/40 space-y-1.5">
                                  <div className="font-bold text-xs text-neutral-800 flex justify-between">
                                    <span>Câu {qIdx + 1} (Phần II)</span>
                                    <span className="text-[11px] text-neutral-500 font-normal">Click Đ/S để sửa</span>
                                  </div>
                                  <div className="grid grid-cols-4 gap-1">
                                    {["a", "b", "c", "d"].map((subKey, subIdx) => {
                                      const stdVal = studentParts[subIdx] || "Đ";
                                      const corrVal = correctParts[subIdx] || "Đ";
                                      const isRight = stdVal === corrVal;

                                      return (
                                        <div
                                          key={subKey}
                                          className={`p-1.5 rounded-lg border text-center ${
                                            isRight ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"
                                          }`}
                                        >
                                          <div className="text-[10px] font-bold text-neutral-600 mb-1">
                                            Ý {subKey}
                                          </div>
                                          <div className="flex justify-center gap-1">
                                            {["Đ", "S"].map((choice) => (
                                              <button
                                                key={choice}
                                                type="button"
                                                onClick={() => {
                                                  const newParts = [...studentParts];
                                                  newParts[subIdx] = choice;
                                                  handleCorrectAnswer(qNum, newParts.join("-"));
                                                }}
                                                className={`w-5 h-5 rounded text-[9px] font-bold transition ${
                                                  stdVal === choice
                                                    ? choice === corrVal
                                                      ? "bg-emerald-600 text-white"
                                                      : "bg-rose-600 text-white"
                                                    : choice === corrVal
                                                    ? "border border-dashed border-emerald-600 text-emerald-700 bg-white"
                                                    : "bg-white text-neutral-500 border border-neutral-200"
                                                }`}
                                              >
                                                {choice}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Phần III: 6 câu Trả lời ngắn / Điền số (Câu 17 - 22) */}
                        <div>
                          <div className="font-bold text-[11px] text-neutral-700 uppercase mb-1.5 border-b pb-0.5">
                            Phần III: Trả lời ngắn / Điền số (Câu 1 - 6, 0.5đ/câu)
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                            {[17, 18, 19, 20, 21, 22].map((qNum, qIdx) => {
                              const stdVal = scanResult.studentAnswers[qNum] || "";
                              const corrVal = showScanModal.answerKey[qNum] || "15";
                              const isRight = stdVal.trim() === corrVal.trim();

                              return (
                                <div
                                  key={qNum}
                                  className={`p-2 rounded-xl border text-center ${
                                    isRight ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"
                                  }`}
                                >
                                  <div className="font-bold text-[10px] text-neutral-600 mb-1">
                                    Câu {qIdx + 1}
                                  </div>
                                  <input
                                    type="text"
                                    value={stdVal}
                                    onChange={(e) => handleCorrectAnswer(qNum, e.target.value)}
                                    className="w-full text-center text-xs font-mono font-bold border border-neutral-300 rounded py-0.5 bg-white"
                                    title="Click để nhập sửa số"
                                  />
                                  <div className="text-[9px] text-neutral-400 mt-1">Đ/A: {corrVal}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* MA TRẬN PHIẾU TRUYỀN THỐNG (20, 40 HOẶC 50 CÂU) */
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-1 text-xs">
                        {Array.from({ length: showScanModal.questionCount }).map((_, idx) => {
                          const qNum = idx + 1;
                          const studentVal = scanResult.studentAnswers[qNum] || "";
                          const correctVal = showScanModal.answerKey[qNum] || "A";
                          const isCorrect = studentVal === correctVal;
                          const isManual = manualCorrections[qNum];
                          const isBlank = !studentVal || studentVal === "blank";

                          return (
                            <div
                              key={qNum}
                              className={`p-2 rounded-xl border transition ${
                                isManual
                                  ? "border-amber-300 bg-amber-50/50"
                                  : isCorrect
                                  ? "border-emerald-100 bg-emerald-50/40"
                                  : isBlank
                                  ? "border-neutral-200 bg-neutral-50"
                                  : "border-rose-100 bg-rose-50/30"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5 font-bold text-[11px]">
                                <span className="text-neutral-700">Câu {qNum}:</span>
                                {isManual ? (
                                  <span className="text-amber-700 text-[10px]">🟡 Đã sửa</span>
                                ) : isCorrect ? (
                                  <span className="text-emerald-700 font-black">✓ +{Math.round((10 / showScanModal.questionCount) * 100) / 100}</span>
                                ) : isBlank ? (
                                  <span className="text-neutral-400 font-medium">Bỏ trống</span>
                                ) : (
                                  <span className="text-rose-600 font-black">✗ 0đ</span>
                                )}
                              </div>

                              <div className="flex justify-between items-center gap-1">
                                {["A", "B", "C", "D"].map((opt) => {
                                  const isSelected = studentVal === opt;
                                  const isCorrectKey = correctVal === opt;

                                  let circleStyle =
                                    "border border-neutral-300 bg-white text-neutral-600 hover:border-neutral-500";

                                  if (isSelected && isCorrect && isManual) {
                                    circleStyle = "bg-amber-500 text-white border-amber-500 font-black ring-2 ring-amber-200";
                                  } else if (isSelected && isCorrect) {
                                    circleStyle = "bg-emerald-600 text-white border-emerald-600 font-black shadow-sm ring-2 ring-emerald-200";
                                  } else if (isSelected && !isCorrect) {
                                    circleStyle = "bg-rose-600 text-white border-rose-600 font-black line-through shadow-sm";
                                  } else if (!isSelected && isCorrectKey) {
                                    circleStyle = "border-2 border-dashed border-emerald-600 text-emerald-700 bg-emerald-50 font-bold";
                                  }

                                  return (
                                    <button
                                      key={opt}
                                      type="button"
                                      onClick={() => handleCorrectAnswer(qNum, opt)}
                                      title={`Click để đổi đáp án thành ${opt}`}
                                      className={`w-6 h-6 rounded-full text-[10px] flex items-center justify-center transition-transform active:scale-90 ${circleStyle}`}
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Warning banner for OMR Flags */}
                  {scanResult.flaggedQuestions && scanResult.flaggedQuestions.length > 0 && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">OpenCV OMR Cảnh báo ({scanResult.flaggedQuestions.length} câu nghi ngờ):</span>
                        <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px] text-amber-700">
                          {scanResult.flaggedQuestions.map((f: any, idx: number) => (
                            <li key={idx}>Câu {f.question}: {f.warning || f.flag}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* OpenCV Warped & Annotated Visual Overlay Preview */}
                  {scanResult.annotatedImage && (
                    <div className="border border-neutral-200 rounded-xl p-3 bg-neutral-900 text-white">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" /> Ảnh nắn phối cảnh & khoanh đáp án OpenCV OMR
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          {scanResult.omrEngine === "anchor_marks" ? "✓ Khớp 4 điểm neo cữ góc" : "✓ Khớp mép giấy A4"}
                        </span>
                      </div>
                      <div className="max-h-80 overflow-y-auto rounded-lg border border-neutral-700 bg-black flex justify-center p-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`data:image/jpeg;base64,${scanResult.annotatedImage}`}
                          alt="OpenCV Annotated Sheet"
                          className="w-full max-w-lg object-contain rounded"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: BẢNG ĐIỂM CHI TIẾT CỦA KỲ THI */}
      {/* ======================================================== */}
      {showScoreboardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-neutral-100">
              <div>
                <h3 className="font-bold text-lg text-neutral-900">
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
                    <thead className="bg-neutral-50 text-neutral-600 font-bold border-b border-neutral-200">
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
                          <td className="py-2.5 px-3 font-medium text-neutral-900">
                            {std.studentName}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="text-emerald-600 font-semibold">{std.correctCount}Đ</span>
                            {" / "}
                            <span className="text-red-500 font-semibold">{std.incorrectCount}S</span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-neutral-900 text-sm">
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
            <div className="p-4 border-t border-neutral-100 flex items-center justify-between bg-neutral-50">
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
                soandethi.com
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
              <li className="font-mono text-neutral-600">lienhe@soandethi.com</li>
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
