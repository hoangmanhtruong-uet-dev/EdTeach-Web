import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await req.json();
    const { role } = body;

    if (!["teacher", "tutor", "student"].includes(role)) {
      return NextResponse.json(
        { success: false, error: "Vai trò được chọn không hợp lệ." },
        { status: 400 }
      );
    }

    if (user) {
      // Update role in DB
      const { error: dbErr } = await (supabase.from("users") as any)
        .update({
          role,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (dbErr) {
        console.warn("[set-role] DB update error:", dbErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      role,
      message: `Đã thiết lập vai trò thành công: ${
        role === "student" ? "Học sinh" : role === "tutor" ? "Gia sư" : "Giáo viên"
      }`,
    });
  } catch (err: any) {
    console.error("[set-role] Error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi cập nhật vai trò." },
      { status: 500 }
    );
  }
}
