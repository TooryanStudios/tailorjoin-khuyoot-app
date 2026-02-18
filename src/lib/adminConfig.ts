import { firebaseService } from '../../services/firebase';
import type { AppSettings } from '../../types';

export const ADMIN_CONFIG_QUERY_KEY = ['admin-config'] as const;

export async function fetchAdminConfig(): Promise<AppSettings> {
  try {
    const isInit = firebaseService.isInitialized();
    
    if (!isInit) {
      // In dev/offline or when Firebase isn't configured, fall back to defaults
      return await firebaseService.getGlobalSettings();
    }

    // Prefer strict fetch (longer timeout, no internal fallback) to reduce header/footer flashes.
    // But NEVER allow this to break the app shell: if it fails, fall back to non-strict defaults.
    const anyService = firebaseService as any;
    let result: AppSettings;

    if (typeof anyService.getGlobalSettingsStrict === 'function') {
      result = (await anyService.getGlobalSettingsStrict({ timeoutMs: 7000 })) as AppSettings;
    } else {
      // Fallback if strict API isn't available yet
      console.log('[fetchAdminConfig] Using standard fetch...');
      result = await firebaseService.getGlobalSettings();
    }

    try {
      localStorage.setItem('khuyoot:admin-config:cache:v1', JSON.stringify({
        data: result,
        timestamp: Date.now()
      }));
    } catch (e) {}

    return result;
  } catch (error) {
    // Critical: AppInitializer uses this query to decide whether to mount the app.
    // If we throw here, users can get a permanent blank/splash screen.
    console.error('[fetchAdminConfig] Error fetching config:', error);
    console.warn('[fetchAdminConfig] Falling back to default settings');
    return await firebaseService.getGlobalSettings();
  }
}

export function getCachedAdminConfig(): AppSettings | undefined {
  try {
    const cached = localStorage.getItem('khuyoot:admin-config:cache:v1');
    if (!cached) return undefined;
    const { data } = JSON.parse(cached);
    return data as AppSettings;
  } catch {
    return undefined;
  }
}
