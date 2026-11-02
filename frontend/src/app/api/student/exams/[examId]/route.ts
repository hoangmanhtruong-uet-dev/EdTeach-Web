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

    // 1. Check if examId is an attempt ID
    let resolvedAttemptId = examId;
    let attemptData: any = null;

    if (user) {
      const { data: directAttempt } = await (supabase
        .from("exam_attempts") as any)
        .select("id, status")
        .eq("id", examId)
        .maybeSingle();

      if (directAttempt) {
        resolvedAttemptId = directAttempt.id;
      } else {
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
          // Look up assignment for this exam
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
            const { data: newAttempt } = await (supabase
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

            if (newAttempt) {
              resolvedAttemptId = newAttempt.id;
            }
          }
        }
      }

      // Call secure RPC that masks answer keys and solutions
      const { data: rpcData, error: rpcError } = await (supabase.rpc as any)(
        "get_student_exam_questions",
        { p_attempt_id: resolvedAttemptId }
      );

      if (!rpcError && rpcData && rpcData.success) {
        attemptData = rpcData;
      }
    }

    if (attemptData) {
      return NextResponse.json({
        success: true,
        attempt: attemptData,
        title: attemptData.title || "Bài Kiểm Tra Trực Tuyến",
        questions: attemptData.questions || [],
        expiresAt: attemptData.expires_at,
        durationMinutes: attemptData.duration_minutes || 45,
        savedAnswers: attemptData.saved_answers || {},
      });
    }

    // Fallback lookup from public.exams
    const { data: exam } = await (supabase
      .from("exams") as any)
      .select("id, title, subject, grade, duration_minutes, config")
      .eq("id", examId)
      .maybeSingle();

    if (exam) {
      // Fetch questions with masked correct answers
      const { data: rawQuestions } = await (supabase
        .from("questions") as any)
        .select("id, order_index, type, content, options, difficulty")
        .eq("exam_id", exam.id)
        .order("order_index", { ascending: true });

      const cleanQuestions = (rawQuestions && rawQuestions.length > 0)
        ? rawQuestions
        : (exam.config?.questions || []).map((q: any) => ({
            id: q.id,
            order_index: q.order_index,
            type: q.type,
            content: q.content,
            options: q.options,
            difficulty: q.difficulty,
          }));

      return NextResponse.json({
        success: true,
        title: exam.title || "Bài Kiểm Tra Trực Tuyến",
        questions: cleanQuestions,
        durationMinutes: exam.duration_minutes || 45,
      });
    }

    // Demo or test fallback response
    return NextResponse.json({
      success: true,
      title: "Đề Thi Khảo Thí GDPT",
      durationMinutes: 45,
      questions: [],
    });
  } catch (err: any) {
    console.error("[Student Exam Room API] GET error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi tải thông tin phòng thi." },
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

    const { data: attempt } = await (supabase
      .from("exam_attempts") as any)
      .select("id, status, expires_at, student_id")
      .or(`id.eq.${examId},and(student_id.eq.${user.id},exam_id.eq.${examId})`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (attempt) {
      if (attempt.status !== "in_progress") {
        return NextResponse.json(
          { error: "Bài thi đã nộp hoặc đã kết thúc, không thể lưu nháp." },
          { status: 400 }
        );
      }

      await (supabase
        .from("exam_attempts") as any)
        .update({
          answers: answers || {},
          question_timings: questionTimings || {},
          client_version: clientVersion || 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", attempt.id)
        .eq("student_id", user.id);
    }

    return NextResponse.json({
      success: true,
      savedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[Student Exam Room API] PUT autosave error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi lưu nháp bài thi." },
      { status: 500 }
    );
  }
}

