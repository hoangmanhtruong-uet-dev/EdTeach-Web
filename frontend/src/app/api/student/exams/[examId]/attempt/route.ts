import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
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
        { error: "Vui lòng đăng nhập để vào phòng thi." },
        { status: 401 }
      );
    }

    // 1. Try resolving attempt directly by attemptId or by student_id + exam_id
    let resolvedAttemptId = examId;

    // Check if examId is already an attempt ID
    const { data: directAttempt } = await (supabase
      .from("exam_attempts") as any)
      .select("id, status")
      .eq("id", examId)
      .maybeSingle();

    if (!directAttempt) {
      // Find active attempt for this student and exam
      const { data: studentAttempt } = await (supabase
        .from("exam_attempts") as any)
        .select("id, status")
        .eq("student_id", user.id)
        .eq("exam_id", examId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (studentAttempt) {
        resolvedAttemptId = studentAttempt.id;
      } else {
        // Find assignment for this exam to create a fresh attempt
        const { data: assignment } = await (supabase
          .from("assignments") as any)
          .select("id, exam_id, duration_minutes, title")
          .eq("exam_id", examId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (assignment) {
          const duration = assignment.duration_minutes || 45;
          const expiresAt = new Date(Date.now() + duration * 60 * 1000).toISOString();
          const { data: newAttempt, error: insertErr } = await (supabase
            .from("exam_attempts") as any)
            .insert({
              assignment_id: assignment.id,
              exam_id: assignment.exam_id,
              student_id: user.id,
              status: "in_progress",
              expires_at: expiresAt,
            })
            .select("id")
            .single();

          if (!insertErr && newAttempt) {
            resolvedAttemptId = newAttempt.id;
          }
        }
      }
    }

    // Call secure RPC that masks answer keys and solutions
    const { data, error } = await (supabase.rpc as any)(
      "get_student_exam_questions",
      { p_attempt_id: resolvedAttemptId }
    );

    if (error || !data || !data.success) {
      // Return structured error or fallback for demo exams
      return NextResponse.json(
        { error: data?.error || error?.message || "Không tìm thấy phòng thi." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      attempt: data,
    });
  } catch (err: any) {
    console.error("[Student Exam Attempt API] GET error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi tải dữ liệu phòng thi." },
      { status: 500 }
    );
  }
}

export async function PUT(
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
        { error: "Vui lòng đăng nhập." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { answers, questionTimings, clientVersion } = body;

    // Check expiration and status before updating draft
    const { data: attempt, error: fetchErr } = await (supabase
      .from("exam_attempts") as any)
      .select("id, status, expires_at, student_id")
      .or(`id.eq.${examId},and(student_id.eq.${user.id},exam_id.eq.${examId})`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchErr || !attempt) {
      return NextResponse.json(
        { error: "Không tìm thấy lượt làm bài." },
        { status: 404 }
      );
    }

    if (attempt.status !== "in_progress") {
      return NextResponse.json(
        { error: "Bài thi đã nộp hoặc đã kết thúc, không thể lưu nháp." },
        { status: 400 }
      );
    }

    if (new Date() > new Date(attempt.expires_at)) {
      return NextResponse.json(
        { error: "Thời gian làm bài đã kết thúc." },
        { status: 400 }
      );
    }

    const { error: updateErr } = await (supabase
      .from("exam_attempts") as any)
      .update({
        answers: answers || {},
        question_timings: questionTimings || {},
        client_version: clientVersion || 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", attempt.id)
      .eq("student_id", user.id);

    if (updateErr) {
      return NextResponse.json(
        { error: "Lỗi lưu nháp bài thi: " + updateErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      savedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[Student Exam Attempt API] PUT autosave error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi lưu nháp bài thi." },
      { status: 500 }
    );
  }
}
