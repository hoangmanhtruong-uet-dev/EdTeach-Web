import { NextRequest, NextResponse, connection } from "next/server";
import {
  getRemoteSession,
  consumePendingSubmissions,
} from "@/lib/grading/remote-cam-store";

export async function GET(req: NextRequest) {
  await connection();
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Thiếu token phiên quét." },
        { status: 400 }
      );
    }

    const session = await getRemoteSession(token);
    if (!session) {
      return NextResponse.json(
        { error: "Phiên quét không tồn tại hoặc đã hết hạn." },
        { status: 404 }
      );
    }

    const submissions = await consumePendingSubmissions(token);

    return NextResponse.json({
      success: true,
      connected: session.connected,
      connectedAt: session.connectedAt,
      submissions,
      latestResult: session.latestResult,
    });
  } catch (err: any) {
    console.error("Poll remote session error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi kiểm tra phiên quét." },
      { status: 500 }
    );
  }
}
