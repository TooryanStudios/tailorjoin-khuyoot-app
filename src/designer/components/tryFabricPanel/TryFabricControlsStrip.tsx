import React from 'react';

export function TryFabricControlsStrip(props: {
  onRequestHelp?: () => void;
}) {
  const { onRequestHelp } = props;

  if (!onRequestHelp) return null;

  return (
    <div className="flex items-stretch gap-3">
      <button
        type="button"
        onClick={onRequestHelp}
        className="shrink-0 px-4 min-w-[96px] rounded-3xl text-xs font-black bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white shadow-xl shadow-violet-500/30 hover:shadow-2xl hover:shadow-violet-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center"
        title="مساعدة"
      >
        مساعدة
      </button>
    </div>
  );
}
