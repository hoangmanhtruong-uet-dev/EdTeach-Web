"use client";

import "@/app/uiverse-login.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Zap,
  AlertCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [lockoutRemainingSec, setLockoutRemainingSec] = useState<number>(0);

  const MAX_FAILED_ATTEMPTS = 5;
  const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 phút
  const STORAGE_KEY_ATTEMPTS = "eduteach_login_failed_attempts";
  const STORAGE_KEY_LOCKED_UNTIL = "eduteach_login_locked_until";

  // Kiểm tra trạng thái khóa tạm thời khi mở trang
  useEffect(() => {
    if (typeof window === "undefined") return;
    const lockedUntilStr = localStorage.getItem(STORAGE_KEY_LOCKED_UNTIL);
    if (lockedUntilStr) {
      const lockedUntil = parseInt(lockedUntilStr, 10);
      const remaining = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
      if (remaining > 0) {
        setLockoutRemainingSec(remaining);
      } else {
        localStorage.removeItem(STORAGE_KEY_LOCKED_UNTIL);
        localStorage.removeItem(STORAGE_KEY_ATTEMPTS);
      }
    }
  }, []);

  // Đếm ngược thời gian khóa tạm thời
  useEffect(() => {
    if (lockoutRemainingSec <= 0) return;
    const interval = setInterval(() => {
      setLockoutRemainingSec((prev) => {
        if (prev <= 1) {
          if (typeof window !== "undefined") {
            localStorage.removeItem(STORAGE_KEY_LOCKED_UNTIL);
            localStorage.removeItem(STORAGE_KEY_ATTEMPTS);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutRemainingSec]);

  const supabase = createClient();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
      }
    } catch {
      setErrorMessage("Đã xảy ra lỗi khi kết nối với Google.");
      setIsLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setErrorMessage("Đăng nhập bằng Apple ID đang trong chế độ thử nghiệm sandbox. Vui lòng đăng nhập với Google hoặc Email.");
        setIsLoading(false);
      }
    } catch {
      setErrorMessage("Đã xảy ra lỗi khi kết nối với Apple.");
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutRemainingSec > 0) {
      const minutes = Math.ceil(lockoutRemainingSec / 60);
      setErrorMessage(
        `Tài khoản đang bị khóa tạm thời do nhập sai mật khẩu quá 5 lần. Vui lòng thử lại sau ${minutes} phút.`
      );
      return;
    }

    if (!email || !password) {
      setErrorMessage("Vui lòng điền đầy đủ email và mật khẩu.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const { data: authResult, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        let attempts = 0;
        if (typeof window !== "undefined") {
          attempts = parseInt(localStorage.getItem(STORAGE_KEY_ATTEMPTS) || "0", 10) + 1;
          localStorage.setItem(STORAGE_KEY_ATTEMPTS, String(attempts));

          if (attempts >= MAX_FAILED_ATTEMPTS) {
            const lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
            localStorage.setItem(STORAGE_KEY_LOCKED_UNTIL, String(lockedUntil));
            setLockoutRemainingSec(Math.ceil(LOCKOUT_DURATION_MS / 1000));
            setErrorMessage(
              "Bạn đã nhập sai thông tin 5 lần liên tiếp. Để bảo vệ tài khoản, chức năng đăng nhập bị tạm khóa trong 15 phút."
            );
            setIsLoading(false);
            return;
          }
        }

        const remainingAttempts = Math.max(0, MAX_FAILED_ATTEMPTS - attempts);
        setErrorMessage(
          error.message === "Invalid login credentials"
            ? `Email hoặc mật khẩu không chính xác. Bạn còn ${remainingAttempts} lần thử trước khi bị tạm khóa 15 phút.`
            : error.message
        );
        setIsLoading(false);
        return;
      }

      // Đăng nhập thành công -> Xóa dữ liệu lockout
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY_ATTEMPTS);
        localStorage.removeItem(STORAGE_KEY_LOCKED_UNTIL);
      }
      setLockoutRemainingSec(0);

      if (authResult?.user) {
        // Tự động kiểm tra vai trò (role) từ database để điều hướng chính xác
        const { data: userProfile } = await (supabase.from("users") as any)
          .select("role")
          .eq("id", authResult.user.id)
          .maybeSingle();

        if (userProfile?.role === "student") {
          router.push("/student");
        } else {
          router.push("/dashboard");
        }
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch {
      setErrorMessage("Đã có lỗi xảy ra trong quá trình đăng nhập.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#e8e8e8] dark:bg-slate-950 font-sans">
      {/* ======================================================== */}
      {/* LEFT COLUMN: BRAND HERO & SHOWCASE (Desktop only)       */}
      {/* ======================================================== */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-5/12 flex-col justify-between p-12 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white relative overflow-hidden border-r border-slate-800">
        {/* Subtle Ambient Background Gradients */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-32 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-105 transition duration-200">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-white">
                Edu<span className="text-blue-400">Test</span>
              </span>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">
                Tutor OS & Khảo Thí Thông Minh
              </p>
            </div>
          </Link>
        </div>

        {/* Unified Platform Showcase */}
        <div className="relative z-10 my-auto py-10 space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-semibold text-blue-300">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>AI Khảo thí Chuẩn GDPT 2025</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight text-white">
              Đơn giản hóa việc soạn đề & thi thử cho{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">
                Thầy Cô & Học Sinh
              </span>
            </h1>
            <p className="text-slate-300 text-sm xl:text-base leading-relaxed max-w-lg">
              Đăng nhập để truy cập công cụ soạn ma trận đề thi tự động, phòng thí nghiệm 3D mô phỏng, chấm trắc nghiệm điện thoại OMR tức thì và hỏi đáp gia sư AI 24/7.
            </p>
          </div>

          {/* Social Proof & Key Metric Cards */}
          <div className="grid grid-cols-2 gap-3.5 pt-2 max-w-lg">
            <div className="rounded-2xl bg-white/[0.06] backdrop-blur-md border border-white/10 p-4 transition hover:bg-white/[0.09]">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-2.5">
                <Zap className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-white">&lt; 3 Giây</div>
              <p className="text-xs text-slate-400 mt-0.5">Tốc độ chấm phiếu OMR di động bằng camera</p>
            </div>

            <div className="rounded-2xl bg-white/[0.06] backdrop-blur-md border border-white/10 p-4 transition hover:bg-white/[0.09]">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-2xl font-black text-white">Tích Xanh</div>
              <p className="text-xs text-slate-400 mt-0.5">Xác thực danh tính Giáo viên & Gia sư bằng AI Vision</p>
            </div>
          </div>

        </div>

        {/* Footer Meta */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 pt-6 border-t border-slate-800/80">
          <span>© 2025 - 2026 EduTest · MTD Studio</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> Chuẩn bảo mật SSL
            </span>
            <Link href="/settings?tab=guide" className="hover:text-white transition">
              Hướng dẫn
            </Link>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* RIGHT COLUMN: SINGLE UNIVERSAL UIVERSE LOGIN CARD       */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-10 py-10 overflow-y-auto">
        <div className="w-full max-w-[360px] space-y-3">
          {/* Mobile Brand Header */}
          <div className="lg:hidden text-center pb-1">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Edu<span className="text-primary">Test</span>
              </span>
            </Link>
          </div>

          {/* Error Message Box */}
          {errorMessage && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* UIVERSE FORM CONTAINER                                   */}
          {/* ======================================================== */}
          <div className="form-container">
            <h2 className="title">Chào mừng trở lại</h2>

            <form className="form" onSubmit={handleEmailLogin}>
              <div>
                <label htmlFor="login-email" className="sr-only">
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  className="input"
                  placeholder="Địa chỉ Email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="login-password" className="sr-only">
                  Mật khẩu
                </label>
                <input
                  id="login-password"
                  type="password"
                  className="input"
                  placeholder="Mật khẩu"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <p className="page-link">
                <Link href="/forgot-password" className="focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary rounded">
                  <span className="page-link-label">Quên mật khẩu?</span>
                </Link>
              </p>

              <button
                className="form-btn focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
                disabled={isLoading || lockoutRemainingSec > 0}
              >
                {lockoutRemainingSec > 0
                  ? `Tạm khóa (${Math.floor(lockoutRemainingSec / 60)}:${(lockoutRemainingSec % 60).toString().padStart(2, "0")})`
                  : isLoading
                  ? "Đang đăng nhập..."
                  : "Đăng nhập"}
              </button>
            </form>

            <p className="sign-up-label">
              Chưa có tài khoản?
              <Link href="/register" className="sign-up-link focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary rounded">
                Đăng ký ngay
              </Link>
            </p>

            <div className="buttons-container">
              <button
                type="button"
                className="apple-login-button focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                onClick={handleAppleLogin}
                disabled={isLoading}
                aria-label="Đăng nhập bằng tài khoản Apple"
              >
                <svg
                  stroke="currentColor"
                  fill="currentColor"
                  strokeWidth="0"
                  className="apple-icon"
                  viewBox="0 0 1024 1024"
                  height="1em"
                  width="1em"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path d="M747.4 535.7c-.4-68.2 30.5-119.6 92.9-157.5-34.9-50-87.7-77.5-157.3-82.8-65.9-5.2-138 38.4-164.4 38.4-27.9 0-91.7-36.6-141.9-36.6C273.1 298.8 163 379.8 163 544.6c0 48.7 8.9 99 26.7 150.8 23.8 68.2 109.6 235.3 199.1 232.6 46.8-1.1 79.9-33.2 140.8-33.2 59.1 0 89.7 33.2 141.9 33.2 90.3-1.3 167.9-153.2 190.5-221.6-121.1-57.1-114.6-167.2-114.6-170.7zm-105.1-305c50.7-60.2 46.1-115 44.6-134.7-44.8 2.6-96.6 30.5-126.1 64.8-32.5 36.8-51.6 82.3-47.5 133.6 48.4 3.7 92.6-21.2 129-63.7z" />
                </svg>
                <span>Đăng nhập với Apple</span>
              </button>

              <button
                type="button"
                className="google-login-button focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                aria-label="Đăng nhập bằng tài khoản Google"
              >
                <svg
                  stroke="currentColor"
                  fill="currentColor"
                  strokeWidth="0"
                  version="1.1"
                  x="0px"
                  y="0px"
                  className="google-icon"
                  viewBox="0 0 48 48"
                  height="1em"
                  width="1em"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    fill="#FFC107"
                    d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24 c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                  />
                  <path
                    fill="#FF3D00"
                    d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657 C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                  />
                  <path
                    fill="#4CAF50"
                    d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36 c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                  />
                  <path
                    fill="#1976D2"
                    d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571 c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                  />
                </svg>
                <span>Đăng nhập với Google</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
