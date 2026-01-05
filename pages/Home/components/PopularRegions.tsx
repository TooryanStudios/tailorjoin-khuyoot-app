import React from 'react';
import { Compass } from 'lucide-react';
import { usePopularRegions } from '../../../src/hooks/useHomeData';

interface PopularRegionsProps {
  onRegionSelect: (region: string | null) => void;
  selectedRegion: string | null;
  maxRegions?: number;
}

export const PopularRegions: React.FC<PopularRegionsProps> = ({ 
  onRegionSelect, 
  selectedRegion, 
  maxRegions = 8 
}) => {
  const { data: regions = [], isPending } = usePopularRegions(maxRegions);

  const emojiFor = (name: string) => {
    const map: Record<string, string> = {
      'البريمي': '🕌', 'نزوى': '🏰', 'بركاء': '🌊', 'السيب': '🎣',
      'صحار': '⚓', 'صلالة': '🌴', 'مسقط': '🏙️', 'إزكي': '🏺',
      'القابل': '🏜️', 'منح': '🦌', 'قريات': '⛵', 'مطرح': '🛶',
    };
    return map[name] || '📍';
  };

  if (isPending && regions.length === 0) {
    return <div className="h-28 w-full bg-slate-100 dark:bg-slate-800 animate-pulse mb-8" />;
  }
  if (regions.length === 0) return null;

  return (
    <div className="mb-10 w-full dir-rtl">
      {/* Title */}
      <div className="px-5 mb-4 flex items-center justify-between">
         <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Compass size={20} className="text-indigo-600" />
            استكشف المناطق
         </h2>
      </div>

      <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 px-5 pb-6 -mx-0 scrollbar-hide">
        
        {/* All Regions Card */}
        <button
          onClick={() => onRegionSelect(null)}
          className={`snap-start shrink-0 relative w-24 h-28 rounded-2xl transition-all duration-300 group flex flex-col items-center justify-center gap-2 border ${
            selectedRegion === null 
            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none scale-105' 
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300'
          }`}
        >
          <span className="text-3xl filter drop-shadow-sm">🇴🇲</span>
          <span className="text-xs font-bold">الكل</span>
        </button>

        {/* Region Cards */}
        {regions.map((region) => {
           const isSelected = selectedRegion === region.name;
           return (
            <button
              key={region.id}
              onClick={() => onRegionSelect(region.name)}
              className={`snap-start shrink-0 relative w-24 h-28 rounded-2xl transition-all duration-300 group flex flex-col items-center justify-center gap-2 border ${
                isSelected
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none scale-105' 
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300'
              }`}
            >
              {/* Subtle background circle for emoji */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-1 ${
                  isSelected ? 'bg-white/10' : 'bg-slate-50 dark:bg-slate-700'
              }`}>
                  {emojiFor(region.name)}
              </div>
              
              <span className="text-xs font-bold truncate max-w-[90%]">
                {region.name}
              </span>
            </button>
           );
        })}
      </div>
    </div>
  );
};