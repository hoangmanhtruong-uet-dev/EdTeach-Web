import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
 * Tự động xóa vĩnh viễn các đề thi trong thùng rác đã quá 14 ngày
 */
export async function GET(req: NextRequest) {
  const auth = verifyCronAuth(req);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.reason }, { status: 401 });
  }

  const adminClient = createAdminClient();
  if (!adminClient) {
    return NextResponse.json(
      { error: "Internal server error: Admin client could not be initialized." },
      { status: 500 }
    );
  }

  try {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Thử gọi Stored Procedure purge_expired_trash_exams nếu có
    const rpcRes = await (adminClient as any).rpc("purge_expired_trash_exams");
    if (!rpcRes.error) {
      console.log("[Purge Trash Cron] Stored procedure executed successfully");
      return NextResponse.json({
        success: true,
        message: "Purged expired trash exams via RPC",
        cutoff: fourteenDaysAgo,
      });
    }

    // 2. Fallback: Truy vấn trực tiếp qua Supabase Service Role
    const { data: expiredExams, error: selectErr } = await (adminClient.from("exams") as any)
      .select("id")
      .not("deleted_at", "is", null)
      .lt("deleted_at", fourteenDaysAgo);

    if (selectErr) {
      console.error("[Purge Trash Cron] Failed to query expired exams:", selectErr);
      return NextResponse.json({ error: selectErr.message }, { status: 500 });
    }

    const count = (expiredExams as any[])?.length || 0;
    if (count > 0) {
      const { error: deleteErr } = await (adminClient.from("exams") as any)
        .delete()
        .not("deleted_at", "is", null)
        .lt("deleted_at", fourteenDaysAgo);

      if (deleteErr) {
        console.error("[Purge Trash Cron] Failed to delete expired exams:", deleteErr);
        return NextResponse.json({ error: deleteErr.message }, { status: 500 });
      }
    }

    console.log(`[Purge Trash Cron] Successfully purged ${count} expired exams (> 14 days)`);
    return NextResponse.json({
      success: true,
      purgedCount: count,
      cutoff: fourteenDaysAgo,
    });
  } catch (err: any) {
    console.error("[Purge Trash Cron] Unhandled exception:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
