/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#e6f1fd",
          100: "#cce3fb",
          200: "#99c7f7",
          300: "#66abf3",
          400: "#338eef",
          500: "#0071e3", // Apple blue
          600: "#005bb6",
          700: "#004489",
          800: "#002e5c",
          900: "#00172e",
        },
        secondary: {
          50: "#efeefe",
          100: "#dfdcfd",
          200: "#bfb9fb",
          300: "#9f97f9",
          400: "#7f74f7",
          500: "#5e5ce6", // Apple indigo
          600: "#4b4ab8",
          700: "#38388a",
          800: "#26255c",
          900: "#13132e",
        },
        accent: {
          50: "#e6f9f3",
          100: "#ccf3e8",
          200: "#99e7d0",
          300: "#66dbb9",
          400: "#33cfa1",
          500: "#00c28c", // Apple emerald
          600: "#009b70",
          700: "#007454",
          800: "#004e38",
          900: "#00271c",
        },
        success: {
          50: "#e8f8e8",
          100: "#d1f1d1",
          200: "#a3e3a3",
          300: "#75d575",
          400: "#47c747",
          500: "#28a745",
          600: "#208537",
          700: "#186429",
          800: "#10421c",
          900: "#08210e",
        },
        warning: {
          50: "#fff8e6",
          100: "#fff1cc",
          200: "#ffe399",
          300: "#ffd566",
          400: "#ffc733",
          500: "#ffb800",
          600: "#cc9300",
          700: "#996e00",
          800: "#664a00",
          900: "#332500",
        },
        error: {
          50: "#fce8e8",
          100: "#f9d1d1",
          200: "#f3a3a3",
          300: "#ed7575",
          400: "#e74747",
          500: "#dc3545",
          600: "#b02a37",
          700: "#842029",
          800: "#58151c",
          900: "#2c0b0e",
        },
        neutral: {
          50: "#f7f7f7",
          100: "#e3e3e3",
          200: "#c8c8c8",
          300: "#a4a4a4",
          400: "#818181",
          500: "#666666",
          600: "#515151",
          700: "#434343",
          800: "#383838",
          900: "#121212",
        },
      },
      fontFamily: {
        sans: ["Source Code Pro", "Roboto", "system-ui", "sans-serif"],
        mono: ["SF Mono", "monospace"],
      },
      boxShadow: {
        apple:
          "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        "apple-md":
          "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        "apple-lg":
          "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      },
      backdropFilter: {
        none: "none",
        blur: "blur(20px)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
