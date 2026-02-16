import React from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { MapPin, Star, User, Heart, MessageCircle, Eye } from 'lucide-react';
import type { DemoShellOutletContext } from './DemoShellLayout';
import { useThumbnail } from '../../hooks/useThumbnailCache';
import type { Tailor } from '../../../types';

const TailorCard = React.memo(function TailorCard({ tailor, regionName }: { tailor: Tailor; regionName?: string }) {
  const navigate = useNavigate();
  const displaySrc = useThumbnail(tailor.image || null, { maxEntries: 100 });

  return (
    <article 
      onClick={() => navigate(`/tailor/${tailor.id}`)}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-purple-900/40 to-zinc-900 cursor-pointer"
    >
      {/* Hero Image */}
      <div className="relative h-[400px] w-full">
        {displaySrc ? (
          <img
            src={displaySrc}
            alt={tailor.name}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-800 via-purple-900 to-zinc-900">
            <User className="h-32 w-32 text-purple-300/30" />
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        
        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
          {/* Tailor Name */}
          <h2 className="text-3xl font-bold text-white leading-tight">
            {tailor.name}
          </h2>
          
          {/* Author/Region */}
          {regionName && (
            <p className="text-sm text-purple-200">
              {regionName}
            </p>
          )}
          
          {/* Tags/Specializations */}
          <div className="flex flex-wrap gap-2">
            {tailor.specialization && (
              <span className="px-3 py-1.5 rounded-full bg-purple-500/30 backdrop-blur-sm border border-purple-300/20 text-xs text-white font-medium">
                {tailor.specialization === 'male' ? 'تفصيل رجالي' : tailor.specialization === 'female' ? 'تفصيل نسائي' : tailor.specialization}
              </span>
            )}
            {tailor.experience && (
              <span className="px-3 py-1.5 rounded-full bg-purple-500/30 backdrop-blur-sm border border-purple-300/20 text-xs text-white font-medium">
                خبرة {tailor.experience}
              </span>
            )}
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-purple-100">
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{tailor.rating?.toFixed(1) || '5.0'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              <span>{Math.floor(Math.random() * 500 + 100)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Heart className="h-4 w-4" />
              <span>{Math.floor(Math.random() * 200 + 50)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Description */}
      <div className="p-6 space-y-4">
        {tailor.bio && (
          <p className="text-sm text-zinc-300 leading-relaxed line-clamp-3">
            {tailor.bio}
          </p>
        )}
        
        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/tailor/${tailor.id}`);
            }}
            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-full border border-purple-300/30 bg-transparent text-purple-200 font-semibold text-sm hover:bg-purple-500/10 transition"
          >
            <MessageCircle className="h-4 w-4" />
            التفاصيل
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/tailor/${tailor.id}`);
            }}
            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-full bg-purple-600 text-white font-semibold text-sm hover:bg-purple-500 transition"
          >
            <User className="h-4 w-4" />
            احجز الآن
          </button>
        </div>
      </div>
    </article>
  );
});

export function DemoShellTopTailorsMobile() {
  const { dbTailors, dbRegions } = useOutletContext<DemoShellOutletContext>();
  const navigate = useNavigate();

  const tailorsData = (dbTailors || []) as Tailor[];
  const regionsData = (dbRegions || []) as any[];

  const getRegionName = (tailor: Tailor) => {
    const region = regionsData.find(r => r.id === (tailor as any).regionId);
    return region?.name || tailor.location || '';
  };

  const groupedByRegion = React.useMemo(() => {
    if (!tailorsData.length) return [];

    const grouped = new Map<string, { regionName: string; tailors: Tailor[] }>();
    
    tailorsData.forEach((tailor) => {
      const regionId = (tailor as any).regionId || 'unknown';
      const region = regionsData.find((r) => r.id === regionId);
      const regionName = region?.name || tailor.location || 'منطقة غير محددة';

      if (!grouped.has(regionId)) {
        grouped.set(regionId, { regionName, tailors: [] });
      }
      grouped.get(regionId)!.tailors.push(tailor);
    });

    return Array.from(grouped.entries()).map(([regionId, data]) => ({
      regionId,
      regionName: data.regionName,
      tailors: data.tailors,
    }));
  }, [tailorsData, regionsData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950/20 p-3 pb-24">
      <div className="mx-auto max-w-6xl space-y-4">
        <header className="space-y-1">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">أفضل الخياطين</h1>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            اكتشف أمهر الخياطين في منطقتك
          </p>
        </header>

        {groupedByRegion.length > 0 ? (
          <div className="space-y-5">
            {groupedByRegion.map((region) => (
              <section key={region.regionId} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                      {region.regionName}
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {region.tailors.length} {region.tailors.length === 1 ? 'خياط' : 'خياطين'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {region.tailors.map((tailor) => (
                    <TailorCard
                      key={tailor.id}
                      tailor={tailor}
                      regionName={region.regionName}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-950/20 p-4">
              <h2 className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                جارٍ التحميل...
              </h2>
              <p className="mt-1 text-xs text-purple-700 dark:text-purple-300">
                نعمل على جلب أفضل الخياطين في منطقتك
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
