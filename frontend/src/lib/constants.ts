/**
 * Centralized Platform Constants & Configuration
 * EdTeach / EduTest AI - Production Hardening
 */

// Canonical Application Domain
export const DEFAULT_APP_URL = "https://ed-teach-rust.vercel.app";

const rawAppUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (typeof window !== "undefined" ? window.location.origin : DEFAULT_APP_URL);

/**
 * Standardized Canonical Application URL.
 * Always stripped of trailing slashes.
 */
export const APP_URL: string = rawAppUrl.replace(/\/+$/, "");

/**
 * Resolves a dynamic base URL from an incoming Next.js Request (handling reverse proxy headers)
 * with graceful fallback to APP_URL.
 */
export function getBaseUrl(
  req?: Request | { headers: Headers | { get(name: string): string | null } }
): string {
  if (req && "headers" in req) {
    const forwardedHost =
      req.headers.get("x-forwarded-host") || req.headers.get("host");
    if (forwardedHost) {
      const forwardedProto =
        req.headers.get("x-forwarded-proto") ||
        (forwardedHost.includes("localhost") ? "http" : "https");
      return `${forwardedProto}://${forwardedHost}`.replace(/\/+$/, "");
    }
  }
  return APP_URL;
}

/**
 * Constructs a fully qualified URL for a given relative path.
 */
export function getAppUrl(path: string = ""): string {
  if (!path) return APP_URL;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${APP_URL}${cleanPath}`;
}

// Business Logic Constants
export const MINIMUM_PAYOUT_VND = 200000;
export const SUPPORT_EMAIL = "developerhoangtruong@gmail.com";
export const REFERRAL_BONUS_CREDITS = 2000;

// Branding & Administrative Constants
export const PLATFORM_NAME = "EduTest";
export const PLATFORM_SHORT_NAME = "EdTeach";
export const MASTER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || process.env.ADMIN_EMAIL || "admin@edteach.vn";
export const ADMIN_EMAIL_DOMAIN = process.env.NEXT_PUBLIC_ADMIN_EMAIL_DOMAIN || "@admin.edteach.vn";

// Credits & Economics Constants
export const MARKETPLACE_CREDIT_RATE_VND = 100; // 1 Credit = 100 VNĐ
export const EXAM_GENERATION_CREDIT_COST = 500;

// Marketplace Commission Rates (Free: 80%, PRO: 90%, MAX VIP: 95%)
export const MARKETPLACE_COMMISSION_TIERS = {
  free: { label: "Free", platformFee: 0.20, authorShare: 0.80, authorPercent: "80%" },
  pro: { label: "PRO", platformFee: 0.10, authorShare: 0.90, authorPercent: "90%" },
  max: { label: "MAX", platformFee: 0.05, authorShare: 0.95, authorPercent: "95%" },
} as const;

// Student Portal & AI Tutor Constants (PR 3.1 / RC-08 / STU-08)
export const DAILY_STUDENT_AI_QUOTA = 3; // 3 lượt/ngày/học sinh (GMT+7)
export const STUDENT_AI_DAILY_LIMIT = 3;
export const DEFAULT_EXAM_GRACE_PERIOD_SECONDS = 60; // 60s độ trễ mạng khi nộp bài
export const EXAM_GRACE_PERIOD_SECONDS = 60;
export const DEFAULT_JOIN_CODE_HOURS = 72; // Mã lớp học có hiệu lực mặc định 72 giờ
export const AI_TUTOR_CREDIT_COST = 50; // Trừ credits ví giáo viên cho mỗi lượt gia sư AI

