import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { LoadingShell } from './LoadingShell';
import { ADMIN_CONFIG_QUERY_KEY, fetchAdminConfig } from '../lib/adminConfig';
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
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const [isAppVisible, setIsAppVisible] = React.useState(true); // START VISIBLE to prevent black screen
  // Failsafe: If config takes too long, just use fallback
  const [useFallback, setUseFallback] = React.useState(false);

  React.useEffect(() => {
    if (data || useFallback) {
      // Config loaded, ensure visibility (already true by default)
      setIsAppVisible(true);
    }

    // If data doesn't load within 2 seconds, force fallback to prevent blank screen
    // REDUCED from 5s to 2s - users shouldn't wait longer than this
    const timer = setTimeout(() => {
       console.warn('[AppInitializer] Config load timeout after 2s - forcing app render with defaults');
       console.warn('[AppInitializer] This usually means Firebase connection is slow or blocked');
       console.warn('[AppInitializer] Try clearing cache: localStorage.clear(); location.reload();');
       setUseFallback(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, [Boolean(data), useFallback]);

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
