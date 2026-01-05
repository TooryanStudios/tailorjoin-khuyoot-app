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
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Homepage 2.1 (Omani Boutique)</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage the new homepage layout blocks and live preview.</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">Activation</h3>
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-md">
            <div>
              <div className="text-sm text-slate-900 dark:text-white">Enable Homepage 2.1</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Replaces the classic homepage for all users</div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setEnableHomepageV2((prev) => !prev);
              }}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                enableHomepageV2 ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  enableHomepageV2 ? 'translate-x-4' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <HomepageV2VisibilityToggle />

        <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-5 py-4 rounded-lg shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 min-h-[24px]">
              {saveStatus === 'saving' && (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>جارٍ الحفظ...</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <CheckCircle2 className="text-green-500" size={16} />
                  <span className="text-green-600 dark:text-green-400">تم الحفظ</span>
                </>
              )}
              {saveStatus === 'error' && (
                <>
                  <AlertCircle className="text-red-500" size={16} />
                  <span className="text-red-600 dark:text-red-400">تعذر الحفظ</span>
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
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Save size={16} />
              {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
