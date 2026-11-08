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
