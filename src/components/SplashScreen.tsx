import React from 'react';

export function SplashScreen() {
  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100">
      <div className="mb-6 animate-pulse">
        <img
          src="/pwa-192x192.svg"
          alt="Khuyoot"
          className="h-24 w-24"
          decoding="async"
          loading="eager"
        />
      </div>

      <div className="w-40 h-0.5 bg-slate-800 rounded overflow-hidden">
        <div className="h-full w-full bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse" />
      </div>
    </div>
  );
}
