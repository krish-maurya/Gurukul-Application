import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gurukul: {
          // Legacy aliases (kept for backward compat with any untouched code)
          dark: "#111312",
          tech: "#1e3a8a",
          ocean: "#687170",
          gray: "rgba(17, 19, 18, 0.10)",
          white: "#f4f5f7",
          surface: "#ffffff",
          muted: "#9aa3a1",
          accent: "#1e3a8a",
          highlight: "#f0f2f5",

          // New classic-warm design tokens
          canvas: "#f4f5f7",
          soft: "#f0f2f5",
          hover: "#f7f8fa",
          ink: "#111312",
          faint: "#9aa3a1",
          line: "rgba(17, 19, 18, 0.10)",
          lineStrong: "rgba(17, 19, 18, 0.15)",
          accentSoft: "#e9edff",
          accentText: "#172a66",
          green: "#0b9f6e",
          greenSoft: "#e6f8f1",
          greenText: "#087f58",
          amber: "#b7791f",
          amberSoft: "#fff6e0",
          amberText: "#8a5a10",
          red: "#b91c1c",
          redSoft: "#fef2f2",
          redText: "#7f1d1d",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        display: [
          "var(--font-syne)",
          "Syne",
          "Inter",
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(15, 23, 42, 0.04)",
        card: "0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px 0 rgba(15, 23, 42, 0.03)",
        floating:
          "0 4px 12px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.04)",
        modal:
          "0 8px 30px rgba(15, 23, 42, 0.12), 0 4px 8px rgba(15, 23, 42, 0.06)",
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
      },
      keyframes: {
        "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-down": {
          "0%": { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "tab-fade": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "check-pop": {
          "0%": { opacity: "0", transform: "scale(0.3)" },
          "70%": { opacity: "1", transform: "scale(1.1)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "dot-bounce": {
          "0%, 60%, 100%": { transform: "translateY(0)", opacity: "0.4" },
          "30%": { transform: "translateY(-4px)", opacity: "1" },
        },
        "pulse-ring": {
          "0%": { opacity: "0.8", transform: "scale(0.9)" },
          "100%": { opacity: "0", transform: "scale(1.3)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.4s ease-out",
        "slide-down": "slide-down 0.3s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "scale-in": "scale-in 0.25s ease-out",
        "tab-fade": "tab-fade 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        shimmer: "shimmer 1.8s infinite linear",
        "check-pop":
          "check-pop 0.5s 0.15s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        "dot-bounce": "dot-bounce 1.4s ease-in-out infinite",
        "pulse-ring": "pulse-ring 1.2s 0.2s ease-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
