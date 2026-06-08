/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0fdf8',
          100: '#d0fbed',
          200: '#a3f5d9',
          300: '#67ecc1',
          400: '#2dd8a1',
          500: '#0bbf87',
          600: '#00a070',
          700: '#007a57',
          800: '#005f45',
          900: '#004d38',
        }
      },
      fontFamily: {
        body:    ['"Plus Jakarta Sans"', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
      }
    }
  },
  plugins: []
}
