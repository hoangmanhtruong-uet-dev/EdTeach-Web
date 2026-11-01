import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requestCashPayout } from "@/lib/affiliate/affiliate-store";

export async function POST(req: NextRequest) {
  try {
    let userId: string = "demo-teacher-id";

    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
      }
    } catch {
      // Continue with default/fallback
    }

    const body = await req.json();
    const amountVnd = Number(body.amountVnd || 0);
    const bankCode = (body.bankCode || "").trim();
    const bankAccount = (body.bankAccount || "").trim();
    const bankAccountName = (body.bankAccountName || "").trim();

    if (!amountVnd || amountVnd < 100000) {
      return NextResponse.json(
        { error: "Hạn mức rút tiền mặt tối thiểu là 100.000đ." },
        { status: 400 }
      );
    }

    if (!bankCode || !bankAccount || !bankAccountName) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ thông tin tài khoản ngân hàng nhận tiền." },
        { status: 400 }
      );
    }

    const result = await requestCashPayout(userId, {
      amountVnd,
      bankCode,
      bankAccount,
      bankAccountName,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Không thể tạo yêu cầu rút tiền." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      payoutId: result.payoutId,
      message: `Đã gửi yêu cầu rút ${amountVnd.toLocaleString()}đ thành công. Tiền sẽ được chuyển về tài khoản của Thầy Cô trong vòng 24h!`,
    });
  } catch (err: any) {
    console.error("[API Affiliate Payout] POST error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi xử lý yêu cầu rút tiền." },
      { status: 500 }
    );
  }
}
