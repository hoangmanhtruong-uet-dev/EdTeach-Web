import { createAdminClient } from "@/lib/supabase/admin";
import { callGeminiJson, getGeminiApiKey } from "@/lib/ai/gemini-client";

export interface CompetencyLevel {
  level: "recognition" | "comprehension" | "application" | "advancedApplication";
  label: string;
  correct: number;
  total: number;
  percentage: number;
  color: string;
}

export interface QuestionDetailItem {
  questionNumber: number;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  isEmpty: boolean;
  cognitiveLevel: "recognition" | "comprehension" | "application" | "advancedApplication";
  cognitiveLabel: string;
}

export interface AIPedagogicalFeedback {
  overview: string;
  strengths: string[];
  weaknesses: string[];
  parentAdvice: string;
  suggestedAction: string;
}

export interface StudentReportData {
  id: string;
  token: string;
  sessionId: string;
  sessionName: string;
  subject: string;
  grade: string;
  studentId: string;
  studentName: string;
  studentCode?: string;
  className?: string;
  examCode?: string;
  score: number;
  rank: number;
  totalStudents: number;
  correctCount: number;
  incorrectCount: number;
  emptyCount: number;
  questionCount: number;
  accuracyPercent: number;
  competencies: Record<string, CompetencyLevel>;
  aiComment: AIPedagogicalFeedback;
  teacherNote?: string;
  teacherName?: string;
  teacherSchool?: string;
  teacherReferralCode?: string;
  isTeacherVerified?: boolean;
  details: QuestionDetailItem[];
  createdAt: string;
  updatedAt: string;
  viewCount?: number;
}

// In-memory dual store fallback for local development & offline resilience
declare global {
  // eslint-disable-next-line no-var
  var __studentReportsStore: Map<string, StudentReportData> | undefined;
}

function getStore(): Map<string, StudentReportData> {
  if (!globalThis.__studentReportsStore) {
    globalThis.__studentReportsStore = new Map<string, StudentReportData>();
  }
  return globalThis.__studentReportsStore;
}

/**
 * Generate a short, collision-resistant URL-safe token (12 alphanumeric characters)
 */
export function generateToken(seedA: string, seedB: string): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let hash = 0;
  const combined = `${seedA}_${seedB}_${Date.now()}`;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash << 5) - hash + combined.charCodeAt(i);
    hash |= 0;
  }
  let token = "";
  const absHash = Math.abs(hash);
  for (let i = 0; i < 10; i++) {
    const idx = Math.abs(Math.sin(absHash + i) * 100000) % chars.length;
    token += chars.charAt(Math.floor(idx));
  }
  // Add random 2-char suffix
  token += chars.charAt(Math.floor(Math.random() * chars.length));
  token += chars.charAt(Math.floor(Math.random() * chars.length));
  return token;
}

/**
 * Classify a question into GDPT 2018 4-level competency model:
 * - Nhận biết (Recognition): ~40%
 * - Thông hiểu (Comprehension): ~30%
 * - Vận dụng (Application): ~20%
 * - Vận dụng cao (Advanced Application): ~10%
 */
export function classifyCognitiveLevel(
  questionNumber: number,
  totalQuestions: number
): {
  level: "recognition" | "comprehension" | "application" | "advancedApplication";
  label: string;
  color: string;
} {
  const ratio = questionNumber / (totalQuestions || 1);

  if (ratio <= 0.4) {
    return { level: "recognition", label: "Nhận biết", color: "#10B981" };
  } else if (ratio <= 0.7) {
    return { level: "comprehension", label: "Thông hiểu", color: "#3B82F6" };
  } else if (ratio <= 0.9) {
    return { level: "application", label: "Vận dụng", color: "#F59E0B" };
  } else {
    return { level: "advancedApplication", label: "Vận dụng cao", color: "#8B5CF6" };
  }
}

/**
 * Compute aggregate 4-tier competency statistics
 */
