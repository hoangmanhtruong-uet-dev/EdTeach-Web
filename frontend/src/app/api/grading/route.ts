import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Rate limiter chống spam: Tối đa 30 request/phút mỗi IP
const gradingRateLimits = new Map<string, { count: number; resetTime: number }>();

function checkGradingRateLimit(identifier: string): boolean {
  const now = Date.now();
  const windowMs = process.env.NODE_ENV !== "production" ? 5000 : 60 * 1000;
  const record = gradingRateLimits.get(identifier);

  if (!record || now > record.resetTime) {
    gradingRateLimits.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= 30) {
    return false;
  }

  record.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "anonymous";

    const body = await req.json();
    const { mode, question, rubric, studentAnswer, answerKey, studentAnswers } = body;

    // Feature Deprecation: Chấm bài tự luận bằng AI đã được loại bỏ theo đặc tả V2
    if (mode === "essay") {
      return NextResponse.json(
        {
          error: "FEATURE_DEPRECATED",
          message: "Hệ thống đã loại bỏ Chấm tự luận bằng AI để tập trung tối đa vào Chấm trắc nghiệm OMR siêu tốc và chuẩn xác 100%.",
        },
        { status: 410 }
      );
    }

    // Validate mode
    if (!mode || mode !== "mcq") {
      return NextResponse.json({ error: "Chế độ chấm không hợp lệ." }, { status: 400 });
    }

    // Input validation for MCQ
    if (!answerKey || !studentAnswers) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp đáp án chuẩn và bài làm của học sinh." },
        { status: 400 }
      );
    }

    const questionsCount = Object.keys(answerKey).length;
    if (questionsCount === 0) {
      return NextResponse.json({ error: "Đáp án chuẩn không có câu hỏi nào." }, { status: 400 });
    }

    // Rate limiting check
    const rateLimitKey = user ? `user:${user.id}` : `ip:${clientIp}`;
    if (!checkGradingRateLimit(rateLimitKey)) {
      return NextResponse.json(
        { error: "Bạn gửi yêu cầu quá nhanh. Vui lòng thử lại sau 1 phút." },
        { status: 429 }
      );
    }

    // Chấm điểm trắc nghiệm thủ công/chuẩn hóa
    let correctCount = 0;
    const details: Record<string, { student: string; correct: string; isCorrect: boolean }> = {};

    for (const [qId, correctAns] of Object.entries(answerKey)) {
      const studentAns = studentAnswers[qId] || "";
      const isCorrect = String(studentAns).trim().toUpperCase() === String(correctAns).trim().toUpperCase();
      if (isCorrect) correctCount++;
      details[qId] = {
        student: studentAns,
        correct: String(correctAns),
        isCorrect,
      };
    }

    const score = Number(((correctCount / questionsCount) * 10).toFixed(2));

    return NextResponse.json({
      score,
      maxScore: 10,
      correctCount,
      totalQuestions: questionsCount,
      percentage: Math.round((correctCount / questionsCount) * 100),
      details,
    });
  } catch (error: any) {
    console.error("Grading error:", error);
    return NextResponse.json(
      { error: "Có lỗi xảy ra khi chấm bài. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}
