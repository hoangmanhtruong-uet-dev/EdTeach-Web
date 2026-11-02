import { User, SupabaseClient } from "@supabase/supabase-js";

export const MASTER_ADMIN_EMAIL = "truongcri0101@gmail.com";
export const ADMIN_EMAIL_DOMAIN = "@admin.edteach.vn";

/**
 * Fast synchronous check for trusted admin email formats.
 */
export function isEmailAdmin(user: { email?: string | null } | null | undefined): boolean {
  if (!user?.email) return false;
  const email = user.email.toLowerCase().trim();
  return email === MASTER_ADMIN_EMAIL || email.endsWith(ADMIN_EMAIL_DOMAIN);
}

/**
 * Comprehensive admin check verifying email domain and database role.
 * Criteria:
 * 1. user exists and has email
 * 2. user.email === truongcri0101@gmail.com OR user.email.endsWith("@admin.edteach.vn")
 * 3. OR public.users.role === 'admin'
 */
export async function isAdmin(
  supabase: SupabaseClient | any,
  user: User | null | undefined
): Promise<boolean> {
  if (!user || !user.email) return false;

  // 1. Fast path: check admin email patterns
  if (isEmailAdmin(user)) {
    return true;
  }

  // 2. Database path: check role in public.users
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
