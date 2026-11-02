import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/admin";
import { getVerificationByUserId } from "@/lib/verification/ocr-engine";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    const searchParams = req.nextUrl?.searchParams || new URL(req.url).searchParams;
    const targetUserId = searchParams.get("userId");

    // Tra cứu yêu cầu chỉ định userId hoặc phiên đăng nhập của người dùng
    const finalUserId = targetUserId || user?.id;
    if (!finalUserId) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp mã userId để tra cứu trạng thái xác thực." },
        { status: 400 }
      );
    }

    // Phân quyền: Người dùng thông thường chỉ được xem hồ sơ của chính mình
    if (user && targetUserId && targetUserId !== user.id && !(await isAdmin(supabase, user))) {
      return NextResponse.json(
        { error: "Bạn không có quyền xem thông tin hồ sơ của người khác." },
        { status: 403 }
      );
    }

    const record = await getVerificationByUserId(finalUserId);

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
