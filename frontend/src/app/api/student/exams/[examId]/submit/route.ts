import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const { examId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập để nộp bài thi." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { idempotencyKey, answers } = body;

    if (!idempotencyKey) {
      return NextResponse.json(
        { error: "Thiếu idempotency_key chống nộp trùng lặp." },
        { status: 400 }
      );
    }

    // Resolve attempt ID if examId was passed
    let resolvedAttemptId = examId;
    const { data: directAttempt } = await (supabase
      .from("exam_attempts") as any)
      .select("id")
      .eq("id", examId)
      .maybeSingle();

    if (!directAttempt) {
      const { data: studentAttempt } = await (supabase
        .from("exam_attempts") as any)
        .select("id")
        .eq("student_id", user.id)
        .eq("exam_id", examId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (studentAttempt) {
        resolvedAttemptId = studentAttempt.id;
      }
    }

    // Call atomic server-side grading RPC
    const { data, error } = await (supabase.rpc as any)("grade_exam_attempt", {
      p_attempt_id: resolvedAttemptId,
      p_idempotency_key: idempotencyKey,
      p_answers: answers || {},
    });

    if (error || !data || !data.success) {
      const errorMsg =
        data?.message ||
        data?.error ||
        error?.message ||
        "Lỗi chấm bài thi trên server.";
      const status =
        data?.error === "EXAM_TIMED_OUT"
          ? 408
          : data?.error === "UNAUTHORIZED"
          ? 403
          : 400;
      return NextResponse.json({ error: errorMsg, details: data }, { status });
    }

    return NextResponse.json({
      success: true,
      score: data.score,
      correctCount: data.correct_count,
      totalQuestions: data.total_questions,
      canViewAnswers: data.can_view_answers,
      idempotentReplay: Boolean(data.idempotent_replay),
      details: data.details,
    });
  } catch (err: any) {
    console.error("[Student Exam Submit API] Error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi xử lý nộp bài thi." },
      { status: 500 }
    );
  }
}
