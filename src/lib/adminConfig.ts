import { firebaseService } from '../../services/firebase';
import type { AppSettings } from '../../types';

export const ADMIN_CONFIG_QUERY_KEY = ['admin-config'] as const;

export async function fetchAdminConfig(): Promise<AppSettings> {
  if (!firebaseService.isInitialized()) {
    // In dev/offline or when Firebase isn't configured, fall back to defaults
    return firebaseService.getGlobalSettings();
  }

  // Strict fetch: do not fall back to default settings due to a short timeout.
  // We want to avoid rendering a "default" header/footer and then flipping it.
  const anyService = firebaseService as any;
  if (typeof anyService.getGlobalSettingsStrict === 'function') {
    return anyService.getGlobalSettingsStrict({ timeoutMs: 15000 }) as Promise<AppSettings>;
  }

  // Fallback if strict API isn't available yet
  return firebaseService.getGlobalSettings();
}
