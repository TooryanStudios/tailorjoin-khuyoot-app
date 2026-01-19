import os from 'os';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

function getLanIpv4(): string | undefined {
  const nets = os.networkInterfaces();
  for (const netInfos of Object.values(nets)) {
    for (const net of netInfos ?? []) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return undefined;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const isProduction = mode === 'production';
  const buildStamp = (env.VITE_BUILD_ID || new Date().toISOString())
    .replace(/[^0-9A-Za-z]+/g, '-')
    .slice(0, 32);

  const tryOnApiPort = env.TRYON_API_PORT || '8788';
  const videoLabPort = env.VIDEO_LAB_PORT || '8790';
  const devPort = Number(env.VITE_DEV_PORT || env.PORT || 3000);
  const hmrHost = env.VITE_HMR_HOST?.trim();

  return {
    server: {
      port: devPort,
      host: '0.0.0.0',
      // Let Vite pick the HMR host from the current page URL.
      // Set VITE_HMR_HOST only if you need to force it (e.g., specific LAN/IP setups).
      hmr: hmrHost ? { host: hmrHost, protocol: 'ws' } : undefined,
      // If hot reload doesn't trigger on Windows, enable polling:
      // set VITE_USE_POLLING=1
      watch: env.VITE_USE_POLLING === '1' ? { usePolling: true, interval: 150 } : undefined,
      proxy: {
        '/api': {
          target: `http://localhost:${tryOnApiPort}`,
          changeOrigin: true,
        },
        // Dev-only tool: local Python MoviePy server
        '/video-lab-api': {
          target: `http://127.0.0.1:${videoLabPort}`,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/video-lab-api/, ''),
        },
      },
    },
    plugins: [
      react(),
      // Keep the plugin present in dev so `virtual:pwa-register` is resolvable,
      // but keep SW behavior disabled in dev.
      VitePWA({
        registerType: 'autoUpdate',
        // We manually register the service worker in index.tsx so we can force
        // immediate activation + reload behavior on updates.
        injectRegister: null,
        devOptions: {
          enabled: false,
        },
        includeAssets: ['favicon.ico', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png'],
        workbox: {
          // Clean-break: avoid cache collisions across deploys.
          cacheId: `khuyoot-${buildStamp}`,
          // Immediate activation on update.
          skipWaiting: true,
          clientsClaim: true,
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}'],
          navigateFallback: '/index.html',
          // Exclude dev-related files from caching
          navigateFallbackDenylist: [/^\/\@vite/, /^\/\@react-refresh/, /^\/node_modules/],
          runtimeCaching: [
            {
              urlPattern: ({ request, url }) => {
                // Skip dev server URLs
                if (
                  url.pathname.startsWith('/@vite') ||
                  url.pathname.startsWith('/@react-refresh') ||
                  url.pathname.startsWith('/node_modules') ||
                  url.searchParams.has('t')
                ) {
                  return false;
                }
                return request.destination === 'document';
              },
              // CRITICAL: NetworkOnly ensures HTML is ALWAYS fresh (no stale homepage)
              handler: 'NetworkOnly',
              options: {
                cacheName: 'pages-bypass',
              },
            },
            {
              urlPattern: ({ request, url }) => {
                // Skip dev server URLs
                if (
                  url.pathname.startsWith('/@vite') ||
                  url.pathname.startsWith('/@react-refresh') ||
                  url.pathname.startsWith('/node_modules') ||
                  url.searchParams.has('t')
                ) {
                  return false;
                }
                return request.destination === 'script' || request.destination === 'style';
              },
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'assets' },
            },
            {
              urlPattern: ({ request, url }) => {
                // Skip dev server URLs
                if (
                  url.pathname.startsWith('/@vite') ||
                  url.pathname.startsWith('/@react-refresh') ||
                  url.pathname.startsWith('/node_modules')
                ) {
                  return false;
                }
                return request.destination === 'image' || request.destination === 'font';
              },
              handler: 'CacheFirst',
              options: {
                cacheName: 'static',
                // Cross-origin <img> requests (e.g. Firebase Storage) often produce opaque responses (status 0).
                // Allow caching both 200 and opaque responses so images persist across visits.
                cacheableResponse: { statuses: [0, 200] },
                expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
          ],
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
            { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
      }),
    ],
    // Remove console.log in production for security
    esbuild: {
      drop: isProduction ? ['console', 'debugger'] : [],
    },
    // Exclude virtual PWA modules from pre-bundling in dev
    optimizeDeps: {
      exclude: isProduction ? [] : ['virtual:pwa-register'],
    },
    define: {
      // Never inject any AI keys into the client bundle.
      __APP_BUILD_ID__: JSON.stringify(buildStamp),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
