import { NextRequest, NextResponse } from "next/server";
import { submitRemediationSheet } from "@/lib/remediation/remediation-store";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await req.json();
    const { studentAnswers } = body;

    if (!token) {
      return NextResponse.json({ error: "Token không hợp lệ." }, { status: 400 });
    }

    if (!studentAnswers || typeof studentAnswers !== "object") {
      return NextResponse.json(
        { error: "Dữ liệu câu trả lời của học sinh không hợp lệ." },
        { status: 400 }
      );
    }

    const result = await submitRemediationSheet(token, studentAnswers);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API /api/practice/[token]/submit error:", error);
    return NextResponse.json(
      { error: "Lỗi hệ thống khi nộp bài luyện bù: " + error.message },
      { status: 500 }
    );
  }
}
