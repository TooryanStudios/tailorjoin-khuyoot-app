import React from 'react';
import type { TryOnResponse } from '../../types/tryon';
import { ImageComparisonSlider } from './ImageComparisonSlider';

export const TryOnResult = React.forwardRef<HTMLDivElement, {
  result: TryOnResponse | null;
  loading: boolean;
  progress?: number;
  originalImageUrl?: string;
  onSaveToProject?: () => void;
  animateReveal?: boolean;
  onRetry?: () => void;
}>(function TryOnResult(props, ref) {
  const { result, loading, progress = 0, originalImageUrl, onSaveToProject, animateReveal = false, onRetry } = props;

  if (!result) {
    if (loading && originalImageUrl) {
      // Show template with blur effect during loading
      return (
        <div ref={ref} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 relative">
          <div className="relative flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl">
            <img src={originalImageUrl} alt="Template" className="max-w-full h-auto max-h-[600px] rounded-xl blur-sm object-contain" />
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-xs">
                <div className="text-center space-y-4">
                  <div className="inline-block w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  <div>
                    <div className="text-sm font-bold text-white">جارِ التوليد...</div>
                    <div className="mt-2 text-xs text-white/80">قد يستغرق ذلك 10-40 ثانية حسب الضغط.</div>
                  </div>
                  <div className="max-w-xs mx-auto">
                    <div className="w-full bg-white/20 rounded-full h-2 mb-2">
                      <div
                        className="bg-white h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-white/90">{progress}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    if (loading) {
      return (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
          <div className="text-center space-y-4">
            <div className="inline-block w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
            <div>
              <div className="text-sm font-bold text-slate-800 dark:text-white">جارِ التوليد...</div>
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">قد يستغرق ذلك 10-40 ثانية حسب الضغط.</div>
            </div>
            <div className="max-w-xs mx-auto">
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-2">
                <div
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">{progress}%</p>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
        <div className="text-center space-y-3">
          <div className="aspect-[3/4] w-full rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <div className="text-center">
              <svg className="mx-auto w-16 h-16 text-slate-300 dark:text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div className="text-sm font-bold text-slate-500 dark:text-slate-400">معاينة Try-On</div>
              <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">ستظهر النتيجة هنا بعد التوليد</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (result.status === 'failed') {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-900/40 bg-white dark:bg-slate-900 p-4">
        <div className="text-sm font-bold text-red-700 dark:text-red-300">فشل التوليد</div>
        <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">{result.error || 'حدث خطأ غير معروف'}</div>
      </div>
    );
  }

  const src = result.resultImageUrl || result.resultImageDataUrl;
  if (!src) return null;

  const showSlider = originalImageUrl && src;
  const showCornerActions = Boolean(src);

  const handleDownload = () => {
    try {
      // Create a temporary anchor element and trigger download
      // This works with Firebase Storage URLs without CORS issues
      const link = document.createElement('a');
      link.href = src;
      link.download = `khuyoot-tryon-${result.jobId || Date.now()}.png`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download image:', error);
      // Fallback: open in new tab
      window.open(src, '_blank');
    }
  };

  return (
    <div ref={ref} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3 relative">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-slate-800 dark:text-white">النتيجة</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Job: {result.jobId}</div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white hover:opacity-90 transition-opacity flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            تحميل
          </button>
          {onSaveToProject ? (
            <button
              type="button"
              onClick={onSaveToProject}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90 transition-opacity"
            >
              حفظ إلى المشروع
            </button>
          ) : null}
        </div>
      </div>

      <div className="relative">
        {showCornerActions ? (
          <div className="absolute top-3 right-3 z-20 flex gap-2">
            <button
              type="button"
              onClick={onSaveToProject}
              className="px-3 py-2 rounded-xl text-xs font-black bg-white/90 text-slate-900 hover:bg-white border border-slate-200 shadow"
            >
              ابدأ بالتفصيل
            </button>
            <button
              type="button"
              onClick={onRetry}
              className="px-3 py-2 rounded-xl text-xs font-black bg-white/90 text-slate-900 hover:bg-white border border-slate-200 shadow"
            >
              إعادة التجربة
            </button>
          </div>
        ) : null}

        {showSlider ? (
          <ImageComparisonSlider
            beforeImage={originalImageUrl}
            afterImage={src}
            beforeLabel="الأصل"
            afterLabel="بعد القماش"
            animateReveal={animateReveal}
          />
        ) : (
          <div className="w-full rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <img src={src} alt="Try-on result" className="w-full h-auto max-h-[600px] rounded-xl" />
          </div>
        )}
      </div>

      {/* Loading Overlay - shown when generating a new result while keeping previous visible */}
      {loading && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-xs">
            <div className="text-center space-y-4">
              <div className="inline-block w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              <div>
                <div className="text-sm font-bold text-white">جارِ التوليد...</div>
                <div className="mt-2 text-xs text-white/80">قد يستغرق ذلك 10-40 ثانية حسب الضغط.</div>
              </div>
              <div className="max-w-xs mx-auto">
                <div className="w-full bg-white/20 rounded-full h-2 mb-2">
                  <div
                    className="bg-white h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-white/90">{progress}%</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
