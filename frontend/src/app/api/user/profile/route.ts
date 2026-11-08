import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/server-user";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { user, dbClient, error: authError } = await getAuthenticatedUser(req);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Yêu cầu đăng nhập để xem thông tin hồ sơ." },
        { status: 401 }
      );
    }

    // 1. Fetch user profile bypassing Client RLS via Admin Client
    let { data: profile, error } = await (dbClient.from("users") as any)
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("[/api/user/profile GET] DB error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // 2. Auto-create user profile row if it doesn't exist yet
    if (!profile) {
      const email = user.email || "";
      const defaultName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        email.split("@")[0] ||
        "Thầy Cô";
      const refCode = "EDU" + user.id.replace(/-/g, "").substring(0, 5).toUpperCase();

      const { data: newProfile, error: insertError } = await (dbClient.from("users") as any)
        .upsert(
          {
            id: user.id,
            email,
            name: defaultName,
            role: "teacher",
            tier: "free",
            referral_code: refCode,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        )
        .select()
        .maybeSingle();

      if (!insertError && newProfile) {
        profile = newProfile;
      }
    }

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error: any) {
    console.error("[/api/user/profile GET] Exception:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi máy chủ khi tải hồ sơ." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { user, dbClient, error: authError } = await getAuthenticatedUser(req);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Yêu cầu đăng nhập để lưu hồ sơ." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, phone, school, preferences } = body;

    const payload: any = {
      id: user.id,
      email: user.email,
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) payload.name = name ? String(name).trim() : null;
    if (phone !== undefined) payload.phone = phone ? String(phone).trim() : null;
    if (school !== undefined) payload.school = school ? String(school).trim() : null;
    if (preferences !== undefined) payload.preferences = preferences;

    let { data: updatedProfile, error } = await (dbClient.from("users") as any)
      .upsert(payload, { onConflict: "id" })
      .select()
      .maybeSingle();

    // Dự phòng an toàn nếu môi trường DB chưa chạy migration thêm cột phone
    if (error && error.message?.includes("phone")) {
      console.warn("[/api/user/profile PUT] Column 'phone' not found, retrying without phone column...");
      delete payload.phone;
      const retry = await (dbClient.from("users") as any)
        .upsert(payload, { onConflict: "id" })
        .select()
        .maybeSingle();
      updatedProfile = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error("[/api/user/profile PUT] DB update error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
      message: "Cập nhật hồ sơ thành công!",
    });
  } catch (error: any) {
    console.error("[/api/user/profile PUT] Exception:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi máy chủ khi lưu hồ sơ." },
      { status: 500 }
    );
  }
}