export function calculateCompetencies(
  details: QuestionDetailItem[]
): Record<string, CompetencyLevel> {
  const result: Record<string, CompetencyLevel> = {
    recognition: {
      level: "recognition",
      label: "Nhận biết",
      correct: 0,
      total: 0,
      percentage: 0,
      color: "#10B981",
    },
    comprehension: {
      level: "comprehension",
      label: "Thông hiểu",
      correct: 0,
      total: 0,
      percentage: 0,
      color: "#3B82F6",
    },
    application: {
      level: "application",
      label: "Vận dụng",
      correct: 0,
      total: 0,
      percentage: 0,
      color: "#F59E0B",
    },
    advancedApplication: {
      level: "advancedApplication",
      label: "Vận dụng cao",
      correct: 0,
      total: 0,
      percentage: 0,
      color: "#8B5CF6",
    },
  };

  for (const item of details) {
    const bucket = result[item.cognitiveLevel];
    if (bucket) {
      bucket.total += 1;
      if (item.isCorrect) bucket.correct += 1;
    }
  }

  for (const key of Object.keys(result)) {
    const bucket = result[key];
    bucket.percentage = bucket.total > 0 ? Math.round((bucket.correct / bucket.total) * 100) : 0;
  }

  return result;
}

/**
 * Heuristic fallback pedagogical review engine
 */
