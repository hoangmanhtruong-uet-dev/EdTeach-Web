import { NextRequest, NextResponse, connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { REFERRAL_BONUS_CREDITS } from "@/lib/constants";

// GET: Lấy thông tin mã giới thiệu và số người đã mời
export async function GET(req: NextRequest) {
  await connection();
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const { data: profile } = await (supabase.from("users") as any)
      .select("referral_code, referred_by")
      .eq("id", user.id)
      .single();

    // Đếm tổng số người đã mời và số người đã kích hoạt đề thi
    const { count: totalReferrals } = await (supabase.from("referrals") as any)
      .select("id", { count: "exact" })
      .eq("inviter_id", user.id);

    const { count: qualifiedReferrals } = await (supabase.from("referrals") as any)
      .select("id", { count: "exact" })
      .eq("inviter_id", user.id)
      .eq("status", "rewarded");

    const { count: pendingReferrals } = await (supabase.from("referrals") as any)
      .select("id", { count: "exact" })
      .eq("inviter_id", user.id)
      .eq("status", "pending");

    return NextResponse.json({
      referral_code: profile?.referral_code || "EDU" + user.id.slice(0, 5).toUpperCase(),
      total_referrals: totalReferrals || 0,
      qualified_referrals: qualifiedReferrals || 0,
      pending_referrals: pendingReferrals || 0,
      reward_per_referral: REFERRAL_BONUS_CREDITS,
      has_been_referred: !!profile?.referred_by,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Nhập mã giới thiệu của đồng nghiệp - Lưu trạng thái PENDING cho đến khi tạo đề thi đầu tiên (PR 2.3)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const body = await req.json();
    const { referral_code } = body;

    if (!referral_code || typeof referral_code !== "string") {
      return NextResponse.json({ error: "Mã giới thiệu không hợp lệ" }, { status: 400 });
    }

    const cleanCode = referral_code.trim().toUpperCase();
    const adminClient = createAdminClient() || supabase;

    // 1. Kiểm tra mã người mời & chống gian lận tạo vòng tròn (CRT-06 & CRT-07)
    const { data: inviter } = await (adminClient.from("users") as any)
      .select("id, name, referred_by")
      .eq("referral_code", cleanCode)
      .maybeSingle();

    if (!inviter) {
      return NextResponse.json({ error: "Mã giới thiệu không tồn tại." }, { status: 404 });
    }

    if (inviter.id === user.id || inviter.referred_by === user.id) {
      return NextResponse.json({ error: "Mã giới thiệu không hợp lệ (không thể tự giới thiệu hoặc tạo vòng lặp giữa hai tài khoản)." }, { status: 400 });
    }

    // 2. Kiểm tra xem user hiện tại đã từng được ai giới thiệu chưa
    const { data: currentProfile } = await (adminClient.from("users") as any)
      .select("referred_by")
      .eq("id", user.id)
      .single();

    if (currentProfile?.referred_by) {
      return NextResponse.json({ error: "Bạn đã từng áp dụng mã giới thiệu trước đó." }, { status: 400 });
    }

    const { data: existingRef } = await (adminClient.from("referrals") as any)
      .select("id")
      .eq("invitee_id", user.id)
      .maybeSingle();

    if (existingRef) {
      return NextResponse.json({ error: "Tài khoản của bạn đã được áp dụng phần thưởng giới thiệu trước đó." }, { status: 400 });
    }

    // 3. Cập nhật referred_by cho user qua Admin Client để bypass RLS
    await (adminClient.from("users") as any)
      .update({ referred_by: inviter.id })
      .eq("id", user.id);

    // 4. Lưu vào bảng referrals ở trạng thái PENDING (chờ tạo đề thi đầu tiên)
    const rewardCredits = REFERRAL_BONUS_CREDITS;
    await (adminClient.from("referrals") as any).insert({
      inviter_id: inviter.id,
      invitee_id: user.id,
      reward_credits: rewardCredits,
      status: "pending",
    });

    // KHÔNG cộng thưởng ngay tại đây!
    // Thưởng +2.000 credits sẽ được tự động giải phóng khi người được mời tạo đề thi đầu tiên (PR 2.3)

    return NextResponse.json({
      success: true,
      status: "pending",
      message: `Áp dụng mã giới thiệu thành công! Thầy/cô và ${inviter.name || "đồng nghiệp"} sẽ nhận ngay +${REFERRAL_BONUS_CREDITS.toLocaleString("vi-VN")} credits vào ví ngay khi hoàn thành tạo đề thi đầu tiên.`,
      reward_credits: rewardCredits,
      inviter_name: inviter.name || "Đồng nghiệp",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
