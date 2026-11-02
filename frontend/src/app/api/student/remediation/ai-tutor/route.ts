import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  // 1. STRICT AIR-GAP: Chặn tuyệt đối nếu học sinh đang trong phòng thi trực tuyến
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
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
  }

  // Socratic AI Pedagogical Guard Reference:
  // KHÔNG BAO GIỜ đưa ra ngay đáp án cuối cùng (A, B, C, D) hay con số cuối cùng.
  // Dẫn dắt tư duy qua 3 bước gợi mở:

  // Feature Deprecated: Gói MAX chuyển sang Scaffold và Multi-method tĩnh theo chuẩn V2
  return NextResponse.json(
    {
      error: "FEATURE_DEPRECATED",
      message:
        "Tính năng Chatbot Gia sư khắc phục lỗ hổng đã được loại bỏ. Học sinh vui lòng xem trực tiếp Gợi ý giải từng bước (Scaffold) hoặc Đa phương pháp để ôn tập.",
    },
    { status: 410 }
  );
}
