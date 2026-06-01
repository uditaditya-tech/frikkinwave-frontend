/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Brand palette — deep ink + electric "wave" accent
        ink: {
          950: "#0a0a0f",
          900: "#111119",
          800: "#1a1a26",
          700: "#262636",
          600: "#3a3a4f",
        },
        wave: {
          400: "#5eead4",
          500: "#2dd4bf",
          600: "#14b8a6",
        },
        glow: {
          400: "#a78bfa",
          500: "#8b5cf6",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "glow-teal": "0 0 28px -6px rgba(45, 212, 191, 0.40)",
        "glow-violet": "0 0 28px -6px rgba(139, 92, 246, 0.40)",
      },
      keyframes: {
        equalize: {
          "0%, 100%": { transform: "scaleY(0.4)" },
          "50%": { transform: "scaleY(1)" },
        },
      },
      animation: {
        equalize: "equalize 1.1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
