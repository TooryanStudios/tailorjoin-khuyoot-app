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
          surface: 'rgb(var(--theme-surface-lavender-rgb) / <alpha-value>)',
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
