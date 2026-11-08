import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Yêu cầu đăng nhập." },
        { status: 401 }
      );
    }

    const adminClient = createAdminClient() || supabase;

    // 1. Fetch user profile bypassing Client RLS
    let { data: profile, error } = await (adminClient.from("users") as any)
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching user profile from admin client:", error);
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

      const { data: newProfile, error: insertError } = await (adminClient.from("users") as any)
        .insert({
          id: user.id,
          email,
          name: defaultName,
          role: "teacher",
          tier: "free",
          referral_code: refCode,
        })
        .select()
        .single();

      if (!insertError && newProfile) {
        profile = newProfile;
      }
    }

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error: any) {
    console.error("API /api/user/profile GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi máy chủ khi tải hồ sơ." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Yêu cầu đăng nhập." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, phone, school, preferences } = body;

    const adminClient = createAdminClient() || supabase;

    const payload: any = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) payload.name = name ? String(name).trim() : null;
    if (phone !== undefined) payload.phone = phone ? String(phone).trim() : null;
    if (school !== undefined) payload.school = school ? String(school).trim() : null;
    if (preferences !== undefined) payload.preferences = preferences;

    const { data: updatedProfile, error } = await (adminClient.from("users") as any)
      .update(payload)
      .eq("id", user.id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Error updating user profile via admin client:", error);
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
    console.error("API /api/user/profile PUT error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi máy chủ khi lưu hồ sơ." },
      { status: 500 }
    );
  }
}
