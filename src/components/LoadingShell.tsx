import React from 'react';

/**
 * LoadingShell
 * 
 * Full-page loading skeleton that matches the app background.
 * Prevents visual flashing during:
 * - Zustand hydration
 * - AppSettings loading from Firestore
 * - Header/Footer visibility checks
 */
export const LoadingShell: React.FC = () => {
  return (
    <div 
      className="min-h-screen w-full bg-slate-50 dark:bg-[#050817] text-slate-900 dark:text-slate-100 font-sans"
      style={{ height: 'var(--app-height, 100vh)' }}
    >
      {/* Animated gradient skeleton - subtly different from background */}
      <div className="w-full h-full animate-pulse bg-gradient-to-b from-slate-100 to-slate-50 dark:from-slate-900 dark:to-[#050817]" />
    </div>
  );
};
