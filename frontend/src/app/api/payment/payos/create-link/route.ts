import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { payOSService } from "@/lib/payment/payos";
import { saveFallbackOrder } from "@/lib/payment/payment-fallback-store";
import { validateAndResolvePackage } from "@/lib/payment/pricing-catalog";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Vui lòng đăng nhập để thực hiện nạp tiền." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { amount, credits, packageId, isPro } = body;

    const numAmount = parseInt(amount, 10);
    const numCredits = parseInt(credits, 10);

    // BẢO MẬT: Đối chiếu chặt chẽ với Bảng giá chuẩn Server-side để ngăn chặn Price Tampering
    const resolvedPackage = validateAndResolvePackage({
      packageId,
      amount: numAmount,
      credits: numCredits,
      isPro: Boolean(isPro),
    });

    if (!resolvedPackage) {
      return NextResponse.json(
        { error: "Gói nạp tiền không hợp lệ hoặc đã bị thay đổi thông tin giá. Vui lòng chọn gói từ bảng giá chính thức." },
        { status: 400 }
      );
    }

    const verifiedAmount = resolvedPackage.amount;
    const verifiedCredits = resolvedPackage.credits;
    const verifiedIsPro = resolvedPackage.isPro;

    // PayOS yêu cầu orderCode là số nguyên dương duy nhất (tối đa 9007199254740991)
    const orderCode = Math.floor(Date.now() / 1000) * 1000 + Math.floor(Math.random() * 1000);

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const baseUrl = `${protocol}://${host}`;

    const verifiedTier = resolvedPackage.tier || (verifiedIsPro ? "pro" : "free");

    const returnUrl = verifiedIsPro
      ? `${baseUrl}/pricing?status=PAID&orderCode=${orderCode}&tier=${verifiedTier}&credits=${verifiedCredits}`
      : `${baseUrl}/wallet?status=PAID&orderCode=${orderCode}&credits=${verifiedCredits}`;
    const cancelUrl = `${baseUrl}/pricing?status=CANCELLED&orderCode=${orderCode}`;

    // 1. Tạo đơn hàng qua cổng PayOS
    const descriptionText = verifiedTier === "max" 
      ? "NANG CAP GOI MAX" 
      : verifiedIsPro 
        ? "NANG CAP GOI PRO" 
        : `NAP ${verifiedCredits} CREDITS`;

    const payosResult = await payOSService.createPaymentLink({
      orderCode,
      amount: verifiedAmount,
      description: descriptionText,
      returnUrl,
      cancelUrl,
      buyerEmail: user.email || undefined,
    });

    // 2. Lưu đơn hàng vào cơ sở dữ liệu (hoặc fallback store)
    try {
      await (supabase.from("payment_orders") as any).insert({
        user_id: user.id,
        order_code: orderCode.toString(),
        amount: verifiedAmount,
        credits: verifiedCredits,
        status: "pending",
      });
    } catch {
      // Fallback in-memory
      saveFallbackOrder({
        id: "payos_" + orderCode,
        user_id: user.id,
        order_code: orderCode.toString(),
        amount: verifiedAmount,
        credits: verifiedCredits,
        status: "pending",
        created_at: new Date().toISOString(),
        bank_id: payosResult.bin,
        account_no: payosResult.accountNumber,
        account_name: payosResult.accountName,
        qr_url: payosResult.qrCode,
      });
    }

    return NextResponse.json({
      success: true,
      orderCode,
      checkoutUrl: payosResult.checkoutUrl,
      qrCode: payosResult.qrCode,
      accountNumber: payosResult.accountNumber,
      accountName: payosResult.accountName,
      amount: payosResult.amount,
      description: payosResult.description,
    });
  } catch (err: any) {
    console.error("PayOS create-link error:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi tạo cổng thanh toán PayOS." },
      { status: 500 }
    );
  }
}
