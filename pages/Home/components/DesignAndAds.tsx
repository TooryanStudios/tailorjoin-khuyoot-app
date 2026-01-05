import React, { useEffect, useState } from 'react';
import { Sparkles, ArrowLeft, ArrowUpLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';
import type { Advertisement } from '../../../services/advertisementService';
import { useHomeAdvertisements } from '../../../src/hooks/useHomeData';

export const DesignSection: React.FC = () => {
  const navigate = useNavigate();
  const { appSettings, user } = useApp();
  
  // استخدام الصورة من إعدادات الصفحة الرئيسية إذا كانت موجودة
  const designImage = appSettings.homePageSettings?.bannerImages?.design;
  
  const showImagePath = () => {
    if (designImage) {
      window.open(designImage, '_blank');
    }
  };

  // إذا كانت هناك صورة مخصصة، اعرضها مع overlay
  if (designImage) {
    return (
      <div 
        onClick={() => navigate('/designer')}
        className="bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 relative overflow-hidden group cursor-pointer shadow-sm hover:shadow-md transition-all h-[160px]"
      >
        <img 
          src={designImage} 
          alt="Design Section" 
          className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
          loading="eager"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 flex flex-col justify-end">
          {user?.role === 'admin' && (
            <button
              onClick={(e) => { e.stopPropagation(); showImagePath(); }}
              className="absolute top-2 left-2 bg-red-500 text-white text-xs px-3 py-1 rounded-md hover:bg-red-600 transition-colors font-mono shadow-lg z-10"
              title="عرض مسار الصورة"
            >
              Debug
            </button>
          )}
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-white font-black text-lg">صمّم تشكيلة خاصة</h3>
            <Sparkles className="text-amber-400 animate-pulse" size={18} />
          </div>
          <span className="text-blue-300 text-xs font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
            ابدأ التصميم الآن <ArrowLeft size={14} />
          </span>
        </div>
      </div>
    );
  }
  
  // التصميم الافتراضي بدون صورة
  return (
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
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
    </div>
  );
};

export const AdsSection: React.FC = () => {
  const { appSettings, user } = useApp();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  
  // ✅ Use cache-first React Query hook for ads
  const { data: ads = [], isPending } = useHomeAdvertisements('homepage_main');
  const [currentAd, setCurrentAd] = useState<Advertisement | null>(ads[0] || null);
  
  // Update current ad when ads data changes
  useEffect(() => {
    if (ads.length > 0 && !currentAd) {
      console.log('🎯 Homepage ads loaded:', ads.length, ads);
      setCurrentAd(ads[0]);
    }
  }, [ads, currentAd]);

  // تسجيل المشاهدة عند تحميل الإعلان
  useEffect(() => {
    if (currentAd && !hasTrackedView) {
      console.log('👁️ Ad view tracked:', currentAd.title, currentAd.id);
      void import('../../../services/advertisementService').then(({ incrementAdViews }) => {
        incrementAdViews(currentAd.id);
      });
      setHasTrackedView(true);
    }
  }, [currentAd, hasTrackedView]);

  // التبديل بين الإعلانات تلقائياً (فقط إذا لم يكن الإعلان مثبتاً)
  useEffect(() => {
    if (ads.length <= 1 || currentAd?.isPinned) return;

    const duration = currentAd?.displayDuration || 5;
    console.log(`⏱️ Next ad in ${duration} seconds...`);
    const timer = setTimeout(() => {
      const nextIndex = (currentIndex + 1) % ads.length;
      console.log('🔄 Switching to next ad:', nextIndex, ads[nextIndex].title);
      setCurrentIndex(nextIndex);
      setCurrentAd(ads[nextIndex]);
      setHasTrackedView(false); // لتسجيل مشاهدة جديدة
    }, duration * 1000);

    return () => clearTimeout(timer);
  }, [currentIndex, ads, currentAd]);

  // معالجة النقر على الإعلان
  const handleAdClick = () => {
    if (currentAd) {
      console.log('🖱️ Ad clicked:', { shopId: currentAd.shopId, shopType: currentAd.shopType, shopName: currentAd.shopName });
      void import('../../../services/advertisementService').then(({ incrementAdClicks }) => {
        incrementAdClicks(currentAd.id);
      });
      
      // التوجه إلى صفحة المحل حسب النوع
      if (currentAd.shopType === 'tailor') {
        console.log('→ Navigating to tailor:', `/tailor/${currentAd.shopId}`);
        navigate(`/tailor/${currentAd.shopId}`);
      } else if (currentAd.shopType === 'boutique') {
        console.log('→ Navigating to boutique:', `/boutique/${currentAd.shopId}`);
        navigate(`/boutique/${currentAd.shopId}`);
      } else if (currentAd.shopType === 'fabric_store') {
        console.log('→ Navigating to shop:', `/shop/${currentAd.shopId}`);
        navigate(`/shop/${currentAd.shopId}`);
      } else {
        console.log('→ Navigating to shop (default):', `/shop/${currentAd.shopId}`);
        navigate(`/shop/${currentAd.shopId}`);
      }
    }
  };

  const showImagePath = () => {
    const imageToShow = currentAd?.image || appSettings.homePageSettings?.bannerImages?.ads;
    if (imageToShow) {
      window.open(imageToShow, '_blank');
    }
  };
  
  // إذا لم يكن هناك إعلانات نشطة، استخدم الصورة من الإعدادات أو الافتراضية
  const fallbackImage = appSettings.homePageSettings?.bannerImages?.ads || "https://picsum.photos/600/400?random=fabric";
  
  // Show skeleton while loading and no cached data
  if (isPending && ads.length === 0) {
    return (
      <div className="bg-slate-200 dark:bg-slate-800 rounded-2xl h-[160px] animate-pulse" />
    );
  }
  
  return (
    <div 
      onClick={currentAd ? handleAdClick : undefined}
      className="bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 relative overflow-hidden group cursor-pointer shadow-sm h-[160px]"
    >
      <img 
        src={currentAd?.image || fallbackImage} 
        alt={currentAd?.title || "Ad"} 
        className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
        loading="eager"
        decoding="async"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 flex flex-col justify-end">
        {user?.role === 'admin' && (
          <button
            onClick={(e) => { e.stopPropagation(); showImagePath(); }}
            className="absolute top-2 right-2 bg-red-500 text-white text-xs px-3 py-1 rounded-md hover:bg-red-600 transition-colors font-mono shadow-lg z-10"
            title="عرض مسار الصورة"
          >
            Debug
          </button>
        )}
        
        {/* شارة "إعلان" */}
        <div className="absolute top-2 left-2 flex gap-2">
          <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-lg">
            إعلان
          </span>
          {currentAd?.isPinned && (
            <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-lg">
              مثبت
            </span>
          )}
        </div>

        {/* محتوى الإعلان */}
        <div className="space-y-1">
          <h3 className="text-white font-bold text-sm line-clamp-1">
            {currentAd?.title || 'أقمشة إيطالية فاخرة'}
          </h3>
          <p className="text-slate-200 text-xs line-clamp-1">
            {currentAd?.description || 'احصل على أفضل الأقمشة الإيطالية بأسعار منافسة'}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-blue-300 text-xs font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
              {currentAd?.buttonText || 'تسوق الآن'} <ArrowLeft size={12} />
            </span>
            
            {/* مؤشر الإعلانات المتعددة - فقط إذا لم يكن مثبتاً */}
            {ads.length > 1 && !currentAd?.isPinned && (
              <div className="flex gap-1">
                {ads.map((_, index) => (
                  <div
                    key={index}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      index === currentIndex
                        ? 'bg-white w-4'
                        : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Component wrapper for backward compatibility
export const DesignAndAds: React.FC = () => {
  return (
    <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      <DesignSection />
      <AdsSection />
    </div>
  );
};
