import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import 'react-image-crop/dist/ReactCrop.css';
import './src/styles/global.css';
import App from './App';
import { queryClient } from './src/lib/queryClient';
import { AuthProvider } from './src/auth/AuthProvider';

// TypeScript declarations for diagnostic logging
declare global {
  interface Window {
    __earlyErrors?: Array<{message: string; filename?: string; lineno?: number; stack?: string}>;
  }
}

// i18n (language + RTL/LTR) must initialize before React renders
import './src/i18n/i18n';

function isDevLikeRuntimeHost(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const host = (window.location.hostname || '').toLowerCase();
    return (
      host === 'localhost' ||
      host === '127.0.0.1'
    );
  } catch {
    return false;
  }
}

function shouldForceSwCleanupHost(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const host = (window.location.hostname || '').toLowerCase();
    return (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === 'dev.khuyoot.app' ||
      host === 'www.khuyoot.app' ||
      host === 'khuyoot.app'
    );
  } catch {
    return false;
  }
}

async function clearServiceWorkersAndCachesSafely(): Promise<void> {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((reg) => reg.unregister().catch(() => false)));
    }
  } catch {
    // ignore
  }

  try {
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
    }
  } catch {
    // ignore
  }
}

// PWA Service Worker registration (production only)
// - Forces immediate activation on deploy (paired with workbox.skipWaiting/clientsClaim)
// - Forces a reload when an updated SW is ready so users don't stay on stale bundles
// CRITICAL: Skip in private browsing mode where service workers are blocked
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  try {
    if (shouldForceSwCleanupHost()) {
      void clearServiceWorkersAndCachesSafely();
    } else {
    // IMPORTANT: Do NOT import `virtual:pwa-register` from here.
    // Vite will try to resolve it during dev transforms and throw 500s.
    // Instead, dynamically import a local production-only module.
      import('./src/pwa/registerProd').then(({ registerProdServiceWorker }) => {
        registerProdServiceWorker();
      }).catch((err) => {
        console.warn('[PWA] Service worker registration failed (likely private browsing):', err);
      });
    }
  } catch (err) {
    console.warn('[PWA] Service worker not available:', err);
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
  // DEV safety: if a Service Worker from a previous build is still controlling the page,
  // it can serve stale JS and cause confusing runtime errors.
  // Unregister + clear caches ONCE per browser profile.
  try {
    const key = 'khuyoot:dev:sw-cleaned-once';
    if (!localStorage.getItem(key)) {
      navigator.serviceWorker
        .getRegistrations()
        .then(async (regs) => {
          if (!regs || regs.length === 0) {
            localStorage.setItem(key, '1');
            return;
          }

          await Promise.all(
            regs.map((r) =>
              r
                .unregister()
                .catch(() => false)
            )
          );

          try {
            if ('caches' in window) {
              const names = await caches.keys();
              await Promise.all(names.map((n) => caches.delete(n)));
            }
          } catch {
            // ignore
          }

          localStorage.setItem(key, '1');
          window.location.reload();
        })
        .catch(() => {
          localStorage.setItem(key, '1');
        });
    }
  } catch {
    // ignore
  }
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
  const err = "Could not find root element to mount to";
  console.error('[index.tsx]', err);
  throw new Error(err);
}

// CRITICAL: Remove splash screen IMMEDIATELY before React renders
// This prevents black screen flickering on mobile
try {
  const splash = rootElement.querySelector('[data-splash-screen]');
  if (splash) {
    splash.remove();
  }
} catch (e) {
  console.warn('Failed to remove splash screen:', e);
}

try {
  const root = ReactDOM.createRoot(rootElement);
  
  root.render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
} catch (err) {
  console.error('[index.tsx] FATAL ERROR during React mounting:', err);
  throw err;
}

// Service Worker registration completely removed in development
// PWA will be handled during production build only
