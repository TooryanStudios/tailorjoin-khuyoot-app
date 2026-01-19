
import React, { useEffect, useState, useRef } from 'react';
import { Search, Sparkles, ArrowLeft, Star, MapPin, CheckCircle2, Heart, Plus, ArrowUpLeft, Mail, Phone, ChevronLeft, ChevronRight, Grid, List, Download, Bell } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { Product, Tailor, Story } from '../types';
import { firebaseService } from '../services/firebase';
import { getTailors, getStories } from '../services/mockService';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { requestNotificationPermission, showLocalTestNotification, isNotificationSupported } from '../utils/notifications';

const CATEGORIES = [
  { id: 'all', name: 'الكل' },
  { id: 'dishdasha', name: 'الدشاديش' },
  { id: 'jacket', name: 'الجاكيت' },
  { id: 'abaya', name: 'العبايات' },
  { id: 'kids', name: 'الأطفال' },
  { id: 'shoes', name: 'الأحذية' },
];

const Home = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [tailors, setTailors] = useState<Tailor[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<string>('');
  const navigate = useNavigate();
  const { user, appSettings, settingsLoaded, logout } = useApp();

  // Scroll state for tailors section
  const tailorsScrollRef = useRef<HTMLDivElement>(null);
  const [tailorsScrollable, setTailorsScrollable] = useState(false);

  console.log('🏠 Home rendering, user:', user?.name, 'role:', user?.role);

  useEffect(() => {
    firebaseService.getProducts(activeCategory).then(setProducts);
  }, [activeCategory]);

  useEffect(() => {
    getTailors().then(setTailors);
    // Only load stories after settings are loaded to prevent flickering
    if (settingsLoaded && appSettings.storiesEnabled) {
      getStories().then(setStories);
    }
  }, [appSettings.storiesEnabled, settingsLoaded]);

  // Check scroll position for tailors section
  const checkTailorsScroll = () => {
    const element = tailorsScrollRef.current;
    if (!element) return;

    const hasOverflow = element.scrollWidth > element.clientWidth + 2;
    setTailorsScrollable(hasOverflow);
  };

  // Update scroll arrows when tailors load or window resizes
  useEffect(() => {
    checkTailorsScroll();
    window.addEventListener('resize', checkTailorsScroll);
    return () => window.removeEventListener('resize', checkTailorsScroll);
  }, [tailors]);

  // PWA Install prompt handler
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallButton(false);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    // Check if we have the browser install prompt (Chrome/Edge/Android)
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setShowInstallButton(false);
      }
      
      setDeferredPrompt(null);
      return;
    }

    // For iOS devices - check browser type
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      if (isStandalone) return; // Already installed
      
      // Detect if using Chrome/Firefox/Edge on iOS (not Safari)
      const isSafari = /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent);
      
      if (!isSafari) {
        // User is on Chrome/Firefox/Edge on iOS
        alert('⚠️ يجب استخدام Safari لتثبيت التطبيق\n\nمتصفح Chrome لا يدعم التثبيت على iPhone.\n\n📱 الخطوات:\n1️⃣ افتح التطبيق في Safari\n2️⃣ اضغط زر المشاركة ⬆️\n3️⃣ اختر "إضافة إلى الشاشة الرئيسية"');
      } else {
        // User is on Safari - show instructions
        alert('📱 كيفية إضافة التطبيق للشاشة الرئيسية:\n\n1️⃣ اضغط على زر المشاركة ⬆️ في أسفل المتصفح\n2️⃣ مرر للأسفل واختر "إضافة إلى الشاشة الرئيسية"\n3️⃣ اضغط "إضافة" في الأعلى\n\n✨ ستجد أيقونة التطبيق على شاشتك الرئيسية!');
      }
      return;
    }

    // For other browsers without prompt support
    alert('💡 لتثبيت التطبيق:\n\n• في Chrome: ابحث عن أيقونة التثبيت في شريط العنوان\n• في Safari: استخدم قائمة المشاركة واختر "إضافة إلى الشاشة الرئيسية"');
  };

  // Scroll tailors container
  const scrollTailors = (direction: 'left' | 'right') => {
    const element = tailorsScrollRef.current;
    if (!element) return;

    const scrollAmount = element.clientWidth * 0.75;
    const isRTL = getComputedStyle(element).direction === 'rtl';
    const directionFactor = direction === 'right' ? 1 : -1;
    const rtlFactor = isRTL ? -1 : 1;
    const delta = scrollAmount * directionFactor * rtlFactor;

    element.scrollBy({
      left: delta,
      behavior: 'smooth'
    });

    setTimeout(checkTailorsScroll, 250);
  };

  // Handle notification test
  const handleTestNotification = async () => {
    if (!isNotificationSupported()) {
      setNotificationStatus('❌ التنبيهات غير مدعومة في هذا المتصفح');
      setTimeout(() => setNotificationStatus(''), 3000);
      return;
    }

    const permission = await requestNotificationPermission();
    
    if (permission === 'granted') {
      showLocalTestNotification(
        'خيوط - Khuyoot',
        'تم تفعيل تنبيهات خيوط بنجاح! 🎉'
      );
      setNotificationStatus('✅ تم إرسال التنبيه بنجاح');
      setTimeout(() => setNotificationStatus(''), 3000);
    } else if (permission === 'denied') {
      setNotificationStatus('❌ تم رفض إذن التنبيهات. يرجى تفعيلها من إعدادات المتصفح');
      setTimeout(() => setNotificationStatus(''), 5000);
    } else {
      setNotificationStatus('⚠️ لم يتم منح إذن التنبيهات');
      setTimeout(() => setNotificationStatus(''), 3000);
    }
  };

  // Check if app is installed (running in standalone mode)
  const isInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone === true;

  return (
    <div className="pb-24 px-4 md:px-6 lg:px-8">
      {/* Install PWA Button - Hide when already installed */}
      {!isInstalled && (
        <div className="mb-4 mt-4">
          <button
            onClick={handleInstallClick}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl py-4 px-6 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all"
          >
            <Download size={24} />
            <div className="text-right">
              <div className="font-bold text-lg">أضف التطبيق للشاشة الرئيسية</div>
              <div className="text-xs text-blue-100">للوصول السريع والعمل بدون إنترنت</div>
            </div>
          </button>
        </div>
      )}

      {/* Test Notifications Button */}
      <div className="mb-4 mt-4">
        <button
          onClick={handleTestNotification}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-2xl py-4 px-6 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all"
        >
          <Bell size={24} />
          <div className="text-right">
            <div className="font-bold text-lg">تجربة التنبيهات</div>
            <div className="text-xs text-amber-100">اختبر استلام الإشعارات الفورية</div>
          </div>
        </button>
        {notificationStatus && (
          <div className="mt-2 text-center text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg py-2 px-4">
            {notificationStatus}
          </div>
        )}
      </div>

      {/* 1. Stories Section (Toggleable) */}
      {appSettings.storiesEnabled && stories.length > 0 && (
        <div className="mb-6 mt-4">
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {/* Add Story Button (For Tailors) */}
            {user?.role === 'tailor' && (
              <div className="min-w-[70px] flex flex-col items-center gap-1 cursor-pointer">
                <div className="w-[70px] h-[70px] rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center relative bg-slate-50 dark:bg-slate-800">
                  <Plus size={24} className="text-slate-400" />
                  <div className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-0.5 border-2 border-white dark:border-[#050817]">
                    <Plus size={12} />
                  </div>
                </div>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">قصتي</span>
              </div>
            )}
            
            {/* Stories List */}
            {stories.map((story) => (
              <div key={story.id} className="min-w-[70px] flex flex-col items-center gap-1 cursor-pointer group">
                <div className="relative w-[70px] h-[70px] rounded-full p-0.5 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500">
                  <img src={story.tailorImage} alt={story.tailorName} className="w-full h-full rounded-full object-cover border-2 border-white dark:border-[#050817]" />
                </div>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium truncate max-w-[70px]">{story.tailorName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Search Bar */}
      <div className="py-2 max-w-3xl mx-auto mb-4">
        <div className="relative">
          <input 
            type="text" 
            placeholder="ابحث عن دشداشة، قماش، أو خياط..."
            className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-12 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
          />
          <Search className="absolute top-1/2 -translate-y-1/2 right-4 text-slate-400" size={20} />
        </div>
      </div>

      {/* 3. Hero Banner */}
      <div className="mb-8">
        <div className="relative w-full aspect-[3/1] md:aspect-[4/1] lg:aspect-[5/1] rounded-2xl overflow-hidden shadow-2xl group">
          <img 
            src="https://picsum.photos/1200/500?random=hero" 
            alt="Eid Collection" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent flex items-center justify-between px-6 md:px-12">
            {/* Text Column */}
            <div className="flex flex-col gap-2">
              <span className="text-amber-400 font-medium text-xs md:text-sm uppercase tracking-wider animate-pulse">موسم مميز</span>
              <h2 className="text-2xl md:text-4xl font-bold text-white leading-tight">تشكيلة العيد <br/> <span className="text-slate-200 font-light">بين يديك</span></h2>
              <p className="text-slate-200 text-xs md:text-sm max-w-[280px]">أرقى التصاميم العمانية والعصرية، مفصلة خصيصاً لك لتناسب ذوقك الرفيع.</p>
            </div>
            
            {/* Button Column */}
            <button 
              onClick={() => navigate('/jackets')}
              className="bg-white text-black text-xs md:text-sm font-bold px-4 md:px-6 py-2 md:py-2.5 rounded-full hover:bg-slate-100 transition-colors shadow-lg"
            >
              استكشف جاكيتات العيد
            </button>
          </div>
        </div>
      </div>

      {/* 4. Design Your Collection & Ads Grid */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        
        {/* Design Section */}
        <div 
          onClick={() => navigate('/designer')}
          className="bg-gradient-to-br from-white to-blue-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-center h-[160px]"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">صمّم تشكيلة خاصة</h3>
                <Sparkles className="text-amber-500 animate-pulse" size={18} />
              </div>
              <span className="text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                ابدأ التصميم الآن <ArrowLeft size={14} />
              </span>
            </div>
            
            <div className="hidden sm:flex items-center justify-center w-16 h-16 bg-white dark:bg-slate-800 rounded-full shadow-lg border-2 border-slate-50 dark:border-slate-700 group-hover:scale-110 transition-transform duration-300">
               <ArrowUpLeft size={28} className="text-blue-500" />
            </div>
          </div>
          {/* Decorative blurred blob */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>

        {/* Ad Space */}
        <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 relative overflow-hidden group cursor-pointer shadow-sm h-[160px]">
          <img 
             src="https://picsum.photos/600/400?random=fabric" 
             alt="Ad" 
             className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 flex flex-col justify-end">
             <div className="absolute top-2 left-2 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white border border-white/20">إعلان</div>
             <h4 className="text-white font-bold text-sm leading-tight mb-1">أقمشة إيطالية فاخرة</h4>
             <button className="w-fit bg-white text-slate-900 text-[10px] font-bold px-3 py-1 rounded-full hover:bg-slate-100 transition-colors">
               تسوق الآن
             </button>
          </div>
        </div>

      </div>

      {/* 5. Browse All Shops */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/shops')}
          className="w-full bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white font-bold py-4 rounded-2xl hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
        >
          <span>استعرض جميع المحلات والبوتيكات</span>
          <ArrowLeft size={20} />
        </button>
      </div>

      {/* 6. Featured Tailors */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
           <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white border-r-4 border-amber-500 pr-3">خياطون مميزون</h2>
           <button 
             onClick={() => navigate('/tailors')}
             className="text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium px-3 py-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors"
           >
             عرض الكل
           </button>
        </div>
        
        {/* Scrollable container with arrows */}
        <div className="relative group/tailors">
          {/* Left Arrow */}
          <button
            onClick={() => scrollTailors('right')}
            className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-11 h-11 md:w-12 md:h-12 rounded-full border-2 transition-all duration-200 flex items-center justify-center shadow-xl ${
              tailorsScrollable
                ? 'bg-white dark:bg-slate-800 border-amber-200 dark:border-amber-600 text-amber-600 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:border-amber-400 dark:hover:border-amber-500 hover:scale-110'
                : 'bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-default'
            }`}
            aria-label="Scroll left"
          >
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>

          {/* Right Arrow */}
          <button
            onClick={() => scrollTailors('left')}
            className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-11 h-11 md:w-12 md:h-12 rounded-full border-2 transition-all duration-200 flex items-center justify-center shadow-xl ${
              tailorsScrollable
                ? 'bg-white dark:bg-slate-800 border-amber-200 dark:border-amber-600 text-amber-600 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:border-amber-400 dark:hover:border-amber-500 hover:scale-110'
                : 'bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-default'
            }`}
            aria-label="Scroll right"
          >
            <ChevronRight size={24} strokeWidth={2.5} />
          </button>

          {/* Scrollable tailors list */}
          <div 
            ref={tailorsScrollRef}
            onScroll={checkTailorsScroll}
            className="flex gap-4 overflow-x-auto no-scrollbar pb-2 scroll-smooth"
          >
            {tailors.map((tailor) => (
               <div 
                 key={tailor.id} 
                 onClick={() => navigate(`/tailor/${tailor.id}`)}
                 className="min-w-[280px] bg-white dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:border-amber-400 transition-colors cursor-pointer group"
               >
                 <div className="flex items-center gap-3 mb-4">
                   <img src={tailor.image} alt={tailor.name} className="w-14 h-14 rounded-full object-cover border-2 border-slate-100 dark:border-slate-600" />
                   <div>
                     <h4 className="font-bold text-slate-900 dark:text-white text-base">{tailor.name}</h4>
                     <p className="text-sm text-slate-500 dark:text-slate-400">{tailor.specialization}</p>
                   </div>
                 </div>
                 <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700 pt-2">
                    <div className="flex items-center gap-1">
                      <MapPin size={12} /> {tailor.location}
                    </div>
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star size={12} fill="currentColor" /> {tailor.rating}
                    </div>
                 </div>
                 <div className="mt-2 flex items-center justify-between">
                   <div className="flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400">
                      <CheckCircle2 size={10} />
                      <span>خبرة {tailor.experience}</span>
                   </div>
                   <div className="text-[10px] text-slate-400">
                      {tailor.followers} متابع
                   </div>
                 </div>
               </div>
            ))}
          </div>
        </div>
      </div>

      {/* 7. Categories (Filters) */}
      <div className="mb-8 overflow-x-auto no-scrollbar">
        <div className="flex items-center md:justify-center gap-2 min-w-max pb-2 px-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border ${
                activeCategory === cat.id
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md scale-105'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* 8. New In Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white border-r-4 border-blue-500 pr-3">أحدث الموديلات</h2>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
                aria-label="عرض شبكي"
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
                aria-label="عرض قائمة"
              >
                <List size={18} />
              </button>
            </div>
            <button 
              onClick={() => navigate('/jackets')}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
            >
              عرض الكل
            </button>
          </div>
        </div>
        
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6'
            : 'grid grid-cols-1 gap-4'
        }>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} viewMode={viewMode} />
          ))}
        </div>
      </div>

      {/* Contact Footer Section */}
      <div className="mt-12 mb-8 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">تواصل معنا</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">نحن هنا لخدمتك في أي وقت</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-3">
                <Mail className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-white mb-1">البريد الإلكتروني</h4>
              <a href="mailto:info@khuyoot.om" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
                info@khuyoot.om
              </a>
            </div>

            <div className="flex flex-col items-center text-center p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-3">
                <Phone className="text-emerald-600 dark:text-emerald-400" size={24} />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-white mb-1">الهاتف</h4>
              <a href="tel:+96899999999" className="text-blue-600 dark:text-blue-400 hover:underline text-sm" dir="ltr">
                +968 9999 9999
              </a>
            </div>

            <div className="flex flex-col items-center text-center p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mb-3">
                <MapPin className="text-purple-600 dark:text-purple-400" size={24} />
              </div>
              <h4 className="font-bold text-slate-800 dark:text-white mb-1">الموقع</h4>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                مسقط، سلطنة عُمان
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              © 2025 <span className="font-bold text-blue-600 dark:text-blue-400">خيوط</span> - منصة التفصيل الذكي. جميع الحقوق محفوظة.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
