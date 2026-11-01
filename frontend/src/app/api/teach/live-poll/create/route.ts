import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createLivePoll } from "@/lib/teach/live-poll-store";

export async function POST(req: NextRequest) {
  try {
    let teacherId = "demo-teacher-id";
    let teacherName = "Thầy Cô EduTest";

    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        teacherId = user.id;
        teacherName =
          user.user_metadata?.name ||
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          teacherName;
      }
    } catch {
      // fallback
    }

    const body = await req.json();
    const {
      examId,
      questionIndex = 1,
      questionTitle,
      options = ["A", "B", "C", "D"],
      correctAnswer,
      customRoomCode,
    } = body;

    if (!questionTitle) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp nội dung hoặc tiêu đề câu hỏi." },
        { status: 400 }
      );
    }

    const session = await createLivePoll({
      teacherId,
      teacherName,
      examId,
      questionIndex,
      questionTitle,
      options,
      correctAnswer,
      customRoomCode,
    });

    return NextResponse.json({
      success: true,
      session,
      roomCode: session.roomCode,
      message: `Đã mở phòng Live Poll: ${session.roomCode}`,
    });
  } catch (err: any) {
    console.error("[Live Poll Create API] Error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi tạo phiên bình chọn trực tiếp." },
      { status: 500 }
    );
  }
}
