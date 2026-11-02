import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { payOSService } from "@/lib/payment/payos";
import { getFallbackOrder, markFallbackOrderPaid } from "@/lib/payment/payment-fallback-store";
import { recordCommission } from "@/lib/affiliate/affiliate-store";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Kiểm tra tính hợp lệ của Webhook từ PayOS bằng Checksum Key
    const isValidSignature = payOSService.verifyWebhookData(body);
    if (!isValidSignature) {
      console.warn("PayOS webhook signature verification failed!");
      return NextResponse.json(
        { error: "Invalid PayOS signature." },
        { status: 400 }
      );
    }

    const { code, data } = body;
    if (code !== "00" || !data) {
      return NextResponse.json({
        success: false,
        message: "Giao dịch không ở trạng thái thành công.",
      });
    }

    const orderCodeStr = data.orderCode?.toString();
    const paidAmount = data.amount;
    const supabase = getServiceSupabase();
    const nowIso = new Date().toISOString();

    let userId: string | null = null;
    let creditsToAdd = 0;
    let orderId = "payos_" + orderCodeStr;

    // 2. Tìm đơn hàng tương ứng trong DB
    try {
      const { data: order } = await (supabase.from("payment_orders") as any)
        .select("*")
        .eq("order_code", orderCodeStr)
        .maybeSingle();

      if (order) {
        if (order.status === "paid") {
          return NextResponse.json({
            success: true,
            message: "Đơn hàng đã được ghi nhận trước đó.",
          });
        }
        userId = order.user_id;
        creditsToAdd = order.credits;
        orderId = order.id;

        // Cập nhật trạng thái đơn hàng thành paid
        await (supabase.from("payment_orders") as any)
          .update({
            status: "paid",
            paid_at: nowIso,
            sepay_txn_id: data.reference || data.paymentLinkId,
          })
          .eq("id", order.id);
      }
    } catch {
      // ignore
    }

    // Nếu không tìm thấy trong DB thì kiểm tra fallback store
    if (!userId) {
      const fbOrder = getFallbackOrder(orderCodeStr);
      if (fbOrder) {
        userId = fbOrder.user_id;
        creditsToAdd = fbOrder.credits;
        markFallbackOrderPaid(orderCodeStr);
      }
    }

    // Nếu creditsToAdd chưa có, suy luận theo mệnh giá gói
    if (creditsToAdd === 0) {
      if (paidAmount === 899000) creditsToAdd = 500000;
      else if (paidAmount === 599000) creditsToAdd = 150000;
      else if (paidAmount === 229000) creditsToAdd = 100000;
      else if (paidAmount === 149000 || paidAmount === 99000) creditsToAdd = 30000;
    }

    // 3. Nếu tìm thấy user, cộng tiền vào ví (Wallets)
    if (userId && creditsToAdd > 0) {
      const { data: wallet } = await (supabase.from("wallets") as any)
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (wallet) {
        const newBalance = (wallet.balance || 0) + creditsToAdd;
        await (supabase.from("wallets") as any)
          .update({
            balance: newBalance,
            updated_at: nowIso,
          })
          .eq("id", wallet.id);

        try {
          await (supabase.from("wallet_txns") as any).insert({
            wallet_id: wallet.id,
            amount: creditsToAdd,
            type: "purchase",
            description: `Nạp tiền tự động qua PayOS: +${creditsToAdd} Credits (Mã GD: ${orderCodeStr})`,
            ref_id: orderId,
          });
        } catch {
          // ignore
        }
      }

      // Nâng cấp gói cước MAX hoặc PRO và tính hạn sử dụng
      const isSemester = paidAmount === 899000 || paidAmount === 599000;
      const daysToAdd = isSemester ? 150 : 30; // 5 tháng (học kỳ) hoặc 30 ngày (hàng tháng)

      // Lấy thời hạn hiện tại của người dùng để cộng dồn nếu đang còn hạn
      const { data: currentUser } = await (supabase.from("users") as any)
        .select("subscription_expires_at, tier")
        .eq("id", userId)
        .maybeSingle();

      const currentExpiresAt = currentUser?.subscription_expires_at
        ? new Date(currentUser.subscription_expires_at).getTime()
        : 0;
      const now = Date.now();
      const baseTimestamp = currentExpiresAt > now ? currentExpiresAt : now;
      const expiresAtIso = new Date(baseTimestamp + daysToAdd * 24 * 3600 * 1000).toISOString();

      // PRC-02 FIX: Loại bỏ hoàn toàn data.description?.includes('MAX') để ngăn leo thang qua memo chuyển khoản
      if (paidAmount === 229000 || paidAmount === 899000) {
        try {
          const { error: tierErr } = await (supabase.from("users") as any)
            .update({ 
              tier: "max", 
              subscription_expires_at: expiresAtIso,
              updated_at: nowIso 
            })
            .eq("id", userId);

          if (tierErr) {
            // Fallback nếu constraint DB chưa cho phép 'max'
            const { data: u } = await (supabase.from("users") as any)
              .select("preferences")
              .eq("id", userId)
              .maybeSingle();
            const prefs = u?.preferences || {};
            await (supabase.from("users") as any)
              .update({
                tier: "pro",
                subscription_expires_at: expiresAtIso,
                preferences: { ...prefs, subscription_tier: "max" },
                updated_at: nowIso,
              })
              .eq("id", userId);
          }
          console.log(`[PayOS Webhook] Đã nâng cấp tài khoản user ${userId} lên gói LUYỆN THI MAX (Hạn đến ${expiresAtIso})!`);
        } catch (tierErr) {
          console.warn("Lỗi update tier MAX:", tierErr);
        }
      } else if (
        paidAmount === 149000 ||
        paidAmount === 599000 ||
        paidAmount === 99000
      ) {
        try {
          await (supabase.from("users") as any)
            .update({ 
              tier: "pro", 
              subscription_expires_at: expiresAtIso,
              updated_at: nowIso 
            })
            .eq("id", userId);
          console.log(`[PayOS Webhook] Đã nâng cấp tài khoản user ${userId} lên gói PRO (Hạn đến ${expiresAtIso})!`);
        } catch (tierErr) {
          console.warn("Lỗi update tier PRO:", tierErr);
        }
      }

      // 4. Trích hoa hồng 20% cho người giới thiệu (Affiliate Referral Engine)
      try {
        const { data: payingUser } = await (supabase.from("users") as any)
          .select("referred_by")
          .eq("id", userId)
          .maybeSingle();

        if (payingUser?.referred_by && payingUser.referred_by !== userId) {
          await recordCommission(
            payingUser.referred_by,
            userId,
            orderCodeStr,
            paidAmount,
            0.2 // 20% hoa hồng trọn đời
          );
          console.log(`[PayOS Webhook] Đã trích 20% hoa hồng (${Math.round(paidAmount * 0.2)}đ) cho inviter ${payingUser.referred_by}`);
        }
      } catch (affiliateErr) {
        console.warn("[PayOS Webhook] Lỗi trích hoa hồng affiliate:", affiliateErr);
      }
    }

    console.log(`[PayOS Webhook] Thành công xử lý đơn ${orderCodeStr}, cộng ${creditsToAdd} credits cho user ${userId}`);

    return NextResponse.json({
      success: true,
      message: "Webhook processed successfully.",
    });
  } catch (err: any) {
    console.error("PayOS webhook error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi xử lý webhook PayOS." },
      { status: 500 }
    );
  }
}
