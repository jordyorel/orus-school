/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        midnight: "#0b1120",
        electric: "#2563eb",
        "electric-light": "#60a5fa",
        charcoal: "#1f2937",
        "editor-surface": "#1f2128",
        "editor-panel": "#181a21",
        "editor-deep": "#0f1117",
        "editor-border": "#2a2d36",
        "editor-console": "#13151f",
        "editor-control": "#222430",
        "cw-body": "#1f2326",
        "cw-panel": "#24282e",
        "cw-panel-alt": "#2b3036",
        "cw-surface": "#1b1f23",
        "cw-border": "#343a40",
        "cw-border-light": "#3f464e",
        "cw-text-muted": "#9ea4ad",
        "cw-accent": "#d04a37",
        "cw-accent-light": "#ff6a4d",
        "cw-accent-dark": "#a43223"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"]
      }
    }
  },
  plugins: []
};
