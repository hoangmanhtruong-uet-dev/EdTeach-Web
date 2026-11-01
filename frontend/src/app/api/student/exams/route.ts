import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStudentExams } from "@/lib/student/student-store";

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

    const exams = await getStudentExams(studentId);

    return NextResponse.json({
      success: true,
      exams,
    });
  } catch (err: any) {
    console.error("[Student Exams API] Error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi lấy danh sách bài thi." },
      { status: 500 }
    );
  }
}
