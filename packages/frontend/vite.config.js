import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [
    react(),
    basicSsl(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'icons/*.svg'],
      manifest: {
        name: 'Weatherman - Voice Weather Clothing Advisor',
        short_name: 'Weatherman',
        description: 'Voice-activated weather clothing advisor for children',
        theme_color: '#4A90E2',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icons/icon-maskable-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/icons/icon-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        navigateFallback: null,
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            // Cache server API responses (weather endpoints)
            urlPattern: ({ url }) => url.pathname.startsWith('/api/weather'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'server-weather-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 3600 // 1 hour
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              networkTimeoutSeconds: 10
            }
          },
          {
            // Cache server API responses (recommendations endpoints)
            urlPattern: ({ url }) => url.pathname.startsWith('/api/recommendations'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'server-recommendations-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 1800 // 30 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              networkTimeoutSeconds: 10
            }
          },
          {
            // Cache health check endpoint
            urlPattern: ({ url }) => url.pathname === '/api/health',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'server-health-cache',
              expiration: {
                maxEntries: 1,
                maxAgeSeconds: 60 // 1 minute
              },
              networkTimeoutSeconds: 5
            }
          },
          {
            // Cache navigation requests
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'CacheFirst',
            options: {
              cacheName: 'pages-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 86400 // 24 hours
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    })
  ],
  server: {
    // HTTPS required for voice/geolocation APIs in production
    https: true,
    port: 5173,
    proxy: {
      // Proxy all API requests to local server
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
