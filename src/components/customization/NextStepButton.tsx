import React from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface NextStepButtonProps {
  onNext: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  modelSelected: boolean;
  fabricUploaded: boolean;
}

export const NextStepButton: React.FC<NextStepButtonProps> = ({
  onNext,
  disabled,
  isLoading,
  modelSelected,
  fabricUploaded
}) => {
  const isDisabled = disabled || !modelSelected || !fabricUploaded || isLoading;

  const getButtonText = () => {
    if (isLoading) return 'جاري التحضير...';
    if (!modelSelected) return 'اختاري التصميم أولاً';
    if (!fabricUploaded) return 'ارفعي صورة القماش أولاً';
    return 'التالي: إدخال المقاسات';
  };

  const getHelperText = () => {
    if (!modelSelected) return 'يرجى اختيار نموذج التصميم';
    if (!fabricUploaded) return 'يرجى رفع صورة القماش';
    return null;
  };

  return (
    <div className="space-y-3">
      {/* Helper Text */}
      {getHelperText() && (
        <div className="text-center">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {getHelperText()}
          </p>
        </div>
      )}

      {/* Main Button */}
      <button
        onClick={onNext}
        disabled={isDisabled}
        className={`
          w-full py-4 px-6 rounded-2xl font-bold text-lg
          flex items-center justify-center gap-3
          transition-all duration-300 shadow-lg
          ${isDisabled
            ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-indigo-500/50 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
          }
        `}
      >
        {isLoading ? (
          <>
            <Loader2 size={24} className="animate-spin" />
            <span>{getButtonText()}</span>
          </>
        ) : (
          <>
            <span>{getButtonText()}</span>
            <ArrowLeft size={24} />
          </>
        )}
      </button>

      {/* Progress Indicator */}
      {!isDisabled && (
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
            <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></div>
            <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></div>
          </div>
          <span>الخطوة 1 من 3</span>
        </div>
      )}
    </div>
  );
};
