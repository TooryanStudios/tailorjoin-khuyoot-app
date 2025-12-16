import React from 'react';
import { Star, MapPin, ChevronLeft, Heart, Clock, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Shop } from '../../../types';

interface FabricStoresSectionProps {
  stores: Shop[];
}

export const FabricStoresSection: React.FC<FabricStoresSectionProps> = ({ stores }) => {
  const navigate = useNavigate();

  if (stores.length === 0) return null;

  return (
    <div className="mb-10 w-full dir-rtl">
      {/* --- Section Header --- */}
      <div className="flex items-center justify-between px-5 mb-4">
        <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
            أشهر محلات الأقمشة
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            تشكيلة واسعة من الأقمشة الفاخرة
            </p>
        </div>
        
        <button
          onClick={() => navigate('/shops?type=fabric_store')}
          className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:opacity-80 transition-opacity"
        >
          عرض الكل
        </button>
      </div>

      {/* --- Horizontal Scroll Carousel --- */}
      <div className="flex overflow-x-auto snap-x snap-mandatory gap-1 md:gap-2 px-5 pb-8 -mx-0 scrollbar-hide">
        {stores.map((store) => (
          <div
            key={store.id}
            onClick={() => navigate(`/shop/${store.id}`)}
            className="snap-start shrink-0 w-[260px] md:w-[280px] group cursor-pointer rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow p-3"
          >
            {/* 1. Image Container (Immersive) */}
            <div className="relative h-[160px] mb-3">
              {/* Main Cover Image */}
              <div className="w-full h-full rounded-2xl overflow-hidden">
                {store.image ? (
                  <img
                    src={store.image}
                    alt={store.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                    <Store className="w-10 h-10 text-slate-300 dark:text-slate-500" />
                  </div>
                )}
                {/* Gradient Overlay for depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
              </div>

              {/* Floating Favorite Button (Top Left) */}
              <button className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors shadow-sm">
                <Heart size={16} />
              </button>

              {/* Overlapping Logo Box (Bottom Right) */}
              <div className="absolute -bottom-2 right-3 w-12 h-12 rounded-xl bg-white dark:bg-slate-800 shadow-md p-1 border border-slate-50 dark:border-slate-700 z-10">
                {store.image ? (
                  <img
                    src={store.image}
                    alt="logo"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-full bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                    <Store size={18} className="text-indigo-500" />
                  </div>
                )}
              </div>
            </div>

            {/* 2. Content Section */}
            <div className="px-2 pt-2 text-right">
              {/* Title & Rating Row */}
              <div className="flex justify-between items-start mb-1 pl-1">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate max-w-[70%] leading-tight mt-1">
                  {store.name}
                </h3>
                
                {/* Rating Badge */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/50 px-1.5 py-1 rounded-md shrink-0 mt-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {store.rating || '4.8'}
                    </span>
                    <Star size={10} className="text-amber-500 fill-current" />
                </div>
              </div>

              {/* Subtitle / Categories */}
              <p className="text-sm text-slate-500 dark:text-slate-400 truncate mb-2.5">
                {store.specialization || 'أقمشة فاخرة • خياطة رجالية • مستلزمات'}
              </p>

              {/* Metadata Footer (Location & Time/Status) */}
              <div className="flex items-center gap-3 text-xs font-medium border-t border-slate-100 dark:border-slate-700/50 pt-2.5">
                <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-full">
                    <Clock size={12} />
                    <span>مفتوح الآن</span>
                </div>
                
                <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
                    <MapPin size={12} />
                    <span className="truncate max-w-[100px]">
                        {store.location || store.region || 'مسقط'}
                    </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* --- "See All" Card (At the end) --- */}
        <div
          onClick={() => navigate('/shops?type=fabric_store')}
          className="snap-start shrink-0 w-[100px] flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 mb-2">
            <ChevronLeft size={20} />
          </div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            مشاهدة الكل
          </span>
        </div>
      </div>
    </div>
  );
};