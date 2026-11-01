import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStudentPractice } from "@/lib/student/student-store";

export async function GET(req: NextRequest) {
  try {
    let studentId = "demo-student-id";

    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        studentId = user.id;
      }
    } catch {
      // fallback
    }

    const sheets = await getStudentPractice(studentId);

    return NextResponse.json({
      success: true,
      sheets,
      practices: sheets,
    });
  } catch (err: any) {
    console.error("[Student Practice API] Error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi lấy danh sách phiếu luyện bù." },
      { status: 500 }
    );
  }
}
