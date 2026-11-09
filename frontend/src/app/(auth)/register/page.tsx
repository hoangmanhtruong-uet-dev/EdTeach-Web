"use client";

import "@/app/uiverse-form.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Sparkles,
  CheckCircle2,
  GraduationCap,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  Gift,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { REFERRAL_BONUS_CREDITS } from "@/lib/constants";

type RoleType = "student" | "teacher" | "tutor";

export default function RegisterPage() {
  const router = useRouter();
  const [activeRole, setActiveRole] = useState<RoleType>("student");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  
  // Uiverse form fields: Firstname, Lastname, Email, Password, Confirm password
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Consent checkboxes per Decree 13/2023/ND-CP - strictly un-checked by default
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [refCode, setRefCode] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get("ref") || localStorage.getItem("edutest_ref_code");
      if (ref) {
        setRefCode(ref);
        localStorage.setItem("edutest_ref_code", ref);
      }
      const roleParam = urlParams.get("role")?.toLowerCase();
      if (roleParam === "teacher" || roleParam === "tutor" || roleParam === "student") {
        setActiveRole(roleParam as RoleType);
      }
    }
  }, []);

  const supabase = createClient();

  const setTargetRoleCookie = (role: RoleType) => {
    if (typeof document !== "undefined") {
      document.cookie = `eduteach_target_role=${role}; path=/; max-age=3600; SameSite=Lax`;
    }
  };

  const handleGoogleRegister = async () => {
    if (!agreeTerms || !agreePrivacy) {
      setErrorMessage("Vui lòng tích chọn đồng ý với Điều khoản dịch vụ và Chính sách bảo mật (Nghị định 13/2023/NĐ-CP) ở biểu mẫu bên dưới trước khi đăng ký bằng Google.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setTargetRoleCookie(activeRole);

    const redirectPath =
      activeRole === "student"
        ? "/student"
        : activeRole === "teacher"
        ? "/verify/teacher"
        : "/verify/tutor";

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${redirectPath}`,
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!fullName) {
      setErrorMessage("Vui lòng điền đầy đủ Họ và Tên của bạn.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Mật khẩu phải chứa ít nhất 6 ký tự.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Mật khẩu và xác nhận mật khẩu không trùng khớp.");
      return;
    }

    if (!agreeTerms || !agreePrivacy) {
      setErrorMessage("Vui lòng tích chọn đồng ý với cả Điều khoản sử dụng dịch vụ và Chính sách bảo mật (Nghị định 13/2023/NĐ-CP).");
      return;
    }

    setIsLoading(true);
    setLoadingStep("Đang khởi tạo tài khoản...");
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const targetPath =
        activeRole === "student"
          ? "/student"
          : activeRole === "teacher"
          ? "/verify/teacher"
          : "/verify/tutor";

      // 0. Kiểm tra xem email này đã tồn tại trong hệ thống chưa (tránh ghi đè vai trò cũ)
      const cleanEmail = email.trim().toLowerCase();
      try {
        const { data: existingUser } = await (supabase.from("users") as any)
          .select("id, role, name")
          .eq("email", cleanEmail)
          .maybeSingle();

        if (existingUser) {
          const roleLabel =
            existingUser.role === "teacher"
              ? "Giáo viên"
              : existingUser.role === "tutor"
              ? "Gia sư"
              : "Học sinh";
          setErrorMessage(
            `Email "${cleanEmail}" đã được đăng ký tài khoản với vai trò ${roleLabel}. Vui lòng đăng nhập bằng tài khoản này để tiếp tục.`
          );
          setIsLoading(false);
          return;
        }
      } catch (checkErr) {
        console.warn("Email pre-check note:", checkErr);
      }

      // 1. Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName,
            first_name: firstName,
            last_name: lastName,
            role: activeRole,
            referral_code: refCode || undefined,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${targetPath}`,
        },
      });

      if (authError) {
        if (authError.message?.toLowerCase().includes("already registered") || authError.message?.toLowerCase().includes("user already")) {
          setErrorMessage("Email này đã được đăng ký tài khoản trong hệ thống. Vui lòng bấm Đăng nhập bên dưới.");
        } else {
          setErrorMessage(authError.message);
        }
        setIsLoading(false);
        return;
      }

      const userId = authData.user?.id;
      if (!userId) {
        setSuccessMessage("Đăng ký thành công! Vui lòng kiểm tra email để kích hoạt tài khoản.");
        setIsLoading(false);
        return;
      }

      // Sync role to public.users table immediately
      try {
        await (supabase.from("users") as any).upsert(
          {
            id: userId,
            email,
            name: fullName,
            role: activeRole,
            tier: "free",
          },
          { onConflict: "id" }
        );
      } catch (upsertErr) {
        console.warn("User upsert non-blocking warning:", upsertErr);
      }

      // 2. Redirect to destination
      if (authData.session) {
        router.push(targetPath);
        router.refresh();
      } else {
        setSuccessMessage(
          "Tài khoản đã được tạo thành công! " +
          (activeRole !== "student"
            ? "Vui lòng xác nhận email để kích hoạt, sau đó bạn có thể tiến hành xác thực chuyên môn tại " +
              (activeRole === "teacher" ? "/verify/teacher" : "/verify/tutor") + "."
            : "Vui lòng kiểm tra hộp thư email để kích hoạt tài khoản trước khi đăng nhập.")
        );
        setIsLoading(false);
      }
    } catch {
      setErrorMessage("Có lỗi xảy ra trong quá trình đăng ký. Vui lòng thử lại.");
      setIsLoading(false);
    }
  };

  // Role Theme styling based on Uiverse pulse dot & royalblue
  const getRoleTheme = () => {
    switch (activeRole) {
      case "student":
        return {
          color: "#10b981", // emerald
          hover: "#059669",
          title: "Register as Student",
          message: "Signup now and get full access to our app.",
          buttonLabel: "Submit",
        };
      case "teacher":
        return {
          color: "#2563eb", // royalblue
          hover: "#1d4ed8",
          title: "Register as Teacher",
          message: "Signup now and get full access to our app.",
          buttonLabel: "Submit",
        };
      case "tutor":
        return {
          color: "#7c3aed", // violet
          hover: "#6d28d9",
          title: "Register as Tutor",
          message: "Signup now and get full access to our app.",
          buttonLabel: "Submit",
        };
    }
  };

  const theme = getRoleTheme();

  return (
    <div className="min-h-screen w-full flex bg-[#e8e8e8] dark:bg-slate-950 font-sans">
      {/* ======================================================== */}
      {/* LEFT COLUMN: DYNAMIC ROLE SHOWCASE (Desktop only)       */}
      {/* ======================================================== */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-5/12 flex-col justify-between p-12 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white relative overflow-hidden border-r border-slate-800">
        {/* Ambient Lights */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
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

        {/* Dynamic Showcase based on Active Role */}
        <div className="relative z-10 my-auto py-8 space-y-7">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-bold text-white shadow-sm">
            {activeRole === "student" && (
              <>
                <GraduationCap className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300">Cổng Học Sinh Tự Luyện & Thi Thử</span>
              </>
            )}
            {activeRole === "teacher" && (
              <>
                <UserCheck className="w-4 h-4 text-blue-400" />
                <span className="text-blue-300">Hệ Sinh Thái Khảo Thí Giáo Viên</span>
              </>
            )}
            {activeRole === "tutor" && (
              <>
                <ShieldCheck className="w-4 h-4 text-violet-400" />
                <span className="text-violet-300">Không Gian Làm Việc Gia Sư Sư Phạm</span>
              </>
            )}
          </div>

          <div className="space-y-3.5">
            {activeRole === "student" && (
              <>
                <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  Tự tin bứt phá điểm số với{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-300">
                    Trợ lý Gia sư AI 24/7
                  </span>
                </h1>
                <p className="text-slate-300 text-sm leading-relaxed max-w-lg">
                  Luyện thi trắc nghiệm theo chuẩn cấu trúc mới của Bộ GD&ĐT, phân tích lỗ hổng kiến thức tức thì và tham gia phòng thi trực tuyến miễn phí trọn đời.
                </p>
              </>
            )}

            {activeRole === "teacher" && (
              <>
                <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  Soạn đề chuẩn ma trận & chấm trắc nghiệm di động{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">
                    chỉ trong 3 giây
                  </span>
                </h1>
                <p className="text-slate-300 text-sm leading-relaxed max-w-lg">
                  Tạo đề thi 4 cấp độ tư duy, xuất file Word chuẩn Bộ, chấm bài thi OMR bằng camera điện thoại và bảo vệ bản quyền giáo án với Tích Xanh chính chủ.
                </p>
              </>
            )}

            {activeRole === "tutor" && (
              <>
                <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  Nâng tầm uy tín giảng dạy với{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-300 to-pink-300">
                    Huy hiệu Gia Sư Xác Thực
                  </span>
                </h1>
                <p className="text-slate-300 text-sm leading-relaxed max-w-lg">
                  Đối soát danh tính 1:1 qua Thẻ sinh viên và CCCD, mở khóa công cụ cá nhân hóa lộ trình học cho học sinh và tặng ngay +10.000 Credits khởi đầu.
                </p>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1 max-w-lg">
            {activeRole === "student" ? (
              <>
                <div className="rounded-2xl bg-white/[0.06] backdrop-blur-md border border-white/10 p-3.5">
                  <div className="text-2xl font-black text-emerald-400">100% Free</div>
                  <p className="text-xs text-slate-300 mt-1">Truy cập ngân hàng câu hỏi & phòng thi trực tiếp</p>
                </div>
                <div className="rounded-2xl bg-white/[0.06] backdrop-blur-md border border-white/10 p-3.5">
                  <div className="text-2xl font-black text-teal-400">AI Tutor</div>
                  <p className="text-xs text-slate-300 mt-1">Giải chi tiết & gợi ý cách khắc phục câu sai</p>
                </div>
              </>
            ) : activeRole === "teacher" ? (
              <>
                <div className="rounded-2xl bg-white/[0.06] backdrop-blur-md border border-white/10 p-3.5">
                  <div className="text-2xl font-black text-blue-400">+10.000</div>
                  <p className="text-xs text-slate-300 mt-1">Credits tặng ngay khi xác thực thẻ ngành</p>
                </div>
                <div className="rounded-2xl bg-white/[0.06] backdrop-blur-md border border-white/10 p-3.5">
                  <div className="text-2xl font-black text-indigo-400">Tích Xanh</div>
                  <p className="text-xs text-slate-300 mt-1">Huy hiệu xác thực danh tính Giáo viên</p>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-2xl bg-white/[0.06] backdrop-blur-md border border-white/10 p-3.5">
                  <div className="text-2xl font-black text-violet-400">Đối Soát 1:1</div>
                  <p className="text-xs text-slate-300 mt-1">AI Vision đối soát Thẻ SV và CCCD</p>
                </div>
                <div className="rounded-2xl bg-white/[0.06] backdrop-blur-md border border-white/10 p-3.5">
                  <div className="text-2xl font-black text-fuchsia-400">+10.000</div>
                  <p className="text-xs text-slate-300 mt-1">Credits tạo tài liệu giảng dạy riêng</p>
                </div>
              </>
            )}
          </div>

          <div className="rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 p-4 max-w-lg space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Nền Tảng Sư Phạm Chuẩn Quy Chuẩn Bộ GD&ĐT</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Soạn đề GDPT 2025 chuẩn ma trận BGD</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Chấm trắc nghiệm tự động bằng camera</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Xuất phôi Word định dạng chuẩn đẹp</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Bảo vệ dữ liệu chuẩn Nghị định 13/2023</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 pt-6 border-t border-slate-800/80">
          <span>© 2025 - 2026 EduTest · MTD Studio</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> Chuẩn bảo mật SSL
            </span>
            <Link href="/terms" className="hover:text-white transition">
              Điều khoản
            </Link>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* RIGHT COLUMN: UIVERSE FORM INTERACTION                   */}
      {/* ======================================================== */}
      <div
        className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-10 py-10 overflow-y-auto"
        style={{
          "--uiverse-color": theme.color,
          "--uiverse-hover": theme.hover,
        } as React.CSSProperties}
      >
        <div className="w-full max-w-[380px] space-y-4">
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

          {/* Interactive Role Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <button
              type="button"
              onClick={() => {
                setActiveRole("student");
                setErrorMessage("");
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeRole === "student"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 shrink-0" />
              <span>Học sinh</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveRole("teacher");
                setErrorMessage("");
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeRole === "teacher"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Giáo viên</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveRole("tutor");
                setErrorMessage("");
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                activeRole === "tutor"
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Gia sư</span>
            </button>
          </div>

          {/* Referral Badge */}
          {refCode && (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300 font-medium">
              <Gift className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                Mã giới thiệu: <strong>{refCode}</strong> (+{REFERRAL_BONUS_CREDITS.toLocaleString("vi-VN")} Credits)
              </span>
            </div>
          )}

          {/* Error / Success Alert Box */}
          {errorMessage && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-700 dark:text-emerald-400 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* UIVERSE FORM: EXACT STRUCTURE FROM YAYA12085            */}
          {/* ======================================================== */}
          <form className="uiverse-form" onSubmit={handleRegister}>
            {/* Title with Pulsating Dot */}
            <p className="uiverse-title">{theme.title}</p>
            <p className="uiverse-message">{theme.message}</p>

            {/* Quick Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleRegister}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer shadow-xs disabled:opacity-50 mt-1"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span>Đăng ký nhanh với Google</span>
            </button>

            <div className="relative my-0.5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-white dark:bg-slate-900 px-2 text-slate-400 font-medium">
                  Hoặc điền biểu mẫu
                </span>
              </div>
            </div>

            {/* Firstname & Lastname in .uiverse-flex */}
            <div className="uiverse-flex">
              <label>
                <input
                  required
                  placeholder=" "
                  type="text"
                  className="uiverse-input"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name"
                />
                <span>Họ & tên đệm</span>
              </label>

              <label>
                <input
                  required
                  placeholder=" "
                  type="text"
                  className="uiverse-input"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  autoComplete="family-name"
                />
                <span>Tên</span>
              </label>
            </div>

            {/* Email */}
            <label>
              <input
                required
                placeholder=" "
                type="email"
                className="uiverse-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              <span>Địa chỉ Email</span>
            </label>

            {/* Password */}
            <label>
              <input
                required
                placeholder=" "
                type="password"
                className="uiverse-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <span>Mật khẩu</span>
            </label>

            {/* Confirm password */}
            <label>
              <input
                required
                placeholder=" "
                type="password"
                className="uiverse-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
              <span>Xác nhận mật khẩu</span>
            </label>

            {/* Notice of Purpose per Decree 13/2023/ND-CP */}
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-2.5 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
              <p className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                Mục đích thu thập dữ liệu (Nghị định 13/2023/NĐ-CP)
              </p>
              <p className="leading-relaxed">
                EdTeach chỉ thu thập Họ tên và Email nhằm định danh tài khoản, bảo vệ phiên đăng nhập và xuất phôi đề thi sư phạm theo yêu cầu của Thầy/Cô.
              </p>
            </div>

            {/* Terms and Privacy Checkboxes (Unbundled & Un-checked by Default) */}
            <div className="space-y-2 py-1">
              <label className="flex items-start gap-2.5 text-xs cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-primary focus:ring-primary cursor-pointer shrink-0"
                />
                <span className="text-slate-600 dark:text-slate-300 text-xs leading-normal">
                  Tôi đồng ý với{" "}
                  <Link href="/terms" target="_blank" className="text-primary hover:underline font-bold">
                    Điều khoản sử dụng dịch vụ EdTeach
                  </Link>
                  .
                </span>
              </label>

              <label className="flex items-start gap-2.5 text-xs cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={agreePrivacy}
                  onChange={(e) => setAgreePrivacy(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-primary focus:ring-primary cursor-pointer shrink-0"
                />
                <span className="text-slate-600 dark:text-slate-300 text-xs leading-normal">
                  Tôi đã đọc, hiểu rõ{" "}
                  <Link href="/privacy" target="_blank" className="text-primary hover:underline font-bold">
                    Chính sách bảo mật
                  </Link>{" "}
                  và đồng ý cho phép EduTest xử lý dữ liệu cá nhân của tôi theo Nghị định 13/2023/NĐ-CP.
                </span>
              </label>
            </div>

            {/* Loading step */}
            {isLoading && loadingStep && (
              <div className="rounded-lg bg-primary/10 p-2.5 text-xs text-primary font-medium flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span>{loadingStep}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="uiverse-submit min-h-[44px] cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <span>{isLoading ? "Đang xử lý..." : "Tạo tài khoản"}</span>
            </button>

            {/* Signin Link */}
            <p className="uiverse-signin">
              Đã có tài khoản?{" "}
              <Link href="/login" className="font-bold hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary rounded">
                Đăng nhập ngay
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
