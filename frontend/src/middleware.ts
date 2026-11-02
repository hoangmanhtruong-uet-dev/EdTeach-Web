import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { Database } from "@/types/database";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/exams") ||
    pathname.startsWith("/teach") ||
    (pathname.startsWith("/grading") && !pathname.startsWith("/grading/submit")) ||
    pathname.startsWith("/wallet") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/student") ||
    (pathname.startsWith("/labs") && !pathname.startsWith("/labs/courses/") && !pathname.startsWith("/labs/covers/")) ||
    pathname.startsWith("/marketplace") ||
    pathname.startsWith("/whiteboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/affiliate");

  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/register");

  // Nếu chưa đăng nhập và truy cập các trang được bảo vệ -> Chuyển về /login?redirectTo=...
  if (!user && isProtectedRoute) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectTo", pathname);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Nếu đã đăng nhập và truy cập trang /login hoặc /register -> Chuyển vào trang đích hoặc /dashboard
  if (user && isAuthRoute) {
    const destination =
      request.nextUrl.searchParams.get("redirectTo") ||
      request.nextUrl.searchParams.get("next");
    if (destination && destination.startsWith("/") && !destination.startsWith("//")) {
      return NextResponse.redirect(new URL(destination, request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/exams/:path*",
    "/teach/:path*",
    "/grading/:path*",
    "/wallet/:path*",
    "/settings/:path*",
    "/student/:path*",
    "/labs/:path*",
    "/marketplace/:path*",
    "/whiteboard/:path*",
    "/admin/:path*",
    "/affiliate/:path*",
    "/login",
    "/register",
  ],
};