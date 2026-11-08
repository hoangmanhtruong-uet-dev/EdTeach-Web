"use client";

import { useToast } from "@/context/toast-context";

import React, { useState, useEffect, useRef, use } from "react";
import {
  Clock,
  Camera,
  Upload,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  Sparkles,
  BookOpen,
  Award,
  RefreshCw,
  HelpCircle,
  Check,
  ChevronRight,
  RotateCcw,
  User,
  Hash,
  School,
  FileCheck2,
} from "lucide-react";

interface SubmissionPageProps {
  params: Promise<{ token: string }>;
}

function StudentSubmissionContent({ params }: SubmissionPageProps) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { showToast } = useToast();

  // Link metadata
  const [linkData, setLinkData] = useState<{
    token: string;
    sessionName: string;
    subject: string;
    grade: string;
    className: string;
    durationMinutes: number;
    questionCount: number;
    sheetType: string;
    expiresAt: number;
    remainingMs: number;
    isExpired: boolean;
    isClosed: boolean;
  } | null>(null);

  // Countdown
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [isTimeUp, setIsTimeUp] = useState(false);

  // Form input
  const [studentName, setStudentName] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [examCode, setExamCode] = useState("101");

  // Input mode: "photo" or "bubble"
  const [inputMode, setInputMode] = useState<"photo" | "bubble">("photo");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isPhotoScanning, setIsPhotoScanning] = useState(false);

  // Student answers: Record<questionNumber, "A" | "B" | "C" | "D">
  const [answers, setAnswers] = useState<Record<number, string>>({});

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    id: string;
    score: number;
    correctCount: number;
    incorrectCount: number;
    emptyCount: number;
    totalQuestions: number;
    studentName: string;
    studentCode: string;
    className: string;
    submittedAt: string;
    details: Array<{
      questionNumber: number;
      studentAnswer: string;
      correctAnswer: string;
      isCorrect: boolean;
    }>;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch link metadata
  useEffect(() => {
    async function loadLink() {
      try {
        setLoading(true);
        const res = await fetch(`/api/grading/student-links/${token}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          setErrorMsg(data.error || "Liên kết không hợp lệ.");
          return;
        }

        setLinkData(data.link);
        if (data.link.className) {
          setStudentClass(data.link.className);
        }

        const remSec = Math.floor(data.link.remainingMs / 1000);
        setRemainingSeconds(remSec);
        if (data.link.isExpired || remSec <= 0) {
          setIsTimeUp(true);
        }
      } catch (err: any) {
        setErrorMsg("Lỗi kết nối máy chủ: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    loadLink();
  }, [token]);

  // 2. Countdown timer
  useEffect(() => {
    if (isTimeUp || remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setIsTimeUp(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds, isTimeUp]);

  // Format countdown
  const formatCountdown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins} phút ${secs < 10 ? "0" : ""}${secs} giây`;
  };

  // Handle photo file selection - Gọi OMR Scanner thực tế
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setSelectedPhoto(base64);
      setIsPhotoScanning(true);

      try {
        const res = await fetch("/api/grading/omr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "grade_single",
            imageBase64: base64,
            sheetType: linkData?.sheetType || "2025",
            answerKey: {},
            studentToken: token,
          }),
        });

        if (res.ok) {
          const json = await res.json();
          const omr = json.data;

          if (omr) {
            const detectedAnswers: Record<number, string> = { ...answers };
            const resultsMap = omr.results || omr.part1_results || {};

            for (const [k, v] of Object.entries(resultsMap)) {
              const qNum = Number(k);
              const val = typeof v === "object" && v !== null ? (v as any).selected : v;
              if (val && typeof val === "string") {
                detectedAnswers[qNum] = val.toUpperCase();
              }
            }
            setAnswers(detectedAnswers);

            // Tự động điền Số Báo Danh và Mã Đề nếu AI đọc được từ phiếu
            if (omr.student_code && omr.student_code !== "??????" && !studentCode) {
              setStudentCode(omr.student_code);
            }
            if (omr.exam_code && omr.exam_code !== "???" && !examCode) {
              setExamCode(omr.exam_code);
            }
          }
        }
      } catch (scanErr) {
        console.error("Lỗi quét ảnh OMR:", scanErr);
      } finally {
        setIsPhotoScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Select an answer manually
  const handleSelectOption = (questionNumber: number, option: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionNumber]: prev[questionNumber] === option ? "" : option,
    }));
  };

  // Submit action
  const handleSubmit = async () => {
    if (!studentName.trim()) {
      showToast("Vui lòng điền Họ và tên học sinh trước khi nộp bài.", "warning");
      return;
    }

    if (inputMode === "photo" && !selectedPhoto && Object.keys(answers).length === 0) {
      showToast("Vui lòng chụp ảnh phiếu trả lời hoặc tô đáp án trên lưới trắc nghiệm.", "warning");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch(`/api/grading/student-links/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName,
          studentCode: studentCode || "1001",
          className: studentClass,
          examCode,
          studentAnswers: answers,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || "Nộp bài thất bại. Vui lòng thử lại.", "error");
        return;
      }

      setSubmissionResult(data.submission);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      showToast("Lỗi nộp bài: " + err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="h-10 w-10 border-4 border-slate-200 border-t-neutral-900 rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-600">Đang tải phòng thi nộp bài...</p>
      </div>
    );
  }

  // Error state
  if (errorMsg || !linkData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-lg text-center">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Không tìm thấy phòng nộp bài</h2>
          <p className="text-sm text-slate-600 mb-6">
            {errorMsg || "Liên kết này không tồn tại hoặc giáo viên đã hủy phiên nộp bài."}
          </p>
          <a
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-neutral-900 text-white font-medium text-sm hover:bg-neutral-800 transition"
          >
            Quay lại trang chủ
          </a>
        </div>
      </div>
    );
  }

  // Time expired screen
  if (isTimeUp && !submissionResult) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-lg text-center">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Hết thời hạn nhận bài</h2>
          <p className="text-sm text-slate-600 mb-4">
            Phòng thi <strong className="text-slate-800">{linkData.sessionName}</strong> đã kết thúc
            thời gian nhận bài thi của học sinh.
          </p>
          <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-500 mb-6 border border-slate-100">
            Nếu bạn gặp sự cố kỹ thuật hoặc cần nộp bù, vui lòng liên hệ trực tiếp với giáo viên bộ
            môn.
          </div>
        </div>
      </div>
    );
  }

  const questionCount = linkData.questionCount || 20;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-16 font-sans">
      {/* Top Banner */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-sm">
              E
            </div>
            <div>
              <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                EduTeach • Nộp bài thi
              </div>
              <h1 className="text-sm font-bold text-slate-900 line-clamp-1">{linkData.sessionName}</h1>
            </div>
          </div>

          {/* Live countdown */}
          {!submissionResult && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                remainingSeconds < 300
                  ? "bg-red-50 text-red-600 border border-red-200 animate-pulse"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{formatCountdown(remainingSeconds)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* ========================================================= */}
        {/* VIEW 1: KẾT QUẢ SAU KHI NỘP BÀI THÀNH CÔNG */}
        {/* ========================================================= */}
        {submissionResult ? (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            {/* Header Result Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <h2 className="text-2xl font-bold text-slate-900 mb-1">Nộp bài thành công!</h2>
              <p className="text-xs text-slate-500 mb-6">
                Bài làm của bạn đã được hệ thống AI chấm và gửi trực tiếp tới giáo viên.
              </p>

              {/* Big Score Box */}
              <div className="inline-flex flex-col items-center justify-center px-8 py-5 rounded-2xl bg-gradient-to-b from-blue-50 to-indigo-50/50 border border-blue-100 mb-6">
                <span className="text-xs font-semibold uppercase text-blue-600 tracking-wider mb-0.5">
                  Điểm số đạt được
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-blue-700 tracking-tight">
                    {submissionResult.score}
                  </span>
                  <span className="text-lg font-semibold text-blue-400">/ 10</span>
                </div>
              </div>

              {/* Stats badges */}
              <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto text-left">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
                  <div className="text-[11px] font-medium text-emerald-600">Đúng</div>
                  <div className="text-xl font-bold text-emerald-700">
                    {submissionResult.correctCount} câu
                  </div>
                </div>

                <div className="rounded-xl border border-red-100 bg-red-50/60 p-3">
                  <div className="text-[11px] font-medium text-red-600">Sai</div>
                  <div className="text-xl font-bold text-red-700">
                    {submissionResult.incorrectCount} câu
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[11px] font-medium text-slate-500">Chưa tô</div>
                  <div className="text-xl font-bold text-slate-700">
                    {submissionResult.emptyCount} câu
                  </div>
                </div>
              </div>

              {/* Student info summary */}
              <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600">
                <span>
                  Học sinh: <strong>{submissionResult.studentName}</strong>
                </span>
                <span>•</span>
                <span>
                  SBD: <strong>{submissionResult.studentCode}</strong>
                </span>
                {submissionResult.className && (
                  <>
                    <span>•</span>
                    <span>
                      Lớp: <strong>{submissionResult.className}</strong>
                    </span>
                  </>
                )}
                <span>•</span>
                <span>Thời gian: {submissionResult.submittedAt}</span>
              </div>
            </div>

            {/* Chi tiết từng câu */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-base text-slate-900 mb-4 flex items-center justify-between">
                <span>Chi tiết câu trả lời</span>
                <span className="text-xs font-normal text-slate-400">
                  {submissionResult.totalQuestions} câu trắc nghiệm
                </span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                {submissionResult.details.map((item) => (
                  <div
                    key={item.questionNumber}
                    className={`rounded-xl border p-2.5 text-center transition ${
                      item.isCorrect
                        ? "border-emerald-200 bg-emerald-50/50"
                        : item.studentAnswer
                        ? "border-red-200 bg-red-50/50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="text-[11px] font-semibold text-slate-500 mb-1">
                      Câu {item.questionNumber}
                    </div>
                    <div className="flex items-center justify-center gap-1.5 font-mono text-sm font-bold">
                      <span
                        className={
                          item.isCorrect
                            ? "text-emerald-700"
                            : item.studentAnswer
                            ? "text-red-600 line-through"
                            : "text-slate-400"
                        }
                      >
                        {item.studentAnswer || "—"}
                      </span>
                      {!item.isCorrect && (
                        <span className="text-emerald-600 font-bold">({item.correctAnswer})</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                onClick={() => {
                  setSubmissionResult(null);
                  setSelectedPhoto(null);
                  setAnswers({});
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Nộp bài mới cho học sinh khác
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* VIEW 2: FORM ĐIỀN THÔNG TIN VÀ NỘP BÀI (DEFAULT) */
          /* ========================================================= */
          <div className="space-y-6">
            {/* Header Info Banner */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                  {linkData.subject} • Lớp {linkData.grade}
                </span>
                {linkData.className && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-neutral-100 text-neutral-800">
                    Lớp: {linkData.className}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
                  {questionCount} câu trắc nghiệm
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">{linkData.sessionName}</h2>
              <p className="text-xs text-slate-500 mt-1">
                Điền thông tin và chụp ảnh phiếu trả lời trắc nghiệm để nộp và nhận kết quả ngay lập
                tức.
              </p>
            </div>

            {/* Step 1: Thông tin học sinh */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-500" />
                1. Thông tin học sinh
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Họ và tên học sinh <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn An"
                    className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Số báo danh (SBD) / Mã học sinh
                  </label>
                  <input
                    type="text"
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value)}
                    placeholder="Ví dụ: 1024"
                    className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Lớp
                  </label>
                  <input
                    type="text"
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    placeholder="Ví dụ: 12A1"
                    disabled={!!linkData.className}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Mã đề thi
                  </label>
                  <input
                    type="text"
                    value={examCode}
                    onChange={(e) => setExamCode(e.target.value)}
                    placeholder="Ví dụ: 101"
                    className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-neutral-900 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Phương thức nộp bài (Chụp ảnh hoặc Tô trực tiếp) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-slate-500" />
                  2. Bài làm trắc nghiệm
                </h3>

                {/* Tab switch */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
                  <button
                    onClick={() => setInputMode("photo")}
                    className={`px-3 py-1.5 rounded-md transition ${
                      inputMode === "photo"
                        ? "bg-white text-slate-900 font-bold shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Chụp / Tải ảnh phiếu
                  </button>
                  <button
                    onClick={() => setInputMode("bubble")}
                    className={`px-3 py-1.5 rounded-md transition ${
                      inputMode === "bubble"
                        ? "bg-white text-slate-900 font-bold shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Tô đáp án online
                  </button>
                </div>
              </div>

              {/* Mode A: Photo upload / Camera */}
              {inputMode === "photo" && (
                <div className="space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />

                  {selectedPhoto ? (
                    <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-950 flex flex-col items-center">
                      <img
                        src={selectedPhoto}
                        alt="Ảnh phiếu đã chụp"
                        className="max-h-80 w-auto object-contain"
                      />

                      {/* Photo scanner overlay animation */}
                      {isPhotoScanning && (
                        <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mb-2" />
                          <span className="text-xs font-semibold">AI đang đọc đáp án trên phiếu...</span>
                        </div>
                      )}

                      <div className="p-3 bg-white w-full border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          Đã tải ảnh phiếu thành công
                        </span>
                        <button
                          onClick={() => {
                            setSelectedPhoto(null);
                            setAnswers({});
                          }}
                          className="text-xs text-red-600 hover:underline font-medium"
                        >
                          Chụp / Tải lại ảnh khác
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-slate-300 hover:border-neutral-900 bg-slate-50/50 hover:bg-slate-50 transition text-center group cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 group-hover:scale-110 flex items-center justify-center mb-2.5 transition">
                          <Camera className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-bold text-slate-800">Chụp ảnh phiếu</span>
                        <span className="text-[11px] text-slate-400 mt-0.5">
                          Mở camera điện thoại chụp phiếu tô
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-slate-300 hover:border-neutral-900 bg-slate-50/50 hover:bg-slate-50 transition text-center group cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 group-hover:scale-110 flex items-center justify-center mb-2.5 transition">
                          <Upload className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-bold text-slate-800">Tải ảnh từ thư viện</span>
                        <span className="text-[11px] text-slate-400 mt-0.5">
                          Chọn ảnh phiếu đã chụp sẵn trong máy
                        </span>
                      </button>
                    </div>
                  )}

                  {/* Summary of answers detected */}
                  {Object.keys(answers).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-700">
                          Đáp án đã nhận diện ({Object.values(answers).filter(Boolean).length}/
                          {Math.max(questionCount, ...Object.keys(answers).map(Number).filter(n => !isNaN(n)), 0)} câu):
                        </span>
                        <button
                          onClick={() => setInputMode("bubble")}
                          className="text-xs text-blue-600 hover:underline font-medium"
                        >
                          Chỉnh sửa đáp án thủ công
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                        {Array.from({
                          length: Math.max(
                            questionCount,
                            ...Object.keys(answers).map(Number).filter((n) => !isNaN(n)),
                            0
                          ),
                        }).map((_, idx) => {
                          const q = idx + 1;
                          const val = answers[q];
                          return (
                            <span
                              key={q}
                              className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                                val
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-slate-100 text-slate-400"
                              }`}
                            >
                              {q}:{val || "-"}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mode B: Direct Bubble Sheet Tap */}
              {inputMode === "bubble" && (
                <div className="space-y-4">
                  <div className="text-xs text-slate-500 mb-2">
                    Nhấp chọn đáp án tương ứng cho từng câu hỏi dưới đây:
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 max-h-[420px] overflow-y-auto p-1">
                    {Array.from({ length: questionCount }).map((_, idx) => {
                      const qNum = idx + 1;
                      const selectedVal = answers[qNum];

                      return (
                        <div
                          key={qNum}
                          className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50"
                        >
                          <span className="font-bold text-xs text-slate-700 w-7">
                            {qNum}.
                          </span>

                          <div className="flex items-center gap-1.5">
                            {["A", "B", "C", "D"].map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => handleSelectOption(qNum, opt)}
                                className={`w-7 h-7 rounded-full text-xs font-bold font-mono transition ${
                                  selectedVal === opt
                                    ? "bg-neutral-900 text-white shadow-xs scale-105"
                                    : "bg-white border border-slate-300 text-slate-600 hover:border-slate-400"
                                }`}
                              >
                                {opt}
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

            {/* Step 3: Nút nộp bài */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-base transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang chấm điểm & nộp bài...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Nộp bài & Nhận điểm ngay</span>
                  </>
                )}
              </button>
              <p className="text-center text-[11px] text-slate-400 mt-2.5">
                Bằng cách nộp bài, bạn xác nhận đây là bài làm trung thực của mình.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StudentSubmissionPage(props: SubmissionPageProps) {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
          <div className="h-9 w-9 border-3 border-slate-200 border-t-neutral-900 rounded-full animate-spin mb-3" />
          <p className="text-xs font-semibold text-slate-500">Đang tải phòng nộp bài...</p>
        </div>
      }
    >
      <StudentSubmissionContent params={props.params} />
    </React.Suspense>
  );
}
