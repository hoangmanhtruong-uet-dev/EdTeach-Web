"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, ShieldCheck, Check, X, ExternalLink } from "lucide-react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export function CookieConsentBanner() {
  const [consent, setConsent] = useState<"accepted" | "essential" | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    try {
      const match = document.cookie.match(/(?:^|;\s*)eduteach_cookie_consent=([^;]*)/);
      const consentVal = match ? match[1] : null;

      if (consentVal === "accepted") {
        setConsent("accepted");
        setShowBanner(false);
      } else if (consentVal === "essential") {
        setConsent("essential");
        setShowBanner(false);
      } else {
        // No consent recorded yet -> show consent banner and block analytics
        setShowBanner(true);
      }
    } catch {
      setShowBanner(true);
    }
  }, []);

  const handleAcceptAll = () => {
    // Set cookie: accepted, 1 year duration, SameSite=Lax, Secure
    const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
    const secureFlag = isHttps ? "; Secure" : "";
    document.cookie = `eduteach_cookie_consent=accepted; Path=/; Max-Age=31536000; SameSite=Lax${secureFlag}`;
    try {
      localStorage.setItem("eduteach_cookie_consent", "accepted");
    } catch {}
    setConsent("accepted");
    setShowBanner(false);
  };

  const handleEssentialOnly = () => {
    // Set cookie: essential only, 1 year duration, SameSite=Lax, Secure
    const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
    const secureFlag = isHttps ? "; Secure" : "";
    document.cookie = `eduteach_cookie_consent=essential; Path=/; Max-Age=31536000; SameSite=Lax${secureFlag}`;
    try {
      localStorage.setItem("eduteach_cookie_consent", "essential");
    } catch {}
    setConsent("essential");
    setShowBanner(false);
  };

  if (!hasMounted) {
    return null;
  }

  return (
    <>
      {/* Active Tracking Blocking: Only load Vercel Analytics and Speed Insights if consent is accepted */}
      {consent === "accepted" && (
        <>
          <Analytics />
          <SpeedInsights />
        </>
      )}

      {/* Cookie Consent Banner */}
      {showBanner && (
        <aside
          role="region"
          aria-label="Tùy chọn Cookie và Bảo vệ Dữ liệu"
          className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-5 bg-card/95 text-card-foreground backdrop-blur-md border-t border-border shadow-2xl animate-in fade-in slide-in-from-bottom duration-300"
        >
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 max-w-4xl">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <Cookie className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs sm:text-sm font-bold text-foreground">
                    Thông báo về Cookie & Quyền riêng tư
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                    <ShieldCheck className="w-3 h-3" />
                    Nghị định 13/2023/NĐ-CP
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Chúng tôi sử dụng cookie cần thiết để vận hành hệ thống và cookie phân tích nhằm cải thiện trải nghiệm của bạn theo Nghị định 13/2023/NĐ-CP. Thầy/Cô có toàn quyền lựa chọn chỉ sử dụng cookie thiết yếu hoặc đồng ý cho phép đo lường hiệu năng.
                </p>
                <div className="pt-0.5">
                  <Link
                    href="/cookies"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                  >
                    Xem chi tiết Chính sách Cookie & Bảng tra cứu
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 pt-2 lg:pt-0">
              <button
                type="button"
                onClick={handleEssentialOnly}
                className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-xl border border-border bg-background hover:bg-muted text-foreground transition cursor-pointer shadow-xs whitespace-nowrap"
              >
                Chỉ dùng cookie thiết yếu
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-xs cursor-pointer whitespace-nowrap"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Chấp nhận tất cả</span>
              </button>
            </div>
          </div>
        </aside>
      )}
    </>
  );
}
