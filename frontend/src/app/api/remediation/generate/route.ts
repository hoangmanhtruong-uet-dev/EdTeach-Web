import { NextRequest, NextResponse } from "next/server";
import {
  generateRemediationToken,
  generateIsomorphicQuestions,
  saveRemediationSheet,
  RemediationSheetData,
} from "@/lib/remediation/remediation-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sessionId,
      reportToken,
      studentId,
      studentName,
      studentCode,
      className,
      subject = "Toán",
      grade = "12",
      examTitle = "Bài kiểm tra định kỳ",
      wrongQuestions = [],
      customBranding,
    } = body;

    if (!sessionId || !studentId || !studentName) {
      return NextResponse.json(
        { error: "Thiếu thông tin session hoặc học sinh để tạo phiếu luyện bù." },
        { status: 400 }
      );
    }

    if (!Array.isArray(wrongQuestions) || wrongQuestions.length === 0) {
      return NextResponse.json(
        { error: "Học sinh không có câu làm sai nào cần luyện bù." },
        { status: 400 }
      );
    }

    // 1. Generate Isomorphic Clones (Nice numbers, 3-step solution, Casio tips)
    const clonedQuestions = await generateIsomorphicQuestions({
      subject,
      grade,
      studentName,
      examTitle,
      targetQuestions: wrongQuestions,
    });

    // 2. Generate secure token
    const token = generateRemediationToken(sessionId, studentId);
    const sheetId = crypto.randomUUID();

    const sheetData: RemediationSheetData = {
      id: sheetId,
      token,
      sessionId,
      reportToken: reportToken || undefined,
      studentId,
      studentName,
      studentCode: studentCode || undefined,
      className: className || undefined,
      subject,
      grade,
      examTitle,
      targetQuestions: wrongQuestions,
      clonedQuestions,
      customBranding: customBranding || undefined,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 3. Save to store
    await saveRemediationSheet(sheetData);

    // 4. Compute absolute URL for practice
    const host = req.headers.get("host") || "localhost:3001";
    const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const baseUrl = `${proto}://${host}`;
    const practiceUrl = `${baseUrl}/practice/${token}`;

    return NextResponse.json({
      success: true,
      token,
      practiceUrl,
      totalCloned: clonedQuestions.length,
      sheet: sheetData,
    });
  } catch (error: any) {
    console.error("API /api/remediation/generate error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi tạo phiếu luyện bù AI: " + error.message },
      { status: 500 }
    );
  }
}
