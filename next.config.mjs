import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Compression ────────────────────────────────────────────────────────────
  compress: true,

  // ── Image Optimization ─────────────────────────────────────────────────────
  images: {
    // Scope to Supabase and known CDN hostnames only
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.supabase.in" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
    // Prefer WebP (broad support) before AVIF (encoding is slower at runtime)
    formats: ["image/webp", "image/avif"],
    // Cache optimised images for 30 days
    minimumCacheTTL: 2592000,
    // Only generate sizes the library grid actually needs
    deviceSizes: [640, 828, 1080, 1200, 1920],
    imageSizes: [96, 128, 256, 400],
    // Disable blur placeholder generation (not used; saves CPU on build)
    dangerouslyAllowSVG: false,
  },

  // ── Compiler ───────────────────────────────────────────────────────────────
  compiler: {
    removeConsole: process.env.NODE_ENV === "production"
      ? { exclude: ["warn", "error"] }
      : false,
  },

  // ── Turbopack root (silences lockfile warning) ─────────────────────────────
  turbopack: {
    root: __dirname,
  },

  // ── Experimental ──────────────────────────────────────────────────────────
  experimental: {
    // Optimistic client cache — instant back/forward navigation
    staleTimes: {
      dynamic: 60,   // reuse dynamic pages for 60 s
      static: 300,   // reuse static pages for 5 min
    },
    // Inline critical CSS to eliminate render-blocking stylesheets
    optimizeCss: true,
    // Prefetch linked pages in the background
    optimisticClientCache: true,
  },

  // ── HTTP Headers ──────────────────────────────────────────────────────────
  async headers() {
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "X-DNS-Prefetch-Control", value: "on" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
    ];

    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // Immutable static chunks — 1 year
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Book cover images — 30 days + SWR
        source: "/(.*)\\.(ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|otf)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" },
        ],
      },
      {
        // API routes — no browser cache, allow CDN to cache for 30 s
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=30, stale-while-revalidate=60" },
        ],
      },
    ];
  },
};

export default nextConfig;
