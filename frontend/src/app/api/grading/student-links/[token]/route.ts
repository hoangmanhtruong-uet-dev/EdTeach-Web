import { NextRequest, NextResponse } from "next/server";
import {
  getStudentSubmissionLink,
  registerStudentSubmissionLink,
  submitStudentExam,
  closeStudentSubmissionLink,
  StudentSubmissionLink,
} from "@/lib/grading/student-submission-store";
import { SEED_EXAMS } from "@/lib/seed/seed-exams";
import { createAdminClient } from "@/lib/supabase/admin";

interface RouteProps {
  params: Promise<{ token: string }>;
}

async function resolveSubmissionLink(token: string): Promise<StudentSubmissionLink | null> {
  const existing = await getStudentSubmissionLink(token);
  if (existing) return existing;

  // 1. Check if token is a seed exam ID
  if (token.startsWith("seed-")) {
    const seed = SEED_EXAMS.find((e) => e.id === token);
    if (seed) {
      const answerKey: Record<number, string> = {};
      (seed.questions || []).forEach((q, idx) => {
        answerKey[idx + 1] = (q.correct_answer || "A").trim().toUpperCase();
      });
      const qCount = seed.questions?.length || seed.question_count || 20;
      const newLink: StudentSubmissionLink = {
        token,
        sessionId: seed.id,
        sessionName: seed.name,
        subject: seed.subject,
        grade: seed.grade?.toString() || "12",
        className: "Toàn bộ học sinh",
        durationMinutes: 60,
        createdAt: Date.now(),
        expiresAt: Date.now() + 14 * 24 * 60 * 60 * 1000,
        questionCount: qCount,
        sheetType: qCount <= 20 ? "20" : qCount <= 50 ? "50" : "100",
        answerKey,
        isClosed: false,
        submissionsCount: 0,
      };
      return await registerStudentSubmissionLink(newLink);
    }
  }

  // 2. Check if token is an exam ID in Supabase
  try {
    const admin = createAdminClient();
    if (admin) {
      let { data: rawExam, error } = await (admin.from("exams") as any)
        .select("*, questions(*)")
        .eq("id", token)
        .is("deleted_at", null)
        .maybeSingle();

      if (error && (error.message?.includes("deleted_at") || (error as any).code === "42703")) {
        const retry = await (admin.from("exams") as any)
          .select("*, questions(*)")
          .eq("id", token)
          .maybeSingle();
        rawExam = retry.data;
        error = retry.error;
      }

      const exam = rawExam as any;
      if (!error && exam) {
        const questions = (exam.questions as any[]) || [];
        questions.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
        const answerKey: Record<number, string> = {};
        questions.forEach((q, idx) => {
          answerKey[idx + 1] = (q.correct_answer || "A").trim().toUpperCase();
        });
        const qCount = questions.length || exam.question_count || 20;
        const newLink: StudentSubmissionLink = {
          token,
          userId: exam.user_id,
          sessionId: exam.id,
          sessionName: exam.name,
          subject: exam.subject,
          grade: exam.grade?.toString() || "10",
          className: "Toàn bộ học sinh",
          durationMinutes: 60,
          createdAt: Date.now(),
          expiresAt: Date.now() + 14 * 24 * 60 * 60 * 1000,
          questionCount: qCount,
          sheetType: qCount <= 20 ? "20" : qCount <= 50 ? "50" : "100",
          answerKey,
          isClosed: false,
          submissionsCount: 0,
        };
        return await registerStudentSubmissionLink(newLink);
      }
    }
  } catch (dbErr) {
    console.warn("[resolveSubmissionLink] DB lookup error:", dbErr);
  }

  return null;
}

export async function GET(req: NextRequest, { params }: RouteProps) {
  try {
    const { token } = await params;
    const link = await resolveSubmissionLink(token);

    if (!link) {
      return NextResponse.json(
        { error: "Liên kết nộp bài không tồn tại hoặc đã bị xóa." },
        { status: 404 }
      );
    }

    const now = Date.now();
    const isExpired = link.isClosed || now > link.expiresAt;
    const remainingMs = Math.max(0, link.expiresAt - now);

    return NextResponse.json({
      success: true,
      link: {
        token: link.token,
        sessionName: link.sessionName,
        subject: link.subject,
        grade: link.grade,
        className: link.className,
        durationMinutes: link.durationMinutes,
        questionCount: link.questionCount,
        sheetType: link.sheetType,
        expiresAt: link.expiresAt,
        remainingMs,
        isExpired,
        isClosed: link.isClosed,
      },
    });
  } catch (err: any) {
    console.error("Get student link by token error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi tải liên kết nộp bài." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: RouteProps) {
  try {
    const { token } = await params;
    // Ensure submission link exists
    await resolveSubmissionLink(token);

    const body = await req.json();

    const {
      studentName,
      studentCode,
      className,
      examCode,
      studentAnswers = {},
    } = body;

    if (!studentName || !studentName.trim()) {
      return NextResponse.json(
        { error: "Vui lòng nhập họ và tên của học sinh." },
        { status: 400 }
      );
    }

    const result = await submitStudentExam({
      linkToken: token,
      studentName,
      studentCode: studentCode || "",
      className,
      examCode,
      studentAnswers,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Không thể nộp bài." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      submission: result.submission,
    });
  } catch (err: any) {
    console.error("Submit student exam error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi nộp bài." },
      { status: 500 }
    );
  }
}
