import React from 'react';

export function SplashScreen() {
  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100">
      <div className="mb-6 animate-pulse">
        <img
          src="/logo_big.png?v=4"
          alt="Khuyoot"
          className="h-32 w-32"
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
