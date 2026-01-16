export type FaceBoxPct = {
  x: number; // 0..100
  y: number; // 0..100
  w: number; // 0..100
  h: number; // 0..100
};

export type ExportCroppedImageArgs = {
  image: HTMLImageElement;
  cropPx: { x: number; y: number; width: number; height: number };
  fileName?: string;
  outputMime?: 'image/jpeg' | 'image/png' | 'image/webp';
  outputQuality?: number; // 0..1 for jpeg/webp
  maxSide?: number;
  hideFaceEnabled?: boolean;
  hideMode?: 'blur' | 'sticker';
  stickerShape?: 'circle' | 'rounded';
  blurPx?: number;
  faceBoxPct?: FaceBoxPct | null;
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = clamp(r, 0, Math.min(w, h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

async function canvasToFile(canvas: HTMLCanvasElement, fileName: string, mime: string, quality?: number): Promise<File> {
  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (!b) reject(new Error('Failed to export image'));
        else resolve(b);
      },
      mime,
      quality
    );
  });

  return new File([blob], fileName, { type: mime });
}

export async function exportCroppedImage(args: ExportCroppedImageArgs): Promise<File> {
  const {
    image,
    cropPx,
    fileName = 'image.jpg',
    outputMime = 'image/jpeg',
    outputQuality = 0.92,
    maxSide = 1536,
    hideFaceEnabled = false,
    hideMode = 'blur',
    stickerShape = 'circle',
    blurPx = 14,
    faceBoxPct = null,
  } = args;

  const safeCrop = {
    x: Math.round(cropPx.x),
    y: Math.round(cropPx.y),
    width: Math.round(cropPx.width),
    height: Math.round(cropPx.height),
  };

  const srcW = Math.max(1, safeCrop.width);
  const srcH = Math.max(1, safeCrop.height);

  const scale = Math.min(1, maxSide / Math.max(srcW, srcH));
  const outW = Math.max(1, Math.round(srcW * scale));
  const outH = Math.max(1, Math.round(srcH * scale));

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  // Crop draw
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, safeCrop.x, safeCrop.y, srcW, srcH, 0, 0, outW, outH);

  // Optional face hide (on the already-cropped output)
  if (hideFaceEnabled && faceBoxPct) {
    const fx = (faceBoxPct.x / 100) * outW;
    const fy = (faceBoxPct.y / 100) * outH;
    const fw = (faceBoxPct.w / 100) * outW;
    const fh = (faceBoxPct.h / 100) * outH;

    if (fw > 2 && fh > 2) {
      if (hideMode === 'blur') {
        // Blur by re-drawing the canvas content into a clipped region with a blur filter.
        ctx.save();
        ctx.beginPath();
        ctx.rect(fx, fy, fw, fh);
        ctx.clip();
        ctx.filter = `blur(${blurPx}px)`;
        ctx.drawImage(canvas, 0, 0);
        ctx.restore();
      } else {
        // Sticker overlay
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.35)';
        ctx.shadowBlur = 14;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = 'rgba(0,0,0,0.72)';

        if (stickerShape === 'circle') {
          const cx = fx + fw / 2;
          const cy = fy + fh / 2;
          const r = Math.max(fw, fh) / 2;
          ctx.beginPath();
          ctx.ellipse(cx, cy, r, r, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          roundedRectPath(ctx, fx, fy, fw, fh, Math.min(fw, fh) * 0.22);
          ctx.fill();
        }

        ctx.restore();
      }
    }
  }

  const outName = (() => {
    const hasExt = /\.[a-zA-Z0-9]+$/.test(fileName);
    const ext = outputMime === 'image/png' ? 'png' : outputMime === 'image/webp' ? 'webp' : 'jpg';
    if (!hasExt) return `${fileName}.${ext}`;
    return fileName.replace(/\.[a-zA-Z0-9]+$/, `.${ext}`);
  })();

  return canvasToFile(canvas, outName, outputMime, outputMime === 'image/png' ? undefined : outputQuality);
}
