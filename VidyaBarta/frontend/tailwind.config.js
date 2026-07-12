/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        "surface-tint": "#2f53ce",
        "primary": "#002c98", // Updated primary from design system
        "on-primary": "#ffffff",
        "primary-container": "#1a43bf", // Blue 100
        "on-primary-container": "#b2bfff", // Blue 800
        "primary-fixed": "#dde1ff",
        "on-primary-fixed": "#001453",
        "primary-fixed-dim": "#b7c4ff",
        "on-primary-fixed-variant": "#0438b6",
        
        "secondary": "#505f76", 
        "on-secondary": "#ffffff",
        "secondary-container": "#d0e1fb", 
        "on-secondary-container": "#54647a",
        "secondary-fixed": "#d3e4fe",
        "on-secondary-fixed": "#0b1c30",
        "secondary-fixed-dim": "#b7c8e1",
        "on-secondary-fixed-variant": "#38485d",

        "tertiary": "#36393b", 
        "on-tertiary": "#ffffff",
        "tertiary-container": "#4d5052",
        "on-tertiary-container": "#c0c2c4",
        "tertiary-fixed": "#e0e3e5",
        "on-tertiary-fixed": "#191c1e",
        "tertiary-fixed-dim": "#c4c7c9",
        "on-tertiary-fixed-variant": "#444749",
        
        "neutral": "#767680", // Updated neutral from design system

        "error": "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",

        "background": "#fbf8ff", // Neutral 50
        "on-background": "#1a1b23", // Zinc 900
        "surface": "#fbf8ff",
        "on-surface": "#1a1b23",
        "surface-variant": "#e2e1ec", // Neutral 100
        "on-surface-variant": "#444654", // Zinc 600
        "outline": "#747685", // Zinc 300
        "outline-variant": "#c4c5d6", // Zinc 200
        
        "inverse-on-surface": "#f1f0fa",
        "inverse-surface": "#2f3038",
        "inverse-primary": "#b7c4ff",
        
        "canva-cyan": "#00c4cc",
        "canva-purple": "#7d2ae8",
        "canva-bg-start": "#eff6ff", // Tinted blue background
        "canva-bg-mid": "#f1f5f9",
        "canva-bg-end": "#fafafa",
        
        "surface-dim": "#dad9e4",
        "surface-bright": "#fbf8ff",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f4f2fd",
        "surface-container": "#eeedf8",
        "surface-container-high": "#e8e7f2",
        "surface-container-highest": "#e2e1ec",
      },
      fontFamily: {
        "sans": ["Public Sans", "sans-serif"],
        "headline": ["Public Sans", "sans-serif"],
        "body": ["Public Sans", "sans-serif"],
        "label": ["Public Sans", "sans-serif"]
      },
      fontSize: {
        "display-lg": ["3.5rem", { lineHeight: "1.2", letterSpacing: "0" }],
        "display-md": ["2.8rem", { lineHeight: "1.3", letterSpacing: "0" }],
        "display-sm": ["2.2rem", { lineHeight: "1.3", letterSpacing: "0" }],
        "headline-lg": ["2rem", { lineHeight: "1.4", letterSpacing: "0.015625em" }],
        "headline-md": ["1.75rem", { lineHeight: "1.4", letterSpacing: "0" }],
        "headline-sm": ["1.5rem", { lineHeight: "1.5", letterSpacing: "0" }],
        "title-lg": ["1.375rem", { lineHeight: "1.5", letterSpacing: "0.0125em" }],
        "title-md": ["1rem", { lineHeight: "1.6", letterSpacing: "0.015625em" }],
        "title-sm": ["0.875rem", { lineHeight: "1.6", letterSpacing: "0.0125em" }],
        "label-lg": ["0.875rem", { lineHeight: "1.5", letterSpacing: "0.0125em" }],
        "label-md": ["0.75rem", { lineHeight: "1.5", letterSpacing: "0.05em" }],
        "label-sm": ["0.6875rem", { lineHeight: "1.5", letterSpacing: "0.03125em" }],
        "body-lg": ["1rem", { lineHeight: "1.6", letterSpacing: "0.03125em" }],
        "body-md": ["0.875rem", { lineHeight: "1.6", letterSpacing: "0.025em" }],
        "body-sm": ["0.75rem", { lineHeight: "1.5", letterSpacing: "0.0125em" }],
      },
      spacing: {
        "xs": "0.25rem",
        "sm": "0.5rem",
        "md": "1rem",
        "lg": "1.5rem",
        "xl": "2rem",
        "2xl": "2.5rem",
        "3xl": "3rem",
        "4xl": "4rem",
        "5xl": "5rem",
      },
      boxShadow: {
        "elevation-0": "none",
        "elevation-1": "0 1px 3px 0 rgba(0, 0, 0, 0.12), 0 1px 2px 0 rgba(0, 0, 0, 0.24)",
        "elevation-2": "0 3px 6px 0 rgba(0, 0, 0, 0.16), 0 3px 6px 0 rgba(0, 0, 0, 0.23)",
        "elevation-3": "0 10px 20px 0 rgba(0, 0, 0, 0.19), 0 6px 6px 0 rgba(0, 0, 0, 0.23)",
        "elevation-4": "0 15px 25px 0 rgba(0, 0, 0, 0.15), 0 15px 10px 0 rgba(0, 0, 0, 0.05)",
        "elevation-5": "0 20px 40px 0 rgba(0, 0, 0, 0.2)",
        "soft": "0 2px 8px 0 rgba(31, 41, 55, 0.08)",
        "medium": "0 4px 16px 0 rgba(31, 41, 55, 0.12)",
        "lg": "0 8px 24px 0 rgba(31, 41, 55, 0.16)",
        "focus": "0 0 0 3px rgba(37, 99, 235, 0.1)",
      },
      transitionDuration: {
        "fast": "150ms",
        "base": "300ms",
        "slow": "450ms",
      },
      transitionTimingFunction: {
        "smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
        "bounce": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "elastic": "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(16px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-16px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        marquee: 'marquee 80s linear infinite',
        fadeIn: 'fadeIn 300ms ease-out',
        slideUp: 'slideUp 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        slideDown: 'slideDown 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        slideLeft: 'slideLeft 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        slideRight: 'slideRight 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        scaleIn: 'scaleIn 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      borderRadius: {
        "DEFAULT": "0.5rem",
        "xs": "0.25rem",
        "sm": "0.375rem",
        "md": "0.5rem",
        "lg": "0.75rem",
        "xl": "1rem",
        "2xl": "1.5rem",
        "full": "9999px"
      },
    },
  },
  plugins: [],
}
