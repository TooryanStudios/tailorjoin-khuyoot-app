import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { SplashScreen } from './SplashScreen';
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

  const [isAppVisible, setIsAppVisible] = React.useState(false);
  // Failsafe: If config takes too long, just use fallback
  const [useFallback, setUseFallback] = React.useState(false);

  React.useEffect(() => {
    if (data || useFallback) {
      // Give React a paint boundary, then fade in.
      const raf = requestAnimationFrame(() => setIsAppVisible(true));
      return () => cancelAnimationFrame(raf);
    }

    // If data doesn't load within 5 seconds, force fallback to prevent blank screen
    const timer = setTimeout(() => {
       console.warn('[AppInitializer] Config load timeout after 5s - forcing app render with defaults');
       console.warn('[AppInitializer] This usually means Firebase connection is slow or blocked');
       console.warn('[AppInitializer] Try clearing cache: localStorage.clear(); location.reload();');
       setUseFallback(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [Boolean(data), useFallback]);

  // Zero-flash strategy: do not mount the app shell
  // until we know whether header/footer should exist.
  const configToUse = data || (useFallback ? FALLBACK_SETTINGS : null);

  if (!configToUse) {
    return <SplashScreen />;
  }

  return (
    <div className={isAppVisible ? 'opacity-100 transition-opacity duration-300' : 'opacity-0'}>
      {children(configToUse)}
    </div>
  );
}
