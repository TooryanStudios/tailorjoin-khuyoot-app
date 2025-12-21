import React from 'react';
import { TemplatePicker } from './TemplatePicker';
import { FabricUploader } from './FabricUploader';
import { TryOnResult } from './TryOnResult';
import { GARMENT_TEMPLATES } from '../templates/garmentTemplates';
import type { TryOnOptions, TryOnRequest, TryOnResponse } from '../../types/tryon';
import { resizeImage } from '../../utils/imageResize';
import { fileToBase64 } from '../../utils/fileToBase64';
import { generateTryOn } from '../../services/tryonService';
import { ImageLibraryPicker } from '../../../components/ImageLibraryPicker';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

function looksLikePersonalPhotoClientSide(file: File): boolean {
  // Minimal, conservative heuristic: reject portrait-ish photos by filename.
  const name = (file.name || '').toLowerCase();
  if (name.includes('selfie') || name.includes('portrait') || name.includes('camera')) return true;
  return false;
}

export function TryFabricPanel(props: {
  initialTemplateId?: string;
  initialOptions?: TryOnOptions;
  onApplyResult: (result: { jobId: string; resultImageUrl: string }) => void;
}) {
  const { initialTemplateId, initialOptions, onApplyResult } = props;

  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string | null>(initialTemplateId || null);
  const [customTemplateFile, setCustomTemplateFile] = React.useState<File | null>(null);
  const [customTemplatePreview, setCustomTemplatePreview] = React.useState<string | null>(null);
  const [fabricFile, setFabricFile] = React.useState<File | null>(null);
  const [fabricImageUrl, setFabricImageUrl] = React.useState<string | null>(null);
  const [fabricPreview, setFabricPreview] = React.useState<string | null>(null);
  const [fabricError, setFabricError] = React.useState<string | null>(null);
  const [options, setOptions] = React.useState<TryOnOptions>({
    neckStyle: initialOptions?.neckStyle || 'keep',
    embroideryStyle: initialOptions?.embroideryStyle || 'keep',
    sleeveStyle: initialOptions?.sleeveStyle || 'keep',
    fabricScale: initialOptions?.fabricScale ?? 1,
    colorPreservation: initialOptions?.colorPreservation || 'high',
  });

  const [loading, setLoading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [result, setResult] = React.useState<TryOnResponse | null>(null);
  const [showTemplateImageLibrary, setShowTemplateImageLibrary] = React.useState(false);
  const [showFabricPicker, setShowFabricPicker] = React.useState(false);
  const [showFabricImageLibrary, setShowFabricImageLibrary] = React.useState(false);
  const [showDebugView, setShowDebugView] = React.useState(false);
  const [animateReveal, setAnimateReveal] = React.useState(false);
  const topRef = React.useRef<HTMLDivElement>(null);
  const resultRef = React.useRef<HTMLDivElement>(null);

  const validateFile = React.useCallback((file: File | null) => {
    if (!file) {
      setFabricError(null);
      return true;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setFabricError('يرجى اختيار صورة بصيغة JPG أو PNG أو WEBP');
      return false;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setFabricError('حجم الصورة يجب أن لا يتجاوز 5 ميجابايت');
      return false;
    }

    if (looksLikePersonalPhotoClientSide(file)) {
      setFabricError('ممنوع رفع صور شخصية. ارفع صورة قماش/نقشة فقط.');
      return false;
    }

    setFabricError(null);
    return true;
  }, []);

  const onFabricChange = async (file: File | null) => {
    setResult(null);
    setFabricImageUrl(null);
    if (!validateFile(file)) {
      setFabricFile(file);
      setFabricPreview(null);
      return;
    }
    setFabricFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setFabricPreview(url);
    } else {
      setFabricPreview(null);
    }
  };

  const onFabricUrlSelect = React.useCallback((url: string) => {
    setResult(null);
    setFabricError(null);
    setFabricFile(null);
    setFabricImageUrl(url);
    setFabricPreview(url);
  }, []);

  const onTemplateUpload = async (file: File | null) => {
    setResult(null);
    setCustomTemplateFile(file);
    setSelectedTemplateId(null); // Deselect predefined template
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomTemplatePreview(url);
    } else {
      setCustomTemplatePreview(null);
    }
  };

  const onGenerate = async () => {
    setResult(null);
    setProgress(0);
    setAnimateReveal(false);
    if (!selectedTemplateId && !customTemplateFile) {
      setResult({ jobId: 'n/a', status: 'failed', error: 'يرجى اختيار قالب أو رفع صورة' });
      return;
    }
    if (!fabricFile && !fabricImageUrl) {
      setResult({ jobId: 'n/a', status: 'failed', error: 'يرجى اختيار القماش' });
      return;
    }
    if (fabricFile && !validateFile(fabricFile)) return;

    setLoading(true);
    
    // Scroll to result area
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
    try {
      setProgress(10);
      let fabricBase64: string | null = null;
      let fabricMimeType: string | null = null;
      if (fabricFile) {
        const resized = await resizeImage(fabricFile, 1024);
        setProgress(25);
        const { base64, mimeType } = await fileToBase64(resized);
        fabricBase64 = base64;
        fabricMimeType = mimeType;
        setProgress(40);
      } else {
        // URL-based fabric selection (server will fetch it)
        setProgress(40);
      }

      // Use custom template or predefined template ID
      const templateId = customTemplateFile ? 'custom-upload' : selectedTemplateId!;

      const payload: TryOnRequest = {
        garmentTemplateId: templateId,
        ...(fabricBase64
          ? { fabricImageBase64: fabricBase64, fabricMimeType: fabricMimeType || undefined }
          : { fabricImageUrl: fabricImageUrl || undefined }),
        options: {
          ...options,
          fabricScale: Math.max(0.5, Math.min(3, Number(options.fabricScale ?? 1))),
        },
      };

      // If custom template, convert to base64 and add to payload
      if (customTemplateFile) {
        const templateResized = await resizeImage(customTemplateFile, 1024);
        const templateData = await fileToBase64(templateResized);
        // Use garmentTemplateImageUrl as data URL for custom uploads
        payload.garmentTemplateImageUrl = `data:${templateData.mimeType};base64,${templateData.base64}`;
      }

      setProgress(50);
      const resp = await generateTryOn(payload);
      setProgress(90);
      setResult(resp);

      if (resp.status === 'completed' && resp.resultImageUrl) {
        setProgress(100);
        // Trigger reveal animation after a short delay
        setTimeout(() => setAnimateReveal(true), 300);
        // Keep result for display; apply only when user clicks "Save to Project".
      }
    } catch (e: any) {
      setResult({ jobId: 'n/a', status: 'failed', error: e?.message || 'Request failed' });
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 500);
    }
  };

  const onSave = () => {
    if (result?.status !== 'completed' || !result.resultImageUrl) return;
    onApplyResult({ jobId: result.jobId, resultImageUrl: result.resultImageUrl });
  };

  const onRetry = React.useCallback(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div className="space-y-3">
      <div ref={topRef} className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-black text-slate-900 dark:text-white">جرّب القماش على القالب</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">قوالب فقط. ممنوع الصور الشخصية في هذا التدفق.</div>
          </div>
          <div className="shrink-0 text-[10px] font-bold text-slate-500 dark:text-slate-400 px-2 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
            AI Try-On
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div 
            className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 cursor-pointer hover:border-violet-500 transition-all group"
            onClick={() => setShowTemplateImageLibrary(true)}
          >
            <div className="absolute top-0 left-0 text-[9px] bg-violet-500 text-white px-1 py-0.5 z-[9999]">TRYON-TEMPLATE-CARD</div>
            {customTemplatePreview ? (
              <img src={customTemplatePreview} alt="Custom template" className="w-full h-full object-contain" />
            ) : selectedTemplateId && GARMENT_TEMPLATES.find(t => t.id === selectedTemplateId) ? (
              <img src={GARMENT_TEMPLATES.find(t => t.id === selectedTemplateId)!.imageUrl} alt="Template" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                <svg className="w-12 h-12 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs font-bold">اختر القالب</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs font-bold border border-white/30">
                اختر القالب
              </div>
            </div>
            <div className="absolute top-2 right-2 bg-violet-600 text-white text-[10px] px-2 py-1 rounded-full font-bold">القالب</div>
          </div>

          <div 
            className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 cursor-pointer hover:border-blue-500 transition-all group"
            onClick={() => setShowFabricPicker(true)}
          >
            <div className="absolute top-0 left-0 text-[9px] bg-blue-500 text-white px-1 py-0.5 z-[9999]">TRYON-FABRIC-CARD</div>
            {fabricPreview ? (
              <img src={fabricPreview} alt="Fabric preview" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                <svg className="w-12 h-12 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                <span className="text-xs font-bold">اختر القماش</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs font-bold border border-white/30">
                اختر القماش
              </div>
            </div>
            <div className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] px-2 py-1 rounded-full font-bold">القماش</div>
          </div>
        </div>

        {/* Template picker modal */}
        {showTemplateImageLibrary && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowTemplateImageLibrary(false)}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">اختر القالب</h3>
                <button onClick={() => setShowTemplateImageLibrary(false)} className="text-slate-500 hover:text-slate-700">✕</button>
              </div>
              <TemplatePicker templates={GARMENT_TEMPLATES} selectedId={selectedTemplateId} onSelect={(id) => { setSelectedTemplateId(id); setCustomTemplateFile(null); setCustomTemplatePreview(null); setShowTemplateImageLibrary(false); }} />
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-2">أو ارفع قالب مخصص</label>
                <div className="mb-3 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/20 p-3 text-[11px] text-amber-900 dark:text-amber-200">
                  <div className="font-black mb-1">تنبيه</div>
                  <div>برفعك للقالب أنت تؤكد أن لديك حق استخدام الصورة، وأنها لا تحتوي على أشخاص/صور شخصية أو بيانات حساسة. أنت تتحمل المسؤولية عن المحتوى المرفوع.</div>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => { onTemplateUpload(e.target.files?.[0] || null); setShowTemplateImageLibrary(false); }}
                  className="block w-full text-sm text-slate-700 dark:text-slate-200 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-bold file:text-slate-700 hover:file:bg-slate-200 dark:file:bg-slate-800 dark:file:text-slate-100 dark:hover:file:bg-slate-700"
                />
              </div>
            </div>
          </div>
        )}

        {showFabricImageLibrary && (
          <ImageLibraryPicker
            onSelect={(url) => {
              onFabricUrlSelect(url);
              setShowFabricImageLibrary(false);
            }}
            onClose={() => setShowFabricImageLibrary(false)}
          />
        )}

        {/* Fabric picker modal */}
        {showFabricPicker && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowFabricPicker(false)}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">اختر القماش:</h3>
                <button onClick={() => setShowFabricPicker(false)} className="text-slate-500 hover:text-slate-700">✕</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-all text-right bg-slate-50/60 dark:bg-slate-800/40"
                  onClick={() => {
                    setShowFabricPicker(false);
                    setShowFabricImageLibrary(true);
                  }}
                >
                  <div className="font-black text-sm text-slate-900 dark:text-white">من مكتبة خيوط</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">اختيار قماش جاهز</div>
                </button>

                <button
                  type="button"
                  className="p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-slate-400 transition-all text-right bg-slate-50/60 dark:bg-slate-800/40"
                  onClick={() => {
                    setShowFabricPicker(false);
                    window.location.hash = '#/portfolio-management';
                  }}
                >
                  <div className="font-black text-sm text-slate-900 dark:text-white">من مجموعتي</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">صورك المحفوظة</div>
                </button>

                <button
                  type="button"
                  className="p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-slate-400 transition-all text-right bg-slate-50/60 dark:bg-slate-800/40"
                  onClick={() => {
                    setShowFabricPicker(false);
                    window.location.hash = '#/shops';
                  }}
                >
                  <div className="font-black text-sm text-slate-900 dark:text-white">تصفح المحلات</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">اكتشف أقمشة المتاجر</div>
                </button>

                <button
                  type="button"
                  className="p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 transition-all text-right bg-slate-50/60 dark:bg-slate-800/40"
                  onClick={() => {
                    document.getElementById('tryon-fabric-upload')?.click();
                  }}
                >
                  <div className="font-black text-sm text-slate-900 dark:text-white">رفع صورة</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">من جهازك</div>
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/20 p-4 text-[11px] text-amber-900 dark:text-amber-200 space-y-2">
                <div className="font-black">تنبيه مهم قبل رفع الصورة</div>
                <div>ارفع صورة قماش/نقشة فقط (لقطة قريبة). ممنوع الصور الشخصية أو أي صور خاصة.</div>
                <div>برفعك للصورة أنت تؤكد أن لديك حق استخدامها وتتحمل المسؤولية الكاملة عن المحتوى المرفوع.</div>
              </div>

              <input
                id="tryon-fabric-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  onFabricChange(e.target.files?.[0] || null);
                  setShowFabricPicker(false);
                }}
                className="hidden"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">الرقبة</label>
            <select
              value={options.neckStyle || 'keep'}
              onChange={(e) => setOptions((o) => ({ ...o, neckStyle: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            >
              <option value="keep">بدون تغيير</option>
              <option value="round">دائرية</option>
              <option value="v">V</option>
              <option value="collar">ياقة</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">الأكمام</label>
            <select
              value={options.sleeveStyle || 'keep'}
              onChange={(e) => setOptions((o) => ({ ...o, sleeveStyle: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            >
              <option value="keep">بدون تغيير</option>
              <option value="long">طويل</option>
              <option value="short">قصير</option>
              <option value="none">بدون</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">التطريز</label>
            <select
              value={options.embroideryStyle || 'keep'}
              onChange={(e) => setOptions((o) => ({ ...o, embroideryStyle: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            >
              <option value="keep">بدون تغيير</option>
              <option value="chest">صدر</option>
              <option value="collar">ياقة</option>
              <option value="full">كامل</option>
              <option value="none">بدون</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">مقياس النقشة</label>
            <input
              type="range"
              min={0.5}
              max={3}
              step={0.1}
              value={options.fabricScale ?? 1}
              onChange={(e) => setOptions((o) => ({ ...o, fabricScale: Number(e.target.value) }))}
              className="w-full"
            />
            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{(options.fabricScale ?? 1).toFixed(1)}x</div>
          </div>
        </div>

        <button
          type="button"
          onClick={onGenerate}
          disabled={loading}
          className="w-full px-4 py-3 rounded-2xl text-sm font-black bg-gradient-to-r from-violet-600 to-indigo-600 text-white disabled:opacity-60"
        >
          {loading ? 'جارِ التوليد...' : 'توليد (Try Fabric)'}
        </button>

        <button
          type="button"
          onClick={() => setShowDebugView(!showDebugView)}
          className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors"
        >
          {showDebugView ? 'إخفاء عرض التصحيح' : 'عرض الصور الكاملة (Debug)'}
        </button>
      </div>

      <TryOnResult 
        ref={resultRef}
        result={result} 
        loading={loading} 
        progress={progress}
        originalImageUrl={customTemplatePreview || (selectedTemplateId ? GARMENT_TEMPLATES.find(t => t.id === selectedTemplateId)?.imageUrl : undefined)}
        onSaveToProject={onSave}
        onRetry={onRetry}
        animateReveal={animateReveal}
      />

      {/* DEBUG VIEW - Show all images at full size */}
      {showDebugView && (
        <div className="rounded-3xl border-4 border-amber-500 bg-white dark:bg-slate-900 p-6 space-y-6">
          <div className="text-center">
            <div className="inline-block px-4 py-2 rounded-full bg-amber-500 text-white font-black text-sm mb-4">
              🔍 DEBUG VIEW - عرض الصور الكاملة
            </div>
          </div>

          {/* Template Image */}
          <div className="space-y-2">
            <div className="text-sm font-bold text-slate-900 dark:text-white bg-violet-100 dark:bg-violet-900/30 px-3 py-2 rounded-lg">
              1️⃣ القالب (Template)
            </div>
            {customTemplatePreview ? (
              <div className="border-2 border-violet-500 rounded-xl p-2 bg-slate-50 dark:bg-slate-800">
                <img src={customTemplatePreview} alt="Template Debug" className="max-w-full h-auto" />
                <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                  المصدر: قالب مخصص مرفوع
                </div>
              </div>
            ) : selectedTemplateId && GARMENT_TEMPLATES.find(t => t.id === selectedTemplateId) ? (
              <div className="border-2 border-violet-500 rounded-xl p-2 bg-slate-50 dark:bg-slate-800">
                <img src={GARMENT_TEMPLATES.find(t => t.id === selectedTemplateId)!.imageUrl} alt="Template Debug" className="max-w-full h-auto" />
                <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                  المصدر: قالب من المكتبة ({selectedTemplateId})
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-500 py-8 border-2 border-dashed border-slate-300 rounded-xl">
                لم يتم اختيار قالب
              </div>
            )}
          </div>

          {/* Fabric Image */}
          <div className="space-y-2">
            <div className="text-sm font-bold text-slate-900 dark:text-white bg-blue-100 dark:bg-blue-900/30 px-3 py-2 rounded-lg">
              2️⃣ القماش (Fabric)
            </div>
            {fabricPreview ? (
              <div className="border-2 border-blue-500 rounded-xl p-2 bg-slate-50 dark:bg-slate-800">
                <img src={fabricPreview} alt="Fabric Debug" className="max-w-full h-auto" />
                <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                  المصدر: قماش مرفوع من الجهاز
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-500 py-8 border-2 border-dashed border-slate-300 rounded-xl">
                لم يتم رفع قماش
              </div>
            )}
          </div>

          {/* Result Image */}
          <div className="space-y-2">
            <div className="text-sm font-bold text-slate-900 dark:text-white bg-green-100 dark:bg-green-900/30 px-3 py-2 rounded-lg">
              3️⃣ النتيجة (Result)
            </div>
            {result?.status === 'completed' && (result.resultImageUrl || result.resultImageDataUrl) ? (
              <div className="border-2 border-green-500 rounded-xl p-2 bg-slate-50 dark:bg-slate-800">
                <img 
                  src={result.resultImageUrl || result.resultImageDataUrl} 
                  alt="Result Debug" 
                  className="max-w-full h-auto" 
                />
                <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                  Job ID: {result.jobId}
                </div>
              </div>
            ) : result?.status === 'failed' ? (
              <div className="text-center text-red-500 py-8 border-2 border-dashed border-red-300 rounded-xl">
                فشل التوليد: {result.error}
              </div>
            ) : loading ? (
              <div className="text-center text-slate-500 py-8 border-2 border-dashed border-slate-300 rounded-xl">
                جارِ التوليد...
              </div>
            ) : (
              <div className="text-center text-slate-500 py-8 border-2 border-dashed border-slate-300 rounded-xl">
                لم يتم توليد نتيجة بعد
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
