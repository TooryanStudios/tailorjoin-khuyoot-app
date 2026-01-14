import React from 'react';
import { CheckCircle2, AlertCircle, Loader2, Save } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { VisibilityToggle as HomepageV2VisibilityToggle } from '../homepage-v2/VisibilityToggle';

export const HomePageV2Settings: React.FC = () => {
  const { appSettings, saveAppSettings } = useApp();

  const [enableHomepageV2, setEnableHomepageV2] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  React.useEffect(() => {
    const nextEnabled = Boolean((appSettings as any)?.homePageSettings?.enableHomepageV2);
    setEnableHomepageV2((prev) => (prev === nextEnabled ? prev : nextEnabled));
  }, [appSettings]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setSaveStatus('saving');
    try {
      const prevHomePageSettings = ((appSettings as any)?.homePageSettings ?? {}) as Record<string, unknown>;
      await saveAppSettings(
        {
          ...(appSettings as any),
          homePageSettings: {
            ...prevHomePageSettings,
            enableHomepageV2,
          },
        },
        { silent: true, optimistic: true }
      );
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (e) {
      console.error('Error saving homepage v2 settings:', e);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-none min-w-0 px-4 py-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">Homepage 2.1 (Omani Boutique)</h2>
        <p className="text-slate-400 mt-2">Manage the new homepage layout blocks and live preview.</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Activation</h3>
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
            <div>
              <div className="text-base font-medium text-white">Enable Homepage 2.1</div>
              <div className="text-sm text-slate-400">Replaces the classic homepage for all users</div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setEnableHomepageV2((prev) => !prev);
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
                enableHomepageV2 ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                  enableHomepageV2 ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <HomepageV2VisibilityToggle />

        <div className="sticky bottom-6 mt-8 bg-slate-900/80 backdrop-blur-md border border-white/10 px-6 py-4 rounded-2xl shadow-2xl z-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm font-medium text-slate-300 min-h-[24px]">
              {saveStatus === 'saving' && (
                <>
                  <Loader2 className="animate-spin text-blue-400" size={18} />
                  <span>جارٍ الحفظ...</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <CheckCircle2 className="text-green-400" size={18} />
                  <span className="text-green-400">تم الحفظ بنجاح</span>
                </>
              )}
              {saveStatus === 'error' && (
                <>
                  <AlertCircle className="text-red-400" size={18} />
                  <span className="text-red-400">تعذر الحفظ، حاول مرة أخرى</span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSave();
              }}
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20 active:scale-95"
            >
              <Save size={18} />
              {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
