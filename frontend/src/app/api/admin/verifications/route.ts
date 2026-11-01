import { NextRequest, NextResponse } from "next/server";
import {
  getAllVerifications,
  reviewVerificationRecord,
} from "@/lib/verification/ocr-engine";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status") || "all";

    const list = await getAllVerifications(statusFilter);

    return NextResponse.json({
      success: true,
      total: list.length,
      verifications: list,
    });
  } catch (error: any) {
    console.error("API /api/admin/verifications GET error:", error);
    return NextResponse.json(
      { error: "Lỗi hệ thống khi tải danh sách hồ sơ: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { recordId, adminUserId = "admin_super", action, reason } = body;

    if (!recordId || !action || !["approved", "rejected"].includes(action)) {
      return NextResponse.json(
        { error: "Thiếu recordId hoặc hành động phê duyệt không hợp lệ." },
        { status: 400 }
      );
    }

    const updatedRecord = await reviewVerificationRecord({
      recordId,
      adminUserId,
      action,
      rejectionReason: reason,
    });

    return NextResponse.json({
      success: true,
      message:
        action === "approved"
          ? "Đã phê duyệt hồ sơ thành công! Tích Xanh và +10.000 credits đã được kích hoạt cho giáo viên."
          : "Đã từ chối hồ sơ xác thực.",
      record: updatedRecord,
    });
  } catch (error: any) {
    console.error("API /api/admin/verifications POST error:", error);
    return NextResponse.json(
      { error: "Lỗi hệ thống khi duyệt hồ sơ: " + error.message },
      { status: 500 }
    );
  }
}
