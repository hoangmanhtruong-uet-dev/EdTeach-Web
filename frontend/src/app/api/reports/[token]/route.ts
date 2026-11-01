import { NextRequest, NextResponse } from "next/server";
import { getStudentReportByToken } from "@/lib/reports/student-report-store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: "Token không hợp lệ." }, { status: 400 });
    }

    const report = await getStudentReportByToken(token);

    if (!report) {
      return NextResponse.json(
        { error: "Không tìm thấy phiếu báo cáo này hoặc đường liên kết đã hết hạn." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    console.error("API /api/reports/[token] error:", error);
    return NextResponse.json(
      { error: "Lỗi hệ thống khi tải phiếu báo cáo: " + error.message },
      { status: 500 }
    );
  }
}
