import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── RIZQ Brand Colors (CSS variable-driven) ──
        "rizq-primary": "var(--color-primary)",
        "rizq-primary-hover": "var(--color-primary-hover)",
        "rizq-secondary": "var(--color-secondary)",
        "rizq-accent": "var(--color-accent)",
        "rizq-surface": "var(--color-surface)",
        "rizq-surface-elevated": "var(--color-surface-elevated)",
        "rizq-text": "var(--color-text)",
        "rizq-text-muted": "var(--color-text-muted)",
        "rizq-border": "var(--color-border)",
        "rizq-success": "var(--color-success)",
        "rizq-warning": "var(--color-warning)",
        "rizq-danger": "var(--color-danger)",
        "rizq-input-bg": "var(--color-input-bg)",
        "rizq-input-border": "var(--color-input-border)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        shimmer: "shimmer 2s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
