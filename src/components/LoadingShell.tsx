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
            <div className="mx-auto rounded-lg overflow-hidden" style={{height: '200px', width: '200px'}}>
              <img 
                src="/logo_big.png?v=4" 
                alt="خيوط"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              جاري التحميل...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
