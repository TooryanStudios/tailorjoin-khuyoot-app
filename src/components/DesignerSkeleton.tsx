import React from 'react';

/**
 * DesignerSkeleton
 * 
 * Mimics the layout of DesignerV2_1 with animated pulse placeholders
 * to prevent layout shifting during auth hydration.
 */
export const DesignerSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#050817] text-white flex flex-col overflow-hidden">
      {/* Top Bar / Header Placeholder */}
      <div className="h-14 border-b border-zinc-800/50 bg-zinc-950/50 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-zinc-800 rounded-lg animate-pulse" />
          <div className="h-4 w-32 bg-zinc-800 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-4">
          <div className="h-8 w-24 bg-zinc-800 rounded-full animate-pulse" />
          <div className="h-8 w-8 bg-zinc-800 rounded-full animate-pulse" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Placeholder */}
        <div className="w-80 border-r border-zinc-800/50 bg-zinc-950/30 p-6 flex flex-col gap-8 shrink-0">
          {/* User Image Section */}
          <div className="space-y-3">
            <div className="h-3 w-20 bg-zinc-800 rounded animate-pulse" />
            <div className="aspect-square w-full bg-zinc-800/50 rounded-xl animate-pulse" />
          </div>

          {/* Fabric/Texture Section */}
          <div className="space-y-3">
            <div className="h-3 w-24 bg-zinc-800 rounded animate-pulse" />
            <div className="grid grid-cols-2 gap-3">
              <div className="aspect-square bg-zinc-800/50 rounded-lg animate-pulse" />
              <div className="aspect-square bg-zinc-800/50 rounded-lg animate-pulse" />
            </div>
          </div>

          {/* Style Section */}
          <div className="space-y-3">
            <div className="h-3 w-16 bg-zinc-800 rounded animate-pulse" />
            <div className="h-10 w-full bg-zinc-800/50 rounded-lg animate-pulse" />
            <div className="h-10 w-full bg-zinc-800/50 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Main Canvas Area Placeholder */}
        <div className="flex-1 bg-zinc-900/10 relative flex items-center justify-center p-12">
          <div className="w-full h-full max-w-4xl bg-zinc-800/20 rounded-2xl border border-zinc-800/30 animate-pulse flex items-center justify-center">
            <div className="h-12 w-12 border-4 border-zinc-700 border-t-purple-500 rounded-full animate-spin opacity-30" />
          </div>
          
          {/* Bottom Bar placeholder */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-96 h-14 bg-zinc-900/80 border border-zinc-800 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
};
