import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Save } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { SettingsImageUpload } from '../components/SettingsImageUpload';

interface HomeSectionSettings {
  installButton: boolean;
  notificationButton: boolean;
  stories: boolean;
  searchBar: boolean;
  heroBanner: boolean;
  designSection: boolean;
  adsSection: boolean;
  browseShopsButton: boolean;
  featuredTailors: boolean;
  categoriesFilter: boolean;
  productsGrid: boolean;
  contactFooter: boolean;
}

interface SectionVisibility {
  [key: string]: {
    enabled: boolean;
    adminOnly: boolean;
  };
}

const SECTION_LABELS: Record<keyof HomeSectionSettings, string> = {
  installButton: 'زر تثبيت التطبيق (PWA)',
  notificationButton: 'زر اختبار التنبيهات',
  stories: 'قسم القصص (Stories)',
  searchBar: 'شريط البحث',
  heroBanner: 'البانر الرئيسي (Hero)',
  designSection: 'قسم المصمم (صمّم تشكيلة خاصة)',
  adsSection: 'قسم الإعلانات',
  browseShopsButton: 'زر تصفح المحلات',
  featuredTailors: 'الخياطون المميزون',
  categoriesFilter: 'فلتر الفئات',
  productsGrid: 'شبكة المنتجات',
  contactFooter: 'قسم التواصل',
};

