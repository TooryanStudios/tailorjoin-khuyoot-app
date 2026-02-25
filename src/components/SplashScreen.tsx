import React from 'react';

export function SplashScreen() {
  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <div className="mb-6">
        <img
          src="/logo.png?v=4"
          alt="Khuyoot"
          className="h-28 w-28"
          decoding="async"
          loading="eager"
        />
      </div>

      <div className="w-40 h-0.5 bg-slate-200 rounded overflow-hidden">
        <div className="h-full w-full bg-gradient-to-r from-transparent via-slate-400 to-transparent animate-pulse" />
      </div>
    </div>
  );
}
