/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#1E40AF", // Blue 800
        "on-primary": "#FFFFFF",
        "primary-container": "#1E3A8A", // Blue 900
        "on-primary-container": "#FFFFFF",
        "primary-fixed": "#DBEAFE",
        "on-primary-fixed": "#1E3A8A",
        "primary-fixed-dim": "#BFDBFE",
        "on-primary-fixed-variant": "#1D4ED8",
        
        "secondary": "#0284C7", // Light Blue / Sky 600
        "on-secondary": "#FFFFFF",
        "secondary-container": "#E0F2FE", // Sky 100
        "on-secondary-container": "#0C4A6E", // Sky 900
        "secondary-fixed": "#E0F2FE",
        "on-secondary-fixed": "#0C4A6E",
        "secondary-fixed-dim": "#BAE6FD",
        "on-secondary-fixed-variant": "#0284C7",

        "tertiary": "#F59E0B", // Amber 500 (Professional contrasting accent)
        "on-tertiary": "#FFFFFF",
        "tertiary-container": "#FFFBEB",
        "on-tertiary-container": "#78350F",
        "tertiary-fixed": "#FEF3C7",
        "on-tertiary-fixed": "#78350F",
        "tertiary-fixed-dim": "#FDE68A",
        "on-tertiary-fixed-variant": "#D97706",

        "error": "#BA1A1A",
        "on-error": "#FFFFFF",
        "error-container": "#FFDAD6",
        "on-error-container": "#93000A",

        "background": "#F8FAFC", // Slate 50
        "on-background": "#0F172A", // Slate 900
        "surface": "#F8FAFC",
        "on-surface": "#0F172A",
        "surface-variant": "#E2E8F0", // Slate 200
        "on-surface-variant": "#475569", // Slate 600
        "outline": "#94A3B8", // Slate 400
        "outline-variant": "#CBD5E1", // Slate 300
        
        "inverse-on-surface": "#F1F5F9",
        "inverse-surface": "#1E293B",
        "inverse-primary": "#60A5FA",
        
        "canva-cyan": "#00c4cc",
        "canva-purple": "#7d2ae8",
        "canva-bg-start": "#e0edff",
        "canva-bg-mid": "#eaddff",
        "canva-bg-end": "#f3e1f5",
        
        "surface-dim": "#CBD5E1",
        "surface-bright": "#F8FAFC",
        "surface-container-lowest": "#FFFFFF",
        "surface-container-low": "#F1F5F9", // Slate 100
        "surface-container": "#E2E8F0", // Slate 200
        "surface-container-high": "#CBD5E1", // Slate 300
        "surface-container-highest": "#94A3B8" // Slate 400
      },
      fontFamily: {
        "sans": ["Outfit", "sans-serif"],
        "headline": ["Prata", "serif"],
        "body": ["Outfit", "sans-serif"],
        "label": ["Outfit", "sans-serif"]
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' }, // Assuming content is duped to 200% width
        }
      },
      animation: {
        marquee: 'marquee 80s linear infinite',
      },
      borderRadius: {"DEFAULT": "0.125rem", "lg": "0.25rem", "xl": "0.5rem", "full": "0.75rem"},
    },
  },
  plugins: [],
}
