import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Search, ShoppingBag, ArrowUpRight, ArrowRight, Star, ChevronLeft, ChevronRight, MessageSquare, Instagram, Twitter, Facebook, Mail, Phone, MapPin, LayoutGrid, Tag, ScanFace, Scissors, Truck, Ruler, Palette, PenTool, Menu, X } from 'lucide-react';
import { doc, getDoc, collection, query, where, getDocs, collectionGroup } from 'firebase/firestore';
import { db } from '../../services/firebase';
import type { DemoShellOutletContext } from './DemoShellLayout';

const ProductCard = React.memo(({ product, navigate }: { product: any, navigate: any }) => {
  const images = product.images || (product.image ? [product.image] : product.imageUrl ? [product.imageUrl] : []);
  const [index, setIndex] = React.useState(0);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const startSlideshow = () => {
    if (images.length > 1 && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        setIndex((prev) => (prev + 1) % images.length);
      }, 1200);
    }
  };

  const stopSlideshow = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIndex(0);
  };

  if (!product) return null;

  return (
    <div className="cursor-pointer group h-full flex flex-col" onClick={() => navigate(`/product/${product.id}`)}>
      <div 
        className="relative aspect-[3/4] bg-zinc-800 rounded-[2rem] overflow-hidden mb-4 border border-white/5"
        onMouseEnter={startSlideshow}
        onMouseLeave={stopSlideshow}
      >
        {images.length > 0 ? (
          images.map((img: string, i: number) => (
            <img 
              key={i}
              src={img} 
              className={`w-full h-full object-cover absolute inset-0 transition-opacity duration-700 ${
                i === index ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
              }`}
              alt={product.name} 
              loading="eager"
              decoding="async"
            />
          ))
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-900 border border-white/10">
            <Tag className="w-8 h-8 text-white/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
        <button 
          title="ابدأ التفصيل"
          className="absolute bottom-4 right-4 bg-[var(--theme-primary)] text-white w-10 h-10 rounded-full flex items-center justify-center translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10 shadow-xl" 
          onClick={(e) => { e.stopPropagation(); }}
        >
          <ShoppingBag size={18} />
        </button>
      </div>
      <div className="px-1 mt-auto">
        <p className="text-[10px] font-black uppercase text-[var(--theme-text-accent)] tracking-[0.2em] mb-1 line-clamp-1">{product.vendorName}</p>
        <h4 className="text-sm font-normal text-white mb-0.5 line-clamp-1">{product.name}</h4>
        <div className="text-xs text-white/40 font-medium flex items-center gap-1">
          <Scissors size={10} />
          <span>يبدأ من {product.price} ر.ع</span>
        </div>
      </div>
    </div>
  );
});

