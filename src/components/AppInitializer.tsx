import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { LoadingShell } from './LoadingShell';
import { ADMIN_CONFIG_QUERY_KEY, fetchAdminConfig, getCachedAdminConfig } from '../lib/adminConfig';
import type { AppSettings } from '../../types';

type AppInitializerProps = {
  children: (config: AppSettings) => React.ReactNode;
};

const FALLBACK_SETTINGS: AppSettings = {
  storiesEnabled: true,
  maintenanceMode: false,
  allowNewRegistrations: true,
  designerEnabled: true,
  cartEnabled: true,
  showHeader: true,
  productCategories: [
    { id: 'dishdasha', name: 'الدشاديش' },
    { id: 'jacket', name: 'الجاكيت' },
    { id: 'abaya', name: 'العبايات' },
    { id: 'kids', name: 'الأطفال' },
    { id: 'shoes', name: 'الأحذية' },
  ]
};

export function AppInitializer({ children }: AppInitializerProps) {
  const { data } = useQuery({
    queryKey: ADMIN_CONFIG_QUERY_KEY,
    queryFn: fetchAdminConfig,
    initialData: getCachedAdminConfig,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const [isAppVisible, setIsAppVisible] = React.useState(true); // START VISIBLE to prevent black screen
  // Failsafe: If config takes too long, just use fallback
  const [useFallback, setUseFallback] = React.useState(false);
  const warnedRef = React.useRef(false);

  React.useEffect(() => {
    if (data || useFallback) {
      // Config loaded, ensure visibility (already true by default)
      setIsAppVisible(true);
    }

    // If config doesn't load in time, fall back to defaults (avoid blank screens).
    // Keep this less aggressive to reduce noisy warnings on slower connections.
    if (data || useFallback) return;
    const timeoutMs = 6000;
    const timer = window.setTimeout(() => {
      if (warnedRef.current) return;
      warnedRef.current = true;
      console.warn(`[AppInitializer] Config load timeout after ${timeoutMs}ms - using defaults`);
      setUseFallback(true);
    }, timeoutMs);
    return () => window.clearTimeout(timer);
  }, [Boolean(data), useFallback]);

  // Cache fallback settings if we are forced to use them, 
  // ensuring the NEXT load is instant.
  React.useEffect(() => {
    if (useFallback && !data) {
      try {
        localStorage.setItem('khuyoot:admin-config:cache:v1', JSON.stringify({
          data: FALLBACK_SETTINGS,
          timestamp: Date.now()
        }));
      } catch {}
    }
  }, [useFallback, data]);

  // Zero-flash strategy: do not mount the app shell
  // until we know whether header/footer should exist.
  const configToUse = data || (useFallback ? FALLBACK_SETTINGS : null);

  if (!configToUse) {
    return <LoadingShell />;
  }

  // No opacity wrapper - LoadingShell and app should be immediately visible
  // The splash screen removal in index.tsx handles the transition
  return <>{children(configToUse)}</>;
}
