import { NextRequest, NextResponse } from "next/server";
import { connectRemoteSession } from "@/lib/grading/remote-cam-store";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "ip_unknown";

    const body = await req.json();
    const { token, pin } = body;
    const identifier = token || pin;

    if (!identifier) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp mã Token hoặc PIN 4 số." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Persistent PostgreSQL rate limit check
    if (admin) {
      const { data: rateData } = await (admin.rpc as any)("check_and_record_remote_pin_attempt", {
        p_ip: clientIp,
        p_is_success: false,
      });

      if (rateData && !rateData.allowed) {
        return NextResponse.json(
          {
            error: `Bạn đã nhập sai mã kết nối quá nhiều lần. Vui lòng thử lại sau ${rateData.wait_seconds} giây.`,
          },
          { status: 429 }
        );
      }
    }

    const session = await connectRemoteSession(identifier);
    if (!session) {
      return NextResponse.json(
        { error: "Mã kết nối không hợp lệ hoặc phiên đã hết hạn." },
        { status: 404 }
      );
    }

    // Reset attempt counter on successful pairing
    if (admin) {
      await (admin.rpc as any)("check_and_record_remote_pin_attempt", {
        p_ip: clientIp,
        p_is_success: true,
      });
    }

    return NextResponse.json({
      success: true,
      session: {
        token: session.token,
        sessionName: session.sessionName,
        subject: session.subject,
        grade: session.grade,
        questionCount: session.questionCount,
        sheetType: session.sheetType,
      },
    });
  } catch (err: any) {
    console.error("Connect remote session error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi kết nối phiên quét." },
      { status: 500 }
    );
  }
}
