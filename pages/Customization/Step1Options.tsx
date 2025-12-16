import React from 'react';
import { Check } from 'lucide-react';
import { CustomizationOption } from './types';

interface Step1OptionsProps {
  customizations: CustomizationOption[];
  onOptionChange: (optionId: string, value: string) => void;
  onNextStep: () => void;
  onSaveDraft: () => void;
  currentStepColor: string;
}

export const Step1Options: React.FC<Step1OptionsProps> = ({
  customizations,
  onOptionChange,
  onNextStep,
  onSaveDraft,
  currentStepColor
}) => {
  return (
    <div className="space-y-4 sm:space-y-5">
      {customizations.filter(opt => opt.type !== 'text').map((option) => (
        <div key={option.id} className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
          <label className="block text-base sm:text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-7 h-7 sm:w-6 sm:h-6 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xs flex items-center justify-center font-bold shadow-sm">
              {customizations.indexOf(option) + 1}
            </span>
            {option.label}
            <span className="text-red-500 text-lg sm:text-base">*</span>
          </label>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {option.options?.map((opt) => (
              <button
                key={opt}
                onClick={() => onOptionChange(option.id, opt)}
                className={`group relative px-4 py-5 sm:py-4 rounded-xl border-2 font-medium transition-all active:scale-95 touch-manipulation ${
                  option.value === opt
                    ? 'border-violet-600 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 text-violet-700 dark:text-violet-300 shadow-lg scale-105 ring-2 ring-violet-200 dark:ring-violet-800'
                    : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-md'
                }`}
              >
                {option.value === opt && (
                  <div className="absolute top-2 left-2">
                    <div className="w-6 h-6 sm:w-5 sm:h-5 rounded-full bg-violet-600 flex items-center justify-center shadow-sm">
                      <Check size={14} className="text-white" />
                    </div>
                  </div>
                )}
                <span className="block text-center text-sm sm:text-base">{opt}</span>
              </button>
            ))}
          </div>

          {!option.value && (
            <p className="mt-3 text-xs sm:text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
              <span className="text-base">⚠️</span>
              الرجاء اختيار {option.label} قبل المتابعة
            </p>
          )}
        </div>
      ))}

      {/* Action Buttons */}
      <div className="sticky bottom-4 mt-6 flex flex-col-reverse sm:flex-row-reverse items-center gap-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
        <button
          onClick={onNextStep}
          className={`w-full sm:flex-[2] px-6 py-4 sm:py-3 rounded-xl font-bold shadow-lg bg-gradient-to-r ${currentStepColor} text-white active:scale-95 transition-transform text-base sm:text-sm`}
        >
          التالي ← المقاسات
        </button>
        <button
          onClick={onSaveDraft}
          className="w-full sm:flex-1 px-4 py-3.5 sm:py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-xl font-bold active:scale-95 transition-all text-sm"
        >
          💾 حفظ لاحقاً
        </button>
      </div>
    </div>
  );
};
