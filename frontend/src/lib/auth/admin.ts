import { User, SupabaseClient } from "@supabase/supabase-js";

/**
 * Danh sách email quản trị viên được nạp từ biến môi trường ADMIN_EMAILS hoặc NEXT_PUBLIC_ADMIN_EMAILS.
 * Loại bỏ hoàn toàn email cá nhân hardcode trong mã nguồn.
 */
export function getAdminEmails(): string[] {
  const envEmails =
    process.env.ADMIN_EMAILS ||
    process.env.NEXT_PUBLIC_ADMIN_EMAILS ||
    process.env.ADMIN_EMAIL ||
    "";
  return envEmails
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Kiểm tra nhanh xem email có nằm trong danh sách Quản trị viên cấu hình qua biến môi trường hay không.
 */
export function isEmailAdmin(user: { email?: string | null } | null | undefined): boolean {
  if (!user?.email) return false;
  const email = user.email.toLowerCase().trim();
  const configuredAdmins = getAdminEmails();
  return configuredAdmins.includes(email);
}

/**
 * Kiểm tra phân quyền Quản trị viên (Admin) toàn diện.
 * Tiêu chí:
 * 1. user tồn tại và có email nằm trong danh sách ADMIN_EMAILS (cấu hình môi trường)
 * 2. HOẶC public.users.role === 'admin' trong cơ sở dữ liệu (Nguồn chân lý - SSOT)
 */
export async function isAdmin(
  supabase: SupabaseClient | any,
  user: User | null | undefined
): Promise<boolean> {
  if (!user || !user.email) return false;

  // 1. Fast path: đối soát danh sách admin cấu hình qua env
  if (isEmailAdmin(user)) {
    return true;
  }

  // 2. Database path: đối soát cột role trong bảng public.users (SSOT)
  try {
    const { data: dbUser, error } = await (supabase.from("users") as any)
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.warn("[isAdmin] Database query error:", error.message);
      return false;
    }

    return dbUser?.role === "admin";
  } catch (err) {
    console.warn("[isAdmin] Unexpected error checking admin role:", err);
    return false;
  }
}
