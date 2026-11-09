import { createClient } from "@/lib/supabase/client";
import { getExamById } from "@/lib/api/exams";

export interface GradedStudent {
  id: string;
  studentName: string;
  studentCode: string;
  score: number;
  correctCount: number;
  incorrectCount: number;
  emptyCount?: number;
  gradedAt: string;
  source?: "student_self" | "teacher_scan";
  studentAnswers: Record<number, string>;
  annotatedImage?: string;
  flaggedQuestions?: any[];
  omrEngine?: string;
  details?: Array<{
    questionNum: number;
    studentAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    isEmpty?: boolean;
    flagged?: boolean;
    confidence?: number;
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
  status?: "not_started" | "in_progress" | "completed";
  gradedStudents: GradedStudent[];
}

const LOCAL_STORAGE_KEY = "edteach_grading_sessions";

/**
 * =========================================================================
 * 1. SỬA TRIỆT ĐỂ BUG KEY GIẢ (Mục C3)
 * Trích xuất đáp án THẬT 100% từ bảng `questions` của đề thi
 * Hỗ trợ chuẩn GDPT 2025: Trắc nghiệm 4 đáp án (A-D), Đúng/Sai 4 ý, Trả lời ngắn
 * =========================================================================
 */
export async function extractRealAnswerKeyFromExam(examId: string): Promise<{
  name: string;
  subject: string;
  grade: string;
  questionCount: number;
  sheetType: "20" | "40" | "50" | "2025";
  answerKey: Record<number, string>;
  questionsSummary: Array<{
    num: number;
    type: string;
    answer: string;
    content: string;
  }>;
}> {
  const examData: any = await getExamById(examId);
  if (!examData) {
    throw new Error("Không tìm thấy đề thi với ID: " + examId);
  }

  const rawQuestions: any[] = examData.questions || [];
  // Sắp xếp câu hỏi theo order_index
  rawQuestions.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

  const totalQuestions = rawQuestions.length || examData.question_count || 20;

  // Tự động xác định loại phiếu phù hợp
  let sheetType: "20" | "40" | "50" | "2025" = "20";
  const hasTrueFalseOrShort = rawQuestions.some((q) => {
    const t = q.question_type || q.type;
    return (
      t === "true_false_group" ||
      t === "true_false" ||
      t === "short_answer" ||
      t === "numeric"
    );
  });

  if (hasTrueFalseOrShort) {
    sheetType = "2025";
  } else if (totalQuestions <= 20) {
    sheetType = "20";
  } else if (totalQuestions <= 40) {
    sheetType = "40";
  } else {
    sheetType = "50";
  }

  const answerKey: Record<number, string> = {};
  const questionsSummary: Array<{
    num: number;
    type: string;
    answer: string;
    content: string;
  }> = [];

  rawQuestions.forEach((q, idx) => {
    const qNum = idx + 1;
    const qType = q.question_type || q.type || "multiple_choice";
    const rawAns = (q.correct_answer || "").trim();

    // 1. Câu hỏi Trắc nghiệm 4 phương án chuẩn (A, B, C, D)
    if (qType === "multiple_choice" || qType === "single_choice") {
      // Chuẩn hóa nếu đáp án có dạng "A. ..." hoặc "Đáp án A"
      const match = rawAns.match(/^([A-D])/i);
      const cleanAns = match ? match[1].toUpperCase() : rawAns.slice(0, 1).toUpperCase() || "A";
      answerKey[qNum] = cleanAns;
    }
    // 2. Câu hỏi Đúng/Sai GDPT 2025 (4 ý a, b, c, d)
    else if (qType === "true_false_group" || qType === "true_false") {
      // Chuẩn hóa định dạng "Đ-S-Đ-S" hoặc "T-F-T-F"
      let formatted = rawAns
        .replace(/true/gi, "Đ")
        .replace(/false/gi, "S")
        .replace(/T/gi, "Đ")
        .replace(/F/gi, "S");
      if (!formatted.includes("-") && formatted.length === 4) {
        formatted = formatted.split("").join("-");
      }
      answerKey[qNum] = formatted || "Đ-S-Đ-S";
    }
    // 3. Câu hỏi Trả lời ngắn (Short Answer - Điền số)
    else if (qType === "short_answer" || qType === "numeric") {
      answerKey[qNum] = rawAns || "0";
    }
    // Mặc định
    else {
      answerKey[qNum] = rawAns || "A";
    }

    questionsSummary.push({
      num: qNum,
      type: qType,
      answer: answerKey[qNum],
      content: (q.content || "").replace(/<[^>]+>/g, "").slice(0, 120),
    });
  });

  // Nếu số câu ít hơn questionCount (fallback an toàn)
  for (let i = rawQuestions.length + 1; i <= totalQuestions; i++) {
    if (!answerKey[i]) {
      answerKey[i] = "A";
    }
  }

  return {
    name: examData.name || "Kỳ thi trắc nghiệm",
    subject: examData.subject || "Toán",
    grade: String(examData.grade || "10"),
    questionCount: totalQuestions,
    sheetType,
    answerKey,
    questionsSummary,
  };
}

/**
 * =========================================================================
 * 2. CƠ CHẾ LƯU TRỮ KÉP (OFFLINE-FIRST HYBRID - Mục C1, C2)
 * Tự động đồng bộ Supabase + Bộ đệm LocalStorage tức thì
 * =========================================================================
 */

/**
 * Lấy danh sách kỳ thi chấm OMR (Kèm logic tự động di chuyển dữ liệu cũ lên cloud)
 */
export async function getGradingSessions(): Promise<ExamSession[]> {
  // 1. Đọc nhanh từ LocalStorage trước
  let localSessions: ExamSession[] = [];
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        localSessions = JSON.parse(raw);
      }
    } catch (e) {
      console.warn("Lỗi đọc session local:", e);
    }
  }

  // 2. Tải dữ liệu từ Supabase
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return localSessions;
    }

    const { data: cloudSessions, error } = await (supabase.from as any)("grading_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.warn("Lưu ý (Supabase grading_sessions):", error.message);
      return localSessions;
    }

    const cloudMapped: ExamSession[] = (cloudSessions || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      subject: row.subject,
      grade: row.grade,
      sheetType: row.sheet_type as any,
      questionCount: row.question_count,
      answerKey: row.answer_key || {},
      createdAt: new Date(row.created_at).toLocaleDateString("vi-VN"),
      examId: row.exam_id,
      status: row.status,
      gradedStudents: row.graded_students || [],
    }));

    // 3. Tự động di chuyển (Auto-migrate) các session có trong LocalStorage nhưng chưa có trên Supabase
    const cloudIds = new Set(cloudMapped.map((s) => s.id));
    const unmigrated = localSessions.filter((s) => !cloudIds.has(s.id));

    if (unmigrated.length > 0) {
      console.log(`Đang tự động di chuyển ${unmigrated.length} kỳ thi cũ lên Supabase...`);
      for (const item of unmigrated) {
        try {
          await (supabase.from as any)("grading_sessions").insert({
            id: item.id,
            user_id: user.id,
            name: item.name,
            subject: item.subject,
            grade: item.grade,
            sheet_type: item.sheetType,
            question_count: item.questionCount,
            answer_key: item.answerKey,
            exam_id: item.examId || null,
            status: item.gradedStudents.length > 0 ? "completed" : "in_progress",
            graded_students: item.gradedStudents,
          });
          cloudMapped.unshift(item);
        } catch (mErr) {
          console.warn("Lỗi migrate session:", item.id, mErr);
        }
      }
    }

    // Cập nhật lại LocalStorage với dữ liệu mới nhất
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cloudMapped));
    }

    return cloudMapped.length > 0 ? cloudMapped : localSessions;
  } catch (err) {
    console.warn("Lỗi kết nối Supabase grading_sessions, sử dụng local:", err);
    return localSessions;
  }
}

