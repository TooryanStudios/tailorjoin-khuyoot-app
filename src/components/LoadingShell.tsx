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
    <div className="w-full min-h-[var(--app-height,100vh)] bg-slate-50 text-slate-900 font-sans">
      <div className="w-full h-full relative bg-gradient-to-b from-slate-50 to-white">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-44 w-44 rounded-3xl bg-white border border-slate-200 shadow-[0_20px_50px_rgba(15,23,42,0.10)] flex items-center justify-center">
              <img 
                src="/logo.png?v=4" 
                alt="خيوط"
                className="w-[120px] h-[120px] object-contain"
                decoding="async"
                loading="eager"
              />
            </div>
            <div className="mt-4 text-sm text-slate-500 font-medium">
              جاري التحميل...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
