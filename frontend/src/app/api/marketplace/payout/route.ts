import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PayoutRequest } from "@/types/marketplace";
import { MINIMUM_PAYOUT_VND, MARKETPLACE_CREDIT_RATE_VND } from "@/lib/constants";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
    }

    let balance = 0;
    let withdrawableRevenueVnd = 0;
    let escrowBalanceVnd = 0;
    let isPro = false;
    let isMax = false;

    try {
      const { data: wallet } = await (supabase
        .from("wallets") as any)
        .select("id, balance, withdrawable_revenue_vnd, escrow_balance_vnd")
        .eq("user_id", user.id)
        .maybeSingle();

      if (wallet) {
        balance = (wallet as any).balance ?? 0;
        withdrawableRevenueVnd = Number((wallet as any).withdrawable_revenue_vnd ?? 0);
        escrowBalanceVnd = Number((wallet as any).escrow_balance_vnd ?? 0);
      }

      const { data: profile } = await (supabase
        .from("users") as any)
        .select("tier")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        if ((profile as any).tier === "max") isMax = true;
        else if ((profile as any).tier === "pro") isPro = true;
      }
    } catch {
      // Fallback
    }

    // Lấy doanh thu thật từ Supabase DB
    let totalEarned = 0;
    let totalSales = 0;
    let activeListings = 0;
    let userPayoutRequests: PayoutRequest[] = [];

    try {
      // 1. Đề thi của user
      const { data: items } = await supabase
        .from("marketplace_items")
        .select("id")
        .eq("seller_id", user.id);

      if (items && items.length > 0) {
        activeListings = items.length;
        const itemIds = items.map((i: any) => i.id);

        // 2. Lượt mua các đề thi này
        const { data: purchases } = await supabase
          .from("marketplace_purchases")
          .select("seller_earnings")
          .in("item_id", itemIds);

        if (purchases && purchases.length > 0) {
          totalSales = purchases.length;
          totalEarned = purchases.reduce((sum: number, p: any) => sum + (p.seller_earnings || 0), 0);
        }
      }

      // 3. Lịch sử yêu cầu rút tiền của user
      const { data: payouts } = await supabase
        .from("payout_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (payouts) {
        userPayoutRequests = payouts as PayoutRequest[];
      }
    } catch (e: any) {
      console.warn("Lỗi query payouts:", e.message);
    }

    // Hoa hồng 3 bậc: MAX 5%, PRO 10%, Free 20% (Sprint MP-1 Fix U7)
    const commissionRate = isMax ? 0.05 : isPro ? 0.10 : 0.20;

    return NextResponse.json({
      success: true,
      stats: {
        total_earned_credits: totalEarned,
        total_sales: totalSales,
        active_listings: activeListings,
        available_balance: balance,
        available_vnd: withdrawableRevenueVnd,
        withdrawable_revenue_vnd: withdrawableRevenueVnd,
        escrow_balance_vnd: escrowBalanceVnd,
        min_payout_vnd: MINIMUM_PAYOUT_VND,
        commission_rate: commissionRate,
        is_pro: isPro || isMax,
        is_max: isMax,
      },
      requests: userPayoutRequests,
    });
  } catch (err: any) {
    console.error("Lỗi GET /api/marketplace/payout:", err);
    return NextResponse.json({ error: "Không thể tải thông tin rút tiền. Vui lòng thử lại sau." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
    }

    const body = await req.json();
    const {
      amount_credits,
      amount_vnd: rawAmountVnd,
      bank_name,
      account_number,
      account_holder,
    } = body;

    const requestedVnd = Number(
      rawAmountVnd ||
        (amount_credits
          ? Number(amount_credits) * MARKETPLACE_CREDIT_RATE_VND
          : 0)
    );

    if (!requestedVnd || requestedVnd < MINIMUM_PAYOUT_VND) {
      return NextResponse.json(
        {
          error: `Hạn mức rút tiền tối thiểu là ${MINIMUM_PAYOUT_VND.toLocaleString("vi-VN")} VNĐ.`,
        },
        { status: 400 }
      );
    }

    if (!bank_name || !account_number || !account_holder) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ thông tin ngân hàng và số tài khoản." },
        { status: 400 }
      );
    }

    const credits = Math.round(requestedVnd / MARKETPLACE_CREDIT_RATE_VND);
    const payoutId = crypto.randomUUID();

    // 1. Khấu trừ doanh thu khả dụng qua RPC nguyên tử hoặc fallback an toàn
    let currentRevenue = 0;
    let walletId = "";

    const { data: wallet } = await (supabase.from("wallets") as any)
      .select("id, withdrawable_revenue_vnd")
      .eq("user_id", user.id)
      .maybeSingle();

    if (wallet) {
      currentRevenue = Number((wallet as any).withdrawable_revenue_vnd ?? 0);
      walletId = (wallet as any).id ?? "";
    }

    if (currentRevenue < requestedVnd) {
      return NextResponse.json(
        {
          error: `Số dư doanh thu khả dụng không đủ (${currentRevenue.toLocaleString("vi-VN")}đ < ${requestedVnd.toLocaleString("vi-VN")}đ).`,
        },
        { status: 400 }
      );
    }

    // Ưu tiên gọi atomic RPC deduct_withdrawable_revenue_atomic
    let rpcDeducted = false;
    try {
      const { data: rpcRes, error: rpcErr } = await (supabase.rpc as any)(
        "deduct_withdrawable_revenue_atomic",
        {
          p_user_id: user.id,
          p_amount_vnd: requestedVnd,
          p_payout_type: "marketplace",
          p_metadata: {
            bank_name: bank_name.trim(),
            account_number: account_number.trim(),
            account_holder: account_holder.trim().toUpperCase(),
            payout_id: payoutId,
          },
        }
      );
      if (!rpcErr && rpcRes && rpcRes.success !== false) {
        rpcDeducted = true;
      }
    } catch {
      rpcDeducted = false;
    }

    // Fallback nếu RPC chưa nạp hoặc dùng admin client
    if (!rpcDeducted && walletId) {
      const adminClient = createAdminClient() || supabase;
      await (adminClient.from("wallets") as any)
        .update({
          withdrawable_revenue_vnd: currentRevenue - requestedVnd,
          updated_at: new Date().toISOString(),
        })
        .eq("id", walletId);

      await (adminClient.from("wallet_txns") as any).insert({
        wallet_id: walletId,
        amount: 0,
        type: "payout_request",
        description: `Yêu cầu rút tiền mặt ${requestedVnd.toLocaleString("vi-VN")} VNĐ về ${bank_name}`,
        metadata: {
          payout_id: payoutId,
          payout_type: "marketplace",
          amount_vnd: requestedVnd,
          bank_name: bank_name.trim(),
        },
      });
    }

    // 2. Tạo yêu cầu rút tiền trong DB (status = 'pending')
    const admin = createAdminClient() || supabase;
    const { error: payoutError } = await (admin.from("payout_requests") as any).insert({
      id: payoutId,
      user_id: user.id,
      amount_credits: credits,
      amount_vnd: requestedVnd,
      bank_name: bank_name.trim(),
      account_number: account_number.trim(),
      account_holder: account_holder.trim().toUpperCase(),
      status: "pending",
    });

    if (payoutError) {
      console.error("Lỗi insert payout_requests:", payoutError);
      return NextResponse.json(
        { error: "Không thể tạo yêu cầu rút tiền vào lúc này. Vui lòng thử lại sau." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Đã gửi yêu cầu rút ${requestedVnd.toLocaleString("vi-VN")} VNĐ thành công! Tiền sẽ được chuyển về tài khoản của Thầy Cô trong vòng 24h.`,
      payout_id: payoutId,
      amount_vnd: requestedVnd,
      amount_credits: credits,
    });
  } catch (err: any) {
    console.error("Lỗi POST /api/marketplace/payout:", err);
    return NextResponse.json({ error: "Đã xảy ra lỗi khi xử lý yêu cầu rút tiền. Vui lòng thử lại sau." }, { status: 500 });
  }
}
