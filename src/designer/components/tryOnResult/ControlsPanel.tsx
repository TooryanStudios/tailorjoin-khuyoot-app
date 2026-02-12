import React from 'react';
import type { TryOnResultFeatures } from './TryOnResultFeatures';
import { StableImage } from '../../../../components/StableImage';

interface ControlsPanelProps {
  originalImageUrl?: string;
  fabricThumbnailUrl?: string | null;
  onOpenTemplatePicker?: () => void;
  onOpenFabricPicker?: () => void;
  onOpenFabricTiling?: () => void;
  effectiveLoading: boolean;
  effectiveProgress?: number;
  applyMask?: boolean;
  onApplyMaskChange?: (value: boolean) => void;
  selectedModel?: 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview';
  onModelChange?: (model: 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview') => void;
  customPrompt?: string;
  onCustomPromptChange?: (prompt: string) => void;
  onRetry: () => void;
  onDebugPrompt?: () => void;
  onSaveAfterImage?: () => void;
  testingMode: boolean;
  features: TryOnResultFeatures;
  showDevUi?: boolean;
  onToggleDevUi?: () => void;
}

export const ControlsPanel = React.memo<ControlsPanelProps>(function ControlsPanel({
  originalImageUrl,
  fabricThumbnailUrl,
  onOpenTemplatePicker,
  onOpenFabricPicker,
  onOpenFabricTiling,
  effectiveLoading,
  effectiveProgress,
  applyMask,
  onApplyMaskChange,
  selectedModel = 'gemini-2.5-flash-image',
  onModelChange,
  customPrompt = '',
  onCustomPromptChange,
  onRetry,
  onDebugPrompt,
  onSaveAfterImage,
  testingMode,
  features,
  showDevUi = false,
  onToggleDevUi,
}) {
  return (
    <div className="flex md:col-start-1 md:col-end-2 md:row-start-1 relative z-10 w-full md:w-[140px] order-first md:order-none px-2 md:px-0">
      <div className="w-full max-w-full flex flex-col md:flex-col gap-2 items-stretch md:items-start pb-2 md:pb-0">
        {features.showPreviewSection && (
        <div className="rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 md:sticky md:top-0 space-y-1 w-full flex-shrink-0 md:flex-shrink flex flex-col items-center">
          <div className="w-full md:w-auto flex flex-col items-center gap-3">
            <div className="w-full flex justify-center gap-2 md:flex-col md:gap-2">
              {/* Fabric Select Card (replaces template block) */}
              {features.showFabricPreview && (
              <button
                type="button"
                onClick={() => {
                  console.log('[TryOnResult] Fabric picker button clicked', { onOpenFabricPicker });
                  onOpenFabricPicker?.();
                }}
                disabled={!onOpenFabricPicker}
                className="group rounded-xl text-right transition-all disabled:opacity-60 disabled:cursor-not-allowed w-1/2 max-w-[150px] md:w-[108px] md:max-w-none"
                aria-label="اختيار القماش"
                title="اختيار القماش"
              >
                <div className="relative w-full aspect-[5/6] md:h-[185px] md:aspect-auto overflow-hidden rounded-xl ring-2 ring-transparent group-hover:ring-emerald-400 dark:group-hover:ring-emerald-500 transition-all">
                  {fabricThumbnailUrl ? (
                    <>
                      <StableImage
                        src={fabricThumbnailUrl}
                        alt="القماش"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-emerald-900/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </>
                  ) : (
                    <div className="absolute inset-0 animate-pulse bg-slate-100/90 dark:bg-slate-600/50" />
                  )}
                </div>
              </button>
              )}

              {/* Template Preview Button */}
              {features.showTemplatePreview && (
              <div className="flex flex-col gap-1 w-1/2 max-w-[150px] md:w-[108px] md:max-w-none">
                <button
                  type="button"
                  onClick={() => {
                    console.log('[TryOnResult] Template picker button clicked', { onOpenTemplatePicker });
                    onOpenTemplatePicker?.();
                  }}
                  disabled={!onOpenTemplatePicker}
                  className="group rounded-xl text-right transition-all disabled:opacity-60 disabled:cursor-not-allowed w-full"
                  aria-label="اختيار القالب"
                  title="اختيار القالب"
                >
                  <div className="relative w-full aspect-[5/6] md:h-[185px] md:aspect-auto overflow-hidden rounded-xl ring-2 ring-transparent group-hover:ring-slate-400 dark:group-hover:ring-slate-500 transition-all">
                    {originalImageUrl ? (
                      <>
                        <StableImage
                          src={originalImageUrl}
                          alt="القالب"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      </>
                    ) : (
                      <div className="absolute inset-0 animate-pulse bg-slate-200/70 dark:bg-slate-700/60" />
                    )}
                  </div>
                </button>
              </div>
              )}
            </div>
          </div>

          {/* Generate Button */}
          {features.showGenerateButton && (
          <div className="w-full flex flex-col gap-2 mt-4">
            {/* Model Selector, Save Button & Fabric Tiling Row */}
            <div className="w-full grid grid-cols-[80%_20%] gap-1 md:flex md:flex-col md:gap-2">
              {/* Model Selector */}
              {onModelChange && (
              <div className="w-full">
                <select
                  value={selectedModel}
                  onChange={(e) => onModelChange(e.target.value as 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview')}
                  className="w-full h-9 rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold px-2 hover:border-slate-400 dark:hover:border-slate-500 transition-all cursor-pointer"
                  title="اختر نموذج الذكاء الاصطناعي"
                >
                  <option value="gemini-2.5-flash-image">Nano Banana 🍌</option>
                  <option value="gemini-3-pro-image-preview">Pro Image 🎨</option>
                </select>
              </div>
              )}

              {/* Fabric Tiling Button */}
              {features.showFabricTilingButton && (
              <button
                type="button"
                onClick={() => {
                  onOpenFabricTiling?.();
                }}
                disabled={!fabricThumbnailUrl || !onOpenFabricTiling}
                className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                aria-label="تكرار القماش"
                title="تكرار القماش"
              >
                تكرار
              </button>
              )}
            </div>

            <button
              type="button"
              onClick={onRetry}
              disabled={(!testingMode && !onRetry) || effectiveLoading}
              className="w-full md:w-[108px] h-11 relative overflow-hidden rounded-xl bg-emerald-600 text-white px-3 text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              {/* Shine effect from footer */}
              <span aria-hidden="true" className="absolute inset-0 pointer-events-none motion-reduce:hidden">
                <span
                  className="absolute -inset-y-4 left-0 w-[60%] bg-gradient-to-r from-transparent via-white/45 to-transparent blur-[1px]"
                  style={{ animation: 'khuyootFooterShine 1.6s ease-in-out infinite' }}
                />
              </span>
              
              {effectiveLoading && typeof effectiveProgress === 'number' && effectiveProgress > 0 && (
                <div
                  className="absolute inset-0 bg-emerald-500/30 transition-all duration-300 ease-out"
                  style={{ width: `${effectiveProgress}%` }}
                />
              )}

              <div className="relative z-10 flex items-center gap-2">
                {effectiveLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                    <span>جارٍ الإنشاء... {typeof effectiveProgress === 'number' ? `${Math.round(effectiveProgress)}%` : ''}</span>
                  </>
                ) : (
                  <span>ابدأ التجربة ✨</span>
                )}
              </div>
            </button>

            {/* Driver Prompt (used for generation) */}
            {onCustomPromptChange && (
            <div className="w-full lg:w-[108px] relative group">
              <textarea
                value={customPrompt || ''}
                onChange={(e) => onCustomPromptChange?.(e.target.value)}
                placeholder="موجه التشغيل..."
                className="w-full h-24 rounded-lg border border-amber-300 dark:border-amber-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs p-2 pr-6 hover:border-amber-400 dark:hover:border-amber-500 focus:border-amber-500 dark:focus:border-amber-400 focus:outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500 resize-none"
                title="موجه التشغيل المستخدم لتوجيه الذكاء الاصطناعي"
              />
              {customPrompt && (
              <button
                type="button"
                onClick={() => onCustomPromptChange?.('')}
                className="absolute left-1 top-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                title="مسح الموجه"
                aria-label="مسح الموجه"
              >
                <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              )}

              {onDebugPrompt && (
                <div className="mt-2 flex justify-center">
                  <button
                    type="button"
                    onClick={onDebugPrompt}
                    className="text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                    title="طباعة الموجه (بدون توليد)"
                  >
                    طباعة الموجه في الكونسول
                  </button>
                </div>
              )}
            </div>
            )}
          </div>
          )}

        </div>
        )}
      </div>
    </div>
  );
});
