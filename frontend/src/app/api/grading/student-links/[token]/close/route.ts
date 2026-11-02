import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { closeStudentSubmissionLink } from "@/lib/grading/student-submission-store";

interface RouteProps {
  params: Promise<{ token: string }>;
}

export async function POST(req: NextRequest, { params }: RouteProps) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập để đóng liên kết nhận bài." },
        { status: 401 }
      );
    }

    const { token } = await params;
    const closed = await closeStudentSubmissionLink(token, user.id);

    if (!closed) {
      return NextResponse.json(
        { error: "Liên kết nộp bài không tồn tại hoặc bạn không có quyền đóng liên kết này." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Đã đóng liên kết nhận bài thành công.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Lỗi đóng liên kết nộp bài." },
      { status: 500 }
    );
  }
}
