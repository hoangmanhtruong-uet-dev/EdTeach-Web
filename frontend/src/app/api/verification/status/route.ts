import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/admin";
import { getVerificationByUserId } from "@/lib/verification/ocr-engine";

function maskSensitiveId(value?: string | null): string | undefined {
  if (!value) return undefined;
  const clean = value.trim();
  if (clean.length <= 6) return "******";
  return `${clean.slice(0, 4)}${"*".repeat(Math.max(4, clean.length - 6))}${clean.slice(-2)}`;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // SEC-AUTH-01: Bắt buộc xác thực người dùng trước khi truy cập thông tin định danh
    if (!user) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập để tra cứu trạng thái xác thực." },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl?.searchParams || new URL(req.url).searchParams;
    const targetUserId = searchParams.get("userId");

    // Tra cứu yêu cầu chỉ định userId hoặc phiên đăng nhập của chính người dùng
    const finalUserId = targetUserId || user.id;

    const isUserAdmin = await isAdmin(supabase, user);

    // Phân quyền: Người dùng thông thường chỉ được xem hồ sơ của chính mình
    if (finalUserId !== user.id && !isUserAdmin) {
      return NextResponse.json(
        { error: "Bạn không có quyền xem thông tin hồ sơ của người khác." },
        { status: 403 }
      );
    }

    const record = await getVerificationByUserId(finalUserId);

    if (!record) {
      return NextResponse.json({
        success: true,
        hasRecord: false,
        status: "unverified",
        record: null,
      });
    }

    // Bảo vệ PII: Che mặt nạ CCCD và ẩn ảnh gốc đối với người dùng không phải Quản trị viên
    const sanitizedRecord = isUserAdmin
      ? record
      : {
          ...record,
          cccdNumber: maskSensitiveId(record.cccdNumber),
          ocrExtractedCode: maskSensitiveId(record.ocrExtractedCode),
          imageUrl: record.imageUrl ? "[PROTECTED]" : undefined,
          cccdImageUrl: record.cccdImageUrl ? "[PROTECTED]" : undefined,
        };

    return NextResponse.json({
      success: true,
      hasRecord: true,
      status: sanitizedRecord.status || "unverified",
      record: sanitizedRecord,
    });
  } catch (error: any) {
    console.error("API /api/verification/status error:", error);
    return NextResponse.json(
      { error: "Lỗi hệ thống khi kiểm tra trạng thái xác thực: " + error.message },
      { status: 500 }
    );
  }
}
