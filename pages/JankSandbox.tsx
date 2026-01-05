import React from 'react';

// Minimal blank page to validate no theme flash or layout shift.
export const JankSandbox: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-none">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-semibold mb-4">Jank Sandbox</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          This page is intentionally minimal to verify that first paint has no flash and layout stays stable.
        </p>
      </div>
    </div>
  );
};
