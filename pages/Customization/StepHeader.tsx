import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Ruler, Palette, Check } from 'lucide-react';

interface StepHeaderProps {
  currentStep: number;
}

export const StepHeader: React.FC<StepHeaderProps> = ({ currentStep }) => {
  const navigate = useNavigate();

  const steps = [
    { number: 1, label: 'التفصيل', icon: Palette, shortLabel: 'تفصيل' },
    { number: 2, label: 'المقاسات', icon: Ruler, shortLabel: 'مقاسات' },
    { number: 3, label: 'التأكيد', icon: Check, shortLabel: 'تأكيد' }
  ];

  return (
    <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-20 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
        {/* Mobile Layout */}
        <div className="flex items-center justify-between gap-3">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95"
          >
            <ArrowRight size={20} />
            <span className="text-sm font-medium hidden sm:inline">رجوع</span>
          </button>

          {/* Steps Progress */}
          <div className="flex-1 flex flex-row-reverse items-center justify-center gap-1.5 sm:gap-3 max-w-lg">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all shadow-sm ${
                    currentStep >= step.number
                      ? step.number === 1
                        ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white scale-110'
                        : step.number === currentStep
                        ? 'bg-gradient-to-br from-blue-500 to-cyan-600 text-white scale-110'
                        : 'bg-emerald-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                  }`}>
                    <step.icon size={18} className={currentStep >= step.number ? 'animate-pulse' : ''} />
                  </div>
                  <span className={`text-[10px] sm:text-xs font-bold whitespace-nowrap ${
                    currentStep >= step.number
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    <span className="hidden sm:inline">{step.label}</span>
                    <span className="sm:hidden">{step.shortLabel}</span>
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-0.5 w-8 sm:w-12 rounded-full transition-all ${
                    currentStep > step.number
                      ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                      : 'bg-slate-200 dark:bg-slate-700'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step Counter Badge */}
          <div className="flex items-center justify-end">
            <span className="px-2.5 sm:px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 text-xs sm:text-sm font-black text-violet-700 dark:text-violet-300 shadow-sm">
              {currentStep}<span className="text-[10px] opacity-60">/3</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
