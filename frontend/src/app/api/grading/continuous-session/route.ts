import { NextRequest, NextResponse } from "next/server";
import {
  createContinuousSession,
  getContinuousSession,
  endContinuousSession,
  updateSessionRoster,
} from "@/lib/grading/continuous-session-store";
import { createClient } from "@/lib/supabase/server";
import { getBaseUrl } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token") || searchParams.get("id") || searchParams.get("pin");

    if (!token) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp mã phiên (token, id hoặc pin)." },
        { status: 400 }
      );
    }

    const session = await getContinuousSession(token);
    if (!session) {
      return NextResponse.json(
        { error: "Phiên chấm không tồn tại hoặc đã hết hạn." },
        { status: 404 }
      );
    }

    const baseUrl = getBaseUrl(req);
    const scanUrl = `${baseUrl}/scan/${session.sessionToken}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(
      scanUrl
    )}`;

    return NextResponse.json({
      success: true,
      session,
      scanUrl,
      qrUrl,
    });
  } catch (err: any) {
    console.error("GET continuous-session error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi tải thông tin phiên." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await req.json();
    const {
      examId,
      name,
      subject,
      grade,
      sheetType,
      questionCount,
      answerKey,
      roster,
    } = body;

    const session = await createContinuousSession({
      examId,
      teacherId: user?.id || "teacher_default",
      name: name || "Phiên chấm liên tục",
      subject: subject || "Toán",
      grade: grade ? String(grade) : "10",
      sheetType: sheetType || "20",
      questionCount: parseInt(String(questionCount || 20), 10),
      answerKey: answerKey || {},
      roster: roster || [],
    });

    const baseUrl = getBaseUrl(req);
    const scanUrl = `${baseUrl}/scan/${session.sessionToken}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(
      scanUrl
    )}`;

    return NextResponse.json({
      success: true,
      session,
      scanUrl,
      qrUrl,
      token: session.sessionToken,
      pin: session.pin,
    });
  } catch (err: any) {
    console.error("POST continuous-session error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi tạo phiên chấm liên tục." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, sessionToken, action, roster } = body;
    const target = sessionId || sessionToken;

    if (!target) {
      return NextResponse.json(
        { error: "Thiếu sessionId hoặc sessionToken." },
        { status: 400 }
      );
    }

    if (action === "end") {
      const ended = await endContinuousSession(target);
      if (!ended) {
        return NextResponse.json(
          { error: "Không tìm thấy phiên để kết thúc." },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        message: "Phiên chấm đã được kết thúc thành công.",
      });
    }

    if (action === "update_roster") {
      if (!Array.isArray(roster)) {
        return NextResponse.json(
          { error: "Dữ liệu danh sách lớp không hợp lệ." },
          { status: 400 }
        );
      }
      const updated = await updateSessionRoster(target, roster);
      return NextResponse.json({
        success: updated,
        message: "Đã cập nhật danh sách lớp cho phiên chấm.",
      });
    }

    return NextResponse.json({ error: "Hành động không hợp lệ." }, { status: 400 });
  } catch (err: any) {
    console.error("PATCH continuous-session error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi cập nhật phiên chấm." },
      { status: 500 }
    );
  }
}
