import * as React from 'react';
import { computeTotalDuration, useVideoLab } from './useVideoLab';

function NumberField(props: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  const { label, value, min, max, step, onChange } = props;
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</span>
      <input
        type="number"
        value={Number.isFinite(value) ? value : ''}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
      />
    </label>
  );
}

export default function DevVideoLabPage() {
  const {
    imageA,
    imageB,
    params,
    isGenerating,
    error,
    videoUrl,
    canGenerate,
    serverOk,
    checkServer,
    setImageA,
    setImageB,
    updateParams,
    generate,
    reset,
  } = useVideoLab();

  const timing = React.useMemo(() => computeTotalDuration(params), [params]);

  const previewStyle = React.useMemo<React.CSSProperties>(() => {
    const w = Math.max(1, Number(params.width) || 1);
    const h = Math.max(1, Number(params.height) || 1);

    // Keep the preview from dominating the column regardless of output dimensions.
    const maxPreviewW = 420;
    const maxPreviewH = 680;
    const scale = Math.min(1, maxPreviewW / w, maxPreviewH / h);
    const scaledW = Math.max(220, Math.round(w * scale));

    return {
      width: '100%',
      maxWidth: `${scaledW}px`,
      aspectRatio: `${w} / ${h}`,
    };
  }, [params.width, params.height]);

  const imgAPreview = React.useMemo(() => (imageA ? URL.createObjectURL(imageA) : null), [imageA]);
  const imgBPreview = React.useMemo(() => (imageB ? URL.createObjectURL(imageB) : null), [imageB]);

  React.useEffect(() => {
    return () => {
      if (imgAPreview) URL.revokeObjectURL(imgAPreview);
      if (imgBPreview) URL.revokeObjectURL(imgBPreview);
    };
  }, [imgAPreview, imgBPreview]);

  return (
    <div className="h-[100dvh] overflow-y-auto overscroll-contain bg-zinc-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Dev Tools</div>
            <h1 className="text-2xl font-extrabold mt-1">Video Lab (MoviePy)</h1>
            <p className="text-sm text-zinc-400 mt-2">
              Upload 2 images, pick a transition, generate an MP4 via a local Python server.
            </p>
          </div>
          <a
            href="/"
            className="px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/60 transition-colors text-sm"
          >
            Back
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Inputs</div>

            <div
              className={`mb-4 rounded-xl border p-3 text-sm flex items-center justify-between gap-3 ${
                serverOk === true
                  ? 'border-emerald-700 bg-emerald-950/30 text-emerald-200'
                  : serverOk === false
                    ? 'border-red-800 bg-red-950/30 text-red-200'
                    : 'border-zinc-800 bg-zinc-950/30 text-zinc-300'
              }`}
            >
              <div>
                {serverOk === true
                  ? 'Python server: Online'
                  : serverOk === false
                    ? 'Python server: Offline (start tools/video_lab/server.py)'
                    : 'Python server: Checking…'}
              </div>
              <button
                type="button"
                onClick={() => void checkServer()}
                className="px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/60 transition-colors text-xs"
              >
                Recheck
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-2">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Image A</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageA(e.currentTarget.files?.[0] || null)}
                  className="block w-full text-sm text-zinc-300 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500"
                />
                <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800">
                  {imgAPreview ? (
                    <img src={imgAPreview} className="absolute inset-0 w-full h-full object-cover" alt="A" />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-xs text-zinc-600">No image</div>
                  )}
                </div>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Image B</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageB(e.currentTarget.files?.[0] || null)}
                  className="block w-full text-sm text-zinc-300 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500"
                />
                <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800">
                  {imgBPreview ? (
                    <img src={imgBPreview} className="absolute inset-0 w-full h-full object-cover" alt="B" />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-xs text-zinc-600">No image</div>
                  )}
                </div>
              </label>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Transition</span>
                <select
                  value={params.transition}
                  onChange={(e) => updateParams({ transition: e.target.value as any })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                >
                  <option value="cut">Cut</option>
                  <option value="crossfade">Crossfade</option>
                  <option value="fade">Fade</option>
                  <option value="slide-left">Slide Left</option>
                  <option value="slide-right">Slide Right</option>
                  <option value="zoom">Zoom (Crossfade)</option>
                  <option value="tryon-slider">Try-On Slider (Before/After)</option>
                </select>
              </label>

              {params.transition === 'tryon-slider' ? (
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Before label</span>
                  <input
                    type="text"
                    value={params.beforeLabel}
                    onChange={(e) => updateParams({ beforeLabel: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                    placeholder="قبل / Before"
                  />
                </label>
              ) : null}

              {params.transition === 'tryon-slider' ? (
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider">After label</span>
                  <input
                    type="text"
                    value={params.afterLabel}
                    onChange={(e) => updateParams({ afterLabel: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                    placeholder="بعد / After"
                  />
                </label>
              ) : null}

              {params.transition === 'tryon-slider' ? (
                <NumberField
                  label="Slider loops"
                  value={params.sliderLoops}
                  min={1}
                  max={12}
                  step={1}
                  onChange={(v) => updateParams({ sliderLoops: Math.max(1, Math.floor(v || 1)) })}
                />
              ) : null}

              {params.transition === 'tryon-slider' ? (
                <NumberField
                  label="Wait time (seconds)"
                  value={params.sliderWaitSeconds}
                  min={0}
                  max={2}
                  step={0.05}
                  onChange={(v) => updateParams({ sliderWaitSeconds: Math.max(0, Number(v) || 0) })}
                />
              ) : null}

              {params.transition === 'tryon-slider' ? (
                <NumberField
                  label="Slide seconds (per slide)"
                  value={params.transitionSeconds}
                  min={0.05}
                  max={10}
                  step={0.05}
                  onChange={(v) => updateParams({ transitionSeconds: v })}
                />
              ) : (
                <>
                  <NumberField
                    label="Seconds per image"
                    value={params.secondsPerImage}
                    min={0.2}
                    max={10}
                    step={0.1}
                    onChange={(v) => updateParams({ secondsPerImage: v })}
                  />

                  <NumberField
                    label="Transition seconds"
                    value={params.transitionSeconds}
                    min={0}
                    max={3}
                    step={0.1}
                    onChange={(v) => updateParams({ transitionSeconds: v })}
                  />
                </>
              )}

              <NumberField
                label="FPS"
                value={params.fps}
                min={1}
                max={60}
                step={1}
                onChange={(v) => updateParams({ fps: v })}
              />

              <NumberField
                label="Width"
                value={params.width}
                min={64}
                max={1920}
                step={1}
                onChange={(v) => updateParams({ width: v })}
              />

              <NumberField
                label="Height"
                value={params.height}
                min={64}
                max={1920}
                step={1}
                onChange={(v) => updateParams({ height: v })}
              />
            </div>

            <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Timeline</div>
                <div className="text-xs text-zinc-300">
                  Total: <span className="font-semibold">{timing.totalSeconds.toFixed(2)}s</span>
                  {timing.overlapSeconds > 0 ? (
                    <>
                      {' '}
                      <span className="text-zinc-500">(overlap {timing.overlapSeconds.toFixed(2)}s)</span>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="mt-2">
                <div className="h-2 w-full rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
                  <div
                    className="h-full bg-purple-600"
                    style={{ width: '50%' }}
                    title="Image A"
                  />
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-zinc-900 overflow-hidden border border-zinc-800 relative">
                  <div className="absolute inset-y-0 left-0 w-1/2 bg-purple-600" title="Image B" />
                  {timing.overlapSeconds > 0 ? (
                    <div
                      className="absolute inset-y-0 left-[50%] -translate-x-1/2 w-10 bg-white/15"
                      title="Overlap"
                    />
                  ) : null}
                </div>
                <div className="mt-2 text-[11px] text-zinc-500">
                  {params.transition === 'tryon-slider'
                    ? 'Try-on slider animation (no seconds-per-image timeline).'
                    : `A then B${timing.overlapSeconds > 0 ? ' with overlap during transition' : ''}.`}
                </div>
              </div>
            </div>

            {error ? (
              <div className="mt-4 text-sm text-red-300 bg-red-950/30 border border-red-800 rounded-lg p-3 whitespace-pre-wrap">
                {error}
              </div>
            ) : null}

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => void generate()}
                disabled={!canGenerate}
                className={`px-4 py-3 rounded-xl font-extrabold tracking-wide text-base transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-purple-500/40 border w-full ${
                  !canGenerate
                    ? 'bg-purple-600/60 text-white cursor-not-allowed border-purple-500/20'
                    : 'bg-purple-600 hover:bg-purple-500 text-white active:scale-95 border-purple-500/40 hover:border-purple-400/60'
                }`}
              >
                {isGenerating ? 'Generating…' : 'Generate Video'}
              </button>
              <button
                onClick={reset}
                className="px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/60 transition-colors text-sm"
              >
                Reset
              </button>
            </div>

            <div className="mt-3 text-[11px] text-zinc-500">
              Needs local python server: <span className="text-zinc-300">tools/video_lab/server.py</span>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Output</div>

            <div className="flex justify-center">
              <div
                className="relative rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800"
                style={previewStyle}
              >
                {videoUrl ? (
                  <video
                    src={videoUrl}
                    controls
                    preload="metadata"
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-sm text-zinc-600">
                    Generate to preview the video
                  </div>
                )}
              </div>
            </div>

            {videoUrl ? (
              <a
                className="mt-4 inline-flex items-center justify-center w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/60 transition-colors text-sm"
                href={videoUrl}
                download="video.mp4"
              >
                Download MP4
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
