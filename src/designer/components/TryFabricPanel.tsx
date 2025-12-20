import React from 'react';
import { TemplatePicker } from './TemplatePicker';
import { FabricUploader } from './FabricUploader';
import { TryOnResult } from './TryOnResult';
import { GARMENT_TEMPLATES } from '../templates/garmentTemplates';
import type { TryOnOptions, TryOnRequest, TryOnResponse } from '../../types/tryon';
import { resizeImage } from '../../utils/imageResize';
import { fileToBase64 } from '../../utils/fileToBase64';
import { generateTryOn } from '../../services/tryonService';

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
    if (!selectedTemplateId && !customTemplateFile) {
      setResult({ jobId: 'n/a', status: 'failed', error: 'يرجى اختيار قالب أو رفع صورة' });
      return;
    }
    if (!fabricFile) {
      setResult({ jobId: 'n/a', status: 'failed', error: 'يرجى رفع صورة القماش' });
      return;
    }
    if (!validateFile(fabricFile)) return;

    setLoading(true);
    try {
      setProgress(10);
      const resized = await resizeImage(fabricFile, 1024);
      setProgress(25);
      const { base64, mimeType } = await fileToBase64(resized);
      setProgress(40);

      // Use custom template or predefined template ID
      const templateId = customTemplateFile ? 'custom-upload' : selectedTemplateId!;

      const payload: TryOnRequest = {
        garmentTemplateId: templateId,
        fabricImageBase64: base64,
        fabricMimeType: mimeType,
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

  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-black text-slate-900 dark:text-white">جرّب القماش على القالب</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">قوالب فقط. ممنوع الصور الشخصية في هذا التدفق.</div>
          </div>
          <div className="shrink-0 text-[10px] font-bold text-slate-500 dark:text-slate-400 px-2 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
            AI Try-On
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300">القالب</div>
          <TemplatePicker templates={GARMENT_TEMPLATES} selectedId={selectedTemplateId} onSelect={setSelectedTemplateId} />

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">أو ارفع قالب مخصص</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => onTemplateUpload(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-700 dark:text-slate-200 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-bold file:text-slate-700 hover:file:bg-slate-200 dark:file:bg-slate-800 dark:file:text-slate-100 dark:hover:file:bg-slate-700"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300">القماش</div>
          <FabricUploader value={fabricFile} onChange={onFabricChange} error={fabricError} />
        </div>

        {(customTemplatePreview || fabricPreview) ? (
          <div className="grid grid-cols-2 gap-2">
            <div className="relative w-full h-28 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              {customTemplatePreview ? (
                <img src={customTemplatePreview} alt="Custom template" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[11px] text-slate-400">لا يوجد قالب مخصص</div>
              )}
              <div className="absolute top-2 right-2 bg-violet-600 text-white text-[10px] px-2 py-1 rounded-full font-bold">القالب</div>
            </div>

            <div className="relative w-full h-28 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              {fabricPreview ? (
                <img src={fabricPreview} alt="Fabric preview" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[11px] text-slate-400">لا يوجد قماش</div>
              )}
              <div className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] px-2 py-1 rounded-full font-bold">القماش</div>
            </div>
          </div>
        ) : null}

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
      </div>

      <TryOnResult 
        result={result} 
        loading={loading} 
        progress={progress}
        originalImageUrl={customTemplatePreview || (selectedTemplateId ? GARMENT_TEMPLATES.find(t => t.id === selectedTemplateId)?.imageUrl : undefined)}
        onSaveToProject={onSave} 
      />
    </div>
  );
}
