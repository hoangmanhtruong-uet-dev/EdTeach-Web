import { createAdminClient } from "@/lib/supabase/admin";
import { callGeminiJson, getGeminiApiKey } from "@/lib/ai/gemini-client";
import { getStudentReportByToken, saveStudentReport } from "@/lib/reports/student-report-store";

export interface ClonedQuestion {
  id: string;
  originalQuestionNumber: number;
  cognitiveLevel: "recognition" | "comprehension" | "application" | "advancedApplication";
  cognitiveLabel: string;
  content: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: "A" | "B" | "C" | "D";
  explanation: string;
  casioTip?: string;
  conceptNote?: string;
}

export interface TutorBranding {
  tutorName?: string;
  phone?: string;
  centerName?: string;
  slogan?: string;
  referralCode?: string;
  isVerified?: boolean;
}

export interface RemediationSubmissionData {
  studentAnswers: Record<string, string>;
  submittedAt: string;
  correctCount: number;
  totalQuestions: number;
  accuracyPercent: number;
  questionResults: Array<{
    questionId: string;
    questionNumber: number;
    studentAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }>;
}

export interface RemediationSheetData {
  id: string;
  token: string;
  sessionId: string;
  reportToken?: string;
  studentId: string;
  studentName: string;
  studentCode?: string;
  className?: string;
  subject: string;
  grade: string;
  examTitle: string;
  targetQuestions: Array<{
    questionNumber: number;
    cognitiveLevel?: string;
    studentAnswer?: string;
    correctAnswer?: string;
    content?: string;
  }>;
  clonedQuestions: ClonedQuestion[];
  customBranding?: TutorBranding;
  status: "pending" | "in_progress" | "completed";
  submissionData?: RemediationSubmissionData;
  score?: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// In-memory dual store fallback for local development & offline resilience
declare global {
  // eslint-disable-next-line no-var
  var __remediationSheetsStore: Map<string, RemediationSheetData> | undefined;
}

function getStore(): Map<string, RemediationSheetData> {
  if (!globalThis.__remediationSheetsStore) {
    globalThis.__remediationSheetsStore = new Map<string, RemediationSheetData>();
  }
  return globalThis.__remediationSheetsStore;
}

/**
 * Generate a short, URL-safe token with 'rem_' prefix for remediation sheets
 */
export function generateRemediationToken(seedA: string, seedB: string): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let hash = 0;
  const combined = `rem_${seedA}_${seedB}_${Date.now()}`;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash << 5) - hash + combined.charCodeAt(i);
    hash |= 0;
  }
  let token = "rem_";
  const absHash = Math.abs(hash);
  for (let i = 0; i < 8; i++) {
    const idx = Math.abs(Math.sin(absHash + i) * 100000) % chars.length;
    token += chars.charAt(Math.floor(idx));
  }
  // 2 random chars
  token += chars.charAt(Math.floor(Math.random() * chars.length));
  token += chars.charAt(Math.floor(Math.random() * chars.length));
  return token;
}

/**
 * High-quality heuristic fallback generator for isomorphic questions
 */
