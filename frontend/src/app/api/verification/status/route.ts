import { NextRequest, NextResponse } from "next/server";
import { getVerificationByUserId } from "@/lib/verification/ocr-engine";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl?.searchParams || new URL(req.url).searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Thiếu userId." }, { status: 400 });
    }

    const record = await getVerificationByUserId(userId);

    return NextResponse.json({
      success: true,
      hasRecord: Boolean(record),
      status: record?.status || "unverified",
      record,
    });
  } catch (error: any) {
    console.error("API /api/verification/status error:", error);
    return NextResponse.json(
      { error: "Lỗi hệ thống khi kiểm tra trạng thái xác thực: " + error.message },
      { status: 500 }
    );
  }
}
