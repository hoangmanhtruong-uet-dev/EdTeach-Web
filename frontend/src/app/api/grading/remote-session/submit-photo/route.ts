import { NextRequest, NextResponse } from "next/server";
import { submitPhotoToSession, getRemoteSession, reportSessionResult } from "@/lib/grading/remote-cam-store";

const AI_SERVICE_BASE =
  process.env.INTERNAL_AI_SERVICE_URL ||
  process.env.NEXT_PUBLIC_AI_SERVICE_URL ||
  "http://localhost:8000";

const INTERNAL_KEY = process.env.INTERNAL_API_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, imageBase64, studentName, studentCode } = body;

    if (!token || !imageBase64) {
      return NextResponse.json(
        { error: "Thiếu token hoặc dữ liệu ảnh chụp bài thi." },
        { status: 400 }
      );
    }

    const session = await getRemoteSession(token);
    if (!session) {
      return NextResponse.json(
        { error: "Phiên kết nối không tồn tại hoặc đã hết hạn." },
        { status: 404 }
      );
    }

    let omrResult: any = null;

    // Call OpenCV OMR Engine if answer key exists
    try {
      const sheetType = session.sheetType === "2025" ? "bgd_2025" : "classic_50";
      const omrRes = await fetch(`${AI_SERVICE_BASE}/ai/omr/grade-single`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(INTERNAL_KEY ? { "X-Internal-Key": INTERNAL_KEY } : {}),
        },
        body: JSON.stringify({
          image_base64: imageBase64,
          sheet_type: sheetType,
          answer_key: session.answerKey || {},
          return_annotated_image: true,
        }),
        signal: AbortSignal.timeout(3000),
      });

      if (omrRes.ok) {
        const json = await omrRes.json();
        omrResult = json.data;

        // Immediately report back score to mobile phone HUD
        await reportSessionResult(token, {
          studentName: omrResult.student_code && omrResult.student_code !== "??????"
            ? `SBD: ${omrResult.student_code}`
            : (studentName || "Thí sinh"),
          studentCode: omrResult.student_code || studentCode || "",
          score: omrResult.total_score,
          correctCount: omrResult.correct_count ?? (omrResult.scores_by_section ? omrResult.scores_by_section.part1_score / 0.25 : 0),
          incorrectCount: omrResult.total_questions ? (omrResult.total_questions - (omrResult.correct_count || 0)) : 0,
          timestamp: Date.now(),
        });
      }
    } catch (e) {
      console.warn("Auto OMR grading fallback:", e);
    }

    const sub = await submitPhotoToSession(token, {
      imageBase64,
      studentName: omrResult?.student_code
        ? `SBD: ${omrResult.student_code}`
        : (studentName || "Học sinh"),
      studentCode: omrResult?.student_code || studentCode || "",
      ...(omrResult ? { omrResult } : {}),
    } as any);

    if (!sub) {
      return NextResponse.json(
        { error: "Phiên kết nối không tồn tại hoặc đã hết hạn." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      submissionId: sub.id,
      timestamp: sub.timestamp,
      omrResult,
    });
  } catch (err: any) {
    console.error("Submit photo error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi gửi ảnh bài thi." },
      { status: 500 }
    );
  }
}
