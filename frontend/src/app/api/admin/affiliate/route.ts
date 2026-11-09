import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getAllPayoutsForAdmin,
  processPayoutAdmin,
} from "@/lib/affiliate/affiliate-store";
import { isAdmin } from "@/lib/auth/admin";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Check admin authorization: must be authenticated AND admin
    const isAuthorized = user && (await isAdmin(supabase, user));

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Bạn không có quyền truy cập trang quản trị này." },
        { status: 403 }
      );
    }

    const payouts = await getAllPayoutsForAdmin();

    return NextResponse.json({
      success: true,
      payouts,
    });
  } catch (err: any) {
    console.error("[API Admin Affiliate] GET error:", err);
    return NextResponse.json(
      { error: "Không thể lấy danh sách yêu cầu rút tiền. Vui lòng thử lại sau." },
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

    // Check admin authorization: must be authenticated AND admin
    const isAuthorized = user && (await isAdmin(supabase, user));

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Bạn không có quyền thao tác quản trị." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { payoutId, action, adminNote, referenceCode } = body;

    if (!payoutId || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Thông tin thao tác không hợp lệ." },
        { status: 400 }
      );
    }

    const result = await processPayoutAdmin(
      payoutId,
      action as "approve" | "reject",
      adminNote,
      referenceCode
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Thao tác thất bại." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        action === "approve"
          ? "Đã duyệt và đánh dấu hoàn tất chi trả thành công."
          : "Đã từ chối và hoàn tiền về số dư của đối tác.",
    });
  } catch (err: any) {
    console.error("[API Admin Affiliate] POST error:", err);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi xử lý yêu cầu rút tiền. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}
