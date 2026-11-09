import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getAllVerifications,
  reviewVerificationRecord,
} from "@/lib/verification/ocr-engine";
import { isAdmin } from "@/lib/auth/admin";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !(await isAdmin(supabase, user))) {
      return NextResponse.json(
        { error: "Bạn không có quyền truy cập danh sách hồ sơ xác thực." },
        { status: 403 }
      );
    }

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
      { error: "Không thể tải danh sách hồ sơ xác thực. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !(await isAdmin(supabase, user))) {
      return NextResponse.json(
        { error: "Bạn không có quyền phê duyệt hồ sơ xác thực." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { recordId, action, reason } = body;

    if (!recordId || !action || !["approved", "rejected"].includes(action)) {
      return NextResponse.json(
        { error: "Thiếu recordId hoặc hành động phê duyệt không hợp lệ." },
        { status: 400 }
      );
    }

    // Force adminUserId to be the authenticated admin user's ID
    const updatedRecord = await reviewVerificationRecord({
      recordId,
      adminUserId: user.id,
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
      { error: "Không thể phê duyệt hồ sơ xác thực vào lúc này. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}
