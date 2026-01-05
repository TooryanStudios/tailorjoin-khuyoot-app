import React from 'react';
import { Sparkles, Lightbulb } from 'lucide-react';

interface AITipsPanelProps {
  tips: string[];
  isLoading?: boolean;
}

export const AITipsPanel: React.FC<AITipsPanelProps> = ({ tips, isLoading }) => {
  if (isLoading) {
    return (
      <div className="rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
            <Sparkles size={20} className="text-amber-600 dark:text-amber-400 animate-pulse" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            توصيات الذكاء الاصطناعي
          </h3>
        </div>
        
        <div className="space-y-3">
          {[1, 2, 3].map((id) => (
            <div key={`skeleton-${id}`} className="h-4 bg-slate-200/50 dark:bg-slate-700/50 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!tips || tips.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 p-8 text-center">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lightbulb size={28} className="text-slate-400" />
        </div>
        <h3 className="font-bold text-slate-900 dark:text-white mb-2">
          في انتظار التوصيات
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
          سيتم عرض اقتراحات التصميم هنا بعد اختيار القماش والتصميم
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-amber-200 dark:border-amber-900/50 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
          <Sparkles size={20} className="text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            توصيات الذكاء الاصطناعي
          </h3>
          <p className="text-xs text-amber-700 dark:text-amber-400">
            اقتراحات مخصصة لتصميمك
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {tips.map((tip, index) => (
          <div
            key={`tip-${index}-${tip.substring(0, 20)}`}
            className="flex items-start gap-3 p-4 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-amber-100 dark:border-amber-900/30"
          >
            <div className="w-6 h-6 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                {index + 1}
              </span>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed flex-1">
              {tip}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t border-amber-200 dark:border-amber-900/30">
        <p className="text-xs text-amber-700 dark:text-amber-400 text-center">
          💡 هذه التوصيات تساعد الخياط في تنفيذ تصميمك بأفضل شكل ممكن
        </p>
      </div>
    </div>
  );
};
