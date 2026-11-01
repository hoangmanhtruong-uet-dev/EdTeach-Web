import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { joinExamByCode } from "@/lib/student/student-store";

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const code = (body.code || body.examCode || "").trim();

    if (!code) {
      return NextResponse.json(
        { error: "Vui lòng nhập mã đề thi hoặc mã lớp." },
        { status: 400 }
      );
    }

    const result = await joinExamByCode(studentId, code);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Không tìm thấy bài thi với mã này." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      exam: result.exam,
      message: `Đã gia nhập thành công bài thi: ${result.exam?.examTitle}`,
    });
  } catch (err: any) {
    console.error("[Student Join Exam API] Error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi gia nhập bài thi." },
      { status: 500 }
    );
  }
}
