import type { NextConfig } from "next";

let supabaseHost: string | undefined;
try {
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (u) supabaseHost = new URL(u).hostname;
} catch {
  supabaseHost = undefined;
}

/** Tarayıcı ve arama motorlarına HTTPS / güvenlik sinyali (Safe Browsing tamamen ayrı süreçtir). */
const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload"
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  }
];

const nextConfig: NextConfig = {
  /** Google arama sonuçları favicon için çoğunlukla `/favicon.ico` ister; 200 + görsel dönmeli (404 küre ikonuna yol açar). */
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/icon.png" }];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      ...(supabaseHost
        ? [{ protocol: "https" as const, hostname: supabaseHost }]
        : [])
    ]
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders
      }
    ];
  }
};

export default nextConfig;
