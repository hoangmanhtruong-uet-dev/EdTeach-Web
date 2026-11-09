import { NextRequest, NextResponse } from "next/server";
import { submitPhotoToSession, getRemoteSession, reportSessionResult } from "@/lib/grading/remote-cam-store";
import {
  resolveBackendOmrSheetType,
  isValidStudentCode,
  computeOmrCounts,
} from "@/lib/grading/omr-template-resolver";

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
      const sheetType = resolveBackendOmrSheetType(
        session.sheetType,
        session.subject,
        session.questionCount
      );
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
        signal: AbortSignal.timeout(8000),
      });

      if (omrRes.ok) {
        const json = await omrRes.json();
        omrResult = json.data;
        const counts = computeOmrCounts(omrResult, session.questionCount);
        const hasValidSbd = isValidStudentCode(omrResult?.student_code);

        // Immediately report back score to mobile phone HUD
        await reportSessionResult(token, {
          studentName: hasValidSbd
            ? `SBD: ${omrResult.student_code.trim()}`
            : (studentName || "Thí sinh"),
          studentCode: hasValidSbd ? omrResult.student_code.trim() : (studentCode || ""),
          score: omrResult.total_score,
          correctCount: counts.correctCount,
          incorrectCount: counts.incorrectCount,
          timestamp: Date.now(),
        });
      }
    } catch (e) {
      console.warn("Auto OMR grading fallback:", e);
    }

    const validSbdForSub = isValidStudentCode(omrResult?.student_code);
    const sub = await submitPhotoToSession(token, {
      imageBase64,
      studentName: validSbdForSub
        ? `SBD: ${omrResult.student_code.trim()}`
        : (studentName || "Học sinh"),
      studentCode: validSbdForSub ? omrResult.student_code.trim() : (studentCode || ""),
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
