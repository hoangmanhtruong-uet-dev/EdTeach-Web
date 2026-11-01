import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStudentProgress } from "@/lib/student/student-store";

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

    const progress = await getStudentProgress(studentId);

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