export function generateHeuristicPedagogicalReview(params: {
  studentName: string;
  score: number;
  rank: number;
  totalStudents: number;
  correctCount: number;
  questionCount: number;
  competencies: Record<string, CompetencyLevel>;
  subject: string;
}): AIPedagogicalFeedback {
  const { studentName, score, rank, totalStudents, competencies, subject } = params;
  const recPct = competencies.recognition?.percentage ?? 0;
  const compPct = competencies.comprehension?.percentage ?? 0;
  const appPct = competencies.application?.percentage ?? 0;
  const advPct = competencies.advancedApplication?.percentage ?? 0;

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  let overview = "";
  let parentAdvice = "";
  let suggestedAction = "";

  // 1. Overview
  if (score >= 9.0) {
    overview = `Em ${studentName} đạt kết quả xuất sắc môn ${subject} (${score}/10, xếp hạng #${rank}/${totalStudents}). Khả năng tư duy logic và kỹ năng giải quyết bài toán phức tạp rất vững vàng.`;
    strengths.push("Làm chủ toàn diện kiến thức lý thuyết cơ bản và nâng cao.");
    strengths.push("Tốc độ xử lý câu hỏi tốt và giữ được độ tập trung cao suốt bài thi.");
    parentAdvice = `Gia đình nên khích lệ em tiếp tục duy trì đam mê môn ${subject}, tạo điều kiện để em thử sức với các đề thi học sinh giỏi hoặc chuyên đề nâng cao.`;
    suggestedAction = "Luyện thêm các dạng bài vận dụng cao có tính liên môn.";
  } else if (score >= 8.0) {
    overview = `Em ${studentName} hoàn thành tốt bài kiểm tra môn ${subject} (${score}/10, xếp hạng #${rank}/${totalStudents}). Nền tảng kiến thức chắc chắn và có tư duy làm bài mạch lạc.`;
    strengths.push(`Nắm rất chắc phần Nhận biết (${recPct}%) và Thông hiểu (${compPct}%).`);
    parentAdvice = `Phụ huynh khen ngợi sự nỗ lực của con và đồng hành nhắc con làm lại các câu vận dụng bị sai để tối ưu điểm số lên mức 9+.`;
    suggestedAction = "Tập trung phân tích các câu làm sai ở nhóm Vận dụng.";
  } else if (score >= 6.5) {
    overview = `Em ${studentName} đạt mức Khá môn ${subject} (${score}/10, xếp hạng #${rank}/${totalStudents}). Em có tiến bộ rõ rệt ở các dạng bài quen thuộc nhưng cần rèn thêm kỹ năng phân tích đề.`;
    strengths.push(`Hoàn thành tốt khối lượng câu hỏi cơ bản (${recPct}% phần nhận biết).`);
    parentAdvice = `Gia đình nên cùng con rà soát lại sổ tay công thức và nhắc con dành 20-30 phút mỗi ngày luyện thêm các bài tập ứng dụng.`;
    suggestedAction = "Học thuộc các sơ đồ tư duy và công thức biến đổi nhanh.";
  } else if (score >= 5.0) {
    overview = `Em ${studentName} đạt mức Trung bình môn ${subject} (${score}/10). Em đã nắm được một số kiến thức cơ bản nhưng còn dễ nhầm lẫn ở các bẫy lý thuyết.`;
    parentAdvice = `Phụ huynh động viên tinh thần con, tránh tạo áp lực và khuyến khích con chủ động hỏi thầy cô những câu chưa hiểu rõ.`;
    suggestedAction = "Làm lại toàn bộ các câu nhận biết và thông hiểu trong đề.";
  } else {
    overview = `Em ${studentName} cần dành thêm thời gian củng cố nền tảng môn ${subject} (${score}/10). Kết quả phản ánh em bị hổng kiến thức ở một số chương trọng tâm.`;
    parentAdvice = `Kính mong Quý phụ huynh phối hợp cùng Thầy/Cô để lên kế hoạch phụ đạo kiến thức nền tảng trong 2 tuần tới.`;
    suggestedAction = "Tham gia buổi phụ đạo củng cố kiến thức trọng tâm với Thầy/Cô.";
  }

  // 2. Strengths based on competencies
  if (recPct >= 80 && !strengths.some((s) => s.includes("Nhận biết"))) {
    strengths.push(`Nắm chắc lý thuyết cốt lõi (tỉ lệ đúng nhận biết đạt ${recPct}%).`);
  }
  if (compPct >= 80 && !strengths.some((s) => s.includes("Thông hiểu"))) {
    strengths.push(`Hiểu bản chất vấn đề và áp dụng công thức chính xác (${compPct}%).`);
  }
  if (appPct >= 70) {
    strengths.push(`Tư duy vận dụng giải quyết bài toán đa bước tiến bộ rõ rệt.`);
  }
  if (advPct >= 50) {
    strengths.push(`Có khả năng đột phá ở các câu hỏi phân hóa nâng cao (${advPct}%).`);
  }
  if (strengths.length === 0) {
    strengths.push("Có ý thức làm bài nghiêm túc và hoàn thành các câu hỏi đầu đề.");
  }

  // 3. Weaknesses based on competencies
  if (recPct < 80) {
    weaknesses.push(`Còn mất điểm đáng tiếc ở các câu hỏi nhận biết cơ bản (${recPct}%). Cần đọc kỹ lại đề bài và không làm vội.`);
  }
  if (compPct < 70) {
    weaknesses.push(`Chưa liên kết vững lý thuyết với các ví dụ thực hành thông hiểu (${compPct}%).`);
  }
  if (appPct < 60) {
    weaknesses.push(`Gặp khó khăn khi đề bài yêu cầu phối hợp 2 bước tính toán trở lên (${appPct}%).`);
  }
  if (advPct < 30 && score >= 7) {
    weaknesses.push(`Cần rèn luyện thêm phương pháp loại trừ và kỹ năng xử lý câu phân hóa cao.`);
  }
  if (weaknesses.length === 0) {
    weaknesses.push("Cần kiểm tra kỹ bài làm trong 5 phút cuối để tránh các lỗi tính toán nhầm.");
  }

  return {
    overview,
    strengths,
    weaknesses,
    parentAdvice,
    suggestedAction,
  };
}

/**
 * Generates pedagogical insight using Gemini AI if available, falling back to heuristic engine
 */
