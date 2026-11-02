import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập để sử dụng Trợ lý Gia sư AI." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { classroomId, questionContext, studentQuery } = body;

    if (!classroomId || !studentQuery) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp mã lớp học và câu hỏi cần hỗ trợ." },
        { status: 400 }
      );
    }

    // 1. STRICT AIR-GAP: Chặn tuyệt đối nếu học sinh đang trong phòng thi trực tuyến
    const { data: activeAttempt } = await (supabase
      .from("exam_attempts") as any)
      .select("id, status")
      .eq("student_id", user.id)
      .eq("status", "in_progress")
      .maybeSingle();

    if (activeAttempt) {
      return NextResponse.json(
        {
          error:
            "Không thể sử dụng Trợ lý AI khi đang trong thời gian làm bài kiểm tra trực tuyến.",
        },
        { status: 403 }
      );
    }

    // 2. ATOMIC QUOTA RESERVE: Kiểm tra trần 3 lượt/ngày & giữ chỗ credits ví giáo viên
    const { data: reserveRes, error: reserveErr } = await (supabase.rpc as any)(
      "reserve_teacher_ai_credits",
      {
        p_student_id: user.id,
        p_classroom_id: classroomId,
        p_amount: 50,
      }
    );

    if (reserveErr || !reserveRes?.success) {
      const errorMsg =
        reserveRes?.message ||
        reserveErr?.message ||
        "Không thể sử dụng hạn ngạch AI của lớp.";
      const status =
        reserveRes?.error === "DAILY_QUOTA_EXCEEDED"
          ? 429
          : reserveRes?.error === "TEACHER_INSUFFICIENT_CREDITS"
          ? 402
          : 400;
      return NextResponse.json({ error: errorMsg, details: reserveRes }, { status });
    }

    const reservationId = reserveRes.reservation_id;

    // 3. GỌI GEMINI LLM (GIA SƯ SOCRATIC CHUẨN GDPT 2025)
    const geminiKey =
      process.env.GEMINI_API_KEY_PAID ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_AI_API_KEY;

    let aiReply = "";
    let isSuccessFromAi = false;

    if (geminiKey) {
      try {
        const socraticPrompt = `Bạn là Gia sư AI Socratic tận tâm, thân thiện dành cho học sinh THPT (15-18 tuổi) theo chương trình GDPT 2025.
QUY TẮC SƯ PHẠM QUAN TRỌNG:
1. KHÔNG BAO GIỜ đưa ra ngay đáp án cuối cùng (A, B, C, D) hay con số cuối cùng.
2. Dẫn dắt tư duy qua 3 bước gợi mở:
   - Bước 1: Giúp học sinh nhận diện bản chất kiến thức/khái niệm cốt lõi.
   - Bước 2: Đặt câu hỏi định hướng để học sinh tự suy luận bước tiếp theo.
   - Bước 3: Đưa ra mẹo bấm máy tính Casio fx-580 hoặc quy tắc kiểm tra nhanh nếu có.
3. Luôn khích lệ tích cực, dùng ngôn ngữ trẻ trung, trong sáng, ấm áp.

[BỐI CẢNH CÂU HỎI]:
${JSON.stringify(questionContext || "Kiến thức bài học")}

[CÂU HỎI CỦA HỌC SINH]:
${studentQuery}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [{ parts: [{ text: socraticPrompt }] }],
              generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 600,
              },
            }),
          }
        );
        clearTimeout(timeoutId);

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          aiReply =
            geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (aiReply.trim()) {
            isSuccessFromAi = true;
          }
        }
      } catch (callErr: any) {
        console.error("Gemini API call failed:", callErr);
      }
    }

    // 4. ATOMIC COMMIT HOẶC REFUND
    if (isSuccessFromAi) {
      await (supabase.rpc as any)("commit_teacher_ai_credits", {
        p_reservation_id: reservationId,
      });
      return NextResponse.json({
        success: true,
        reply: aiReply,
        remainingDaily: reserveRes.remaining_daily,
      });
    } else {
      // Refund credits nếu AI timeout hoặc lỗi
      await (supabase.rpc as any)("refund_teacher_ai_credits", {
        p_reservation_id: reservationId,
        p_reason: "AI generation failed or timed out",
      });
      return NextResponse.json(
        {
          error:
            "Hệ thống AI đang quá tải hoặc tạm thời không thể phản hồi. Credits đã được bảo lưu an toàn cho Thầy/Cô. Em vui lòng thử lại sau giây lát!",
        },
        { status: 503 }
      );
    }
  } catch (err: any) {
    console.error("[Student AI Tutor API] Error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi xử lý trợ lý AI." },
      { status: 500 }
    );
  }
}
