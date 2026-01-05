import React from 'react';

interface SkeletonPanelProps {
  aspectRatio?: string;
  className?: string;
}

export const SkeletonPanel: React.FC<SkeletonPanelProps> = ({ 
  aspectRatio = '3/4',
  className = '' 
}) => {
  return (
    <div 
      className={`relative w-full bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden ${className}`}
      style={{ aspectRatio }}
    >
      <div className="absolute inset-0 animate-pulse">
        <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900" />
        
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-slate-300/50 dark:bg-slate-700/50 flex items-center justify-center">
            <svg 
              className="w-8 h-8 text-slate-400 dark:text-slate-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
              />
            </svg>
          </div>
        </div>
        
        {/* Shimmer effect */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
    </div>
  );
};

interface SkeletonLayoutProps {
  showControls?: boolean;
  showComparison?: boolean;
  showGenerations?: boolean;
}

export const SkeletonLayout: React.FC<SkeletonLayoutProps> = ({
  showControls = true,
  showComparison = true,
  showGenerations = false
}) => {
  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-[140px_auto_110px] gap-2 p-2">
      {/* Left Controls Skeleton */}
      {showControls && (
        <div className="space-y-2">
          <div className="w-full h-24 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
          <div className="w-full h-24 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
          <div className="w-full h-10 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        </div>
      )}
      
      {/* Center Comparison Skeleton */}
      {showComparison && (
        <div className="flex items-center justify-center">
          <SkeletonPanel aspectRatio="3/4" className="max-w-[450px]" />
        </div>
      )}
      
      {/* Right Generations Skeleton */}
      {showGenerations && (
        <div className="space-y-2">
          <div className="w-full aspect-[3/4] bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
          <div className="w-full aspect-[3/4] bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        </div>
      )}
    </div>
  );
};
