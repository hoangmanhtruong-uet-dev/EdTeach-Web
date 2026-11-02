import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { claimReportForStudent } from "@/lib/student/student-store";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập để liên kết báo cáo." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const token = (body.token || "").trim();

    if (!token) {
      return NextResponse.json(
        { error: "Thiếu mã token báo cáo để liên kết." },
        { status: 400 }
      );
    }

    const result = await claimReportForStudent(user.id, token);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Không thể liên kết báo cáo." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Đã lưu kết quả bài kiểm tra vào Hồ sơ năng lực học sinh thành công!",
      report: result.report,
    });
  } catch (err: any) {
    console.error("[Student Claim API] Error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi liên kết báo cáo." },
      { status: 500 }
    );
  }
}
