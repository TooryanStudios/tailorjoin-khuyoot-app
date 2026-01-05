import React from 'react';
import { Loader2, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import type { CustomizationModel, PreviewStatus } from '../../types/customization';

interface PreviewCanvasProps {
  selectedModel: CustomizationModel | null;
  fabricImageUrl?: string;
  previewUrl?: string;
  previewStatus: PreviewStatus;
  onRegeneratePreview?: () => void;
  errorMessage?: string;
  /**
   * `section`: renders title/description + framed canvas (default)
   * `canvas`: renders only the framed canvas (better for background layers)
   */
  mode?: 'section' | 'canvas';
  className?: string;
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  selectedModel,
  fabricImageUrl,
  previewUrl,
  previewStatus,
  onRegeneratePreview,
  errorMessage,
  mode = 'section',
  className
}) => {
  const renderContent = () => {
    // Error state
    if (previewStatus === 'error') {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <AlertCircle size={32} className="text-red-600 dark:text-red-400" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white mb-2">
            حدث خطأ في المعاينة
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            {errorMessage || 'يرجى المحاولة مرة أخرى'}
          </p>
          {onRegeneratePreview && (
            <button
              onClick={onRegeneratePreview}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <RefreshCw size={16} />
              إعادة المحاولة
            </button>
          )}
        </div>
      );
    }

    // Processing state
    if (previewStatus === 'processing') {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <Loader2 size={48} className="text-indigo-600 animate-spin mb-4" />
          <h3 className="font-bold text-slate-900 dark:text-white mb-2">
            جاري إنشاء المعاينة...
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            الذكاء الاصطناعي يقوم بتطبيق القماش على التصميم
          </p>
          <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
            <Sparkles size={14} className="text-amber-500" />
            <span>قد تستغرق العملية بضع ثوان</span>
          </div>
        </div>
      );
    }

    // Ready state with preview
    if (previewStatus === 'ready' && previewUrl) {
      return (
        <div className="relative h-full">
          <img
            src={previewUrl}
            alt="معاينة التصميم مع القماش"
            className="w-full h-full object-contain"
          />
          
          {/* Preview Badge */}
          <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
            <Sparkles size={12} />
            <span>معاينة بالذكاء الاصطناعي</span>
          </div>

          {/* Regenerate Button */}
          {onRegeneratePreview && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <button
                onClick={onRegeneratePreview}
                className="px-4 py-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur hover:bg-white dark:hover:bg-slate-800 text-slate-900 dark:text-white rounded-lg font-medium flex items-center gap-2 shadow-lg transition-colors"
              >
                <RefreshCw size={16} />
                تحديث المعاينة
              </button>
            </div>
          )}
        </div>
      );
    }

    // Idle state - waiting for selection
    if (!selectedModel || !fabricImageUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <Sparkles size={32} className="text-slate-400" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white mb-2">
            اختاري التصميم والقماش
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs">
            بعد اختيار التصميم ورفع صورة القماش، سيتم عرض معاينة بالذكاء الاصطناعي هنا
          </p>
        </div>
      );
    }

    // Showing fabric while waiting
    return (
      <div className="relative h-full flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md aspect-square mb-4 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700">
          <img
            src={fabricImageUrl}
            alt="القماش المختار"
            className="w-full h-full object-cover"
          />
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
          جاهز لإنشاء المعاينة
        </p>
      </div>
    );
  };

  const showHeader = mode === 'section';

  return (
    <div className={[showHeader ? 'space-y-4' : 'h-full', className].filter(Boolean).join(' ')}>
      {showHeader && (
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            معاينة التصميم
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            شاهدي كيف سيبدو القماش على التصميم المختار
          </p>
        </div>
      )}

      <div
        className={[
          'rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden',
          showHeader ? 'min-h-[400px] lg:min-h-[500px]' : 'h-full min-h-0',
        ].join(' ')}
      >
        {renderContent()}
      </div>
    </div>
  );
};
