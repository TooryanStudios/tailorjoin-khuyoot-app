import React, { useState, useEffect } from 'react';
import { 
  Save, Loader2, Upload, X, Plus, Trash2, Image as ImageIcon, Check, 
  ArrowUp, ArrowDown, Layout, Users, Map, Flag, Sparkles, Monitor, 
  Smartphone, ChevronRight, Settings2, Eye, EyeOff
} from 'lucide-react';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../services/firebase';

interface GenderCard {
  label: string;
  imageUrl: string;
  gradientColor?: string;
  enabled?: boolean;
}

interface HeroSection {
  backgroundImage: string;
  title: string;
  description: string;
  maleCard: GenderCard;
  femaleCard: GenderCard;
}

interface TailorInfo {
  tailorId: string;
  name: string;
  location: string;
  imageUrl: string;
}

interface CategoryCard {
  label: string;
  imageUrl: string;
  path?: string;
}

interface PromotionSection {
  title: string;
  highlightedWords: string[];
  buttonText: string;
}

interface RegionItem {
  name: string;
  count: string | number;
  image: string;
}

interface AccessoriesBanner {
  enabled: boolean;
  title: string;
  buttonText: string;
  imageUrl: string;
}

interface GenderSpecificData {
  bestTailors: TailorInfo[];
  categories: {
    largeCat1: CategoryCard;
    largeCat2: CategoryCard;
    smallCats: CategoryCard[];
  };
  recentArrivals: {
    enabled: boolean;
    productIds: string[];
  };
  bestSelling: {
    enabled: boolean;
    productIds: string[];
  };
  productFilterCategories?: string[]; // IDs of categories from productCategories collection
}

interface LandingPageConfig {
  hero: HeroSection;
  promotion: PromotionSection;
  male: GenderSpecificData;
  female: GenderSpecificData;
  regions?: RegionItem[];
  accessoriesBanner?: AccessoriesBanner;
}

