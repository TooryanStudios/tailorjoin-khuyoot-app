import React, { useState, useEffect } from 'react';
import { Save, Search } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { SettingsImageUpload } from '../components/SettingsImageUpload';

export const SEOSettings: React.FC = () => {
  const { appSettings, saveAppSettings } = useApp();
  const [seo, setSeo] = useState({
    siteTitle: 'خيوط - Khuyoot | منصة تفصيل الملابس',
    metaDescription: 'منصة خيوط توفر أفضل الخياطين والمصممين في الكويت. اطلب تفصيل ملابسك الآن!',
    keywords: 'خياطة، تفصيل، الكويت، خياطين، دشداشة، عباية',
    ogImage: '',
    favicon: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (appSettings.seo) {
      setSeo({
        siteTitle: appSettings.seo.siteTitle || 'خيوط - Khuyoot | منصة تفصيل الملابس',
        metaDescription: appSettings.seo.metaDescription || 'منصة خيوط توفر أفضل الخياطين والمصممين في الكويت. اطلب تفصيل ملابسك الآن!',
        keywords: appSettings.seo.keywords || 'خياطة، تفصيل، الكويت، خياطين، دشداشة، عباية',
        ogImage: appSettings.seo.ogImage || '',
        favicon: appSettings.seo.favicon || '',
      });
    }
  }, [appSettings]);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      await saveAppSettings({
        ...appSettings,
        seo
      }, { silent: true, optimistic: true });
      
      setMessage('✅ تم حفظ إعدادات SEO بنجاح');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving SEO settings:', error);
      setMessage('❌ حدث خطأ أثناء الحفظ');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -ml-32 -mb-32" />

      <div className="relative flex items-center gap-4 mb-10">
        <div className="p-3 bg-green-500/20 rounded-2xl border border-green-500/20 shadow-inner">
          <Search className="text-green-400" size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">إعدادات SEO</h2>
          <p className="text-slate-400 mt-1">تحسين ظهور موقعك في محركات البحث</p>
        </div>
      </div>

      <div className="relative space-y-8">
        <div className="bg-white/5 rounded-2xl border border-white/5 p-6">
          <label className="block text-sm font-medium text-slate-400 mb-3 mr-1">
            عنوان الموقع (Site Title)
          </label>
          <input
            type="text"
            value={seo.siteTitle}
            onChange={(e) => setSeo(prev => ({ ...prev, siteTitle: e.target.value }))}
            className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all outline-none"
            placeholder="خيوط - منصة الخياطة الكويتية"
          />
          <p className="text-xs text-slate-500 mt-2 mr-1">يظهر في عنوان المتصفح ونتائج البحث</p>
        </div>

        <div className="bg-white/5 rounded-2xl border border-white/5 p-6">
          <label className="block text-sm font-medium text-slate-400 mb-3 mr-1">
            الوصف (Meta Description)
          </label>
          <textarea
            value={seo.metaDescription}
            onChange={(e) => setSeo(prev => ({ ...prev, metaDescription: e.target.value }))}
            rows={3}
            className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all outline-none resize-none"
            placeholder="وصف مختصر عن الموقع يظهر في نتائج البحث"
          />
          <p className="text-xs text-slate-500 mt-2 mr-1">مثالي: 150-160 حرف</p>
        </div>

        <div className="bg-white/5 rounded-2xl border border-white/5 p-6">
          <label className="block text-sm font-medium text-slate-400 mb-3 mr-1">
            الكلمات المفتاحية (Keywords)
          </label>
          <input
            type="text"
            value={seo.keywords}
            onChange={(e) => setSeo(prev => ({ ...prev, keywords: e.target.value }))}
            className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all outline-none"
            placeholder="خياطة، تفصيل، الكويت، خياطين"
          />
          <p className="text-xs text-slate-500 mt-2 mr-1">افصل بين الكلمات بفاصلة</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white/5 rounded-2xl border border-white/5 p-6">
            <SettingsImageUpload
              value={seo.ogImage}
              onChange={(url) => setSeo(prev => ({ ...prev, ogImage: url }))}
              label="صورة المشاركة (OG Image)"
              placeholder="https://example.com/og-image.jpg"
              helpText="تظهر عند مشاركة الموقع على السوشيال ميديا (مقاس مثالي: 1200x630)"
              storagePath="seo/og-image"
            />
          </div>

          <div className="bg-white/5 rounded-2xl border border-white/5 p-6">
            <SettingsImageUpload
              value={seo.favicon}
              onChange={(url) => setSeo(prev => ({ ...prev, favicon: url }))}
              label="أيقونة الموقع (Favicon)"
              placeholder="https://example.com/favicon.ico"
              helpText="تظهر في تبويب المتصفح (مقاس: 32x32 أو 64x64)"
              storagePath="seo/favicon"
            />
          </div>
        </div>
      </div>

      {/* Sticky Save Bar */}
      <div className="sticky bottom-0 left-0 right-0 mt-10 -mx-8 -mb-8 p-6 bg-slate-900/80 backdrop-blur-md border-t border-white/10 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          {message && (
            <div className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 ${
              message.includes('✅') 
                ? 'bg-green-500/20 text-green-400 border border-green-500/20' 
                : 'bg-red-500/20 text-red-400 border border-red-500/20'
            }`}>
              {message}
            </div>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-900/20 hover:shadow-green-500/40 disabled:cursor-not-allowed group"
        >
          <Save size={20} className={saving ? 'animate-spin' : 'group-hover:scale-110 transition-transform'} />
          {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </button>
      </div>
    </div>
  );
};
