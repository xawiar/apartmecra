import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// PWA plugin geçici olarak devre dışı - @babel/traverse sorunu nedeniyle
// import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  // Base path - production için root path kullan
  base: '/',
  
  plugins: [
    react(),
    // PWA plugin geçici olarak devre dışı - @babel/traverse sorunu nedeniyle
    // TODO: @babel/traverse sorunu çözüldükten sonra tekrar aktif edilecek
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
    //   manifest: {
    //     name: 'Sekreterlik Uygulaması',
    //     short_name: 'Sekreterlik',
    //     description: 'Sekreterlik yönetim uygulaması',
    //     theme_color: '#6366F7',
    //     background_color: '#ffffff',
    //     display: 'standalone',
    //     orientation: 'portrait',
    //     scope: '/',
    //     start_url: '/',
    //     icons: [
    //       {
    //         src: 'icon-192x192.png',
    //         sizes: '192x192',
    //         type: 'image/png'
    //       },
    //       {
    //         src: 'icon-512x512.png',
    //         sizes: '512x512',
    //         type: 'image/png'
    //       }
    //     ]
    //   },
    //   workbox: {
    //     globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
    //     skipWaiting: true,
    //     clientsClaim: true,
    //     maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB - large bundle support
    //     runtimeCaching: [
    //       {
    //         // API isteklerini cache'le (/api path'li tüm istekler)
    //         urlPattern: ({ url }) => url.pathname.startsWith('/api'),
    //         handler: 'NetworkFirst',
    //         options: {
    //           cacheName: 'api-cache',
    //           expiration: {
    //             maxEntries: 10,
    //             maxAgeSeconds: 60 * 60 * 24 // 1 day
    //           },
    //           cacheableResponse: {
    //             statuses: [0, 200]
    //           }
    //         }
    //       }
    //     ]
    //   }
    // })
  ],
  
  // Build ayarları - Production için optimize
  build: {
    // Render.com için de dist klasörüne build et (Türkçe karakter sorunu için)
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Production'da sourcemap kapalı
    minify: 'esbuild', // Hızlı minification
    chunkSizeWarningLimit: 2000, // Increase limit to 2MB
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          'ui-vendor': ['bootstrap']
        }
      }
    }
  },
  
  server: {
    port: 5180,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  
  optimizeDeps: {
    include: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage', 'crypto-js', 'bootstrap-icons']
  },
  
  resolve: {
    alias: {
      'bootstrap-icons': 'bootstrap-icons/font/bootstrap-icons.css'
    }
  },
  
  // Preview ayarları (build test için)
  preview: {
    port: 4173,
    strictPort: true
  }
})