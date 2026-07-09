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
        "primary": "#2563EB", // Blue 600
        "on-primary": "#FFFFFF",
        "primary-container": "#DBEAFE", // Blue 100
        "on-primary-container": "#1E40AF", // Blue 800
        "primary-fixed": "#DBEAFE",
        "on-primary-fixed": "#2563EB",
        "primary-fixed-dim": "#BFDBFE",
        "on-primary-fixed-variant": "#1D4ED8",
        
        "secondary": "#64748B", 
        "on-secondary": "#FFFFFF",
        "secondary-container": "#F1F5F9", 
        "on-secondary-container": "#0F172A",
        "secondary-fixed": "#F1F5F9",
        "on-secondary-fixed": "#0F172A",
        "secondary-fixed-dim": "#E2E8F0",
        "on-secondary-fixed-variant": "#334155",

        "tertiary": "#F8FAFC", 
        "on-tertiary": "#000000",
        "tertiary-container": "#FEF3C7",
        "on-tertiary-container": "#92400E",
        "tertiary-fixed": "#FEF3C7",
        "on-tertiary-fixed": "#92400E",
        "tertiary-fixed-dim": "#FDE68A",
        "on-tertiary-fixed-variant": "#D97706",
        
        "neutral": "#1E293B",

        "error": "#BA1A1A",
        "on-error": "#FFFFFF",
        "error-container": "#FFDAD6",
        "on-error-container": "#93000A",

        "background": "#FAFAFA", // Neutral 50
        "on-background": "#18181B", // Zinc 900
        "surface": "#FFFFFF",
        "on-surface": "#18181B",
        "surface-variant": "#F4F4F5", // Neutral 100
        "on-surface-variant": "#52525B", // Zinc 600
        "outline": "#D4D4D8", // Zinc 300
        "outline-variant": "#E4E4E7", // Zinc 200
        
        "inverse-on-surface": "#F8FAFC",
        "inverse-surface": "#0F172A",
        "inverse-primary": "#93C5FD",
        
        "canva-cyan": "#00c4cc",
        "canva-purple": "#7d2ae8",
        "canva-bg-start": "#eff6ff", // Tinted blue background
        "canva-bg-mid": "#f1f5f9",
        "canva-bg-end": "#fafafa",
        
        "surface-dim": "#D4D4D8",
        "surface-bright": "#FAFAFA",
        "surface-container-lowest": "#FFFFFF",
        "surface-container-low": "#F4F4F5",
        "surface-container": "#E4E4E7",
        "surface-container-high": "#D4D4D8",
        "surface-container-highest": "#A1A1AA"
      },
      fontFamily: {
        "sans": ["Inter", "sans-serif"],
        "headline": ["Plus Jakarta Sans", "serif"],
        "body": ["Inter", "sans-serif"],
        "label": ["Inter", "sans-serif"]
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
