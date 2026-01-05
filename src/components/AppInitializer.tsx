import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { SplashScreen } from './SplashScreen';
import { ADMIN_CONFIG_QUERY_KEY, fetchAdminConfig } from '../lib/adminConfig';
import type { AppSettings } from '../../types';

type AppInitializerProps = {
  children: (config: AppSettings) => React.ReactNode;
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

  React.useEffect(() => {
    if (!data) {
      setIsAppVisible(false);
      return;
    }

    // Give React a paint boundary, then fade in.
    const raf = requestAnimationFrame(() => setIsAppVisible(true));
    return () => cancelAnimationFrame(raf);
  }, [Boolean(data)]);

  // CSS gating: prevent .app-header/.app-footer from ever painting
  // before we've confirmed the config shape.
  try {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-shell-ready', data ? '1' : '0');
      if (data) {
        document.documentElement.classList.remove('hide-shell-elements');
      } else {
        document.documentElement.classList.add('hide-shell-elements');
      }
    }
  } catch {
    // ignore
  }

  // Zero-flash strategy: do not mount the app shell
  // until we know whether header/footer should exist.
  if (!data) {
    return <SplashScreen />;
  }

  return (
    <div className={isAppVisible ? 'opacity-100 transition-opacity duration-300' : 'opacity-0'}>
      {children(data)}
    </div>
  );
}
