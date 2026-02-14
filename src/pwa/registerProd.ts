import { registerSW } from 'virtual:pwa-register';

export function registerProdServiceWorker(): void {
  // Guard: Service workers must be supported
  if (!('serviceWorker' in navigator)) {
    console.warn('[PWA] Service workers not supported in this browser');
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
