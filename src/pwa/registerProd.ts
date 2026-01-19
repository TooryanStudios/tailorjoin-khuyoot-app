import { registerSW } from 'virtual:pwa-register';

export function registerProdServiceWorker(): void {
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
  });
}
