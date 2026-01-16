import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import 'react-image-crop/dist/ReactCrop.css';
import App from './App';
import { queryClient } from './src/lib/queryClient';

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
  console.log('🔧 Development mode: Cleaning up service workers...');
  
  // Force unregister all service workers
  navigator.serviceWorker.getRegistrations().then(registrations => {
    if (registrations.length > 0) {
      console.log(`🔧 Found ${registrations.length} service worker(s), unregistering...`);
      registrations.forEach(registration => {
        registration.unregister().then(success => {
          if (success) {
            console.log('✅ Service Worker unregistered successfully');
          }
        });
      });
    } else {
      console.log('✅ No service workers to unregister');
    }
  });
  
  // Force clear all caches
  if ('caches' in window) {
    caches.keys().then(names => {
      if (names.length > 0) {
        console.log(`🧹 Found ${names.length} cache(s), clearing...`);
        names.forEach(name => {
          caches.delete(name).then(() => {
            console.log(`✅ Cache deleted: ${name}`);
          });
        });
      } else {
        console.log('✅ No caches to clear');
      }
    });
  }
  
  // Kill active service worker immediately
  if (navigator.serviceWorker.controller) {
    console.log('⚠️ Active service worker detected, posting SKIP_WAITING message');
    navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
  }
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
