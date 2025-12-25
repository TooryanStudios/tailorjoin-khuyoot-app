import React from 'react';
import { TemplatePicker, type TemplatePickerItem } from '../TemplatePicker';

export function TemplatePickerModalContent(props: {
  onClose: () => void;
  templatePickerLeftScrollRef: React.RefObject<HTMLDivElement | null>;
  updateTemplatePickerLeftScrollThumb: () => void;
  templatePickerLeftScrollThumb: { hasOverflow: boolean; topPx: number; heightPx: number };
  templateUploadInputRef: React.RefObject<HTMLInputElement | null>;

  handleTemplateDrop: (e: React.DragEvent) => void;
  handleTemplateDragOver: (e: React.DragEvent) => void;
  handleTemplateDragEnter: (e: React.DragEvent) => void;
  handleTemplateDragLeave: (e: React.DragEvent) => void;
  templateDragActive: boolean;

  customTemplatePreview: string | null;
  customTemplateFile: File | null;
  templatePreviewImgElRef: React.RefObject<HTMLImageElement | null>;
  templatePreviewSrcRef: React.MutableRefObject<string | null>;
  templatePreviewLoading: boolean;
  setTemplatePreviewLoading: (v: boolean) => void;
  setCustomTemplateFile: (f: File | null) => void;
  setCustomTemplatePreview: (url: string | null) => void;

  saveTemplateToHistory: boolean;
  setSaveTemplateToHistory: (v: boolean) => void;

  recentTemplates: Array<{ id: string; imageUrl: string; thumbnailUrl?: string | null; name?: string; ts: number }>;
  setRecentTemplates: React.Dispatch<React.SetStateAction<Array<{ id: string; imageUrl: string; thumbnailUrl?: string | null; name?: string; ts: number }>>>;
  showAllRecents: boolean;
  setShowAllRecents: (v: boolean) => void;
  maxRecentTemplates: number;
  recentTemplatesStorageKey: string;
  onRecentClick: (item: { id: string; imageUrl: string; thumbnailUrl?: string | null; name?: string; ts: number }) => void;

  validateTemplateFile: (f: File) => boolean;
  onTemplateUpload: (f: File) => void;

  pagedCuratedTemplateItems: TemplatePickerItem[];
  selectedTemplateId: string | null;
  onSelectTemplateItem: (item: TemplatePickerItem) => void;

  templatePickerTotalPages: number;
  templatePickerPage: number;
  setTemplatePickerPage: (n: number) => void;

  resolvedTemplateImageUrl: string | null;
  templateSidePreviewImgElRef: React.RefObject<HTMLImageElement | null>;
  templateSidePreviewSrcRef: React.MutableRefObject<string | null>;
  templateSidePreviewLoading: boolean;
  setTemplateSidePreviewLoading: (v: boolean) => void;

  canSubmitTemplate: boolean;
  onConfirmTemplate: () => void;
}) {
  const {
    onClose,
    templatePickerLeftScrollRef,
    updateTemplatePickerLeftScrollThumb,
    templatePickerLeftScrollThumb,
    templateUploadInputRef,
    handleTemplateDrop,
    handleTemplateDragOver,
    handleTemplateDragEnter,
    handleTemplateDragLeave,
    templateDragActive,
    customTemplatePreview,
    customTemplateFile,
    templatePreviewImgElRef,
    templatePreviewSrcRef,
    templatePreviewLoading,
    setTemplatePreviewLoading,
    setCustomTemplateFile,
    setCustomTemplatePreview,
    saveTemplateToHistory,
    setSaveTemplateToHistory,
    recentTemplates,
    setRecentTemplates,
    showAllRecents,
    setShowAllRecents,
    maxRecentTemplates,
    recentTemplatesStorageKey,
    onRecentClick,
    validateTemplateFile,
    onTemplateUpload,
    pagedCuratedTemplateItems,
    selectedTemplateId,
    onSelectTemplateItem,
    templatePickerTotalPages,
    templatePickerPage,
    setTemplatePickerPage,
    resolvedTemplateImageUrl,
    templateSidePreviewImgElRef,
    templateSidePreviewSrcRef,
    templateSidePreviewLoading,
    setTemplateSidePreviewLoading,
    canSubmitTemplate,
    onConfirmTemplate,
  } = props;

  return (
    <>
      <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[10px] bg-violet-600 text-white px-3 py-1.5 z-[9999] rounded-full font-black shadow-2xl ring-2 ring-white/80 select-text cursor-text">
        MODAL: TRYON-TEMPLATE-PICKER
      </div>

      <div className="flex items-center justify-between p-6 pb-4 shrink-0">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">اختر القالب</h3>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button>
      </div>

      <div
        className="flex-1 min-h-0 overflow-y-auto md:overflow-hidden px-6"
        style={{
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
        }}
      >
        <div className="flex-1 min-h-0 md:h-full flex flex-col lg:flex-row gap-4">
          <div
            ref={templatePickerLeftScrollRef}
            onScroll={updateTemplatePickerLeftScrollThumb}
            className="relative flex-1 min-h-0 md:h-full overflow-visible md:overflow-y-scroll md:pr-3"
            style={{
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch',
              scrollbarGutter: 'stable',
              touchAction: 'pan-y',
            }}
          >
            <div className="hidden lg:block sticky top-0 z-20 bg-white dark:bg-slate-900 pt-1 pb-2">
              <div className="text-[10px] font-black text-slate-700 dark:text-slate-200 text-right">TRYON-TEMPLATE-PICKER::LEFT</div>
            </div>

            <div className="hidden md:block pointer-events-none absolute top-0 bottom-0 right-0 w-3 z-10">
              <div className="absolute top-2 bottom-2 right-1 w-[3px] rounded-full bg-slate-200 dark:bg-slate-700" />
              {templatePickerLeftScrollThumb.hasOverflow ? (
                <div
                  className="absolute right-1 w-[3px] rounded-full bg-slate-500/80 dark:bg-slate-400/80"
                  style={{ top: templatePickerLeftScrollThumb.topPx, height: templatePickerLeftScrollThumb.heightPx }}
                />
              ) : null}
            </div>

            <div className="pt-1 pb-4">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-2">ارفع قالب مخصص</label>

              <div className="flex flex-row gap-3 items-start">
                <div className="flex-shrink-0">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => templateUploadInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        templateUploadInputRef.current?.click();
                      }
                    }}
                    onDrop={handleTemplateDrop}
                    onDragOver={handleTemplateDragOver}
                    onDragEnter={handleTemplateDragEnter}
                    onDragLeave={handleTemplateDragLeave}
                    className={`relative aspect-[3/4] w-[140px] rounded-xl overflow-hidden border-2 ${
                      templateDragActive
                        ? 'border-solid border-amber-500 bg-amber-100 dark:bg-amber-900/40'
                        : 'border-dashed border-amber-300 dark:border-amber-700 hover:border-amber-400 dark:hover:border-amber-600'
                    } bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-slate-900 transition-all shadow-sm hover:shadow-lg`}
                  >
                    anchorId_UploadCard
                    {customTemplatePreview ? (
                      <>
                        <img
                          ref={templatePreviewImgElRef}
                          src={customTemplatePreview}
                          alt="Template preview"
                          className="w-full h-full object-cover"
                          onLoad={(e) => {
                            const current = e.currentTarget.src;
                            if (!templatePreviewSrcRef.current || current === templatePreviewSrcRef.current) {
                              setTemplatePreviewLoading(false);
                            }
                          }}
                          onError={() => {
                            setTemplatePreviewLoading(false);
                          }}
                        />

                        {templatePreviewLoading ? (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-[5]">
                            <div className="w-8 h-8 rounded-full border-2 border-white/80 border-t-transparent animate-spin" />
                          </div>
                        ) : null}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCustomTemplateFile(null);
                            setCustomTemplatePreview(null);
                            if (templateUploadInputRef.current) {
                              templateUploadInputRef.current.value = '';
                            }
                          }}
                          className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-colors z-10"
                          title="إزالة"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center">
                        <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center mb-2 shadow-md">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                        </div>
                        <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          {templateDragActive ? 'أفلت الصورة هنا' : 'اضغط أو اسحب'}
                        </div>
                        <div className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">JPG, PNG</div>
                      </div>
                    )}
                  </div>
                  {customTemplatePreview && customTemplateFile && (
                    <div className="mt-1.5 text-[10px] text-center text-slate-600 dark:text-slate-400 truncate max-w-[140px]">
                      {customTemplateFile.name}
                    </div>
                  )}
                </div>

                <div className="flex-1 w-full space-y-2">
                  <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/20 p-3 text-[11px] text-amber-900 dark:text-amber-200">
                    <div className="font-black mb-1">تنبيه</div>
                    <div>برفعك للقالب أنت تؤكد أن لديك حق استخدام الصورة، وأنها لا تحتوي على أشخاص/صور شخصية أو بيانات حساسية. أنت تتحمل المسؤولية عن المحتوى المرفوع.</div>
                  </div>

                  <div className="rounded-xl border border-amber-100 dark:border-amber-900/40 bg-white/80 dark:bg-slate-800/40 p-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={saveTemplateToHistory}
                        onChange={(e) => setSaveTemplateToHistory(e.target.checked)}
                        className="sr-only peer"
                      />
                      <span
                        className="relative w-5 h-5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 flex items-center justify-center transition-colors peer-checked:bg-violet-600 peer-checked:border-violet-600 after:content-['✓'] after:text-white after:text-sm after:font-black after:leading-none after:opacity-0 peer-checked:after:opacity-100"
                        aria-hidden
                      />
                      <span className="text-xs text-slate-700 dark:text-slate-300">حفظ الصور المرفوعة في السجل</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">الصور المرفوعة مؤخراً</label>
                  {recentTemplates.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setRecentTemplates([]);
                        try {
                          localStorage.removeItem(recentTemplatesStorageKey);
                        } catch {}
                      }}
                      className="text-[10px] text-red-600 dark:text-red-400 hover:underline font-bold"
                    >
                      مسح الكل
                    </button>
                  )}
                </div>
                <div className="rounded-xl border border-amber-100 dark:border-amber-900/40 bg-white/80 dark:bg-slate-800/40 p-3">
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from({ length: showAllRecents ? maxRecentTemplates : 3 }).map((_, idx) => {
                      const item = recentTemplates[idx];
                      return (
                        <div key={item ? `${item.id}-${idx}` : `recent-placeholder-${idx}`} className="relative">
                          <button
                            type="button"
                            disabled={!item}
                            onClick={() => item && onRecentClick(item)}
                            className={`relative aspect-[3/4] w-[100px] rounded-lg overflow-hidden border-2 transition-colors ${
                              item
                                ? 'border-slate-200 dark:border-slate-700 hover:border-violet-500'
                                : 'border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                            }`}
                          >
                            {item ? (
                              <>
                                <img
                                  src={(item.thumbnailUrl || item.imageUrl) as string}
                                  alt={item.name || 'recent template'}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                                    if (fallback) fallback.style.display = 'flex';
                                  }}
                                />
                                <div className="absolute inset-0 hidden items-center justify-center text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800">لا صورة</div>
                              </>
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-400">—</div>
                            )}
                          </button>
                          {item && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRecentTemplates((prev) => {
                                  const next = prev.filter((r) => !(r.id === item.id && r.imageUrl === item.imageUrl));
                                  try {
                                    localStorage.setItem(recentTemplatesStorageKey, JSON.stringify(next));
                                  } catch {}
                                  return next;
                                });
                              }}
                              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-colors z-10"
                              title="حذف"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    {recentTemplates.length > 3 && (
                      <button
                        type="button"
                        onClick={() => setShowAllRecents(!showAllRecents)}
                        className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline"
                      >
                        {showAllRecents ? 'إخفاء' : `عرض الكل (${recentTemplates.length})`}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <input
                ref={templateUploadInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (file && validateTemplateFile(file)) {
                    onTemplateUpload(file);
                  }
                }}
                className="hidden"
              />
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">أو اختر أحد من قوالب مجموعتنا المختارة</div>
              <TemplatePicker
                items={pagedCuratedTemplateItems}
                selectedId={selectedTemplateId}
                onSelect={(item) => onSelectTemplateItem(item)}
              />

              {templatePickerTotalPages > 1 ? (
                <div className="mt-3 flex items-center justify-center">
                  <div className="flex items-center gap-1 overflow-x-auto max-w-full px-1 py-1">
                    {Array.from({ length: templatePickerTotalPages }).map((_, idx) => {
                      const pageNum = idx + 1;
                      const isActive = pageNum === templatePickerPage;
                      return (
                        <button
                          key={`template-picker-page-${pageNum}`}
                          type="button"
                          onClick={() => setTemplatePickerPage(pageNum)}
                          className={
                            `min-w-[36px] h-9 px-2 rounded-xl border text-sm font-bold transition-colors ` +
                            (isActive
                              ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-200'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800')
                          }
                          aria-current={isActive ? 'page' : undefined}
                          aria-label={`Page ${pageNum}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="hidden lg:block w-[360px] xl:w-[420px] shrink-0">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-3">
              <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900/40 text-[10px] font-black text-slate-700 dark:text-slate-200 mb-2 text-right">TRYON-TEMPLATE-PICKER::RIGHT</div>
              <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                {resolvedTemplateImageUrl ? (
                  <img
                    ref={templateSidePreviewImgElRef}
                    src={resolvedTemplateImageUrl}
                    alt="Template preview"
                    className="w-full h-full object-contain"
                    onLoad={(e) => {
                      const current = e.currentTarget.src;
                      if (!templateSidePreviewSrcRef.current || current === templateSidePreviewSrcRef.current) {
                        setTemplateSidePreviewLoading(false);
                      }
                    }}
                    onError={() => {
                      setTemplateSidePreviewLoading(false);
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400">
                    اختر قالباً للمعاينة
                  </div>
                )}

                {templateSidePreviewLoading && resolvedTemplateImageUrl ? (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full border-2 border-white/80 border-t-transparent animate-spin" />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-3 shrink-0">
        <button
          type="button"
          onClick={onConfirmTemplate}
          disabled={!canSubmitTemplate}
          className={`flex-1 px-4 py-3 rounded-2xl text-sm font-black text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 transition-colors ${
            canSubmitTemplate ? '' : 'opacity-60 cursor-not-allowed'
          }`}
        >
          اعتماد القالب
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-3 rounded-2xl text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          إغلاق
        </button>
      </div>
    </>
  );
}
