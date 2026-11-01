import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { submitLiveVote } from "@/lib/teach/live-poll-store";

export async function POST(req: NextRequest) {
  try {
    let studentId = `anon_${Date.now()}`;
    let studentName = "Học Sinh";

    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        studentId = user.id;
        studentName =
          user.user_metadata?.name ||
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          studentName;
      }
    } catch {
      // fallback
    }

    const body = await req.json();
    const { roomCode, option, name } = body;

    if (!roomCode || !option) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp đầy đủ roomCode và phương án đã chọn." },
        { status: 400 }
      );
    }

    if (name) {
      studentName = name;
    }

    const result = await submitLiveVote({
      roomCode,
      studentId,
      studentName,
      option,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Không thể ghi nhận lượt bình chọn." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Đã ghi nhận lựa chọn ${option.toUpperCase()} thành công!`,
      stats: result.session?.stats,
    });
  } catch (err: any) {
    console.error("[Live Poll Vote API] Error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi gửi kết quả bình chọn." },
      { status: 500 }
    );
  }
}
