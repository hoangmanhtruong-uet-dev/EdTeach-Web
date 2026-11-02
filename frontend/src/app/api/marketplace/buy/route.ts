import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập để mở khóa đề thi." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { item_id, expected_price } = body;

    if (!item_id || typeof item_id !== "string") {
      return NextResponse.json({ error: "Thiếu mã đề thi." }, { status: 400 });
    }

    // Call atomic PostgreSQL stored procedure marketplace_purchase_item_v2
    const { data: rpcResult, error: rpcError } = await (supabase.rpc as any)(
      "marketplace_purchase_item_v2",
      {
        p_buyer_id: user.id,
        p_item_id: item_id,
        p_expected_price:
          typeof expected_price === "number" && !isNaN(expected_price)
            ? expected_price
            : null,
      }
    );

    if (rpcError) {
      console.error("[Marketplace Buy] RPC marketplace_purchase_item_v2 execution failed:", rpcError);
      return NextResponse.json(
        { error: "Lỗi thực thi giao dịch cơ sở dữ liệu: " + rpcError.message },
        { status: 500 }
      );
    }

    if (!rpcResult || !rpcResult.success) {
      const errorCode = rpcResult?.error || "TRANSACTION_FAILED";
      const errorMessage = rpcResult?.message || "Giao dịch không thành công.";

      if (
        errorCode === "INSUFFICIENT_PURCHASED_BALANCE" ||
        errorCode === "INSUFFICIENT_BALANCE"
      ) {
        return NextResponse.json(
          {
            error: errorMessage,
            errorCode,
            needTopup: true,
            requiredPrice: rpcResult?.required,
            currentBalance: rpcResult?.current_purchased_balance ?? 0,
            promotionalBalance: rpcResult?.promotional_balance ?? 0,
            totalBalance: rpcResult?.total_balance ?? 0,
          },
          { status: 402 }
        );
      }

      if (errorCode === "PRICE_SLIPPAGE") {
        return NextResponse.json(
          {
            error: errorMessage,
            errorCode,
            expectedPrice: rpcResult?.expected_price,
            actualPrice: rpcResult?.actual_price,
          },
          { status: 409 }
        );
      }

      if (errorCode === "ITEM_NOT_FOUND") {
        return NextResponse.json({ error: errorMessage, errorCode }, { status: 404 });
      }

      return NextResponse.json({ error: errorMessage, errorCode }, { status: 400 });
    }

    // Giao dịch thành công — Lấy thông tin chi tiết đề thi từ DB để trả về cho UI
    const { data: dbItem } = await supabase
      .from("marketplace_items")
      .select("*")
      .eq("id", item_id)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      already_owned: rpcResult.already_owned,
      message: rpcResult.message,
      item: dbItem || { id: item_id },
      purchase_id: rpcResult.purchase_id,
      price_credits: rpcResult.price_credits,
      platform_fee_credits: rpcResult.platform_fee_credits,
      platform_fee_vnd: rpcResult.platform_fee_vnd,
      seller_net_vnd: rpcResult.seller_net_vnd,
      escrow_hold_id: rpcResult.escrow_hold_id,
      release_at: rpcResult.release_at,
      new_balance: rpcResult.new_purchased_balance,
    });
  } catch (err: any) {
    console.error("Lỗi POST /api/marketplace/buy:", err);
    return NextResponse.json(
      { error: "Lỗi giao dịch: " + err.message },
      { status: 500 }
    );
  }
}
