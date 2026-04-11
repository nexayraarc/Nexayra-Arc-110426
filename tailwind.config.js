/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#1c2143",
          50: "#f4f5fb",
          100: "#e8eaf5",
          200: "#cdd1e8",
          300: "#a1a8d3",
          400: "#6f7aba",
          500: "#4d5aa3",
          600: "#3b4589",
          700: "#2e366e",
          800: "#1c2143",
          900: "#121535",
        },
        gold: {
          DEFAULT: "#c9a84c",
          50: "#fdf9ee",
          100: "#f8edd0",
          200: "#f1dba1",
          300: "#e9c972",
          400: "#c9a84c",
          500: "#b08e30",
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', "Georgia", "serif"],
        body: ['"DM Sans"', "system-ui", "sans-serif"],
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(30px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.5s ease-out forwards",
        "fade-in": "fade-in 0.4s ease-out forwards",
        "slide-in-right": "slide-in-right 0.5s ease-out forwards",
        "scale-in": "scale-in 0.4s ease-out forwards",
      },
    },
  },
  plugins: [],
};
