import { NextRequest, NextResponse } from "next/server";
import { reportSessionResult } from "@/lib/grading/remote-cam-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      token,
      studentName,
      studentCode,
      score,
      correctCount,
      incorrectCount,
    } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Thiếu token phiên kết nối." },
        { status: 400 }
      );
    }

    const ok = await reportSessionResult(token, {
      studentName: studentName || "Học sinh",
      studentCode: studentCode || "",
      score: typeof score === "number" ? score : 0,
      correctCount: correctCount || 0,
      incorrectCount: incorrectCount || 0,
      timestamp: Date.now(),
    });

    if (!ok) {
      return NextResponse.json(
        { error: "Phiên kết nối không tồn tại." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Report result error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi cập nhật kết quả bài thi." },
      { status: 500 }
    );
  }
}
