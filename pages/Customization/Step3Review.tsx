import React from 'react';
import { Info, Palette, Ruler, Check, ShoppingCart } from 'lucide-react';
import { CustomizationOption, Measurements } from './types';

interface Step3ReviewProps {
  customizations: CustomizationOption[];
  measurements: Measurements;
  onOptionChange: (optionId: string, value: string) => void;
  onNextStep: () => void;
  onSaveDraft: () => void;
  onAddToCart: () => void;
}

export const Step3Review: React.FC<Step3ReviewProps> = ({
  customizations,
  measurements,
  onOptionChange,
  onNextStep,
  onSaveDraft,
  onAddToCart
}) => {
  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Notes Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
        <label className="block text-base sm:text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Info size={20} className="text-slate-400" />
          {customizations.find(o => o.type === 'text')?.label}
          <span className="text-xs text-slate-400 font-normal">(اختياري)</span>
        </label>
        <textarea
          value={customizations.find(o => o.type === 'text')?.value}
          onChange={(e) => onOptionChange('notes', e.target.value)}
          placeholder="مثال: أريد تطريز اسمي على الجيب..."
          className="w-full px-4 py-4 sm:py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white placeholder-slate-400 text-base sm:text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all resize-none touch-manipulation"
          rows={4}
        />
      </div>

      {/* Customizations */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
        <h3 className="font-bold text-base sm:text-sm text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Palette size={20} className="text-violet-600" />
          خيارات التفصيل
        </h3>
        <div className="space-y-3">
          {customizations.filter(opt => opt.value).map((opt) => (
            <div key={opt.id} className="flex items-center justify-between py-3 sm:py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
              <span className="text-sm sm:text-sm text-slate-600 dark:text-slate-400 font-medium">{opt.label}</span>
              <span className="font-bold text-base sm:text-sm text-slate-900 dark:text-white px-3 py-1 bg-violet-50 dark:bg-violet-900/20 rounded-lg">{opt.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Measurements */}
      {Object.values(measurements).some(val => val) && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
          <h3 className="font-bold text-base sm:text-sm text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Ruler size={20} className="text-blue-600" />
            المقاسات (سم)
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 sm:gap-2">
            {Object.entries(measurements).filter(([_, val]) => val).map(([key, value]) => (
              <div key={key} className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center border border-blue-100 dark:border-blue-800">
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-1 capitalize font-medium">{key}</p>
                <p className="text-lg sm:text-base font-black text-blue-700 dark:text-blue-300">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success Message */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-5 sm:p-5 text-white shadow-xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 sm:w-8 sm:h-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
            <Check size={24} className="sm:w-5 sm:h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg sm:text-base mb-1.5">✅ جاهز للطلب!</h3>
            <p className="text-sm sm:text-xs text-white/90 leading-relaxed">تم إكمال جميع التفاصيل بنجاح. اضغط على "إضافة إلى السلة" للمتابعة</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="sticky bottom-4 mt-6 flex flex-col-reverse sm:flex-row-reverse items-center gap-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
        <button
          onClick={onAddToCart}
          className="w-full sm:flex-[2] px-6 py-4 sm:py-3 rounded-xl font-bold shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center gap-2 active:scale-95 transition-transform text-base sm:text-sm"
        >
          <ShoppingCart size={20} />
          🛍️ إضافة للسلة
        </button>
        <button
          onClick={onSaveDraft}
          className="w-full sm:flex-1 px-4 py-3.5 sm:py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-xl font-bold active:scale-95 transition-all text-sm"
        >
          💾 حفظ المسودة
        </button>
      </div>
    </div>
  );
};
