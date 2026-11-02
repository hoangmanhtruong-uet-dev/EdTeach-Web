import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { convertAffiliateToCredits } from "@/lib/affiliate/affiliate-store";

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

    if (!amountVnd || amountVnd < 10000) {
      return NextResponse.json(
        { error: "Số tiền quy đổi tối thiểu là 10.000đ." },
        { status: 400 }
      );
    }

    const result = await convertAffiliateToCredits(userId, amountVnd);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Quy đổi thất bại." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      creditsAdded: result.creditsAdded,
      newBalanceVnd: result.newBalanceVnd,
      message: `Đã quy đổi thành công ${amountVnd.toLocaleString()}đ sang +${result.creditsAdded.toLocaleString()} Credits!`,
    });
  } catch (err: any) {
    console.error("[API Affiliate Convert] POST error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi quy đổi credits." },
      { status: 500 }
    );
  }
}
