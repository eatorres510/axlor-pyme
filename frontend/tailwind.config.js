/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // etiserv.tech Signature Palette
        etiserv: {
          navyDark: "#071C33",     // Sidebar deep background
          navy: "#0B2B4C",         // Primary brand navy
          navySurface: "#0D355B",  // Card background in dark mode
          blue: "#2563EB",         // Electric action accent
          blueHover: "#1D4ED8",
          blueLight: "#3B82F6",
          glow: "rgba(37, 99, 235, 0.35)",
        },
        slate: {
          50: "#F8FAFC",   // Canvas light
          100: "#F1F5F9",  // Subtle table header / hover
          200: "#E2E8F0",  // 1px clean border
          300: "#CBD5E1",
          400: "#94A3B8",  // Captions & table uppercase headers
          500: "#64748B",  // Subtitles & metadata
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",  // High-contrast primary text
          950: "#020617",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        heading: ["Poppins", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        glow: "0 0 16px -2px rgba(37, 99, 235, 0.35)",
      },
    },
  },
  plugins: [],
};
