import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  popularRegions: boolean;
  filteredTailors: boolean;
  fabricStores: boolean;
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
  popularRegions: 'المناطق الشائعة',
  filteredTailors: 'الخياطون حسب المنطقة',
  fabricStores: 'محلات الأقمشة المميزة',
  browseShopsButton: 'زر تصفح المحلات',
  featuredTailors: 'الخياطون المميزون',
  categoriesFilter: 'فلتر الفئات',
  productsGrid: 'شبكة المنتجات',
  contactFooter: 'قسم التواصل',
};

export const HomePageSettings: React.FC = () => {
  const { appSettings, saveAppSettings } = useApp();
  const navigate = useNavigate();
  const [showHeader, setShowHeader] = useState(true);
  const [showFooter, setShowFooter] = useState(true);
  const [sections, setSections] = useState<HomeSectionSettings>({
    installButton: true,
    notificationButton: true,
    stories: true,
    searchBar: true,
    heroBanner: true,
    designSection: true,
    adsSection: true,
    popularRegions: true,
    filteredTailors: true,
    fabricStores: true,
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

  // Designer V2.1 Mobile Settings
  const [designerCardsRailEnabled, setDesignerCardsRailEnabled] = useState(true);
  const [designerCardsRailTitle, setDesignerCardsRailTitle] = useState('Explore');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    loadSettings();
  }, [appSettings]);

  const loadSettings = async () => {
    try {
      // Load header/footer visibility
      setShowHeader(appSettings.showHeader !== false);
      setShowFooter(appSettings.showFooter !== false);
      
      // Load Designer V2.1 Mobile Settings
      setDesignerCardsRailEnabled(appSettings.designerCardsRail?.enabled !== false);
      setDesignerCardsRailTitle(appSettings.designerCardsRail?.title || 'Explore');

      // Load from context instead of direct Firestore call
      // Always merge with defaults to ensure new sections appear
      const saved = appSettings.homeSections || {};
      setSections({
        installButton: saved.installButton !== false,
        notificationButton: saved.notificationButton !== false,
        stories: saved.stories !== false,
        searchBar: saved.searchBar !== false,
        heroBanner: saved.heroBanner !== false,
        designSection: saved.designSection !== false,
        adsSection: saved.adsSection !== false,
        popularRegions: saved.popularRegions !== false,
        filteredTailors: saved.filteredTailors !== false,
        fabricStores: saved.fabricStores !== false,
        browseShopsButton: saved.browseShopsButton !== false,
        featuredTailors: saved.featuredTailors !== false,
        categoriesFilter: saved.categoriesFilter !== false,
        productsGrid: saved.productsGrid !== false,
        contactFooter: saved.contactFooter !== false,
      });

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
    setSaveStatus('saving');
    
    try {
      // Use context saveAppSettings to update both Firestore and local state
      await saveAppSettings({
        ...appSettings,
        showHeader,
        showFooter,
        homeSections: sections,
        sectionVisibility,
        homePageSettings: {
          featuredTailorsCount,
          filteredTailorsByRegionCount,
          bannerImages,
        },
        designerCardsRail: {
          ...appSettings.designerCardsRail,
          enabled: designerCardsRailEnabled,
          title: designerCardsRailTitle,
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
      }, { silent: true, optimistic: true });
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('error');
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
    <div className="w-full max-w-none min-w-0 px-4 py-6">
      {/* Compact Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          إعدادات الصفحة الرئيسية
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          تحكم في عناصر الصفحة الرئيسية وإعداداتها
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Sections Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Global Layout Toggles */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-5">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">عناصر التخطيط الرئيسية</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-md">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⌃</span>
                  <div>
                    <div className="text-sm text-slate-900 dark:text-white">الهيدر (الرأس)</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">شريط التنقل والقائمة الرئيسية</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowHeader(!showHeader)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    showHeader ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    showHeader ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-md">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⌄</span>
                  <div>
                    <div className="text-sm text-slate-900 dark:text-white">الفوتر (التذييل)</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">شريط التنقل السفلي ومعلومات التواصل</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowFooter(!showFooter)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    showFooter ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    showFooter ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Sections List */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-5">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">أقسام الصفحة</h3>
            <div className="space-y-2">
              {(Object.keys(sections) as Array<keyof HomeSectionSettings>).map((key) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-md hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {sections[key] ? (
                      <Eye className="text-green-500 dark:text-green-400 flex-shrink-0" size={16} />
                    ) : (
                      <EyeOff className="text-slate-400 flex-shrink-0" size={16} />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-slate-900 dark:text-white truncate">
                        {SECTION_LABELS[key]}
                      </div>
                      {sections[key] && sectionVisibility[key]?.adminOnly && (
                        <div className="text-xs text-amber-600 dark:text-amber-400">
                          للآدمن فقط
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Admin Only Toggle */}
                    {sections[key] && (
                      <button
                        onClick={() => handleAdminOnlyToggle(key)}
                        className={`p-1.5 rounded transition-colors ${
                          sectionVisibility[key]?.adminOnly
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                            : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                        title={sectionVisibility[key]?.adminOnly ? 'للآدمن فقط' : 'للجميع'}
                      >
                        🔒
                      </button>
                    )}

                    {/* Enable/Disable Toggle */}
                    <button
                      onClick={() => handleToggle(key)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        sections[key]
                          ? 'bg-green-500'
                          : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          sections[key] ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Product Categories */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-5">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">تصنيفات المنتجات</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              صيغة: id:name مفصولة بفواصل (مثال: dishdasha:الدشاديش, jacket:الجاكيت)
            </p>
            <textarea
              className="w-full min-h-[80px] px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={categoriesText}
              onChange={(e) => setCategoriesText(e.target.value)}
            />
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          {/* Numbers Settings */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-5">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">إعدادات العرض</h3>
            
            <div className="space-y-4">
              {/* Featured Tailors Count */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  عدد الخياطين المميزين
                </label>
                <input
                  type="number"
                  value={featuredTailorsCount}
                  onChange={(e) => setFeaturedTailorsCount(Number(e.target.value))}
                  min="3"
                  max="20"
                  className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filtered Tailors by Region Count */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  عدد الخياطين حسب المناطق
                </label>
                <input
                  type="number"
                  value={filteredTailorsByRegionCount}
                  onChange={(e) => setFilteredTailorsByRegionCount(Number(e.target.value))}
                  min="1"
                  max="20"
                  className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Banner Images */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-5">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">صور البنرات</h3>
            <div className="space-y-4">
              <SettingsImageUpload
                value={bannerImages.hero}
                onChange={(url) => setBannerImages(prev => ({ ...prev, hero: url }))}
                label="البانر الرئيسي"
                placeholder="https://example.com/hero-banner.jpg"
                helpText="1920x600"
                storagePath="banners/hero"
              />

              <SettingsImageUpload
                value={bannerImages.design}
                onChange={(url) => setBannerImages(prev => ({ ...prev, design: url }))}
                label="قسم المصمم"
                placeholder="https://example.com/design-banner.jpg"
                helpText="800x400"
                storagePath="banners/design"
              />

              <SettingsImageUpload
                value={bannerImages.ads}
                onChange={(url) => setBannerImages(prev => ({ ...prev, ads: url }))}
                label="قسم الإعلانات"
                placeholder="https://example.com/ads-banner.jpg"
                helpText="800x400"
                storagePath="banners/ads"
              />
            </div>
          </div>

          {/* Designer V2.1 Mobile Settings */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">إعدادات المصمم (الموبايل)</h3>
              <button 
                onClick={() => navigate('/admin/config/designer')}
                className="text-xs text-blue-600 hover:underline"
              >
                الإعدادات المتقدمة
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-800 dark:text-white">شريط البطاقات (Cards Rail)</span>
                  <span className="text-[10px] text-slate-500">يظهر أسفل شريط التاريخ في المصمم</span>
                </div>
                <button
                  onClick={() => setDesignerCardsRailEnabled(!designerCardsRailEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    designerCardsRailEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      designerCardsRailEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                  عنوان الشريط
                </label>
                <input
                  type="text"
                  value={designerCardsRailTitle}
                  onChange={(e) => setDesignerCardsRailTitle(e.target.value)}
                  placeholder="Explore"
                  className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Footer with Save Button */}
      <div className="sticky bottom-0 mt-6 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-5 py-4 rounded-lg shadow-lg">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 min-h-[24px]">
            {saveStatus === 'saving' && (
              <>
                <Loader2 className="animate-spin" size={16} />
                <span>جارٍ الحفظ بهدوء...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <CheckCircle2 className="text-green-500" size={16} />
                <span className="text-green-600 dark:text-green-400">تم الحفظ بنجاح</span>
              </>
            )}
            {saveStatus === 'error' && (
              <>
                <AlertCircle className="text-red-500" size={16} />
                <span className="text-red-600 dark:text-red-400">تعذر الحفظ، حاول مجدداً</span>
              </>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <Save size={16} />
            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </div>
      </div>
    </div>
  );
};