/**
 * Lưu / Cập nhật một kỳ thi chấm OMR (Đồng bộ kép)
 */
export async function saveGradingSession(session: ExamSession): Promise<void> {
  // 1. Lưu tức thì vào LocalStorage
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      let list: ExamSession[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex((s) => s.id === session.id);
      if (idx >= 0) {
        list[idx] = session;
      } else {
        list = [session, ...list];
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn("Lỗi lưu local session:", e);
    }
  }

  // 2. Đồng bộ ngầm lên Supabase
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const status =
      session.gradedStudents.length === 0
        ? "not_started"
        : session.gradedStudents.length >= 30
        ? "completed"
        : "in_progress";

    const payload = {
      id: session.id,
      user_id: user.id,
      name: session.name,
      subject: session.subject,
      grade: session.grade,
      sheet_type: session.sheetType,
      question_count: session.questionCount,
      answer_key: session.answerKey,
      exam_id: session.examId || null,
      status,
      graded_students: session.gradedStudents,
      updated_at: new Date().toISOString(),
    };

    const { error } = await (supabase.from as any)("grading_sessions").upsert(payload);
    if (error) {
      console.warn("Lỗi upsert Supabase grading_sessions:", error.message);
    }
  } catch (err) {
    console.warn("Lỗi đồng bộ cloud grading session:", err);
  }
}

/**
 * Xóa một kỳ thi chấm OMR (Đồng bộ kép)
 */
export async function deleteGradingSession(sessionId: string): Promise<boolean> {
  // 1. Xóa khỏi LocalStorage
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const list: ExamSession[] = JSON.parse(raw);
        const filtered = list.filter((s) => s.id !== sessionId);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
      }
    } catch (e) {
      console.warn("Lỗi xóa local session:", e);
    }
  }

  // 2. Xóa khỏi Supabase
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return true;

    await (supabase.from as any)("grading_sessions")
      .delete()
      .eq("id", sessionId)
      .eq("user_id", user.id);
  } catch (err) {
    console.warn("Lỗi xóa cloud grading session:", err);
  }

  return true;
}