export async function generateAIPedagogicalInsight(params: {
  studentName: string;
  score: number;
  rank: number;
  totalStudents: number;
  correctCount: number;
  questionCount: number;
  competencies: Record<string, CompetencyLevel>;
  subject: string;
  examTitle: string;
}): Promise<AIPedagogicalFeedback> {
  const fallback = generateHeuristicPedagogicalReview(params);
  const geminiKey = getGeminiApiKey("max");

  if (!geminiKey) {
    return fallback;
  }

  try {
    const prompt = `
Bạn là Trợ lý Sư phạm AI của Hệ điều hành Giáo dục EduTest Tutor OS.
Nhiệm vụ: Viết phiếu đánh giá sư phạm chi tiết, ân cần, mang tính khích lệ để gửi cho Phụ huynh học sinh qua Zalo.

Thông tin bài thi:
- Tên học sinh: ${params.studentName}
- Tên bài kiểm tra: ${params.examTitle} (Môn: ${params.subject})
- Điểm số: ${params.score}/10
- Xếp hạng trong lớp: #${params.rank}/${params.totalStudents} học sinh
- Số câu đúng: ${params.correctCount}/${params.questionCount}
- Tỉ lệ đúng theo 4 cấp độ GDPT:
  + Nhận biết: ${params.competencies.recognition?.percentage}% (${params.competencies.recognition?.correct}/${params.competencies.recognition?.total})
  + Thông hiểu: ${params.competencies.comprehension?.percentage}% (${params.competencies.comprehension?.correct}/${params.competencies.comprehension?.total})
  + Vận dụng: ${params.competencies.application?.percentage}% (${params.competencies.application?.correct}/${params.competencies.application?.total})
  + Vận dụng cao: ${params.competencies.advancedApplication?.percentage}% (${params.competencies.advancedApplication?.correct}/${params.competencies.advancedApplication?.total})

Hãy trả về định dạng JSON DUY NHẤT với cấu trúc:
{
  "overview": "Đoạn văn 2-3 câu tổng quan kết quả, văn phong sư phạm ấm áp, chuẩn mực",
  "strengths": ["1-3 điểm mạnh cụ thể của em"],
  "weaknesses": ["1-3 điểm thiếu sót hoặc bẫy sai lầm cần khắc phục"],
  "parentAdvice": "1-2 câu hướng dẫn thực tế để phụ huynh đồng hành cùng con tại nhà",
  "suggestedAction": "Hành động cụ thể em nên làm ngay trong tuần này"
}
`;

    const result = await callGeminiJson<AIPedagogicalFeedback>(
      prompt,
      ["gemini-flash-lite-latest", "gemini-flash-latest"],
      "max"
    );

    if (result && result.overview && Array.isArray(result.strengths)) {
      return {
        overview: result.overview || fallback.overview,
        strengths: result.strengths.length > 0 ? result.strengths : fallback.strengths,
        weaknesses: result.weaknesses?.length > 0 ? result.weaknesses : fallback.weaknesses,
        parentAdvice: result.parentAdvice || fallback.parentAdvice,
        suggestedAction: result.suggestedAction || fallback.suggestedAction,
      };
    }
  } catch (err: any) {
    console.warn("Gemini pedagogical insight generation skipped, using heuristic:", err?.message);
  }

  return fallback;
}

/**
 * Save report to Supabase (if table exists) and in-memory fallback store
 */
export async function saveStudentReport(
  report: StudentReportData
): Promise<StudentReportData> {
  // 1. Always save to in-memory store
  const store = getStore();
  store.set(report.token, report);

  // 2. Also attempt saving to Supabase if table is migrated
  try {
    const supabase = createAdminClient();
    if (supabase) {
      const { error } = await (supabase.from("student_reports") as any).upsert(
        {
          id: report.id,
          token: report.token,
          session_id: report.sessionId,
          student_id: report.studentId,
          student_name: report.studentName,
          student_code: report.studentCode || null,
          score: report.score,
          rank: report.rank,
          total_students: report.totalStudents,
          correct_count: report.correctCount,
          incorrect_count: report.incorrectCount,
          empty_count: report.emptyCount || 0,
          exam_title: report.sessionName,
          subject: report.subject,
          grade: report.grade,
          metrics: report.competencies as any,
          details: report.details as any,
          ai_comment: JSON.stringify(report.aiComment),
          teacher_note: report.teacherNote || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "token" }
      );

      if (error) {
        console.warn("Supabase student_reports upsert note:", error.message);
      }
    }
  } catch (e: any) {
    console.warn("Supabase upsert caught:", e?.message);
  }

  return report;
}

