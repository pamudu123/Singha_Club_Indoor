/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        singha: {
          50: "#eefbf1",
          100: "#d8f4df",
          500: "#139234",
          600: "#087d24",
          700: "#05621c"
        },
        ink: "#101827",
        muted: "#667085",
        line: "#e4e7ec",
        surface: "#ffffff"
      },
      boxShadow: {
        card: "0 8px 24px rgba(16, 24, 40, 0.08)"
      }
    }
  },
  plugins: []
};
