import React from 'react';
import type { TryOnResponse } from '../../types/tryon';
import { ImageComparisonSlider } from './ImageComparisonSlider';

export function TryOnResult(props: {
  result: TryOnResponse | null;
  loading: boolean;
  progress?: number;
  originalImageUrl?: string;
  onSaveToProject?: () => void;
}) {
  const { result, loading, progress = 0, originalImageUrl, onSaveToProject } = props;

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

  if (!result) return null;

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

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-slate-800 dark:text-white">النتيجة</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Job: {result.jobId}</div>
        </div>
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

      {showSlider ? (
        <ImageComparisonSlider
          beforeImage={originalImageUrl}
          afterImage={src}
          beforeLabel="الأصل"
          afterLabel="بعد القماش"
        />
      ) : (
        <div className="aspect-[3/4] w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
          <img src={src} alt="Try-on result" className="h-full w-full object-cover" />
        </div>
      )}
    </div>
  );
}
