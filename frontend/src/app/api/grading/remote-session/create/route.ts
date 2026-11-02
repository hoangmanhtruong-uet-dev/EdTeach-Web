import { NextRequest, NextResponse } from "next/server";
import { createRemoteSession } from "@/lib/grading/remote-cam-store";
import { createClient } from "@/lib/supabase/server";
import { getBaseUrl } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await req.json();
    const {
      sessionId,
      sessionName,
      subject = "Toán",
      grade = "10",
      questionCount = 20,
      answerKey = {},
      sheetType = "20",
    } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Thiếu sessionId của kỳ thi." },
        { status: 400 }
      );
    }

    const session = await createRemoteSession({
      sessionId,
      userId: user?.id || "guest_teacher",
      sessionName: sessionName || "Kỳ thi trắc nghiệm",
      subject,
      grade: grade.toString(),
      questionCount: parseInt(questionCount.toString()) || 20,
      answerKey,
      sheetType,
    });

    const baseUrl = getBaseUrl(req);
    const directUrl = `${baseUrl}/grading/mobile-scanner?token=${session.token}`;

    // Sinh mã QR dẫn tới link mobile scanner
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(
      directUrl
    )}`;

    return NextResponse.json({
      success: true,
      token: session.token,
      pin: session.pin,
      directUrl,
      qrUrl,
    });
  } catch (err: any) {
    console.error("Create remote session error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi tạo phiên quét không dây." },
      { status: 500 }
    );
  }
}
