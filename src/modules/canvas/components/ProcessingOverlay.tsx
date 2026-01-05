import * as React from 'react';

export type ProcessingOverlayProps = {
  progress: number;
};

export function ProcessingOverlay(props: ProcessingOverlayProps) {
  const { progress } = props;

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-64">
        <div className="flex justify-between mb-2">
          <span className="text-xs font-bold text-purple-400 uppercase">
            {progress >= 95 ? 'Finalizing...' : 'Enhancing Details...'}
          </span>
          <span className="text-xs font-mono text-white">{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-4 text-zinc-400 text-[10px] text-center italic">Using Designer V2.1 Neural Engine...</p>
      </div>
    </div>
  );
}
