import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProduction = mode === 'production';
    const tryOnApiPort = env.TRYON_API_PORT || '8787';
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: `http://localhost:${tryOnApiPort}`,
            changeOrigin: true,
          }
        }
      },
      plugins: [
        react(),
        // Disable PWA plugin entirely in development to avoid any injection
        ...(isProduction ? [VitePWA({
          registerType: 'autoUpdate',
          injectRegister: mode === 'production' ? 'auto' : null, // Only register in production
          devOptions: {
            enabled: false, // Completely disable in dev
          },
          includeAssets: ['favicon.ico', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png'],
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}'],
            navigateFallback: '/index.html',
            // Exclude dev-related files from caching
            navigateFallbackDenylist: [/^\/@vite/, /^\/@react-refresh/, /^\/node_modules/],
            runtimeCaching: [
              {
                urlPattern: ({ request, url }) => {
                  // Skip dev server URLs
                  if (url.pathname.startsWith('/@vite') || 
                      url.pathname.startsWith('/@react-refresh') || 
                      url.pathname.startsWith('/node_modules') ||
                      url.searchParams.has('t')) {
                    return false;
                  }
                  return request.destination === 'document';
                },
                handler: 'NetworkFirst',
                options: { 
                  cacheName: 'pages', 
                  expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
                  networkTimeoutSeconds: 3
                }
              },
              {
                urlPattern: ({ request, url }) => {
                  // Skip dev server URLs
                  if (url.pathname.startsWith('/@vite') || 
                      url.pathname.startsWith('/@react-refresh') || 
                      url.pathname.startsWith('/node_modules') ||
                      url.searchParams.has('t')) {
                    return false;
                  }
                  return request.destination === 'script' || request.destination === 'style';
                },
                handler: 'StaleWhileRevalidate',
                options: { cacheName: 'assets' }
              },
              {
                urlPattern: ({ request, url }) => {
                  // Skip dev server URLs
                  if (url.pathname.startsWith('/@vite') || 
                      url.pathname.startsWith('/@react-refresh') || 
                      url.pathname.startsWith('/node_modules')) {
                    return false;
                  }
                  return request.destination === 'image' || request.destination === 'font';
                },
                handler: 'CacheFirst',
                options: { 
                  cacheName: 'static', 
                  expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 } 
                }
              }
            ]
          },
          manifest: {
            name: 'Khiyoot - خيوط',
            short_name: 'خيوط',
            description: 'منصة خياطة حديثة لطلب التفصيل والمنتجات',
            start_url: '/',
            scope: '/',
            display: 'standalone',
            background_color: '#0f172a',
            theme_color: '#0f172a',
            lang: 'ar',
            dir: 'rtl',
            orientation: 'portrait',
            icons: [
              { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
              { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
              { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
            ]
          }
        })] : [])
      ],
      
      // Remove console.log in production for security
      esbuild: {
        drop: isProduction ? ['console', 'debugger'] : [],
      },
      
      // Exclude virtual PWA modules from pre-bundling in dev
      optimizeDeps: {
        exclude: isProduction ? [] : ['virtual:pwa-register']
      },
      
      define: {
        // Never inject any AI keys into the client bundle.
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
