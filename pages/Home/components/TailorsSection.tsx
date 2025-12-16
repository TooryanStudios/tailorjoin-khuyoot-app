import React, { useRef, useState, useEffect } from 'react';
import { Star, MapPin, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tailor } from '../../../types';
import { useApp } from '../../../context/AppContext';

interface TailorsSectionProps {
  tailors: Tailor[];
}

export const TailorsSection: React.FC<TailorsSectionProps> = ({ tailors }) => {
  const navigate = useNavigate();
  const { appSettings } = useApp();
  const tailorsScrollRef = useRef<HTMLDivElement>(null);
  const [tailorsScrollable, setTailorsScrollable] = useState(false);
  
  const tailorsTitle = appSettings.siteTexts?.featuredTailorsTitle || 'خياطون مميزون';
  const tailorsSubtitle = appSettings.siteTexts?.featuredTailorsSubtitle || 'أفضل الخياطين المتميزين';

  // Detect if running as installed PWA + on mobile
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const checkTailorsScroll = () => {
    const element = tailorsScrollRef.current;
    if (!element) return;
    const hasOverflow = element.scrollWidth > element.clientWidth + 2;
    setTailorsScrollable(hasOverflow);
  };

  useEffect(() => {
    checkTailorsScroll();
    window.addEventListener('resize', checkTailorsScroll);
    return () => window.removeEventListener('resize', checkTailorsScroll);
  }, [tailors]);

  useEffect(() => {
    const updateDisplayMode = () => {
      if (typeof window === 'undefined') return;

      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;

      const mobile = window.innerWidth < 768;

      setIsStandalone(standalone);
      setIsMobile(mobile);
    };

    updateDisplayMode();
    window.addEventListener('resize', updateDisplayMode);

    return () => {
      window.removeEventListener('resize', updateDisplayMode);
    };
  }, []);

  const hideArrows = isStandalone && isMobile;

  const scrollTailors = (direction: 'left' | 'right') => {
    const element = tailorsScrollRef.current;
    if (!element) return;

    const scrollAmount = element.clientWidth * 0.75;
    const isRTL = getComputedStyle(element).direction === 'rtl';
    const directionFactor = direction === 'right' ? 1 : -1;
    const rtlFactor = isRTL ? -1 : 1;
    const delta = scrollAmount * directionFactor * rtlFactor;

    element.scrollBy({ left: delta, behavior: 'smooth' });
    setTimeout(checkTailorsScroll, 250);
  };

  if (tailors.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white border-r-4 border-amber-500 pr-3">
          {tailorsTitle}
        </h2>
        <button
          onClick={() => navigate('/tailors')}
          className="text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium px-3 py-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors"
        >
          عرض الكل
        </button>
      </div>

      <div className="relative group/tailors">
        {/* Left Arrow */}
        {!hideArrows && (
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
        )}

        {/* Right Arrow */}
        {!hideArrows && (
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
        )}

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
                <img
                  src={tailor.image || '/icons/icon-192.png'}
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (img.src !== window.location.origin + '/icons/icon-192.png') {
                      img.src = '/icons/icon-192.png';
                    }
                  }}
                  alt={tailor.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-slate-100 dark:border-slate-600"
                />
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                    {tailor.name}
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {tailor.specialization}
                  </p>
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
  );
};
