import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';

export const HeroBanner: React.FC = () => {
  const navigate = useNavigate();
  const { appSettings, user } = useApp();
  
  const bannerConfig = appSettings.heroBanner || {};
  // استخدام الصورة من إعدادات الصفحة الرئيسية أولاً، ثم من إعدادات البانر، وأخيراً الصورة الافتراضية
  const imageSrc = appSettings.homePageSettings?.bannerImages?.hero || bannerConfig.image || "https://picsum.photos/1200/500?random=hero";
  const badge = bannerConfig.badge || "موسم مميز";
  const title = bannerConfig.title || "تشكيلة العيد";
  const subtitle = bannerConfig.subtitle || "بين يديك";
  const description = bannerConfig.description || "أرقى التصاميم العمانية والعصرية، مفصلة خصيصاً لك لتناسب ذوقك الرفيع.";
  const buttonText = bannerConfig.buttonText || "استكشف جاكيتات العيد";
  const buttonLink = bannerConfig.buttonLink || "/products";
  
  const showImagePath = () => {
    const img = document.querySelector('.hero-banner-img') as HTMLImageElement;
    const actualSrc = img?.currentSrc || img?.src || imageSrc;
    window.open(actualSrc, '_blank');
  };

  return (
    <div className="mb-8">
      <div className="relative w-full aspect-[3/1] md:aspect-[4/1] lg:aspect-[5/1] rounded-2xl overflow-hidden shadow-2xl group">
        <img 
          src={imageSrc}
          alt="Eid Collection" 
          className="hero-banner-img w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent flex items-center justify-between px-6 md:px-12">
          {user?.role === 'admin' && (
            <button
              onClick={showImagePath}
              className="absolute top-2 left-2 bg-red-500 text-white text-xs px-3 py-1 rounded-md hover:bg-red-600 transition-colors font-mono shadow-lg z-10"
              title="عرض مسار الصورة"
            >
              Debug
            </button>
          )}
          <div className="flex flex-col gap-2">
            <span className="text-amber-400 font-medium text-xs md:text-sm uppercase tracking-wider animate-pulse">
              {badge}
            </span>
            <h2 className="text-2xl md:text-4xl font-bold text-white leading-tight">
              {title} <br/> 
              <span className="text-slate-200 font-light">{subtitle}</span>
            </h2>
            <p className="text-slate-200 text-xs md:text-sm max-w-[280px]">
              {description}
            </p>
          </div>
          
          <button 
            onClick={() => navigate(buttonLink)}
            className="bg-white text-black text-xs md:text-sm font-bold px-4 md:px-6 py-2 md:py-2.5 rounded-full hover:bg-slate-100 transition-colors shadow-lg"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};
