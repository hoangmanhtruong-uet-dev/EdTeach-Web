import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  turbopack: {
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
    ];
  },
};

export default nextConfig;
