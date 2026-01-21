import React from 'react';
import { useOutletContext } from 'react-router-dom';
import type { DemoShellOutletContext } from './DemoShellLayout';
import { TailorCard, RegionSection, tailorsByRegion } from './DemoShellTopTailors';
import type { Tailor } from '../../../types';

export function DemoShellTopTailorsDesktop() {
  const { tailors: contextTailors, regions } = useOutletContext<DemoShellOutletContext>();

  const tailorsData = contextTailors && contextTailors.length > 0 
    ? contextTailors 
    : [];

  const groupedByRegion = React.useMemo(() => {
    if (!tailorsData.length) return [];

    const grouped = new Map<string, { regionName: string; tailors: Tailor[] }>();
    
    tailorsData.forEach((tailor) => {
      const regionId = tailor.region || 'unknown';
      const region = regions?.find((r) => r.id === regionId);
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
  }, [tailorsData, regions]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950/20 p-6 pb-24">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">أفضل الخياطين</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            اكتشف أمهر الخياطين في منطقتك واحجز موعدك الآن
          </p>
        </header>

        {groupedByRegion.length > 0 ? (
          <div className="space-y-6">
            {groupedByRegion.map((region) => (
              <RegionSection
                key={region.regionId}
                regionId={region.regionId}
                regionName={region.regionName}
                tailors={region.tailors}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="rounded-2xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-950/20 p-6">
              <h2 className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                جارٍ تحميل الخياطين...
              </h2>
              <p className="mt-2 text-sm text-purple-700 dark:text-purple-300">
                نعمل على جلب أفضل الخياطين في منطقتك. فيما يلي بعض الأمثلة من شبكتنا:
              </p>
            </div>

            {tailorsByRegion.map((regionData, idx) => (
              <section
                key={idx}
                className="space-y-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 p-5"
              >
                <div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                      {regionData.region}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {regionData.description}
                    </p>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-400 md:mt-0">
                    <span className="rounded-full bg-white/80 dark:bg-slate-900 px-3 py-1 font-semibold">
                      {regionData.stats.turnaround}
                    </span>
                    <span className="rounded-full bg-white/80 dark:bg-slate-900 px-3 py-1 font-semibold">
                      خبرة: {regionData.stats.experience}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 rounded-xl bg-white/50 dark:bg-slate-900/30 p-4">
                  <h3 className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                    التخصصات
                  </h3>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    {regionData.stats.specialties}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {regionData.tailors.map((tailorInfo, tailorIdx) => (
                    <article
                      key={tailorIdx}
                      className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm dark:shadow-none transition hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-700"
                    >
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                            {tailorInfo.name}
                          </h4>
                          <p className="mt-1 text-xs text-purple-600 dark:text-purple-400">
                            {tailorInfo.address}
                          </p>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {tailorInfo.specialty}
                        </p>

                        <div className="flex items-center gap-2 pt-2">
                          <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                            ⭐ {tailorInfo.rating}
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
