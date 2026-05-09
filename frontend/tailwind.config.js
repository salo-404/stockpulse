/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050a0e",
        card: "#071218",
        sidebar: "#070d0f",
        surface: "rgba(255,255,255,0.03)",
        border: "rgba(0,212,170,0.1)",
        accent: "#00d4aa",
        secondaryAccent: "#7c3aed",
        profit: "#00d4aa",
        loss: "#ff4d4d",
        primary: "#eaf2ef",
        secondary: "#94a3b8",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
}