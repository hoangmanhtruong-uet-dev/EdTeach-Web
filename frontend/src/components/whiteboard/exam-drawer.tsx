"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  BookOpen,
  Store,
  Search,
  ChevronRight,
  ChevronDown,
  Plus,
  Lightbulb,
  Sparkles,
  Layers,
  Loader2,
  FileText,
  Filter,
  Check,
} from "lucide-react";
import { getUserExams, getExamById, Question } from "@/lib/api/exams";
import { MarketplaceItem } from "@/types/marketplace";
import { detectStemShapeIdForQuestion } from "@/lib/whiteboard/question-to-excalidraw";

interface ExamDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertQuestion: (question: any, options?: { includeExplanation?: boolean; revealMode?: boolean; subject?: string; grade?: number }) => void;
  onInsertAllQuestions?: (questions: any[], subject?: string, grade?: number) => void;
  onTriggerLiveClone?: (question: any, subject?: string, grade?: number) => Promise<void>;
  onTriggerScaffold?: (question: any, subject?: string, grade?: number) => Promise<void>;
  onTriggerAiGeometryDraw?: (question: any) => void;
  isDarkTheme?: boolean;
}

export function ExamDrawer({
  isOpen,
  onClose,
  onInsertQuestion,
  onInsertAllQuestions,
  onTriggerLiveClone,
  onTriggerScaffold,
  onTriggerAiGeometryDraw,
}: ExamDrawerProps) {
  const [activeTab, setActiveTab] = useState<"personal" | "marketplace">("personal");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedGrade, setSelectedGrade] = useState("all");

  // Danh sách đề thi
  const [personalExams, setPersonalExams] = useState<any[]>([]);
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Đề đang mở rộng xem câu hỏi
  const [expandedExamId, setExpandedExamId] = useState<string | null>(null);
  const [examQuestionsMap, setExamQuestionsMap] = useState<Record<string, any[]>>({});
  const [loadingQuestionsFor, setLoadingQuestionsFor] = useState<string | null>(null);
  const [cloningQuestionId, setCloningQuestionId] = useState<string | null>(null);
  const [scaffoldingQuestionId, setScaffoldingQuestionId] = useState<string | null>(null);

  // 1. Tải danh sách đề thi cá nhân
  useEffect(() => {
    if (!isOpen) return;
    async function loadData() {
      setIsLoading(true);
      try {
        if (activeTab === "personal") {
          const res = await getUserExams(50);
          setPersonalExams(res.exams || []);
        } else {
          const res = await fetch("/api/marketplace/items");
          const data = await res.json();
          if (data.items) {
            setMarketplaceItems(data.items);
          }
        }
      } catch (err) {
        console.error("Lỗi tải đề thi trong drawer:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [isOpen, activeTab]);

  // 2. Mở rộng xem chi tiết câu hỏi của một đề
  const handleToggleExpandExam = async (exam: any) => {
    const examId = exam.id;
    if (expandedExamId === examId) {
      setExpandedExamId(null);
      return;
    }

    setExpandedExamId(examId);

    // Nếu đã có trong map câu hỏi thì không cần tải lại
    if (examQuestionsMap[examId]) return;

    setLoadingQuestionsFor(examId);
    try {
      if (activeTab === "personal") {
        const fullExam: any = await getExamById(examId);
        if (fullExam?.questions) {
          setExamQuestionsMap((prev) => ({ ...prev, [examId]: fullExam.questions }));
        }
      } else {
        // Marketplace item
        let questions: any[] = [];
        if (exam.exam_data?.questions?.length) {
          questions = exam.exam_data.questions;
        } else if (exam.preview_data?.sample_questions?.length) {
          questions = exam.preview_data.sample_questions;
        }
        setExamQuestionsMap((prev) => ({ ...prev, [examId]: questions }));
      }
    } catch (err) {
      console.error("Lỗi lấy câu hỏi đề thi:", err);
    } finally {
      setLoadingQuestionsFor(null);
    }
  };

  // 3. Lọc danh sách đề thi
  const filteredList = (activeTab === "personal" ? personalExams : marketplaceItems).filter((item: any) => {
    const matchesSearch = searchQuery
      ? item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subject?.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesSubject = selectedSubject === "all" ? true : item.subject?.toLowerCase() === selectedSubject.toLowerCase();
    const matchesGrade = selectedGrade === "all" ? true : item.grade?.toString() === selectedGrade;
    return matchesSearch && matchesSubject && matchesGrade;
  });

  const subjects = ["Toán", "Vật lý", "Hóa học", "Sinh học", "Ngữ văn", "Tiếng Anh", "Lịch sử", "Địa lý"];

  if (!isOpen) return null;

  return (
    <aside
      aria-label="Kho đề thi & Chèn câu hỏi"
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl animate-in slide-in-from-right duration-200"
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Kho Đề Thi & Chèn Câu Hỏi
          </h2>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition"
          aria-label="Đóng ngăn kéo kho đề"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs chuyển đổi nguồn đề */}
      <div className="grid grid-cols-2 border-b border-slate-200 dark:border-slate-800 p-2 gap-2 bg-slate-50 dark:bg-slate-950/50">
        <button
          onClick={() => {
            setActiveTab("personal");
            setExpandedExamId(null);
          }}
          className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === "personal"
              ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Đề Thi Của Tôi</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("marketplace");
            setExpandedExamId(null);
          }}
          className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition ${
            activeTab === "marketplace"
              ? "bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs border border-slate-200 dark:border-slate-700"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Store className="h-4 w-4" />
          <span>Đề Mua Trên Chợ</span>
        </button>
      </div>

      {/* Thanh tìm kiếm & bộ lọc */}
      <div className="p-3 border-b border-slate-100 dark:border-slate-800 space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên đề, môn học..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500"
          />
        </div>

        {/* Lọc Môn học */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
          <button
            onClick={() => setSelectedSubject("all")}
            className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition ${
              selectedSubject === "all"
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            Tất cả môn
          </button>
          {subjects.map((subj) => (
            <button
              key={subj}
              onClick={() => setSelectedSubject(subj)}
              className={`px-2.5 py-1 rounded-lg font-medium shrink-0 transition ${
                selectedSubject === subj
                  ? "bg-blue-600 text-white font-bold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              {subj}
            </button>
          ))}
        </div>
      </div>

      {/* Danh sách đề thi */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600 mb-2" />
            <p className="text-xs">Đang tải danh sách đề thi...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
            <FileText className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-2" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Không tìm thấy đề thi phù hợp</p>
            <p className="text-[11px] text-slate-500 max-w-xs mt-1">
              Thầy/Cô có thể tạo đề mới trong Studio hoặc tải đề mẫu từ Chợ đề thi.
            </p>
          </div>
        ) : (
          filteredList.map((exam: any) => {
            const isExpanded = expandedExamId === exam.id;
            const questions = examQuestionsMap[exam.id] || [];
            const isQuestionsLoading = loadingQuestionsFor === exam.id;

            return (
              <div
                key={exam.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 overflow-hidden shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition"
              >
                {/* Header Thẻ Đề */}
                <div
                  onClick={() => handleToggleExpandExam(exam)}
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80 transition"
                >
                  <div className="flex-1 pr-2">
                    <div className="flex items-center gap-1.5 mb-1 text-[10px]">
                      <span className="rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold px-1.5 py-0.5 border border-blue-200 dark:border-blue-800">
                        {exam.subject || "Tổng hợp"} {exam.grade ? `K${exam.grade}` : ""}
                      </span>
                      {exam.price_credits !== undefined && (
                        <span className="rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold px-1.5 py-0.5 border border-amber-200 dark:border-amber-800">
                          {exam.price_credits === 0 ? "Miễn phí" : `${exam.price_credits} cr`}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">
                      {exam.title}
                    </h3>
                  </div>

                  <div className="text-slate-400">
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                </div>

                {/* Danh sách câu hỏi khi mở rộng */}
                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-2.5 space-y-2">
                    {/* Nút chèn cả đề */}
                    {questions.length > 0 && onInsertAllQuestions && (
                      <button
                        onClick={() => onInsertAllQuestions(questions, exam.subject, exam.grade)}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-xs hover:bg-blue-700 transition"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Chèn toàn bộ đề ({questions.length} câu)</span>
                      </button>
                    )}

                    {isQuestionsLoading ? (
                      <div className="flex items-center justify-center py-6 text-slate-400 gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        <span className="text-xs">Đang tải danh sách câu hỏi...</span>
                      </div>
                    ) : questions.length === 0 ? (
                      <p className="text-center text-xs text-slate-500 py-4">Đề thi chưa có câu hỏi nào.</p>
                    ) : (
                      questions.map((q: any, idx: number) => (
                        <div
                          key={q.id || idx}
                          className="rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 p-2.5 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-black text-blue-600 dark:text-blue-400 text-[11px]">
                              CÂU {q.order || idx + 1}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                              {q.difficulty || "Thông hiểu"}
                            </span>
                          </div>

                          <p className="text-slate-800 dark:text-slate-200 line-clamp-2 text-[11px] leading-relaxed">
                            {q.content}
                          </p>

                          {/* Nhóm nút hành động trên câu hỏi */}
                          <div className="grid grid-cols-3 gap-1 pt-1 border-t border-slate-100 dark:border-slate-700">
                            <button
                              onClick={() => onInsertQuestion(q, { includeExplanation: false, subject: exam.subject, grade: exam.grade })}
                              className="flex items-center justify-center gap-0.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 text-[10px] font-bold transition cursor-pointer"
                              title="Chèn nội dung đề bài và 4 đáp án"
                            >
                              <Plus className="h-3 w-3" />
                              <span>Chèn đề</span>
                            </button>
                            <button
                              onClick={() => onInsertQuestion(q, { includeExplanation: true, revealMode: false, subject: exam.subject, grade: exam.grade })}
                              className="flex items-center justify-center gap-0.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-[10px] font-bold transition cursor-pointer"
                              title="Chèn đề kèm hướng dẫn giải đầy đủ"
                            >
                              <Lightbulb className="h-3 w-3" />
                              <span>Kèm giải</span>
                            </button>
                            <button
                              onClick={() => onInsertQuestion(q, { includeExplanation: true, revealMode: true, subject: exam.subject, grade: exam.grade })}
                              className="flex items-center justify-center gap-0.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 text-[10px] font-bold transition cursor-pointer"
                              title="Chế độ Reveal: che đáp án để mở từng bước"
                            >
                              <span>🔒 Reveal</span>
                            </button>
                          </div>

                          {/* Nút AI Dựng hình theo đề nếu phát hiện dạng bài hình học/STEM */}
                          {onTriggerAiGeometryDraw && detectStemShapeIdForQuestion(q.content) && (
                            <button
                              onClick={() => onTriggerAiGeometryDraw(q)}
                              className="w-full flex items-center justify-center gap-1.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-[10px] font-bold transition cursor-pointer"
                              title="Tự động nhận diện và vẽ khối hình học tương ứng theo đề"
                            >
                              <Sparkles className="h-3 w-3 text-indigo-600" />
                              <span>📐 AI Dựng hình theo đề</span>
                            </button>
                          )}

                          {/* Nút kích hoạt AI */}
                          {(onTriggerLiveClone || onTriggerScaffold) && (
                            <div className="grid grid-cols-2 gap-1.5">
                              {onTriggerLiveClone && (
                                <button
                                  disabled={cloningQuestionId === q.id}
                                  onClick={async () => {
                                    setCloningQuestionId(q.id);
                                    await onTriggerLiveClone(q, exam.subject, exam.grade);
                                    setCloningQuestionId(null);
                                  }}
                                  className="flex items-center justify-center gap-1 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 text-[10px] font-bold transition disabled:opacity-50"
                                >
                                  {cloningQuestionId === q.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Sparkles className="h-3 w-3 text-amber-600" />
                                  )}
                                  <span>Đẻ câu tương tự</span>
                                </button>
                              )}

                              {onTriggerScaffold && (
                                <button
                                  disabled={scaffoldingQuestionId === q.id}
                                  onClick={async () => {
                                    setScaffoldingQuestionId(q.id);
                                    await onTriggerScaffold(q, exam.subject, exam.grade);
                                    setScaffoldingQuestionId(null);
                                  }}
                                  className="flex items-center justify-center gap-1 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-[10px] font-bold transition disabled:opacity-50"
                                >
                                  {scaffoldingQuestionId === q.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Layers className="h-3 w-3 text-indigo-600" />
                                  )}
                                  <span>Bẻ nhỏ 3 bước</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