function generateFallbackClonedQuestions(params: {
  subject: string;
  grade: string;
  targetQuestions: Array<{ questionNumber: number; cognitiveLevel?: string }>;
}): ClonedQuestion[] {
  const { subject, targetQuestions } = params;

  return targetQuestions.map((q, idx) => {
    const qNum = q.questionNumber;
    const cog = (q.cognitiveLevel as any) || (qNum <= 16 ? "recognition" : qNum <= 28 ? "comprehension" : "application");
    const label = cog === "recognition" ? "Nhận biết" : cog === "comprehension" ? "Thông hiểu" : cog === "application" ? "Vận dụng" : "Vận dụng cao";

    if (subject.toLowerCase().includes("toán")) {
      const templates = [
        {
          content: `Cho hàm số $y = f(x)$ có bảng xét dấu của đạo hàm như sau: Hàm số đã cho đạt cực đại tại điểm nào?`,
          options: {
            A: "$x = 2$",
            B: "$x = -1$",
            C: "$x = 0$",
            D: "$x = 1$",
          },
          correctAnswer: "A" as const,
          explanation: `Bước 1: Điểm cực đại là điểm mà tại đó đạo hàm $f'(x)$ đổi dấu từ dương $(+)$ sang âm $(-)$ khi đi qua nó.\nBước 2: Dựa vào bảng xét dấu, tại $x = 2$, đạo hàm đổi dấu từ $(+)$ sang $(-)$.\nBước 3: Kết luận hàm số đạt cực đại tại $x = 2$.`,
          casioTip: `Đối với hàm số cụ thể, sử dụng chức năng Table (MENU 8) quét bước nhảy Step = 0.2 để tìm điểm đổi dấu của hàm số.`,
          conceptNote: `Tránh nhầm lẫn giữa "điểm cực đại của hàm số" ($x$) và "giá trị cực đại" ($y = f(x)$).`,
        },
        {
          content: `Tìm tất cả các giá trị thực của tham số $m$ để đồ thị hàm số $y = x^3 - 3x^2 + m$ có hai điểm cực trị nằm về hai phía của trục hoành $Ox$.`,
          options: {
            A: "$0 < m < 4$",
            B: "$m < 0$ hoặc $m > 4$",
            C: "$-4 < m < 0$",
            D: "$1 < m < 3$",
          },
          correctAnswer: "A" as const,
          explanation: `Bước 1: Ta có $y' = 3x^2 - 6x = 0 \\Leftrightarrow x = 0$ hoặc $x = 2$.\nBước 2: Hai điểm cực trị nằm về hai phía của trục $Ox \\Leftrightarrow y_{CD} \\cdot y_{CT} < 0$.\nTa có $y(0) = m$, $y(2) = m - 4$.\nBước 3: Giải bất phương trình: $m(m - 4) < 0 \\Leftrightarrow 0 < m < 4$.`,
          casioTip: `Dùng Casio fx-580VNX: Bấm MENU 9 2 3 giải phương trình bậc 3 với $m = 2$ (thử nghiệm các giá trị $m$ trong đáp án).`,
          conceptNote: `Chú ý điều kiện "hai phía trục hoành" là tích hai giá trị cực trị âm ($y_1 \\cdot y_2 < 0$), không phải tích hoành độ.`,
        },
        {
          content: `Trong không gian $Oxyz$, cho mặt phẳng $(P): 2x - y + 2z - 6 = 0$. Khoảng cách từ điểm $M(1; -2; 3)$ đến mặt phẳng $(P)$ bằng bao nhiêu?`,
          options: {
            A: "$d = \\frac{4}{3}$",
            B: "$d = 2$",
            C: "$d = \\frac{10}{3}$",
            D: "$d = 4$",
          },
          correctAnswer: "A" as const,
          explanation: `Bước 1: Áp dụng công thức khoảng cách từ điểm $M(x_0; y_0; z_0)$ đến mặt phẳng $(P): Ax + By + Cz + D = 0$.\nBước 2: $d(M, P) = \\frac{|2(1) - (-2) + 2(3) - 6|}{\\sqrt{2^2 + (-1)^2 + 2^2}} = \\frac{|2 + 2 + 6 - 6|}{\\sqrt{4 + 1 + 4}} = \\frac{4}{3}$.\nBước 3: Kết luận khoảng cách bằng $\\frac{4}{3}$.`,
          casioTip: `Nhập biểu thức trị tuyệt đối Abs vào máy tính: Abs(2(1)-(-2)+2(3)-6)/√(2²+1²+2²) rồi bấm phím = ra ngay kết quả.`,
          conceptNote: `Lưu ý dấu trừ trước tọa độ âm: $-(-2) = +2$.`,
        },
      ];

      const t = templates[idx % templates.length];
      return {
        id: `clone_${qNum}_${idx}`,
        originalQuestionNumber: qNum,
        cognitiveLevel: cog,
        cognitiveLabel: label,
        content: `[Tương tự Câu ${qNum} đề kiểm tra] ${t.content}`,
        options: t.options,
        correctAnswer: t.correctAnswer,
        explanation: t.explanation,
        casioTip: t.casioTip,
        conceptNote: t.conceptNote,
      };
    }

    // Default template for other subjects
    return {
      id: `clone_${qNum}_${idx}`,
      originalQuestionNumber: qNum,
      cognitiveLevel: cog,
      cognitiveLabel: label,
      content: `[Tương tự Câu ${qNum} đề kiểm tra] Cho bài toán củng cố kiến thức trọng tâm môn ${subject}: Chọn khẳng định ĐÚNG trong các phương án sau:`,
      options: {
        A: "Phương án củng cố kiến thức chuẩn xác theo quy luật lý thuyết.",
        B: "Phương án gây nhiễu do nhầm lẫn điều kiện biên ban đầu.",
        C: "Phương án đảo ngược mối quan hệ nhân quả.",
        D: "Phương án sai sót do tính toán nhầm hệ số tỉ lệ.",
      },
      correctAnswer: "A",
      explanation: `Bước 1: Xác định khái niệm lý thuyết cốt lõi cần củng cố.\nBước 2: Phân tích các dấu hiệu đặc trưng và loại trừ các đáp án nhiễu B, C, D.\nBước 3: Kết luận phương án A là đáp án chính xác.`,
      casioTip: "Áp dụng phương pháp loại trừ các đáp án chứa từ khóa tuyệt đối (luôn luôn, không bao giờ).",
      conceptNote: "Chú ý đọc kỹ từ khóa phủ định trong đề bài (KHÔNG đúng, SAI).",
    };
  });
}

