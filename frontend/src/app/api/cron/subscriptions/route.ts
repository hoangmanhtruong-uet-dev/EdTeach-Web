import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60s timeout for batch downgrade

/**
 * Xác thực request từ Vercel Cron hoặc External Scheduler qua Bearer Token
 */
function verifyCronAuth(req: NextRequest): { authorized: boolean; reason?: string } {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return { authorized: false, reason: "CRON_SECRET is not configured on the server." };
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return { authorized: false, reason: "Missing Authorization header." };
  }

  const expected = `Bearer ${cronSecret}`;
  const authBuffer = Buffer.from(authHeader);
  const expectedBuffer = Buffer.from(expected);

  if (authBuffer.length !== expectedBuffer.length) {
    return { authorized: false, reason: "Invalid authorization token." };
  }

  if (!crypto.timingSafeEqual(authBuffer, expectedBuffer)) {
    return { authorized: false, reason: "Invalid authorization token." };
  }

  return { authorized: true };
}

/**
 * Xử lý quét và hạ hạng các thuê bao PRO/MAX đã hết hạn
 */
async function handleSubscriptionDowngrades() {
  const adminClient = createAdminClient();
  if (!adminClient) {
    return NextResponse.json(
      { error: "Internal server error: Admin client could not be initialized." },
      { status: 500 }
    );
  }

  // 1. Thử gọi hàm Stored Procedure downgrade_expired_subscriptions()
  try {
    const { data: rpcResult, error: rpcError } = await (adminClient as any).rpc(
      "downgrade_expired_subscriptions"
    );

    if (!rpcError && rpcResult) {
      return NextResponse.json({
        success: true,
        method: "rpc",
        result: rpcResult,
      });
    }

    if (rpcError) {
      console.warn(
        "[Cron Subscriptions] RPC downgrade_expired_subscriptions failed or not found, falling back to direct table update:",
        rpcError.message
      );
    }
  } catch (err: any) {
    console.warn("[Cron Subscriptions] RPC call exception, trying fallback:", err.message);
  }

  // 2. Fallback trực tiếp qua Admin Client nếu RPC chưa sẵn sàng
  const nowIso = new Date().toISOString();
  try {
    const { data: expiredUsers, error: selectErr } = await (adminClient.from("users") as any)
      .select("id, email, tier, subscription_expires_at")
      .lte("subscription_expires_at", nowIso)
      .neq("tier", "free");

    if (selectErr) {
      throw selectErr;
    }

    if (!expiredUsers || expiredUsers.length === 0) {
      return NextResponse.json({
        success: true,
        method: "fallback_direct_update",
        downgraded_count: 0,
        downgraded_users: [],
        executed_at: nowIso,
      });
    }

    const ids = expiredUsers.map((u: any) => u.id);
    const { error: updateErr } = await (adminClient.from("users") as any)
      .update({
        tier: "free",
        updated_at: nowIso,
      })
      .in("id", ids);

    if (updateErr) {
      throw updateErr;
    }

    return NextResponse.json({
      success: true,
      method: "fallback_direct_update",
      downgraded_count: expiredUsers.length,
      downgraded_users: expiredUsers.map((u: any) => ({
        user_id: u.id,
        email: u.email,
        old_tier: u.tier,
        expired_at: u.subscription_expires_at,
      })),
      executed_at: nowIso,
    });
  } catch (fallbackErr: any) {
    console.error("[Cron Subscriptions] Fallback update failed:", fallbackErr);
    return NextResponse.json(
      { error: "Failed to downgrade expired subscriptions: " + fallbackErr.message },
      { status: 500 }
    );
  }
}

// Hỗ trợ GET cho Vercel Cron
export async function GET(req: NextRequest) {
  const auth = verifyCronAuth(req);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.reason || "Unauthorized" },
      { status: auth.reason?.includes("not configured") ? 500 : 401 }
    );
  }

  return await handleSubscriptionDowngrades();
}

// Hỗ trợ POST cho Manual / Webhook trigger
export async function POST(req: NextRequest) {
  const auth = verifyCronAuth(req);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.reason || "Unauthorized" },
      { status: auth.reason?.includes("not configured") ? 500 : 401 }
    );
  }

  return await handleSubscriptionDowngrades();
}
