import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAffiliateStats } from "@/lib/affiliate/affiliate-store";
import { APP_URL } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    let userId: string = "demo-teacher-id";
    let origin = APP_URL;
    try {
      origin = req.nextUrl?.origin || APP_URL;
    } catch {
      // fallback
    }

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

    const stats = await getAffiliateStats(userId, origin);

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (err: any) {
    console.error("[API Affiliate] GET error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi lấy dữ liệu đối tác." },
      { status: 500 }
    );
  }
}