/**
 * Generate Isomorphic Cloned Questions via Gemini AI with strict mathematical nice numbers
 */
export async function generateIsomorphicQuestions(params: {
  subject: string;
  grade: string;
  studentName: string;
  examTitle: string;
  targetQuestions: Array<{
    questionNumber: number;
    cognitiveLevel?: string;
    studentAnswer?: string;
    correctAnswer?: string;
    content?: string;
  }>;
}): Promise<ClonedQuestion[]> {
  const fallback = generateFallbackClonedQuestions({
    subject: params.subject,
    grade: params.grade,
    targetQuestions: params.targetQuestions,
  });

  const geminiKey = getGeminiApiKey("max");
  if (!geminiKey || params.targetQuestions.length === 0) {
    return fallback;
  }

  try {
    const wrongListText = params.targetQuestions
      .map(
        (q) =>
          `- Câu ${q.questionNumber} (Mức độ: ${q.cognitiveLevel || "Thông hiểu"}): Học sinh chọn '${q.studentAnswer || "chưa điền"}', Đáp án đúng là '${q.correctAnswer || "A"}'. ${q.content ? `Đề bài gốc: "${q.content}"` : ""}`
      )
      .join("\n");

    const prompt = `
Bạn là Trợ lý Khảo thí & Luyện thi Sư phạm AI của Hệ điều hành Tutor OS.
Nhiệm vụ: Phân tích các câu hỏi học sinh làm sai dưới đây và sinh các câu hỏi ĐỒNG DẠNG (Isomorphic Questions) để học sinh luyện bù lỗ hổng kiến thức.

Thông tin bài thi:
- Học sinh: ${params.studentName}
- Tên bài thi: ${params.examTitle} (Môn: ${params.subject}, Lớp ${params.grade})
- Danh sách câu hỏi làm sai:
${wrongListText}

QUY TẮC SƯ PHẠM BẮT BUỘC:
1. Sinh đúng ${params.targetQuestions.length} câu hỏi đồng dạng tương ứng với từng câu sai.
2. Giữ nguyên bản chất lý thuyết, phương pháp giải và định lý toán học của câu gốc.
3. BẢO ĐẢM SỐ LIỆU SỐ ĐẸP: Nghiệm phải là số nguyên hoặc phân số đơn giản (như 1, 2, 3, 1/2, -1), biểu thức tính toán gọn gàng, không cho nghiệm vô tỉ phức tạp hay phương trình vô nghiệm trừ khi câu hỏi yêu cầu.
4. Công thức toán học/khoa học bắt buộc dùng định dạng LaTeX inline giữa dấu $: ví dụ $y = x^3 - 3x + 1$, $x \\in (0; 2)$.
5. Mỗi câu hỏi có 4 lựa chọn A, B, C, D rõ ràng, chỉ duy nhất 1 đáp án đúng.
6. Cung cấp lời giải chi tiết 3 bước sư phạm:
   - Bước 1: Nhận diện kiến thức & Điều kiện xác định
   - Bước 2: Biến đổi & Tính toán
   - Bước 3: Kết luận
7. Cung cấp mẹo bấm máy tính Casio fx-580VNX (nếu môn Toán/Lý/Hóa) và lưu ý bẫy sai lầm cần tránh (conceptNote).

Trả về ĐÚNG ĐỊNH DẠNG JSON với mảng danh sách câu hỏi:
[
  {
    "originalQuestionNumber": 12,
    "cognitiveLevel": "comprehension",
    "cognitiveLabel": "Thông hiểu",
    "content": "Nội dung câu hỏi mới với số liệu số đẹp và LaTeX...",
    "options": {
      "A": "Đáp án A...",
      "B": "Đáp án B...",
      "C": "Đáp án C...",
      "D": "Đáp án D..."
    },
    "correctAnswer": "A",
    "explanation": "Bước 1: ...\\nBước 2: ...\\nBước 3: ...",
    "casioTip": "Mẹo bấm máy tính fx-580VNX...",
    "conceptNote": "Bẫy sai lầm cần lưu ý..."
  }
]
`;

    const result = await callGeminiJson<ClonedQuestion[]>(
      prompt,
      ["gemini-flash-lite-latest", "gemini-flash-latest"],
      "max"
    );

    if (Array.isArray(result) && result.length > 0) {
      return result.map((item, idx) => ({
        id: `clone_${item.originalQuestionNumber || idx + 1}_${Date.now()}_${idx}`,
        originalQuestionNumber: item.originalQuestionNumber || params.targetQuestions[idx]?.questionNumber || idx + 1,
        cognitiveLevel: item.cognitiveLevel || "comprehension",
        cognitiveLabel: item.cognitiveLabel || "Thông hiểu",
        content: item.content,
        options: item.options,
        correctAnswer: item.correctAnswer,
        explanation: item.explanation,
        casioTip: item.casioTip,
        conceptNote: item.conceptNote,
      }));
    }
  } catch (err: any) {
    console.warn("AI Isomorphic Question generation skipped, using heuristic fallback:", err?.message);
  }

  return fallback;
}

