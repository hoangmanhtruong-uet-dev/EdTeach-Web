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

export async function POST(req: NextRequest) {
  try {
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
      sessionName: sessionName || "Bài kiểm tra chất lượng",
      subject,
      grade,
      studentId: student.id,
      studentName: student.studentName || "Học sinh",
      studentCode: student.studentCode,
      className: student.className,
      examCode: student.examCode,
      score,
      rank: Math.max(1, Number(rank) || 1),
      totalStudents: Math.max(1, Number(totalStudents) || 1),
      correctCount,
      incorrectCount,
      emptyCount,
      questionCount: totalQ,
      accuracyPercent,
      competencies,
      aiComment,
      teacherNote: teacherNote || undefined,
      teacherName,
      isTeacherVerified: Boolean(isTeacherVerified),
      details,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewCount: 0,
    };

    // 6. Save report to store
    await saveStudentReport(reportData);

    // 7. Compute absolute report URL for sharing
    const baseUrl = getBaseUrl(req);
    const reportUrl = `${baseUrl}/report/${token}`;

    const zaloShareText = formatZaloShareMessage(reportData, baseUrl);

    return NextResponse.json({
      success: true,
      token,
      reportUrl,
      zaloShareText,
      report: reportData,
    });
  } catch (error: any) {
    console.error("API /api/reports/generate error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi tạo báo cáo phụ huynh: " + error.message },
      { status: 500 }
    );
  }
}
