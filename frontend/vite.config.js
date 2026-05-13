import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true, rewrite: p => p.replace(/^\/api/, '') },
      '/ai':  { target: 'http://localhost:8000', changeOrigin: true, rewrite: p => p.replace(/^\/ai/, '') },
      '/socket.io': { target: 'http://localhost:3001', ws: true, changeOrigin: true }
    }
  },
  build: { outDir: 'dist', sourcemap: false },
  // VITE_GEMINI_API_KEY is optional — used only as a browser fallback
  // when the backend proxy is unavailable. Prefer setting GEMINI_API_KEY
  // in the backend .env so the key never reaches the browser.
  define: {
    __APP_VERSION__: JSON.stringify('1.0.0')
  }
})
