import { useCallback, useEffect, useRef, useState } from 'react';
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';

/** @typedef {'feathered-blur'|'pixelate'|'emoji'} MaskingStyle */

async function resolveVision() {
  try {
    return await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );
  } catch {
    return await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm'
    );
  }
}

// Share the detector across ALL hook instances to avoid repeated WASM/model init.
let detectorSingleton = null;
let initPromiseSingleton = null;

/**
 * Modular Privacy Shield (DesignerV2_1-compatible API).
 * - Masks faces locally before upload/processing.
 * - Keeps MediaPipe detector cached to avoid repeated init.
 */
export const usePrivacyShield = () => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  /** @type {[MaskingStyle, Function]} */
  const [maskingStyle, setMaskingStyle] = useState('feathered-blur');
  const [blurStrength, setBlurStrength] = useState(30);
  const [selectedEmoji, setSelectedEmoji] = useState('😊');

  const ensureDetector = useCallback(async () => {
    if (detectorSingleton) return detectorSingleton;
    if (initPromiseSingleton) return initPromiseSingleton;

    initPromiseSingleton = (async () => {
      const vision = await resolveVision();
      const detector = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
          delegate: 'GPU',
        },
        runningMode: 'IMAGE',
      });

      detectorSingleton = detector;
      return detector;
    })();

    return initPromiseSingleton;
  }, []);

  useEffect(() => {
    if (!isEnabled) return;
    void ensureDetector();
  }, [ensureDetector, isEnabled]);

  const processImage = useCallback(
    /**
     * @param {File} file
     * @param {{ focusRect?: { x: number; y: number; width: number; height: number } }} [opts]
     */
    async (file, opts) => {
      if (!isEnabled) return file;

      setIsProcessing(true);
      try {
        const detector = await ensureDetector();
        const img = await createImageBitmap(file);

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return file;

        ctx.filter = 'none';
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(img, 0, 0);

        // Optional focused detection (e.g., within the crop box) improves detection
        // when the face is small in the full frame.
        /** @type {{ x:number; y:number; width:number; height:number } | null} */
        const focus = opts?.focusRect && Number.isFinite(opts.focusRect.x)
          ? {
              x: Math.max(0, Math.floor(opts.focusRect.x)),
              y: Math.max(0, Math.floor(opts.focusRect.y)),
              width: Math.max(1, Math.floor(opts.focusRect.width)),
              height: Math.max(1, Math.floor(opts.focusRect.height)),
            }
          : null;

        let detections = [];
        let offsetX = 0;
        let offsetY = 0;

        if (focus) {
          const fx = Math.min(canvas.width - 1, focus.x);
          const fy = Math.min(canvas.height - 1, focus.y);
          const fw = Math.min(canvas.width - fx, focus.width);
          const fh = Math.min(canvas.height - fy, focus.height);

          const focusCanvas = document.createElement('canvas');
          focusCanvas.width = fw;
          focusCanvas.height = fh;
          const fctx = focusCanvas.getContext('2d');
          if (fctx) {
            fctx.drawImage(img, fx, fy, fw, fh, 0, 0, fw, fh);
            const focusResult = detector.detect(focusCanvas);
            detections = focusResult?.detections || [];
            offsetX = fx;
            offsetY = fy;
          }
        } else {
          const result = detector.detect(img);
          detections = result?.detections || [];
        }

        if (!detections.length) return file;

        detections.forEach((detection) => {
          const bb = detection.boundingBox;
          if (!bb) return;

          const { originX, originY, width, height } = bb;
          const ox = originX + offsetX;
          const oy = originY + offsetY;

          switch (maskingStyle) {
            case 'feathered-blur': {
              const padding = 0.2;
              const paddedX = ox - (width * padding) / 2;
              const paddedY = oy - (height * padding) / 2;
              const paddedWidth = width * (1 + padding);
              const paddedHeight = height * (1 + padding);
              const centerX = paddedX + paddedWidth / 2;
              const centerY = paddedY + paddedHeight / 2;

              ctx.save();
              ctx.beginPath();
              ctx.ellipse(
                centerX,
                centerY,
                paddedWidth / 2,
                paddedHeight / 2,
                0,
                0,
                Math.PI * 2
              );
              ctx.clip();
              ctx.filter = `blur(${blurStrength}px)`;
              ctx.drawImage(img, 0, 0);
              ctx.restore();
              break;
            }
            case 'pixelate': {
              const pixelSize = 15;
              const sx = Math.max(0, Math.floor(ox));
              const sy = Math.max(0, Math.floor(oy));
              const sw = Math.min(canvas.width - sx, Math.ceil(width));
              const sh = Math.min(canvas.height - sy, Math.ceil(height));
              if (sw <= 0 || sh <= 0) return;

              const tempCanvas = document.createElement('canvas');
              const tw = Math.max(1, Math.floor(sw / pixelSize));
              const th = Math.max(1, Math.floor(sh / pixelSize));
              tempCanvas.width = tw;
              tempCanvas.height = th;
              const tctx = tempCanvas.getContext('2d');
              if (!tctx) return;

              tctx.imageSmoothingEnabled = false;
              tctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, tw, th);

              ctx.save();
              ctx.imageSmoothingEnabled = false;
              ctx.drawImage(tempCanvas, 0, 0, tw, th, sx, sy, sw, sh);
              ctx.restore();
              break;
            }
            case 'emoji': {
              ctx.save();
              ctx.font = `${height * 0.7}px Arial`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(selectedEmoji, ox + width / 2, oy + height / 2);
              ctx.restore();
              break;
            }
            default:
              break;
          }
        });

        const outputBlob = await new Promise((resolve) => {
          canvas.toBlob(
            (b) => resolve(b),
            file.type || 'image/jpeg',
            0.92
          );
        });

        if (!outputBlob) return file;
        return new File([outputBlob], file.name, { type: file.type || 'image/jpeg' });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[PrivacyShield] Processing failed:', error);
        return file;
      } finally {
        setIsProcessing(false);
      }
    },
    [blurStrength, ensureDetector, isEnabled, maskingStyle, selectedEmoji]
  );

  return {
    isPrivacyMode: isEnabled,
    setPrivacyMode: setIsEnabled,
    maskingStyle,
    setMaskingStyle,
    blurStrength,
    setBlurStrength,
    selectedEmoji,
    setSelectedEmoji,
    processImage,
    isProcessingPrivacy: isProcessing,
  };
};
