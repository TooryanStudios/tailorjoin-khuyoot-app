import React, { useState } from 'react';
import { TemplatePicker, type TemplatePickerItem } from '../TemplatePicker';
import { getOptimizedImageUrl } from '../../../utils/imageOptimization';

// Feature flag: Set to true after all existing images have WebP versions
// Migration completed - WebP generation in progress (wait 5-10 min)
const USE_WEBP_OPTIMIZATION = true;

const TEMPLATE_PICKER_SCROLL_KEY_PREFIX = 'khuyoot_template_picker_scrollTop_';

const RecentTemplateItem = React.memo(function RecentTemplateItem(props: {
  item: { id: string; imageUrl: string; thumbnailUrl?: string | null; name?: string; ts: number };
  src: string | null;
  onRecentClick: (item: { id: string; imageUrl: string; thumbnailUrl?: string | null; name?: string; ts: number }) => void;
  onRemove: (item: { id: string; imageUrl: string; thumbnailUrl?: string | null; name?: string; ts: number }) => void;
}) {
  const { item, src, onRecentClick, onRemove } = props;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onRecentClick(item)}
        className="relative aspect-[3/4] w-[100px] rounded-lg overflow-hidden border-2 transition-colors border-slate-200 dark:border-slate-700 hover:border-violet-500"
      >
        {src ? (
          <>
            <img
              src={src}
              alt={item.name || 'recent template'}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
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

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(item);
        }}
        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-colors z-10"
        title="حذف"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
});

