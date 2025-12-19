import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  root: __dirname,
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
      input: existsSync(resolve(__dirname, 'index.html')) 
        ? resolve(__dirname, 'index.html')
        : './index.html',
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