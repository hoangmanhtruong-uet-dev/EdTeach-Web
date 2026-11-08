import { NextRequest } from "next/server";
import { User, SupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface AuthenticatedUserResult {
  user: User | null;
  adminClient: SupabaseClient | null;
  client: SupabaseClient | null;
  dbClient: SupabaseClient | any;
  error?: string | null;
}

/**
 * Trích xuất người dùng đã xác thực từ Request (hỗ trợ cả Bearer Token lẫn Session Cookie).
 * Ưu tiên Bearer Token vì miễn nhiễm 100% với sự cố phân mảnh cookie trên trình duyệt hoặc proxy Vercel.
 */
export async function getAuthenticatedUser(req: NextRequest): Promise<AuthenticatedUserResult> {
  const adminClient = createAdminClient();
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7).trim() : null;

  // 1. Kiểm tra Bearer Token qua Admin Client (Xác thực trực tiếp token với Supabase Auth)
  if (token && adminClient) {
    try {
      const {
        data: { user },
        error,
      } = await adminClient.auth.getUser(token);
      if (!error && user) {
        return {
          user,
          adminClient,
          client: adminClient,
          dbClient: adminClient,
        };
      }
    } catch (e: any) {
      console.warn("[getAuthenticatedUser] Bearer token verification failed via admin:", e?.message);
    }
  }

  // 2. Kiểm tra Session Cookie qua createServerClient()
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (!error && user) {
      return {
        user,
        adminClient,
        client: supabase,
        dbClient: adminClient || supabase,
      };
    }
  } catch (e: any) {
    console.warn("[getAuthenticatedUser] Cookie session check failed:", e?.message);
  }

  // 3. Fallback: Nếu có token nhưng adminClient chưa khởi tạo, thử xác thực qua supabase client chuẩn
  if (token) {
    try {
      const supabase = await createServerSupabase();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);
      if (!error && user) {
        return {
          user,
          adminClient,
          client: supabase,
          dbClient: adminClient || supabase,
        };
      }
    } catch {
      // ignore
    }
  }

  return {
    user: null,
    adminClient,
    client: null,
    dbClient: adminClient,
    error: "Yêu cầu đăng nhập để thực hiện thao tác này.",
  };
}
