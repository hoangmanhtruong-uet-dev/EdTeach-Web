import { NextRequest, NextResponse } from "next/server";
import { getLivePoll } from "@/lib/teach/live-poll-store";

export async function GET(req: NextRequest) {
  try {
    const roomCode = req.nextUrl.searchParams.get("roomCode");

    if (!roomCode) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp mã phòng roomCode." },
        { status: 400 }
      );
    }

    const session = await getLivePoll(roomCode);

    if (!session) {
      return NextResponse.json(
        { error: "Không tìm thấy phòng bình chọn." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (err: any) {
    console.error("[Live Poll Status API] Error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi kiểm tra phiên bình chọn." },
      { status: 500 }
    );
  }
}
