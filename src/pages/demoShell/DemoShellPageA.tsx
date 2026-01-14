import React from 'react';
import { useOutletContext } from 'react-router-dom';
import type { DemoShellOutletContext } from './DemoShellLayout';

type DemoImageCardProps = {
  src: string;
  loaded: boolean;
};

function DemoImageCard({ src, loaded }: DemoImageCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
      <div className="px-3 py-2 flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{src}</div>
        <div
          className={
            loaded
              ? 'text-xs font-semibold text-purple-700 dark:text-purple-300'
              : 'text-xs font-semibold text-slate-500 dark:text-slate-400'
          }
        >
          {loaded ? 'Loaded' : 'Loading'}
        </div>
      </div>

      <div className="relative w-full aspect-[16/9] bg-slate-100 dark:bg-slate-950">
        <img
          src={src}
          alt=""
          className="absolute inset-0 w-full h-full object-contain"
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  );
}

export function DemoShellPageA() {
  const renderCountRef = React.useRef(0);
  
  React.useEffect(() => {
    renderCountRef.current++;
    console.log(`[PageA] Render #${renderCountRef.current}`);
  });
  
  const { pageCounters, setPageCounter, imageUrls, imageLoadedMap } = useOutletContext<DemoShellOutletContext>();
  const pageCounter = pageCounters.a;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">Page A</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Switch between A/B — the layout timestamp & layout counter should persist. This page counter is stored in the layout too.
      </p>

      <div className="mt-4 flex items-center justify-between gap-3 text-sm">
        <div className="text-slate-700 dark:text-slate-300">
          <span className="font-semibold">Page A counter:</span> {pageCounter}
        </div>
        <button
          type="button"
          onClick={() => setPageCounter('a', (c) => c + 1)}
          className="h-9 px-3 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold"
        >
          +1
        </button>
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Images (preloaded in layout)</h2>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
          These URLs are preloaded by the layout. Switching between pages should keep them cached.
        </p>

        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {imageUrls.a.map((src) => (
            <DemoImageCard key={src} src={src} loaded={!!imageLoadedMap[src]} />
          ))}
        </div>
      </div>
    </div>
  );
}
