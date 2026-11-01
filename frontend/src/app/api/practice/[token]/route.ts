import { NextRequest, NextResponse } from "next/server";
import { getRemediationSheetByToken } from "@/lib/remediation/remediation-store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: "Token không hợp lệ." }, { status: 400 });
    }

    const sheet = await getRemediationSheetByToken(token);

    if (!sheet) {
      return NextResponse.json(
        { error: "Không tìm thấy phiếu luyện bù này hoặc đường link đã hết hạn." },
        { status: 404 }
      );
    }

    // Security check: if student hasn't completed the sheet, redact correct answers
    if (sheet.status !== "completed") {
      const sanitizedQuestions = sheet.clonedQuestions.map((q) => ({
        id: q.id,
        originalQuestionNumber: q.originalQuestionNumber,
        cognitiveLevel: q.cognitiveLevel,
        cognitiveLabel: q.cognitiveLabel,
        content: q.content,
        options: q.options,
        // Omit correctAnswer, explanation, casioTip until submission
      }));

      return NextResponse.json({
        success: true,
        sheet: {
          ...sheet,
          clonedQuestions: sanitizedQuestions,
        },
      });
    }

    // If completed, return full sheet with explanations
    return NextResponse.json({
      success: true,
      sheet,
    });
  } catch (error: any) {
    console.error("API /api/practice/[token] error:", error);
    return NextResponse.json(
      { error: "Lỗi hệ thống khi tải phiếu luyện bù: " + error.message },
      { status: 500 }
    );
  }
}
