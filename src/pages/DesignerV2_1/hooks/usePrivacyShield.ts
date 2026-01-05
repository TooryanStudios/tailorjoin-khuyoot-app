import { useState, useCallback } from 'react';
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';

export type MaskingStyle = 'feathered-blur' | 'pixelate' | 'emoji';

export const usePrivacyShield = () => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [maskingStyle, setMaskingStyle] = useState<MaskingStyle>('feathered-blur');
  const [blurStrength, setBlurStrength] = useState(30);
  const [selectedEmoji, setSelectedEmoji] = useState('😊');

  const processImage = useCallback(async (file: File): Promise<File> => {
    console.log('[PrivacyShield] processImage called - isEnabled:', isEnabled, 'style:', maskingStyle);
    
    // Always return original if disabled - fast path
    if (!isEnabled) {
      console.log('[PrivacyShield] Mode disabled, returning original file');
      return file;
    }

    console.log('[PrivacyShield] Mode enabled, processing file:', file.name);
    setIsProcessing(true);

    try {
      // Initialize MediaPipe Vision
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      
      const detector = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
          delegate: 'GPU'
        },
        runningMode: 'IMAGE'
      });

      // Create image bitmap from file
      const img = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.warn('[PrivacyShield] Failed to get canvas context');
        setIsProcessing(false);
        return file;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Detect faces
      const result = detector.detect(img);
      const detections = result?.detections || [];

      if (detections.length > 0) {
        console.log(`[PrivacyShield] Detected ${detections.length} face(s), applying ${maskingStyle}`);
        
        detections.forEach(detection => {
          const { originX, originY, width, height } = detection.boundingBox;
          
          // Apply masking based on selected style
          switch (maskingStyle) {
            case 'feathered-blur':
              // Oval blur with soft edges
              const padding = 0.2;
              const paddedX = originX - (width * padding / 2);
              const paddedY = originY - (height * padding / 2);
              const paddedWidth = width * (1 + padding);
              const paddedHeight = height * (1 + padding);
              const centerX = paddedX + paddedWidth / 2;
              const centerY = paddedY + paddedHeight / 2;
              
              ctx.save();
              ctx.beginPath();
              ctx.ellipse(centerX, centerY, paddedWidth / 2, paddedHeight / 2, 0, 0, Math.PI * 2);
              ctx.clip();
              ctx.filter = `blur(${blurStrength}px)`;
              ctx.drawImage(img, 0, 0);
              ctx.restore();
              break;
              
            case 'pixelate':
              // Pixelation effect
              const pixelSize = 15;
              ctx.save();
              ctx.imageSmoothingEnabled = false;
              
              // Create temp canvas for pixelation
              const tempCanvas = document.createElement('canvas');
              const tempCtx = tempCanvas.getContext('2d')!;
              tempCanvas.width = width / pixelSize;
              tempCanvas.height = height / pixelSize;
              
              // Downscale
              tempCtx.drawImage(canvas, originX, originY, width, height, 0, 0, tempCanvas.width, tempCanvas.height);
              
              // Upscale back
              ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, originX, originY, width, height);
              ctx.restore();
              break;
              
            case 'emoji':
              // No blur - just emoji overlay for clean look
              ctx.save();
              ctx.font = `${height * 0.7}px Arial`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(selectedEmoji, originX + width / 2, originY + height / 2);
              ctx.restore();
              break;
          }
        });

        // Convert canvas to blob and then to file
        return new Promise<File>((resolve) => {
          canvas.toBlob((blob) => {
            setIsProcessing(false);
            if (blob) {
              resolve(new File([blob], file.name, { type: file.type }));
            } else {
              resolve(file); // Fallback to original
            }
          });
        });
      } else {
        console.log('[PrivacyShield] No faces detected');
        setIsProcessing(false);
        return file; // Return original on error
      }
    } catch (error) {
      console.error('[PrivacyShield] Processing failed:', error);
      setIsProcessing(false);
      return file; // Return original on error
    }
  }, [isEnabled, maskingStyle, blurStrength, selectedEmoji]);

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
    isProcessingPrivacy: isProcessing
  };
};
