/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "2rem",
        lg: "4rem",
        xl: "5rem",
        "2xl": "6rem",
      },
    },
    extend: {
      colors: {
        // The Curator Design System - Material 3 inspired
        primary: "#29273f",
        "primary-container": "#3f3d56",
        "on-primary": "#ffffff",
        "primary-fixed": "#e3dfff",
        "primary-fixed-dim": "#c7c3e2",
        "on-primary-fixed": "#1a1930",
        "on-primary-fixed-variant": "#46445d",
        "on-primary-container": "#aca8c6",
        
        secondary: "#5c5c7a",
        "secondary-container": "#dedcff",
        "on-secondary": "#ffffff",
        "secondary-fixed": "#e1dfff",
        "secondary-fixed-dim": "#c5c3e6",
        "on-secondary-fixed": "#181933",
        "on-secondary-fixed-variant": "#444461",
        "on-secondary-container": "#60607e",
        
        tertiary: "#705d00",
        "tertiary-container": "#c9a900",
        "on-tertiary": "#ffffff",
        "tertiary-fixed": "#ffe16d",
        "tertiary-fixed-dim": "#e9c400",
        "on-tertiary-fixed": "#221b00",
        "on-tertiary-fixed-variant": "#544600",
        "on-tertiary-container": "#4c3f00",
        
        background: "#fcf8ff",
        "on-background": "#181933",
        surface: "#fcf8ff",
        "surface-dim": "#d8d7fa",
        "surface-bright": "#fcf8ff",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f5f2ff",
        "surface-container": "#eeecff",
        "surface-container-high": "#e8e6ff",
        "surface-container-highest": "#e1dfff",
        "on-surface": "#181933",
        "on-surface-variant": "#47464d",
        "inverse-surface": "#2d2e49",
        "inverse-on-surface": "#f2efff",
        "inverse-primary": "#c7c3e2",
        "surface-tint": "#5e5b76",
        
        "surface-variant": "#e1dfff",
        outline: "#78767d",
        "outline-variant": "#c9c5cd",
        
        error: "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
        "on-error-container": "#93000a",
        
        // Legacy color support
        gray: {
          50: "#f9fafb",
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          900: "#111827",
          950: "#030712",
        },
      },
      fontFamily: {
        headline: ["Manrope", "Inter", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        label: ["Inter", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
        full: "9999px",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        glow: "glow 2s ease-in-out infinite alternate",
        "slide-up": "slideUp 0.5s ease-out",
        "fade-in": "fadeIn 0.6s ease-out",
        shimmer: "shimmer 2s linear infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        glow: {
          from: { boxShadow: "0 0 10px rgba(112, 93, 0, 0.5)" },
          to: {
            boxShadow:
              "0 0 20px rgba(112, 93, 0, 0.8), 0 0 30px rgba(112, 93, 0, 0.4)",
          },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      boxShadow: {
        glow: "0 0 20px rgba(112, 93, 0, 0.3)",
        "glow-green": "0 0 20px rgba(34, 197, 94, 0.3)",
        colored:
          "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        "curator-card": "0px 12px 32px rgba(24, 25, 51, 0.06)",
        "curator-card-hover": "0px 16px 40px rgba(24, 25, 51, 0.1)",
      },
      backdropBlur: {
        xs: "blur(2px)",
        "3xl": "blur(64px)",
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
        128: "32rem",
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "none",
            color: "#47464d",
            lineHeight: "1.75",
          },
        },
      },
      screens: {
        xs: "480px",
      },
    },
  },
  plugins: [require("@tailwindcss/typography"), require("@tailwindcss/forms")],
};