export const HomePageSettings: React.FC = () => {
  const { appSettings, saveAppSettings } = useApp();
  const [sections, setSections] = useState<HomeSectionSettings>({
    installButton: true,
    notificationButton: true,
    stories: true,
    searchBar: true,
    heroBanner: true,
    designSection: true,
    adsSection: true,
    browseShopsButton: true,
    featuredTailors: true,
    categoriesFilter: true,
    productsGrid: true,
    contactFooter: true,
  });

  const [sectionVisibility, setSectionVisibility] = useState<SectionVisibility>({});
  const [categoriesText, setCategoriesText] = useState<string>('');
  
  // Additional homepage settings
  const [featuredTailorsCount, setFeaturedTailorsCount] = useState(6);
  const [filteredTailorsByRegionCount, setFilteredTailorsByRegionCount] = useState(6);
  const [bannerImages, setBannerImages] = useState({
    hero: '',
    design: '',
    ads: '',
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, [appSettings]);

  const loadSettings = async () => {
    try {
      // Load from context instead of direct Firestore call
      if (appSettings.homeSections) {
        setSections({
          installButton: appSettings.homeSections.installButton !== false,
          notificationButton: appSettings.homeSections.notificationButton !== false,
          stories: appSettings.homeSections.stories !== false,
          searchBar: appSettings.homeSections.searchBar !== false,
          heroBanner: appSettings.homeSections.heroBanner !== false,
          designSection: appSettings.homeSections.designSection !== false,
          adsSection: appSettings.homeSections.adsSection !== false,
          browseShopsButton: appSettings.homeSections.browseShopsButton !== false,
          featuredTailors: appSettings.homeSections.featuredTailors !== false,
          categoriesFilter: appSettings.homeSections.categoriesFilter !== false,
          productsGrid: appSettings.homeSections.productsGrid !== false,
          contactFooter: appSettings.homeSections.contactFooter !== false,
        });
      }

      // Load section visibility settings (adminOnly)
      if (appSettings.sectionVisibility) {
        setSectionVisibility(appSettings.sectionVisibility);
      } else {
        // Initialize with default values
        const defaultVisibility: SectionVisibility = {};
        Object.keys(sections).forEach(key => {
          defaultVisibility[key] = { enabled: true, adminOnly: false };
        });
        setSectionVisibility(defaultVisibility);
      }
      
      // Load homepage settings
      if (appSettings.homePageSettings) {
        setFeaturedTailorsCount(appSettings.homePageSettings.featuredTailorsCount || 6);
        setFilteredTailorsByRegionCount(appSettings.homePageSettings.filteredTailorsByRegionCount || 6);
        setBannerImages({
          hero: appSettings.homePageSettings.bannerImages?.hero || '',
          design: appSettings.homePageSettings.bannerImages?.design || '',
          ads: appSettings.homePageSettings.bannerImages?.ads || '',
        });
      }

      // Load product categories into editable textarea as CSV id:name
      try {
        const cats = appSettings.productCategories || [] as any[];
        const csv = cats.map((c: any) => `${c.id}:${c.name}`).join(', ');
        setCategoriesText(csv);
      } catch {}
    } catch (error) {
      console.error('Error loading home page settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof HomeSectionSettings) => {
    setSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    
    // Update visibility state
    setSectionVisibility(prev => ({
      ...prev,
      [key]: {
        enabled: !prev[key]?.enabled,
        adminOnly: prev[key]?.adminOnly || false
      }
    }));
  };

  const handleAdminOnlyToggle = (key: string) => {
    setSectionVisibility(prev => ({
      ...prev,
      [key]: {
        enabled: prev[key]?.enabled !== false,
        adminOnly: !prev[key]?.adminOnly
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      // Use context saveAppSettings to update both Firestore and local state
      await saveAppSettings({
        ...appSettings,
        homeSections: sections,
        sectionVisibility,
        homePageSettings: {
          featuredTailorsCount,
          filteredTailorsByRegionCount,
          bannerImages,
        },
        // Parse categoriesText and save productCategories
        productCategories: categoriesText
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
          .map(pair => {
            const [id, name] = pair.split(':').map(x => (x || '').trim());
            return id && name ? { id, name } : null;
          })
          .filter(Boolean) as Array<{ id: string; name: string }>,
      });
      
      setMessage('✅ تم حفظ الإعدادات بنجاح');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('❌ حدث خطأ أثناء الحفظ');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-600 dark:text-slate-400">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 p-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            إعدادات الصفحة الرئيسية
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            تحكم في إظهار/إخفاء أقسام الصفحة الرئيسية
          </p>
        </div>

        {/* Sections List */}
        <div className="p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">إظهار/إخفاء الأقسام</h3>
          <div className="space-y-3">
            {(Object.keys(sections) as Array<keyof HomeSectionSettings>).map((key) => (
              <div
                key={key}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  {sections[key] ? (
                    <Eye className="text-green-600 dark:text-green-400" size={20} />
                  ) : (
                    <EyeOff className="text-slate-400" size={20} />
                  )}
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">
                      {SECTION_LABELS[key]}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {sections[key] ? (
                        sectionVisibility[key]?.adminOnly ? 
                        <span className="text-amber-600 dark:text-amber-400 font-medium">للآدمن فقط</span> : 
                        'ظاهر للمستخدمين'
                      ) : 'مخفي'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Admin Only Toggle */}
                  {sections[key] && (
                    <button
                      onClick={() => handleAdminOnlyToggle(key)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        sectionVisibility[key]?.adminOnly
                          ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {sectionVisibility[key]?.adminOnly ? '🔒 آدمن فقط' : '🌐 الكل'}
                    </button>
                  )}

                  {/* Enable/Disable Toggle */}
                  <button
                    onClick={() => handleToggle(key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      sections[key]
                        ? 'bg-blue-600'
                        : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        sections[key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Product Categories Management */}
          <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">تصنيفات المنتجات</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              حرّر قائمة التصنيفات بصيغة CSV: id:name مفصولة بفواصل.
              مثال: dishdasha:الدشاديش, jacket:الجاكيت
            </p>
            <textarea
              className="w-full min-h-[100px] px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
              value={categoriesText}
              onChange={(e) => setCategoriesText(e.target.value)}
            />
          </div>

          {/* Additional Settings */}
          <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">إعدادات إضافية</h3>
            
            <div className="space-y-6">
              {/* Featured Tailors Count */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  عدد الخياطين المميزين
                </label>
                <input
                  type="number"
                  value={featuredTailorsCount}
                  onChange={(e) => setFeaturedTailorsCount(Number(e.target.value))}
                  min="3"
                  max="20"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  عدد الخياطين الذين يظهرون في قسم "الخياطون المتميزون"
                </p>
              </div>

              {/* Filtered Tailors by Region Count */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  عدد الخياطين حسب المناطق
                </label>
                <input
                  type="number"
                  value={filteredTailorsByRegionCount}
                  onChange={(e) => setFilteredTailorsByRegionCount(Number(e.target.value))}
                  min="1"
                  max="20"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  عدد الخياطين الذين يظهرون في قسم "الخياطين الأعلى تقييما حسب المناطق"
                </p>
              </div>

              {/* Banner Images */}
              <div className="space-y-6">
                <h4 className="font-medium text-slate-700 dark:text-slate-300">صور البنرات</h4>
                
                <SettingsImageUpload
                  value={bannerImages.hero}
                  onChange={(url) => setBannerImages(prev => ({ ...prev, hero: url }))}
                  label="صورة البانر الرئيسي (Hero)"
                  placeholder="https://example.com/hero-banner.jpg"
                  helpText="الأبعاد المقترحة: 1920x600 بكسل"
                  storagePath="banners/hero"
                />

                <SettingsImageUpload
                  value={bannerImages.design}
                  onChange={(url) => setBannerImages(prev => ({ ...prev, design: url }))}
                  label="صورة قسم المصمم"
                  placeholder="https://example.com/design-banner.jpg"
                  helpText="الأبعاد المقترحة: 800x400 بكسل"
                  storagePath="banners/design"
                />

                <SettingsImageUpload
                  value={bannerImages.ads}
                  onChange={(url) => setBannerImages(prev => ({ ...prev, ads: url }))}
                  label="صورة قسم الإعلانات"
                  placeholder="https://example.com/ads-banner.jpg"
                  helpText="الأبعاد المقترحة: 800x400 بكسل"
                  storagePath="banners/ads"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Save Button */}
        <div className="border-t border-slate-200 dark:border-slate-700 p-6 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {message && (
                <span className={message.startsWith('✅') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                  {message}
                </span>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </button>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold mt-0.5">
            ℹ
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-1">ملاحظة</h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              التغييرات ستظهر فوراً للمستخدمين بعد الحفظ. يمكنك إخفاء الأقسام غير المرغوبة لتبسيط الواجهة.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
