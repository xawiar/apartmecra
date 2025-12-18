import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  root: process.cwd(),
  plugins: [react()],
  publicDir: 'public',
  server: {
    port: 5173,
    host: true,
    hmr: {
      port: 5173,
      host: 'localhost',
      overlay: false // Disable error overlay to prevent page refresh issues
    },
    watch: {
      usePolling: false, // Disable polling to prevent unnecessary refreshes
      interval: 0
    },
    fs: {
      allow: ['..']
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          bootstrap: ['bootstrap']
        }
      }
    }
  },
  define: {
    __PWA_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0')
  }
})