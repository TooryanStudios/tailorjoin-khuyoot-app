import React from 'react';
import { Check, Download, Maximize2, Share2, ZoomIn } from 'lucide-react';
import { LightingPresets, type LightingPreset } from '../components/LightingPresets';
import type { DesignerV2Features } from '../types';

type ToolsAndLightingProps = {
  t: (key: string) => string;
  isMobile: boolean;
  features: DesignerV2Features;
  lightingValue: LightingPreset;
  onLightingChange: (preset: LightingPreset) => void;
  shareUrlCopied: boolean;
  onShare: () => void;
  currentTaskId: string | null;
};

export function ToolsAndLightingPanel({
  t,
  isMobile,
  features,
  lightingValue,
  onLightingChange,
  shareUrlCopied,
  onShare,
  currentTaskId,
}: ToolsAndLightingProps) {
  return (
    <div className="mt-2 flex items-center justify-between gap-6">
      <div className="flex-1">
        <LightingPresets value={lightingValue} onChange={onLightingChange} />
      </div>

      {!isMobile && features.showFloatingToolbar && (
        <div className="flex items-center gap-2 h-12 px-2 rounded-xl border border-zinc-800 bg-zinc-900/60">
          <button
            type="button"
            title={shareUrlCopied ? t('shareLinkCopied') : t('shareDesign')}
            onClick={onShare}
            disabled={!currentTaskId}
            className={`p-2 bg-zinc-900/90 border rounded-lg transition-all ${
              shareUrlCopied ? 'border-green-500/60 bg-green-500/10' : 'border-zinc-800 hover:border-purple-500/60'
            } ${!currentTaskId ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {shareUrlCopied ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4 text-zinc-300" />}
          </button>
          <button
            type="button"
            title={t('resultLoading')}
            className="p-2 bg-zinc-900/90 border border-zinc-800 rounded-lg hover:border-purple-500/60 transition-colors"
          >
            <Download className="w-4 h-4 text-zinc-300" />
          </button>
          <button
            type="button"
            title={t('zoomIn')}
            className="p-2 bg-zinc-900/90 border border-zinc-800 rounded-lg hover:border-purple-500/60 transition-colors"
          >
            <ZoomIn className="w-4 h-4 text-zinc-300" />
          </button>
          <button
            type="button"
            title={t('fullscreen')}
            className="p-2 bg-zinc-900/90 border border-zinc-800 rounded-lg hover:border-purple-500/60 transition-colors"
          >
            <Maximize2 className="w-4 h-4 text-zinc-300" />
          </button>
        </div>
      )}
    </div>
  );
}
