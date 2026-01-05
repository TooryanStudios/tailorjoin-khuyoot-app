import React from 'react';
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
  if (!isOpen) return null;

  const [phase, setPhase] = React.useState<'idle' | 'progress' | 'done'>('idle');
  const [error, setError] = React.useState<string>('');
  const timeoutsRef = React.useRef<number[]>([]);

  React.useEffect(() => {
    setPhase('idle');
    setError('');

    return () => {
      timeoutsRef.current.forEach((t) => window.clearTimeout(t));
      timeoutsRef.current = [];
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
      setError(e?.message || 'Upgrade failed. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
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
        <div className="px-6 pt-8 pb-4 text-center">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40">
            <Crown className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-purple-300">KHUYOOT PRO</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Upgrade to Pro</h2>
          <p className="text-sm text-zinc-400">Unlock premium features and create watermark-free designs</p>
        </div>

        {/* Features List */}
        <div className="px-6 py-6 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Remove Watermarks</p>
              <p className="text-xs text-zinc-400">Clean, professional images without watermarks</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">4K Exports</p>
              <p className="text-xs text-zinc-400">Ultra-high resolution downloads for print</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Priority Processing</p>
              <p className="text-xs text-zinc-400">Faster generation without rate limits</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Advanced Models</p>
              <p className="text-xs text-zinc-400">Access to latest AI fabric swap engines</p>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="px-6 py-4 bg-zinc-900/50 border-t border-zinc-800">
          <div className="flex items-baseline justify-center gap-1 mb-2">
            <span className="text-3xl font-bold text-white">$9.99</span>
            <span className="text-sm text-zinc-400">/month</span>
          </div>
          <p className="text-xs text-zinc-500 text-center">or $99/year (save 17%)</p>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-6 space-y-3">
          {error && (
            <div className="rounded-lg border border-red-900/40 bg-red-950/30 px-3 py-2 text-xs text-red-200">
              {error}
            </div>
          )}
          <button
            onClick={handleUpgradeClick}
            disabled={phase !== 'idle'}
            className={`w-full px-4 py-3 text-white font-semibold rounded-lg transition-all shadow-lg shadow-purple-500/20 active:scale-95 flex items-center justify-center gap-2 ${
              phase === 'idle'
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600'
                : phase === 'progress'
                  ? 'bg-gradient-to-r from-purple-700 to-purple-800 opacity-95 cursor-wait'
                  : 'bg-gradient-to-r from-emerald-600 to-emerald-700'
            }`}
          >
            {phase === 'idle' && 'Upgrade Now'}
            {phase === 'progress' && (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Upgrading…</span>
              </>
            )}
            {phase === 'done' && (
              <>
                <Check className="w-4 h-4" />
                <span>Upgraded</span>
              </>
            )}
          </button>
          <button
            onClick={phase === 'idle' ? onClose : undefined}
            disabled={phase !== 'idle'}
            className={`w-full px-4 py-2 font-medium rounded-lg transition-colors ${
              phase === 'idle'
                ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                : 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
            }`}
          >
            Maybe Later
          </button>
        </div>

        {/* Footer Note */}
        <div className="px-6 pb-4 text-center">
          <p className="text-xs text-zinc-500">
            7-day free trial. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
