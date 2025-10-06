import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#22c55e",
          dark: "#16a34a"
        },
        slateglass: "rgba(15, 23, 42, 0.08)"
      },
      boxShadow: {
        soft: "0 24px 60px -32px rgba(15, 23, 42, 0.45)",
        glow: "0 0 0 1px rgba(14, 165, 233, 0.08), 0 20px 45px -24px rgba(14, 165, 233, 0.65)"
      }
    }
  },
  plugins: [typography]
};
