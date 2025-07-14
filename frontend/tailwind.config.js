/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#2dd4bf", // Teal for buttons, accents
        secondary: "#1e3a8a", // Navy for headers, text
        background: "#f3f4f6", // Light gray for background
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};