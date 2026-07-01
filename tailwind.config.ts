import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        hueso: "#F2EDE4",
        "hueso-2": "#FAF8F3",
        arena: "#C9A672",
        oliva: "#4A5D3A",
        "oliva-d": "#33402A",
        "oliva-dd": "#1C261C",
        nogal: "#5C3D2E",
        piedra: "#9B9184",
        golfo: "#4C6B70",
        dorado: "#B8863E",
        tinta: "#2B1D14",
        "tinta-suave": "#6B6255",
      },
      fontFamily: {
        slab: ["var(--font-bitter)", "serif"],
        sans: ["var(--font-barlow)", "sans-serif"],
      },
      borderRadius: {
        xl2: "18px",
      },
    },
  },
  plugins: [],
};

export default config;
