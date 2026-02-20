/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx,mdx}",
    "./components/**/*.{js,jsx,ts,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        nav: "1150px",
        "sticky-nav": "1350px",
      },
      fontFamily: {
        sans: ['"Raleway"', '"Space Grotesk"', '"Sora"', "system-ui", "sans-serif"],
        raleway: ['"Raleway"', "system-ui", "sans-serif"],
        serif: ['"Merriweather"', "Georgia", "Cambria", '"Times New Roman"', "Times", "serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateX(-50%) translateY(10px)" },
          "100%": { opacity: "1", transform: "translateX(-50%) translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
