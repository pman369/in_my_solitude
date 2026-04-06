import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input:  "hsl(var(--input))",
        ring:   "hsl(var(--ring))",

        // ── Brand colours ──────────────────────────────
        gold:    "#C9A84C",
        violet:  "#7C3AED",
        crimson: "#991B1B",

        // ── Semantic surface colours ───────────────────
        "bg-primary":   "#0D0D0D",
        "bg-secondary": "#141414",
        "bg-elevated":  "#1A1A1A",
        "text-primary": "#F0EDE6",
        "text-secondary": "#9A9088",
      },
      fontFamily: {
        heading: ["Playfair Display", "Georgia", "serif"],
        body:    ["Inter", "system-ui", "sans-serif"],
        mono:    ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        "glow-gold":  "0 0 20px rgba(201, 168, 76, 0.15)",
        "glow-gold-lg": "0 0 40px rgba(201, 168, 76, 0.25)",
        "glow-vault": "0 0 30px rgba(153, 27, 27, 0.2)",
        card:         "0 4px 24px rgba(0,0,0,0.4)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        "panel-reveal": "panelReveal 0.3s ease forwards",
        "blink":        "blink 1s step-end infinite",
        "thinking":     "thinking 1.2s ease-in-out infinite",
        "fade-up":      "fadeUp 0.6s ease forwards",
        "shimmer":      "shimmer 2s linear infinite",
      },
      keyframes: {
        panelReveal: {
          from: { opacity: "0", transform: "translateY(16px) scale(0.98)" },
          to:   { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0" },
        },
        thinking: {
          "0%, 80%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "40%":           { opacity: "1",   transform: "scale(1.2)" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          from: { backgroundPosition: "-400px 0" },
          to:   { backgroundPosition: "400px 0" },
        },
      },
      backgroundImage: {
        "gradient-radial":    "radial-gradient(var(--tw-gradient-stops))",
        "gradient-gold":      "linear-gradient(135deg, #C9A84C 0%, #a8813a 100%)",
        "gradient-vault":     "radial-gradient(ellipse at center, rgba(153,27,27,0.1) 0%, transparent 70%)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
