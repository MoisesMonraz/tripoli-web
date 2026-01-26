/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx,mdx}",
    "./components/**/*.{js,jsx,ts,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Raleway"', '"Space Grotesk"', '"Sora"', "system-ui", "sans-serif"],
        raleway: ['"Raleway"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
