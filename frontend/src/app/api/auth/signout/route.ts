import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Server-Side Signout Route Handler
 *
 * Invalidate caller session in Supabase Auth GoTrue engine and sends HTTP response
 * clearing all SSR session cookies and application cookies with Max-Age=0 and expired date.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.warn("[SignOut API] Supabase server signOut warning:", err);
  }

  const response = NextResponse.json({
    success: true,
    message: "Đăng xuất tài khoản thành công.",
  });

  // Explicitly clear all session cookies and application cookies
  const cookiesToClear = [
    "sb-access-token",
    "sb-refresh-token",
    "eduteach_target_role",
    "eduteach_referral_code",
    "edutest_sidebar_collapsed",
  ];

  cookiesToClear.forEach((name) => {
    response.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      httpOnly: name.startsWith("sb-"),
    });
  });

  return response;
}
