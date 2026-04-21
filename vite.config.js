import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Mockmate-interview-platform/',
  server: {
    proxy: {
      '/api/leetcode-graphql': {
        target: 'https://leetcode.com/graphql/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/leetcode-graphql/, ''),
        headers: {
          'Origin': 'https://leetcode.com',
          'Referer': 'https://leetcode.com/'
        }
      },
      '/Mockmate-interview-platform/api/leetcode-graphql': {
        target: 'https://leetcode.com/graphql/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/Mockmate-interview-platform\/api\/leetcode-graphql/, ''),
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
      }
    }
  }
})
