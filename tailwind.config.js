/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js}"],
  theme: {
    extend: {
      colors: {
        dark: {
          50: "#2d2d2d",
          100: "#1e1e1e",
          200: "#171717",
          300: "#121212",
          400: "#0a0a0a",
        },
        accent: { 100: "#3b82f6", 200: "#2563eb", 300: "#1d4ed8" },
        secondary: { 100: "#10b981", 200: "#047857", 300: "#065f46" },
        gray: { 500: "#8b93a1", 600: "#6b7280" },
      },
      fontFamily: {
        sans: ["Inter Variable", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
};
