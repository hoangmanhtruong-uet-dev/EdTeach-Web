import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Thiếu ID đề thi" }, { status: 400 });
    }

    const admin = createAdminClient();
    const db = admin || (await createClient());

    const { data: exam, error } = await (db.from("exams") as any)
      .select("*, questions(*)")
      .eq("id", id)
      .maybeSingle();

    if (error || !exam) {
      return NextResponse.json({ error: "Không tìm thấy đề thi chia sẻ." }, { status: 404 });
    }

    return NextResponse.json(exam);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Lỗi máy chủ" }, { status: 500 });
  }
}
