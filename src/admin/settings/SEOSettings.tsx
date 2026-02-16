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
    <div className="bg-white dark:bg-zinc-900 rounded-3xl border-[1.5px] border-black/10 dark:border-white/10 p-6 shadow-sm">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-theme-primary/10 rounded-2xl border-[1.5px] border-theme-primary/20">
          <Search className="text-theme-primary" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-normal text-zinc-900 dark:text-white tracking-tight">إعدادات SEO</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">تحسين ظهور موقعك في محركات البحث</p>
        </div>
      </div>

      <div className="relative space-y-8">
        <div className="bg-white dark:bg-zinc-900/40 rounded-2xl border-[1.5px] border-zinc-200 dark:border-zinc-700 p-6">
          <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-3 mr-1">
            عنوان الموقع (Site Title)
          </label>
          <input
            type="text"
            value={seo.siteTitle}
            onChange={(e) => setSeo(prev => ({ ...prev, siteTitle: e.target.value }))}
            className="w-full px-4 py-3 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-green-500/40 focus:border-green-500/50 transition-all outline-none"
            placeholder="خيوط - منصة الخياطة الكويتية"
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 mr-1">يظهر في عنوان المتصفح ونتائج البحث</p>
        </div>

        <div className="bg-white dark:bg-zinc-900/40 rounded-2xl border-[1.5px] border-zinc-200 dark:border-zinc-700 p-6">
          <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-3 mr-1">
            الوصف (Meta Description)
          </label>
          <textarea
            value={seo.metaDescription}
            onChange={(e) => setSeo(prev => ({ ...prev, metaDescription: e.target.value }))}
            rows={3}
            className="w-full px-4 py-3 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-green-500/40 focus:border-green-500/50 transition-all outline-none resize-none"
            placeholder="وصف مختصر عن الموقع يظهر في نتائج البحث"
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 mr-1">مثالي: 150-160 حرف</p>
        </div>

        <div className="bg-white dark:bg-zinc-900/40 rounded-2xl border-[1.5px] border-zinc-200 dark:border-zinc-700 p-6">
          <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-3 mr-1">
            الكلمات المفتاحية (Keywords)
          </label>
          <input
            type="text"
            value={seo.keywords}
            onChange={(e) => setSeo(prev => ({ ...prev, keywords: e.target.value }))}
            className="w-full px-4 py-3 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-green-500/40 focus:border-green-500/50 transition-all outline-none"
            placeholder="خياطة، تفصيل، الكويت، خياطين"
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 mr-1">افصل بين الكلمات بفاصلة</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-zinc-900/40 rounded-2xl border-[1.5px] border-zinc-200 dark:border-zinc-700 p-6">
            <SettingsImageUpload
              value={seo.ogImage}
              onChange={(url) => setSeo(prev => ({ ...prev, ogImage: url }))}
              label="صورة المشاركة (OG Image)"
              placeholder="https://example.com/og-image.jpg"
              helpText="تظهر عند مشاركة الموقع على السوشيال ميديا (مقاس مثالي: 1200x630)"
              storagePath="seo/og-image"
            />
          </div>

          <div className="bg-white dark:bg-zinc-900/40 rounded-2xl border-[1.5px] border-zinc-200 dark:border-zinc-700 p-6">
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
      <div className="sticky bottom-0 left-0 right-0 mt-10 -mx-6 -mb-6 p-6 bg-white/90 dark:bg-zinc-900/80 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between z-10">
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
          className="flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-500 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white font-bold rounded-2xl transition-all shadow-sm hover:shadow-md disabled:cursor-not-allowed group"
        >
          <Save size={20} className={saving ? 'animate-spin' : 'group-hover:scale-110 transition-transform'} />
          {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </button>
      </div>
    </div>
  );
};
