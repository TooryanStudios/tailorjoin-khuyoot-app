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
          primary: '#63498b',
          secondary: '#b5e58d',
          accent: '#fbbf24',
          surface: '#1e293b'
        },
        theme: {
          primary: '#63498b',
          secondary: '#b5e58d',
          master: '#63498b',
          surface: '#c2b7d3',
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
