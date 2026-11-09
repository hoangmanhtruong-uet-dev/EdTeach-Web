import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/server-user";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 1. Xác thực người dùng (hỗ trợ Bearer Token & Session Cookie)
    const { user, dbClient, error: authError } = await getAuthenticatedUser(req);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Vui lòng đăng nhập để thực hiện thao tác này." },
        { status: 401 }
      );
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Empty or non-JSON body is acceptable
    }

    // 2. Xử lý yêu cầu HỦY lệnh xóa tài khoản (Cancel Deletion)
    if (body?.action === "cancel") {
      const now = new Date().toISOString();
      try {
        if (dbClient) {
          await dbClient
            .from("account_deletion_requests")
            .update({
              status: "cancelled",
              updated_at: now,
            })
            .eq("user_id", user.id);

          await dbClient
            .from("profiles")
            .update({
              deletion_status: "cancelled",
              deletion_requested_at: null,
              scheduled_purge_at: null,
            })
            .eq("id", user.id);
        }
      } catch (cancelErr) {
        console.warn("[AccountDeletion] Error cancelling deletion request:", cancelErr);
      }

      return NextResponse.json({
        success: true,
        message: "Đã hủy yêu cầu xóa tài khoản thành công. Tài khoản của Thầy/Cô hoạt động bình thường.",
        pending: false,
      });
    }

    // 3. Kiểm tra email xác nhận (nếu có cung cấp)
    if (body?.email && typeof body.email === "string") {
      const inputEmail = body.email.trim().toLowerCase();
      const currentEmail = user.email?.trim().toLowerCase();
      if (inputEmail !== currentEmail) {
        return NextResponse.json(
          { success: false, error: "Email xác nhận không khớp với địa chỉ email tài khoản." },
          { status: 400 }
        );
      }
    }

    // 4. Thiết lập thời gian chờ ân hạn 14 ngày (Grace Period)
    const requestedAt = new Date().toISOString();
    const scheduledPurgeDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const scheduledPurgeAt = scheduledPurgeDate.toISOString();

    // 5. Lưu trữ yêu cầu xóa dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP
    try {
      if (dbClient) {
        // Ghi nhận vào bảng account_deletion_requests
        await dbClient.from("account_deletion_requests").upsert(
          {
            user_id: user.id,
            email: user.email,
            status: "pending_grace_period",
            requested_at: requestedAt,
            scheduled_purge_at: scheduledPurgeAt,
            updated_at: requestedAt,
          },
          { onConflict: "user_id" }
        );

        // Đánh dấu cờ trên hồ sơ người dùng (profiles)
        await dbClient
          .from("profiles")
          .update({
            deletion_status: "pending_grace_period",
            deletion_requested_at: requestedAt,
            scheduled_purge_at: scheduledPurgeAt,
          })
          .eq("id", user.id);
      }
    } catch (persistErr) {
      console.warn("[AccountDeletion] Database persistence warning:", persistErr);
    }

    return NextResponse.json({
      success: true,
      message: "Yêu cầu xóa tài khoản đã được ghi nhận. Thời gian chờ ân hạn 14 ngày trước khi xóa vĩnh viễn.",
      scheduledDate: scheduledPurgeAt,
      requestedAt,
      pending: true,
      status: "pending_grace_period",
    });
  } catch (err: any) {
    console.error("[AccountDeletion] Unhandled error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Đã xảy ra sự cố khi ghi nhận yêu cầu xóa tài khoản. Vui lòng liên hệ DPO (dpo@edteach.vn).",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { user, dbClient, error: authError } = await getAuthenticatedUser(req);
    if (authError || !user) {
      return NextResponse.json({ success: false, pending: false }, { status: 401 });
    }

    let pending = false;
    let scheduledDate: string | null = null;
    let requestedAt: string | null = null;

    try {
      if (dbClient) {
        const { data } = await dbClient
          .from("account_deletion_requests")
          .select("status, scheduled_purge_at, requested_at")
          .eq("user_id", user.id)
          .eq("status", "pending_grace_period")
          .maybeSingle();

        if (data?.status === "pending_grace_period") {
          pending = true;
          scheduledDate = data.scheduled_purge_at;
          requestedAt = data.requested_at;
        }
      }
    } catch {
      // Fallback
    }

    return NextResponse.json({
      success: true,
      pending,
      scheduledDate,
      requestedAt,
    });
  } catch {
    return NextResponse.json({ success: false, pending: false });
  }
}
