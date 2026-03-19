import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./stores/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#F5A623",
          dark: "#D98E11",
          soft: "#FFF3DE"
        },
        shell: {
          bg: "#1A1A1A",
          panel: "#232323",
          muted: "#6B7280",
          surface: "#F8F6F2"
        }
      },
      boxShadow: {
        card: "0 24px 80px rgba(15, 23, 42, 0.08)"
      },
      borderRadius: {
        shell: "56px"
      },
      backgroundImage: {
        ambient:
          "radial-gradient(circle at top left, rgba(245,166,35,0.18), transparent 32%), radial-gradient(circle at bottom right, rgba(255,244,220,0.7), transparent 30%)"
      }
    }
  },
  plugins: []
};

export default config;