const DEFAULT_CONFIG: LandingPageConfig = {
  hero: {
    backgroundImage: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1000&auto=format&fit=crop',
    title: 'ننسج\\nتجربة\\nالخياطة',
    description: 'نحول أحلامك إلى واقع بخياطة فاخرة ومخصصة.',
    maleCard: {
      label: 'ملابس رجالية',
      imageUrl: '',
      gradientColor: '#000000',
      enabled: true
    },
    femaleCard: {
      label: 'ملابس نسائية',
      imageUrl: '',
      gradientColor: '#000000',
      enabled: true
    }
  },
  promotion: {
    title: 'جرب أقمشتك المفضلة في تصاميمك المحبوبة',
    highlightedWords: ['أقمشتك', 'تصاميمك'],
    buttonText: 'جرب الآن'
  },
  accessoriesBanner: {
    enabled: true,
    title: 'قريباً.. سنضيف قسم الإكسسوارات.',
    buttonText: 'اكتشف المزيد',
    imageUrl: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=1000&auto=format&fit=crop'
  },
  male: {
    bestTailors: [
      { tailorId: '', name: 'خياط رجالي 1', location: 'مسقط', imageUrl: '' },
      { tailorId: '', name: 'خياط رجالي 2', location: 'صلالة', imageUrl: '' }
    ],
    categories: {
      largeCat1: { label: 'ثياب', imageUrl: '', path: 'dishdasha' },
      largeCat2: { label: 'بدلات', imageUrl: '', path: 'suit' },
      smallCats: [
        { label: 'كمبيوترز', imageUrl: '', path: 'computer' },
        { label: 'عباءات رجالية', imageUrl: '', path: 'abaya' },
        { label: 'مخاور', imageUrl: '', path: 'makhwar' },
        { label: 'جلابيات', imageUrl: '', path: 'jalabiya' }
      ]
    },
    recentArrivals: { enabled: true, productIds: [] },
    bestSelling: { enabled: true, productIds: [] },
    productFilterCategories: []
  },
  female: {
    bestTailors: [
      { tailorId: '', name: 'خياطة نسائية 1', location: 'مسقط', imageUrl: '' },
      { tailorId: '', name: 'خياطة نسائية 2', location: 'صلالة', imageUrl: '' }
    ],
    categories: {
      largeCat1: { label: 'فساتين', imageUrl: '', path: 'dress' },
      largeCat2: { label: 'عبايات', imageUrl: '', path: 'abaya' },
      smallCats: [
        { label: 'جلابيات نسائية', imageUrl: '', path: 'jalabiya' },
        { label: 'كافتانات', imageUrl: '', path: 'kaftan' },
        { label: 'فساتين سهرة', imageUrl: '', path: 'evening-dress' },
        { label: 'ملابس تقليدية', imageUrl: '', path: 'traditional' }
      ]
    },
    recentArrivals: { enabled: true, productIds: [] },
    bestSelling: { enabled: true, productIds: [] },
    productFilterCategories: []
  },
  regions: [
    { name: 'مسقط', count: 45, image: 'https://images.unsplash.com/photo-1549413280-49658ec60424?w=600&auto=format&fit=crop' },
    { name: 'صلالة', count: 18, image: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=400&auto=format&fit=crop' },
    { name: 'صحار', count: 12, image: 'https://images.unsplash.com/photo-1518623489648-a173ef7824f3?w=400&auto=format&fit=crop' },
    { name: 'نزوى', count: 9, image: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=400&auto=format&fit=crop' },
    { name: 'صور', count: 7, image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&auto=format&fit=crop' }
  ]
};

export const LandingPageConfig: React.FC = () => {
  const [config, setConfig] = useState<LandingPageConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [activeGender, setActiveGender] = useState<'male' | 'female'>('male');
  const [activeTab, setActiveTab] = useState<'hero' | 'gender' | 'regions' | 'banner' | 'promotion'>('hero');
  
  // New state for tailors and products
  const [tailors, setTailors] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [tailorProducts, setTailorProducts] = useState<{ [tailorId: string]: any[] }>({});
  const [selectedTailorIndex, setSelectedTailorIndex] = useState<number | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState<{ type: 'recentArrivals' | 'bestSelling', gender: 'male' | 'female' } | null>(null);
  const [productCategories, setProductCategories] = useState<any[]>([]);

  useEffect(() => {
    loadConfig();
    loadTailors();
    loadAllProducts();
    loadProductCategories();
  }, []);
  
  const loadAllProducts = async () => {
    try {
      const allProds: any[] = [];
      const usersRef = collection(db, 'users');
      const vendorsSnapshot = await getDocs(query(usersRef, where('role', 'in', ['tailor', 'shop'])));
      
      for (const vendorDoc of vendorsSnapshot.docs) {
        const prodSnapshot = await getDocs(collection(db, `users/${vendorDoc.id}/products`));
        prodSnapshot.forEach(pDoc => {
          allProds.push({ 
            id: pDoc.id, 
            vendorId: vendorDoc.id,
            vendorName: vendorDoc.data().shopName || vendorDoc.data().name || 'Unknown',
            ...pDoc.data() 
          });
        });
      }
      setAllProducts(allProds);
    } catch (error) {
      console.error('Error loading all products:', error);
    }
  };

  const loadProductCategories = async () => {
    try {
      const categoriesRef = collection(db, 'productCategories');
      const snapshot = await getDocs(categoriesRef);
      const categories = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProductCategories(categories);
    } catch (error) {
      console.error('Error loading product categories:', error);
    }
  };

  // Filter categories by gender for current active gender
  const filteredCategoriesByGender = React.useMemo(() => {
    return productCategories.filter(cat => {
      // Show category if:
      // 1. No gender specified (null/undefined) - applies to both
      // 2. Gender matches current active gender (male/female)
      if (!cat.gender) return true;
      return cat.gender === activeGender;
    });
  }, [productCategories, activeGender]);

  const loadTailors = async () => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'tailor'));
      const snapshot = await getDocs(q);
      
      const tailorsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setTailors(tailorsList);
    } catch (error) {
      console.error('Error loading tailors:', error);
    }
  };
  
  const loadTailorProducts = async (tailorId: string) => {
    if (tailorProducts[tailorId]) return; // Already loaded
    
    try {
      const productsRef = collection(db, `users/${tailorId}/products`);
      const snapshot = await getDocs(productsRef);
      
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setTailorProducts(prev => ({ ...prev, [tailorId]: products }));
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };
  
  const handleTailorSelect = (index: number, tailorId: string) => {
    const tailor = tailors.find(t => t.id === tailorId);
    if (!tailor) return;
    
    const updatedTailors = [...config[activeGender].bestTailors];
    updatedTailors[index] = {
      tailorId: tailor.id,
      name: tailor.name || tailor.shopName || 'خياط',
      location: tailor.region || tailor.location || '',
      imageUrl: updatedTailors[index]?.imageUrl || ''
    };
    
    setConfig(prev => ({ 
      ...prev, 
      [activeGender]: { 
        ...prev[activeGender], 
        bestTailors: updatedTailors 
      }
    }));
    loadTailorProducts(tailorId);
  };
  
  const handleProductImageSelect = (index: number, imageUrl: string) => {
    const updatedTailors = [...config[activeGender].bestTailors];
    updatedTailors[index] = {
      ...updatedTailors[index],
      imageUrl
    };
    
    setConfig(prev => ({ 
      ...prev, 
      [activeGender]: { 
        ...prev[activeGender], 
        bestTailors: updatedTailors 
      }
    }));
    setShowImagePicker(false);
    setSelectedTailorIndex(null);
  };

  const loadConfig = async () => {
    try {
      const docRef = doc(db, 'site_config', 'landing_page');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setConfig({ ...DEFAULT_CONFIG, ...docSnap.data() as LandingPageConfig });
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, 'site_config', 'landing_page');
      await setDoc(docRef, config);
      alert('✅ تم حفظ الإعدادات بنجاح');
    } catch (error) {
      console.error('Error saving config:', error);
      alert('❌ حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const uploadImage = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, `landing_page/${path}_${Date.now()}.${file.name.split('.').pop()}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleImageUpload = async (file: File, field: string) => {
    setUploadingImage(field);
    try {
      const url = await uploadImage(file, field);
      
      // Update config based on field path
      const updateConfig = (prev: LandingPageConfig) => {
        const newConfig = JSON.parse(JSON.stringify(prev)); // Deep clone
        const parts = field.split('.');
        
        if (parts[0] === 'male' || parts[0] === 'female') {
          const gender = parts[0] as 'male' | 'female';
          if (parts[1] === 'categories') {
            if (parts[2] === 'largeCat1' || parts[2] === 'largeCat2') {
              newConfig[gender].categories[parts[2]].imageUrl = url;
            } else if (parts[2] === 'smallCats') {
              const index = parseInt(parts[3]);
              newConfig[gender].categories.smallCats[index].imageUrl = url;
            }
          } else if (parts[1] === 'bestTailors') {
            const index = parseInt(parts[2]);
            newConfig[gender].bestTailors[index].imageUrl = url;
          }
        } else if (parts[0] === 'hero') {
          if (parts[1] === 'backgroundImage') newConfig.hero.backgroundImage = url;
          else if (parts[1] === 'maleCard') newConfig.hero.maleCard.imageUrl = url;
          else if (parts[1] === 'femaleCard') newConfig.hero.femaleCard.imageUrl = url;
        } else if (parts[0] === 'accessoriesBanner') {
          if (!newConfig.accessoriesBanner) newConfig.accessoriesBanner = { ...DEFAULT_CONFIG.accessoriesBanner };
          newConfig.accessoriesBanner.imageUrl = url;
        } else if (parts[0] === 'regions') {
          const index = parseInt(parts[1]);
          if (!newConfig.regions) newConfig.regions = [];
          newConfig.regions[index].image = url;
        }
        
        return newConfig;
      };
      
      setConfig(updateConfig);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('❌ حدث خطأ أثناء رفع الصورة');
    } finally {
      setUploadingImage(null);
    }
  };

  const clearImage = (field: string) => {
    const updateConfig = (prev: LandingPageConfig) => {
      const newConfig = JSON.parse(JSON.stringify(prev));
      const parts = field.split('.');
      
      if (parts[0] === 'male' || parts[0] === 'female') {
        const gender = parts[0] as 'male' | 'female';
        if (parts[1] === 'categories') {
          if (parts[2] === 'largeCat1' || parts[2] === 'largeCat2') {
            newConfig[gender].categories[parts[2]].imageUrl = '';
          } else if (parts[2] === 'smallCats') {
            const index = parseInt(parts[3]);
            newConfig[gender].categories.smallCats[index].imageUrl = '';
          }
        }
      } else if (parts[0] === 'hero') {
        if (parts[1] === 'backgroundImage') newConfig.hero.backgroundImage = '';
        else if (parts[1] === 'maleCard') newConfig.hero.maleCard.imageUrl = '';
        else if (parts[1] === 'femaleCard') newConfig.hero.femaleCard.imageUrl = '';
      } else if (parts[0] === 'accessoriesBanner') {
        if (newConfig.accessoriesBanner) newConfig.accessoriesBanner.imageUrl = '';
      } else if (parts[0] === 'regions') {
        const index = parseInt(parts[1]);
        if (newConfig.regions) newConfig.regions[index].image = '';
      }
      
      return newConfig;
    };
    setConfig(updateConfig);
  };

  const moveRegion = (index: number, direction: 'up' | 'down') => {
    if (!config.regions) return;
    const newRegions = [...config.regions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newRegions.length) return;
    
    [newRegions[index], newRegions[targetIndex]] = [newRegions[targetIndex], newRegions[index]];
    
    setConfig(prev => ({ ...prev, regions: newRegions }));
  };

  const updateRegion = (index: number, field: keyof RegionItem, value: any) => {
    if (!config.regions) return;
    const newRegions = [...config.regions];
    newRegions[index] = { ...newRegions[index], [field]: value };
    setConfig(prev => ({ ...prev, regions: newRegions }));
  };

  const toggleProductSelection = (type: 'recentArrivals' | 'bestSelling', gender: 'male' | 'female', productId: string) => {
    setConfig(prev => {
      const newConfig = JSON.parse(JSON.stringify(prev));
      if (!newConfig[gender][type].productIds) {
        newConfig[gender][type].productIds = [];
      }
      
      const currentIds = newConfig[gender][type].productIds;
      const index = currentIds.indexOf(productId);
      
      if (index > -1) {
        currentIds.splice(index, 1);
      } else {
        currentIds.push(productId);
      }
      
      return newConfig;
    });
  };

  const toggleCategoryFilter = (gender: 'male' | 'female', categoryId: string) => {
    setConfig(prev => {
      const newConfig = JSON.parse(JSON.stringify(prev));
      if (!newConfig[gender].productFilterCategories) {
        newConfig[gender].productFilterCategories = [];
      }
      
      const currentIds = newConfig[gender].productFilterCategories;
      const index = currentIds.indexOf(categoryId);
      
      if (index > -1) {
        currentIds.splice(index, 1);
      } else {
        currentIds.push(categoryId);
      }
      
      return newConfig;
    });
  };

  const handleCategorySelect = (catKey: 'largeCat1' | 'largeCat2', categoryId: string) => {
    const category = productCategories.find(c => c.id === categoryId);
    if (!category) return;

    const newCat = {
      label: category.nameAr,
      imageUrl: config[activeGender].categories[catKey].imageUrl || '',
      path: category.slug || categoryId
    };

    setConfig(prev => ({
      ...prev,
      [activeGender]: {
        ...prev[activeGender],
        categories: { ...prev[activeGender].categories, [catKey]: newCat }
      }
    }));
  };

  const handleSmallCategorySelect = (index: number, categoryId: string) => {
    const category = productCategories.find(c => c.id === categoryId);
    if (!category) return;

    const newCats = [...config[activeGender].categories.smallCats];
    newCats[index] = {
      label: category.nameAr,
      imageUrl: newCats[index].imageUrl || '',
      path: category.slug || categoryId
    };

    setConfig(prev => ({
      ...prev,
      [activeGender]: {
        ...prev[activeGender],
        categories: { ...prev[activeGender].categories, smallCats: newCats }
      }
    }));
  };

  const TabButton = ({ id, label, icon: Icon }: { id: typeof activeTab, label: string, icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center justify-center md:justify-start gap-3 px-2 md:px-4 py-3 rounded-xl text-[10px] md:text-sm font-normal transition-all ${
        activeTab === id 
          ? 'bg-theme-primary text-white shadow-lg shadow-theme-primary/20 scale-[1.02]' 
          : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200'
      }`}
    >
      <Icon size={18} />
      <span className="hidden md:block">{label}</span>
      {activeTab === id && <ChevronRight size={14} className="mr-auto hidden md:block" />}
    </button>
  );

  const CompactImage = ({ url, onClear, onUpload, uploading, className = "" }: { url: string, onClear: () => void, onUpload: (file: File) => void, uploading?: boolean, className?: string }) => (
    <div className={`relative group w-12 h-12 bg-zinc-100 dark:bg-zinc-900 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 shrink-0 ${className}`}>
      {url ? (
        <>
          <img src={url} className="w-full h-full object-cover" alt="Thumbnail" />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
            <button 
              onClick={(e) => { e.preventDefault(); onClear(); }} 
              className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              title="حذف"
            >
              <Trash2 size={10} />
            </button>
            <label className="p-1 bg-white text-black rounded hover:bg-zinc-100 cursor-pointer transition-colors" title="تغيير">
              <Upload size={10} />
              <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
            </label>
          </div>
        </>
      ) : (
        <label className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors" title="رفع">
          <Upload size={14} className="text-zinc-400" />
          <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
        </label>
      )}
      {uploading && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <Loader2 size={14} className="text-white animate-spin" />
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-theme-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 max-w-[1600px] mx-auto p-4 md:p-6 min-h-[85vh] font-['Tajawal'] bg-[#ededed] dark:bg-zinc-950" dir="rtl">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 space-y-4 shrink-0">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 border-[1.5px] border-black/10 dark:border-white/10 shadow-sm space-y-2 sticky top-24">
          <div className="px-3 py-4 border-b border-zinc-50 dark:border-zinc-800 mb-2">
            <h2 className="text-lg font-normal uppercase text-zinc-900 dark:text-white flex items-center gap-2">
              <Settings2 size={20} className="text-theme-primary" />
              تكوين المتجر
            </h2>
            <p className="text-[9px] text-zinc-500 font-normal uppercase tracking-widest mt-1">تنسيق الواجهة الأمامية</p>
          </div>
          
          <div className="space-y-1">
            <TabButton id="hero" label="القسم البطولي" icon={Monitor} />
            <TabButton id="gender" label="محتوى الأقسام" icon={Users} />
            <TabButton id="regions" label="المناطق والخرائط" icon={Map} />
            <TabButton id="banner" label="Coming Soon Banner" icon={Flag} />
            <TabButton id="promotion" label="العروض والترويج" icon={Sparkles} />
          </div>

          <div className="mt-6 pt-6 border-t border-zinc-50 dark:border-zinc-800 space-y-4">
            {/* Gender Selection (accessible when on gender tab) */}
            {activeTab === 'gender' && (
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-normal text-zinc-400 tracking-widest block px-2">اختر القسم</label>
                <div className="flex gap-2 bg-zinc-100 dark:bg-zinc-800 p-2 rounded-xl border border-zinc-200 dark:border-zinc-700">
                  <button
                    onClick={() => setActiveGender('male')}
                    className={`flex-1 px-4 py-2 rounded-lg text-xs font-normal transition-all ${activeGender === 'male' ? 'bg-white dark:bg-zinc-700 shadow-sm text-theme-primary' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                  >
                    رجالي
                  </button>
                  <button
                    onClick={() => setActiveGender('female')}
                    className={`flex-1 px-4 py-2 rounded-lg text-xs font-normal transition-all ${activeGender === 'female' ? 'bg-white dark:bg-zinc-700 shadow-sm text-theme-primary' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                  >
                    نسائي
                  </button>
                </div>
              </div>
            )}
            
            <button
              onClick={saveConfig}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-theme-primary text-white rounded-2xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all font-normal uppercase text-xs shadow-lg shadow-theme-primary/20"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              حفظ جميع التغييرات
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 space-y-3">
        {/* Dynamic Section Content */}
        <div className="space-y-3 pb-20">
          
          {/* HERO SECTION */}
          {activeTab === 'hero' && (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border-[1.5px] border-black/10 dark:border-white/10 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-normal text-zinc-400 tracking-widest">العنوان الرئيسي</label>
                    <textarea
                      value={config.hero.title}
                      onChange={(e) => setConfig(prev => ({ ...prev, hero: { ...prev.hero, title: e.target.value }}))}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl px-5 py-4 text-sm font-normal focus:ring-2 focus:ring-theme-primary/20 transition-all outline-none min-h-[120px]"
                      placeholder="استخدم \\n للسطر الجديد"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-normal text-zinc-400 tracking-widest">الوصف الفرعي</label>
                    <textarea
                      value={config.hero.description}
                      onChange={(e) => setConfig(prev => ({ ...prev, hero: { ...prev.hero, description: e.target.value }}))}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl px-5 py-4 text-xs font-normal text-zinc-500 focus:ring-2 focus:ring-theme-primary/20 transition-all outline-none min-h-[80px]"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                   <div className="space-y-2">
                    <label className="text-[10px] uppercase font-normal text-zinc-400 tracking-widest">صورة الخلفية الكبيرة</label>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={config.hero.backgroundImage}
                          onChange={(e) => setConfig(prev => ({ ...prev, hero: { ...prev.hero, backgroundImage: e.target.value }}))}
                          className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl px-4 py-2 text-[10px] focus:ring-2 focus:ring-theme-primary/20 transition-all outline-none text-zinc-400"
                          placeholder="Image URL"
                        />
                      </div>
                      <CompactImage 
                        url={config.hero.backgroundImage} 
                        onClear={() => clearImage('hero.backgroundImage')}
                        onUpload={(file) => handleImageUpload(file, 'hero.backgroundImage')}
                        uploading={uploadingImage === 'hero.backgroundImage'}
                        className="w-16 h-16"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-3xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-normal uppercase text-zinc-400">بطاقة الرجال</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setConfig(prev => ({ ...prev, hero: { ...prev.hero, maleCard: { ...prev.hero.maleCard, enabled: !(prev.hero.maleCard.enabled ?? true) }}}))}
                            className={`p-1 rounded-lg transition-colors ${
                              config.hero.maleCard.enabled ?? true
                                ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                                : 'bg-red-500/20 text-red-600 dark:text-red-400'
                            }`}
                            title={config.hero.maleCard.enabled ?? true ? 'مفعّل' : 'معطّل'}
                          >
                            {config.hero.maleCard.enabled ?? true ? <Eye size={12} /> : <EyeOff size={12} />}
                          </button>
                          <input
                            type="color"
                            value={config.hero.maleCard.gradientColor || '#000000'}
                            onChange={(e) => setConfig(prev => ({ ...prev, hero: { ...prev.hero, maleCard: { ...prev.hero.maleCard, gradientColor: e.target.value }}}))}
                            className="w-4 h-4 rounded-full border-none p-0 cursor-pointer"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <CompactImage 
                          url={config.hero.maleCard.imageUrl}
                          onClear={() => clearImage('hero.maleCard')}
                          onUpload={(file) => handleImageUpload(file, 'hero.maleCard')}
                          uploading={uploadingImage === 'hero.maleCard'}
                        />
                        <input
                          type="text"
                          value={config.hero.maleCard.label}
                          onChange={(e) => setConfig(prev => ({ ...prev, hero: { ...prev.hero, maleCard: { ...prev.hero.maleCard, label: e.target.value }}}))}
                          className="flex-1 bg-white dark:bg-zinc-900 border-none rounded-lg px-2 py-1 text-[10px] font-normal outline-none"
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-3xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-normal uppercase text-zinc-400">بطاقة النساء</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setConfig(prev => ({ ...prev, hero: { ...prev.hero, femaleCard: { ...prev.hero.femaleCard, enabled: !(prev.hero.femaleCard.enabled ?? true) }}}))}
                            className={`p-1 rounded-lg transition-colors ${
                              config.hero.femaleCard.enabled ?? true
                                ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                                : 'bg-red-500/20 text-red-600 dark:text-red-400'
                            }`}
                            title={config.hero.femaleCard.enabled ?? true ? 'مفعّل' : 'معطّل'}
                          >
                            {config.hero.femaleCard.enabled ?? true ? <Eye size={12} /> : <EyeOff size={12} />}
                          </button>
                          <input
                            type="color"
                            value={config.hero.femaleCard.gradientColor || '#000000'}
                            onChange={(e) => setConfig(prev => ({ ...prev, hero: { ...prev.hero, femaleCard: { ...prev.hero.femaleCard, gradientColor: e.target.value }}}))}
                            className="w-4 h-4 rounded-full border-none p-0 cursor-pointer"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <CompactImage 
                          url={config.hero.femaleCard.imageUrl}
                          onClear={() => clearImage('hero.femaleCard')}
                          onUpload={(file) => handleImageUpload(file, 'hero.femaleCard')}
                          uploading={uploadingImage === 'hero.femaleCard'}
                        />
                        <input
                          type="text"
                          value={config.hero.femaleCard.label}
                          onChange={(e) => setConfig(prev => ({ ...prev, hero: { ...prev.hero, femaleCard: { ...prev.hero.femaleCard, label: e.target.value }}}))}
                          className="flex-1 bg-white dark:bg-zinc-900 rounded-lg px-2 py-1 text-[10px] font-normal outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* GENDER CONTENT SECTION */}
          {activeTab === 'gender' && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Best Tailors - Compact */}
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border-[1.5px] border-black/10 dark:border-white/10 shadow-sm space-y-3">
                <div className="flex items-center gap-2 border-b border-zinc-50 dark:border-zinc-800 pb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-theme-primary"></span>
                  <h3 className="text-sm font-normal uppercase tracking-tighter">أفضل الخياطين المرشحين</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {config[activeGender].bestTailors.map((tailor, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 rounded-3xl bg-zinc-50 dark:bg-zinc-800/50 border-[1.5px] border-black/10 dark:border-white/10 group hover:border-theme-primary/30 transition-all">
                      <CompactImage 
                        url={tailor.imageUrl}
                        onClear={() => {
                          const updated = [...config[activeGender].bestTailors];
                          updated[index].imageUrl = '';
                          setConfig(prev => ({ ...prev, [activeGender]: { ...prev[activeGender], bestTailors: updated }}));
                        }}
                        onUpload={(file) => {
                          setSelectedTailorIndex(index);
                          handleImageUpload(file, `${activeGender}.bestTailors.${index}`);
                        }}
                        uploading={uploadingImage === `${activeGender}.bestTailors.${index}`}
                        className="w-16 h-16 rounded-2xl"
                      />
                      <div className="flex-1 space-y-2">
                        <select
                          value={tailor.tailorId}
                          onChange={(e) => handleTailorSelect(index, e.target.value)}
                          className="w-full bg-white dark:bg-zinc-900 border-[1.5px] border-black/10 dark:border-white/10 rounded-xl px-3 py-1.5 text-[10px] font-normal outline-none focus:ring-1 focus:ring-theme-primary/20"
                        >
                          <option value="">اختر خياط...</option>
                          {tailors.map(t => <option key={t.id} value={t.id}>{t.shopName || t.name}</option>)}
                        </select>
                        <div className="flex items-center justify-between px-2">
                           <span className="text-[9px] text-zinc-400 font-normal uppercase tracking-widest">{tailor.location || 'الموقع'}</span>
                           <button 
                            onClick={() => {
                                setSelectedTailorIndex(index);
                                setShowImagePicker(true);
                                loadTailorProducts(tailor.tailorId);
                            }}
                            className="text-[9px] font-normal text-theme-primary hover:underline uppercase"
                           >
                            اختر صورة
                           </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Categories - Compact Grid */}
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border-[1.5px] border-black/10 dark:border-white/10 shadow-sm space-y-3">
                 <div className="flex items-center gap-2 border-b border-zinc-50 dark:border-zinc-800 pb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-theme-primary"></span>
                  <h3 className="text-sm font-normal uppercase tracking-tighter">تقسيم التصنيفات</h3>
                </div>

                <div className="space-y-3">
                  {/* Large Categories */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {['largeCat1', 'largeCat2'].map((key) => {
                       const cat = config[activeGender].categories[key as 'largeCat1' | 'largeCat2'];
                       return (
                        <div key={key} className="flex items-center gap-4 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border-[1.5px] border-black/10 dark:border-white/10">
                          <CompactImage 
                            url={cat.imageUrl}
                            onClear={() => clearImage(`${activeGender}.categories.${key}`)}
                            onUpload={(file) => handleImageUpload(file, `${activeGender}.categories.${key}`)}
                            uploading={uploadingImage === `${activeGender}.categories.${key}`}
                          />
                          <div className="flex-1 space-y-1">
                            <select
                              onChange={(e) => handleCategorySelect(key as 'largeCat1' | 'largeCat2', e.target.value)}
                              className="w-full bg-transparent border-none text-[10px] font-normal uppercase text-zinc-400 focus:ring-0 cursor-pointer"
                            >
                              <option value="">تغيير التصنيف ({cat.label})</option>
                              {filteredCategoriesByGender.map(c => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
                            </select>
                            <input 
                              type="text"
                              value={cat.label}
                              onChange={(e) => {
                                const newCat = { ...cat, label: e.target.value };
                                setConfig(prev => ({ ...prev, [activeGender]: { ...prev[activeGender], categories: { ...prev[activeGender].categories, [key]: newCat }}}));
                              }}
                              className="w-full bg-white dark:bg-zinc-900 rounded-lg px-2 py-1 text-xs font-normal border-none outline-none"
                            />
                          </div>
                        </div>
                       )
                     })}
                  </div>

                  {/* Small Categories Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {config[activeGender].categories.smallCats.map((cat, index) => (
                      <div key={index} className="flex flex-col items-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded-3xl border-[1.5px] border-black/10 dark:border-white/10 space-y-3">
                        <CompactImage 
                          url={cat.imageUrl}
                          onClear={() => clearImage(`${activeGender}.categories.smallCats.${index}`)}
                          onUpload={(file) => handleImageUpload(file, `${activeGender}.categories.smallCats.${index}`)}
                          uploading={uploadingImage === `${activeGender}.categories.smallCats.${index}`}
                          className="w-full aspect-square h-auto"
                        />
                        <div className="w-full space-y-1">
                          <select
                            onChange={(e) => handleSmallCategorySelect(index, e.target.value)}
                            className="w-full bg-transparent border-none text-[8px] font-normal uppercase text-zinc-400 focus:ring-0 cursor-pointer text-center"
                          >
                            <option value="">تغيير</option>
                            {filteredCategoriesByGender.map(c => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
                          </select>
                          <input 
                            type="text"
                            value={cat.label}
                            onChange={(e) => {
                              const newCats = [...config[activeGender].categories.smallCats];
                              newCats[index].label = e.target.value;
                              setConfig(prev => ({ ...prev, [activeGender]: { ...prev[activeGender], categories: { ...prev[activeGender].categories, smallCats: newCats } } }));
                            }}
                            className="w-full bg-white dark:bg-zinc-900 rounded-lg px-2 py-1 text-[10px] font-normal border-none outline-none text-center"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Handpicked Products */}
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border-[1.5px] border-black/10 dark:border-white/10 shadow-sm space-y-3">
                <div className="flex items-center gap-2 border-b border-zinc-50 dark:border-zinc-800 pb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-theme-primary"></span>
                  <h3 className="text-sm font-normal uppercase tracking-tighter">المنتجات المرشحة يدوياً</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Recent Arrivals */}
                  <div className="p-6 bg-zinc-50 dark:bg-zinc-800 rounded-3xl space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className={`w-10 h-6 rounded-full transition-all relative ${config[activeGender].recentArrivals.enabled ? 'bg-theme-primary' : 'bg-zinc-300'}`}>
                          <input 
                            type="checkbox" 
                            className="hidden" 
                            checked={config[activeGender].recentArrivals.enabled}
                            onChange={(e) => setConfig(prev => ({ ...prev, [activeGender]: { ...prev[activeGender], recentArrivals: { ...prev[activeGender].recentArrivals, enabled: e.target.checked }}}))}
                          />
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${config[activeGender].recentArrivals.enabled ? 'left-5' : 'left-1'}`}></div>
                        </div>
                        <span className="text-xs font-normal uppercase">عرض قسم "جديدنا"</span>
                      </label>
                      <button 
                        onClick={() => setShowProductPicker({ type: 'recentArrivals', gender: activeGender })}
                        className="p-1 px-3 bg-white dark:bg-zinc-900 rounded-lg text-[9px] font-normal text-theme-primary shadow-sm hover:scale-105 transition-transform"
                      >
                        تعديل القائمة
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-3 max-h-32 overflow-y-auto">
                      {config[activeGender].recentArrivals.productIds?.map(pid => {
                        const p = allProducts.find(x => x.id === pid);
                        const imageUrl = p?.images?.[0] || p?.image;
                        return (
                          <div key={pid} className="relative group shrink-0">
                            {imageUrl ? (
                              <img 
                                src={imageUrl} 
                                alt={p?.name} 
                                className="w-20 h-20 rounded-lg object-cover border-[1.5px] border-black/10 dark:border-white/10 shadow-sm"
                              />
                            ) : (
                              <div className="w-20 h-20 rounded-lg bg-zinc-200 dark:bg-zinc-700 border-[1.5px] border-black/10 dark:border-white/10 flex items-center justify-center text-[9px] text-zinc-400">
                                لا توجد صورة
                              </div>
                            )}
                            <button
                              onClick={() => toggleProductSelection('recentArrivals', activeGender, pid)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                              title={p?.name || pid}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Best Selling */}
                  <div className="p-6 bg-zinc-50 dark:bg-zinc-800 rounded-3xl space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className={`w-10 h-6 rounded-full transition-all relative ${config[activeGender].bestSelling.enabled ? 'bg-theme-primary' : 'bg-zinc-300'}`}>
                          <input 
                            type="checkbox" 
                            className="hidden" 
                            checked={config[activeGender].bestSelling.enabled}
                            onChange={(e) => setConfig(prev => ({ ...prev, [activeGender]: { ...prev[activeGender], bestSelling: { ...prev[activeGender].bestSelling, enabled: e.target.checked }}}))}
                          />
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${config[activeGender].bestSelling.enabled ? 'left-5' : 'left-1'}`}></div>
                        </div>
                        <span className="text-xs font-normal uppercase">عرض "الأكثر مبيعاً"</span>
                      </label>
                      <button 
                        onClick={() => setShowProductPicker({ type: 'bestSelling', gender: activeGender })}
                        className="p-1 px-3 bg-white dark:bg-zinc-900 rounded-lg text-[9px] font-normal text-theme-primary shadow-sm hover:scale-105 transition-transform"
                      >
                        تعديل القائمة
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-3 max-h-32 overflow-y-auto">
                      {config[activeGender].bestSelling.productIds?.map(pid => {
                        const p = allProducts.find(x => x.id === pid);
                        const imageUrl = p?.images?.[0] || p?.image;
                        return (
                          <div key={pid} className="relative group shrink-0">
                            {imageUrl ? (
                              <img 
                                src={imageUrl} 
                                alt={p?.name} 
                                className="w-20 h-20 rounded-lg object-cover border-[1.5px] border-black/10 dark:border-white/10 shadow-sm"
                              />
                            ) : (
                              <div className="w-20 h-20 rounded-lg bg-zinc-200 dark:bg-zinc-700 border-[1.5px] border-black/10 dark:border-white/10 flex items-center justify-center text-[9px] text-zinc-400">
                                لا توجد صورة
                              </div>
                            )}
                            <button
                              onClick={() => toggleProductSelection('bestSelling', activeGender, pid)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                              title={p?.name || pid}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* REGIONS SECTION */}
          {activeTab === 'regions' && (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border-[1.5px] border-black/10 dark:border-white/10 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {config.regions?.map((region, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border-[1.5px] border-black/10 dark:border-white/10 group transition-all">
                       <CompactImage 
                        url={region.image}
                        onClear={() => updateRegion(index, 'image', '')}
                        onUpload={(file) => handleImageUpload(file, `regions.${index}.image`)}
                        uploading={uploadingImage === `regions.${index}.image`}
                        className="w-16 h-20 rounded-2xl"
                       />
                       <div className="flex-1 space-y-2">
                          <input 
                            type="text" 
                            value={region.name} 
                            onChange={(e) => updateRegion(index, 'name', e.target.value)}
                            className="w-full bg-white dark:bg-zinc-900 rounded-lg px-3 py-1.5 text-xs font-normal border-none outline-none"
                            placeholder="اسم المنطقة"
                          />
                          <div className="flex items-center justify-between gap-2">
                             <input 
                              type="text" 
                              value={region.count} 
                              onChange={(e) => updateRegion(index, 'count', e.target.value)}
                              className="w-16 bg-white dark:bg-zinc-900 rounded-lg px-2 py-1 text-[10px] font-normal border-none outline-none"
                              placeholder="العدد"
                            />
                            <div className="flex gap-1">
                               <button onClick={() => moveRegion(index, 'up')} disabled={index === 0} className="p-1.5 bg-white dark:bg-zinc-900 rounded-lg disabled:opacity-30"><ArrowUp size={12}/></button>
                               <button onClick={() => moveRegion(index, 'down')} disabled={index === (config.regions?.length || 1) - 1} className="p-1.5 bg-white dark:bg-zinc-900 rounded-lg disabled:opacity-30"><ArrowDown size={12}/></button>
                            </div>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* COMING SOON BANNER SECTION */}
          {activeTab === 'banner' && (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border-[1.5px] border-black/10 dark:border-white/10 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between p-6 bg-zinc-50 dark:bg-zinc-800 rounded-3xl">
                <div className="space-y-1">
                  <h4 className="text-sm font-normal uppercase">الحالة الحالية</h4>
                  <p className="text-xs text-zinc-500">تحكم بظهور بانر "قريباً.. قسم الإكسسوارات" في أسفل المتجر</p>
                </div>
                <button
                  onClick={() => setConfig(prev => ({ ...prev, accessoriesBanner: { ...(prev.accessoriesBanner || DEFAULT_CONFIG.accessoriesBanner!), enabled: !prev.accessoriesBanner?.enabled }}))}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-normal text-xs transition-all ${
                    config.accessoriesBanner?.enabled 
                      ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                      : 'bg-red-500/10 text-red-500 border border-red-500/20'
                  }`}
                >
                  {config.accessoriesBanner?.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
                  {config.accessoriesBanner?.enabled ? 'البانر مفعل ونشط' : 'البانر مخفي حالياً'}
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                 <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-normal text-zinc-400 tracking-widest">النص الرئيسي للبانر</label>
                      <input 
                        type="text"
                        value={config.accessoriesBanner?.title || ''}
                        onChange={(e) => setConfig(prev => ({ ...prev, accessoriesBanner: { ...(prev.accessoriesBanner || DEFAULT_CONFIG.accessoriesBanner!), title: e.target.value }}))}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl px-5 py-4 text-sm font-normal focus:ring-2 focus:ring-theme-primary/20 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-normal text-zinc-400 tracking-widest">نص زر الحركة</label>
                      <input 
                        type="text"
                        value={config.accessoriesBanner?.buttonText || ''}
                        onChange={(e) => setConfig(prev => ({ ...prev, accessoriesBanner: { ...(prev.accessoriesBanner || DEFAULT_CONFIG.accessoriesBanner!), buttonText: e.target.value }}))}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl px-5 py-4 text-sm font-normal focus:ring-2 focus:ring-theme-primary/20 outline-none"
                      />
                    </div>
                 </div>

                 <div className="space-y-4">
                    <label className="text-[10px] uppercase font-normal text-zinc-400 tracking-widest">خلفية البانر (داكنة)</label>
                    <div className="relative group aspect-video rounded-3xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden border border-zinc-200 dark:border-zinc-700">
                      <img src={config.accessoriesBanner?.imageUrl} className="w-full h-full object-cover opacity-60" alt="Banner Preview" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                         <label className="px-6 py-3 bg-white text-black rounded-2xl font-normal text-xs cursor-pointer hover:scale-105 transition-transform">
                            تغيير خلفية البانر
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'accessoriesBanner')} />
                         </label>
                      </div>
                      {uploadingImage === 'accessoriesBanner' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                          <Loader2 size={32} className="text-white animate-spin" />
                        </div>
                      )}
                    </div>
                 </div>
              </div>
            </div>
          )}

          {/* PROMOTION SECTION */}
          {activeTab === 'promotion' && (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border-[1.5px] border-black/10 dark:border-white/10 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-normal text-zinc-400 tracking-widest">عنوان العرض</label>
                    <textarea 
                      value={config.promotion.title}
                      onChange={(e) => setConfig(prev => ({ ...prev, promotion: { ...prev.promotion, title: e.target.value }}))}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl px-5 py-4 text-sm font-normal focus:ring-2 focus:ring-theme-primary/20 outline-none min-h-[100px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-normal text-zinc-400 tracking-widest">نص الزر</label>
                    <input 
                      type="text"
                      value={config.promotion.buttonText}
                      onChange={(e) => setConfig(prev => ({ ...prev, promotion: { ...prev.promotion, buttonText: e.target.value }}))}
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl px-5 py-4 text-sm font-normal focus:ring-2 focus:ring-theme-primary/20 outline-none"
                    />
                  </div>
               </div>
            </div>
          )}

        </div>
      </div>

      {/* MODALS RENDERED OUTSIDE FLOW TO AVOID LAYER Z-INDEX ISSUES */}
      {showProductPicker && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4 text-right" dir="rtl">
            <div className="bg-white dark:bg-zinc-950 rounded-[3rem] w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-white/10">
               <div className="p-8 border-b border-zinc-50 dark:border-zinc-900 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-normal uppercase text-zinc-900 dark:text-white">اختر المنتجات المرشحة</h2>
                    <p className="text-[10px] text-zinc-500 font-normal uppercase tracking-widest mt-1">تنسيق قسم {showProductPicker.type === 'recentArrivals' ? 'جديدنا' : 'الأكثر مبيعاً'}</p>
                  </div>
                  <button onClick={() => setShowProductPicker(null)} className="w-12 h-12 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center hover:rotate-90 transition-all"><X/></button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 pb-10">
                     {allProducts.map(p => {
                       const isSelected = config[showProductPicker.gender][showProductPicker.type].productIds?.includes(p.id);
                       return (
                        <div 
                          key={p.id} 
                          onClick={() => toggleProductSelection(showProductPicker.type, showProductPicker.gender, p.id)}
                          className={`relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer border-2 transition-all group ${isSelected ? 'border-theme-primary ring-4 ring-theme-primary/10 scale-[0.98]' : 'border-transparent filter grayscale hover:grayscale-0'}`}
                        >
                          <img src={p.images?.[0] || p.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" />
                          <div className={`absolute inset-0 flex items-end p-2 transition-opacity ${isSelected ? 'bg-theme-primary/20 opacity-100' : 'bg-black/60 opacity-0 group-hover:opacity-100'}`}>
                             <p className="text-white text-[8px] font-normal uppercase tracking-tighter line-clamp-1">{p.name}</p>
                          </div>
                          {isSelected && <div className="absolute top-2 right-2 bg-theme-primary text-white w-5 h-5 rounded-full flex items-center justify-center shadow-lg"><Check size={12} strokeWidth={4}/></div>}
                        </div>
                       )
                     })}
                  </div>
               </div>
               
               <div className="p-8 border-t border-zinc-50 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950 flex items-center justify-between">
                  <span className="text-[10px] font-normal uppercase text-zinc-400 tracking-widest">المحدد حالياً: {config[showProductPicker.gender][showProductPicker.type].productIds?.length || 0} منتج</span>
                  <button onClick={() => setShowProductPicker(null)} className="bg-theme-primary text-white px-10 py-3 rounded-2xl font-normal uppercase text-xs shadow-lg shadow-theme-primary/20">تأكيد وقبول الاختيار</button>
               </div>
            </div>
         </div>
      )}

      {/* Image Picker Modal for Best Tailors (Specific internal tailor products) */}
      {showImagePicker && selectedTailorIndex !== null && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4 text-right" dir="rtl">
            <div className="bg-white dark:bg-zinc-950 rounded-[3rem] w-full max-w-5xl max-h-[80vh] overflow-hidden flex flex-col border border-white/10 shadow-2xl">
               <div className="p-8 border-b border-zinc-50 dark:border-zinc-900 flex items-center justify-between">
                 <h2 className="text-xl font-normal uppercase">منتجات الخياط: {config[activeGender].bestTailors[selectedTailorIndex].name}</h2>
                 <button onClick={() => { setShowImagePicker(false); setSelectedTailorIndex(null); }} className="w-10 h-10 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center"><X size={18}/></button>
               </div>
               <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                  {tailorProducts[config[activeGender].bestTailors[selectedTailorIndex].tailorId] ? (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                       {tailorProducts[config[activeGender].bestTailors[selectedTailorIndex].tailorId].map((p: any) => {
                         const imgs = p.images || p.imageUrls || [p.image];
                         return imgs.map((img: string, idx: number) => (
                           <div 
                            key={`${p.id}-${idx}`} 
                            onClick={() => handleProductImageSelect(selectedTailorIndex, img)}
                            className="aspect-square rounded-2xl overflow-hidden border-2 border-transparent hover:border-theme-primary cursor-pointer transition-all hover:scale-[1.05]"
                           >
                              <img src={img} className="w-full h-full object-cover" alt="" />
                           </div>
                         ))
                       })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                       <Loader2 className="animate-spin text-theme-primary" size={32}/>
                       <p className="text-[10px] font-normal uppercase tracking-widest text-zinc-500">تحميل الكتالوج...</p>
                    </div>
                  )}
               </div>
            </div>
         </div>
      )}

    </div>
  );
};

export default LandingPageConfig;


