import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // RoPhim exact palette
        bg: "#191B24",
        surface: "#21242E",
        card: "#21242E",
        "card-high": "#282C38",
        "card-hover": "#2E3240",
        // Gold
        "gold-start": "#FED469",
        "gold-end": "#FEECBB",
        "on-gold": "#191B24",
        // Accents
        "accent-green": "#4ade80",
        "accent-blue": "#60a5fa",
        "accent-red": "#f87171",
        "accent-gold": "#fed469",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      letterSpacing: {
        tight: "-0.02em",
        tighter: "-0.03em",
      },
      backgroundImage: {
        "gradient-gold": "linear-gradient(135deg, #FED469 0%, #FEECBB 100%)",
        "gradient-premium": "linear-gradient(135deg, #21242E 0%, #282C38 100%)",
      },
      boxShadow: {
        "glow-gold": "0 0 20px rgba(254,212,105,0.2)",
        "glow-gold-lg": "0 0 36px rgba(254,212,105,0.35)",
        "glow-red": "0 0 20px rgba(248,113,113,0.2)",
        "card-hover":
          "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(254,212,105,0.08)",
        "inner-glow": "inset 0 1px 1px rgba(255,255,255,0.4)",
      },
      borderColor: {
        subtle: "rgba(255,255,255,0.03)",
        "subtle-md": "rgba(255,255,255,0.08)",
        gold: "rgba(254,212,105,0.3)",
      },
      backdropBlur: {
        glass: "12px",
        heavy: "24px",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        "fade-in": "fadeIn 0.4s ease-out",
      },
    },
  },
  plugins: [typography],
  important: true,
  corePlugins: { preflight: false },
};
