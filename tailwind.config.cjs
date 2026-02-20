/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Remap ALL purple-* classes to the theme primary CSS var ──────────
        // This means every bg-purple-500, text-purple-600, border-purple-400
        // across the entire codebase automatically reflects the admin color pick.
        purple: {
          50:  'rgb(var(--theme-primary-rgb) / 0.05)',
          100: 'rgb(var(--theme-primary-rgb) / 0.10)',
          200: 'rgb(var(--theme-primary-rgb) / 0.20)',
          300: 'rgb(var(--theme-primary-rgb) / 0.45)',
          400: 'rgb(var(--theme-primary-rgb) / 0.65)',
          500: 'rgb(var(--theme-primary-rgb) / 1)',
          600: 'rgb(var(--theme-primary-dark-rgb) / 1)',
          700: 'rgb(var(--theme-primary-dark-rgb) / 0.85)',
          800: 'rgb(var(--theme-primary-dark-rgb) / 0.70)',
          900: 'rgb(var(--theme-primary-dark-rgb) / 0.55)',
        },
        brand: {
          dark: '#050817',
          primary: 'rgb(var(--theme-primary-rgb) / <alpha-value>)',
          'primary-dark': 'rgb(var(--theme-primary-dark-rgb) / <alpha-value>)',
          secondary: 'rgb(var(--theme-secondary-rgb) / <alpha-value>)',
          accent: '#fbbf24',
          surface: '#1e293b'
        },
        theme: {
          primary: 'rgb(var(--theme-primary-rgb) / <alpha-value>)',
          'primary-dark': 'rgb(var(--theme-primary-dark-rgb) / <alpha-value>)',
          secondary: 'rgb(var(--theme-secondary-rgb) / <alpha-value>)',
          master: 'rgb(var(--theme-primary-rgb) / <alpha-value>)',
          surface: 'rgb(var(--theme-primary-rgb) / 0.12)',  // was fixed lavender — now follows primary
        },
        boutique: {
          dark: '#0F051D',
          deep: '#1A0B2E'
        },
        gold: {
          400: '#D4AF37'
        }
      },
      fontFamily: {
        sans: ['Cairo', 'sans-serif'],
      }
    }
  },
  plugins: [],
}
