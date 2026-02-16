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
    <div className="w-full bg-white dark:bg-zinc-900 rounded-3xl border-[1.5px] border-black/10 dark:border-white/10 shadow-sm p-6">
      {/* Compact Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-normal text-zinc-900 dark:text-white">
          إعدادات الصفحة الرئيسية
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2">
          تحكم في عناصر الصفحة الرئيسية وإعداداتها
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Sections Panel */}
        <div className="lg:col-span-2 space-y-8">
          {/* Global Layout Toggles */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-bold text-white mb-6">عناصر التخطيط الرئيسية</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-4">
                  <span className="text-2xl text-slate-500">⌃</span>
                  <div>
                    <div className="text-base font-medium text-white">الهيدر (الرأس)</div>
                    <div className="text-sm text-slate-400">شريط التنقل والقائمة الرئيسية</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowHeader(!showHeader)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
                    showHeader ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-slate-700'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                    showHeader ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-4">
                  <span className="text-2xl text-slate-500">⌄</span>
                  <div>
                    <div className="text-base font-medium text-white">الفوتر (التذييل)</div>
                    <div className="text-sm text-slate-400">شريط التنقل السفلي ومعلومات التواصل</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowFooter(!showFooter)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
                    showFooter ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-slate-700'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                    showFooter ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Sections List */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-bold text-white mb-6">أقسام الصفحة</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(Object.keys(sections) as Array<keyof HomeSectionSettings>).map((key) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {sections[key] ? (
                      <Eye className="text-green-400 flex-shrink-0" size={18} />
                    ) : (
                      <EyeOff className="text-slate-600 flex-shrink-0" size={18} />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-white truncate">
                        {SECTION_LABELS[key]}
                      </div>
                      {sections[key] && sectionVisibility[key]?.adminOnly && (
                        <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mt-0.5">
                          للآدمن فقط
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Admin Only Toggle */}
                    {sections[key] && (
                      <button
                        onClick={() => handleAdminOnlyToggle(key)}
                        className={`p-2 rounded-lg transition-all duration-300 ${
                          sectionVisibility[key]?.adminOnly
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'text-slate-500 hover:bg-white/5'
                        }`}
                        title={sectionVisibility[key]?.adminOnly ? 'للآدمن فقط' : 'للجميع'}
                      >
                        🔒
                      </button>
                    )}

                    {/* Enable/Disable Toggle */}
                    <button
                      onClick={() => handleToggle(key)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300 ${
                        sections[key]
                          ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]'
                          : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-300 ${
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
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-bold text-white mb-2">تصنيفات المنتجات</h3>
            <p className="text-sm text-slate-400 mb-4">
              صيغة: id:name مفصولة بفواصل (مثال: dishdasha:الدشاديش, jacket:الجاكيت)
            </p>
            <textarea
              className="w-full min-h-[120px] px-4 py-3 text-sm bg-slate-900/50 border border-white/10 rounded-xl text-white focus:border-blue-500 outline-none transition-colors resize-none"
              value={categoriesText}
              onChange={(e) => setCategoriesText(e.target.value)}
            />
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-8">
          {/* Numbers Settings */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-bold text-white mb-6">إعدادات العرض</h3>
            
            <div className="space-y-6">
              {/* Featured Tailors Count */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  عدد الخياطين المميزين
                </label>
                <input
                  type="number"
                  value={featuredTailorsCount}
                  onChange={(e) => setFeaturedTailorsCount(Number(e.target.value))}
                  min="3"
                  max="20"
                  className="w-full px-4 py-2.5 text-sm bg-slate-900/50 border border-white/10 rounded-xl text-white focus:border-blue-500 outline-none transition-colors"
                />
              </div>

              {/* Filtered Tailors by Region Count */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  عدد الخياطين حسب المناطق
                </label>
                <input
                  type="number"
                  value={filteredTailorsByRegionCount}
                  onChange={(e) => setFilteredTailorsByRegionCount(Number(e.target.value))}
                  min="1"
                  max="20"
                  className="w-full px-4 py-2.5 text-sm bg-slate-900/50 border border-white/10 rounded-xl text-white focus:border-blue-500 outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Banner Images */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-bold text-white mb-6">صور البنرات</h3>
            <div className="space-y-6">
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
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">إعدادات المصمم (الموبايل)</h3>
              <button 
                onClick={() => navigate('/admin/config/designer')}
                className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
              >
                الإعدادات المتقدمة
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="flex flex-col">
                  <span className="text-base font-medium text-white">شريط البطاقات (Cards Rail)</span>
                  <span className="text-xs text-slate-400">يظهر أسفل شريط التاريخ في المصمم</span>
                </div>
                <button
                  onClick={() => setDesignerCardsRailEnabled(!designerCardsRailEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none ${
                    designerCardsRailEnabled ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                      designerCardsRailEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  عنوان الشريط
                </label>
                <input
                  type="text"
                  value={designerCardsRailTitle}
                  onChange={(e) => setDesignerCardsRailTitle(e.target.value)}
                  placeholder="Explore"
                  className="w-full px-4 py-2.5 text-sm bg-slate-900/50 border border-white/10 rounded-xl text-white focus:border-blue-500 outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Save Bar */}
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
  );
};
