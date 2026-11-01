import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { closeLivePoll } from "@/lib/teach/live-poll-store";

export async function POST(req: NextRequest) {
  try {
    let teacherId: string | undefined;

    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) teacherId = user.id;
    } catch {
      // fallback
    }

    const body = await req.json();
    const { roomCode } = body;

    if (!roomCode) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp mã phòng roomCode." },
        { status: 400 }
      );
    }

    const result = await closeLivePoll(roomCode, teacherId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Không thể khóa phiên bình chọn." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Đã khóa phiên bình chọn và công bố đáp án chuẩn.",
      session: result.session,
    });
  } catch (err: any) {
    console.error("[Live Poll Close API] Error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi đóng phiên bình chọn." },
      { status: 500 }
    );
  }
}
