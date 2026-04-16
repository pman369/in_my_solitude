/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Image Optimization ─────────────────────────────────────────────────────
  images: {
    // Allow external image domains used for book covers
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
    // Generate modern formats automatically
    formats: ["image/avif", "image/webp"],
    // Cache optimised images for 30 days
    minimumCacheTTL: 2592000,
    // Don't serve images larger than needed
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // ── Compiler ───────────────────────────────────────────────────────────────
  compiler: {
    // Remove console.log calls in production (keep warn/error)
    removeConsole: process.env.NODE_ENV === "production"
      ? { exclude: ["warn", "error"] }
      : false,
  },

  // ── Experimental ──────────────────────────────────────────────────────────
  experimental: {
    // Enable optimistic client cache (faster navigation)
    staleTimes: {
      dynamic: 30,   // reuse dynamic-rendered pages for 30 s
      static: 180,   // reuse static pages for 3 min
    },
  },

  // ── HTTP Headers ──────────────────────────────────────────────────────────
  async headers() {
    return [
      {
        // Cache immutable static chunks for 1 year
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Cache public assets for 30 days
        source: "/(.*)\\.(ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|otf)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=2592000, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