const MontLandingPage = () => {
  const { dbProducts = [], landingConfig, activeTheme, setActiveTheme } = useOutletContext<any>();
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  
  // Theme settings
  const themes: Record<string, any> = {
    lime: { 
      id: 'lime',
      label: 'Royal Purple & Lime',
      primary: '#63498b', 
      secondary: '#b5e58d',
      border: '#63498b',
      faint: '#63498b33',
      semi: '#63498b80',
      text_accent: '#63498b'
    },
    sage: { 
      id: 'sage',
      label: 'Sage & Gold',
      primary: '#859F87', 
      secondary: '#C5A572',
      border: '#859F87',
      faint: '#859F8733',
      semi: '#859F8780',
      text_accent: '#C5A572'
    },
    blue: { 
      id: 'blue',
      label: 'Tailor Blue',
      primary: '#6B8CAE', 
      secondary: '#C0A062',
      border: '#6B8CAE',
      faint: '#6B8CAE33',
      semi: '#6B8CAE80',
      text_accent: '#C0A062'
    },
    violet: {
      id: 'violet',
      label: 'Royal Purple',
      primary: '#7B1FA2',
      secondary: '#E1BEE7',
      border: '#7B1FA2',
      faint: '#7B1FA233',
      semi: '#7B1FA280',
      text_accent: '#7B1FA2'
    },
    lavender: {
      id: 'lavender',
      label: 'Lavender Mist',
      primary: '#9FA8DA',
      secondary: '#C5CAE9',
      border: '#9FA8DA',
      faint: '#9FA8DA33',
      semi: '#9FA8DA80',
      text_accent: '#5C6BC0'
    }
  };
  
  const theme = themes[activeTheme || 'lime'] || themes.lime;

  // Landing page configuration from Firestore (Loaded from Parent Layout)
  const [config, setConfig] = useState<any>(landingConfig);
  const [loading, setLoading] = useState(!landingConfig);

  useEffect(() => {
    if (landingConfig) {
      setConfig(landingConfig);
      setLoading(false);
    }
  }, [landingConfig]);
  
  // Get gender from URL path (/male or /female)
  const genderFilter = React.useMemo(() => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    const genderParam = pathParts[0]; // First part after /
    
    if (genderParam === 'male' || genderParam === 'female') {
      return genderParam;
    }
    // Default to female if no gender specified
    return 'female';
  }, [location.pathname]) as 'male' | 'female' | 'all';

  // Save gender preference to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem('khuyoot:lastGender', genderFilter);
  }, [genderFilter]);

  const handleCategoryClick = (label: string, customPath?: string) => {
    const gender = genderFilter === 'female' ? 'women' : 'men';
    
    // If a custom path (slug) is provided from config, use it directly
    if (customPath) {
      navigate(`/products/${gender}/${customPath}`);
      return;
    }

    // Mapping common labels to standard keys
    const mapping: Record<string, string> = {
      'دشداشة': 'dishdasha',
      'dishdasha': 'dishdasha',
      'ثياب': 'thobe',
      'ثوب': 'thobe',
      'thobe': 'thobe',
      'عبايات': 'abaya',
      'abaya': 'abaya',
      'فساتين': 'dress',
      'dress': 'dress',
      'جاكيتات': 'jacket',
      'jacket': 'jacket',
      'مخور': 'dress',
      'جلابيات': 'dress',
      'بدلات': 'jacket'
    };

    const cleanLabel = (label || '').trim();
    const slug = mapping[cleanLabel] || mapping[cleanLabel.toLowerCase()] || cleanLabel.toLowerCase().replace(/\s+/g, '-');
    
    navigate(`/products/${gender}/${slug}`);
  };
  
  // Redirect to default gender if on base path (handled by App.tsx now)
  // No need for redirect here anymore
  
  // Combined products list - just use what's already loaded by DemoShellLayout
  const allAvailableProducts = React.useMemo(() => {
    return dbProducts;
  }, [dbProducts]);

  const recentProducts = React.useMemo(() => {
    // Check if configuration has specific product IDs
    const configProductIds = genderFilter === 'female' 
      ? config?.female?.recentArrivals?.productIds 
      : config?.male?.recentArrivals?.productIds;

    console.log('[MontLanding] Recent Products Debug:', {
      genderFilter,
      configProductIds,
      allAvailableCount: allAvailableProducts.length,
      config: config ? 'loaded' : 'null'
    });

    if (configProductIds && configProductIds.length > 0) {
      const filteredList = allAvailableProducts.filter((p: any) => configProductIds.includes(p.id));
      console.log('[MontLanding] Found manual products:', filteredList.length, 'out of', configProductIds.length);
      if (filteredList.length > 0) {
        // Sort to match the order in configProductIds
        return [...filteredList].sort((a, b) => 
          configProductIds.indexOf(a.id) - configProductIds.indexOf(b.id)
        );
      }
    }

    // Default Fallback: Show latest products matching gender
    const fallback = allAvailableProducts
      .filter((p: any) => genderFilter === 'all' || p.gender === genderFilter)
      .slice(0, 12);
    console.log('[MontLanding] Using fallback products:', fallback.length);
    return fallback;
  }, [allAvailableProducts, genderFilter, config]);

  const bestSellingProducts = React.useMemo(() => {
    // Check if configuration has specific product IDs
    const configProductIds = genderFilter === 'female' 
      ? config?.female?.bestSelling?.productIds 
      : config?.male?.bestSelling?.productIds;

    console.log('[MontLanding] Best Selling Debug:', {
      genderFilter,
      configProductIds,
      allAvailableCount: allAvailableProducts.length
    });

    if (configProductIds && configProductIds.length > 0) {
      const filteredList = allAvailableProducts.filter((p: any) => configProductIds.includes(p.id));
      console.log('[MontLanding] Found manual best sellers:', filteredList.length, 'out of', configProductIds.length);
      if (filteredList.length > 0) {
        // Sort to match the order in configProductIds
        return [...filteredList].sort((a, b) => 
          configProductIds.indexOf(a.id) - configProductIds.indexOf(b.id)
        );
      }
    }

    // Default Fallback
    const fallback = [...allAvailableProducts]
      .filter((p: any) => genderFilter === 'all' || p.gender === genderFilter)
      .reverse()
      .slice(0, 8);
    console.log('[MontLanding] Using fallback best sellers:', fallback.length);
    return fallback;
  }, [allAvailableProducts, genderFilter, config]);

  // use the landing config from layout context
  useEffect(() => {
    if (landingConfig) {
      setConfig(landingConfig);
      setLoading(false);
    }
  }, [landingConfig]);

  // Show loading state - only if we don't even have a cached config
  if (!config) {
    return (
      <div className="min-h-screen bg-[#ededed] flex items-center justify-center">
        <div className="text-zinc-400 text-sm animate-pulse">جاري التحميل...</div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[#ededed] text-[#1a1a1a] font-['Tajawal'] overflow-x-hidden selection:bg-[var(--theme-primary)] selection:text-white" style={{
        '--theme-primary': theme.primary,
        '--theme-secondary': theme.secondary,
        '--theme-border': theme.border,
        '--theme-faint': theme.faint,
        '--theme-semi': theme.semi,
        '--theme-text-accent': theme.text_accent || theme.primary
    } as React.CSSProperties}>
      {/* Mobile Search Bar - Top of Page */}
      <div className="px-4 py-2 md:hidden max-w-[1400px] mx-auto z-20 relative">
        <div className="relative bg-white rounded-full border border-zinc-200 shadow-sm overflow-hidden h-[38px] flex items-center">
          <input 
            type="text" 
            placeholder="ابحث عن خياط، قماش، موديل..." 
            className="w-full h-full bg-transparent border-none text-[11px] pl-4 pr-10 focus:outline-none focus:ring-0 placeholder-zinc-400 text-black text-right appearance-none"
            dir="rtl"
            autoComplete="off"
          />
          <Search size={14} className="absolute right-3.5 text-zinc-400 pointer-events-none" />
        </div>
      </div>

      {/* --- HERO SECTION --- */}
      <section className="px-2 md:px-8 py-2 max-w-[1400px] mx-auto">
        <div 
          className="relative rounded-3xl min-h-[190px] md:min-h-[280px] overflow-hidden transition-colors duration-700"
          style={{ backgroundColor: genderFilter === 'male' ? config?.hero?.maleCard?.gradientColor : genderFilter === 'female' ? config?.hero?.femaleCard?.gradientColor : '#4a4e47' }}
        >
          {/* Background Image - Full Width */}
          <div className="absolute inset-0 w-full h-full">
            <img 
               src={config?.hero?.backgroundImage || "https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=1000&auto=format&fit=crop"} 
               alt="Hero Background" 
               className="w-full h-full object-cover grayscale brightness-75 mix-blend-overlay opacity-20"
            />
            <div 
              className="absolute inset-0 transition-opacity duration-700" 
              style={{ 
                background: `linear-gradient(to right, ${genderFilter === 'male' ? config?.hero?.maleCard?.gradientColor : genderFilter === 'female' ? config?.hero?.femaleCard?.gradientColor : '#000000'}80, transparent)` 
              }}
            />
          </div>

          {/* Content Container */}
          <div className="relative flex flex-col md:flex-row items-center min-h-[190px] md:min-h-[280px]">
            {/* Hero Right: Gender Category Cards - Desktop: Absolute positioned, Mobile: Below content */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 md:right-6 flex flex-col items-center gap-1.5 md:gap-3 z-10 px-2 md:px-0">
              <span className="text-white/60 text-[10px] md:text-xs uppercase font-normal tracking-widest mb-1 hidden md:block">حدد ما تريد تصفحه</span>
              <div className="flex flex-col md:flex-row gap-1.5 md:gap-4">
              {/* Female Card */}
              <div 
                onClick={() => navigate('/female')}
                className={`relative w-[60px] md:w-[140px] h-[60px] md:h-[180px] rounded-xl md:rounded-2xl overflow-hidden group cursor-pointer transition-all ${
                  genderFilter === 'female' ? 'ring-1 md:ring-2 ring-[var(--theme-primary)]' : ''
                }`}
              >
                <img 
                  src={config?.hero?.femaleCard?.imageUrl || "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&auto=format&fit=crop"} 
                  alt={config?.hero?.femaleCard?.label || "ملابس نسائية"} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="eager"
                />
                <div className="absolute bottom-3 md:bottom-4 right-3 md:right-4 hidden md:block">
                  <h3 className={`text-xs md:text-sm uppercase tracking-tighter px-2 py-0.5 inline-block ${
                    genderFilter === 'female' ? 'bg-[var(--theme-primary)] text-white' : 'bg-[#ededed] text-black'
                  }`}>{config?.hero?.femaleCard?.label || "ملابس نسائية"}</h3>
                </div>
                {/* Mobile Label */}
                <div className="md:hidden absolute inset-0 flex items-center justify-center bg-[var(--theme-primary)]/40">
                  <span className="text-[10px] font-normal text-white">نساء</span>
                </div>
                
                {genderFilter === 'female' && (
                  <div className="absolute top-1 right-1 md:top-2 md:right-2 bg-[var(--theme-primary)] text-white w-2 h-2 md:w-auto md:h-auto md:px-2 md:py-1 rounded-full text-[10px] font-normal uppercase z-20">
                    <span className="hidden md:block">نشط</span>
                  </div>
                )}
              </div>

              {/* Male Card */}
              <div 
                onClick={() => navigate('/male')}
                className={`relative w-[60px] md:w-[140px] h-[60px] md:h-[180px] rounded-xl md:rounded-2xl overflow-hidden group cursor-pointer transition-all ${
                  genderFilter === 'male' ? 'ring-1 md:ring-2 ring-[var(--theme-primary)]' : ''
                }`}
              >
                <img 
                  src={config?.hero?.maleCard?.imageUrl || "https://images.unsplash.com/photo-1507680434567-5739c80be1ac?w=400&auto=format&fit=crop"} 
                  alt={config?.hero?.maleCard?.label || "ملابس رجالية"} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="eager"
                />
                <div className="absolute bottom-3 md:bottom-4 right-3 md:right-4 hidden md:block">
                  <h3 className={`text-xs md:text-sm uppercase tracking-tighter px-2 py-0.5 inline-block ${
                    genderFilter === 'male' ? 'bg-[var(--theme-primary)] text-white' : 'bg-[#ededed] text-black'
                  }`}>{config?.hero?.maleCard?.label || "ملابس رجالية"}</h3>
                </div>
                {/* Mobile Label */}
                <div className="md:hidden absolute inset-0 flex items-center justify-center bg-[var(--theme-primary)]/40">
                  <span className="text-[10px] font-normal text-white">رجال</span>
                </div>

                {genderFilter === 'male' && (
                  <div className="absolute top-1 right-1 md:top-2 md:right-2 bg-[var(--theme-primary)] text-white w-2 h-2 md:w-auto md:h-auto md:px-2 md:py-1 rounded-full text-[10px] font-normal uppercase z-20">
                    <span className="hidden md:block">نشط</span>
                  </div>
                )}
              </div>
              </div>
            </div>

            {/* Hero Left: Content */}
            <div className="w-full md:w-1/2 mr-auto p-4 md:p-10 text-white space-y-2 md:space-y-4 flex flex-col justify-center order-1 md:order-2 pr-[80px] md:pr-0" dir="rtl">
            <h1 className="text-2xl md:text-4xl uppercase tracking-tighter leading-[0.9] text-right">
              {config?.hero?.title?.split('\\n').map((line: string, i: number) => (
                <React.Fragment key={i}>
                  {line}
                  {i < config.hero.title.split('\\n').length - 1 && <br />}
                </React.Fragment>
              )) || (<>ننسج <br /> تجربة <br /> الخياطة</>)}
            </h1>

            <p className="hidden md:block text-zinc-400 text-xs md:text-sm max-w-[200px] md:max-w-xs leading-relaxed text-right">
              {config?.hero?.description || "نحول أحلامك إلى واقع بخياطة فاخرة ومخصصة."}
            </p>
            <div className="w-full h-1 bg-zinc-800 rounded-full mt-6 relative overflow-hidden">
               {/* Measurement Tape Pattern */}
               <div className="absolute inset-0 flex justify-between items-end px-1 pb-px">
                  {[...Array(20)].map((_, i) => (
                    <div key={i} className={`w-px bg-white/30 ${i % 5 === 0 ? 'h-full' : 'h-1/2'}`}></div>
                  ))}
               </div>
               <div className="absolute top-0 left-0 h-full bg-[var(--theme-primary)] w-1/3"></div>
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS SECTION --- */}
      <section className="px-2 md:px-8 py-2 max-w-[1400px] mx-auto" style={{
          '--theme-primary': theme.primary,
          '--theme-secondary': theme.secondary,
          '--theme-border': theme.border,
          '--theme-faint': theme.faint,
          '--theme-text-accent': theme.text_accent || theme.primary
      } as React.CSSProperties}>
        <div className="bg-white rounded-3xl p-6 md:p-16 shadow-sm" dir="rtl">
          
          <div className="flex flex-col md:flex-row items-end justify-between gap-6 md:gap-10 mb-8 md:mb-12">
             <div className="space-y-4 max-w-xl">
                <h2 className="text-xl md:text-3xl uppercase leading-[0.85] tracking-tighter text-right">خطوات التفصيل في خيوط</h2>
                <p className="hidden md:block text-zinc-500 text-xs md:text-sm font-medium leading-relaxed text-right">
                  لأن الخياطة فن، جعلنا رحلتك معنا تبدأ بخطوة وتنتهي بتحفة فنية.
                </p>
             </div>
             
             {/* Supporting Badges - Scrollable on mobile */}
             <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
                 <div className="shrink-0 px-3 md:px-4 py-2 bg-[#f4f4f5] rounded-full text-[10px] md:text-xs font-normal flex items-center gap-2 text-zinc-600 border-2 border-dashed border-zinc-200">
                    <Ruler size={12} className="text-[var(--theme-text-accent)]" /> <span>خدمة قياس احترافية</span>
                 </div>
                 <div className="shrink-0 px-3 md:px-4 py-2 bg-[#f4f4f5] rounded-full text-[10px] md:text-xs font-normal flex items-center gap-2 text-zinc-600 border-2 border-dashed border-zinc-200">
                    <Truck size={12} className="text-[var(--theme-text-accent)]" /> <span>توصيل سريع</span>
                 </div>
             </div>
          </div>

          <div className="flex md:grid md:grid-cols-3 gap-3 md:gap-8 relative z-10 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 md:pb-0 -mx-2 px-2 md:mx-0 md:px-0">
             {[
               { icon: <LayoutGrid size={20} />, title: "تصفح الموديلات", desc: "اختر تصميمك المفضل من تشكيلتنا" },
               { icon: <Palette size={20} />, title: "جرب قماشك", desc: "شاهد القماش على الموديل فوراً" },
               { icon: <Scissors size={20} />, title: "اطلب خياطك", desc: "تنفيذ بجودة عالية وتوصيل لبابك" }
             ].map((item, i) => (
                <div key={i} className="shrink-0 w-[180px] md:w-auto snap-center group relative bg-[#fcfcfc] border-2 border-dashed border-[var(--theme-border)] p-4 md:p-8 rounded-2xl md:rounded-3xl hover:bg-[var(--theme-primary)] transition-all duration-500 hover:shadow-xl cursor-default h-full">
                   
                   {/* Number Watermark */}
                   <div className="absolute top-4 left-4 md:top-6 md:left-8 text-[var(--theme-faint)] group-hover:text-white/10 transition-colors text-4xl md:text-6xl font-black select-none font-mono">
                      0{i + 1}
                   </div>

                   {/* Sequence Arrows */}
                   {i < 2 && (
                     <>
                        {/* Desktop Arrow (Pointing Left for RTL) */}
                        <div className="hidden md:flex absolute top-1/2 -left-6 -translate-x-1/2 -translate-y-1/2 z-20 bg-white text-[var(--theme-text-accent)] rounded-full p-1.5 shadow-sm border border-[var(--theme-border)]">
                            <ChevronLeft size={16} strokeWidth={3} />
                        </div>
                        {/* Mobile Arrow (Pointing Down) */}
                        <div className="md:hidden absolute -left-1.5 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-white text-[var(--theme-text-accent)] rounded-full p-1 shadow-sm border border-[var(--theme-border)] rotate-180">
                            <ChevronLeft size={10} strokeWidth={3} />
                        </div>
                     </>
                   )}

                   <div className="relative z-10 flex flex-col items-start text-right gap-3 md:gap-6 h-full">
                      <div className="w-8 h-8 md:w-12 md:h-12 bg-white border border-[var(--theme-border)] group-hover:border-black/10 rounded-xl flex items-center justify-center text-black shadow-sm group-hover:scale-110 transition-all duration-300">
                         {item.icon}
                      </div>
                      <div className="w-full">
                         <h3 className="font-normal text-sm md:text-lg mb-1 md:mb-2 text-black group-hover:text-white transition-colors">{item.title}</h3>
                         <p className="hidden md:block text-zinc-500 text-[10px] md:text-xs leading-relaxed max-w-[200px] group-hover:text-white/70 transition-colors">{item.desc}</p>
                      </div>
                   </div>
                </div>
             ))}
          </div>

        </div>
      </section>

      {/* --- REGIONS STATS --- */}
      <section className="px-2 md:px-8 py-2 max-w-[1400px] mx-auto">
        <div className="bg-theme-surface text-zinc-900 rounded-3xl p-6 md:p-16 relative overflow-hidden" dir="rtl">
           {/* Pattern Overlay */}
           <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
           
           <div className="relative z-10">
              <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 md:gap-8 mb-6 md:mb-10">
                <div>
                   <h2 className="text-xl md:text-3xl uppercase leading-[0.85] tracking-tighter mb-2 md:mb-4">أفضل الخياطين حسب المناطق</h2>
                   <p className="hidden md:block text-zinc-600 text-xs md:text-sm max-w-md leading-relaxed">
                     اعثر على <span className="underline decoration-[var(--theme-primary)] decoration-2 underline-offset-4 text-zinc-900 font-normal">الخياط الأمهر</span> بالقرب منك
                   </p>
                </div>
                <button className="bg-[var(--theme-primary)] text-white px-4 md:px-6 py-2 rounded-full text-xs md:text-sm font-normal uppercase tracking-widest hover:scale-105 transition-transform w-fit">
                  عرض كل المناطق
                </button>
              </div>
              
              <div className="flex md:grid md:grid-cols-5 gap-3 md:gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-6 px-6 md:mx-0 md:px-0">
                 {(config?.regions || [
                   { name: 'مسقط', count: 45, image: 'https://images.unsplash.com/photo-1549413280-49658ec60424?w=600&auto=format&fit=crop' },
                   { name: 'صلالة', count: 18, image: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=400&auto=format&fit=crop' },
                   { name: 'صحار', count: 12, image: 'https://images.unsplash.com/photo-1518623489648-a173ef7824f3?w=400&auto=format&fit=crop' },
                   { name: 'نزوى', count: 9, image: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=400&auto=format&fit=crop' },
                   { name: 'صور', count: 7, image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&auto=format&fit=crop' }
                 ]).map((region: any, i: number) => (
                    <div key={i} className="shrink-0 w-[140px] md:w-auto snap-center group relative h-24 md:h-32 rounded-2xl overflow-hidden cursor-pointer border border-black/5 md:hover:border-[var(--theme-primary)] transition-colors">
                       <img src={region.image} className="w-full h-full object-cover opacity-100 transition-opacity" alt={region.name} />
                       <div className="absolute inset-0 p-3 md:p-4 flex flex-col justify-between">
                          <div className="flex justify-between items-start">
                             <MapPin size={14} className="md:w-4 md:h-4 text-[var(--theme-primary)]" />
                             <span className="text-[10px] md:text-xs font-normal bg-[var(--theme-primary)]/50 backdrop-blur-sm text-white px-2 py-0.5 rounded-full border border-white/10">{region.count} خياط</span>
                          </div>
                          <h3 className="font-normal text-base md:text-lg text-white drop-shadow-md">{region.name}</h3>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </section>

      {/* --- TRY-ON & BEST TAILORS SECTION --- */}
      <section className="px-2 md:px-8 py-2 max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row gap-3 md:gap-4">
          
          {/* Try-On Feature Block - 30% */}
          <div className="w-full md:w-[30%] bg-white rounded-3xl p-6 md:p-16 flex flex-col justify-center border-2 border-dashed border-[var(--theme-border)]">
            <div className="space-y-4 md:space-y-8 text-center md:text-right">
              <h2 className="text-xl md:text-3xl uppercase leading-[0.85] tracking-tighter" dir="rtl">
                {config?.promotion?.title || "جرب أقمشتك المفضلة في تصاميمك المحبوبة"}
              </h2>
              <button 
                onClick={() => navigate('/tryon')}
                className="bg-[var(--theme-primary)] text-white px-6 md:px-8 py-2.5 md:py-3 rounded-full text-xs md:text-sm uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-transform w-fit cursor-pointer mx-auto md:mx-0"
              >
                {config?.promotion?.buttonText || "جرب الآن"}
                <ArrowUpRight size={14} className="md:w-4 md:h-4" />
              </button>
            </div>
          </div>

          {/* Best Tailors Block - 70% */}
          <div className="w-full md:w-[70%] bg-white rounded-3xl p-6 md:p-16">
            <div className="space-y-4 md:space-y-6">
              <div className="flex justify-between items-end dir-rtl" dir="rtl">
                <div>
                  <h2 className="text-xl md:text-2xl uppercase mb-1">أفضل الخياطين</h2>
                  <p className="hidden md:block text-zinc-400 text-xs md:text-sm font-medium">بناءً على تقييمات المستخدمين</p>
                </div>
              </div>
              <div className="grid grid-cols-4 md:grid-cols-4 gap-2 md:gap-4 min-h-[80px] md:min-h-[150px]">
                {(genderFilter === 'all' ? config?.male?.bestTailors || config?.bestTailors : 
                  genderFilter === 'male' ? config?.male?.bestTailors : config?.female?.bestTailors || 
                  [
                    { name: 'محمد الخياط', location: 'مسقط', imageUrl: "https://images.unsplash.com/photo-1507680434567-5739c80be1ac?w=400" },
                    { name: 'أحمد العماني', location: 'صلالة', imageUrl: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400" },
                    { name: 'علي حسن', location: 'صحار', imageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400" },
                    { name: 'خالد سعيد', location: 'نزوى', imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400" }
                  ]).slice(0, 4).map((tailor: any, idx: number) => (
                  <div key={`${genderFilter}-${idx}`} className="aspect-[4/5] md:aspect-square bg-zinc-100 rounded-2xl overflow-hidden cursor-pointer relative group">
                    <img 
                      src={tailor.imageUrl || tailor.image} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                      alt={tailor.name}
                      loading="eager"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-2 md:p-4">
                      <h3 className="text-white text-[10px] md:text-sm truncate">{tailor.name}</h3>
                      <p className="text-white/70 text-[8px] md:text-xs truncate">{tailor.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* --- CATEGORIES CONTAINER --- */}
      <section className="px-2 md:px-8 py-2 max-w-[1400px] mx-auto">
        <div className="bg-white rounded-3xl p-6 md:p-16 space-y-4">
          {/* --- CATEGORIES --- */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-10">
            <div className="w-full md:w-1/4 space-y-4 text-right">
              <h2 className="text-xl md:text-2xl uppercase font-normal">
                <span className="inline-block bg-[var(--theme-primary)] px-3 py-1 text-white">
                  موديلات التفصيل
                </span>
              </h2>
              <p className="hidden md:block text-zinc-500 text-xs md:text-sm leading-relaxed font-medium">
                اكتشف أسلوبك الخاص من تصنيفاتنا المميزة.
              </p>
              <button 
                onClick={() => navigate(genderFilter === 'female' ? '/products/women' : '/products/men')}
                className="inline-flex bg-[var(--theme-primary)] text-white px-5 py-2 rounded-full text-xs font-normal items-center gap-2 hover:bg-[var(--theme-secondary)] transition-all hover:scale-105 w-fit shadow-sm"
              >
                <span>تصفح المنتجات</span>
                <ArrowRight size={14} className="rotate-180" />
              </button>
            </div>
            
            <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {(genderFilter === 'female' ? config?.female?.categories?.largeCat1?.imageUrl : config?.male?.categories?.largeCat1?.imageUrl) && (
                <div className="relative md:col-span-2 h-[200px] md:h-[300px] rounded-2xl overflow-hidden group cursor-pointer" onClick={() => handleCategoryClick(
                  (genderFilter === 'female' ? config?.female?.categories?.largeCat1?.label : config?.male?.categories?.largeCat1?.label),
                  (genderFilter === 'female' ? config?.female?.categories?.largeCat1?.path : config?.male?.categories?.largeCat1?.path)
                )}>
                  <img src={(genderFilter === 'female' ? config?.female?.categories?.largeCat1?.imageUrl : config?.male?.categories?.largeCat1?.imageUrl)} 
                       className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                  <div className="absolute top-4 left-4 bg-[var(--theme-primary)] text-white px-3 md:px-4 py-1 rounded-full text-[10px] md:text-xs font-normal uppercase">جديد</div>
                  <div className="absolute top-4 right-4 bg-white p-1.5 md:p-2 rounded-full"><ArrowRight size={16} className="md:w-5 md:h-5" /></div>
                  <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6">
                     <h3 className="text-white text-lg md:text-2xl uppercase tracking-tighter bg-[var(--theme-primary)]/30 backdrop-blur-sm px-2 py-1 rounded inline-block">
                       {(genderFilter === 'female' ? config?.female?.categories?.largeCat1?.label : config?.male?.categories?.largeCat1?.label) || "مخور"}
                     </h3>
                  </div>
                </div>
              )}
              {(genderFilter === 'female' ? config?.female?.categories?.largeCat2?.imageUrl : config?.male?.categories?.largeCat2?.imageUrl) && (
                <div className="h-[200px] md:h-[300px] rounded-2xl overflow-hidden relative group cursor-pointer" onClick={() => handleCategoryClick(
                  (genderFilter === 'female' ? config?.female?.categories?.largeCat2?.label : config?.male?.categories?.largeCat2?.label),
                  (genderFilter === 'female' ? config?.female?.categories?.largeCat2?.path : config?.male?.categories?.largeCat2?.path)
                )}>
                  <img src={(genderFilter === 'female' ? config?.female?.categories?.largeCat2?.imageUrl : config?.male?.categories?.largeCat2?.imageUrl)} 
                       className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                  <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6">
                     <h3 className="text-white text-lg md:text-2xl uppercase tracking-tighter bg-[var(--theme-primary)]/30 backdrop-blur-sm px-2 py-1 rounded inline-block">
                       {(genderFilter === 'female' ? config?.female?.categories?.largeCat2?.label : config?.male?.categories?.largeCat2?.label) || "عماني"}
                     </h3>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* --- MORE CATEGORIES --- */}
          <div className="flex md:grid md:grid-cols-4 gap-3 md:gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-6 px-6 md:mx-0 md:px-0">
            {((genderFilter === 'female' ? config?.female?.categories?.smallCats : config?.male?.categories?.smallCats) || [])
              .filter((cat: any) => cat.imageUrl || cat.image)
              .map((cat: any, idx: number) => (
                <div key={`${genderFilter}-smcat-${idx}`} className="shrink-0 w-[140px] md:w-auto snap-center relative h-[140px] md:h-[200px] rounded-2xl overflow-hidden group cursor-pointer" onClick={() => handleCategoryClick(cat.label, cat.path)}>
                  <img src={cat.imageUrl || cat.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={cat.label} />
                  <div className="absolute bottom-3 right-3 md:bottom-4 md:right-4 text-right" dir="rtl">
                    <h3 className="text-white text-xs md:text-sm uppercase bg-[var(--theme-primary)]/30 backdrop-blur-sm px-2 py-0.5 rounded inline-block">{cat.label}</h3>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* --- RECENT ARRIVALS --- */}
      {((genderFilter === 'all' ? config?.male?.recentArrivals?.enabled : 
         genderFilter === 'male' ? config?.male?.recentArrivals?.enabled : 
         config?.female?.recentArrivals?.enabled) !== false) && (
        <section className="px-2 md:px-8 py-2 max-w-[1400px] mx-auto">
        <div className="bg-[#52554e] text-white rounded-3xl px-6 py-4 md:px-16 md:py-8 relative overflow-hidden">
          {/* Subtle Pattern Overlay */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
          
          <div className="mb-4 md:mb-6 relative z-10">
            <h2 className="text-xl md:text-2xl uppercase text-right">تريندات ✨</h2>
          </div>

          {recentProducts.length === 0 ? (
            <div className="text-center py-20 text-white/40">
              <LayoutGrid className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-sm">لا توجد منتجات محددة. يرجى تحديد المنتجات من لوحة الإدارة.</p>
            </div>
          ) : (
            <div className="flex md:grid md:grid-cols-4 gap-3 md:gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-6 px-6 md:mx-0 md:px-0 pb-4">
               {recentProducts.slice(0, 8).map((product: any) => (
                  <div key={`recent-${genderFilter}-${product.id}`} className="shrink-0 w-[180px] md:w-auto snap-center" dir="rtl">
                    <ProductCard product={product} navigate={navigate} />
                  </div>
               ))}
            </div>
          )}

          {/* Bottom Button */}
          {recentProducts.length > 0 && (
            <div className="flex justify-center mt-4 md:mt-6">
              <button className="bg-[var(--theme-primary)] text-white px-6 md:px-8 py-2.5 md:py-3 rounded-full text-xs md:text-sm font-normal uppercase tracking-widest flex items-center gap-2 hover:bg-[var(--theme-secondary)] transition-all hover:scale-105">
                افتح المتجر
                <ArrowUpRight size={14} className="md:w-4 md:h-4" />
              </button>
            </div>
          )}
        </div>
        </section>
      )}

      {/* --- TESTIMONIALS --- */}
      {((genderFilter === 'all' ? config?.male?.bestSelling?.enabled : 
         genderFilter === 'male' ? config?.male?.bestSelling?.enabled : 
         config?.female?.bestSelling?.enabled) !== false) && (
        <section className="px-2 md:px-8 py-10 md:py-20 max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row gap-8 md:gap-10">
          <div className="w-full md:w-1/4 space-y-4 md:space-y-6 text-right">
            <h2 className="text-xl md:text-2xl uppercase">الأكثر تفصيلاً</h2>
            <p className="hidden md:block text-zinc-500 text-xs md:text-sm leading-relaxed">
              تقييمات ومراجعات من عملائنا المميزين
            </p>
            
            {/* Desktop Arrows */}
            <div className="pt-8 md:pt-20 hidden md:block">
               <div className="flex justify-center md:justify-start gap-2 text-zinc-300">
                  <button title="التالي" className="p-2 border border-zinc-200 rounded-full hover:bg-theme-primary hover:text-white transition"><ChevronRight size={16} /></button>
                  <button title="السابق" className="p-2 border border-zinc-200 rounded-full hover:bg-theme-primary hover:text-white transition"><ChevronLeft size={16} /></button>
               </div>
            </div>
            {/* Desktop Button - hidden on mobile */}
            <button className="hidden md:flex bg-[var(--theme-primary)] text-white px-8 py-3 rounded-full text-base font-normal uppercase items-center gap-2 mx-auto md:mx-0">
              استكشف المزيد
              <ArrowUpRight size={16} />
            </button>
          </div>

          {bestSellingProducts.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-zinc-400 py-20">
              <div className="text-center">
                <Tag className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-sm">لا توجد منتجات محددة. يرجى تحديد المنتجات من لوحة الإدارة.</p>
              </div>
            </div>
          ) : (
            <>
            <div className="flex-1 flex md:grid md:grid-cols-2 gap-4 md:gap-6 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-6 px-6 md:mx-0 md:px-0">
              {bestSellingProducts.slice(0, 4).map((product, idx) => (
              <div 
                key={`${genderFilter}-best-${product.id}`}
                className={`shrink-0 w-[240px] md:w-full snap-center rounded-3xl overflow-hidden relative group cursor-pointer h-[320px] md:h-[500px]`} 
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <img 
                  src={product.images?.[0] || product.image || product.imageUrl} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                  alt={product.name}
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 md:p-8">
                  <p className="text-[var(--theme-text-accent)] text-[10px] md:text-xs font-normal uppercase tracking-widest mb-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                    {product.vendorName}
                  </p>
                  <h3 className="text-white text-lg md:text-2xl uppercase tracking-tighter drop-shadow-lg group-hover:scale-105 transition-transform origin-left duration-500">{product.name}</h3>
                  <div className="flex items-center gap-2 mt-2 md:mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white font-normal text-sm md:text-base">{product.price} ر.ع</span>
                    <div className="w-8 h-px bg-[var(--theme-primary)]"></div>
                  </div>
                </div>
              </div>
            ))}
            </div>
            <div className="md:hidden flex justify-center mt-4 w-full">
              <button className="bg-[var(--theme-primary)] text-white px-8 py-3 rounded-full text-base font-normal uppercase flex items-center gap-2">
                استكشف المزيد
                <ArrowUpRight size={16} />
              </button>
            </div>
            </>
          )}
        </div>
        </section>
      )}

      {/* --- DISCOUNT BANNER --- */}
      {(!config?.accessoriesBanner || config.accessoriesBanner.enabled) && (
        <section className="px-2 md:px-8 py-6 md:py-10 max-w-[1400px] mx-auto">
          <div className="relative bg-[#4a4e47] h-[220px] md:h-[400px] rounded-3xl overflow-hidden flex items-center group" dir="rtl">
            <div className="absolute left-0 top-0 h-full w-2/3">
              <img 
                src={config?.accessoriesBanner?.imageUrl || "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=1000&auto=format&fit=crop"} 
                className="w-full h-full object-cover opacity-60 grayscale group-hover:scale-105 transition-transform duration-1000" 
                alt="" 
              />
            </div>
            <div className="relative z-10 p-6 md:p-20 text-white space-y-4 md:space-y-6 max-w-[200px] md:max-w-xl">
              <h2 className="text-xl md:text-4xl uppercase leading-[0.9]">
                {config?.accessoriesBanner?.title || "قريباً.. سنضيف قسم إكسسوارات."}
              </h2>
              <button className="bg-white text-black px-6 md:px-8 py-2 md:py-3 rounded-full text-xs md:text-sm uppercase tracking-widest hover:bg-[var(--theme-primary)] hover:text-white transition font-normal">
                {config?.accessoriesBanner?.buttonText || "اكتشف المزيد"}
              </button>
            </div>
            <div className="absolute left-1/3 top-1/2 -translate-y-1/2 z-20">
              <div className="w-20 h-20 md:w-32 md:h-32 rounded-full border border-white/30 flex items-center justify-center backdrop-blur-md">
                  <div className="text-center group-hover:scale-110 transition-transform">
                    <div className="text-xl md:text-3xl text-white">60%</div>
                    <div className="text-[10px] md:text-xs font-normal text-white uppercase flex items-center justify-center gap-1">خصم <ArrowRight size={10} className="md:w-3 md:h-3 rotate-180"/></div>
                  </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* --- FOOTER --- */}
      <footer className="px-4 md:px-8 py-6 md:py-20 max-w-[1400px] mx-auto border-t" dir="rtl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-10">
          <div className="space-y-4 md:space-y-6 text-center md:text-right">
            <div className="text-xl md:text-2xl font-black uppercase">KHUYOOT</div>
            <p className="text-xs md:text-sm text-zinc-500 leading-relaxed max-w-xs mx-auto md:mx-0">
              مسقط، سلطنة عمان <br /> info@khuyoot.com
            </p>
            {/* Mobile Socials */}
            <div className="md:hidden flex justify-center gap-4 mt-4">
                <a href="#" className="text-zinc-400 hover:text-black" title="انستجرام"><Instagram size={18} /></a>
                <a href="#" className="text-zinc-400 hover:text-black" title="تويتر"><Twitter size={18} /></a>
                <a href="#" className="text-zinc-400 hover:text-black" title="تواصل معنا"><MessageSquare size={18} /></a>
            </div>
          </div>
          
          <div className="hidden md:block text-center md:text-right">
            <h5 className="text-xs md:text-sm font-black uppercase text-zinc-400 mb-4 md:mb-6">القائمة</h5>
            <ul className="space-y-2 md:space-y-3 text-xs md:text-sm font-normal uppercase tracking-widest">
              <li><a href="#" className="hover:text-[var(--theme-primary)]">الرئيسية</a></li>
              <li><a href="#" className="hover:text-[var(--theme-primary)]">من نحن</a></li>
              <li><a href="#" className="hover:text-[var(--theme-primary)]">المتجر</a></li>
              <li><a href="#" className="hover:text-[var(--theme-primary)]">العروض</a></li>
            </ul>
          </div>

          <div className="hidden md:block text-center md:text-right">
            <h5 className="text-xs md:text-sm font-black uppercase text-zinc-400 mb-4 md:mb-6">روابط سريعة</h5>
            <ul className="space-y-2 md:space-y-3 text-xs md:text-sm font-normal uppercase tracking-widest">
              <li><a href="#" className="hover:text-[var(--theme-primary)]">السلة</a></li>
              <li><a href="#" className="hover:text-[var(--theme-primary)]">المفضلة</a></li>
              <li><a href="#" className="hover:text-[var(--theme-primary)]">حسابي</a></li>
              <li><a href="#" className="hover:text-[var(--theme-primary)]">سياسة الخصوصية</a></li>
            </ul>
          </div>

          <div className="hidden md:block text-center md:text-right">
            <h5 className="text-xs md:text-sm font-black uppercase text-zinc-400 mb-4 md:mb-6">تابعنا</h5>
            <ul className="space-y-2 md:space-y-3 text-xs md:text-sm font-normal uppercase tracking-widest flex flex-col items-center md:items-start">
              <li className="flex items-center gap-2"><Instagram size={14} /> <a href="#" className="hover:text-[var(--theme-primary)]">Instagram</a></li>
              <li className="flex items-center gap-2"><Twitter size={14} /> <a href="#" className="hover:text-[var(--theme-primary)]">Twitter</a></li>
              <li className="flex items-center gap-2"><Facebook size={14} /> <a href="#" className="hover:text-[var(--theme-primary)]">Telegram</a></li>
              <li className="flex items-center gap-2"><MessageSquare size={14} /> <a href="#" className="hover:text-[var(--theme-primary)]">WhatsApp</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-6 md:mt-20 pt-6 md:pt-10 border-t text-center text-zinc-400 text-[10px] md:text-xs font-normal uppercase tracking-widest" dir="ltr">
          Copyright © KHUYOOT. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
};

export default MontLandingPage;
