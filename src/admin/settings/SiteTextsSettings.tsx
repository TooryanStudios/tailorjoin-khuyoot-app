import React, { useState, useEffect } from 'react';
import { Save, Type } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

export const SiteTextsSettings: React.FC = () => {
  const { appSettings, saveAppSettings } = useApp();
  const [texts, setTexts] = useState({
    // Featured Tailors Section
    featuredTailorsTitle: 'خياطون متميزون',
    featuredTailorsSubtitle: 'تعرف على أفضل الخياطين المعتمدين',
    
    // Contact Footer
    contactTitle: 'تواصل معنا',
    contactSubtitle: 'نحن هنا لمساعدتك في أي وقت',
    contactEmail: 'info@khuyoot.com',
    contactPhone: '+965 1234 5678',
    contactAddress: 'الكويت',
    footerCopyright: '© 2024 خيوط. جميع الحقوق محفوظة.',
    
    // Browse Shops Button
    browseShopsText: 'تصفح المحلات',
    
    // Search Bar
    searchPlaceholder: 'ابحث عن منتجات، خياطين، أو محلات...',
    
    // Categories
    categoriesTitle: 'التصنيفات',
    
    // Products Grid
    productsTitle: 'منتجاتنا',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (appSettings.siteTexts) {
      setTexts({
        featuredTailorsTitle: appSettings.siteTexts.featuredTailorsTitle || 'خياطون متميزون',
        featuredTailorsSubtitle: appSettings.siteTexts.featuredTailorsSubtitle || 'تعرف على أفضل الخياطين المعتمدين',
        contactTitle: appSettings.siteTexts.contactTitle || 'تواصل معنا',
        contactSubtitle: appSettings.siteTexts.contactSubtitle || 'نحن هنا لمساعدتك في أي وقت',
        contactEmail: appSettings.siteTexts.contactEmail || 'info@khuyoot.com',
        contactPhone: appSettings.siteTexts.contactPhone || '+965 1234 5678',
        contactAddress: appSettings.siteTexts.contactAddress || 'الكويت',
        footerCopyright: appSettings.siteTexts.footerCopyright || '© 2024 خيوط. جميع الحقوق محفوظة.',
        browseShopsText: appSettings.siteTexts.browseShopsText || 'تصفح المحلات',
        searchPlaceholder: appSettings.siteTexts.searchPlaceholder || 'ابحث عن منتجات، خياطين، أو محلات...',
        categoriesTitle: appSettings.siteTexts.categoriesTitle || 'التصنيفات',
        productsTitle: appSettings.siteTexts.productsTitle || 'منتجاتنا',
      });
    }
  }, [appSettings]);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      await saveAppSettings({
        ...appSettings,
        siteTexts: texts
      }, { silent: true, optimistic: true });
      
      setMessage('✅ تم حفظ النصوص بنجاح');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving site texts:', error);
      setMessage('❌ حدث خطأ أثناء الحفظ');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setTexts(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -ml-32 -mb-32" />

      <div className="relative flex items-center gap-4 mb-10">
        <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/20 shadow-inner">
          <Type className="text-indigo-400" size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">نصوص الموقع</h2>
          <p className="text-slate-400 mt-1">تخصيص العناوين والنصوص الظاهرة في الموقع</p>
        </div>
      </div>

      <div className="relative space-y-10">
        {/* Featured Tailors Section */}
        <div className="bg-white/5 rounded-2xl border border-white/5 p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
            قسم الخياطين المتميزين
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2 mr-1">
                العنوان الرئيسي
              </label>
              <input
                type="text"
                value={texts.featuredTailorsTitle}
                onChange={(e) => handleChange('featuredTailorsTitle', e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all outline-none"
                placeholder="خياطون متميزون"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2 mr-1">
                العنوان الفرعي
              </label>
              <input
                type="text"
                value={texts.featuredTailorsSubtitle}
                onChange={(e) => handleChange('featuredTailorsSubtitle', e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all outline-none"
                placeholder="تعرف على أفضل الخياطين المعتمدين"
              />
            </div>
          </div>
        </div>

        {/* Contact Footer */}
        <div className="bg-white/5 rounded-2xl border border-white/5 p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
            قسم التواصل (Footer)
          </h3>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2 mr-1">
                  عنوان القسم
                </label>
                <input
                  type="text"
                  value={texts.contactTitle}
                  onChange={(e) => handleChange('contactTitle', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all outline-none"
                  placeholder="تواصل معنا"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2 mr-1">
                  النص الفرعي
                </label>
                <input
                  type="text"
                  value={texts.contactSubtitle}
                  onChange={(e) => handleChange('contactSubtitle', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all outline-none"
                  placeholder="نحن هنا لمساعدتك في أي وقت"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2 mr-1">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={texts.contactEmail}
                  onChange={(e) => handleChange('contactEmail', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all outline-none"
                  placeholder="info@khuyoot.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2 mr-1">
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  value={texts.contactPhone}
                  onChange={(e) => handleChange('contactPhone', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all outline-none"
                  placeholder="+965 1234 5678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2 mr-1">
                  العنوان/الموقع
                </label>
                <input
                  type="text"
                  value={texts.contactAddress}
                  onChange={(e) => handleChange('contactAddress', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all outline-none"
                  placeholder="الكويت"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2 mr-1">
                نص الحقوق المحفوظة
              </label>
              <input
                type="text"
                value={texts.footerCopyright}
                onChange={(e) => handleChange('footerCopyright', e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all outline-none"
                placeholder="© 2024 خيوط. جميع الحقوق محفوظة."
              />
            </div>
          </div>
        </div>

        {/* Other Sections */}
        <div className="bg-white/5 rounded-2xl border border-white/5 p-6">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <div className="w-1.5 h-6 bg-purple-500 rounded-full" />
            نصوص أخرى
          </h3>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2 mr-1">
                  نص زر تصفح المحلات
                </label>
                <input
                  type="text"
                  value={texts.browseShopsText}
                  onChange={(e) => handleChange('browseShopsText', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all outline-none"
                  placeholder="تصفح المحلات"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2 mr-1">
                  نص البحث (Placeholder)
                </label>
                <input
                  type="text"
                  value={texts.searchPlaceholder}
                  onChange={(e) => handleChange('searchPlaceholder', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all outline-none"
                  placeholder="ابحث عن منتجات، خياطين، أو محلات..."
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2 mr-1">
                  عنوان قسم التصنيفات
                </label>
                <input
                  type="text"
                  value={texts.categoriesTitle}
                  onChange={(e) => handleChange('categoriesTitle', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all outline-none"
                  placeholder="التصنيفات"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2 mr-1">
                  عنوان قسم المنتجات
                </label>
                <input
                  type="text"
                  value={texts.productsTitle}
                  onChange={(e) => handleChange('productsTitle', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all outline-none"
                  placeholder="منتجاتنا"
                />
              </div>
            </div>
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
          className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-900/20 hover:shadow-indigo-500/40 disabled:cursor-not-allowed group"
        >
          <Save size={20} className={saving ? 'animate-spin' : 'group-hover:scale-110 transition-transform'} />
          {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </button>
      </div>
    </div>
  );
};
