import * as React from 'react';

export type ProcessingOverlayProps = {
  progress: number;
  message?: string;
};

export function ProcessingOverlay(props: ProcessingOverlayProps) {
  const { progress, message } = props;
  const defaultMessage = progress >= 95 ? 'Finalizing...' : 'Enhancing Details...';

  return (
    <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-950/40 backdrop-blur-md overflow-hidden">
      {/* Animated Scan Line */}
      <div className="scan-line" />
      
      <div className="w-64 relative z-10">
        <div className="flex justify-between mb-2">
          <span className="text-[10px] font-black text-theme-primary uppercase tracking-[0.2em]">
            {message || defaultMessage}
          </span>
          <span className="text-[11px] font-black text-white">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-theme-primary to-theme-secondary transition-all duration-300 ease-out shadow-[0_0_15px_var(--theme-primary-glow)]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-4 flex flex-col items-center gap-1">
          <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest italic opacity-60 flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-theme-primary animate-pulse" />
            Khuyoot Neural Engine V2.1
          </p>
        </div>
      </div>
    </div>
  );
}
