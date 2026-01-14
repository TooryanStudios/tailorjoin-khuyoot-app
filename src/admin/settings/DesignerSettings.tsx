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
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">إعدادات المصمم</h2>
        <p className="text-slate-400 mt-2">تحكم في مكونات واجهة المصمم على الموبايل.</p>
      </div>

      <div className="space-y-6">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">بطاقات أسفل التاريخ</h3>
              <p className="text-sm text-slate-400 mt-1">تظهر تحت شريط صور النتائج السابقة في المصمم.</p>
            </div>
            <button
              onClick={() => setDesignerCardsRailEnabled(!designerCardsRailEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
                designerCardsRailEnabled ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-slate-700'
              }`}
              title={designerCardsRailEnabled ? 'مفعّل' : 'معطّل'}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                  designerCardsRailEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">عنوان القسم</label>
              <input
                value={designerCardsRailTitle}
                onChange={(e) => setDesignerCardsRailTitle(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-slate-900/50 border border-white/10 rounded-xl text-white focus:border-blue-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">أقصى عدد بطاقات معروضة</label>
              <input
                type="number"
                min={0}
                max={99}
                value={designerCardsRailMaxCards}
                onChange={(e) => setDesignerCardsRailMaxCards(Number(e.target.value))}
                className="w-full px-4 py-2.5 text-sm bg-slate-900/50 border border-white/10 rounded-xl text-white focus:border-blue-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">عرض البطاقة (px)</label>
              <input
                type="number"
                min={120}
                max={600}
                value={designerCardsRailCardWidthPx}
                onChange={(e) => setDesignerCardsRailCardWidthPx(Number(e.target.value))}
                className="w-full px-4 py-2.5 text-sm bg-slate-900/50 border border-white/10 rounded-xl text-white focus:border-blue-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">ارتفاع البطاقة (px)</label>
              <input
                type="number"
                min={80}
                max={500}
                value={designerCardsRailCardHeightPx}
                onChange={(e) => setDesignerCardsRailCardHeightPx(Number(e.target.value))}
                className="w-full px-4 py-2.5 text-sm bg-slate-900/50 border border-white/10 rounded-xl text-white focus:border-blue-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">الاستدارة (px)</label>
              <input
                type="number"
                min={0}
                max={60}
                value={designerCardsRailCardRadiusPx}
                onChange={(e) => setDesignerCardsRailCardRadiusPx(Number(e.target.value))}
                className="w-full px-4 py-2.5 text-sm bg-slate-900/50 border border-white/10 rounded-xl text-white focus:border-blue-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">المسافة بين البطاقات (px)</label>
              <input
                type="number"
                min={0}
                max={60}
                value={designerCardsRailGapPx}
                onChange={(e) => setDesignerCardsRailGapPx(Number(e.target.value))}
                className="w-full px-4 py-2.5 text-sm bg-slate-900/50 border border-white/10 rounded-xl text-white focus:border-blue-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Padding جانبي (px)</label>
              <input
                type="number"
                min={0}
                max={60}
                value={designerCardsRailPaddingXPx}
                onChange={(e) => setDesignerCardsRailPaddingXPx(Number(e.target.value))}
                className="w-full px-4 py-2.5 text-sm bg-slate-900/50 border border-white/10 rounded-xl text-white focus:border-blue-500 outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="text-sm font-medium text-slate-400">عدد البطاقات: <span className="text-white">{designerCards.length}</span></div>
            <button
              type="button"
              onClick={addDesignerCard}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-bold transition-all duration-300 active:scale-95"
            >
              <Plus size={16} />
              إضافة بطاقة
            </button>
          </div>

          <div className="space-y-6">
            {designerCards.map((card) => (
              <div key={card.id} className="rounded-2xl border border-white/10 bg-white/5 p-5 group transition-all duration-300 hover:border-white/20">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="text-base font-bold text-white truncate">
                    {card.title || 'بطاقة بدون عنوان'}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => updateDesignerCard(card.id, { enabled: card.enabled === false ? true : false })}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all duration-300 ${
                        card.enabled === false
                          ? 'border-white/5 text-slate-500 bg-slate-800'
                          : 'border-green-500/20 text-green-400 bg-green-500/10'
                      }`}
                      title={card.enabled === false ? 'معطّلة' : 'مفعّلة'}
                    >
                      {card.enabled === false ? 'OFF' : 'ON'}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeDesignerCard(card.id)}
                      className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                      title="حذف"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">النوع</label>
                      <select
                        value={card.type || 'image'}
                        onChange={(e) => updateDesignerCard(card.id, { type: e.target.value as any })}
                        className="w-full px-4 py-2.5 text-sm bg-slate-900/50 border border-white/10 rounded-xl text-white focus:border-blue-500 outline-none transition-colors"
                      >
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">العنوان</label>
                    <input
                      value={card.title}
                      onChange={(e) => updateDesignerCard(card.id, { title: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm bg-slate-900/50 border border-white/10 rounded-xl text-white focus:border-blue-500 outline-none transition-colors"
                    />
                  </div>

                  <div>
                    {card.type === 'video' ? (
                      <>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">رابط الفيديو</label>
                        <input
                          value={card.mediaUrl}
                          onChange={(e) => updateDesignerCard(card.id, { mediaUrl: e.target.value })}
                          placeholder="https://.../video.mp4"
                          className="w-full px-4 py-2.5 text-sm bg-slate-900/50 border border-white/10 rounded-xl text-white focus:border-blue-500 outline-none transition-colors"
                        />
                        <div className="text-[11px] text-slate-500 mt-2">
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
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">الرابط (اختياري)</label>
                    <input
                      value={card.href || ''}
                      onChange={(e) => updateDesignerCard(card.id, { href: e.target.value })}
                      placeholder="/designer-v2-1 أو https://..."
                      className="w-full px-4 py-2.5 text-sm bg-slate-900/50 border border-white/10 rounded-xl text-white focus:border-blue-500 outline-none transition-colors"
                    />
                    <div className="text-[11px] text-slate-500 mt-2">إذا كان يبدأ بـ http سيتم فتحه في تبويب جديد.</div>
                  </div>
                </div>
              </div>
            ))}

            {designerCards.length === 0 && (
              <div className="text-sm text-slate-500 text-center py-8 bg-white/5 rounded-2xl border border-dashed border-white/10">لا توجد بطاقات حالياً. اضغط "إضافة بطاقة".</div>
            )}
          </div>
        </div>

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
