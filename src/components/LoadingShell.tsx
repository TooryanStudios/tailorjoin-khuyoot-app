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
      <div className="w-full h-full relative animate-pulse bg-gradient-to-b from-slate-100 to-slate-50 dark:from-slate-900 dark:to-[#050817]">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-lg overflow-hidden">
              <img 
                src="/logo.png" 
                alt="خيوط"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-300">جاري التحميل...</div>
          </div>
        </div>
      </div>
    </div>
  );
};
