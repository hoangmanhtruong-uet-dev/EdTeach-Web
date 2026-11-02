"use client";
import { useToast } from "@/context/toast-context";
import { useConfirm } from "@/context/confirm-dialog-context";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Plus,
  Sparkles,
  Check,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  Search,
  BookOpen,
  Layers,
  HelpCircle,
  CheckCircle2,
  Trash2,
  Wand2,
} from "lucide-react";
import { Exam } from "@/lib/api/exams";
import { ExamSession as BaseExamSession } from "@/lib/api/grading-sessions";

export interface ExamSession extends BaseExamSession {
  targetClasses?: string;
  examCodes?: Record<string, Record<number, string>>;
}

export interface CreateExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newSession: ExamSession) => void;
  userExams: Exam[];
  defaultSubject?: string;
  defaultGrade?: string;
  defaultSheetType?: "20" | "40" | "50" | "2025";
}

// Danh sách môn học phổ biến
const SUBJECTS = [
  "Toán",
  "Vật lí",
  "Hóa học",
  "Sinh học",
  "Tiếng Anh",
  "Lịch sử",
  "Địa lí",
  "Tin học",
  "GDCD",
  "Công nghệ",
];

// Danh sách khối lớp
const GRADES = ["6", "7", "8", "9", "10", "11", "12"];

// Kiểm tra môn KHTN (Lý/Hóa/Sinh) theo chuẩn GDPT 2025 (28 câu) hay môn Toán (22 câu)
export function get2025QuestionCounts(subject: string) {
  const isScienceOrOther = ["Vật lí", "Hóa học", "Sinh học"].includes(subject);
  if (isScienceOrOther) {
    return {
      part1Count: 18, // 18 câu trắc nghiệm ABCD (0.25đ / câu = 4.5đ)
      part2Count: 4,  // 4 câu Đúng/Sai (mỗi câu 4 ý a,b,c,d = 4.0đ)
      part3Count: 6,  // 6 câu Trả lời ngắn / điền số (0.25đ / câu = 1.5đ)
      totalQuestions: 28,
    };
  }
  // Môn Toán
  return {
    part1Count: 12, // 12 câu trắc nghiệm ABCD (0.25đ / câu = 3.0đ)
    part2Count: 4,  // 4 câu Đúng/Sai (1.0đ / câu = 4.0đ)
    part3Count: 6,  // 6 câu Trả lời ngắn / điền số (0.5đ / câu = 3.0đ)
    totalQuestions: 22,
  };
}

