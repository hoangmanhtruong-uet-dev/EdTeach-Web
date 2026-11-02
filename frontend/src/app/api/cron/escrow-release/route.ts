import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60s timeout for batch escrow release

/**
 * Timing-safe authentication for Vercel Cron and External Schedulers via Bearer Token.
 * Uses crypto.timingSafeEqual to prevent side-channel timing attacks.
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
 * Core handler to process matured escrow releases.
 * Moves funds from wallets.escrow_balance_vnd to wallets.withdrawable_revenue_vnd
 * for holds where release_at <= now().
 */
async function handleEscrowRelease() {
  const adminClient = createAdminClient();
  if (!adminClient) {
    return NextResponse.json(
      { error: "Internal server error: Admin client could not be initialized." },
      { status: 500 }
    );
  }

  // 1. Preferred Path: Call atomic PostgreSQL stored procedure release_mature_escrow_atomic()
  try {
    const { data: rpcResult, error: rpcError } = await (adminClient as any).rpc(
      "release_mature_escrow_atomic"
    );

    if (!rpcError && rpcResult && rpcResult.success !== false) {
      return NextResponse.json({
        success: true,
        method: "rpc",
        result: rpcResult,
        executed_at: new Date().toISOString(),
      });
    }

    if (rpcError) {
      console.warn(
        "[Cron Escrow] RPC release_mature_escrow_atomic failed or not found, falling back to direct admin update:",
        rpcError.message
      );
    }
  } catch (err: any) {
    console.warn("[Cron Escrow] RPC call exception, trying fallback:", err.message);
  }

  // 2. Fallback Path: Direct admin client update if RPC is pending or not yet deployed
  const nowIso = new Date().toISOString();
  try {
    const { data: maturedHolds, error: selectErr } = await (adminClient
      .from("marketplace_escrow_holds") as any)
      .select("id, order_id, seller_id, buyer_id, item_id, amount_vnd, release_at")
      .eq("status", "held")
      .lte("release_at", nowIso)
      .order("id", { ascending: true })
      .limit(200);

    if (selectErr) {
      throw selectErr;
    }

    if (!maturedHolds || maturedHolds.length === 0) {
      return NextResponse.json({
        success: true,
        method: "fallback_direct_query",
        released_count: 0,
        total_released_vnd: 0,
        executed_at: nowIso,
      });
    }

    let releasedCount = 0;
    let totalReleasedVnd = 0;

    for (const hold of maturedHolds) {
      const amount = Number(hold.amount_vnd) || 0;

      // Update seller's wallet
      const { data: sellerWallet } = await (adminClient.from("wallets") as any)
        .select("id, escrow_balance_vnd, withdrawable_revenue_vnd")
        .eq("user_id", hold.seller_id)
        .maybeSingle();

      if (sellerWallet) {
        const curEscrow = Number(sellerWallet.escrow_balance_vnd) || 0;
        const curWithdrawable = Number(sellerWallet.withdrawable_revenue_vnd) || 0;

        await (adminClient.from("wallets") as any)
          .update({
            escrow_balance_vnd: Math.max(curEscrow - amount, 0),
            withdrawable_revenue_vnd: curWithdrawable + amount,
            updated_at: nowIso,
          })
          .eq("id", sellerWallet.id);

        // Record ledger entry in wallet_txns
        await (adminClient.from("wallet_txns") as any).insert({
          wallet_id: sellerWallet.id,
          amount: 0,
          type: "marketplace_sell",
          description: "Giải tỏa doanh thu bán đề từ Escrow vào số dư khả dụng rút",
          ref_id: hold.item_id,
          metadata: {
            action: "escrow_release",
            escrow_hold_id: hold.id,
            order_id: hold.order_id,
            amount_vnd: amount,
            released_at: nowIso,
          },
          created_at: nowIso,
        });
      }

      // Mark escrow hold as released
      await (adminClient.from("marketplace_escrow_holds") as any)
        .update({
          status: "released",
          released_at: nowIso,
        })
        .eq("id", hold.id);

      releasedCount++;
      totalReleasedVnd += amount;
    }

    return NextResponse.json({
      success: true,
      method: "fallback_direct_query",
      released_count: releasedCount,
      total_released_vnd: totalReleasedVnd,
      executed_at: nowIso,
    });
  } catch (fallbackErr: any) {
    console.error("[Cron Escrow] Fallback release processing failed:", fallbackErr);
    return NextResponse.json(
      { error: "Failed to release mature escrow holds: " + fallbackErr.message },
      { status: 500 }
    );
  }
}

// Support GET for Vercel Cron invocation
export async function GET(req: NextRequest) {
  const auth = verifyCronAuth(req);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.reason || "Unauthorized" },
      { status: auth.reason?.includes("not configured") ? 500 : 401 }
    );
  }

  return await handleEscrowRelease();
}

// Support POST for manual trigger / admin webhook invocation
export async function POST(req: NextRequest) {
  const auth = verifyCronAuth(req);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.reason || "Unauthorized" },
      { status: auth.reason?.includes("not configured") ? 500 : 401 }
    );
  }

  return await handleEscrowRelease();
}
