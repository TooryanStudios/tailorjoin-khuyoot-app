import * as React from 'react';

export type ProcessingOverlayProps = {
  progress: number;
  message?: string;
};

export function ProcessingOverlay(props: ProcessingOverlayProps) {
  const { progress, message } = props;
  const defaultMessage = progress >= 95 ? 'Finalizing...' : 'Enhancing Details...';

  return (
    <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 backdrop-blur-md overflow-hidden">
      {/* Animated Scan Line */}
      <div className="scan-line" />
      
      <div className="w-64 relative z-10">
        <div className="flex justify-between mb-2">
          <span className="text-[11px] font-black text-white uppercase tracking-[0.2em] drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            {message || defaultMessage}
          </span>
          <span className="text-[13px] font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">{Math.round(progress)}%</span>
        </div>
        <div className="h-2.5 w-full bg-black/40 rounded-full overflow-hidden border border-white shadow-lg">
          <div
            className="h-full bg-[var(--theme-primary)] transition-all duration-300 ease-out shadow-[0_0_20px_var(--theme-primary)]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-4 flex flex-col items-center gap-1">
          <p className="text-white text-[10px] font-bold uppercase tracking-widest italic flex items-center gap-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            Khuyoot Neural Engine V2.1
          </p>
        </div>
      </div>
    </div>
  );
}
