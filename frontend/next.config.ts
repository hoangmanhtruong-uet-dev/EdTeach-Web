import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "",
  },
  devIndicators: false,
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
  turbopack: {
    root: path.resolve(__dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  experimental: {
    agentUpgrade: "security" as any,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https://*.supabase.co https://img.vietqr.io https://api.vietqr.io https://*.googleusercontent.com https://lh3.googleusercontent.com",
              `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://generativelanguage.googleapis.com ${process.env.NODE_ENV !== "production" ? "http://localhost:8000 " : ""}https://api.vietqr.io https://va.vercel-scripts.com https://*.vercel-insights.com`,
              "frame-src 'self' https://phet.colorado.edu",
              "frame-ancestors 'self'",
              "object-src 'none'",
              "base-uri 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/labs/courses/index.html",
        destination: "/labs",
        permanent: true,
      },
      {
        source: "/labs/courses",
        destination: "/labs",
        permanent: true,
      },
      // Consolidated settings tabs redirects (HTTP 308)
      {
        source: "/pricing",
        destination: "/settings?tab=plan",
        permanent: true,
      },
      {
        source: "/wallet",
        destination: "/settings?tab=credits",
        permanent: true,
      },
      {
        source: "/topup",
        destination: "/settings?tab=credits",
        permanent: true,
      },
      {
        source: "/credits",
        destination: "/settings?tab=credits",
        permanent: true,
      },
      {
        source: "/affiliate",
        destination: "/settings?tab=partner",
        permanent: true,
      },
      {
        source: "/partners",
        destination: "/settings?tab=partner",
        permanent: true,
      },
      {
        source: "/guide",
        destination: "/settings?tab=guide",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
