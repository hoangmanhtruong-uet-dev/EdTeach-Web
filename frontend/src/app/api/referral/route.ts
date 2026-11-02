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

    const adminClient = createAdminClient() || supabase;

    const { data: profile } = await (adminClient.from("users") as any)
      .select("referral_code, referred_by")
      .eq("id", user.id)
      .single();

    // Sinh mã cố định và lưu cứng vào DB nếu chưa có
    let userReferralCode = profile?.referral_code;
    if (!userReferralCode) {
      userReferralCode = "EDU" + user.id.replace(/-/g, "").slice(0, 5).toUpperCase();
      try {
        await (adminClient.from("users") as any)
          .update({ referral_code: userReferralCode })
          .eq("id", user.id);
      } catch (e) {
        console.warn("Error auto-saving referral code:", e);
      }
    }

    // Đếm tổng số người đã mời và số người đã nhận thưởng
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
      referral_code: userReferralCode,
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

// POST: Nhập mã giới thiệu của đồng nghiệp - Nhận ngay +2.000 credits cho cả hai
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
    let inviter: any = null;

    // Cách 0: Thử gọi RPC lookup_referral_code (Bypass RLS an toàn tuyệt đối)
    try {
      const { data: rpcMatch, error: rpcError } = await (supabase.rpc as any)("lookup_referral_code", {
        code_to_check: cleanCode,
      });
      if (!rpcError && rpcMatch && Array.isArray(rpcMatch) && rpcMatch.length > 0) {
        inviter = rpcMatch[0];
      }
    } catch (e) {
      console.warn("lookup_referral_code RPC note:", e);
    }

    // Cách 1: Tìm theo cột referral_code trực tiếp
    if (!inviter) {
      const { data: directMatch } = await (adminClient.from("users") as any)
        .select("id, name, referred_by, referral_code")
        .eq("referral_code", cleanCode)
        .maybeSingle();

      if (directMatch) {
        inviter = directMatch;
      }
    }

    // Cách 2: Tìm theo tiền tố User ID nếu mã được sinh từ ID (như EDU8C01A)
    if (!inviter && cleanCode.startsWith("EDU")) {
      const hexPrefix = cleanCode.slice(3).toLowerCase();
      if (hexPrefix.length >= 4) {
        // Query users có id bắt đầu bằng prefix
        const { data: userCandidates } = await (adminClient.from("users") as any)
          .select("id, name, referred_by, referral_code");

        if (userCandidates && userCandidates.length > 0) {
          const matched = userCandidates.find((u: any) =>
            u.id.replace(/-/g, "").toLowerCase().startsWith(hexPrefix) ||
            (u.referral_code && u.referral_code.toUpperCase() === cleanCode)
          );
          if (matched) {
            inviter = matched;
            // Tự động lưu referral_code vào DB cho tài khoản người mời
            try {
              await (adminClient.from("users") as any)
                .update({ referral_code: cleanCode })
                .eq("id", matched.id);
            } catch {
              // ignore
            }
          }
        }
      }
    }

    if (!inviter) {
      return NextResponse.json({ error: "Mã giới thiệu không tồn tại trên hệ thống." }, { status: 404 });
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

    // 4. Kích hoạt thưởng ngay +2.000 credits cho cả người mời và người được mời
    const rewardCredits = REFERRAL_BONUS_CREDITS;
    try {
      // Ví người mời
      const { data: inviterWallet } = await (adminClient.from("wallets") as any)
        .select("id, balance")
        .eq("user_id", inviter.id)
        .maybeSingle();
      if (inviterWallet) {
        await (adminClient.from("wallets") as any)
          .update({ balance: (inviterWallet.balance || 0) + rewardCredits })
          .eq("user_id", inviter.id);
      } else {
        await (adminClient.from("wallets") as any).insert({
          user_id: inviter.id,
          balance: 5000 + rewardCredits,
        });
      }

      // Ví người được mời (user hiện tại)
      const { data: userWallet } = await (adminClient.from("wallets") as any)
        .select("id, balance")
        .eq("user_id", user.id)
        .maybeSingle();
      if (userWallet) {
        await (adminClient.from("wallets") as any)
          .update({ balance: (userWallet.balance || 0) + rewardCredits })
          .eq("user_id", user.id);
      } else {
        await (adminClient.from("wallets") as any).insert({
          user_id: user.id,
          balance: 5000 + rewardCredits,
        });
      }
    } catch (wErr) {
      console.warn("Wallet reward update warning:", wErr);
    }

    // 5. Lưu vào bảng referrals ở trạng thái REWARDED
    await (adminClient.from("referrals") as any).insert({
      inviter_id: inviter.id,
      invitee_id: user.id,
      reward_credits: rewardCredits,
      status: "rewarded",
    });

    return NextResponse.json({
      success: true,
      status: "rewarded",
      message: `Áp dụng mã giới thiệu thành công! Thầy/cô và ${inviter.name || "đồng nghiệp"} đã nhận ngay +${rewardCredits.toLocaleString("vi-VN")} credits vào tài khoản.`,
      reward_credits: rewardCredits,
      inviter_name: inviter.name || "Đồng nghiệp",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
