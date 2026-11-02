import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStudentDashboard } from "@/lib/student/student-store";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập để truy cập Cổng Học Sinh." },
        { status: 401 }
      );
    }

    const stats = await getStudentDashboard(user.id);

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (err: any) {
    console.error("[Student Dashboard API] Error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi lấy thông tin học sinh." },
      { status: 500 }
    );
  }
}
