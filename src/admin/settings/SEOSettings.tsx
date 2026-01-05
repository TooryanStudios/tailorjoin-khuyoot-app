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
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
          <Search className="text-green-600 dark:text-green-400" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">إعدادات SEO</h2>
          <p className="text-sm text-slate-500">تحسين ظهور موقعك في محركات البحث</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            عنوان الموقع (Site Title)
          </label>
          <input
            type="text"
            value={seo.siteTitle}
            onChange={(e) => setSeo(prev => ({ ...prev, siteTitle: e.target.value }))}
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="خيوط - منصة الخياطة الكويتية"
          />
          <p className="text-xs text-slate-500 mt-1">يظهر في عنوان المتصفح ونتائج البحث</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            الوصف (Meta Description)
          </label>
          <textarea
            value={seo.metaDescription}
            onChange={(e) => setSeo(prev => ({ ...prev, metaDescription: e.target.value }))}
            rows={3}
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="وصف مختصر عن الموقع يظهر في نتائج البحث"
          />
          <p className="text-xs text-slate-500 mt-1">مثالي: 150-160 حرف</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            الكلمات المفتاحية (Keywords)
          </label>
          <input
            type="text"
            value={seo.keywords}
            onChange={(e) => setSeo(prev => ({ ...prev, keywords: e.target.value }))}
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="خياطة، تفصيل، الكويت، خياطين"
          />
          <p className="text-xs text-slate-500 mt-1">افصل بين الكلمات بفاصلة</p>
        </div>

        <SettingsImageUpload
          value={seo.ogImage}
          onChange={(url) => setSeo(prev => ({ ...prev, ogImage: url }))}
          label="صورة المشاركة (OG Image)"
          placeholder="https://example.com/og-image.jpg"
          helpText="تظهر عند مشاركة الموقع على السوشيال ميديا (مقاس مثالي: 1200x630)"
          storagePath="seo/og-image"
        />

        <SettingsImageUpload
          value={seo.favicon}
          onChange={(url) => setSeo(prev => ({ ...prev, favicon: url }))}
          label="أيقونة الموقع (Favicon)"
          placeholder="https://example.com/favicon.ico"
          helpText="تظهر في تبويب المتصفح (مقاس: 32x32 أو 64x64)"
          storagePath="seo/favicon"
        />
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
        >
          <Save size={20} />
          {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </button>
        {message && (
          <span className={`text-sm font-medium ${message.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </span>
        )}
      </div>
    </div>
  );
};
