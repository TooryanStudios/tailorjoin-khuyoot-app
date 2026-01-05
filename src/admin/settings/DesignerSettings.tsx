import React from 'react';
import { CheckCircle2, AlertCircle, Loader2, Save, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { SettingsImageUpload } from '../components/SettingsImageUpload';
import type { DesignerCardsRailCard } from '../../../types';

const createDesignerCardId = () => `dcr_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;

export const DesignerSettings: React.FC = () => {
  const { appSettings, saveAppSettings } = useApp();

  const [designerCardsRailEnabled, setDesignerCardsRailEnabled] = React.useState(true);
  const [designerCardsRailTitle, setDesignerCardsRailTitle] = React.useState('Explore');
  const [designerCardsRailMaxCards, setDesignerCardsRailMaxCards] = React.useState(12);
  const [designerCardsRailCardWidthPx, setDesignerCardsRailCardWidthPx] = React.useState(220);
  const [designerCardsRailCardHeightPx, setDesignerCardsRailCardHeightPx] = React.useState(140);
  const [designerCardsRailCardRadiusPx, setDesignerCardsRailCardRadiusPx] = React.useState(16);
  const [designerCardsRailGapPx, setDesignerCardsRailGapPx] = React.useState(12);
  const [designerCardsRailPaddingXPx, setDesignerCardsRailPaddingXPx] = React.useState(16);
  const [designerCards, setDesignerCards] = React.useState<DesignerCardsRailCard[]>([]);

  const [saving, setSaving] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  React.useEffect(() => {
    setDesignerCardsRailEnabled(appSettings.designerCardsRail?.enabled !== false);
    setDesignerCardsRailTitle(appSettings.designerCardsRail?.title || 'Explore');
    setDesignerCardsRailMaxCards(typeof appSettings.designerCardsRail?.maxCards === 'number' ? (appSettings.designerCardsRail?.maxCards as number) : 12);
    setDesignerCardsRailCardWidthPx(typeof appSettings.designerCardsRail?.cardWidthPx === 'number' ? (appSettings.designerCardsRail?.cardWidthPx as number) : 220);
    setDesignerCardsRailCardHeightPx(typeof appSettings.designerCardsRail?.cardHeightPx === 'number' ? (appSettings.designerCardsRail?.cardHeightPx as number) : 140);
    setDesignerCardsRailCardRadiusPx(typeof appSettings.designerCardsRail?.cardRadiusPx === 'number' ? (appSettings.designerCardsRail?.cardRadiusPx as number) : 16);
    setDesignerCardsRailGapPx(typeof appSettings.designerCardsRail?.gapPx === 'number' ? (appSettings.designerCardsRail?.gapPx as number) : 12);
    setDesignerCardsRailPaddingXPx(typeof appSettings.designerCardsRail?.paddingXPx === 'number' ? (appSettings.designerCardsRail?.paddingXPx as number) : 16);
    setDesignerCards((appSettings.designerCardsRail?.cards || []) as DesignerCardsRailCard[]);
  }, [appSettings]);

  const addDesignerCard = () => {
    const next: DesignerCardsRailCard = {
      id: createDesignerCardId(),
      title: 'New card',
      type: 'image',
      mediaUrl: '',
      href: '',
      enabled: true,
    };
    setDesignerCards((prev) => [next, ...prev]);
  };

  const updateDesignerCard = (id: string, patch: Partial<DesignerCardsRailCard>) => {
    setDesignerCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const removeDesignerCard = (id: string) => {
    setDesignerCards((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setSaveStatus('saving');
    try {
      await saveAppSettings(
        {
          ...appSettings,
          designerCardsRail: {
            enabled: designerCardsRailEnabled,
            title: designerCardsRailTitle,
            maxCards: designerCardsRailMaxCards,
            cardWidthPx: designerCardsRailCardWidthPx,
            cardHeightPx: designerCardsRailCardHeightPx,
            cardRadiusPx: designerCardsRailCardRadiusPx,
            gapPx: designerCardsRailGapPx,
            paddingXPx: designerCardsRailPaddingXPx,
            cards: designerCards,
          },
        },
        { silent: true, optimistic: true }
      );
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (e) {
      console.error('Error saving designer settings:', e);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-none min-w-0 px-4 py-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">إعدادات المصمم</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">تحكم في مكونات واجهة المصمم على الموبايل.</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">بطاقات أسفل التاريخ</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">تظهر تحت شريط صور النتائج السابقة في المصمم.</p>
            </div>
            <button
              onClick={() => setDesignerCardsRailEnabled(!designerCardsRailEnabled)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                designerCardsRailEnabled ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
              }`}
              title={designerCardsRailEnabled ? 'مفعّل' : 'معطّل'}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  designerCardsRailEnabled ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">عنوان القسم</label>
              <input
                value={designerCardsRailTitle}
                onChange={(e) => setDesignerCardsRailTitle(e.target.value)}
                className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">أقصى عدد بطاقات معروضة</label>
              <input
                type="number"
                min={0}
                max={99}
                value={designerCardsRailMaxCards}
                onChange={(e) => setDesignerCardsRailMaxCards(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">عرض البطاقة (px)</label>
              <input
                type="number"
                min={120}
                max={600}
                value={designerCardsRailCardWidthPx}
                onChange={(e) => setDesignerCardsRailCardWidthPx(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">ارتفاع البطاقة (px)</label>
              <input
                type="number"
                min={80}
                max={500}
                value={designerCardsRailCardHeightPx}
                onChange={(e) => setDesignerCardsRailCardHeightPx(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">الاستدارة (px)</label>
              <input
                type="number"
                min={0}
                max={60}
                value={designerCardsRailCardRadiusPx}
                onChange={(e) => setDesignerCardsRailCardRadiusPx(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">المسافة بين البطاقات (px)</label>
              <input
                type="number"
                min={0}
                max={60}
                value={designerCardsRailGapPx}
                onChange={(e) => setDesignerCardsRailGapPx(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Padding جانبي (px)</label>
              <input
                type="number"
                min={0}
                max={60}
                value={designerCardsRailPaddingXPx}
                onChange={(e) => setDesignerCardsRailPaddingXPx(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">عدد البطاقات: {designerCards.length}</div>
            <button
              type="button"
              onClick={addDesignerCard}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/50 dark:hover:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs"
            >
              <Plus size={14} />
              إضافة بطاقة
            </button>
          </div>

          <div className="space-y-4">
            {designerCards.map((card) => (
              <div key={card.id} className="rounded-md border border-slate-200 dark:border-slate-700 p-3">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                    {card.title || 'بطاقة بدون عنوان'}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateDesignerCard(card.id, { enabled: card.enabled === false ? true : false })}
                      className={`px-2 py-1 rounded text-xs border ${
                        card.enabled === false
                          ? 'border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400'
                          : 'border-green-300 dark:border-green-700 text-green-700 dark:text-green-400'
                      }`}
                      title={card.enabled === false ? 'معطّلة' : 'مفعّلة'}
                    >
                      {card.enabled === false ? 'OFF' : 'ON'}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeDesignerCard(card.id)}
                      className="p-1.5 rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="حذف"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">النوع</label>
                      <select
                        value={card.type || 'image'}
                        onChange={(e) => updateDesignerCard(card.id, { type: e.target.value as any })}
                        className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">العنوان</label>
                    <input
                      value={card.title}
                      onChange={(e) => updateDesignerCard(card.id, { title: e.target.value })}
                      className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    {card.type === 'video' ? (
                      <>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">رابط الفيديو</label>
                        <input
                          value={card.mediaUrl}
                          onChange={(e) => updateDesignerCard(card.id, { mediaUrl: e.target.value })}
                          placeholder="https://.../video.mp4"
                          className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          يفضّل MP4/HLS. سيتم تشغيله بدون صوت وبشكل دائري.
                        </div>
                      </>
                    ) : (
                      <SettingsImageUpload
                        value={card.mediaUrl}
                        onChange={(url) => updateDesignerCard(card.id, { mediaUrl: url })}
                        label="صورة البطاقة"
                        placeholder="https://example.com/card.jpg"
                        helpText="مثال: 1000x625"
                        storagePath={`designer/cards-rail/${card.id}`}
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">الرابط (اختياري)</label>
                    <input
                      value={card.href || ''}
                      onChange={(e) => updateDesignerCard(card.id, { href: e.target.value })}
                      placeholder="/designer-v2-1 أو https://..."
                      className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">إذا كان يبدأ بـ http سيتم فتحه في تبويب جديد.</div>
                  </div>
                </div>
              </div>
            ))}

            {designerCards.length === 0 && (
              <div className="text-xs text-slate-500 dark:text-slate-400">لا توجد بطاقات حالياً. اضغط "إضافة بطاقة".</div>
            )}
          </div>
        </div>

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
