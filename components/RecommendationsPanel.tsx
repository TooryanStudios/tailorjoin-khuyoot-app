import React, { useEffect, useState } from 'react';
import { Sparkles, TrendingUp, Star, ShoppingCart } from 'lucide-react';
import { DesignRecommendation, DesignOption } from '../types';
import { getRecommendations } from '../services/recommendationService';

interface RecommendationsPanelProps {
  itemId: string;
  itemType: 'fabric' | 'option';
  title?: string;
  onRecommendationClick?: (recommendedItemId: string, itemType: 'fabric' | 'option', allRecommendedIds?: string[]) => void;
  maxItems?: number;
  resolveItemDetails?: (id: string) => { name: string; imageUrl?: string } | undefined;
  selectedItems?: string[]; // IDs of selected items
}

export const RecommendationsPanel: React.FC<RecommendationsPanelProps> = ({
  itemId,
  itemType,
  title = 'العملاء يفضلون معه',
  onRecommendationClick,
  maxItems = 3,
  resolveItemDetails,
  selectedItems = []
}) => {
  const [recommendations, setRecommendations] = useState<DesignRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (itemId) {
      loadRecommendations();
    }
  }, [itemId, itemType]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const recs = await getRecommendations(itemId, itemType, maxItems);
      setRecommendations(recs);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (rec: DesignRecommendation) => {
    const allIds = recommendations.map(r => r.recommendedItemId);
    onRecommendationClick?.(rec.recommendedItemId, rec.recommendedItemType, allIds);
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 border border-indigo-100 dark:border-slate-600">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={18} className="text-indigo-600 dark:text-indigo-400 animate-pulse" />
          <h4 className="font-bold text-slate-800 dark:text-white text-sm">{title}</h4>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex-1 h-20 bg-white/50 dark:bg-slate-900/50 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 border border-indigo-100 dark:border-slate-600">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-indigo-600 dark:text-indigo-400" />
          <h4 className="font-bold text-slate-800 dark:text-white text-sm">{title}</h4>
        </div>
        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
          <TrendingUp size={12} className="inline mr-1" />
          الأكثر شيوعاً
        </span>
      </div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-3 gap-2 pointer-events-auto">
        {recommendations.map((rec) => {
          const details = resolveItemDetails?.(rec.recommendedItemId);
          const isSelected = selectedItems.includes(rec.recommendedItemId);
          
          return (
          <button
            key={rec.id}
            onClick={(e) => {
              e.stopPropagation();
              handleClick(rec);
            }}
            className={`group bg-white dark:bg-slate-900 rounded-lg p-3 border-2 transition-all cursor-pointer pointer-events-auto active:scale-95 relative ${
              isSelected 
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-lg' 
                : 'border-slate-200 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md'
            }`}
          >
            {/* Checkmark Badge */}
            {isSelected && (
              <div className="absolute top-1 left-1 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center z-10">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            )}
            
            {/* Recommendation Item Preview */}
            <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 rounded-md mb-2 flex items-center justify-center overflow-hidden">
              {details?.imageUrl ? (
                <img src={details.imageUrl} alt={details.name} className="w-full h-full object-cover" />
              ) : (
                rec.recommendedItemType === 'fabric' ? (
                  <div className="text-2xl">🧵</div>
                ) : (
                  <div className="text-2xl">✨</div>
                )
              )}
            </div>

            {/* Score Badge */}
            <div className="flex items-center justify-center gap-1 text-xs">
              <Star size={10} className="text-amber-500 fill-amber-500" />
              <span className="font-bold text-slate-600 dark:text-slate-300">
                {rec.score > 100 ? '100+' : rec.score}
              </span>
            </div>

            {/* Type Label */}
            <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 text-center truncate">
              {details?.name || (rec.recommendedItemType === 'fabric' ? 'قماش' : 'خيار')}
            </div>

            {/* Hover Effect */}
            <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center gap-1">
                <ShoppingCart size={10} />
                إضافة
              </div>
            </div>
          </button>
        );
        })}
      </div>

      {/* Info Footer */}
      <div className="mt-3 pt-3 border-t border-indigo-100 dark:border-slate-600">
        <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center">
          بناءً على اختيارات {recommendations[0]?.score || 0}+ عميل
        </p>
      </div>
    </div>
  );
};

// Compact version for inline recommendations
export const InlineRecommendation: React.FC<{
  recommendation: DesignRecommendation;
  onClick?: () => void;
}> = ({ recommendation, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-300 dark:border-purple-700 rounded-full text-xs font-medium text-purple-700 dark:text-purple-300 hover:from-purple-500/20 hover:to-indigo-500/20 transition-all"
    >
      <Sparkles size={12} />
      <span>اقتراح شائع</span>
      <Star size={10} className="text-amber-500 fill-amber-500" />
      <span className="font-bold">{recommendation.score}</span>
    </button>
  );
};

// Bundle Suggestion (for checkout/cart)
export const BundleSuggestion: React.FC<{
  recommendations: DesignRecommendation[];
  onAddBundle?: (recommendedIds: string[]) => void;
}> = ({ recommendations, onAddBundle }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (recommendations.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border-2 border-green-200 dark:border-green-700">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-bold text-green-800 dark:text-green-300 flex items-center gap-2">
            <ShoppingCart size={18} />
            اكتمل التصميم بـ
          </h4>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            وفر {Math.round(recommendations.length * 5)}% بإضافة هذه العناصر
          </p>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-green-600 dark:text-green-400 text-sm font-bold hover:underline"
        >
          {isExpanded ? 'إخفاء' : 'عرض'}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-2 mb-3">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-lg"
            >
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded flex items-center justify-center text-xl">
                {rec.recommendedItemType === 'fabric' ? '🧵' : '✨'}
              </div>
              <div className="flex-1 text-right">
                <p className="text-sm font-medium text-slate-800 dark:text-white">
                  {rec.recommendedItemType === 'fabric' ? 'قماش مميز' : 'خيار شائع'}
                </p>
                <p className="text-xs text-slate-500">
                  {rec.score} عميل اختاروه معك
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => onAddBundle?.(recommendations.map((r) => r.recommendedItemId))}
        className="w-full py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
      >
        <ShoppingCart size={16} />
        إضافة الكل ({recommendations.length} عناصر)
      </button>
    </div>
  );
};
