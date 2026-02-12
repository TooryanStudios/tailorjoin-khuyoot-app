import React from 'react';
import { useTranslation } from 'react-i18next';
import { Info, Check, Copy, ExternalLink } from 'lucide-react';

interface MetadataPanelProps {
  features: any;
  activeId: string | null;
  history: any[];
  sourceImageDimensions: { width: number; height: number } | null;
  afterImageDimensions: { width: number; height: number } | null;
  sourceForComparison: string | null;
  afterImage: string | null;
  copyToClipboard: (text: string, label: string) => void;
  copiedUrl: string | null;
}

const ORIGINAL = null as string | null;

const URLDisplay = React.memo(({ label, url, onCopy }: { label: string; url?: string; onCopy: (url: string, label: string) => void }) => {
  const { t } = useTranslation(['designer']);
  if (!url) return <div className="text-zinc-600 italic">{t('urlUnavailable')}</div>;
  const filename = url.split('/').pop()?.split('?')[0] || 'file';
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline text-[10px] font-mono break-all flex items-center gap-1"
        >
          <ExternalLink className="w-3 h-3 flex-shrink-0" />
          {filename}
        </a>
        <button
          onClick={() => onCopy(url, label)}
          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors flex-shrink-0"
          title={t('copyLinkTitle', { label })}
        >
          <Copy className="w-3 h-3 text-zinc-400" />
        </button>
      </div>
    </div>
  );
});

export const DesignerMetadataPanel: React.FC<MetadataPanelProps> = React.memo((props) => {
  const { t, i18n } = useTranslation(['designer']);
  const isAr = i18n.language === 'ar';
  const {
    features, activeId, history, sourceImageDimensions, afterImageDimensions,
    sourceForComparison, afterImage, copyToClipboard, copiedUrl
  } = props;

  if (!features.showFullComparison || !activeId) return null;

  const activeItem = history.find(h => h.jobId === activeId);
  if (!activeItem) return null;

  return (
    <div className="border-t border-zinc-100 bg-white px-6 pt-6 pb-6 shadow-sm">
      <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5 max-w-7xl mx-auto backdrop-blur-md shadow-2xl">
        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Info className="w-4 h-4" />
          {t('generationDetails')}
        </div>

        {/* Currently Displayed Images Info */}
        <div className="mb-6 p-4 bg-zinc-50 rounded-xl border border-zinc-100 shadow-inner">
          <div className="text-[10px] font-black text-purple-600 uppercase tracking-[0.2em] mb-4">{t('currentlyDisplayed')}</div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-zinc-500 mb-1 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                {t('originalLeft')}
              </div>
              <div className="text-zinc-700 font-mono text-[10px] font-bold">
                {sourceImageDimensions ? `${sourceImageDimensions.width} × ${sourceImageDimensions.height}px` : t('loading')}
              </div>
              <div className="text-zinc-400 text-[9px] mt-1 truncate" title={sourceForComparison || ''}>
                {sourceForComparison === ORIGINAL ? t('placeholder') : sourceForComparison?.split('/').pop()?.split('?')[0]}
              </div>
            </div>
            <div>
              <div className="text-zinc-500 mb-1 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                {t('aiRight')}
              </div>
              <div className="text-zinc-700 font-mono text-[10px] font-bold">
                {afterImageDimensions ? `${afterImageDimensions.width} × ${afterImageDimensions.height}px` : t('loading')}
              </div>
              <div className="text-zinc-400 text-[9px] mt-1 truncate" title={afterImage || ''}>
                {afterImage === ORIGINAL ? t('placeholder') : afterImage?.split('/').pop()?.split('?')[0]}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Generation Data */}
        <div className="space-y-4">
          <div>
            <div className="text-zinc-500 mb-1 text-xs">{t('processId')}</div>
            <div className="flex items-center gap-2">
              <div className="text-zinc-700 dark:text-zinc-300 font-mono text-xs flex-1 break-all">{activeId}</div>
              <button
                onClick={() => copyToClipboard(activeId, t('jobId'))}
                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors flex-shrink-0"
                title={t('copyJobId')}
              >
                {copiedUrl === t('jobId') ? (
                  <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                ) : (
                  <Copy className="w-3 h-3 text-zinc-400" />
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-zinc-500 mb-2 text-xs">{t('fullImageLink')}</div>
              <URLDisplay label={t('fullImageLink')} url={activeItem?.fullImageUrl} onCopy={copyToClipboard} />
            </div>
            <div>
              <div className="text-zinc-500 mb-2 text-xs">{t('thumbnailLink')}</div>
              <URLDisplay label={t('thumbnailLink')} url={activeItem?.thumbnailUrl} onCopy={copyToClipboard} />
            </div>
            <div>
              <div className="text-zinc-500 mb-2 text-xs">{t('templateLink')}</div>
              <URLDisplay label={t('templateLink')} url={activeItem?.templateUrl} onCopy={copyToClipboard} />
            </div>
            <div>
              <div className="text-zinc-500 mb-2 text-xs">{t('fabricLink')}</div>
              <URLDisplay label={t('fabricLink')} url={activeItem?.fabricUrl} onCopy={copyToClipboard} />
            </div>
          </div>

          <div>
            <div className="text-zinc-500 mb-1 text-xs">{t('createdAt')}</div>
            <div className="text-zinc-700 dark:text-zinc-300 text-xs">
              {new Date(activeItem?.createdAt || '').toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
