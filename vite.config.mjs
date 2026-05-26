import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',   // Root path — Vercel serves at domain root
  server: {
    proxy: {
      // Dev only: proxy /api to local Express backend
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
