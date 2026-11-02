import { NextRequest, NextResponse } from "next/server";
import { recordDeviceHeartbeat } from "@/lib/grading/continuous-session-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, sessionToken, deviceId, action } = body;
    const target = sessionId || sessionToken;

    if (!target || !deviceId) {
      return NextResponse.json(
        { error: "Thiếu sessionId hoặc deviceId." },
        { status: 400 }
      );
    }

    const result = await recordDeviceHeartbeat(
      target,
      deviceId,
      action || "ping"
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    console.error("Device heartbeat error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi cập nhật thiết bị." },
      { status: 500 }
    );
  }
}
