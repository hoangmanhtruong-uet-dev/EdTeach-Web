import { NextRequest, NextResponse } from "next/server";
import {
  StudentReportData,
  QuestionDetailItem,
  classifyCognitiveLevel,
  calculateCompetencies,
  generateAIPedagogicalInsight,
  generateToken,
  saveStudentReport,
  formatZaloShareMessage,
} from "@/lib/reports/student-report-store";
import { getBaseUrl } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import { isProUser } from "@/lib/payment/plans";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Rào cản xác thực: Bắt buộc Giáo viên đăng nhập để xuất báo cáo AI
    if (!user) {
      return NextResponse.json(
        {
          error: "UNAUTHORIZED",
          message: "Vui lòng đăng nhập tài khoản Giáo viên để khởi tạo báo cáo và nhận xét sư phạm AI.",
        },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from("users")
      .select("tier, subscription_expires_at, email")
      .eq("id", user.id)
      .maybeSingle();

    const userProfile = profile || { email: user.email, tier: "free" };

    // Gói Free: Trần 10 báo cáo AI/ngày để bảo vệ tài nguyên máy chủ
    if (!isProUser(userProfile)) {
      const today = new Date().toISOString().slice(0, 10);
      const quotaKey = `free_report_gen:${user.id}:${today}`;
      const { data: quotaRes } = await (supabase.rpc as any)(
        "check_and_increment_quota",
        {
          p_key: quotaKey,
          p_user_id: user.id,
          p_action: "report_generation",
          p_limit: 10,
        }
      );

      if (quotaRes && quotaRes.allowed === false) {
        return NextResponse.json(
          {
            error: "DAILY_LIMIT_EXCEEDED",
            message: "Gói Miễn phí đã đạt giới hạn 10 báo cáo AI/ngày. Thầy/Cô vui lòng nâng cấp Gói PRO để xuất báo cáo không giới hạn cho cả lớp!",
          },
          { status: 429 }
        );
      }
    }

    const body = await req.json();
    const {
      sessionId,
      sessionName,
      subject = "Toán",
      grade = "10",
      questionCount = 40,
      answerKey = {},
      student,
      totalStudents = 1,
      rank = 1,
      teacherName = "Thầy/Cô EduTest",
      isTeacherVerified = false,
      teacherNote = "",
    } = body;

    if (!sessionId || !student || !student.id) {
      return NextResponse.json(
        { error: "Thiếu thông tin session hoặc học sinh để tạo báo cáo." },
        { status: 400 }
      );
    }

    // 1. Build question-by-question details array
    const details: QuestionDetailItem[] = [];
    const totalQ = Math.max(1, questionCount);

    for (let q = 1; q <= totalQ; q++) {
      const studentAns = (
        (student.studentAnswers && student.studentAnswers[q]) ||
        ""
      ).toUpperCase().trim();
      const correctAns = ((answerKey && answerKey[q]) || "A").toUpperCase().trim();
      const isEmpty = !studentAns || studentAns === "-" || studentAns === "";
      const isCorrect = !isEmpty && studentAns === correctAns;
      const cog = classifyCognitiveLevel(q, totalQ);

      details.push({
        questionNumber: q,
        studentAnswer: studentAns || "Chưa điền",
        correctAnswer: correctAns,
        isCorrect,
        isEmpty,
        cognitiveLevel: cog.level,
        cognitiveLabel: cog.label,
      });
    }

    // 2. Calculate GDPT 4-tier competency breakdown
    const competencies = calculateCompetencies(details);

    // 3. Compute accuracy percentage
    const correctCount = student.correctCount ?? details.filter((d) => d.isCorrect).length;
    const incorrectCount = student.incorrectCount ?? details.filter((d) => !d.isCorrect && !d.isEmpty).length;
    const emptyCount = student.emptyCount ?? details.filter((d) => d.isEmpty).length;
    const score = Number(student.score) || 0;
    const accuracyPercent = Math.round((correctCount / totalQ) * 100);

    // 4. Generate AI pedagogical comments
    const aiComment = await generateAIPedagogicalInsight({
      studentName: student.studentName || "Học sinh",
      score,
      rank: Math.max(1, Number(rank) || 1),
      totalStudents: Math.max(1, Number(totalStudents) || 1),
      correctCount,
      questionCount: totalQ,
      competencies,
      subject,
      examTitle: sessionName || "Bài kiểm tra định kỳ",
    });

    // 5. Generate secure token & report ID
    const token = generateToken(sessionId, student.id);
    const reportId = crypto.randomUUID();

    const reportData: StudentReportData = {
      id: reportId,
      token,
      sessionId,
      sessionName: sessionName || "Bài kiểm tra định kỳ",
      subject,
      grade,
      questionCount: totalQ,
      studentId: student.id,
      studentName: student.studentName || "Học sinh",
      studentCode: student.studentCode || undefined,
      className: student.className || undefined,
      score,
      rank: Number(rank) || 1,
      totalStudents: Number(totalStudents) || 1,
      correctCount,
      incorrectCount,
      emptyCount,
      accuracyPercent,
      competencies,
      details,
      aiComment,
      teacherNote: teacherNote || undefined,
      teacherName,
      isTeacherVerified,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 6. Save report into storage
    await saveStudentReport(reportData);

    // 7. Generate URLs
    const baseUrl = getBaseUrl(req);
    const reportUrl = `${baseUrl}/report/${token}`;
    const zaloMessage = formatZaloShareMessage(reportData, reportUrl);

    return NextResponse.json({
      success: true,
      token,
      reportUrl,
      report: reportData,
      zaloMessage,
    });
  } catch (error: any) {
    console.error("API /api/reports/generate error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi tạo báo cáo học sinh: " + error.message },
      { status: 500 }
    );
  }
}