/**
 * Retrieve a student report by token
 */
export async function getStudentReportByToken(
  token: string
): Promise<StudentReportData | null> {
  if (!token) return null;

  // 1. Check in-memory store first for speed
  const store = getStore();
  const cached = store.get(token);
  if (cached) {
    cached.viewCount = (cached.viewCount || 0) + 1;
    return cached;
  }

  // 2. Query Supabase
  try {
    const supabase = createAdminClient();
    if (supabase) {
      const { data, error } = await (supabase.from("student_reports") as any)
        .select("*")
        .eq("token", token)
        .maybeSingle();

      if (!error && data) {
        const row = data as any;
        let aiCommentParsed: AIPedagogicalFeedback;
        try {
          aiCommentParsed =
            typeof row.ai_comment === "string"
              ? JSON.parse(row.ai_comment)
              : row.ai_comment;
        } catch {
          aiCommentParsed = generateHeuristicPedagogicalReview({
            studentName: row.student_name,
            score: Number(row.score),
            rank: row.rank || 1,
            totalStudents: row.total_students || 1,
            correctCount: row.correct_count,
            questionCount: row.correct_count + row.incorrect_count + (row.empty_count || 0),
            competencies: row.metrics || {},
            subject: row.subject || "Toán",
          });
        }

        const report: StudentReportData = {
          id: row.id,
          token: row.token,
          sessionId: row.session_id,
          sessionName: row.exam_title,
          subject: row.subject,
          grade: row.grade,
          studentId: row.student_id,
          studentName: row.student_name,
          studentCode: row.student_code || undefined,
          score: Number(row.score),
          rank: row.rank || 1,
          totalStudents: row.total_students || 1,
          correctCount: row.correct_count,
          incorrectCount: row.incorrect_count,
          emptyCount: row.empty_count || 0,
          questionCount:
            row.correct_count + row.incorrect_count + (row.empty_count || 0),
          accuracyPercent: Math.round(
            (row.correct_count /
              Math.max(
                1,
                row.correct_count + row.incorrect_count + (row.empty_count || 0)
              )) *
              100
          ),
          competencies: row.metrics || {},
          aiComment: aiCommentParsed,
          teacherNote: row.teacher_note || undefined,
          details: row.details || [],
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          viewCount: 1,
        };

        // Cache in memory
        store.set(token, report);
        return report;
      }
    }
  } catch (err: any) {
    console.warn("Supabase fetch student_reports caught:", err?.message);
  }

  return null;
}

/**
 * Format polished Zalo share text for parents
 */
export function formatZaloShareMessage(
  report: StudentReportData,
  baseUrl: string
): string {
  const reportUrl = `${baseUrl.replace(/\/$/, "")}/report/${report.token}`;
  const className = report.className ? ` (Lớp ${report.className})` : "";
  const teacher = report.teacherName ? report.teacherName : "Thầy/Cô";

  return `Kính gửi Quý Phụ huynh em ${report.studentName}${className}:\n\n` +
    `${teacher} xin gửi phiếu báo cáo phân tích kết quả bài kiểm tra "${report.sessionName}" (Môn ${report.subject}):\n` +
    `📊 Điểm số: ${report.score}/10 | Xếp hạng: #${report.rank}/${report.totalStudents} học sinh\n` +
    `🎯 Tỉ lệ làm đúng: ${report.correctCount}/${report.questionCount} câu (${report.accuracyPercent}%)\n\n` +
    `👉 Kính mời Quý Phụ huynh xem chi tiết ma trận năng lực GDPT 4 cấp độ & nhận xét sư phạm tại:\n` +
    `${reportUrl}\n\n` +
    `${teacher} chúc em luôn giữ vững phong độ và tiến bộ mỗi ngày!`;
}
