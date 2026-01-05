import React, { useState } from 'react';
import { fal } from '@fal-ai/client';

const falApiKey = import.meta.env.VITE_FAL_KEY;

if (falApiKey) {
  fal.config({ credentials: falApiKey });
} else if (import.meta.env.DEV) {
  console.warn('VITE_FAL_KEY is not set. Virtual try-on requests will fail until it is configured.');
}

type ImageDataUrl = string | null;

type FalTryOnResult = {
  images?: { url?: string }[];
};

const MODEL_OPTIONS = [
  { id: 'fal-ai/leffa/virtual-tryon', label: 'Recommended - fal-ai/leffa/virtual-tryon' },
  { id: 'fal-ai/fashn/tryon/v1.5', label: 'Classic - fal-ai/fashn/tryon/v1.5' },
  { id: 'fal-ai/image-apps-v2/virtual-try-on', label: 'Alternative - fal-ai/image-apps-v2/virtual-try-on' },
  { id: 'gemini/fabric-tryon', label: 'Gemini (server) - fabric swap' },
];

export function TryOnPage() {
  const [personImage, setPersonImage] = useState<ImageDataUrl>(null);
  const [garmentImage, setGarmentImage] = useState<ImageDataUrl>(null);
  const [resultImage, setResultImage] = useState<ImageDataUrl>(null);
  const [modelId, setModelId] = useState<string>(MODEL_OPTIONS[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compareSplit, setCompareSplit] = useState(50);
  const seed = 1234; // fixed seed to help keep identity stable

  const parseDataUrl = (dataUrl: string) => {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      throw new Error('Only base64 data URLs are supported for this comparison');
    }
    return { mimeType: match[1], base64: match[2] };
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    setter: (value: ImageDataUrl) => void,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const value = typeof reader.result === 'string' ? reader.result : null;
      setter(value);
    };
    reader.readAsDataURL(file);
  };

  const runTryOn = async () => {
    if (!personImage || !garmentImage) {
      setError('Please upload both photos first.');
      return;
    }

    if (!falApiKey) {
      setError('VITE_FAL_KEY is missing. Add it to your .env.local before running try-on.');
      return;
    }

    setLoading(true);
    setError(null);
    setResultImage(null);

    try {
      if (modelId === 'gemini/fabric-tryon') {
        const template = parseDataUrl(personImage);
        const fabric = parseDataUrl(garmentImage);

        const resp = await fetch('/api/tryon/fabric', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            garmentTemplateId: 'custom-upload',
            garmentTemplateImageUrl: personImage,
            fabricImageBase64: fabric.base64,
            fabricMimeType: fabric.mimeType,
            garmentTemplateWidth: undefined,
            garmentTemplateHeight: undefined,
            options: {
              fabricScale: 1,
              neckStyle: 'keep',
              sleeveStyle: 'keep',
              embroideryStyle: 'keep',
              colorPreservation: 'high',
            },
          }),
        });

        if (!resp.ok) {
          const errBody = await resp.json().catch(() => ({} as any));
          throw new Error(errBody?.error || 'Gemini try-on failed');
        }
        const data = await resp.json();
        const outputUrl = data.resultImageDataUrl || data.resultImageUrl || null;
        if (!outputUrl) {
          throw new Error('No image returned from Gemini try-on');
        }
        setResultImage(outputUrl);
        return;
      }

      const input = (() => {
        if (modelId === 'fal-ai/leffa/virtual-tryon') {
          return {
            human_image_url: personImage,
            garment_image_url: garmentImage,
            garment_type: 'upper_body',
            num_inference_steps: 30,
            guidance_scale: 2.5,
            sync_mode: true,
            seed,
          };
        }
        if (modelId === 'fal-ai/fashn/tryon/v1.5') {
          return {
            model_image: personImage,
            garment_image: garmentImage,
            category: 'tops',
            mode: 'quality',
            garment_photo_type: 'auto',
            segmentation_free: false,
            seed,
            num_samples: 1,
          };
        }
        return {
          person_image_url: personImage,
          clothing_image_url: garmentImage,
          preserve_pose: true,
          seed,
        };
      })();

      const result = await fal.subscribe(modelId, { input });

      // The SDK returns shapes like:
      // { images: [...] }
      // { data: { images: [...] } }
      // { data: { output: { images: [...] } } }
      // { data: { response: { output: { images: [...] } } } }
      const images =
        (result as any)?.images ||
        (result as any)?.image ||
        (result as any)?.data?.images ||
        (result as any)?.data?.image ||
        (result as any)?.data?.output?.images ||
        (result as any)?.data?.output?.image ||
        (result as any)?.data?.response?.output?.images ||
        (result as any)?.data?.response?.output?.image;

      const pickUrl = (val: any) => {
        if (!val) return null;
        if (Array.isArray(val)) return val[0]?.url || null;
        if (typeof val === 'object') return val.url || null;
        return null;
      };

      const outputUrl = pickUrl(images);
      if (!outputUrl) {
        console.warn('Fal try-on result payload', result);
        throw new Error('No image returned from the model.');
      }

      setResultImage(outputUrl);
    } catch (err) {
      console.error('Fal VTON error:', err);
      const message = err instanceof Error ? err.message : 'Unexpected error while running try-on.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 rounded-2xl bg-slate-900 p-8 shadow-xl ring-1 ring-emerald-500/10">
        <div className="flex flex-col gap-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Virtual Try-On Lab</p>
          <h1 className="text-3xl font-bold text-white">Khiyoot: VTON test bench</h1>
          <p className="text-sm text-slate-300">Upload a customer photo and a fabric/dishdasha photo to preview a stitched look.</p>
        </div>

        <div className="grid gap-4 rounded-xl border border-slate-700 bg-slate-800/60 p-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-100">Model</label>
            <select
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 shadow-sm focus:border-emerald-500 focus:outline-none"
              value={modelId}
              onChange={(event) => setModelId(event.target.value)}
            >
              {MODEL_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-300">Recommended model is tuned for professional clothing; switch to the alternative for broader items.</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-100">Category & Mode</label>
            <div className="grid grid-cols-2 gap-3 text-sm text-slate-200">
              <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 shadow-sm">
                <p className="text-xs font-semibold text-slate-400">Category</p>
                <p className="font-semibold text-slate-50">tops</p>
                <p className="text-xs text-slate-400">Best fit for dishdashas and upper garments.</p>
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 shadow-sm">
                <p className="text-xs font-semibold text-slate-400">Mode</p>
                <p className="font-semibold text-slate-50">balanced</p>
                <p className="text-xs text-slate-400">Balanced quality vs. speed for quicker previews.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col items-stretch gap-3 rounded-xl border border-dashed border-slate-700 p-5">
            <label className="text-sm font-semibold text-slate-100">1. Upload customer photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => handleFileChange(event, setPersonImage)}
              className="text-sm"
            />
            {personImage && (
              <img
                src={personImage}
                alt="Customer"
                className="mt-2 h-56 w-full rounded-lg object-cover shadow-sm"
              />
            )}
          </div>

          <div className="flex flex-col items-stretch gap-3 rounded-xl border border-dashed border-slate-700 p-5">
            <label className="text-sm font-semibold text-slate-100">2. Upload fabric/dishdasha photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => handleFileChange(event, setGarmentImage)}
              className="text-sm"
            />
            {garmentImage && (
              <img
                src={garmentImage}
                alt="Garment"
                className="mt-2 h-56 w-full rounded-lg object-cover shadow-sm"
              />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={runTryOn}
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 px-6 py-4 text-base font-semibold text-white shadow-md transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading ? 'Stitching clothes... (about 15s)' : 'Try it on'}
          </button>

          {error && (
            <div className="rounded-lg border border-rose-500/50 bg-rose-950 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          )}
        </div>

        {resultImage && (
          <div className="flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-900 p-5">
            <div className="flex items-center gap-2 text-emerald-700">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <p className="text-sm font-semibold">Result ready</p>
            </div>
            <img
              src={resultImage}
              alt="Try-on result"
              className="mx-auto max-h-[480px] w-full max-w-xl rounded-2xl border border-white shadow-xl"
            />

            {personImage && (
              <div className="mt-4 rounded-lg border border-slate-700 bg-slate-900 p-4">
                <div className="mb-3 flex items-center justify-between text-sm font-semibold text-slate-100">
                  <span>Compare</span>
                  <span className="text-xs font-normal text-slate-300">Slide to compare customer vs. try-on</span>
                </div>

                <div className="relative h-80 overflow-hidden rounded-lg border border-slate-700 bg-slate-800">
                  <img
                    src={resultImage}
                    alt="Try-on comparison base"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ width: `${compareSplit}%` }}
                  >
                    <img
                      src={personImage}
                      alt="Customer reference overlay"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div
                    className="absolute inset-y-0 w-px bg-white/70 shadow-[0_0_6px_rgba(0,0,0,0.35)]"
                    style={{ left: `${compareSplit}%`, transform: 'translateX(-50%)' }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 rounded-full border border-white bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow-md"
                    style={{ left: `${compareSplit}%`, transform: 'translate(-50%, -50%)' }}
                  >
                    Drag
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-300">Customer</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={compareSplit}
                    onChange={(event) => setCompareSplit(Number(event.target.value))}
                    className="flex-1 accent-emerald-600"
                  />
                  <span className="text-xs font-semibold text-slate-300">Try-on</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TryOnPage;
