import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import { ToastProvider } from "@/context/toast-context";
import { ConfirmDialogProvider } from "@/context/confirm-dialog-context";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ReferralTracker } from "@/components/referral/referral-tracker";
import { APP_URL } from "@/lib/constants";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: "EduTest AI - Tạo đề thi tự động bằng AI",
  description:
    "Nền tảng tạo đề thi trắc nghiệm và tự luận tự động bằng AI dành cho giáo viên Việt Nam. Tiết kiệm thời gian, nâng cao chất lượng.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('app_theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AuthProvider>
          <ToastProvider>
            <ConfirmDialogProvider>
              <Suspense fallback={null}>
                <ReferralTracker />
              </Suspense>
              {children}
              <Analytics />
              <SpeedInsights />
            </ConfirmDialogProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
