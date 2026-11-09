import { NextRequest, NextResponse } from "next/server";
import {
  getContinuousSession,
  getSessionSubmissions,
  submitContinuousPaper,
  updateSubmission,
} from "@/lib/grading/continuous-session-store";
import {
  resolveBackendOmrSheetType,
  isValidStudentCode,
} from "@/lib/grading/omr-template-resolver";

const AI_SERVICE_BASE =
  process.env.INTERNAL_AI_SERVICE_URL ||
  process.env.NEXT_PUBLIC_AI_SERVICE_URL ||
  "http://localhost:8000";

const INTERNAL_KEY = process.env.INTERNAL_API_KEY || "";

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;
    const submissions = await getSessionSubmissions(sessionId);
    return NextResponse.json({
      success: true,
      submissions,
      count: submissions.length,
    });
  } catch (err: any) {
    console.error("GET submissions error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi tải danh sách bài nộp." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;
    const session = await getContinuousSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: "Phiên chấm không tồn tại hoặc đã hết hạn." },
        { status: 404 }
      );
    }

    if (session.status === "ended") {
      return NextResponse.json(
        { error: "Phiên chấm đã kết thúc, không thể nộp thêm bài." },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Hỗ trợ cả nộp 1 bài và nộp danh sách bài (batch upload)
    const items = Array.isArray(body.items) ? body.items : [body];
    const results = [];

    for (const item of items) {
      const clientSubmissionId =
        item.clientSubmissionId ||
        "csub_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
      const imageBase64 = item.imageBase64 || item.image;
      let detectedSbd = item.detectedSbd || item.studentCode || "";
      const detectedName = item.detectedName || item.studentName || "";
      const confidence = item.confidence ?? 1.0;
      let omrResult = item.omrResult || null;

      // Nếu có ảnh mà chưa có omrResult, gọi OMR engine
      if (imageBase64 && !omrResult) {
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
            if (omrResult && isValidStudentCode(omrResult.student_code)) {
              detectedSbd = omrResult.student_code.trim();
            }
          }
        } catch (omrErr) {
          // Thử OCR cơ bản hoặc tiếp tục
          console.warn("Python OMR grading fallback:", omrErr);
        }
      }

      // Xử lý nộp vào store
      const sub = await submitContinuousPaper({
        sessionIdOrToken: session.id,
        clientSubmissionId,
        imageBase64,
        detectedSbd,
        detectedName,
        answers: item.answers,
        omrResult,
        confidence,
      });

      results.push(sub);
    }

    // Nếu gửi 1 bài, trả về trực tiếp object; nếu gửi mảng, trả về mảng kết quả
    if (!Array.isArray(body.items)) {
      return NextResponse.json({
        success: true,
        submission: results[0],
      });
    }

    return NextResponse.json({
      success: true,
      submissions: results,
      count: results.length,
    });
  } catch (err: any) {
    console.error("POST submission error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi nộp bài thi vào phiên." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;
    const body = await req.json();
    const {
      submissionId,
      detectedSbd,
      detectedName,
      matchedStudentId,
      answers,
      status,
      reviewNotes,
    } = body;

    if (!submissionId) {
      return NextResponse.json(
        { error: "Thiếu submissionId cần cập nhật." },
        { status: 400 }
      );
    }

    const updated = await updateSubmission({
      sessionId,
      submissionId,
      detectedSbd,
      detectedName,
      matchedStudentId,
      answers,
      status,
      reviewNotes,
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Không tìm thấy bài nộp để cập nhật." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      submission: updated,
    });
  } catch (err: any) {
    console.error("PATCH submission error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi cập nhật bài nộp." },
      { status: 500 }
    );
  }
}
