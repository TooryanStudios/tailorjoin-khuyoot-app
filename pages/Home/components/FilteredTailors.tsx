import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, MapPin, ArrowUpRight, ChevronLeft } from 'lucide-react';
import { Tailor, SHOP_TYPE_LABELS, TAILOR_GENDER_LABELS } from '../../../types';
import { firebaseService } from '../../../services/firebase';
import { useApp } from '../../../context/AppContext';

interface FilteredTailorsProps {
  region: string | null;
}

export const FilteredTailors: React.FC<FilteredTailorsProps> = ({ region }) => {
  const navigate = useNavigate();
  const { appSettings } = useApp();
  const [tailors, setTailors] = useState<Tailor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTailors();
  }, [region]);

  const loadTailors = async () => {
    setLoading(true);
    try {
      if (region) {
        const maxTailors = appSettings.homePageSettings?.filteredTailorsByRegionCount || 8;
        const data = await firebaseService.getTailorsByRegion(region, maxTailors);
        setTailors(data);
      } else {
        // Try to get featured tailors first, fallback to all approved if none featured
        let data = await firebaseService.getFeaturedTailors();
        if (data.length === 0) {
          // No featured tailors, show all approved tailors instead
          data = await firebaseService.getApprovedTailors();
        }
        setTailors(data);
      }
    } catch (error) {
      console.error('❌ Error loading tailors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAll = () => {
    navigate(region ? `/tailors?region=${encodeURIComponent(region)}` : '/tailors');
  };

  // Skeleton Loading (Portrait aspect ratio)
  if (loading) {
    return (
      <div className="mb-8 px-4 w-full">
        <div className="flex justify-between items-center mb-4">
          <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="shrink-0 w-[180px] h-[240px] bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (tailors.length === 0 && !region) return null;

  // Empty State
  if (tailors.length === 0 && region) {
    return (
        <div className="text-center p-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl mx-4 mb-8">
            <p className="text-slate-500">لا يوجد خياطين في {region}</p>
        </div>
    );
  }

  return (
    <div className="mb-10 w-full dir-rtl">
      {/* Header */}
      <div className="flex items-center justify-between px-5 mb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {region ? `خياطين في ${region}` : 'خياطين معتمدين'}
        </h2>
        <button 
          onClick={handleViewAll}
          className="text-sm font-bold text-blue-600 dark:text-blue-400"
        >
          المزيد
        </button>
      </div>

      {/* Horizontal Scroll - Taller Cards */}
      <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 px-5 pb-6 -mx-0 scrollbar-hide">
        {tailors.map((tailor) => (
          <div
            key={tailor.id}
            onClick={() => navigate(`/tailor/${tailor.id}`)}
            className="snap-center shrink-0 w-[200px] h-[260px] relative rounded-2xl overflow-hidden cursor-pointer group shadow-md"
          >
            {/* Background Image */}
            {tailor.image ? (
              <img
                src={tailor.image}
                alt={tailor.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              <div className="absolute inset-0 bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-4xl">🧵</div>
            )}

            {/* Gradient Overlay - Crucial for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

            {/* Top Badge (Rating) */}
            <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md border border-white/30 px-2 py-1 rounded-lg flex items-center gap-1">
              <span className="text-xs font-bold text-white">{tailor.rating?.toFixed(1) || '4.5'}</span>
              <Star size={10} className="text-amber-400 fill-current" />
            </div>

            {/* Content at Bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-4 text-right">
              
              {/* Category Tag - Dynamic based on tailorGender or shopType */}
              <span className="inline-block px-2 py-0.5 rounded-md bg-blue-600/80 text-[10px] text-white font-medium mb-1.5 backdrop-blur-sm">
                {tailor.tailorGender 
                  ? TAILOR_GENDER_LABELS[tailor.tailorGender as 'male' | 'female'] 
                  : 'خياط'}
              </span>

              {/* Name */}
              <h3 className="font-bold text-lg text-white leading-tight truncate mb-1">
                {tailor.name}
              </h3>

              {/* Location */}
              <div className="flex items-center gap-1 text-slate-300 text-xs">
                <MapPin size={12} />
                <span className="truncate">{region || 'مسقط، عمان'}</span>
              </div>
            </div>

            {/* Hover Effect: Arrow Icon appears */}
            <div className="absolute top-3 left-3 w-8 h-8 bg-white rounded-full items-center justify-center hidden group-hover:flex shadow-lg transition-all animate-in fade-in zoom-in">
                <ArrowUpRight size={16} className="text-black" />
            </div>
          </div>
        ))}
        
        {/* "See All" Vertical Card */}
        <div 
            onClick={handleViewAll}
            className="snap-center shrink-0 w-[100px] h-[260px] flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 cursor-pointer hover:bg-slate-200"
        >
            <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center mb-3 text-blue-600">
                <ChevronLeft size={24} />
            </div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">الكل</span>
        </div>
      </div>
    </div>
  );
};