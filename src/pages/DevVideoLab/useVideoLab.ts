import * as React from 'react';

export type VideoLabTransition =
  | 'cut'
  | 'crossfade'
  | 'fade'
  | 'slide-left'
  | 'slide-right'
  | 'zoom'
  | 'tryon-slider';

export type VideoLabParams = {
  transition: VideoLabTransition;
  secondsPerImage: number;
  transitionSeconds: number;
  fps: number;
  width: number;
  height: number;
  beforeLabel: string;
  afterLabel: string;
  sliderLoops: number;
  sliderWaitSeconds: number;
};

export function computeTotalDuration(params: VideoLabParams): {
  overlapSeconds: number;
  totalSeconds: number;
} {
  if (params.transition === 'tryon-slider') {
    const loops = Math.max(1, Math.floor(Number(params.sliderLoops) || 1));
    const epsilon = 1.0 / Math.max(1, Number(params.fps) || 24);
    const waitS = Math.max(0, Number(params.sliderWaitSeconds) || 0);
    const slideS = Math.max(0.01, Number(params.transitionSeconds) || 0);
    const sliderDuration = slideS * (2 * loops - 1) + waitS * (2 * loops - 2);
    const total = sliderDuration + epsilon;
    return { overlapSeconds: 0, totalSeconds: Math.max(0, total) };
  }

  const per = Math.max(0, Number(params.secondsPerImage) || 0);
  const t = Math.max(0, Number(params.transitionSeconds) || 0);
  const overlap = params.transition === 'cut' ? 0 : Math.min(t, per);

  const total = per * 2 - overlap;
  return { overlapSeconds: overlap, totalSeconds: Math.max(0, total) };
}

const DEFAULTS: VideoLabParams = {
  transition: 'crossfade',
  secondsPerImage: 2,
  transitionSeconds: 0.5,
  fps: 24,
  width: 720,
  height: 960,
  beforeLabel: 'قبل',
  afterLabel: 'بعد',
  sliderLoops: 1,
  sliderWaitSeconds: 0.2,
};

export function useVideoLab() {
  const [imageA, setImageA] = React.useState<File | null>(null);
  const [imageB, setImageB] = React.useState<File | null>(null);
  const [params, setParams] = React.useState<VideoLabParams>(DEFAULTS);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [videoUrl, setVideoUrl] = React.useState<string | null>(null);
  const [serverOk, setServerOk] = React.useState<boolean | null>(null);

  const checkServer = React.useCallback(async () => {
    try {
      const res = await fetch('/video-lab-api/health', { method: 'GET' });
      const ok = res.ok;
      setServerOk(ok);
      return ok;
    } catch {
      setServerOk(false);
      return false;
    }
  }, []);

  React.useEffect(() => {
    void checkServer();
  }, [checkServer]);

  // When hot-reloading or migrating defaults, ensure any newly-added fields are present.
  React.useEffect(() => {
    setParams((p) => ({ ...DEFAULTS, ...p }));
  }, []);

  React.useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  const canGenerate = !!imageA && !!imageB && !isGenerating && serverOk !== false;

  const updateParams = React.useCallback((patch: Partial<VideoLabParams>) => {
    setParams((p) => ({ ...p, ...patch }));
  }, []);

  const generate = React.useCallback(async () => {
    if (!imageA || !imageB) return;

    setIsGenerating(true);
    setError(null);

    try {
      const ok = await checkServer();
      if (!ok) {
        throw new Error(
          'Python video server is not running. Start tools/video_lab/server.py then try again.'
        );
      }

      const form = new FormData();
      form.append('imageA', imageA);
      form.append('imageB', imageB);
      form.append('transition', params.transition);
      form.append('secondsPerImage', String(params.secondsPerImage));
      form.append('transitionSeconds', String(params.transitionSeconds));
      form.append('fps', String(params.fps));
      form.append('width', String(params.width));
      form.append('height', String(params.height));
      form.append('beforeLabel', params.beforeLabel);
      form.append('afterLabel', params.afterLabel);
      form.append('sliderLoops', String(params.sliderLoops));
      form.append('sliderWaitSeconds', String(params.sliderWaitSeconds));

      const res = await fetch('/video-lab-api/generate', {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Generation failed (${res.status})`);
      }

      const blob = await res.blob();
      const nextUrl = URL.createObjectURL(blob);
      setVideoUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return nextUrl;
      });
    } catch (e: any) {
      setError(e?.message || 'Unknown error');
    } finally {
      setIsGenerating(false);
    }
  }, [imageA, imageB, params, checkServer]);

  const reset = React.useCallback(() => {
    setImageA(null);
    setImageB(null);
    setParams(DEFAULTS);
    setError(null);
    setVideoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  return {
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
  };
}
