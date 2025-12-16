import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type TailorItem = {
  id: string;
  name: string;
  avatar?: string;
  rating?: number; // 0-5
};

export const TopRatedTailorsGrid = ({
  title = 'الأعلى تقييماً',
  fetchTailors,
  limit = 8,
}: {
  title?: string;
  fetchTailors?: () => Promise<TailorItem[]>;
  limit?: number;
}) => {
  const [items, setItems] = useState<TailorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        let data: TailorItem[] = [];
        if (fetchTailors) {
          data = await fetchTailors();
        } else {
          // Fallback: try localStorage
          const raw = localStorage.getItem('top_tailors');
          data = raw ? JSON.parse(raw) : [];
        }
        // Sort by rating desc and take limit
        data = Array.isArray(data)
          ? [...data].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, limit)
          : [];
        if (!cancelled) setItems(data);
      } catch (e) {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [fetchTailors, limit]);

  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white">{title}</h3>
      </div>
      {loading ? (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : (
        items.length > 0 ? (
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(`/tailors/${item.id}`)}
                className="flex flex-col items-center justify-center gap-2 w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow"
                aria-label={`فتح صفحة ${item.name}`}
              >
                <div className="relative">
                  {item.profileImage ? (
                    <img
                      src={item.profileImage}
                      alt={item.name}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border border-slate-200 dark:border-slate-600"
                    />
                  ) : (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-200 dark:bg-slate-700" />
                  )}
                  {(item.rating ?? 0) > 0 && (
                    <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[10px] px-1.5 rounded-full">
                      {item.rating?.toFixed(1)}
                    </span>
                  )}
                </div>
                <span className="text-[11px] sm:text-xs font-medium text-slate-700 dark:text-slate-200 truncate max-w-[90px] sm:max-w-[110px]">
                  {item.name}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-500 dark:text-slate-400">لا يوجد خياطون حالياً</div>
        )
      )}
    </section>
  );
};
