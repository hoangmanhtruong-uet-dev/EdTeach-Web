import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  let dbStatus: "connected" | "disconnected" = "disconnected";
  let dbLatencyMs = 0;

  // 1. Check Supabase connection
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "";

    if (url && key) {
      const dbStart = Date.now();
      const supabase = createClient(url, key);
      const { error } = await supabase.from("users").select("id").limit(1);
      dbLatencyMs = Date.now() - dbStart;
      if (!error) {
        dbStatus = "connected";
      }
    }
  } catch {
    dbStatus = "disconnected";
  }

  // 2. Check AI Engine configuration
  const geminiConfigured = Boolean(
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GEMINI_API_KEY_PAID ||
    process.env.GEMINI_API_KEY_FREE
  );

  // 3. Check Payment Gateway configuration
  const payosConfigured = Boolean(
    process.env.PAYOS_CLIENT_ID &&
    process.env.PAYOS_API_KEY &&
    process.env.PAYOS_CHECKSUM_KEY
  );

  const isHealthy = dbStatus === "connected" && geminiConfigured;

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "degraded",
      version: "2.0.0-final",
      name: "EduTest AI — Tutor OS",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      totalLatencyMs: Date.now() - startTime,
      services: {
        database: {
          status: dbStatus,
          provider: "Supabase Postgres",
          latencyMs: dbLatencyMs,
        },
        ai_engine: {
          status: geminiConfigured ? "configured" : "missing_key",
          provider: "Google Gemini 2.0 Flash & Gemini 2.0 Thinking",
        },
        payment_gateway: {
          status: payosConfigured ? "configured" : "sandbox_mode",
          provider: "PayOS VietQR & Napas247",
        },
      },
      environment: process.env.NODE_ENV || "development",
    },
    { status: 200 }
  );
}
