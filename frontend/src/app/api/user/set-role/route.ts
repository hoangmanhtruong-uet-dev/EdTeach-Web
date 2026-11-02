import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // 1. Enforce authentication
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Yêu cầu đăng nhập để thiết lập vai trò." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { role } = body;

    // 2. Validate allowed roles
    if (!["teacher", "tutor", "student"].includes(role)) {
      return NextResponse.json(
        { success: false, error: "Vai trò được chọn không hợp lệ." },
        { status: 400 }
      );
    }

    // 3. Check current role from database to prevent student privilege escalation
    const adminDb = createAdminClient();
    const readClient = adminDb || supabase;

    const { data: profile } = await (readClient.from("users") as any)
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    // Prevent student accounts from escalating to teacher or tutor
    if (profile?.role === "student" && role !== "student") {
      return NextResponse.json(
        {
          success: false,
          error: "Tài khoản học sinh không được phép tự chuyển sang vai trò giáo viên hoặc gia sư. Vui lòng liên hệ quản trị viên.",
        },
        { status: 403 }
      );
    }

    // Prevent tampering with admin accounts via this endpoint
    if (profile?.role === "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Tài khoản quản trị viên không thể thay đổi vai trò qua giao diện này.",
        },
        { status: 403 }
      );
    }

    // Idempotent return if already in desired role
    if (profile?.role === role) {
      return NextResponse.json({
        success: true,
        role,
        message: `Vai trò hiện tại đã là ${
          role === "student" ? "Học sinh" : role === "tutor" ? "Gia sư" : "Giáo viên"
        }.`,
      });
    }

    // 4. Update role using service_role client to satisfy DB privilege trigger
    const writeClient = adminDb || supabase;
    const { error: dbErr } = await (writeClient.from("users") as any)
      .update({
        role,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (dbErr) {
      console.warn("[set-role] DB update error:", dbErr.message);
      return NextResponse.json(
        { success: false, error: "Lỗi cơ sở dữ liệu khi cập nhật vai trò." },
        { status: 500 }
      );
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
