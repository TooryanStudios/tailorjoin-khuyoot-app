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
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
          <Type className="text-indigo-600 dark:text-indigo-400" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">نصوص الموقع</h2>
          <p className="text-sm text-slate-500">تخصيص العناوين والنصوص الظاهرة في الموقع</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Featured Tailors Section */}
        <div className="border-b border-slate-200 dark:border-slate-700 pb-6">
          <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-4">قسم الخياطين المتميزين</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                العنوان الرئيسي
              </label>
              <input
                type="text"
                value={texts.featuredTailorsTitle}
                onChange={(e) => handleChange('featuredTailorsTitle', e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="خياطون متميزون"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                العنوان الفرعي
              </label>
              <input
                type="text"
                value={texts.featuredTailorsSubtitle}
                onChange={(e) => handleChange('featuredTailorsSubtitle', e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="تعرف على أفضل الخياطين المعتمدين"
              />
            </div>
          </div>
        </div>

        {/* Contact Footer */}
        <div className="border-b border-slate-200 dark:border-slate-700 pb-6">
          <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-4">قسم التواصل (Footer)</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  عنوان القسم
                </label>
                <input
                  type="text"
                  value={texts.contactTitle}
                  onChange={(e) => handleChange('contactTitle', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="تواصل معنا"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  النص الفرعي
                </label>
                <input
                  type="text"
                  value={texts.contactSubtitle}
                  onChange={(e) => handleChange('contactSubtitle', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="نحن هنا لمساعدتك في أي وقت"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={texts.contactEmail}
                  onChange={(e) => handleChange('contactEmail', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="info@khuyoot.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  value={texts.contactPhone}
                  onChange={(e) => handleChange('contactPhone', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="+965 1234 5678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  العنوان/الموقع
                </label>
                <input
                  type="text"
                  value={texts.contactAddress}
                  onChange={(e) => handleChange('contactAddress', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="الكويت"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                نص الحقوق المحفوظة
              </label>
              <input
                type="text"
                value={texts.footerCopyright}
                onChange={(e) => handleChange('footerCopyright', e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="© 2024 خيوط. جميع الحقوق محفوظة."
              />
            </div>
          </div>
        </div>

        {/* Other Sections */}
        <div>
          <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-4">نصوص أخرى</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  نص زر تصفح المحلات
                </label>
                <input
                  type="text"
                  value={texts.browseShopsText}
                  onChange={(e) => handleChange('browseShopsText', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="تصفح المحلات"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  نص البحث (Placeholder)
                </label>
                <input
                  type="text"
                  value={texts.searchPlaceholder}
                  onChange={(e) => handleChange('searchPlaceholder', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="ابحث عن منتجات، خياطين، أو محلات..."
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  عنوان قسم التصنيفات
                </label>
                <input
                  type="text"
                  value={texts.categoriesTitle}
                  onChange={(e) => handleChange('categoriesTitle', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="التصنيفات"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  عنوان قسم المنتجات
                </label>
                <input
                  type="text"
                  value={texts.productsTitle}
                  onChange={(e) => handleChange('productsTitle', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="منتجاتنا"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
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
