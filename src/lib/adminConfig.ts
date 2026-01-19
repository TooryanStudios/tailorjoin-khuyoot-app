import { firebaseService } from '../../services/firebase';
import type { AppSettings } from '../../types';

export const ADMIN_CONFIG_QUERY_KEY = ['admin-config'] as const;

export async function fetchAdminConfig(): Promise<AppSettings> {
  console.log('[fetchAdminConfig] Starting config fetch...');
  try {
    const isInit = firebaseService.isInitialized();
    console.log('[fetchAdminConfig] Firebase initialized:', isInit);
    
    if (!isInit) {
      console.warn('[fetchAdminConfig] Firebase not initialized - using defaults');
      // In dev/offline or when Firebase isn't configured, fall back to defaults
      return await firebaseService.getGlobalSettings();
    }

    // Prefer strict fetch (longer timeout, no internal fallback) to reduce header/footer flashes.
    // But NEVER allow this to break the app shell: if it fails, fall back to non-strict defaults.
    const anyService = firebaseService as any;
    if (typeof anyService.getGlobalSettingsStrict === 'function') {
      console.log('[fetchAdminConfig] Using strict fetch with 15s timeout...');
      return (await anyService.getGlobalSettingsStrict({ timeoutMs: 15000 })) as AppSettings;
    }

    // Fallback if strict API isn't available yet
    console.log('[fetchAdminConfig] Using standard fetch...');
    return await firebaseService.getGlobalSettings();
  } catch (error) {
    // Critical: AppInitializer uses this query to decide whether to mount the app.
    // If we throw here, users can get a permanent blank/splash screen.
    console.error('[fetchAdminConfig] Error fetching config:', error);
    console.warn('[fetchAdminConfig] Falling back to default settings');
    return await firebaseService.getGlobalSettings();
  }
}
