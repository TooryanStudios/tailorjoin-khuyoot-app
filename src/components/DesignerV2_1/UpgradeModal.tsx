import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/useAuth';
import { createPortal } from 'react-dom';
import { X, Crown, Sparkles, Loader2, Check, Shield } from 'lucide-react';
import { CREDIT_PACKAGES, type PackageType } from '../../modules/CreditManager/purchaseTypes';

export interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgradeClick?: (packageInfo: {
    packageType: PackageType;
    packageName: string;
    credits: number;
    price: number;
    isSubscription: boolean;
  }) => void | Promise<void>;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  onUpgradeClick,
}) => {
  const { t } = useTranslation(['designer']);
  const { idToken } = useAuth();
  const [phase, setPhase] = React.useState<'idle' | 'progress' | 'done'>('idle');
  const [error, setError] = React.useState<string>('');
  const [activeTab, setActiveTab] = React.useState<'onetime' | 'monthly'>('onetime');
  const [selectedOneTime, setSelectedOneTime] = React.useState<'starter' | 'value' | 'pro'>('pro');
  const [selectedMonthly, setSelectedMonthly] = React.useState<'basic' | 'standard' | 'plus'>('plus');
  const timeoutsRef = React.useRef<number[]>([]);

  React.useEffect(() => {
    setPhase('idle');
    setError('');
    setActiveTab('onetime');
    setSelectedOneTime('pro');
    setSelectedMonthly('plus');

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

    // Get selected package details
    const selectedPackageId = activeTab === 'onetime' 
      ? selectedOneTime 
      : `${selectedMonthly}_monthly`;
    
    const packageInfo = CREDIT_PACKAGES[selectedPackageId];
    
    if (!packageInfo) {
      setError('Invalid package selected');
      return;
    }

    setPhase('progress');
    try {
      // 1. Create Thawani Session
      const resp = await fetch('http://localhost:8788/api/payments/thawani/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Pass token if we have it in localStorage (App.tsx sets it)
          'Authorization': `Bearer ${idToken || window.localStorage.getItem('khuyoot:auth:token') || ''}`
        },
        body: JSON.stringify({
          amount: packageInfo.price_omr,
          packageName: packageInfo.name,
          successUrl: window.location.origin + '/designer?payment=success',
          cancelUrl: window.location.origin + '/designer?payment=cancel',
          metadata: {
            credits: packageInfo.credits,
            packageName: packageInfo.name
          }
        })
      });

      if (!resp.ok) {
        const errData = await resp.json();
        throw new Error(errData.error || 'Failed to initiate payment');
      }

      const { checkout_url } = await resp.json();
      
      // 2. Redirect to Thawani
      window.location.href = checkout_url;
      
      // Note: setPhase('done') is usually not reachable because of redirect, 
      // but we handle success state on return to /designer?payment=success
    } catch (e: any) {
      console.error('[Upgrade] Thawani Error:', e);
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
              {import.meta.env.DEV && (
                <button
                  onClick={() => setSelectedOneTime('test')}
                  className={`w-full flex items-center justify-between text-xs py-2 px-2.5 rounded-lg border-2 border-dashed transition-all ${
                    selectedOneTime === 'test'
                      ? 'bg-purple-500/20 border-purple-500/60 ring-1 ring-purple-400/50'
                      : 'border-white/10 hover:border-purple-500/30 bg-purple-500/5'
                  }`}
                >
                  <div className="flex flex-col items-start">
                    <span className="text-purple-300 font-bold uppercase tracking-widest text-[9px]">UAT TEST PACK</span>
                    <span className="text-xs text-white">1 Generation (10 Credits)</span>
                  </div>
                  <span className="text-white font-black">0.1 OMR</span>
                </button>
              )}
              <button
                onClick={() => setSelectedOneTime('starter')}
                className={`w-full flex items-center justify-between text-xs py-2 px-2.5 rounded-lg transition-all ${
                  selectedOneTime === 'starter'
                    ? 'bg-purple-500/20 border border-purple-500/40 ring-1 ring-purple-400/50'
                    : 'hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex flex-col items-start">
                  <span className={selectedOneTime === 'starter' ? 'text-purple-200 font-medium' : 'text-zinc-300'}>{t('upgradePackStarter')}</span>
                  <span className="text-[10px] text-zinc-500">{t('upgradePackStarterCredits')}</span>
                </div>
                <span className={selectedOneTime === 'starter' ? 'text-white font-bold' : 'text-white font-semibold'}>2 {t('currencyOmr')}</span>
              </button>
              <button
                onClick={() => setSelectedOneTime('value')}
                className={`w-full flex items-center justify-between text-xs py-2 px-2.5 rounded-lg transition-all ${
                  selectedOneTime === 'value'
                    ? 'bg-purple-500/20 border border-purple-500/40 ring-1 ring-purple-400/50'
                    : 'hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex flex-col items-start">
                  <span className={selectedOneTime === 'value' ? 'text-purple-200 font-medium' : 'text-zinc-300'}>{t('upgradePackValue')}</span>
                  <span className="text-[10px] text-zinc-500">{t('upgradePackValueCredits')}</span>
                </div>
                <span className={selectedOneTime === 'value' ? 'text-white font-bold' : 'text-white font-semibold'}>5 {t('currencyOmr')}</span>
              </button>
              <button
                onClick={() => setSelectedOneTime('pro')}
                className={`w-full flex items-center justify-between text-xs py-2 px-2.5 rounded-lg transition-all ${
                  selectedOneTime === 'pro'
                    ? 'bg-purple-500/20 border border-purple-500/40 ring-1 ring-purple-400/50'
                    : 'hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex flex-col items-start">
                  <span className={selectedOneTime === 'pro' ? 'text-purple-200 font-medium' : 'text-zinc-300'}>{t('upgradePackPro')}</span>
                  <span className="text-[10px] text-zinc-500">{t('upgradePackProCredits')}</span>
                </div>
                <span className={selectedOneTime === 'pro' ? 'text-white font-bold' : 'text-white font-semibold'}>10 {t('currencyOmr')}</span>
              </button>
            </div>
          )}

          {/* Monthly Subscriptions */}
          {activeTab === 'monthly' && (
            <div className="space-y-1.5 animate-in fade-in duration-200">
              <div className="text-[10px] text-center text-emerald-400 mb-2 font-medium">{t('upgradeMonthlyRenews')}</div>
              <button
                onClick={() => setSelectedMonthly('basic')}
                className={`w-full flex items-center justify-between text-xs py-2 px-2.5 rounded-lg transition-all ${
                  selectedMonthly === 'basic'
                    ? 'bg-emerald-500/20 border border-emerald-500/40 ring-1 ring-emerald-400/50'
                    : 'hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex flex-col items-start">
                  <span className={selectedMonthly === 'basic' ? 'text-emerald-200 font-medium' : 'text-zinc-300'}>{t('upgradeMonthlyBasic')}</span>
                  <span className="text-[10px] text-zinc-500">{t('upgradeMonthlyBasicCredits')}</span>
                </div>
                <span className={selectedMonthly === 'basic' ? 'text-white font-bold' : 'text-white font-semibold'}>3 {t('currencyOmr')}</span>
              </button>
              <button
                onClick={() => setSelectedMonthly('standard')}
                className={`w-full flex items-center justify-between text-xs py-2 px-2.5 rounded-lg transition-all ${
                  selectedMonthly === 'standard'
                    ? 'bg-emerald-500/20 border border-emerald-500/40 ring-1 ring-emerald-400/50'
                    : 'hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex flex-col items-start">
                  <span className={selectedMonthly === 'standard' ? 'text-emerald-200 font-medium' : 'text-zinc-300'}>{t('upgradeMonthlyStandard')}</span>
                  <span className="text-[10px] text-zinc-500">{t('upgradeMonthlyStandardCredits')}</span>
                </div>
                <span className={selectedMonthly === 'standard' ? 'text-white font-bold' : 'text-white font-semibold'}>6 {t('currencyOmr')}</span>
              </button>
              <button
                onClick={() => setSelectedMonthly('plus')}
                className={`w-full flex items-center justify-between text-xs py-2 px-2.5 rounded-lg transition-all ${
                  selectedMonthly === 'plus'
                    ? 'bg-emerald-500/20 border border-emerald-500/40 ring-1 ring-emerald-400/50'
                    : 'hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex flex-col items-start">
                  <span className={selectedMonthly === 'plus' ? 'text-emerald-200 font-medium' : 'text-zinc-300'}>{t('upgradeMonthlyPlus')}</span>
                  <span className="text-[10px] text-zinc-500">{t('upgradeMonthlyPlusCredits')}</span>
                </div>
                <span className={selectedMonthly === 'plus' ? 'text-white font-bold' : 'text-white font-semibold'}>12 {t('currencyOmr')}</span>
              </button>
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
        <div className="px-5 pb-3 text-center space-y-3">
          <p className="text-xs text-zinc-500">
            {t('upgradeTrialNote')}
          </p>

          {/* Development Test Link - Visible for now */}
          <div className="pt-2 border-t border-white/5">
            <a 
              href="/__dev/payment-test"
              className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-purple-400 hover:text-purple-300 transition-colors"
            >
              <Shield size={12} />
              <span>Test Payment Fulfillment</span>
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default UpgradeModal;
