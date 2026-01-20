import React from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { X, Crown, Sparkles, Loader2, Check } from 'lucide-react';

export interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgradeClick?: () => void | Promise<void>;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  onUpgradeClick,
}) => {
  const { t } = useTranslation(['designer']);
  const [phase, setPhase] = React.useState<'idle' | 'progress' | 'done'>('idle');
  const [error, setError] = React.useState<string>('');
  const [activeTab, setActiveTab] = React.useState<'onetime' | 'monthly'>('onetime');
  const timeoutsRef = React.useRef<number[]>([]);

  React.useEffect(() => {
    setPhase('idle');
    setError('');
    setActiveTab('onetime');

    // Prevent global overlay cleanup from removing this modal
    if (isOpen) {
      try { document.body.classList.add('modal-open'); } catch {}
    }

    return () => {
      timeoutsRef.current.forEach((t) => window.clearTimeout(t));
      timeoutsRef.current = [];
      try { document.body.classList.remove('modal-open'); } catch {}
    };
  }, [isOpen]);

  const handleUpgradeClick = async () => {
    if (phase !== 'idle') return;
    setError('');

    setPhase('progress');
    try {
      await Promise.resolve(onUpgradeClick?.());
      setPhase('done');
      timeoutsRef.current.push(window.setTimeout(() => onClose(), 700));
    } catch (e: any) {
      setPhase('idle');
      setError(e?.message || t('upgradeFailed'));
    }
  };

  // Only render UI when open, but always call hooks above.
  if (!isOpen) return null;

  return createPortal(
    <div data-overlay="khuyoot-modal" className="fixed inset-0 z-[10000] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={phase === 'idle' ? onClose : undefined}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md mx-4 bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={phase === 'idle' ? onClose : undefined}
          disabled={phase !== 'idle'}
          className={`absolute top-4 right-4 p-2 transition-colors z-10 ${
            phase === 'idle' ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-600 cursor-not-allowed'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Badge */}
        <div className="px-5 pt-5 pb-3 text-center">
          <div className="inline-flex items-center gap-1.5 mb-2 px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40">
            <Crown className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[10px] font-bold text-purple-300">{t('upgradeBadge')}</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-1">{t('upgradeTitle')}</h2>
          <p className="text-xs text-zinc-400">{t('upgradeSubtitle')}</p>
        </div>

        {/* Features List */}
        <div className="px-5 py-3 space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
            <span className="text-zinc-300">{t('upgradeFeatureRemoveWatermark')}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
            <span className="text-zinc-300">{t('upgradeFeature4k')}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
            <span className="text-zinc-300">{t('upgradeFeaturePriority')}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
            <span className="text-zinc-300">{t('upgradeFeatureAdvancedModels')}</span>
          </div>
        </div>

        {/* Pricing */}
        <div className="px-5 py-3 bg-zinc-900/50 border-t border-zinc-800">
          {/* Tabs */}
          <div className="flex gap-1.5 mb-3">
            <button
              onClick={() => setActiveTab('onetime')}
              className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'onetime'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {t('upgradeTabCredits')}
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'monthly'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {t('upgradeTabMonthly')}
            </button>
          </div>

          {/* One-Time Packs */}
          {activeTab === 'onetime' && (
            <div className="space-y-1.5 animate-in fade-in duration-200">
              <div className="text-[10px] text-center text-purple-400 mb-2 font-medium">{t('upgradeCreditsNeverExpire')}</div>
              <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded hover:bg-zinc-800/50 transition-colors">
                <span className="text-zinc-300">{t('upgradePackStarter')}</span>
                <span className="text-white font-semibold">2 {t('currencyOmr')}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded hover:bg-zinc-800/50 transition-colors">
                <span className="text-zinc-300">{t('upgradePackValue')}</span>
                <span className="text-white font-semibold">5 {t('currencyOmr')}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-2 px-2.5 bg-purple-500/20 border border-purple-500/40 rounded-lg">
                <span className="text-purple-200 font-medium">{t('upgradePackPro')}</span>
                <span className="text-white font-bold">10 {t('currencyOmr')}</span>
              </div>
            </div>
          )}

          {/* Monthly Subscriptions */}
          {activeTab === 'monthly' && (
            <div className="space-y-1.5 animate-in fade-in duration-200">
              <div className="text-[10px] text-center text-emerald-400 mb-2 font-medium">{t('upgradeMonthlyRenews')}</div>
              <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded hover:bg-zinc-800/50 transition-colors">
                <span className="text-zinc-300">{t('upgradeMonthlyBasic')}</span>
                <span className="text-white font-semibold">3 {t('currencyOmr')}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded hover:bg-zinc-800/50 transition-colors">
                <span className="text-zinc-300">{t('upgradeMonthlyStandard')}</span>
                <span className="text-white font-semibold">6 {t('currencyOmr')}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-2 px-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-lg">
                <span className="text-emerald-200 font-medium">{t('upgradeMonthlyPlus')}</span>
                <span className="text-white font-bold">12 {t('currencyOmr')}</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="px-5 py-4 space-y-2.5">
          {error && (
            <div className="rounded-lg border border-red-900/40 bg-red-950/30 px-3 py-2 text-xs text-red-200">
              {error}
            </div>
          )}
          <button
            onClick={handleUpgradeClick}
            disabled={phase !== 'idle'}
            className={`w-full px-4 py-2.5 text-sm text-white font-semibold rounded-lg transition-all shadow-lg shadow-purple-500/20 active:scale-95 flex items-center justify-center gap-2 ${
              phase === 'idle'
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600'
                : phase === 'progress'
                  ? 'bg-gradient-to-r from-purple-700 to-purple-800 opacity-95 cursor-wait'
                  : 'bg-gradient-to-r from-emerald-600 to-emerald-700'
            }`}
          >
            {phase === 'idle' && t('upgradeNow')}
            {phase === 'progress' && (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('upgrading')}</span>
              </>
            )}
            {phase === 'done' && (
              <>
                <Check className="w-4 h-4" />
                <span>{t('upgraded')}</span>
              </>
            )}
          </button>
          <button
            onClick={phase === 'idle' ? onClose : undefined}
            disabled={phase !== 'idle'}
            className={`w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              phase === 'idle'
                ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                : 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
            }`}
          >
            {t('upgradeLater')}
          </button>
        </div>

        {/* Footer Note */}
        <div className="px-5 pb-3 text-center">
          <p className="text-xs text-zinc-500">
            {t('upgradeTrialNote')}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default UpgradeModal;
