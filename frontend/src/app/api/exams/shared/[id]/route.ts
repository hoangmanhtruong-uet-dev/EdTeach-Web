import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isValidUUID } from "@/lib/security/validation";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id || !isValidUUID(id)) {
      return NextResponse.json({ error: "Mã đề thi không hợp lệ." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const admin = createAdminClient();
    const db = admin || supabase;

    const { data: exam, error } = await (db.from("exams") as any)
      .select("*, questions(*)")
      .eq("id", id)
      .maybeSingle();

    if (error || !exam) {
      return NextResponse.json(
        { error: "Không tìm thấy đề thi chia sẻ." },
        { status: 404 }
      );
    }

    const isOwner = Boolean(user?.id && exam.user_id === user.id);
    const isPubliclyShared = exam.is_shared === true || exam.is_public === true;

    // Ngăn chặn IDOR: Chỉ cho phép truy cập nếu đề thi được chia sẻ công khai hoặc thuộc quyền sở hữu của người gọi
    if (!isPubliclyShared && !isOwner) {
      return NextResponse.json(
        { error: "Đề thi không tồn tại hoặc chưa được tác giả chia sẻ công khai." },
        { status: 404 }
      );
    }

    return NextResponse.json(exam);
  } catch (err: any) {
    console.error("[Shared Exam API Error]:", err);
    return NextResponse.json(
      { error: "Không thể tải đề thi chia sẻ. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}
