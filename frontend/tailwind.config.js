export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf8', 100: '#ccfbee', 200: '#99f5dd', 300: '#5ee8c4',
          400: '#2dd1a8', 500: '#14b88a', 600: '#0a9470', 700: '#0b7459',
          800: '#0d5e47', 900: '#0d4d3c', 950: '#062e24'
        },
        coral: {
          400: '#f87171', 500: '#ef4444', 600: '#dc2626'
        },
        amber: {
          400: '#fbbf24', 500: '#f59e0b'
        }
      },
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        body: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        pulseSoft: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.6 } }
      }
    }
  },
  plugins: []
}