export function TemplatePickerModalContent(props: {
  open?: boolean;
  onClose: () => void;
  templatePickerLeftScrollRef: React.RefObject<HTMLDivElement | null>;
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

  cachedTemplateThumbnailById: Record<string, string>;

  pagedCuratedTemplateItems: TemplatePickerItem[];
  selectedTemplateId: string | null;
  onSelectTemplateItem: (item: TemplatePickerItem) => void;
  onConfirmTemplateItem: (item: TemplatePickerItem) => void;

  templatePickerTotalPages: number;
  templatePickerPage: number;
  setTemplatePickerPage: (n: number) => void;
  onConfirmTemplate: () => void;

  userTemplates: Array<{ id: string; name: string; imageUrl: string; thumbnailUrl?: string }>;
  userTemplatesLoading: boolean;
  onSelectUserTemplate: (item: { id: string; name: string; imageUrl: string; thumbnailUrl?: string }) => void;
  onDeleteUserTemplate?: (templateId: string) => Promise<void>;
}) {
  const {
    open,
    onClose,
    templatePickerLeftScrollRef,
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
    cachedTemplateThumbnailById,
    pagedCuratedTemplateItems,
    selectedTemplateId,
    onSelectTemplateItem,
    onConfirmTemplateItem,
    templatePickerTotalPages,
    templatePickerPage,
    setTemplatePickerPage,
    onConfirmTemplate,
    userTemplates,
    userTemplatesLoading,
    onSelectUserTemplate,
    onDeleteUserTemplate,
  } = props;

  const [activeTab, setActiveTab] = useState<'gallery' | 'uploads'>(() => {
    try {
      const stored = localStorage.getItem('khuyoot_template_picker_tab');
      return (stored === 'uploads' ? 'uploads' : 'gallery') as 'gallery' | 'uploads';
    } catch {
      return 'gallery';
    }
  });

  const scrollKey = React.useMemo(() => `${TEMPLATE_PICKER_SCROLL_KEY_PREFIX}${activeTab}`, [activeTab]);

  const scrollSaveTimerRef = React.useRef<number | null>(null);
  const lastScrollTopRef = React.useRef<number>(0);
  const scrollSampleRafRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (scrollSampleRafRef.current !== null) {
        cancelAnimationFrame(scrollSampleRafRef.current);
        scrollSampleRafRef.current = null;
      }
      if (scrollSaveTimerRef.current !== null) {
        window.clearTimeout(scrollSaveTimerRef.current);
        scrollSaveTimerRef.current = null;
      }
    };
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const el = templatePickerLeftScrollRef.current;
    if (!el) return;

    let stored: number | null = null;
    try {
      const raw = sessionStorage.getItem(scrollKey);
      if (raw) {
        const parsed = Number(raw);
        if (Number.isFinite(parsed)) stored = parsed;
      }
    } catch {
      // ignore
    }

    if (stored === null) {
      return;
    }

    // Use a single RAF so DOM paints once before restoring.
    const raf = requestAnimationFrame(() => {
      el.scrollTop = stored || 0;
    });

    return () => cancelAnimationFrame(raf);
  }, [open, scrollKey, templatePickerLeftScrollRef]);

  const handleRemoveRecent = React.useCallback((toRemove: { id: string; imageUrl: string; thumbnailUrl?: string | null; name?: string; ts: number }) => {
    setRecentTemplates((prev) => {
      const next = prev.filter((r) => !(r.id === toRemove.id && r.imageUrl === toRemove.imageUrl));
      try {
        localStorage.setItem(recentTemplatesStorageKey, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, [setRecentTemplates, recentTemplatesStorageKey]);

  const galleryItems = React.useMemo(() => {
    if (activeTab !== 'gallery') return [];
    if (!pagedCuratedTemplateItems || pagedCuratedTemplateItems.length === 0) return [];
    
    return pagedCuratedTemplateItems.map((item) => {
      // Use imageUrl (original) for WebP generation, not thumbnailUrl (thumb)
      // Extension creates: original_200x300.webp, not thumb_200x300.webp
      const sourceUrl = item.imageUrl; // Changed from thumbnailUrl to imageUrl
      const optimizedUrl = USE_WEBP_OPTIMIZATION 
        ? getOptimizedImageUrl(sourceUrl, 'thumbnail')
        : null;
      
      return {
        ...item,
        // Try optimized WebP first, browser will fall back to imageUrl on error
        thumbnailUrl: optimizedUrl || item.thumbnailUrl || item.imageUrl,
        imageUrl: item.imageUrl, // Keep original for fallback
      };
    });
  }, [activeTab, pagedCuratedTemplateItems]);

  const recentItemsForRender = React.useMemo(() => {
    const items = recentTemplates || [];
    const max = showAllRecents ? maxRecentTemplates : 6;
    return Array.from({ length: max }).map((_, idx) => {
      const item = items[idx] || null;
      if (!item) return { key: `recent-placeholder-${idx}`, item: null as any, src: null as string | null };

      const raw = (item.thumbnailUrl || item.imageUrl || '') as string;
      
      // Use WebP optimization for URLs, keep blob/data URLs as-is
      let src: string | null;
      if (raw.startsWith('blob:') || raw.startsWith('data:image/')) {
        src = raw;
      } else {
        src = USE_WEBP_OPTIMIZATION ? getOptimizedImageUrl(raw, 'thumbnail') : raw;
      }

      return { key: `${item.id}-${idx}`, item, src: src || null };
    });
  }, [recentTemplates, showAllRecents, maxRecentTemplates]);

  // Persist tab choice
  const handleTabChange = (tab: 'gallery' | 'uploads') => {
    setActiveTab(tab);
    try {
      localStorage.setItem('khuyoot_template_picker_tab', tab);
    } catch {}
  };

  const wasOpenRef = React.useRef(false);
  React.useEffect(() => {
    const isOpening = Boolean(open) && !wasOpenRef.current;
    wasOpenRef.current = Boolean(open);
    if (!isOpening) return;

    // Only auto-switch to uploads tab if there's a custom template preview and we're on first open ever
    const hasNeverSwitched = !localStorage.getItem('khuyoot_template_picker_tab');
    if (hasNeverSwitched) {
      const selectedIsInUploads = Boolean(customTemplatePreview) || recentTemplates.some((t) => t.id === selectedTemplateId);
      if (selectedIsInUploads) {
        handleTabChange('uploads');
      }
    }
  }, [open, customTemplatePreview, recentTemplates, selectedTemplateId]);

  return (
    <>
      <div className="flex items-center justify-between p-3 pb-2 shrink-0">
        <h3 className="text-lg font text-slate-900 dark:text-white">اختر القالب</h3>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button>
      </div>
      
      <div
        className="flex-1 min-h-0 overflow-y-auto md:overflow-hidden px-3"
        style={{
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
        }}
      >
        <div className="flex-1 min-h-0 md:h-full flex flex-col lg:flex-row gap-3">
          <div
            className="relative flex-1 min-h-0 md:h-full overflow-visible md:overflow-y-scroll md:pr-3"
            ref={templatePickerLeftScrollRef}
            onScroll={(e) => {
              const target = e.currentTarget;

              // Sample scrollTop at most once per frame.
              if (scrollSampleRafRef.current === null) {
                scrollSampleRafRef.current = requestAnimationFrame(() => {
                  scrollSampleRafRef.current = null;
                  lastScrollTopRef.current = target.scrollTop || 0;
                });
              }

              // Persist scrollTop: debounce to avoid hammering sessionStorage while scrolling.
              if (scrollSaveTimerRef.current !== null) window.clearTimeout(scrollSaveTimerRef.current);
              scrollSaveTimerRef.current = window.setTimeout(() => {
                scrollSaveTimerRef.current = null;
                try {
                  sessionStorage.setItem(scrollKey, String(lastScrollTopRef.current || 0));
                } catch {
                  // ignore
                }
              }, 250);
            }}
            style={{
              overscrollBehavior: 'contain',
              WebkitOverflowScrolling: 'touch',
              scrollbarGutter: 'stable',
              touchAction: 'pan-y',
              scrollBehavior: 'auto',
            }}
          >
            <div className="pt-1 pb-4">

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
                    className={`relative aspect-[3/4] w-[126px] rounded-xl overflow-hidden border-2 ${
                      templateDragActive
                        ? 'border-solid border-amber-500 bg-amber-100 dark:bg-amber-900/40'
                        : 'border-dashed border-amber-300 dark:border-amber-700 hover:border-amber-400 dark:hover:border-amber-600'
                    } bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-slate-900 transition-all shadow-sm hover:shadow-lg`}
                  >
                    
                    {customTemplatePreview ? (
                      <>
                        <img
                          ref={templatePreviewImgElRef}
                          src={customTemplatePreview}
                          alt="Template preview"
                          className="w-full h-full object-cover"
                          onLoad={(e) => {
                            const current = e.currentTarget.src;
                            const expected = templatePreviewSrcRef.current;
                            if (!templatePreviewSrcRef.current || current === expected) {
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
                    <div className="mt-1.5 text-[10px] text-center text-slate-600 dark:text-slate-400 truncate max-w-[126px]">
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

            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              {/* Tabs */}
              <div className="flex items-center gap-1 mb-3 border-b border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => handleTabChange('gallery')}
                  className={`flex-1 px-4 py-2 text-sm transition-all relative ${
                    activeTab === 'gallery'
                      ? 'text-violet-600 dark:text-violet-400'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  مجموعة القوالب
                  {activeTab === 'gallery' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 dark:bg-violet-400" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('uploads')}
                  className={`flex-1 px-4 py-2 text-sm transition-all relative ${
                    activeTab === 'uploads'
                      ? 'text-violet-600 dark:text-violet-400'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  القوالب المرفوعة ({recentTemplates.length})
                  {activeTab === 'uploads' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 dark:bg-violet-400" />
                  )}
                </button>
              </div>

              {/* Gallery Tab */}
              {activeTab === 'gallery' ? (
              <div className={'pb-2'}>
                <TemplatePicker
                  items={galleryItems}
                  selectedId={selectedTemplateId}
                  onSelect={onSelectTemplateItem}
                  onConfirm={onConfirmTemplateItem}
                  maxItemWidthPx={108}
                  preferThumbnailOnly
                  showEndPlaceholders={templatePickerPage === templatePickerTotalPages}
                />
              </div>
              ) : null}

              {/* Uploads Tab */}
              {activeTab === 'uploads' ? (
              <div className={'pb-4'}>
                {/* My Uploads Section */}
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 px-1">قوالبي</h3>
                  {userTemplatesLoading ? (
                    <div className="flex items-center justify-center h-24 text-slate-400">
                      جاري التحميل...
                    </div>
                  ) : userTemplates.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 p-6 text-center text-sm text-slate-400">
                      لم تقم برفع أي قوالب بعد
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/30 p-3">
                      <div className="flex flex-wrap gap-2">
                        {userTemplates.map((template) => (
                          <div key={template.id} className="relative group">
                            <button
                              type="button"
                              onClick={() => onSelectUserTemplate(template)}
                              className={`relative aspect-[3/4] w-[100px] rounded-lg overflow-hidden border-2 transition-all ${
                                selectedTemplateId === template.id
                                  ? 'ring-2 ring-violet-500 border-violet-500'
                                  : 'border-slate-200 dark:border-slate-700 hover:border-violet-400'
                              }`}
                            >
                              <img
                                src={template.thumbnailUrl || template.imageUrl}
                                alt={template.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                decoding="async"
                              />
                            </button>
                            {onDeleteUserTemplate && (
                              <button
                                type="button"
                                onClick={async () => {
                                  if (confirm(`حذف "${template.name}"؟`)) {
                                    await onDeleteUserTemplate(template.id);
                                  }
                                }}
                                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                title="حذف"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Recent Templates Section */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 px-1">المستخدمة مؤخراً</h3>
                  <div className="flex items-center justify-between mb-2">
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
                      {recentItemsForRender.map(({ key, item, src }) => {
                        if (!item) {
                          return (
                            <div key={key} className="relative">
                              <div className="relative aspect-[3/4] w-[100px] rounded-lg overflow-hidden border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-[10px] text-slate-400">
                                —
                              </div>
                            </div>
                          );
                        }

                        return (
                          <RecentTemplateItem
                            key={key}
                            item={item}
                            src={src}
                            onRecentClick={onRecentClick}
                            onRemove={handleRemoveRecent}
                          />
                        );
                      })}
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      {recentTemplates.length > 6 && (
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
              </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed pagination at bottom - only show for gallery tab */}
      {activeTab === 'gallery' && templatePickerTotalPages > 1 && (
        <div className="shrink-0 border-t border-slate-200 dark:border-slate-700 p-2 flex items-center justify-center">
          <div className="flex items-center gap-1 overflow-x-auto max-w-full">
            {Array.from({ length: templatePickerTotalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              const isActive = pageNum === templatePickerPage;
              return (
                <button
                  key={`template-picker-page-${pageNum}`}
                  type="button"
                  onClick={() => setTemplatePickerPage(pageNum)}
                  className={
                    `min-w-[32px] h-7 px-2 rounded-lg border text-xs font-bold transition-colors ` +
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
      )}
    </>
  );
}