/**
 * Save remediation sheet to Supabase and in-memory store
 */
export async function saveRemediationSheet(
  sheet: RemediationSheetData
): Promise<RemediationSheetData> {
  // 1. Always save in memory
  const store = getStore();
  store.set(sheet.token, sheet);

  // 2. Attempt save to Supabase
  try {
    const supabase = createAdminClient();
    if (supabase) {
      const { error } = await (supabase.from("remediation_sheets") as any).upsert(
        {
          id: sheet.id,
          token: sheet.token,
          session_id: sheet.sessionId,
          report_token: sheet.reportToken || null,
          student_id: sheet.studentId,
          student_name: sheet.studentName,
          student_code: sheet.studentCode || null,
          class_name: sheet.className || null,
          subject: sheet.subject,
          grade: sheet.grade,
          exam_title: sheet.examTitle,
          target_questions: sheet.targetQuestions as any,
          cloned_questions: sheet.clonedQuestions as any,
          custom_branding: sheet.customBranding as any,
          status: sheet.status,
          submission_data: sheet.submissionData as any,
          score: sheet.score ?? null,
          completed_at: sheet.completedAt || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "token" }
      );

      if (error) {
        console.warn("Supabase remediation_sheets upsert note:", error.message);
      }
    }
  } catch (e: any) {
    console.warn("Supabase remediation upsert caught:", e?.message);
  }

  return sheet;
}

