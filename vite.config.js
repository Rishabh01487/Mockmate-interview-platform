import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// On Vercel: base is '/' (served at root domain)
// On GitHub Pages: base would be '/Mockmate-interview-platform/'
const isVercel = process.env.VERCEL === '1';

export default defineConfig({
  plugins: [react()],
  base: isVercel ? '/' : '/Mockmate-interview-platform/',
  server: {
    proxy: {
      // Dev-only proxies — in production Vercel handles /api/* via serverless
      '/api/leetcode-graphql': {
        target: 'https://leetcode.com/graphql/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/leetcode-graphql/, ''),
        headers: {
          'Origin': 'https://leetcode.com',
          'Referer': 'https://leetcode.com/'
        }
      },
      '/api/ollama': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ollama/, '/api/ai')
      },
      '/api/ai': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      },
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      }
    }
  }
})
