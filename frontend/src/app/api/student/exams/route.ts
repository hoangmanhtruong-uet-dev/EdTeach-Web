import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStudentExams } from "@/lib/student/student-store";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    // Ngăn chặn IDOR: Loại bỏ hoàn toàn fallback demo-student-id, yêu cầu xác thực phiên đăng nhập
    if (authErr || !user) {
      return NextResponse.json(
        { success: false, error: "Vui lòng đăng nhập để xem danh sách bài thi của học sinh." },
        { status: 401 }
      );
    }

    const exams = await getStudentExams(user.id);

    return NextResponse.json({
      success: true,
      exams: Array.isArray(exams) ? exams : [],
    });
  } catch (err: unknown) {
    console.error("[Student Exams API] Error:", err);
    return NextResponse.json(
      { success: false, error: "Không thể tải danh sách bài thi. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}
