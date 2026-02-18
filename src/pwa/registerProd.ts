import { registerSW } from 'virtual:pwa-register';

async function clearServiceWorkersAndCaches(): Promise<void> {
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((reg) => reg.unregister().catch(() => false)));
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

export function registerProdServiceWorker(): void {
  // Guard: Service workers must be supported
  if (!('serviceWorker' in navigator)) {
    console.warn('[PWA] Service workers not supported in this browser');
    return;
  }

  const host = window.location.hostname.toLowerCase();
  const isDevLikeHost =
    host === 'localhost' ||
    host.startsWith('127.') ||
    host.startsWith('192.168.') ||
    host.startsWith('10.') ||
    host.startsWith('172.') ||
    host === 'dev.khuyoot.app' ||
    host.startsWith('dev.');

  if (isDevLikeHost) {
    void clearServiceWorkersAndCaches();
    console.info('[PWA] Skipping service worker on dev/staging host:', host);
    return;
  }

  try {
    let updateSW: undefined | ((reload?: boolean) => Promise<void>);

    updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        try {
          // Ask the SW to skip waiting and reload the page.
          void updateSW?.(true);
        } catch {
          // Fallback: hard reload.
          window.location.reload();
        }
      },
      onRegisterError(error) {
        console.warn('[PWA] Service worker registration failed:', error);
      },
    });
  } catch (error) {
    // Private browsing mode or service workers blocked
    console.warn('[PWA] Failed to register service worker:', error);
  }
}