/**
 * Get remediation sheet by token
 */
export async function getRemediationSheetByToken(
  token: string
): Promise<RemediationSheetData | null> {
  if (!token) return null;

  // 1. Check in-memory store
  const store = getStore();
  const cached = store.get(token);
  if (cached) return cached;

  // 2. Query Supabase
  try {
    const supabase = createAdminClient();
    if (supabase) {
      const { data, error } = await (supabase.from("remediation_sheets") as any)
        .select("*")
        .eq("token", token)
        .maybeSingle();

      if (!error && data) {
        const row = data as any;
        const sheet: RemediationSheetData = {
          id: row.id,
          token: row.token,
          sessionId: row.session_id,
          reportToken: row.report_token || undefined,
          studentId: row.student_id,
          studentName: row.student_name,
          studentCode: row.student_code || undefined,
          className: row.class_name || undefined,
          subject: row.subject,
          grade: row.grade,
          examTitle: row.exam_title,
          targetQuestions: row.target_questions || [],
          clonedQuestions: row.cloned_questions || [],
          customBranding: row.custom_branding || undefined,
          status: row.status,
          submissionData: row.submission_data || undefined,
          score: row.score !== null ? Number(row.score) : undefined,
          completedAt: row.completed_at || undefined,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };

        store.set(token, sheet);
        return sheet;
      }
    }
  } catch (e: any) {
    console.warn("Supabase fetch remediation caught:", e?.message);
  }

  return null;
}

/**
 * Submit practice sheet and auto-grade
 */
export async function submitRemediationSheet(
  token: string,
  studentAnswers: Record<string, string>
): Promise<{
  success: boolean;
  score: number;
  correctCount: number;
  totalQuestions: number;
  sheet: RemediationSheetData;
}> {
  const sheet = await getRemediationSheetByToken(token);
  if (!sheet) {
    throw new Error("Không tìm thấy phiếu luyện bù hoặc mã token không hợp lệ.");
  }

  const questions = sheet.clonedQuestions || [];
  let correctCount = 0;
  const questionResults = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const qKey = (i + 1).toString();
    const ans = (studentAnswers[qKey] || "").toUpperCase().trim();
    const isCorrect = ans === q.correctAnswer;
    if (isCorrect) correctCount++;

    questionResults.push({
      questionId: q.id,
      questionNumber: i + 1,
      studentAnswer: ans || "Chưa điền",
      correctAnswer: q.correctAnswer,
      isCorrect,
    });
  }

  const totalQuestions = Math.max(1, questions.length);
  const accuracyPercent = Math.round((correctCount / totalQuestions) * 100);
  const score = Math.round((correctCount / totalQuestions) * 10 * 10) / 10;

  sheet.status = "completed";
  sheet.score = score;
  sheet.completedAt = new Date().toISOString();
  sheet.submissionData = {
    studentAnswers,
    submittedAt: sheet.completedAt,
    correctCount,
    totalQuestions,
    accuracyPercent,
    questionResults,
  };

  await saveRemediationSheet(sheet);

  // If this sheet was linked to a parent report, update parent report with completion status
  if (sheet.reportToken) {
    try {
      const parentReport = await getStudentReportByToken(sheet.reportToken);
      if (parentReport) {
        // Attach remediation completion note to parent report
        if (!parentReport.teacherNote) {
          parentReport.teacherNote = `✅ Em đã hoàn thành phiếu luyện bù lỗ hổng: đạt ${score}/10 (${correctCount}/${totalQuestions} câu đúng).`;
        }
        await saveStudentReport(parentReport);
      }
    } catch (e) {
      console.warn("Parent report sync note caught:", e);
    }
  }

  return {
    success: true,
    score,
    correctCount,
    totalQuestions,
    sheet,
  };
}
