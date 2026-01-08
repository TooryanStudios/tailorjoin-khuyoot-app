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
  const [activeTab, setActiveTab] = React.useState<'onetime' | 'monthly'>('onetime');
  const timeoutsRef = React.useRef<number[]>([]);

  React.useEffect(() => {
    setPhase('idle');
    setError('');
    setActiveTab('onetime');

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
      setError(e?.message || 'فشلت عملية الترقية. يرجى المحاولة مرة أخرى.');
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
        <div className="px-5 pt-5 pb-3 text-center">
          <div className="inline-flex items-center gap-1.5 mb-2 px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40">
            <Crown className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[10px] font-bold text-purple-300">خيوط احترافي</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-1">الترقية إلى احترافي</h2>
          <p className="text-xs text-zinc-400">افتح الميزات المتقدمة وأنشئ تصاميم بدون علامة مائية</p>
        </div>

        {/* Features List */}
        <div className="px-5 py-3 space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
            <span className="text-zinc-300">إزالة العلامات المائية</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
            <span className="text-zinc-300">تصدير 4K</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
            <span className="text-zinc-300">معالجة ذات أولوية</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
            <span className="text-zinc-300">نماذج متقدمة</span>
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
              حزم الرصيد
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'monthly'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              الاشتراك الشهري
            </button>
          </div>

          {/* One-Time Packs */}
          {activeTab === 'onetime' && (
            <div className="space-y-1.5 animate-in fade-in duration-200">
              <div className="text-[10px] text-center text-purple-400 mb-2 font-medium">لا تنتهي صلاحيته أبدًا</div>
              <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded hover:bg-zinc-800/50 transition-colors">
                <span className="text-zinc-300">البداية: 25 توليد</span>
                <span className="text-white font-semibold">2 ر.ع</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded hover:bg-zinc-800/50 transition-colors">
                <span className="text-zinc-300">القيمة: 75 توليد</span>
                <span className="text-white font-semibold">5 ر.ع</span>
              </div>
              <div className="flex items-center justify-between text-xs py-2 px-2.5 bg-purple-500/20 border border-purple-500/40 rounded-lg">
                <span className="text-purple-200 font-medium">الاحترافي: 200 توليد</span>
                <span className="text-white font-bold">10 ر.ع</span>
              </div>
            </div>
          )}

          {/* Monthly Subscriptions */}
          {activeTab === 'monthly' && (
            <div className="space-y-1.5 animate-in fade-in duration-200">
              <div className="text-[10px] text-center text-emerald-400 mb-2 font-medium">ينتهي كل شهر • يتجدد تلقائيًا</div>
              <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded hover:bg-zinc-800/50 transition-colors">
                <span className="text-zinc-300">الأساسي: 100 توليد/شهر</span>
                <span className="text-white font-semibold">3 ر.ع</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded hover:bg-zinc-800/50 transition-colors">
                <span className="text-zinc-300">القياسي: 250 توليد/شهر</span>
                <span className="text-white font-semibold">6 ر.ع</span>
              </div>
              <div className="flex items-center justify-between text-xs py-2 px-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-lg">
                <span className="text-emerald-200 font-medium">بلس: 600 توليد/شهر</span>
                <span className="text-white font-bold">12 ر.ع</span>
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
            {phase === 'idle' && 'الترقية الآن'}
            {phase === 'progress' && (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري الترقية…</span>
              </>
            )}
            {phase === 'done' && (
              <>
                <Check className="w-4 h-4" />
                <span>تمت الترقية</span>
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
            ربما لاحقًا
          </button>
        </div>

        {/* Footer Note */}
        <div className="px-5 pb-3 text-center">
          <p className="text-xs text-zinc-500">
            تجربة مجانية لمدة 7 أيام. الإلغاء في أي وقت.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
