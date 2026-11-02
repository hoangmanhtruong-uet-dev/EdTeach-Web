import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { APP_URL, REFERRAL_BONUS_CREDITS } from "@/lib/constants";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // BẢO MẬT: Chống Open Redirect - Đảm bảo next là đường dẫn tương đối an toàn
  let safeNext = "/student";
  const rawNext = searchParams.get("next");
  if (
    rawNext &&
    rawNext.startsWith("/") &&
    !rawNext.startsWith("//") &&
    !rawNext.startsWith("/\\") &&
    !rawNext.includes(":") &&
    !rawNext.includes("@")
  ) {
    safeNext = rawNext;
  }

  // Kiểm tra host ủy quyền từ reverse proxy Vercel
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const redirectBase = forwardedHost ? `${forwardedProto}://${forwardedHost}` : origin || APP_URL;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data?.user) {
      // Đảm bảo user có bản ghi trong public.users và public.wallets ngay lập tức
      try {
        const u = data.user;
        const refCode = "EDU" + u.id.replace(/-/g, "").slice(0, 5).toUpperCase();
        const fullName =
          u.user_metadata?.full_name ||
          u.user_metadata?.name ||
          u.email?.split("@")[0] ||
          "Thầy Cô";
        const avatarUrl = u.user_metadata?.avatar_url || u.user_metadata?.picture || "";

        // Kiểm tra xem user đã tồn tại trước đó chưa (bao gồm cả role)
        const { data: existingUser } = await (supabase.from("users") as any)
          .select("id, referred_by, role")
          .eq("id", u.id)
          .maybeSingle();

        // Kiểm tra mã giới thiệu và target role trong cookie
        const cookieStore = await cookies();
        const refCodeFromCookie = cookieStore.get("eduteach_referral_code")?.value?.trim().toUpperCase();
        const targetRoleCookie = cookieStore.get("eduteach_target_role")?.value?.trim().toLowerCase();
        let inviterUser: any = null;
        let bonusCredits = 0;

        if (refCodeFromCookie && (!existingUser || !existingUser.referred_by)) {
          const { data: foundInviter } = await (supabase.from("users") as any)
            .select("id, name")
            .eq("referral_code", refCodeFromCookie)
            .maybeSingle();
          if (foundInviter && foundInviter.id !== u.id) {
            inviterUser = foundInviter;
            bonusCredits = REFERRAL_BONUS_CREDITS;
          }
        }

        // Xác định vai trò (role) của người dùng:
        // 1. Nếu user đã tồn tại trong DB, bảo lưu role hiện tại (tránh ghi đè giáo viên/gia sư thành học sinh)
        // 2. Nếu đăng ký qua tab chọn Giáo viên / Gia sư, gán đúng role mục tiêu
        // 3. Mặc định với người dùng mới đăng nhập Google thông thường: 'student'
        let assignedRole: "teacher" | "tutor" | "student" = "student";
        if (existingUser?.role) {
          assignedRole = existingUser.role;
        } else if (targetRoleCookie === "teacher" || targetRoleCookie === "tutor") {
          assignedRole = targetRoleCookie as "teacher" | "tutor";
        } else {
          assignedRole = "student";
        }

        // Điều hướng điểm đến:
        // Nếu không có next URL chỉ định hoặc là next mặc định, chuyển hướng thông minh
        if (!rawNext || rawNext === "/dashboard" || rawNext === "/student") {
          if (!existingUser) {
            // Tài khoản mới đăng ký qua Google:
            if (assignedRole === "teacher") {
              safeNext = "/verify/teacher";
            } else if (assignedRole === "tutor") {
              safeNext = "/verify/tutor";
            } else {
              safeNext = "/student";
            }
          } else {
            // Tài khoản cũ đăng nhập lại:
            safeNext = assignedRole === "student" ? "/student" : "/dashboard";
          }
        }

        await (supabase.from("users") as any).upsert(
          {
            id: u.id,
            email: u.email || "",
            name: fullName,
            avatar_url: avatarUrl,
            referral_code: refCode,
            referred_by: inviterUser ? inviterUser.id : (existingUser?.referred_by || null),
            tier: "free",
            role: assignedRole,
          },
          { onConflict: "id" }
        );

        // Khởi tạo ví: Mặc định 5000 promotional credits quà chào mừng thành viên mới
        const startingBalance = 5000;
        const { data: newWallet } = await (supabase.from("wallets") as any).upsert(
          {
            user_id: u.id,
            balance: startingBalance,
            promotional_balance: startingBalance,
            purchased_balance: 0,
            withdrawable_revenue_vnd: 0,
            escrow_balance_vnd: 0,
            daily_quota: 3,
            daily_quota_used: 0,
          },
          { onConflict: "user_id", ignoreDuplicates: true }
        ).select("id").maybeSingle();

        // Nếu người dùng mới đăng ký qua link giới thiệu: Ghi nhận trạng thái PENDING
        // Thưởng +2.000 credits sẽ được giải phóng khi người được mời tạo đề thi đầu tiên (PR 2.3)
        if (inviterUser && bonusCredits > 0) {
          try {
            const admin = createAdminClient() || supabase;

            await (admin.from("referrals") as any).insert({
              inviter_id: inviterUser.id,
              invitee_id: u.id,
              reward_credits: bonusCredits,
              status: "pending",
            });
          } catch (referralErr) {
            console.warn("Process pending referral error:", referralErr);
          }
        }
      } catch (dbErr) {
        console.warn("User wallet sync on OAuth callback warning:", dbErr);
      }

      const response = NextResponse.redirect(`${redirectBase}${safeNext}`);
      // Xoá cookie referral sau khi đã sử dụng
      response.cookies.delete("eduteach_referral_code");
      response.cookies.delete("eduteach_target_role");
      return response;
    }
  }

  return NextResponse.redirect(`${redirectBase}/login?error=auth_failed`);
}
