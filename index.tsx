import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import 'react-image-crop/dist/ReactCrop.css';
import App from './App';
import { queryClient } from './src/lib/queryClient';

// i18n (language + RTL/LTR) must initialize before React renders
import './src/i18n/i18n';

// PWA Service Worker registration (production only)
// - Forces immediate activation on deploy (paired with workbox.skipWaiting/clientsClaim)
// - Forces a reload when an updated SW is ready so users don't stay on stale bundles
if (import.meta.env.PROD) {
  try {
    // IMPORTANT: Do NOT import `virtual:pwa-register` from here.
    // Vite will try to resolve it during dev transforms and throw 500s.
    // Instead, dynamically import a local production-only module.
    import('./src/pwa/registerProd').then(({ registerProdServiceWorker }) => {
      registerProdServiceWorker();
    });
  } catch {
    // ignore
  }
}

// Hash-route compatibility (Option A): convert legacy `#/...` URLs to real paths
// before React Router (BrowserRouter) mounts.
// Example: http://localhost:3000/#/admin/config -> http://localhost:3000/admin/config
try {
  if (typeof window !== 'undefined') {
    const hash = window.location.hash || '';
    if (hash.startsWith('#/')) {
      const target = hash.slice(1); // '/admin/config' (and maybe '?x=1')
      if (target && target !== '/') {
        const hasQueryInTarget = target.includes('?');
        const nextUrl = hasQueryInTarget ? target : `${target}${window.location.search || ''}`;
        window.history.replaceState(null, '', nextUrl);
      } else {
        // Clear pointless hashes like '#/'
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  }
} catch {
  // ignore
}

// Unregister Service Worker and clear cache in development (FORCE)
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  // Logic removed: Don't force clear caches on every refresh in dev.
  // This allows us to test "Zero-Lag" performance patterns.
}

// Disable zooming and panning globally (mobile browsers)
try {
  if (typeof window !== 'undefined') {
    const prevent = (e: Event) => {
      e.preventDefault();
    };

    // iOS Safari pinch/double-tap zoom
    window.addEventListener('gesturestart', prevent, { passive: false });
    window.addEventListener('gesturechange', prevent, { passive: false });
    window.addEventListener('gestureend', prevent, { passive: false });

    // Disable double-tap to zoom
    let lastTouchEnd = 0;
    document.addEventListener(
      'touchend',
      (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
          e.preventDefault();
        }
        lastTouchEnd = now;
      },
      { passive: false }
    );
  }
} catch {
  // ignore
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);

// Service Worker registration completely removed in development
// PWA will be handled during production build only
