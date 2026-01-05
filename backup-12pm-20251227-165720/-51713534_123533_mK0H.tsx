import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

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
    <App />
  </React.StrictMode>
);

// Register Service Worker in production builds (VitePWA generates `sw.js`).
// Keep dev free of SW to prevent caching/HMR issues.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '/') as string;
  const swUrl = `${base}sw.js`;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(swUrl, { scope: base })
      .catch(() => {
        // Intentionally silent: prod builds drop console output.
      });
  });
}
