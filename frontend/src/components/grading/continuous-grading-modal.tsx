"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  X,
  Smartphone,
  Camera,
  Upload,
  Layers,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  SwitchCamera,
  Download,
  Users,
  FileSpreadsheet,
  Minimize2,
  Maximize2,
  PowerOff,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ArrowRight,
  Eye,
  Edit3,
  Wifi,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { useToast } from "@/context/toast-context";
import { useConfirm } from "@/context/confirm-dialog-context";
import { ContinuousSubmission, RosterStudent } from "@/lib/grading/continuous-session-store";
import {
  get2025QuestionCounts,
  normalizeTfGroupAnswer,
  scoreStudentAnswers,
} from "@/lib/grading/omr-template-resolver";

interface ContinuousGradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: {
    id: string;
    name: string;
    subject: string;
    grade: string;
    questionCount: number;
    sheetType: "20" | "40" | "50" | "2025";
    answerKey: Record<number, string>;
    gradedStudents?: any[];
    roster?: RosterStudent[];
  };
  onUpdateSessionStudents?: (newStudents: any[]) => void;
}

export function ContinuousGradingModal({
  isOpen,
  onClose,
  session,
  onUpdateSessionStudents,
}: ContinuousGradingModalProps) {
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  // Mode and view state
  const [scanMode, setScanMode] = useState<"phone" | "camera" | "upload" | "batch">("phone");
  const [isMinimized, setIsMinimized] = useState(false);

  // Session & Connection state
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [sessionPin, setSessionPin] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [scanDirectUrl, setScanDirectUrl] = useState<string | null>(null);
  const [deviceCount, setDeviceCount] = useState<number>(0);
  const [isSessionActive, setIsSessionActive] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState(false);

  // Submissions & Realtime Table
  const [submissions, setSubmissions] = useState<ContinuousSubmission[]>([]);
  const [newSubIds, setNewSubIds] = useState<Set<string>>(new Set());
  const [tableFilter, setTableFilter] = useState<"all" | "needs_review" | "confirmed">("all");
  const [roster, setRoster] = useState<RosterStudent[]>(session.roster || []);
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [rosterInputText, setRosterInputText] = useState("");

  // Review Modal state
  const [reviewingSubmission, setReviewingSubmission] = useState<ContinuousSubmission | null>(null);
  const [reviewSbd, setReviewSbd] = useState("");
  const [reviewName, setReviewName] = useState("");
  const [reviewAnswers, setReviewAnswers] = useState<Record<number, string>>({});

  // Manual Quick Input Section (collapsible)
  const [showManualSection, setShowManualSection] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualSbd, setManualSbd] = useState("");

  // Webcam states
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [webcamFacing, setWebcamFacing] = useState<"environment" | "user">("environment");
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const videoWebcamRef = useRef<HTMLVideoElement | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);

  // Upload & Batch states
  const [uploadFilePreview, setUploadFilePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  // Play synthetic ting chime
  const playTingSound = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch {
      // silent
    }
  }, []);

  // 1. Initialize Continuous Session
  const initSession = useCallback(async () => {
    try {
      const res = await fetch("/api/grading/continuous-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: session.id,
          name: session.name,
          subject: session.subject,
          grade: session.grade,
          questionCount: session.questionCount,
          sheetType: session.sheetType,
          answerKey: session.answerKey,
          roster: session.roster || [],
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.session) {
        setSessionToken(data.session.sessionToken);
        setSessionPin(data.session.pin);
        setQrUrl(data.qrUrl);
        setScanDirectUrl(data.scanUrl);
        setIsSessionActive(true);
        if (data.session.roster) {
          setRoster(data.session.roster);
        }
      }
    } catch (e) {
      console.error("Lỗi khởi tạo phiên chấm liên tục:", e);
    }
  }, [session]);

  useEffect(() => {
    if (isOpen) {
      initSession();
    }
  }, [isOpen, initSession]);

  // 2. Realtime Submissions Polling
  useEffect(() => {
    if (!isOpen || !sessionToken || !isSessionActive) return;

    const interval = setInterval(async () => {
      try {
        // Fetch Submissions
        const subRes = await fetch(
          `/api/grading/continuous-session/${encodeURIComponent(sessionToken)}/submissions`
        );
        if (subRes.ok) {
          const subData = await subRes.json();
          if (subData.success && Array.isArray(subData.submissions)) {
            const incoming: ContinuousSubmission[] = subData.submissions;

            setSubmissions((prev) => {
              // Detect newly arrived submissions
              const prevIds = new Set(prev.map((s) => s.id));
              const newlyAdded = incoming.filter((s) => !prevIds.has(s.id));

              if (newlyAdded.length > 0) {
                playTingSound();
                setNewSubIds(new Set(newlyAdded.map((s) => s.id)));
                setTimeout(() => setNewSubIds(new Set()), 3000);
              }
              return incoming;
            });
          }
        }

        // Fetch Session status & device count
        const sessRes = await fetch(
          `/api/grading/continuous-session?token=${encodeURIComponent(sessionToken)}`
        );
        if (sessRes.ok) {
          const sessData = await sessRes.json();
          if (sessData.success && sessData.session) {
            setDeviceCount(sessData.session.deviceCount || 0);
            if (sessData.session.status === "ended") {
              setIsSessionActive(false);
            }
          }
        }
      } catch {
        // silent
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [isOpen, sessionToken, isSessionActive, playTingSound]);

  // Sync back to parent exam session on close
  useEffect(() => {
    if (submissions.length > 0 && onUpdateSessionStudents) {
      const mapped = submissions.map((s) => {
        const emptyCount = s.answers.filter((a) => !a.selected || !a.selected.trim()).length;
        const incorrectCount =
          s.answers.length > 0
            ? s.answers.filter((a) => !a.isCorrect && Boolean(a.selected && a.selected.trim())).length
            : Math.max(0, session.questionCount - s.correctCount);
        return {
          id: s.id,
          studentName: s.detectedName || `SBD ${s.detectedSbd || "Chưa rõ"}`,
          studentCode: s.detectedSbd || "",
          score: s.score,
          correctCount: s.correctCount,
          incorrectCount,
          emptyCount,
          gradedAt: new Date(s.createdAt).toLocaleTimeString("vi-VN"),
          studentAnswers: s.answers.reduce(
            (acc, a) => ({ ...acc, [a.questionNumber]: a.selected }),
            {}
          ),
          annotatedImage: s.annotatedImage,
          status: s.status,
        };
      });
      onUpdateSessionStudents(mapped);
    }
  }, [submissions, session.questionCount, onUpdateSessionStudents]);

  // 3. End Session handler
  const handleEndSession = async () => {
    const ok = await confirm({
      title: "Kết thúc phiên chấm?",
      message:
        "Khi kết thúc phiên, mã QR và điện thoại sẽ dừng quét. Toàn bộ bảng điểm đã nhận vẫn được lưu lại nguyên vẹn.",
      confirmText: "Kết thúc phiên",
      variant: "danger",
    });

    if (!ok || !sessionToken) return;

    try {
      const res = await fetch("/api/grading/continuous-session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken, action: "end" }),
      });
      if (res.ok) {
        setIsSessionActive(false);
        showToast("Đã kết thúc phiên chấm thành công!", "success");
      }
    } catch (e: any) {
      showToast("Lỗi kết thúc phiên: " + e.message, "error");
    }
  };

  // 4. Import Roster handler
  const handleSaveRoster = async () => {
    if (!rosterInputText.trim() || !sessionToken) return;

    // Parse CSV or lines (format: SBD, Họ tên, Mã HS)
    const lines = rosterInputText.split("\n");
    const parsedRoster: RosterStudent[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      const parts = line.split(/[,;\t]/).map((p) => p.trim());
      if (parts.length >= 2) {
        parsedRoster.push({
          sbd: parts[0],
          name: parts[1],
          studentId: parts[2] || parts[0],
        });
      }
    }

    if (parsedRoster.length === 0) {
      showToast("Không tìm thấy dòng học sinh hợp lệ. Vui lòng nhập theo dạng: SBD, Họ tên", "error");
      return;
    }

    try {
      const res = await fetch("/api/grading/continuous-session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken,
          action: "update_roster",
          roster: parsedRoster,
        }),
      });

      if (res.ok) {
        setRoster(parsedRoster);
        setShowRosterModal(false);
        setRosterInputText("");
        showToast(`Đã nạp danh sách lớp gồm ${parsedRoster.length} học sinh!`, "success");
      }
    } catch (e: any) {
      showToast("Lỗi cập nhật danh sách lớp: " + e.message, "error");
    }
  };

  // 5. Export CSV/Excel (UTF-8 BOM)
  const handleExportCsv = () => {
    if (submissions.length === 0) {
      showToast("Chưa có bài thi nào để xuất bảng điểm.", "error");
      return;
    }

    let csv = "\uFEFF"; // UTF-8 BOM
    csv += "STT,Số báo danh,Họ và tên,Điểm số,Số câu đúng,Tổng số câu,Độ tin cậy,Trạng thái,Thời gian nộp\n";

    submissions.forEach((s, idx) => {
      const statusText =
        s.status === "confirmed"
          ? "Đã xác nhận"
          : s.status === "needs_review"
          ? "Cần xem lại"
          : "Đã chấm";
      const timeStr = new Date(s.createdAt).toLocaleTimeString("vi-VN") + " " + new Date(s.createdAt).toLocaleDateString("vi-VN");
      csv += `"${idx + 1}","${s.detectedSbd || ""}","${s.detectedName || ""}","${s.score}","${s.correctCount}","${session.questionCount}","${Math.round(s.confidence * 100)}%","${statusText}","${timeStr}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Bang_diem_${session.name.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Đã tải xuống file CSV bảng điểm!", "success");
  };

  // 6. Webcam controls
  const stopWebcam = () => {
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach((track) => track.stop());
      webcamStreamRef.current = null;
    }
    setIsWebcamActive(false);
  };

  const startWebcam = async (overrideFacing?: "user" | "environment") => {
    stopWebcam();
    setWebcamError(null);
    setIsWebcamActive(true);
    const facing = overrideFacing || webcamFacing;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      webcamStreamRef.current = stream;
      if (videoWebcamRef.current) {
        videoWebcamRef.current.srcObject = stream;
        videoWebcamRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      setWebcamError("Không thể mở webcam: " + (err.message || "Lỗi truy cập"));
      setIsWebcamActive(false);
    }
  };

  const handleCaptureWebcam = () => {
    if (!videoWebcamRef.current) return;
    const video = videoWebcamRef.current;
    if (video.videoWidth === 0) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const base64 = canvas.toDataURL("image/jpeg", 0.85);

    submitDirectPaper(base64);
  };

  // 7. Direct Paper Submission (Webcam / Upload / Manual)
  const submitDirectPaper = async (imageBase64?: string, directAnswers?: Record<number, string>) => {
    if (!sessionToken) return;
    setIsAnalyzing(true);

    try {
      const res = await fetch(
        `/api/grading/continuous-session/${encodeURIComponent(sessionToken)}/submissions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientSubmissionId: "pc_sub_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
            imageBase64,
            detectedSbd: manualSbd || undefined,
            detectedName: manualName || undefined,
            answers: directAnswers,
          }),
        }
      );

      const data = await res.json();
      if (res.ok && data.success && data.submission) {
        playTingSound();
        showToast("Đã chấm xong 1 bài thi!", "success");
        setManualSbd("");
        setManualName("");
        setUploadFilePreview(null);
      } else {
        showToast("Lỗi chấm bài: " + (data.error || "Không thể xử lý"), "error");
      }
    } catch (err: any) {
      showToast("Lỗi nộp bài: " + err.message, "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 8. Batch file submission
  const handleBatchUpload = async () => {
    if (batchFiles.length === 0 || !sessionToken) return;
    setIsBatchProcessing(true);

    try {
      const items = [];
      for (let i = 0; i < batchFiles.length; i++) {
        const file = batchFiles[i];
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve((e.target?.result as string) || "");
          reader.readAsDataURL(file);
        });

        items.push({
          clientSubmissionId: "batch_" + Date.now() + "_" + i + "_" + Math.random().toString(36).slice(2, 6),
          imageBase64: base64,
        });
      }

      const res = await fetch(
        `/api/grading/continuous-session/${encodeURIComponent(sessionToken)}/submissions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        }
      );

      const data = await res.json();
      if (res.ok && data.success) {
        playTingSound();
        setBatchFiles([]);
        showToast(`Đã nạp và chấm đồng loạt ${data.count || items.length} bài thi!`, "success");
      } else {
        showToast("Lỗi chấm hàng loạt: " + (data.error || "Không rõ nguyên nhân"), "error");
      }
    } catch (err: any) {
      showToast("Lỗi chấm hàng loạt: " + err.message, "error");
    } finally {
      setIsBatchProcessing(false);
    }
  };

  // 9. Review Modal Navigation & Confirmation
  const openReviewModal = (sub: ContinuousSubmission) => {
    setReviewingSubmission(sub);
    setReviewSbd(sub.detectedSbd || "");
    setReviewName(sub.detectedName || "");
    const ansMap: Record<number, string> = {};
    sub.answers.forEach((a) => {
      ansMap[a.questionNumber] = a.selected;
    });
    setReviewAnswers(ansMap);
  };

  const handleConfirmReview = async () => {
    if (!reviewingSubmission || !sessionToken) return;

    const counts2025 = get2025QuestionCounts(session.subject, session.questionCount);
    const totalQ =
      session.sheetType === "2025" ? counts2025.totalQuestions : session.questionCount || 20;

    const existingByQ = new Map(
      reviewingSubmission.answers.map((a) => [a.questionNumber, a])
    );
    const answerMap: Record<number, string> = {};
    for (let q = 1; q <= totalQ; q++) {
      const prev = existingByQ.get(q)?.selected ?? "";
      answerMap[q] = reviewAnswers[q] !== undefined ? reviewAnswers[q] : prev;
    }

    const scored = scoreStudentAnswers({
      sheetType: session.sheetType,
      subject: session.subject,
      questionCount: totalQ,
      answerKey: session.answerKey || {},
      studentAnswers: answerMap,
    });

    const updatedAnswers = scored.details.map((d) => ({
      questionNumber: d.questionNumber,
      selected: d.studentAnswer,
      correctAnswer:
        d.correctAnswer || existingByQ.get(d.questionNumber)?.correctAnswer || "",
      isCorrect: d.isCorrect,
    }));

    try {
      const res = await fetch(
        `/api/grading/continuous-session/${encodeURIComponent(sessionToken)}/submissions`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            submissionId: reviewingSubmission.id,
            detectedSbd: reviewSbd.trim(),
            detectedName: reviewName.trim(),
            answers: updatedAnswers,
            status: "confirmed",
          }),
        }
      );

      const data = await res.json();
      if (res.ok && data.success && data.submission) {
        showToast("Đã xác nhận bài thi thành công!", "success");

        // Move to next submission needing review if any
        const remainingNeedsReview = submissions.filter(
          (s) => s.status === "needs_review" && s.id !== reviewingSubmission.id
        );
        if (remainingNeedsReview.length > 0) {
          openReviewModal(remainingNeedsReview[0]);
        } else {
          setReviewingSubmission(null);
        }
      }
    } catch (e: any) {
      showToast("Lỗi xác nhận bài: " + e.message, "error");
    }
  };

  // Keyboard navigation for review modal
  useEffect(() => {
    if (!reviewingSubmission) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === "Enter") {
          e.preventDefault();
          handleConfirmReview();
        }
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        handleConfirmReview();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        // Go to previous
        const curIdx = submissions.findIndex((s) => s.id === reviewingSubmission.id);
        if (curIdx > 0) {
          openReviewModal(submissions[curIdx - 1]);
        }
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        // Go to next
        const curIdx = submissions.findIndex((s) => s.id === reviewingSubmission.id);
        if (curIdx < submissions.length - 1) {
          openReviewModal(submissions[curIdx + 1]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [reviewingSubmission, submissions, reviewSbd, reviewName, reviewAnswers]);

  // Filtered submissions list
  const filteredSubmissions = useMemo(() => {
    if (tableFilter === "needs_review") {
      return submissions.filter((s) => s.status === "needs_review");
    }
    if (tableFilter === "confirmed") {
      return submissions.filter((s) => s.status === "confirmed");
    }
    return submissions;
  }, [submissions, tableFilter]);

  const needsReviewCount = submissions.filter((s) => s.status === "needs_review").length;
  const confirmedCount = submissions.filter((s) => s.status === "confirmed").length;

  if (!isOpen) return null;

  // ========================================================
  // FLOATING MINIMIZED WIDGET (Thanh nổi góc dưới phải)
  // ========================================================
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 border border-neutral-700 text-white rounded-2xl shadow-2xl p-4 flex items-center gap-4 animate-in slide-in-from-bottom-5 duration-200">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
          <div className="text-xs">
            <div className="font-bold text-neutral-100 flex items-center gap-1.5">
              <span>Phiên chấm đang mở</span>
              {needsReviewCount > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500 text-neutral-950 font-black rounded-full text-[10px]">
                  {needsReviewCount} cần xem lại
                </span>
              )}
            </div>
            <div className="text-[11px] text-neutral-400">
              Đã nhận <strong className="text-emerald-400">{submissions.length} bài</strong> • {deviceCount} điện thoại nối
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsMinimized(false)}
          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-md"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          Mở lại bảng điểm
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card text-card-foreground rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-border overflow-hidden">
        {/* =================================================== */}
        {/* MODAL HEADER */}
        {/* =================================================== */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-neutral-900/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-black">
              OMR
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-foreground">
                  Chấm phiếu trắc nghiệm bằng AI (Phiên liên tục)
                </h3>
                {isSessionActive ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Đang hoạt động
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-500/10 border border-neutral-500/30 text-neutral-400">
                    Đã kết thúc
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Kỳ thi: <strong className="text-foreground">{session.name}</strong> •{" "}
                {session.sheetType === "2025"
                  ? (() => {
                      const c = get2025QuestionCounts(session.subject, session.questionCount);
                      return `${c.totalQuestions} câu • ${
                        c.part3Count > 0 ? "Form 2025 (3 phần)" : "Form 2025 (2 phần)"
                      }`;
                    })()
                  : `${session.questionCount} câu • Mẫu ${session.sheetType}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Nút Thu Nhỏ */}
            <button
              onClick={() => setIsMinimized(true)}
              className="px-3 py-1.5 rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition"
              title="Thu nhỏ thành thanh nổi góc dưới phải"
            >
              <Minimize2 className="w-3.5 h-3.5 text-neutral-400" />
              <span>Thu nhỏ</span>
            </button>

            {/* Nút Kết Thúc Phiên */}
            {isSessionActive && (
              <button
                onClick={handleEndSession}
                className="px-3 py-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition"
                title="Dừng phiên quét của các điện thoại"
              >
                <PowerOff className="w-3.5 h-3.5" />
                <span>Kết thúc phiên</span>
              </button>
            )}

            {/* Nút Đóng */}
            <button
              onClick={() => {
                stopWebcam();
                onClose();
              }}
              className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* =================================================== */}
        {/* MODAL BODY (Scrollable) */}
        {/* =================================================== */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status Toolbar: Thiết bị nối, Tổng số bài, Roster & Xuất CSV */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-xs">
            <div className="flex items-center gap-3">
              {/* Device connection status */}
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-semibold ${
                  deviceCount > 0
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                }`}
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      deviceCount > 0 ? "bg-emerald-400" : "bg-amber-400"
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                      deviceCount > 0 ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                </span>
                <span>
                  {deviceCount > 0
                    ? `${deviceCount} thiết bị đang nối`
                    : "Đang đợi điện thoại kết nối..."}
                </span>
              </div>

              {/* Submissions count badge */}
              <div className="px-3 py-1.5 rounded-xl bg-neutral-800 border border-neutral-700 text-neutral-200 font-bold">
                Đã nhận: <span className="text-emerald-400 font-mono text-sm">{submissions.length}</span> bài
              </div>

              {/* Roster count badge */}
              <div className="text-neutral-400 text-[11px]">
                Danh sách lớp:{" "}
                <strong className="text-neutral-200">{roster.length} HS</strong>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRosterModal(true)}
                className="px-3 py-1.5 rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>Nhập danh sách lớp (Roster)</span>
              </button>

              <button
                onClick={handleExportCsv}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Xuất Excel/CSV</span>
              </button>
            </div>
          </div>

          {/* 4 TABS - ALL NOWRAP */}
          <div className="flex border border-neutral-800 rounded-2xl overflow-x-auto p-1 bg-neutral-900/60 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setScanMode("phone");
                stopWebcam();
              }}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition whitespace-nowrap ${
                scanMode === "phone"
                  ? "bg-neutral-100 text-neutral-900 shadow-md"
                  : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
              Điện thoại chụp liên tục
            </button>
            <button
              type="button"
              onClick={() => {
                setScanMode("camera");
                startWebcam();
              }}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition whitespace-nowrap ${
                scanMode === "camera"
                  ? "bg-neutral-100 text-neutral-900 shadow-md"
                  : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60"
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
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition whitespace-nowrap ${
                scanMode === "upload"
                  ? "bg-neutral-100 text-neutral-900 shadow-md"
                  : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60"
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
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition whitespace-nowrap ${
                scanMode === "batch"
                  ? "bg-neutral-100 text-neutral-900 shadow-md"
                  : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              Chấm hàng loạt
            </button>
          </div>

          {/* =================================================== */}
          {/* TAB 1: ĐIỆN THOẠI CHỤP LIÊN TỤC (QR + PIN)          */}
          {/* =================================================== */}
          {scanMode === "phone" && (
            <div className="border border-neutral-800 rounded-3xl p-5 bg-gradient-to-b from-neutral-900/60 to-neutral-950 space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* QR Code Container */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="p-3.5 bg-white rounded-3xl border-2 border-neutral-200 shadow-xl">
                    {qrUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={qrUrl}
                        alt="QR Code Quét Phiên Liên Tục"
                        className="w-40 h-40 object-contain rounded-xl"
                      />
                    ) : (
                      <div className="w-40 h-40 flex items-center justify-center bg-neutral-100 rounded-xl">
                        <RefreshCw className="w-6 h-6 animate-spin text-neutral-400" />
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] text-neutral-400 mt-2 font-medium">
                    Quét bằng Camera Zalo / iPhone / Android
                  </span>
                </div>

                {/* PIN Code & Link info */}
                <div className="flex-1 space-y-3.5 text-xs w-full">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-900 border border-neutral-800">
                    <span className="text-neutral-400 font-medium">
                      Hoặc nhập mã PIN 4 số trên điện thoại:
                    </span>
                    <span className="font-mono text-xl font-black text-emerald-400 tracking-widest">
                      {sessionPin || "..."}
                    </span>
                  </div>

                  {scanDirectUrl && (
                    <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-neutral-900 border border-neutral-800 text-[11px]">
                      <span className="truncate max-w-[280px] font-mono text-neutral-400">
                        {scanDirectUrl}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(scanDirectUrl);
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 2000);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-emerald-400 font-bold transition shrink-0"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedLink ? "Đã copy" : "Copy link"}
                      </button>
                    </div>
                  )}

                  <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-[11px] text-neutral-300 space-y-1.5 leading-relaxed">
                    <p className="flex items-center gap-2 text-emerald-400 font-bold">
                      <Sparkles className="w-3.5 h-3.5" />
                      Quy trình phiên chấm liên tục:
                    </p>
                    <p>✓ Giáo viên quét QR 1 lần duy nhất, chụp liên tục cả xấp phiếu (≥ 30 bài) mà không cần chạm máy tính.</p>
                    <p>✓ Hỗ trợ nhiều điện thoại cùng quét đồng thời vào một bảng điểm chung.</p>
                    <p>✓ Tự động lưu offline IndexedDB và nạp bù khi mất mạng.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================== */}
          {/* TAB 2: WEBCAM MÁY TÍNH                              */}
          {/* =================================================== */}
          {scanMode === "camera" && (
            <div className="bg-neutral-950 rounded-3xl overflow-hidden border border-neutral-800 p-4 text-center space-y-3">
              {webcamError ? (
                <div className="py-8 space-y-3 text-neutral-400">
                  <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                  <p className="text-xs text-amber-300">{webcamError}</p>
                  <button
                    onClick={() => startWebcam()}
                    className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs text-white"
                  >
                    Thử lại
                  </button>
                </div>
              ) : (
                <div className="relative aspect-video max-h-[260px] mx-auto bg-black rounded-2xl overflow-hidden flex items-center justify-center">
                  <video
                    ref={videoWebcamRef}
                    playsInline
                    muted
                    autoPlay
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-4 border-2 border-emerald-400/50 rounded-xl pointer-events-none" />
                </div>
              )}

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleCaptureWebcam}
                  disabled={isAnalyzing}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg flex items-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  Chụp & Chấm vào phiên
                </button>
                <button
                  onClick={() => {
                    const next = webcamFacing === "user" ? "environment" : "user";
                    setWebcamFacing(next);
                    startWebcam(next);
                  }}
                  className="p-2.5 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white"
                  title="Đổi camera"
                >
                  <SwitchCamera className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* =================================================== */}
          {/* TAB 3: TẢI ẢNH TỪ MÁY                               */}
          {/* =================================================== */}
          {scanMode === "upload" && (
            <div className="space-y-3">
              <label className="border-2 border-dashed border-neutral-700 hover:border-emerald-500 rounded-3xl p-6 text-center cursor-pointer transition bg-neutral-900/40 block">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const base64 = ev.target?.result as string;
                        setUploadFilePreview(base64);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                {uploadFilePreview ? (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div className="text-xs font-bold text-neutral-200">Đã chọn ảnh phiếu thi!</div>
                    <div className="text-[11px] text-neutral-400">Nhấn nút bên dưới để chấm & thêm vào bảng kết quả.</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 text-neutral-500 mx-auto" />
                    <div className="text-xs font-bold text-neutral-300">Nhấn để chọn ảnh phiếu hoặc kéo thả vào đây</div>
                    <div className="text-[11px] text-neutral-500">Hỗ trợ JPG, PNG</div>
                  </div>
                )}
              </label>

              {uploadFilePreview && (
                <button
                  onClick={() => submitDirectPaper(uploadFilePreview)}
                  disabled={isAnalyzing}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-md"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Đang phân tích phiếu thi...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-emerald-300" />
                      Chấm & Ghi điểm vào phiên
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* =================================================== */}
          {/* TAB 4: CHẤM HÀNG LOẠT (CÙNG PIPELINE VỚI PHIÊN)      */}
          {/* =================================================== */}
          {scanMode === "batch" && (
            <div className="border border-neutral-800 rounded-3xl p-5 bg-gradient-to-b from-neutral-900/60 to-neutral-950 space-y-4">
              <label className="border-2 border-dashed border-neutral-700 hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer transition bg-neutral-900/30 block">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      setBatchFiles(Array.from(e.target.files));
                    }
                  }}
                />
                {batchFiles.length > 0 ? (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div className="text-xs font-bold text-neutral-200">
                      Đã chọn {batchFiles.length} bài thi!
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      Bấm nút bên dưới để đưa toàn bộ vào phiên chấm realtime.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Layers className="w-8 h-8 text-neutral-500 mx-auto" />
                    <div className="text-xs font-bold text-neutral-300">
                      Chọn nhiều ảnh phiếu hoặc file PDF (Ctrl/Shift + Click)
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      Tự động chạy cùng pipeline với điện thoại và đẩy vào bảng kết quả chung.
                    </div>
                  </div>
                )}
              </label>

              <button
                onClick={handleBatchUpload}
                disabled={isBatchProcessing || batchFiles.length === 0}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-md"
              >
                {isBatchProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Đang nạp và chấm {batchFiles.length} bài thi...
                  </>
                ) : (
                  <>
                    <Layers className="w-4 h-4 text-emerald-300" />
                    Bắt đầu chấm song song {batchFiles.length > 0 ? `(${batchFiles.length} bài)` : ""}
                  </>
                )}
              </button>
            </div>
          )}

          {/* =================================================== */}
          {/* REALTIME RESULTS TABLE                              */}
          {/* =================================================== */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-foreground">Bảng Kết Quả Realtime</span>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  ({submissions.length} bài)
                </span>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setTableFilter("all")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition ${
                    tableFilter === "all"
                      ? "bg-neutral-800 text-white font-bold"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  Tất cả ({submissions.length})
                </button>
                <button
                  onClick={() => setTableFilter("needs_review")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition flex items-center gap-1.5 ${
                    tableFilter === "needs_review"
                      ? "bg-amber-500/20 text-amber-300 font-bold"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  <span>Cần xem lại</span>
                  {needsReviewCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-amber-500 text-neutral-950 font-black rounded-full text-[10px]">
                      {needsReviewCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setTableFilter("confirmed")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition ${
                    tableFilter === "confirmed"
                      ? "bg-emerald-500/20 text-emerald-300 font-bold"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  Đã xác nhận ({confirmedCount})
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="border border-neutral-800 rounded-2xl overflow-hidden text-xs bg-neutral-950/60">
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="bg-neutral-900/80 text-neutral-400 font-bold border-b border-neutral-800 sticky top-0 backdrop-blur-md">
                    <tr>
                      <th className="py-2.5 px-3">STT</th>
                      <th className="py-2.5 px-3">SBD</th>
                      <th className="py-2.5 px-3">Họ và tên</th>
                      <th className="py-2.5 px-3 text-right">Điểm số</th>
                      <th className="py-2.5 px-3 text-center">Đúng/Sai</th>
                      <th className="py-2.5 px-3 text-center">Độ tin cậy</th>
                      <th className="py-2.5 px-3">Trạng thái</th>
                      <th className="py-2.5 px-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {filteredSubmissions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-neutral-500">
                          {submissions.length === 0
                            ? "Chưa có bài nào được nạp. Thầy/Cô hãy hướng điện thoại vào phiếu để chụp liên tục."
                            : "Không có bài nào phù hợp bộ lọc."}
                        </td>
                      </tr>
                    ) : (
                      filteredSubmissions.map((sub, idx) => {
                        const isNew = newSubIds.has(sub.id);
                        return (
                          <tr
                            key={sub.id}
                            onClick={() => openReviewModal(sub)}
                            className={`cursor-pointer transition-all duration-300 ${
                              isNew
                                ? "bg-emerald-950/50 animate-in fade-in slide-in-from-top-1"
                                : "hover:bg-neutral-900/60"
                            }`}
                          >
                            <td className="py-2.5 px-3 font-medium text-neutral-400">
                              {filteredSubmissions.length - idx}
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-neutral-100">
                              {sub.detectedSbd || <span className="text-amber-400 italic">Chưa có SBD</span>}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-neutral-200">
                              {sub.detectedName || (
                                <span className="text-neutral-500 italic">Chưa điền tên</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-black font-mono text-sm text-emerald-400">
                              {sub.score}
                            </td>
                            <td className="py-2.5 px-3 text-center text-neutral-300 font-mono">
                              {sub.correctCount}/{session.questionCount}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  sub.confidence >= 0.8
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                }`}
                              >
                                {Math.round(sub.confidence * 100)}%
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              {sub.status === "confirmed" ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  ✓ Đã xác nhận
                                </span>
                              ) : sub.status === "needs_review" ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  ⚠ Cần xem lại
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-800 text-neutral-300 border border-neutral-700">
                                  Đã chấm
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openReviewModal(sub);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white font-medium text-[11px] transition inline-flex items-center gap-1"
                              >
                                <Edit3 className="w-3 h-3" /> Sửa
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* =================================================== */}
          {/* OPTIONAL: CHẤM NHANH 1 BÀI (NHẬP TAY) Ở DƯỚI       */}
          {/* =================================================== */}
          <div className="border border-neutral-800 rounded-2xl overflow-hidden bg-neutral-900/30">
            <button
              onClick={() => setShowManualSection(!showManualSection)}
              className="w-full px-4 py-3 text-left font-bold text-xs text-neutral-400 hover:text-neutral-200 flex items-center justify-between transition"
            >
              <span>Chấm nhanh 1 bài (nhập tay) - Tùy chọn</span>
              {showManualSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showManualSection && (
              <div className="p-4 border-t border-neutral-800 space-y-3 bg-neutral-950/60">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-neutral-400 mb-1">Tên học sinh</label>
                    <input
                      type="text"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="Nguyễn Văn An..."
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1">Số báo danh (SBD)</label>
                    <input
                      type="text"
                      value={manualSbd}
                      onChange={(e) => setManualSbd(e.target.value)}
                      placeholder="10024..."
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-xl text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <button
                  onClick={() => submitDirectPaper()}
                  disabled={isAnalyzing}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs transition"
                >
                  Nạp 1 bài này vào bảng điểm
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =================================================== */}
      {/* REVIEW & CLICK-TO-CORRECT MODAL ("Cần xem lại")     */}
      {/* =================================================== */}
      {reviewingSubmission && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
          <div className="bg-neutral-900 border border-neutral-800 text-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
              <div>
                <h4 className="font-bold text-base text-neutral-100 flex items-center gap-2">
                  <span>Kiểm tra & Sửa bài thi</span>
                  {reviewingSubmission.status === "needs_review" && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Cần xem lại
                    </span>
                  )}
                </h4>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Phím tắt: <strong className="text-emerald-400">Enter</strong> để Xác nhận • <strong className="text-neutral-200">← / →</strong> chuyển bài trước/sau
                </p>
              </div>
              <button
                onClick={() => setReviewingSubmission(null)}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body: Side-by-Side (Left: Image, Right: Corrections) */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Image preview */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-neutral-400 block uppercase tracking-wider">
                  Ảnh Phiếu Trả Lời Trắc Nghiệm
                </span>
                <div className="aspect-[1/1.4] rounded-2xl bg-black border border-neutral-800 overflow-hidden flex items-center justify-center p-2">
                  {reviewingSubmission.annotatedImage || reviewingSubmission.imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={
                        reviewingSubmission.annotatedImage
                          ? `data:image/jpeg;base64,${reviewingSubmission.annotatedImage}`
                          : reviewingSubmission.imageUrl
                      }
                      alt="Phiếu trả lời"
                      className="w-full h-full object-contain rounded-xl"
                    />
                  ) : (
                    <div className="text-center text-xs text-neutral-500 p-4">
                      Không có ảnh chụp hoặc ảnh lưu offline trên máy quét.
                    </div>
                  )}
                </div>

                {reviewingSubmission.reviewNotes && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{reviewingSubmission.reviewNotes}</span>
                  </div>
                )}
              </div>

              {/* Right Column: SBD, Name & Click-to-correct Answers */}
              <div className="space-y-4 text-xs">
                {/* SBD & Name inputs */}
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-400 mb-1">
                      Số báo danh (SBD)
                    </label>
                    <input
                      type="text"
                      value={reviewSbd}
                      onChange={(e) => {
                        const val = e.target.value;
                        setReviewSbd(val);
                        // Auto match with roster
                        const matched = roster.find((r) => r.sbd.trim() === val.trim());
                        if (matched) {
                          setReviewName(matched.name);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 font-mono font-bold text-emerald-400 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-400 mb-1">
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      placeholder="Nhập tên..."
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Click-to-correct Answers Matrix */}
                {(() => {
                  const is2025 = session.sheetType === "2025";
                  const counts2025 = get2025QuestionCounts(session.subject, session.questionCount);
                  const totalQ = is2025 ? counts2025.totalQuestions : session.questionCount || 20;
                  const liveScored = scoreStudentAnswers({
                    sheetType: session.sheetType,
                    subject: session.subject,
                    questionCount: totalQ,
                    answerKey: session.answerKey || {},
                    studentAnswers: reviewAnswers,
                  });
                  const detailByQ = new Map(
                    liveScored.details.map((d) => [d.questionNumber, d])
                  );

                  return (
                    <div>
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <span className="font-bold text-neutral-300">Ma trận đáp án các câu:</span>
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                            Điểm: {liveScored.score}/10 ({liveScored.correctCount}/{totalQ} đúng)
                          </span>
                          <span className="text-neutral-400">Click hoặc nhập để sửa</span>
                        </div>
                      </div>

                      {is2025 ? (
                        <div className="space-y-3 max-h-72 overflow-y-auto p-2.5 border border-neutral-800 rounded-2xl bg-neutral-950">
                          {/* Phần I: ABCD */}
                          <div>
                            <div className="text-[11px] font-bold text-blue-400 mb-1.5 uppercase tracking-wider">
                              Phần I — Trắc nghiệm 4 lựa chọn ({counts2025.part1Count} câu)
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {Array.from({ length: counts2025.part1Count }).map((_, idx) => {
                                const qNum = idx + 1;
                                const d = detailByQ.get(qNum);
                                const currentSelected = d?.studentAnswer || "";
                                const correctKey = d?.correctAnswer || "";
                                const isCorrect = Boolean(d?.isCorrect);

                                return (
                                  <div
                                    key={qNum}
                                    className={`p-2 rounded-xl border ${
                                      isCorrect
                                        ? "bg-emerald-950/40 border-emerald-500/30"
                                        : currentSelected
                                        ? "bg-rose-950/40 border-rose-500/30"
                                        : "bg-neutral-900 border-neutral-800"
                                    }`}
                                  >
                                    <div className="flex justify-between items-center mb-1 text-[11px] font-bold">
                                      <span>Câu {qNum}:</span>
                                      {isCorrect ? (
                                        <span className="text-emerald-400">✓ Đúng</span>
                                      ) : (
                                        <span className="text-rose-400">
                                          {currentSelected ? "✗ Sai" : "— Trống"}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex justify-between gap-1">
                                      {["A", "B", "C", "D"].map((opt) => {
                                        const isPicked = currentSelected === opt;
                                        const isKey = correctKey === opt;
                                        let btnClass =
                                          "border border-neutral-700 text-neutral-400 hover:border-neutral-500";
                                        if (isPicked && isKey) {
                                          btnClass =
                                            "bg-emerald-600 border-emerald-500 text-white font-black";
                                        } else if (isPicked && !isKey) {
                                          btnClass =
                                            "bg-rose-600 border-rose-500 text-white font-black";
                                        } else if (!isPicked && isKey) {
                                          btnClass =
                                            "border-dashed border-emerald-500 text-emerald-400 bg-emerald-950/30 font-bold";
                                        }
                                        return (
                                          <button
                                            key={opt}
                                            type="button"
                                            onClick={() => {
                                              setReviewAnswers((prev) => ({
                                                ...prev,
                                                [qNum]: prev[qNum] === opt ? "" : opt,
                                              }));
                                            }}
                                            className={`w-6 h-6 rounded-lg text-[10px] flex items-center justify-center transition active:scale-90 ${btnClass}`}
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

                          {/* Phần II: Đúng / Sai */}
                          <div>
                            <div className="text-[11px] font-bold text-purple-400 mb-1.5 uppercase tracking-wider">
                              Phần II — Đúng / Sai ({counts2025.part2Count} câu × 4 ý)
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {Array.from({ length: counts2025.part2Count }).map((_, idx) => {
                                const qNum = counts2025.part1Count + idx + 1;
                                const d = detailByQ.get(qNum);
                                const normVal = normalizeTfGroupAnswer(reviewAnswers[qNum]);
                                const subParts = normVal ? normVal.split("-") : ["", "", "", ""];
                                const keyNorm = normalizeTfGroupAnswer(d?.correctAnswer);
                                const keyParts = keyNorm ? keyNorm.split("-") : ["", "", "", ""];

                                const toggleSub = (subIdx: number, val: "Đ" | "S") => {
                                  const next = [...subParts];
                                  next[subIdx] = next[subIdx] === val ? "" : val;
                                  const joined = next.some(Boolean) ? next.join("-") : "";
                                  setReviewAnswers((prev) => ({
                                    ...prev,
                                    [qNum]: joined,
                                  }));
                                };

                                return (
                                  <div
                                    key={qNum}
                                    className={`p-2.5 rounded-xl border ${
                                      d?.isCorrect
                                        ? "bg-emerald-950/40 border-emerald-500/30"
                                        : normVal
                                        ? "bg-neutral-900 border-neutral-700"
                                        : "bg-neutral-900 border-neutral-800"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-1.5 text-[11px] font-bold">
                                      <span>Câu {qNum}</span>
                                      <span className="font-mono text-purple-300">
                                        {d ? `${d.score}đ` : "0đ"}
                                      </span>
                                    </div>
                                    <div className="space-y-1">
                                      {["a", "b", "c", "d"].map((subKey, subIdx) => {
                                        const picked = subParts[subIdx] || "";
                                        const keyVal = keyParts[subIdx] || "";
                                        return (
                                          <div
                                            key={subKey}
                                            className="flex items-center justify-between text-[11px]"
                                          >
                                            <span className="font-bold text-neutral-400">
                                              {subKey})
                                              {keyVal && (
                                                <span className="ml-1 text-[10px] text-neutral-500 font-normal">
                                                  (ĐÁ: {keyVal})
                                                </span>
                                              )}
                                            </span>
                                            <div className="flex gap-1">
                                              {(["Đ", "S"] as const).map((opt) => {
                                                const isPicked = picked === opt;
                                                const isKey = keyVal === opt;
                                                let cls =
                                                  "border border-neutral-700 text-neutral-400 hover:border-neutral-500";
                                                if (isPicked && isKey) {
                                                  cls =
                                                    "bg-emerald-600 border-emerald-500 text-white font-bold";
                                                } else if (isPicked && !isKey && keyVal) {
                                                  cls =
                                                    "bg-rose-600 border-rose-500 text-white font-bold";
                                                } else if (isPicked) {
                                                  cls =
                                                    "bg-purple-600 border-purple-500 text-white font-bold";
                                                } else if (isKey) {
                                                  cls =
                                                    "border-dashed border-emerald-500/70 text-emerald-400";
                                                }
                                                return (
                                                  <button
                                                    key={opt}
                                                    type="button"
                                                    onClick={() => toggleSub(subIdx, opt)}
                                                    className={`px-2 py-0.5 rounded text-[10px] transition ${cls}`}
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
                                );
                              })}
                            </div>
                          </div>

                          {/* Phần III: Điền số (chỉ Toán & KHTN/Địa lí) */}
                          {counts2025.part3Count > 0 && (
                            <div>
                              <div className="text-[11px] font-bold text-emerald-400 mb-1.5 uppercase tracking-wider">
                                Phần III — Trả lời ngắn / Điền số ({counts2025.part3Count} câu)
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {Array.from({ length: counts2025.part3Count }).map((_, idx) => {
                                  const qNum =
                                    counts2025.part1Count + counts2025.part2Count + idx + 1;
                                  const val =
                                    reviewAnswers[qNum] !== undefined
                                      ? reviewAnswers[qNum]
                                      : "";
                                  const d = detailByQ.get(qNum);
                                  return (
                                    <div
                                      key={qNum}
                                      className={`p-2 rounded-xl border ${
                                        d?.isCorrect
                                          ? "bg-emerald-950/40 border-emerald-500/30"
                                          : val
                                          ? "bg-rose-950/40 border-rose-500/30"
                                          : "bg-neutral-900 border-neutral-800"
                                      }`}
                                    >
                                      <div className="flex justify-between items-center mb-1 text-[10px] font-bold">
                                        <span>Câu {qNum}</span>
                                        {d?.correctAnswer && (
                                          <span className="text-emerald-400 font-mono">
                                            ĐÁ: {d.correctAnswer}
                                          </span>
                                        )}
                                      </div>
                                      <input
                                        type="text"
                                        maxLength={4}
                                        value={val}
                                        onChange={(e) => {
                                          const filtered = e.target.value.replace(/[^0-9\-.,]/g, "");
                                          setReviewAnswers((prev) => ({
                                            ...prev,
                                            [qNum]: filtered,
                                          }));
                                        }}
                                        placeholder="Trống"
                                        className="w-full px-2 py-1 rounded-lg bg-neutral-950 border border-neutral-700 font-mono font-bold text-center text-xs text-emerald-400 outline-none focus:border-emerald-500"
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-60 overflow-y-auto p-1 border border-neutral-800 rounded-2xl bg-neutral-950">
                          {Array.from({ length: totalQ }).map((_, idx) => {
                            const qNum = idx + 1;
                            const d = detailByQ.get(qNum);
                            const currentSelected = d?.studentAnswer || "";
                            const correctKey = (d?.correctAnswer || session.answerKey[qNum] || "A")
                              .trim()
                              .toUpperCase();
                            const isCorrect = Boolean(d?.isCorrect);

                            return (
                              <div
                                key={qNum}
                                className={`p-2 rounded-xl border ${
                                  isCorrect
                                    ? "bg-emerald-950/40 border-emerald-500/30"
                                    : currentSelected
                                    ? "bg-rose-950/40 border-rose-500/30"
                                    : "bg-neutral-900 border-neutral-800"
                                }`}
                              >
                                <div className="flex justify-between items-center mb-1 text-[11px] font-bold">
                                  <span>Câu {qNum}:</span>
                                  {isCorrect ? (
                                    <span className="text-emerald-400">✓ Đúng</span>
                                  ) : (
                                    <span className="text-rose-400">
                                      {currentSelected ? "✗ Sai" : "— Trống"}
                                    </span>
                                  )}
                                </div>

                                <div className="flex justify-between gap-1">
                                  {["A", "B", "C", "D"].map((opt) => {
                                    const isPicked = currentSelected === opt;
                                    const isKey = correctKey === opt;

                                    let btnClass =
                                      "border border-neutral-700 text-neutral-400 hover:border-neutral-500";
                                    if (isPicked && isKey) {
                                      btnClass =
                                        "bg-emerald-600 border-emerald-500 text-white font-black";
                                    } else if (isPicked && !isKey) {
                                      btnClass =
                                        "bg-rose-600 border-rose-500 text-white font-black";
                                    } else if (!isPicked && isKey) {
                                      btnClass =
                                        "border-dashed border-emerald-500 text-emerald-400 bg-emerald-950/30 font-bold";
                                    }

                                    return (
                                      <button
                                        key={opt}
                                        type="button"
                                        onClick={() => {
                                          setReviewAnswers((prev) => ({
                                            ...prev,
                                            [qNum]: prev[qNum] === opt ? "" : opt,
                                          }));
                                        }}
                                        className={`w-6 h-6 rounded-lg text-[10px] flex items-center justify-center transition active:scale-90 ${btnClass}`}
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
                  );
                })()}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-neutral-800 flex items-center justify-between bg-neutral-950/80">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const curIdx = submissions.findIndex((s) => s.id === reviewingSubmission.id);
                    if (curIdx > 0) openReviewModal(submissions[curIdx - 1]);
                  }}
                  disabled={submissions.findIndex((s) => s.id === reviewingSubmission.id) === 0}
                  className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold flex items-center gap-1 disabled:opacity-40"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Bài trước
                </button>
                <button
                  onClick={() => {
                    const curIdx = submissions.findIndex((s) => s.id === reviewingSubmission.id);
                    if (curIdx < submissions.length - 1) openReviewModal(submissions[curIdx + 1]);
                  }}
                  disabled={
                    submissions.findIndex((s) => s.id === reviewingSubmission.id) ===
                    submissions.length - 1
                  }
                  className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold flex items-center gap-1 disabled:opacity-40"
                >
                  Bài sau <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setReviewingSubmission(null)}
                  className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white text-xs font-medium"
                >
                  Đóng
                </button>
                <button
                  onClick={handleConfirmReview}
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-lg shadow-emerald-950/50"
                >
                  <Check className="w-4 h-4" />
                  Xác nhận bài này (Enter)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================== */}
      {/* IMPORT ROSTER MODAL                                 */}
      {/* =================================================== */}
      {showRosterModal && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 text-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h4 className="font-bold text-base text-neutral-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                Nhập danh sách lớp (Roster)
              </h4>
              <button
                onClick={() => setShowRosterModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Dán danh sách học sinh theo định dạng:{" "}
              <strong className="text-white font-mono">SBD, Họ và tên</strong> (mỗi học sinh một dòng)
              hoặc tải lên file CSV/Excel.
            </p>

            <textarea
              rows={6}
              value={rosterInputText}
              onChange={(e) => setRosterInputText(e.target.value)}
              placeholder={`10024, Nguyễn Văn An\n10025, Trần Thị Bình\n10026, Lê Hoàng Nam`}
              className="w-full p-3 rounded-2xl bg-neutral-950 border border-neutral-700 text-xs font-mono text-white outline-none focus:border-cyan-500 resize-none"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowRosterModal(false)}
                className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white text-xs font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveRoster}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition"
              >
                Lưu danh sách lớp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
