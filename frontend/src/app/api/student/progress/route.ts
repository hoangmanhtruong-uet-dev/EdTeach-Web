import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStudentProgress } from "@/lib/student/student-store";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập để xem hồ sơ năng lực." },
        { status: 401 }
      );
    }

    const progress = await getStudentProgress(user.id);

    return NextResponse.json({
      success: true,
      progress,
    });
  } catch (err: any) {
    console.error("[Student Progress API] Error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi lấy hồ sơ năng lực." },
      { status: 500 }
    );
  }
}