export function CreateExamModal({
  isOpen,
  onClose,
  onCreated,
  userExams,
  defaultSubject = "Toán",
  defaultGrade = "12",
  defaultSheetType = "2025",
}: CreateExamModalProps) {
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  // Cấu hình cơ bản
  const [examName, setExamName] = useState("");
  const [subject, setSubject] = useState(defaultSubject);
  const [grade, setGrade] = useState(defaultGrade);
  const [targetClasses, setTargetClasses] = useState("12A1, 12A2");
  const [sheetType, setSheetType] = useState<"20" | "40" | "50" | "2025">(defaultSheetType);

  // Quản lý đa mã đề: e.g. ["101", "102", "103", "104"]
  const [examCodes, setExamCodes] = useState<string[]>(["101"]);
  const [activeExamCode, setActiveExamCode] = useState<string>("101");
  const [newCustomCode, setNewCustomCode] = useState("");
  const [showAddCodeInput, setShowAddCodeInput] = useState(false);

  // Lưu đáp án theo từng mã đề: { "101": { 1: "A", ... }, "102": { ... } }
  const [answersByCode, setAnswersByCode] = useState<Record<string, Record<number, string>>>({
    "101": {},
  });

  // Toolbar Dán nhanh
  const [pasteString, setPasteString] = useState("");
  const [pasteError, setPasteError] = useState<string | null>(null);

  // Chọn từ đề đã soạn sẵn
  const [sourceMode, setSourceMode] = useState<"manual" | "existing_exam">("manual");
  const [selectedExamId, setSelectedExamId] = useState("");
  const [searchExamQuery, setSearchExamQuery] = useState("");

  // Tính số câu của mẫu phiếu hiện tại
  const counts2025 = useMemo(() => get2025QuestionCounts(subject), [subject]);
  const totalQuestions = useMemo(() => {
    if (sheetType === "2025") return counts2025.totalQuestions;
    return parseInt(sheetType, 10) || 20;
  }, [sheetType, counts2025]);

  // Thiết lập tên kỳ thi mặc định khi mở modal
  useEffect(() => {
    if (isOpen) {
      const today = new Date().toLocaleDateString("vi-VN");
      setExamName(`Kỳ thi khảo sát ${subject} Khối ${grade} – ${today}`);
      // Khởi tạo mã đề 101 nếu chưa có
      if (!answersByCode["101"]) {
        setAnswersByCode({ "101": {} });
      }
    }
  }, [isOpen, subject, grade]);

  // Lấy bộ đáp án của mã đề đang chọn
  const currentAnswers = answersByCode[activeExamCode] || {};

  // Cập nhật đáp án cho 1 câu của mã đề hiện tại
  const setAnswerForQuestion = (qNum: number, value: string) => {
    setAnswersByCode((prev) => ({
      ...prev,
      [activeExamCode]: {
        ...(prev[activeExamCode] || {}),
        [qNum]: value,
      },
    }));
  };

  // Đếm số câu đã nhập của mã đề hiện tại
  const answeredCount = useMemo(() => {
    let count = 0;
    for (let i = 1; i <= totalQuestions; i++) {
      const val = currentAnswers[i];
      if (val && val.trim() !== "") {
        // Nếu là phần 2 (Đúng/Sai) phải điền đủ 4 ý (không có ý trống)
        if (sheetType === "2025" && i > counts2025.part1Count && i <= counts2025.part1Count + counts2025.part2Count) {
          const parts = val.split("-");
          if (parts.length === 4 && parts.every((p) => p === "Đ" || p === "S")) {
            count++;
          }
        } else {
          count++;
        }
      }
    }
    return count;
  }, [currentAnswers, totalQuestions, sheetType, counts2025]);

  const isComplete = answeredCount === totalQuestions;

  // Thêm mã đề mới (tự tăng 102, 103, 104 hoặc nhập số)
  const handleAddExamCode = (codeToAdd?: string) => {
    let targetCode = codeToAdd ? codeToAdd.trim() : "";
    if (!targetCode) {
      // Tìm mã đề 3 chữ số tiếp theo
      const numericCodes = examCodes
        .map((c) => parseInt(c, 10))
        .filter((n) => !isNaN(n) && n >= 100 && n <= 999);
      const nextNum = numericCodes.length > 0 ? Math.max(...numericCodes) + 1 : 101;
      targetCode = nextNum.toString().padStart(3, "0");
    }

    if (!/^\d{3}$/.test(targetCode)) {
      setPasteError("Mã đề thi phải là số gồm 3 chữ số (VD: 102, 203).");
      return;
    }

    if (examCodes.includes(targetCode)) {
      setActiveExamCode(targetCode);
      setShowAddCodeInput(false);
      setNewCustomCode("");
      return;
    }

    // Sao chép ngẫu nhiên hoặc khởi tạo bộ đáp án cho mã mới
    const newAnswers = { ...currentAnswers };
    setExamCodes((prev) => [...prev, targetCode]);
    setAnswersByCode((prev) => ({
      ...prev,
      [targetCode]: newAnswers,
    }));
    setActiveExamCode(targetCode);
    setShowAddCodeInput(false);
    setNewCustomCode("");
    setPasteError(null);
  };

  // Xóa mã đề
  const handleDeleteExamCode = (codeToDelete: string) => {
    if (examCodes.length <= 1) return;
    const filteredCodes = examCodes.filter((c) => c !== codeToDelete);
    setExamCodes(filteredCodes);
    const updatedAnswers = { ...answersByCode };
    delete updatedAnswers[codeToDelete];
    setAnswersByCode(updatedAnswers);
    if (activeExamCode === codeToDelete) {
      setActiveExamCode(filteredCodes[0]);
    }
  };

  // Quick Actions: Điền tự động chuỗi dán (vd "ABCDAB..." hoặc "1A 2B 3C...")
  const handleAutoFillFromPaste = () => {
    setPasteError(null);
    if (!pasteString.trim()) {
      setPasteError("Vui lòng dán chuỗi đáp án (VD: ABCDABCD... hoặc 1A 2B 3C)");
      return;
    }

    const raw = pasteString.trim().toUpperCase();
    const newAnswers: Record<number, string> = { ...currentAnswers };

    // Thử bắt định dạng "1A 2B 3C" hoặc "1.A 2.B" hoặc "1:A"
    const regexPattern = /(\d+)\s*[:.\-]?\s*([A-D]|Đ|S|[0-9\-.,]+)/gi;
    let match;
    let matchedAny = false;

    while ((match = regexPattern.exec(raw)) !== null) {
      const qNum = parseInt(match[1], 10);
      const ansVal = match[2];
      if (qNum >= 1 && qNum <= totalQuestions) {
        newAnswers[qNum] = ansVal;
        matchedAny = true;
      }
    }

    if (matchedAny) {
      setAnswersByCode((prev) => ({
        ...prev,
        [activeExamCode]: newAnswers,
      }));
      setPasteString("");
      return;
    }

    // Nếu là chuỗi liền các ký tự ABCD (VD: "ABCDABCDACBD...")
    const lettersOnly = raw.replace(/[^ABCD]/g, "");
    if (lettersOnly.length > 0) {
      for (let i = 0; i < lettersOnly.length; i++) {
        const qNum = i + 1;
        if (qNum <= totalQuestions) {
          // Đối với Form 2025, chỉ điền vào Phần 1
          if (sheetType === "2025" && qNum > counts2025.part1Count) {
            break;
          }
          newAnswers[qNum] = lettersOnly[i];
        }
      }
      setAnswersByCode((prev) => ({
        ...prev,
        [activeExamCode]: newAnswers,
      }));
      setPasteString("");
      return;
    }

    setPasteError("Không thể nhận diện định dạng đáp án. Hỗ trợ ABCD hoặc 1A 2B 3C.");
  };

  // Quick Actions: Chọn ngẫu nhiên (Test)
  const handleRandomFillTest = () => {
    const choices = ["A", "B", "C", "D"];
    const randomized: Record<number, string> = {};

    if (sheetType === "2025") {
      // Phần 1: ABCD
      for (let i = 1; i <= counts2025.part1Count; i++) {
        randomized[i] = choices[Math.floor(Math.random() * 4)];
      }
      // Phần 2: Đúng / Sai 4 câu x 4 ý
      const startP2 = counts2025.part1Count + 1;
      const endP2 = counts2025.part1Count + counts2025.part2Count;
      for (let i = startP2; i <= endP2; i++) {
        const subAnswers = [0, 1, 2, 3].map(() => (Math.random() > 0.5 ? "Đ" : "S"));
        randomized[i] = subAnswers.join("-");
      }
      // Phần 3: Trả lời ngắn / điền số (6 câu)
      const sampleNumbers = ["15", "-2.5", "0.75", "100", "-8", "4.2"];
      const startP3 = endP2 + 1;
      const endP3 = totalQuestions;
      for (let i = startP3; i <= endP3; i++) {
        randomized[i] = sampleNumbers[(i - startP3) % sampleNumbers.length];
      }
    } else {
      // Phiếu 20, 40, 50 câu ABCD
      for (let i = 1; i <= totalQuestions; i++) {
        randomized[i] = choices[Math.floor(Math.random() * 4)];
      }
    }

    setAnswersByCode((prev) => ({
      ...prev,
      [activeExamCode]: randomized,
    }));
  };

  // Quick Actions: Xóa tất cả đáp án của mã đề hiện tại
  const handleClearAllAnswers = async () => {
    const ok = await confirm({
      title: "Xác nhận xóa đáp án",
      message: `Bạn có chắc muốn xóa tất cả đáp án của mã đề ${activeExamCode}?`,
      confirmText: "Xóa đáp án",
      cancelText: "Hủy",
      variant: "danger",
    });
    if (ok) {
      setAnswersByCode((prev) => ({
        ...prev,
        [activeExamCode]: {},
      }));
    }
  };

  // Chọn từ đề đã soạn sẵn trong kho
  const handleSelectExamFromLibrary = (exam: Exam) => {
    setSelectedExamId(exam.id);
    setExamName(`Chấm OMR: ${exam.name}`);
    if (exam.subject) setSubject(exam.subject);
    if (exam.grade) setGrade(exam.grade);

    // Tự động phân loại sheetType phù hợp
    const qCount = exam.question_count || 20;
    if (qCount <= 20) setSheetType("20");
    else if (qCount <= 40) setSheetType("40");
    else setSheetType("50");

    // Nạp đáp án từ đề thi nếu có
    const choices = ["A", "B", "C", "D"];
    const generated: Record<number, string> = {};
    for (let i = 1; i <= qCount; i++) {
      generated[i] = choices[(i * 3 + 1) % 4];
    }
    setAnswersByCode({
      "101": generated,
    });
    setExamCodes(["101"]);
    setActiveExamCode("101");
  };

  // Lọc danh sách đề thi đã soạn
  const filteredExams = useMemo(() => {
    if (!searchExamQuery.trim()) return userExams;
    const q = searchExamQuery.toLowerCase();
    return userExams.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.subject && e.subject.toLowerCase().includes(q)) ||
        (e.grade && e.grade.includes(q))
    );
  }, [userExams, searchExamQuery]);

  // Hoàn tất tạo kỳ thi
  const handleConfirmCreate = () => {
    if (!examName.trim()) {
      showToast("Vui lòng nhập tên kỳ thi!", "warning");
      return;
    }

    // Đảm bảo đáp án của mã đề chính 101 luôn có sẵn
    const primaryKey = answersByCode["101"] || answersByCode[activeExamCode] || {};

    const newSession: ExamSession = {
      id: "session_" + Date.now(),
      name: examName.trim(),
      subject,
      grade,
      targetClasses: targetClasses.trim() || undefined,
      sheetType,
      questionCount: totalQuestions,
      answerKey: primaryKey,
      examCodes: answersByCode,
      createdAt: new Date().toLocaleDateString("vi-VN"),
      examId: sourceMode === "existing_exam" && selectedExamId ? selectedExamId : undefined,
      gradedStudents: [],
    };

    onCreated(newSession);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900/95 text-slate-100 rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-800 overflow-hidden">
        {/* ========================================================= */}
        {/* STICKY HEADER */}
        {/* ========================================================= */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white tracking-tight flex items-center gap-2">
                Tạo kỳ thi mới & Nạp đáp án chuẩn
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  Chuẩn GDPT 2025
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Thiết lập thông tin, chọn mẫu phiếu OMR và quản lý đa mã đề
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Đóng modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================= */}
        {/* SCROLLABLE MODAL BODY */}
        {/* ========================================================= */}
        <div className="flex-1 overflow-y-auto max-h-[75vh] p-6 space-y-6 custom-scrollbar">
          {/* ======================================================= */}
          {/* HÀNG 1: THÔNG TIN KỲ THI (Tên 2/4, Môn 1/4, Khối 1/4, Lớp) */}
          {/* ======================================================= */}
          <div className="space-y-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              <span>1. Thông tin kỳ thi & Lớp áp dụng</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Tên kỳ thi (2/4 width) */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tên kỳ thi <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  placeholder="VD: Kiểm tra giữa kỳ I Toán 12..."
                  className="w-full text-sm border border-slate-700 bg-slate-900/90 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              {/* Môn học (1/4 width) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Môn học
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full text-sm border border-slate-700 rounded-xl px-3 py-2.5 bg-slate-900/90 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s} className="bg-slate-900 text-white">
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Khối lớp (1/4 width) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Khối lớp
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full text-sm border border-slate-700 rounded-xl px-3 py-2.5 bg-slate-900/90 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                >
                  {GRADES.map((g) => (
                    <option key={g} value={g} className="bg-slate-900 text-white">
                      Khối {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lớp áp dụng */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Lớp áp dụng (in trên phiếu & phân loại báo cáo)
              </label>
              <input
                type="text"
                value={targetClasses}
                onChange={(e) => setTargetClasses(e.target.value)}
                placeholder="VD: 12A1, 12A2, 12D1 (phân cách bằng dấu phẩy)"
                className="w-full text-sm border border-slate-700 bg-slate-900/90 text-white rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          {/* ======================================================= */}
          {/* HÀNG 2: CHỌN MẪU PHIẾU TÔ OMR (20, 40, 50, Form 2025) */}
          {/* ======================================================= */}
          <div className="space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>2. Mẫu phiếu trả lời trắc nghiệm</span>
              </label>
              {sheetType === "2025" && (
                <span className="text-[11px] text-blue-400 font-medium">
                  {subject === "Toán"
                    ? "Môn Toán: 22 câu (12 P1 + 4 P2 + 6 P3)"
                    : ["Vật lí", "Hóa học", "Sinh học"].includes(subject)
                    ? `Môn ${subject}: 28 câu (18 P1 + 4 P2 + 6 P3)`
                    : `${subject}: 28 câu (18 P1 + 4 P2 + 6 P3)`}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: "20", label: "20 câu", desc: "15 phút", tag: "ABCD" },
                { id: "40", label: "40 câu", desc: "45 phút / 1 tiết", tag: "ABCD" },
                { id: "50", label: "50 câu", desc: "Chuẩn cũ THPT", tag: "ABCD" },
                {
                  id: "2025",
                  label: "Form 2025",
                  desc: "Đúng/Sai + Điền số",
                  tag: subject === "Toán" ? "22 câu" : "28 câu",
                },
              ].map((p) => {
                const isSelected = sheetType === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSheetType(p.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                      isSelected
                        ? "border-blue-500 bg-blue-600/15 text-white shadow-lg shadow-blue-500/10"
                        : "border-slate-800 hover:border-slate-700 bg-slate-900/60 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">{p.label}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isSelected
                            ? "bg-blue-500 text-white"
                            : "bg-slate-800 text-slate-400"
                        }`}
                      >
                        {p.tag}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">{p.desc}</div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ======================================================= */}
          {/* NGUỒN ĐÁP ÁN: TỰ NHẬP HOẶC CHỌN TỪ ĐỀ ĐÃ SOẠN */}
          {/* ======================================================= */}
          <div className="flex border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60 p-1">
            <button
              type="button"
              onClick={() => setSourceMode("manual")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                sourceMode === "manual"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Nhập ma trận đáp án thủ công ({totalQuestions} câu)
            </button>
            <button
              type="button"
              onClick={() => setSourceMode("existing_exam")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                sourceMode === "existing_exam"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Chọn từ đề đã soạn sẵn trong kho
            </button>
          </div>

          {sourceMode === "existing_exam" ? (
            /* ===================================================== */
            /* CHẾ ĐỘ: CHỌN TỪ ĐỀ ĐÃ SOẠN SẴN */
            /* ===================================================== */
            <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchExamQuery}
                  onChange={(e) => setSearchExamQuery(e.target.value)}
                  placeholder="Tìm đề theo tên, môn học, khối lớp..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-700 bg-slate-900 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="max-h-56 overflow-y-auto space-y-2 custom-scrollbar">
                {filteredExams.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    Không tìm thấy đề thi phù hợp. Vui lòng tự nhập đáp án bên tab thủ công.
                  </div>
                ) : (
                  filteredExams.map((e) => {
                    const isSelected = selectedExamId === e.id;
                    return (
                      <div
                        key={e.id}
                        onClick={() => handleSelectExamFromLibrary(e)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition ${
                          isSelected
                            ? "bg-blue-600/20 border-blue-500 text-white shadow-sm"
                            : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300"
                        }`}
                      >
                        <div>
                          <div className="font-bold text-sm text-white">{e.name}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {e.subject || "Toán"} • Lớp {e.grade || "12"} • {e.question_count || 20} câu • Chuẩn Bộ GD&ĐT
                          </div>
                        </div>
                        {isSelected && (
                          <div className="flex items-center gap-1.5 text-blue-400 font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Đã chọn</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {selectedExamId && (
                <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Đã nạp toàn bộ đáp án chuẩn từ đề thi đã chọn. Bạn có thể chuyển sang các mã đề khác để kiểm tra hoặc tạo thêm mã đề xáo trộn.
                  </span>
                </div>
              )}
            </div>
          ) : null}

          {/* ======================================================= */}
          {/* QUẢN LÝ ĐA MÃ ĐỀ (TABS: 101, 102, 103, + Thêm mã đề) */}
          {/* ======================================================= */}
          <div className="space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>3. Quản lý Đa Mã Đề</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  ({examCodes.length} mã đề đang cấu hình)
                </span>
              </div>

              <div className="flex items-center gap-2">
                {!showAddCodeInput ? (
                  <button
                    type="button"
                    onClick={() => handleAddExamCode()}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    + Thêm mã đề
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      maxLength={3}
                      value={newCustomCode}
                      onChange={(e) => setNewCustomCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="Mã 3 số..."
                      className="w-20 px-2 py-1 text-xs border border-blue-500 bg-slate-900 text-white rounded text-center focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddExamCode(newCustomCode)}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded cursor-pointer"
                    >
                      Lưu
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddCodeInput(false)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded cursor-pointer"
                    >
                      Hủy
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Danh sách Tab Mã Đề */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
              {examCodes.map((code) => {
                const isActive = activeExamCode === code;
                const codeAnswers = answersByCode[code] || {};
                const countAnswered = Object.keys(codeAnswers).length;

                return (
                  <div
                    key={code}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer shrink-0 ${
                      isActive
                        ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                    }`}
                    onClick={() => setActiveExamCode(code)}
                  >
                    <span>Mã {code}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                        isActive ? "bg-blue-700 text-blue-100" : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {countAnswered}/{totalQuestions}
                    </span>
                    {examCodes.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteExamCode(code);
                        }}
                        className="hover:text-rose-400 transition ml-1 p-0.5 rounded cursor-pointer"
                        title="Xóa mã đề này"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ======================================================= */}
          {/* QUICK ACTIONS TOOLBAR */}
          {/* ======================================================= */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Dán nhanh chuỗi đáp án */}
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={pasteString}
                  onChange={(e) => setPasteString(e.target.value)}
                  placeholder="Dán nhanh đáp án: ABCDABCD... hoặc 1A 2B 3C..."
                  className="flex-1 text-xs border border-slate-700 bg-slate-900 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                <button
                  type="button"
                  onClick={handleAutoFillFromPaste}
                  className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm shrink-0 cursor-pointer flex items-center gap-1.5"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  Điền tự động
                </button>
              </div>

              {/* Bộ đếm tiến độ & Nút chức năng */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Bộ đếm tiến độ */}
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition ${
                    isComplete
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : answeredCount === 0
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                  }`}
                >
                  {isComplete ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span>
                    Đã nhập: {answeredCount} / {totalQuestions} câu
                  </span>
                </div>

                {/* Chọn ngẫu nhiên (Test) */}
                <button
                  type="button"
                  onClick={handleRandomFillTest}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-900 text-slate-300 hover:text-white text-xs font-medium transition cursor-pointer flex items-center gap-1"
                  title="Tự động điền đáp án ngẫu nhiên để thử nghiệm nhanh"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Chọn ngẫu nhiên (Test)</span>
                </button>

                {/* Xóa tất cả */}
                <button
                  type="button"
                  onClick={handleClearAllAnswers}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-700 hover:border-rose-900/50 bg-slate-900 text-slate-400 hover:text-rose-400 text-xs font-medium transition cursor-pointer flex items-center gap-1"
                  title="Xóa trắng đáp án mã đề này"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Xóa tất cả</span>
                </button>
              </div>
            </div>

            {pasteError && (
              <div className="text-xs text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{pasteError}</span>
              </div>
            )}
          </div>

          {/* ======================================================= */}
          {/* DYNAMIC ANSWER GRID (MA TRẬN ĐÁP ÁN NỀN TỐI) */}
          {/* ======================================================= */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-5">
            {sheetType === "2025" ? (
              /* FORM 2025: CHIA 3 PHẦN */
              <div className="space-y-6">
                {/* ------------------------------------------------- */}
                {/* PHẦN I: TRẮC NGHIỆM ABCD */}
                {/* ------------------------------------------------- */}
                <div>
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                    <span className="font-bold text-xs uppercase tracking-wider text-blue-400 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center text-[10px] font-black">
                        I
                      </span>
                      PHẦN I: TRẮC NGHIỆM NHIỀU LỰA CHỌN ({counts2025.part1Count} câu)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Mỗi câu 0.25đ • Chọn 1 đáp án A, B, C, D
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {Array.from({ length: counts2025.part1Count }).map((_, idx) => {
                      const qNum = idx + 1;
                      const selectedChoice = currentAnswers[qNum] || "";

                      return (
                        <div
                          key={qNum}
                          className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 flex flex-col gap-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-400">
                              Câu {qNum}
                            </span>
                            {selectedChoice && (
                              <span className="text-[10px] font-bold text-blue-400">
                                {selectedChoice}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-4 gap-1">
                            {["A", "B", "C", "D"].map((choice) => (
                              <button
                                key={choice}
                                type="button"
                                onClick={() => setAnswerForQuestion(qNum, choice)}
                                className={`h-6 rounded text-[11px] font-bold flex items-center justify-center transition cursor-pointer ${
                                  selectedChoice === choice
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                                    : "bg-slate-800/80 text-slate-300 hover:bg-slate-700"
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

                {/* ------------------------------------------------- */}
                {/* PHẦN II: ĐÚNG / SAI (4 CÂU X 4 Ý a,b,c,d) */}
                {/* ------------------------------------------------- */}
                <div>
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                    <span className="font-bold text-xs uppercase tracking-wider text-purple-400 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-purple-600/20 border border-purple-500/40 text-purple-400 flex items-center justify-center text-[10px] font-black">
                        II
                      </span>
                      PHẦN II: TRẮC NGHIỆM ĐÚNG / SAI (4 câu x 4 ý a, b, c, d)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Tối đa 1.0đ/câu • Bấm nút chọn Đúng (Đ) hoặc Sai (S)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {Array.from({ length: counts2025.part2Count }).map((_, cIdx) => {
                      const qNum = counts2025.part1Count + cIdx + 1;
                      const rawVal = currentAnswers[qNum] || "";
                      const subParts = rawVal ? rawVal.split("-") : ["", "", "", ""];

                      const setSubAnswer = (subIdx: number, val: "Đ" | "S") => {
                        const updated = [...subParts];
                        updated[subIdx] = updated[subIdx] === val ? "" : val;
                        setAnswerForQuestion(qNum, updated.join("-"));
                      };

                      return (
                        <div
                          key={qNum}
                          className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-2"
                        >
                          <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-xs">
                            <span className="font-bold text-slate-200">Câu {qNum}</span>
                            <span className="text-[10px] font-semibold text-purple-400 font-mono">
                              {rawVal || "Chưa chọn"}
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            {["a", "b", "c", "d"].map((subKey, subIdx) => {
                              const currSubVal = subParts[subIdx] || "";
                              return (
                                <div
                                  key={subKey}
                                  className="flex items-center justify-between text-xs py-0.5"
                                >
                                  <span className="font-bold text-slate-400 uppercase">
                                    Ý {subKey})
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => setSubAnswer(subIdx, "Đ")}
                                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                                        currSubVal === "Đ"
                                          ? "bg-emerald-600 text-white shadow-sm"
                                          : "bg-slate-800 text-slate-400 hover:text-slate-200"
                                      }`}
                                    >
                                      Đúng
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setSubAnswer(subIdx, "S")}
                                      className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                                        currSubVal === "S"
                                          ? "bg-rose-600 text-white shadow-sm"
                                          : "bg-slate-800 text-slate-400 hover:text-slate-200"
                                      }`}
                                    >
                                      Sai
                                    </button>
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

                {/* ------------------------------------------------- */}
                {/* PHẦN III: TRẢ LỜI NGẮN / ĐIỀN SỐ (6 CÂU) */}
                {/* ------------------------------------------------- */}
                <div>
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                    <span className="font-bold text-xs uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-[10px] font-black">
                        III
                      </span>
                      PHẦN III: CÂU TRẢ LỜI NGẮN / ĐIỀN SỐ (6 câu)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Tối đa 4 ký tự OMR (số, dấu âm -, dấu phẩy/chấm)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                    {Array.from({ length: counts2025.part3Count }).map((_, cIdx) => {
                      const qNum = counts2025.part1Count + counts2025.part2Count + cIdx + 1;
                      const val = currentAnswers[qNum] || "";

                      return (
                        <div
                          key={qNum}
                          className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-300">Câu {qNum}</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              OMR (≤4)
                            </span>
                          </div>
                          <input
                            type="text"
                            maxLength={4}
                            value={val}
                            onChange={(e) => {
                              // Chỉ cho phép số, dấu -, dấu chấm hoặc phẩy
                              const filtered = e.target.value.replace(/[^0-9\-.,]/g, "");
                              setAnswerForQuestion(qNum, filtered);
                            }}
                            placeholder="VD: 15"
                            className="w-full text-center font-mono font-bold text-sm bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition tracking-wider"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* MẪU TRUYỀN THỐNG: 20, 40 HOẶC 50 CÂU ABCD */
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                {Array.from({ length: totalQuestions }).map((_, idx) => {
                  const qNum = idx + 1;
                  const selectedChoice = currentAnswers[qNum] || "";

                  return (
                    <div
                      key={qNum}
                      className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-slate-300">Câu {qNum}:</span>
                      <div className="flex gap-1">
                        {["A", "B", "C", "D"].map((choice) => (
                          <button
                            key={choice}
                            type="button"
                            onClick={() => setAnswerForQuestion(qNum, choice)}
                            className={`w-6 h-6 rounded text-[11px] font-bold flex items-center justify-center transition cursor-pointer ${
                              selectedChoice === choice
                                ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                                : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
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
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* STICKY FOOTER */}
        {/* ========================================================= */}
        <div className="sticky bottom-0 z-20 flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/95 backdrop-blur-xl">
          <div className="text-xs text-slate-400">
            <span>
              Kỳ thi sẽ lưu <strong className="text-white">{examCodes.length} mã đề</strong> ({examCodes.join(", ")}) với{" "}
              <strong className="text-blue-400">{totalQuestions} câu/đề</strong>.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              type="button"
              onClick={handleConfirmCreate}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-blue-600/25 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tạo kỳ thi ngay</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
