import React from 'react';
import { ChevronDown, Download, Loader2, Maximize2, Upload, ZoomIn, Info, Share2, Check, Copy, ExternalLink } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import ImageSlider from '../../components/DesignerV2_1/ImageSlider';
import { LightingPresets, getLightingDescriptor, type LightingPreset } from './components/LightingPresets';
import SegmentedToggle from '../../components/DesignerV2_1/SegmentedToggle';
import UpgradeModal from '../../components/DesignerV2_1/UpgradeModal';
import { FeatureToggleBar } from './components/FeatureToggleBar';
import { DesignerV2Features, DEFAULT_FEATURES, DesignerUIState } from './types';
import { generateFabricSwap } from '../../services/fabricSwapService';
import { firebaseService } from '../../../services/firebase';
import { getProductById } from '../../../services/mockService';
import { useApp } from '../../../context/AppContext';
import { useGenerationHistory } from './hooks/useGenerationHistory';
import { HistoryFilmstrip } from './components/HistoryFilmstrip';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ErrorModal } from './components/ErrorModal';
import { taskStorage, generateTaskId, copyTaskUrlToClipboard } from './services/taskStorage';
import { type DesignTask } from './types/task';
import { usePrivacyShield } from '../../modules/PrivacyShield';
import { TemplateSelectorView, useTemplateSelection } from '../../modules/TemplatePicker';
import { CreditBadge, useCredits } from '../../modules/CreditManager';
import { DesignerHeader } from '../../modules/navigation/DesignerHeader';
import { ProcessingOverlay } from '../../modules/canvas/components/ProcessingOverlay';
import { FabricSourceTile } from '../../modules/results/FabricSourceTile';
import { useLightingGenerator } from '../../modules/generator/hooks/useLightingGenerator';
import { useDesignerStore } from '../../store/useDesignerStore';
import { MobileDesignerV2, useMobileDetection } from '../../modules/designer/mobile';
import './DesignerV2_1.module.css';

// Placeholder for empty image state - use null to avoid empty src warnings
const ORIGINAL = null as string | null;

const DESIGNER_CACHE_VERSION = 1;

type DesignerCacheState = {
  v: number;
  selectedModel: 'NanoBana' | 'Pro';
  refinementPrompt: string;
  outputFit: 'contain' | 'cover';
  sliderPos: number;
  sourceImageBase64: string | null;
  sourceImageMimeType: string | null;
  fabricImageBase64: string | null;
  fabricImageMimeType: string | null;
  sourceForComparison: string;
  afterImage: string;
  activeId: string | null;
};

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function safeLocalStorageGet<T>(key: string): T | null {
  try {
    return safeJsonParse<T>(window.localStorage.getItem(key));
  } catch {
    return null;
  }
}

// Slider position persistence per generation
const SLIDER_POSITIONS_KEY = 'designer_v2_slider_positions';

function getSavedSliderPosition(imageId: string | null): number | null {
  if (!imageId) return null;
  try {
    const positions = safeLocalStorageGet<Record<string, number>>(SLIDER_POSITIONS_KEY);
    return positions?.[imageId] ?? null;
  } catch {
    return null;
  }
}

function saveSliderPosition(imageId: string | null, position: number): void {
  if (!imageId) return;
  try {
    const positions = safeLocalStorageGet<Record<string, number>>(SLIDER_POSITIONS_KEY) || {};
    positions[imageId] = position;
    window.localStorage.setItem(SLIDER_POSITIONS_KEY, JSON.stringify(positions));
  } catch (e) {
    console.warn('[SliderPersistence] Failed to save position:', e);
  }
}

function clearOldSliderPositions(keepIds: string[]): void {
  try {
    const positions = safeLocalStorageGet<Record<string, number>>(SLIDER_POSITIONS_KEY) || {};
    const filtered: Record<string, number> = {};
    keepIds.forEach(id => {
      if (positions[id] !== undefined) {
        filtered[id] = positions[id];
      }
    });
    window.localStorage.setItem(SLIDER_POSITIONS_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.warn('[SliderPersistence] Failed to clear old positions:', e);
  }
}

function safeLocalStorageSet(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota/security errors
  }
}

function toDataUrl(base64: string, mimeType: string) {
  return `data:${mimeType};base64,${base64}`;
}

function prefetchImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    if (!url) return resolve();
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}

function clamp01(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function fileToBase64NoPrefix(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  return arrayBufferToBase64(buf);
}

/**
 * Smart compression: Only compress images larger than 2MB to prevent ERR_CONNECTION_RESET
 * THIS RUNS IMMEDIATELY WHEN YOU UPLOAD - NOT during API call!
 * Smaller images pass through unchanged for maximum quality
 */
async function smartCompressImage(file: File): Promise<{ base64: string; mimeType: string }> {
  const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB threshold
  const MAX_DIMENSION = 1536; // Max dimension for large images
  
  // Normalize MIME type to supported formats only
  const normalizeMimeType = (type: string): string => {
    const normalizedType = (type || '').toLowerCase();
    if (normalizedType === 'image/jpg' || normalizedType === 'image/jpeg') return 'image/jpeg';
    if (normalizedType === 'image/webp') return 'image/webp';
    if (normalizedType === 'image/png') return 'image/png';
    // Default to PNG for unknown types
    return 'image/png';
  };
  
  // If file is small enough, use original without compression
  if (file.size <= MAX_SIZE_BYTES) {
    const base64 = await fileToBase64NoPrefix(file);
    return { base64, mimeType: normalizeMimeType(file.type) };
  }
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      
      let width = img.width;
      let height = img.height;
      
      // Only resize if dimensions exceed max
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
        console.log('[Designer V2.1] Resizing to:', width, 'x', height);
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Use JPEG with 85% quality for good balance
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }
          
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result as string;
            const base64 = dataUrl.split(',')[1];
            console.log('  ✅ Compressed to:', (base64.length * 0.75 / 1024).toFixed(0), 'KB (ready for API)');
            resolve({ base64, mimeType: 'image/jpeg' });
          };
          reader.onerror = () => reject(new Error('Failed to read blob'));
          reader.readAsDataURL(blob);
        },
        'image/jpeg',
        0.85
      );
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };
    
    img.src = objectUrl;
  });
}

type ControlGroupProps = {
  label: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
};

const ControlGroup: React.FC<ControlGroupProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max = 10,
  step = 1,
  disabled = false,
}) => (
  <div className="mb-6">
    <div className="flex justify-between items-center mb-2">
      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{label}</label>
      <span className="text-xs text-purple-400 font-mono bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
        {value}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(Number(e.target.value))}
      className="premium-slider"
    />
  </div>
);

const URLDisplay = React.memo(({ label, url, onCopy }: { label: string; url?: string; onCopy: (url: string, label: string) => void }) => {
  if (!url) return <div className="text-zinc-600 italic">غير متوفر</div>;
  const filename = url.split('/').pop()?.split('?')[0] || 'file';
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline text-[10px] font-mono break-all flex items-center gap-1"
        >
          <ExternalLink className="w-3 h-3 flex-shrink-0" />
          {filename}
        </a>
        <button
          onClick={() => onCopy(url, label)}
          className="p-1 hover:bg-zinc-800 rounded transition-colors flex-shrink-0"
          title={`نسخ رابط ${label}`}
        >
          <Copy className="w-3 h-3 text-zinc-400" />
        </button>
      </div>
    </div>
  );
});

export const DesignerV2_1: React.FC = () => {
  // ========== PERFORMANCE TRACKING ==========
  const renderCountRef = React.useRef(0);
  const mountTimeRef = React.useRef(new Date().toISOString());
  
  React.useEffect(() => {
    renderCountRef.current++;
  });
  
  React.useEffect(() => {
    // Component lifecycle tracking (debug disabled)
  }, []);

  // ========== MOBILE DETECTION ==========
  const isMobile = useMobileDetection();

  // ========== ROUTING & TASK ID ==========
  const { taskId: urlTaskId, productId } = useParams<{ taskId?: string; productId?: string }>();
  const navigate = useNavigate();

  // ========== AUTH & ADMIN ==========
  const { user } = useApp();
  const isAdminUser = user?.role === 'admin';

  // ========== PERSISTENT SELECTION STATE (DIRECTIVE 3) ==========
  const hydrateDesignerStore = useDesignerStore((s) => s.hydrateFromStorage);
  const persistedModel = useDesignerStore((s) => s.selectedModel);
  const persistedTemplateId = useDesignerStore((s) => s.selectedTemplateId);
  const persistedTemplateImage = useDesignerStore((s) => s.selectedTemplateImage);
  const persistedFabricId = useDesignerStore((s) => s.selectedFabricId);
  const persistedFabricImage = useDesignerStore((s) => s.selectedFabricImage);
  const persistSelectedModel = useDesignerStore((s) => s.setSelectedModel);
  const persistTemplateId = useDesignerStore((s) => s.setTemplateId);
  const persistTemplateSelection = useDesignerStore((s) => s.setTemplateSelection);
  const persistFabricSelection = useDesignerStore((s) => s.setFabricSelection);
  const persistActiveResult = useDesignerStore((s) => s.setActiveResult);

  React.useEffect(() => {
    hydrateDesignerStore();
  }, [hydrateDesignerStore]);

  // Error modal state (must be declared before callbacks that use it)
  const [errorModalOpen, setErrorModalOpen] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  const [currentTaskId, setCurrentTaskId] = React.useState<string | null>(null);
  const [shareUrlCopied, setShareUrlCopied] = React.useState(false);
  
  // Image dimension tracking
  const [sourceImageDimensions, setSourceImageDimensions] = React.useState<{ width: number; height: number } | null>(null);
  const [afterImageDimensions, setAfterImageDimensions] = React.useState<{ width: number; height: number } | null>(null);
  const [copiedUrl, setCopiedUrl] = React.useState<string | null>(null);

  // ========== PRIVACY SHIELD (FACE BLUR) ==========
  const { 
    isPrivacyMode, 
    setPrivacyMode, 
    maskingStyle, 
    setMaskingStyle, 
    blurStrength, 
    setBlurStrength,
    selectedEmoji,
    setSelectedEmoji, 
    processImage: processWithPrivacyShield, 
    isProcessingPrivacy 
  } = usePrivacyShield();

  // Auto-apply privacy mask when settings change
  React.useEffect(() => {
    const applyMask = async () => {
      if (!sourceImageBase64) return;
      
      // If Privacy Mode is OFF, restore original image
      if (!isPrivacyMode) {
        console.log('[Privacy Auto-Apply] Privacy Mode disabled, restoring original image');
        const currentSliderPos = sliderPos;
        
        const binaryString = atob(sourceImageBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: sourceImageMimeType || 'image/jpeg' });
        const originalUrl = URL.createObjectURL(blob);
        
        setSourcePreviewUrl(originalUrl);
        setSourceForComparison(originalUrl);
        setSliderPos(currentSliderPos);
        return;
      }
      
      try {
        console.log('[Privacy Auto-Apply] Applying mask with style:', maskingStyle, 'blur:', blurStrength);
        
        // Store current slider position
        const currentSliderPos = sliderPos;
        
        // Convert base64 to File
        const binaryString = atob(sourceImageBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: sourceImageMimeType || 'image/jpeg' });
        const file = new File([blob], 'template.jpg', { type: blob.type });
        
        // Process with current settings
        const processedFile = await processWithPrivacyShield(file);
        const processedUrl = URL.createObjectURL(processedFile);
        
        // Update preview
        setSourcePreviewUrl(processedUrl);
        setSourceForComparison(processedUrl);
        
        // Restore slider position
        setSliderPos(currentSliderPos);
        
        console.log('[Privacy Auto-Apply] ✅ Mask applied successfully');
      } catch (error) {
        console.error('[Privacy Auto-Apply] Failed:', error);
      }
    };
    
    applyMask();
  }, [isPrivacyMode, maskingStyle, blurStrength, selectedEmoji]);
  
  // Navigation handlers
  const navigateHome = React.useCallback(() => {
    navigate('/');
  }, [navigate]);
  
  const navigateProfile = React.useCallback(() => {
    navigate(isAdminUser ? '/admin' : '/account');
  }, [navigate, isAdminUser]);
  
  // Error display helper
  const showError = React.useCallback((message: string) => {
    setErrorMessage(message);
    setErrorModalOpen(true);
  }, []);

  const cacheKey = React.useMemo(
    () => `khuyoot:designerV2_1:state:v${DESIGNER_CACHE_VERSION}:${user?.uid ?? 'anon'}`,
    [user?.uid]
  );

  // ========== FEATURE TOGGLES (ADMIN ONLY) ==========
  const [features, setFeatures] = React.useState<DesignerV2Features>(DEFAULT_FEATURES);

  // ========== MODEL & CONFIGURATION STATE ==========
  const selectedModel = persistedModel;
  const setSelectedModel = persistSelectedModel;
  const [refinementPrompt, setRefinementPrompt] = React.useState<string>('');

  // ========== IMAGE STATE ==========
  // FIX: Separate preview states per tab to prevent clearing when switching tabs
  const [studioPreviewUrl, setStudioPreviewUrl] = React.useState<string | null>(null);
  const [studioImageBase64, setStudioImageBase64] = React.useState<string | null>(null);
  const [studioImageMimeType, setStudioImageMimeType] = React.useState<string | null>(null);

  const [shopPreviewUrl, setShopPreviewUrl] = React.useState<string | null>(null);
  const [shopImageBase64, setShopImageBase64] = React.useState<string | null>(null);
  const [shopImageMimeType, setShopImageMimeType] = React.useState<string | null>(null);

  const [closetPreviewUrl, setClosetPreviewUrl] = React.useState<string | null>(null);
  const [closetImageBase64, setClosetImageBase64] = React.useState<string | null>(null);
  const [closetImageMimeType, setClosetImageMimeType] = React.useState<string | null>(null);

  // Track which tab was last used to determine active preview state
  const [lastActiveTemplateTab, setLastActiveTemplateTab] = React.useState<'Studio' | 'Shop' | 'Closet'>('Studio');

  // Convenience getters for current active preview based on last tab
  const sourcePreviewUrl =
    lastActiveTemplateTab === 'Shop' ? shopPreviewUrl :
    lastActiveTemplateTab === 'Closet' ? closetPreviewUrl :
    studioPreviewUrl;

  const sourceImageBase64 =
    lastActiveTemplateTab === 'Shop' ? shopImageBase64 :
    lastActiveTemplateTab === 'Closet' ? closetImageBase64 :
    studioImageBase64;

  const sourceImageMimeType =
    lastActiveTemplateTab === 'Shop' ? shopImageMimeType :
    lastActiveTemplateTab === 'Closet' ? closetImageMimeType :
    studioImageMimeType;

  // Setters that update the correct state based on active tab
  const setSourcePreviewUrl = React.useCallback((url: string | null) => {
    if (lastActiveTemplateTab === 'Shop') setShopPreviewUrl(url);
    else if (lastActiveTemplateTab === 'Closet') setClosetPreviewUrl(url);
    else setStudioPreviewUrl(url);
  }, [lastActiveTemplateTab]);

  const setSourceImageBase64 = React.useCallback((b64: string | null) => {
    if (lastActiveTemplateTab === 'Shop') setShopImageBase64(b64);
    else if (lastActiveTemplateTab === 'Closet') setClosetImageBase64(b64);
    else setStudioImageBase64(b64);
  }, [lastActiveTemplateTab]);

  const setSourceImageMimeType = React.useCallback((mime: string | null) => {
    if (lastActiveTemplateTab === 'Shop') setShopImageMimeType(mime);
    else if (lastActiveTemplateTab === 'Closet') setClosetImageMimeType(mime);
    else setStudioImageMimeType(mime);
  }, [lastActiveTemplateTab]);

  const [fabricPreviewUrl, setFabricPreviewUrl] = React.useState<string | null>(null);
  const [fabricImageBase64, setFabricImageBase64] = React.useState<string | null>(null);
  const [fabricImageMimeType, setFabricImageMimeType] = React.useState<string | null>(null);
  const [fabricMaterial, setFabricMaterial] = React.useState<'silk' | 'cotton' | 'transparent' | 'velvet' | 'linen' | 'wool' | null>(null);

  // Hydrate local upload state from persisted store (Directive 3)
  React.useEffect(() => {
    if (persistedTemplateImage && (!sourceImageBase64 || !sourceImageMimeType)) {
      setSourceImageBase64(persistedTemplateImage.base64);
      setSourceImageMimeType(persistedTemplateImage.mimeType);
      setSourcePreviewUrl(toDataUrl(persistedTemplateImage.base64, persistedTemplateImage.mimeType));
      setSourceForComparison(toDataUrl(persistedTemplateImage.base64, persistedTemplateImage.mimeType));
    }
  }, [persistedTemplateImage, sourceImageBase64, sourceImageMimeType]);

  React.useEffect(() => {
    if (persistedFabricImage && (!fabricImageBase64 || !fabricImageMimeType)) {
      setFabricImageBase64(persistedFabricImage.base64);
      setFabricImageMimeType(persistedFabricImage.mimeType);
      setFabricPreviewUrl(toDataUrl(persistedFabricImage.base64, persistedFabricImage.mimeType));
    }
  }, [persistedFabricImage, fabricImageBase64, fabricImageMimeType]);

  // Image processing state
  const [isProcessingTemplate, setIsProcessingTemplate] = React.useState<boolean>(false);
  const [isProcessingFabric, setIsProcessingFabric] = React.useState<boolean>(false);

  // ========== OUTPUT SETTINGS ==========
  const [upscaleEngine, setUpscaleEngine] = React.useState<'standard' | 'creative'>('standard');
  const [outputFit, setOutputFit] = React.useState<'contain' | 'cover'>('contain');
  const [isUpscaling, setIsUpscaling] = React.useState<boolean>(false);
  const [upscaleProgress, setUpscaleProgress] = React.useState(0);
  
  // Deletion modal state
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [deletingJobId, setDeletingJobId] = React.useState<string | null>(null);
  const [deletingItemId, setDeletingItemId] = React.useState<string | null>(null);

  // Watermark & subscription settings
  const [isWatermarkEnabled, setIsWatermarkEnabled] = React.useState<boolean>(true); // Default ON for free users
  const [isSubscribed, setIsSubscribed] = React.useState<boolean>(false); // Mock: false for testing free tier
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = React.useState<boolean>(false);

  const {
    canAfford,
    enabled: creditsEnabled,
    getCost,
    executeCreditAction,
    refresh: refreshCredits,
  } = useCredits();

  const generationCost = getCost('generation');
  const upscaleCost = getCost('upscale');

  const handleUpgrade = React.useCallback(async () => {
    const currentUser = firebaseService.auth?.currentUser;
    if (!currentUser) throw new Error('Not logged in');

    const idToken = await currentUser.getIdToken();
    const resp = await fetch('/api/credits/upgrade-bonus', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ amount: 200 }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(text || `Upgrade bonus failed (${resp.status})`);
    }

    setIsSubscribed(true);
    setIsWatermarkEnabled(false);
    await refreshCredits();
  }, [refreshCredits]);

  // Generation history
  const {
    history,
    isLoading,
    activeId,
    setActiveId,
    refreshHistory,
    deleteHistoryItem,
    addPendingGeneration,
    finalizePendingGeneration,
    removePendingGeneration,
  } = useGenerationHistory(features.showHistoryFilmstrip ? user?.uid : undefined);

  const [afterImage, setAfterImage] = React.useState(ORIGINAL);
  const [sourceForComparison, setSourceForComparison] = React.useState(ORIGINAL);
  const [beforeUpscaleImage, setBeforeUpscaleImage] = React.useState<string | null>(null); // Store pre-upscale image
  const [isLoadingHistoryImage, setIsLoadingHistoryImage] = React.useState(false); // Loading state for history selection
  
  // Product images for template picker
  const [productTemplates, setProductTemplates] = React.useState<Array<{id: string; imageUrl: string; name: string}> | null>(null);
  const [shouldAutoSelectProduct, setShouldAutoSelectProduct] = React.useState(false);

  // Track loaded product to prevent duplicate loads
  const loadedProductRef = React.useRef<string | null>(null);
  
  // Blob cache for instant image switching (used by product images and history)
  const MAX_CACHE_SIZE = 10;
  const blobCache = React.useRef<Map<string, string>>(new Map());

  // Load product image if productId is in URL
  // FIX: Removed function dependencies (setSourcePreviewUrl, setSourceForComparison, persistTemplateSelection)
  // to prevent effect re-runs on every render. loadedProductRef ensures we only fetch once per productId.
  const [isLoadingProduct, setIsLoadingProduct] = React.useState(false);
  
  React.useEffect(() => {
    if (productId) {
      if (loadedProductRef.current === productId) {
        console.log(`[ProductCache] Product ${productId} already loaded, skipping fetch`);
        return;
      }
      loadedProductRef.current = productId;
      const loadProductImage = async () => {
        setIsLoadingProduct(true);
        try {
          const product = await getProductById(productId);
          
          if (product) {
            // Determine which images to use
            let productImages: string[] = [];
            
            // Collect all available images
            if (product.images && product.images.length > 0) {
              productImages = product.images;
            } else if (product.image) {
              productImages = [product.image];
            }
            
            // Determine the main image (cover) index
            let mainImageIndex = 0;
            if (product.coverImageIndex !== undefined && productImages[product.coverImageIndex]) {
              mainImageIndex = product.coverImageIndex;
            }
            
            if (productImages.length > 0) {
              console.log(`Loading product "${product.name}" with ${productImages.length} image(s)`);
              
              // Prefetch all product images as blobs for instant access
              const blobPromises = productImages.map(async (imageUrl, index) => {
                const imageId = `product-${productId}-${index}`;
                
                try {
                  const res = await fetch(imageUrl);
                  if (!res.ok) throw new Error(`HTTP ${res.status}`);
                  
                  const blob = await res.blob();
                  const blobUrl = URL.createObjectURL(blob);
                  
                  // Add to blob cache
                  blobCache.current.set(imageId, blobUrl);
                  console.log(`[ProductCache] Cached product image: ${imageId}`);
                  
                  return { index, blobUrl, imageUrl, blob };
                } catch (e) {
                  console.warn(`[ProductCache] Failed to cache ${imageId}:`, e);
                  return { index, blobUrl: imageUrl, imageUrl, blob: null }; // Fallback to original URL
                }
              });
              
              const cachedImages = await Promise.all(blobPromises);
              
              // Create template items with blob URLs
              const templates = cachedImages.map(({ index, blobUrl, imageUrl }) => ({
                id: `product-${productId}-${index}`,
                imageUrl: blobUrl, // Use blob URL for instant loading
                name: index === mainImageIndex ? `${product.name} (Main)` : `${product.name} - ${index + 1}`,
                isPremium: false,
                isProductImage: true // Custom flag to identify product images
              }));
              
              // Set the product templates for the Shop tab
              setProductTemplates(templates);
              
              // Auto-load the main image using blob URL
              const mainImage = cachedImages.find(img => img.index === mainImageIndex);
              if (mainImage && mainImage.blob) {
                // Switch to Shop tab and set its preview state
                setLastActiveTemplateTab('Shop');
                setShopPreviewUrl(mainImage.blobUrl);
                setSourceForComparison(mainImage.blobUrl);
                
                // Convert blob to base64 for API calls
                const reader = new FileReader();
                reader.onloadend = () => {
                  const dataUrl = reader.result as string;
                  const parts = dataUrl.split(',');
                  const base64 = parts[1];
                  const mimeType = mainImage.blob!.type || 'image/jpeg';
                  
                  // Set the base64 data needed for generation
                  setShopImageBase64(base64);
                  setShopImageMimeType(mimeType);
                  
                  console.log(`[ProductCache] Loaded main image as base64 for generation`);
                };
                reader.readAsDataURL(mainImage.blob);
                
                // Store a lightweight reference instead of full base64
                persistTemplateSelection({
                  templateId: `product-${productId}-${mainImageIndex}`,
                  image: null // Don't store base64 for product images
                });
              }
            }
          }
        } catch (error) {
          console.error('Failed to load product:', error);
        } finally {
          setIsLoadingProduct(false);
        }
      };
      loadProductImage();
    }
  }, [productId]);

  const [lastRequestDebug, setLastRequestDebug] = React.useState<any>(null);
  const [lastResponseDebug, setLastResponseDebug] = React.useState<any>(null);

  const [lightingPreset, setLightingPreset] = React.useState<LightingPreset>('studio');

  React.useEffect(() => {
    const open = () => {
      try {
        const flag = sessionStorage.getItem('__khuyoot_open_upgrade_modal');
        if (flag === '1') {
          sessionStorage.removeItem('__khuyoot_open_upgrade_modal');
          setIsUpgradeModalOpen(true);
        }
      } catch {
        // ignore
      }
    };

    open();
    window.addEventListener('khuyoot:open-upgrade-modal', open);
    return () => window.removeEventListener('khuyoot:open-upgrade-modal', open);
  }, []);

  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [sliderPos, setSliderPos] = React.useState(100);
  const [loadingTemplateId, setLoadingTemplateId] = React.useState<string | null>(null);

  const waitForImage = React.useCallback((url: string | null) => {
    return new Promise<void>((resolve) => {
      if (!url) return resolve();
      const img = new Image();
      const done = () => resolve();
      img.onload = done;
      img.onerror = done;
      img.src = url;
      if ((img as any).decode && typeof (img as any).decode === 'function') {
        (img as any).decode().then(done).catch(done);
      }
    });
  }, []);

  const startTemplateLoading = React.useCallback((templateId: string | null) => {
    setLoadingTemplateId(templateId);
  }, []);

  const endTemplateLoading = React.useCallback(async (url: string | null) => {
    await waitForImage(url);
    setLoadingTemplateId(null);
  }, [waitForImage]);

  const handleApplyPrivacyShieldToCurrentTemplate = React.useCallback(async () => {
    if (!sourceImageBase64) return;

    try {
      const currentSliderPos = sliderPos;

      const binaryString = atob(sourceImageBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: sourceImageMimeType || 'image/jpeg' });
      const file = new File([blob], 'template.jpg', { type: blob.type });

      const processedFile = await processWithPrivacyShield(file);
      const processedUrl = URL.createObjectURL(processedFile);

      setAfterImage(processedUrl);
      setSliderPos(currentSliderPos);
    } catch (error) {
      console.error('[Privacy Apply] Failed:', error);
      showError('Privacy Shield failed');
    }
  }, [processWithPrivacyShield, showError, sliderPos, sourceImageBase64, sourceImageMimeType]);

  // Avoid temporal-dead-zone issues: template selection is initialized later in the file.
  // Keep a ref for templateId so getApiPayload can read it safely.
  const selectedTemplateIdRef = React.useRef<string | undefined>(undefined);

  // ========== CENTRALIZED UI STATE (COMPUTED) ==========
  const uiState: DesignerUIState = React.useMemo(() => ({
    allDisabled: isProcessing || isUpscaling,
    uploadsDisabled: isProcessing,
    inputsDisabled: isProcessing,
    generationDisabled: isProcessing || !sourcePreviewUrl || !fabricPreviewUrl,
    upscaleDisabled: isProcessing || isUpscaling || !beforeUpscaleImage,
    watermarkDisabled: isProcessing || !isSubscribed,
    showUpscaleButton: !!beforeUpscaleImage,
    showProFeatures: isSubscribed,
    showUpgradePrompt: !isSubscribed,
  }), [isProcessing, isUpscaling, sourcePreviewUrl, fabricPreviewUrl, beforeUpscaleImage, isSubscribed]);

  // ========== SKELETON STATES ==========

  const sidebarHasVisibleContent =
    features.showTemplateUpload ||
    features.showFabricUpload ||
    features.showModelSelection ||
    features.showRefinementPrompt ||
    features.showOutputQuality ||
    features.showExportSettings ||
    features.showDebugSection;

  const mainHasVisibleContent =
    features.showComparisonSlider || features.showHistoryFilmstrip || features.showFullComparison;

  React.useEffect(() => {
    return () => {
      // Clean up all tab preview URLs on unmount
      if (studioPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(studioPreviewUrl);
      if (shopPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(shopPreviewUrl);
      if (closetPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(closetPreviewUrl);
      if (fabricPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(fabricPreviewUrl);
    };
  }, [studioPreviewUrl, shopPreviewUrl, closetPreviewUrl, fabricPreviewUrl]);

  // Prefetch high-res images and convert to blob URLs for instant switching
  const prefetchHighResImage = React.useCallback(async (imageId: string, remoteUrl: string) => {
    // Skip if already cached or invalid URL
    if (!imageId || !remoteUrl || blobCache.current.has(imageId) || remoteUrl === ORIGINAL || remoteUrl.startsWith('blob:') || remoteUrl.startsWith('data:')) {
      return;
    }

    try {
      const res = await fetch(remoteUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      // LRU Cache Management: Evict oldest if at capacity
      if (blobCache.current.size >= MAX_CACHE_SIZE) {
        const oldestKey = blobCache.current.keys().next().value;
        const oldestUrl = blobCache.current.get(oldestKey);
        if (oldestUrl) {
          URL.revokeObjectURL(oldestUrl);
        }
        blobCache.current.delete(oldestKey);
      }
      
      // Add new blob to cache (insertion order maintained by Map)
      blobCache.current.set(imageId, blobUrl);
    } catch (e) {
      console.warn(`[BlobCache] Failed to cache ${imageId}:`, e);
    }
  }, [MAX_CACHE_SIZE]);

  // Prefetch all history images when history updates
  React.useEffect(() => {
    if (!history || history.length === 0) return;

    // Prefetch high-res images in the background
    history.forEach((item: any) => {
      const imageId = item.jobId || item.clientId || item.fullImageUrl;
      const remoteUrl = item.fullImageUrl;
      
      if (imageId && remoteUrl) {
        prefetchHighResImage(imageId, remoteUrl);
      }
    });

    // Clean up slider positions for generations no longer in history
    const currentIds = history
      .map((item: any) => item.jobId || item.clientId || item.fullImageUrl)
      .filter(Boolean);
    clearOldSliderPositions(currentIds);
  }, [history, prefetchHighResImage]);

  // Cleanup blob URLs on unmount
  React.useEffect(() => {
    return () => {
      // Revoke all cached blob URLs to prevent memory leaks
      blobCache.current.forEach((blobUrl: string) => {
        URL.revokeObjectURL(blobUrl);
      });
      console.log(`[BlobCache] Cleaned up ${blobCache.current.size} blob URLs`);
      blobCache.current.clear();
    };
  }, []);

  // Save slider position to localStorage whenever it changes
  React.useEffect(() => {
    if (activeId && sliderPos !== undefined) {
      saveSliderPosition(activeId, sliderPos);
    }
  }, [sliderPos, activeId]);

  // Load task from URL parameter
  const loadTaskFromUrl = React.useCallback(async (taskId: string) => {
    const task = await taskStorage.getTask(taskId, user?.uid);
    if (!task) {
      console.warn('[Designer] Task not found:', taskId);
      return;
    }

    setCurrentTaskId(taskId);
    setSelectedModel(task.metadata.selectedModel ?? 'NanoBana');
    setRefinementPrompt(task.metadata.refinementPrompt ?? '');
    setOutputFit(task.metadata.outputFit ?? 'contain');
    setSliderPos(task.metadata.sliderPos ?? 100);

    if (task.metadata.model) {
      setSourcePreviewUrl(task.metadata.model);
      setSourceForComparison(task.metadata.model);
    }
    if (task.metadata.fabric) {
      setFabricPreviewUrl(task.metadata.fabric);
    }
    if (task.results?.highRes) {
      setAfterImage(task.results.highRes);
      setBeforeUpscaleImage(task.results.highRes);
    }
    if (task.results?.jobId) {
      setActiveId(task.results.jobId);
    }
  }, [user?.uid, setActiveId]);

  // Sync with URL on mount and URL change
  React.useEffect(() => {
    if (urlTaskId) {
      loadTaskFromUrl(urlTaskId);
    }
  }, [urlTaskId, loadTaskFromUrl]);

  // Hydrate persisted state (uploads + comparison state + slider position)
  const didHydrateRef = React.useRef(false);
  React.useEffect(() => {
    if (didHydrateRef.current) return;
    if (urlTaskId) {
      didHydrateRef.current = true;
      return; // Skip cache if loading from URL
    }
    const cached = safeLocalStorageGet<DesignerCacheState>(cacheKey);
    if (!cached || cached.v !== DESIGNER_CACHE_VERSION) {
      didHydrateRef.current = true;
      return;
    }

    setSelectedModel(cached.selectedModel);
    setRefinementPrompt(cached.refinementPrompt ?? '');
    setOutputFit(cached.outputFit ?? 'contain');
    setSliderPos(typeof cached.sliderPos === 'number' ? cached.sliderPos : 100);

    setSourceImageBase64(cached.sourceImageBase64);
    setSourceImageMimeType(cached.sourceImageMimeType);
    setFabricImageBase64(cached.fabricImageBase64);
    setFabricImageMimeType(cached.fabricImageMimeType);

    // Only restore if we have valid data URLs, skip blob URLs
    if (cached.sourceImageBase64 && cached.sourceImageMimeType) {
      setSourcePreviewUrl(toDataUrl(cached.sourceImageBase64, cached.sourceImageMimeType));
    }
    if (cached.fabricImageBase64 && cached.fabricImageMimeType) {
      setFabricPreviewUrl(toDataUrl(cached.fabricImageBase64, cached.fabricImageMimeType));
    }

    // Skip blob URLs when restoring from cache
    const validSourceComp = cached.sourceForComparison?.startsWith('blob:') ? ORIGINAL : cached.sourceForComparison;
    const validAfterImg = cached.afterImage?.startsWith('blob:') ? ORIGINAL : cached.afterImage;
    setSourceForComparison(validSourceComp || ORIGINAL);
    setAfterImage(validAfterImg || ORIGINAL);
    setActiveId(cached.activeId ?? null);

    didHydrateRef.current = true;
  }, [cacheKey, setActiveId]);

  // Persist key state on change (debounced)
  const persistTimerRef = React.useRef<number | null>(null);
  React.useEffect(() => {
    if (!didHydrateRef.current) return;
    if (persistTimerRef.current) window.clearTimeout(persistTimerRef.current);

    persistTimerRef.current = window.setTimeout(() => {
      // Only persist non-blob URLs for sourceForComparison and afterImage
      const validSourceComp = sourceForComparison?.startsWith('blob:') ? '' : sourceForComparison;
      const validAfterImg = afterImage?.startsWith('blob:') ? '' : afterImage;
      
      const snapshot: DesignerCacheState = {
        v: DESIGNER_CACHE_VERSION,
        selectedModel,
        refinementPrompt,
        outputFit,
        sliderPos,
        sourceImageBase64,
        sourceImageMimeType,
        fabricImageBase64,
        fabricImageMimeType,
        sourceForComparison: validSourceComp,
        afterImage: validAfterImg,
        activeId,
      };
      safeLocalStorageSet(cacheKey, snapshot);
    }, 250);

    return () => {
      if (persistTimerRef.current) window.clearTimeout(persistTimerRef.current);
    };
  }, [cacheKey, selectedModel, refinementPrompt, outputFit, sliderPos, sourceImageBase64, sourceImageMimeType, fabricImageBase64, fabricImageMimeType, sourceForComparison, afterImage, activeId]);

  const getApiPayload = React.useCallback((opts?: { lightingPreset?: LightingPreset }) => {
    if (!sourceImageBase64 || !sourceImageMimeType) {
      throw new Error('يرجى رفع صورة النموذج/القالب أولاً.');
    }
    if (!fabricImageBase64 || !fabricImageMimeType) {
      throw new Error('يرجى رفع صورة القماش/النقشة.');
    }

    // Get userId from Firebase auth if available
    let userId: string | undefined;
    try {
      const auth = firebaseService.auth;
      userId = auth?.currentUser?.uid;
    } catch (err) {
      // Silently handle auth errors
    }

    const payload = {
      templateBase64: sourceImageBase64,
      templateMimeType: sourceImageMimeType,
      fabricBase64: fabricImageBase64,
      fabricMimeType: fabricImageMimeType,
      model: selectedModel,
      refinementPrompt: (() => {
        let parts: string[] = [];
        
        // Add user's refinement prompt
        if (refinementPrompt?.trim()) {
          parts.push(refinementPrompt.trim());
        }
        
        // Add fabric material instruction (simplified)
        const materialInstructions = {
          silk: 'silk with natural sheen',
          cotton: 'natural cotton texture',
          linen: 'linen with visible weave',
          velvet: 'luxurious velvet texture',
          transparent: 'transparent/translucent fabric',
          wool: 'wool with dense texture'
        };
        
        if (fabricMaterial && materialInstructions[fabricMaterial]) {
          parts.push(`Make the fabric look like ${materialInstructions[fabricMaterial]}`);
        }
        
        // Add lighting descriptor
        const lighting = getLightingDescriptor(opts?.lightingPreset ?? lightingPreset);
        if (lighting) {
          parts.push(lighting);
        }
        
        return parts.length > 0 ? parts.join(', ') : undefined;
      })(),
      preserveFace: true,
      preservePose: true,
      outputFit,
      shouldWatermark: isWatermarkEnabled,
      userId, // RE-ENABLED for database storage
      templateId: selectedTemplateIdRef.current || undefined,
      fabricId: persistedFabricId || undefined,
    } as const;

    return payload;
  }, [sourceImageBase64, sourceImageMimeType, fabricImageBase64, fabricImageMimeType, selectedModel, refinementPrompt, outputFit, isWatermarkEnabled, lightingPreset, persistedFabricId, fabricMaterial]);

  const revealSlider = React.useCallback(() => {
    setSliderPos(0);
    let currentPos = 0;
    const sweepEffect = window.setInterval(() => {
      if (currentPos >= 50) {
        setSliderPos(50);
        window.clearInterval(sweepEffect);
      } else {
        currentPos += 2;
        setSliderPos(currentPos);
      }
    }, 20);
  }, []);

  const handleFabricSwap = React.useCallback(async (opts?: { lightingPreset?: LightingPreset }) => {
    if (isProcessing) return;

    let payload: ReturnType<typeof getApiPayload>;
    try {
      payload = getApiPayload(opts);
    } catch (e: any) {
      showError(e?.message || 'Missing model template or fabric pattern');
      return;
    }

    // Show processing UI immediately. Credit reservation happens before the callback executes,
    // so we need to flip UI state before awaiting executeCreditAction to avoid a perceived freeze.
    setIsProcessing(true);
    setProgress(5);
    setSliderPos(0);
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));

    const creditRes = await executeCreditAction('generation', async () => {
      setLastRequestDebug({
        model: payload.model,
        outputFit: payload.outputFit,
        templateBytesEstimate: Math.floor((payload.templateBase64.length * 3) / 4),
        fabricBytesEstimate: Math.floor((payload.fabricBase64.length * 3) / 4),
      });
      setLastResponseDebug(null);
      setProgress(10);
      setSliderPos(0);
      setAfterImage(sourcePreviewUrl || ORIGINAL);
      setBeforeUpscaleImage(null); // Clear previous upscaled result

      // Add pending placeholder immediately for instant feedback
      const pendingClientId = features.showHistoryFilmstrip ? addPendingGeneration() : null;

      const interval = window.setInterval(() => {
        setProgress((prev) => {
          // Keep UI moving smoothly instead of stalling at 95%
          if (prev < 90) return Math.min(90, prev + 4);
          if (prev < 95) return Math.min(95, prev + 1.5);
          if (prev < 99) return Math.min(99, prev + (0.2 + Math.random() * 0.8));
          return prev;
        });
      }, 160);

      try {
        const res = await generateFabricSwap(payload);
        window.clearInterval(interval);
        setProgress(100);

        if ((res as any)?.debug) setLastResponseDebug((res as any).debug);

        setAfterImage(res.imageDataUrl);
        setBeforeUpscaleImage(res.imageDataUrl); // Store for upscale button
        persistActiveResult(res.fullImageUrl || res.imageDataUrl || null);

        if (pendingClientId && res.jobId) {
          finalizePendingGeneration(pendingClientId, {
            jobId: res.jobId,
            createdAt: new Date().toISOString(),
            fullImageUrl: res.fullImageUrl || res.imageDataUrl,
            thumbnailUrl: res.thumbnailUrl || res.fullImageUrl || res.imageDataUrl,
            templateUrl: res.templateUrl,
            fabricUrl: res.fabricUrl,
            templateId: undefined,
            fabricId: undefined,
            settings: {
              model: payload.model,
              upscaleEnabled: false,
              outputFit: payload.outputFit,
              refinementPrompt: payload.refinementPrompt,
              preserveFace: true,
              preservePose: true,
              shouldWatermark: payload.shouldWatermark,
            },
          });
        } else if (pendingClientId) {
          removePendingGeneration(pendingClientId);
        }

        if (res.jobId) {
          setActiveId(res.jobId);
          // Delay refresh slightly to ensure Firestore write completes
          setTimeout(() => {
            void refreshHistory();
          }, 500);
        }

        // Save task after successful generation (use data URLs, not blob URLs)
        const newTaskId = currentTaskId || generateTaskId();

        const modelUrl = sourcePreviewUrl?.startsWith('blob:')
          ? (sourceImageBase64 && sourceImageMimeType ? `data:${sourceImageMimeType};base64,${sourceImageBase64}` : '')
          : sourcePreviewUrl || '';

        const fabricUrl = fabricPreviewUrl?.startsWith('blob:')
          ? (fabricImageBase64 && fabricImageMimeType ? `data:${fabricImageMimeType};base64,${fabricImageBase64}` : '')
          : fabricPreviewUrl || '';

        const task: DesignTask = {
          taskId: newTaskId,
          metadata: {
            model: modelUrl,
            modelMimeType: sourceImageMimeType || undefined,
            fabric: fabricUrl,
            fabricMimeType: fabricImageMimeType || undefined,
            sliderPos: 50,
            createdAt: new Date().toISOString(),
            selectedModel: payload.model,
            refinementPrompt: payload.refinementPrompt,
            outputFit: payload.outputFit,
          },
          results: {
            thumbnail: res.thumbnailUrl || res.fullImageUrl,
            highRes: res.fullImageUrl || res.imageDataUrl,
            jobId: res.jobId,
            templateUrl: res.templateUrl,
            fabricUrl: res.fabricUrl,
          },
        };
        await taskStorage.saveTask(task, user?.uid);
        setCurrentTaskId(newTaskId);

        // Update URL if not already there
        if (!urlTaskId || urlTaskId !== newTaskId) {
          navigate(`/designer-v2-1/design/${newTaskId}`, { replace: true });
        }

        setTimeout(() => {
          revealSlider();
          setIsProcessing(false);
        }, 250);
      } catch (e: any) {
        window.clearInterval(interval);
        setIsProcessing(false);
        setProgress(0);

        // Remove pending placeholder on error
        if (pendingClientId) {
          removePendingGeneration(pendingClientId);
        }

        const errorMsg = e?.message || 'فشل تبديل القماش. يرجى المحاولة مرة أخرى.';
        const isConnectionError = errorMsg.includes('fetch') || errorMsg.includes('network');

        showError(
          isConnectionError
            ? 'خطأ في الاتصال - قد تكون الصورة كبيرة جدًا. يرجى المحاولة بصور أصغر أو المحاولة مجددًا.'
            : `خطأ: ${errorMsg}`
        );
      }
    });

    if (!creditRes.ok) {
      // If credit reservation fails (or user can't afford), callback may never have run.
      setIsProcessing(false);
      setProgress(0);
      if ('reason' in creditRes && creditRes.reason === 'insufficient') {
        setIsUpgradeModalOpen(true);
      } else if ('reason' in creditRes && creditRes.reason === 'error') {
        showError('Unable to reserve credits. Please try again.');
      }
      return;
    }
  }, [addPendingGeneration, executeCreditAction, features.showHistoryFilmstrip, finalizePendingGeneration, getApiPayload, isProcessing, refreshHistory, removePendingGeneration, revealSlider, selectedModel, setActiveId, sourcePreviewUrl, currentTaskId, sourceImageMimeType, fabricPreviewUrl, fabricImageMimeType, user?.uid, urlTaskId, navigate, showError]);

  // Directive 4: lighting buttons trigger generation
  const lightingGenerator = useLightingGenerator({
    value: lightingPreset,
    setValue: setLightingPreset,
    canTrigger: !uiState.generationDisabled && !isProcessing,
    triggerGeneration: (preset) => handleFabricSwap({ lightingPreset: preset }),
  });

  const setBeforeFromHistory = React.useCallback(async (item: any) => {
    const beforeThumb = item.thumbnailUrl || item.fullImageUrl;
    const beforeFull = item.fullImageUrl || beforeThumb;

    setSourceForComparison(beforeThumb || ORIGINAL);
    if (item.jobId) setActiveId(item.jobId);
    await prefetchImage(beforeFull);
    setSourceForComparison(beforeFull || ORIGINAL);
  }, [setActiveId]);

  const setAfterFromHistory = React.useCallback(async (item: any) => {
    const afterThumb = item.thumbnailUrl || item.fullImageUrl;
    const afterFull = item.fullImageUrl || afterThumb;

    setAfterImage(afterThumb || ORIGINAL);
    setBeforeUpscaleImage(afterFull?.startsWith('data:') ? afterFull : null);
    if (item.jobId) setActiveId(item.jobId);
    await prefetchImage(afterFull);
    setAfterImage(afterFull || ORIGINAL);
  }, [setActiveId]);

  const handleUpscale = React.useCallback(async () => {
    if (!beforeUpscaleImage) {
      showError('No generated image to upscale. Please generate a fabric swap first.');
      return;
    }

    if (isUpscaling) return;

    // Same as generation: show UI immediately because credit reservation happens before callback.
    setIsUpscaling(true);
    setUpscaleProgress(5);
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));

    const creditRes = await executeCreditAction('upscale', async () => {
      setIsUpscaling(true);
      setUpscaleProgress(10);

      const interval = window.setInterval(() => {
        setUpscaleProgress((prev) => {
          const next = prev + 5;
          return next >= 90 ? 90 : next;
        });
      }, 150);

      try {
        // Extract base64 from data URL
        let imageBase64 = beforeUpscaleImage;
        if (beforeUpscaleImage.startsWith('data:')) {
          imageBase64 = beforeUpscaleImage.split(',')[1];
        }

        if (!creditRes.ok) {
          setIsUpscaling(false);
          setUpscaleProgress(0);
          if ('reason' in creditRes && creditRes.reason === 'insufficient') {
            setIsUpgradeModalOpen(true);
          } else if ('reason' in creditRes && creditRes.reason === 'error') {
            showError('Unable to reserve credits for upscale. Please try again.');
          }
          return;
        }

        const upscalePayload = {
          imageBase64,
          imageMimeType: 'image/png',
          upscaleEngine,
          upscaleMultiplier: 2,
          shouldWatermark: isWatermarkEnabled,
          debug: import.meta.env.DEV ? true : undefined,
        };

        const response = await fetch('/api/designer-v2-1/upscale', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(upscalePayload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Upscale failed (${response.status}): ${errorText}`);
        }

        const result = await response.json();
        window.clearInterval(interval);
        setUpscaleProgress(100);

        if (result?.debug) setLastResponseDebug(result.debug);

        // Update comparison: before = generated, after = upscaled
        setSourceForComparison(beforeUpscaleImage);
        setAfterImage(result.imageDataUrl);
        setSliderPos(50); // Position slider in middle to show both

        setTimeout(() => {
          setIsUpscaling(false);
        }, 500);
      } catch (e: any) {
        window.clearInterval(interval);
        setIsUpscaling(false);
        setUpscaleProgress(0);
        showError(`خطأ في التحسين: ${e?.message || 'فشل التحسين. يرجى المحاولة مرة أخرى.'}`);
      }
    });

    if (!creditRes.ok && 'reason' in creditRes && creditRes.reason === 'insufficient') {
      setIsUpgradeModalOpen(true);
    }
  }, [beforeUpscaleImage, executeCreditAction, isUpscaling, upscaleEngine, isWatermarkEnabled, showError]);

  const onPickSource = React.useCallback(async (file: File) => {
    if (!file) return;
    if (sourcePreviewUrl) URL.revokeObjectURL(sourcePreviewUrl);

    try {
      setIsProcessingTemplate(true);
      
      // Apply Privacy Shield if enabled (blur faces locally)
      let processedFile = file;
      try {
        processedFile = await processWithPrivacyShield(file);
      } catch (privacyError) {
        console.warn('[Designer V2.1] Privacy Shield failed, using original image:', privacyError);
        // Continue with original file
      }
      
      const previewUrl = URL.createObjectURL(processedFile);
      setSourcePreviewUrl(previewUrl);
      setSourceForComparison(previewUrl);  // Store for comparison section
      
      const { base64, mimeType } = await smartCompressImage(processedFile);
      setSourceImageMimeType(mimeType);
      setSourceImageBase64(base64);

      // Persist template upload for navigation resilience (Directive 3)
      persistTemplateSelection({
        templateId: selectedTemplateIdRef.current ?? null,
        image: { base64, mimeType },
      });

      // Reset previous result: new template becomes BEFORE image.
      setAfterImage(ORIGINAL);
      setBeforeUpscaleImage(null);
      setSliderPos(0);
      setActiveId(null);
    } catch (e: any) {
      showError(e?.message || 'فشل تحميل الصورة');
    } finally {
      setIsProcessingTemplate(false);
    }
  }, [sourcePreviewUrl, showError, processWithPrivacyShield]);

  const { selectedTemplate, selectTemplate } = useTemplateSelection(null);

  React.useEffect(() => {
    selectedTemplateIdRef.current = selectedTemplate?.id;
  }, [selectedTemplate?.id]);

  // Cache remote template downloads so re-selecting the same template doesn't refetch.
  // This is intentionally File-based (not blob: URLs) to stay compatible with CSP that blocks fetch(blob:...).
  const templateFileCacheRef = React.useRef<Map<string, File>>(new Map());

  const handleTemplateSelect = React.useCallback(
    async (templateData: any) => {
      // Track which tab this selection came from
      // This is inferred from whether it's a product image (Shop) or uploaded (Closet)
      if (templateData?.id?.startsWith('product-')) {
        setLastActiveTemplateTab('Shop');
      } else if (templateData?.file instanceof File || templateData?.isClosetItem) {
        setLastActiveTemplateTab('Closet');
      } else {
        setLastActiveTemplateTab('Studio');
      }

      const isPremium = templateData?.meta?.premium === true;
      const isProductImage = templateData?.id?.startsWith('product-');

      // For product images, skip persistence to avoid localStorage quota errors
      if (!isProductImage) {
        persistTemplateId(templateData?.id ?? null);
      }

      const doSelect = async () => {
        selectTemplate(templateData);
        selectedTemplateIdRef.current = templateData?.id;
        if (!templateData) return;

        // Start loading indicator for this template
        startTemplateLoading(templateData?.id);

        // Special handling for product images - use cached blob URL
        if (isProductImage && templateData?.imageUrl) {
          // Let React render the loading overlay before blocking on image decode
          await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
          // The imageUrl is already a blob URL from the cache
          // Directly set Shop tab state (since we already set lastActiveTemplateTab above)
          setShopPreviewUrl(templateData.imageUrl);
          setSourceForComparison(templateData.imageUrl);
          // Persist lightweight reference so Footer CTA can resolve productId
          persistTemplateSelection({ templateId: templateData?.id ?? null, image: null });
          await endTemplateLoading(templateData.imageUrl);
          // Blob URLs work directly without file conversion
          return;
        }

        if (templateData?.file instanceof File) {
          await onPickSource(templateData.file);
          setLoadingTemplateId(null); // Clear loading after file upload
          return;
        }

        const remoteUrl =
          (typeof templateData?.imageUrl === 'string' && templateData.imageUrl) ||
          (typeof templateData?.src === 'string' && templateData.src) ||
          null;

        if (remoteUrl) {
          if (remoteUrl.startsWith('blob:')) {
            console.warn('[TemplatePicker] Refusing to fetch blob: URL due to CSP:', remoteUrl);
            showError('This template preview cannot be used due to browser security policy. Please select the original template again.');
            setLoadingTemplateId(null);
            return;
          }

          try {
            const cached = templateFileCacheRef.current.get(remoteUrl);
            if (cached) {
              // onPickSource already handles loading state internally
              await onPickSource(cached);
              setLoadingTemplateId(null);
              return;
            }

            const res = await fetch(remoteUrl);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const blob = await res.blob();
            const mimeType = blob.type || 'image/jpeg';
            const name =
              (typeof templateData?.name === 'string' && templateData.name) ||
              (typeof templateData?.label === 'string' && templateData.label) ||
              'template.jpg';
            const file = new File([blob], name, { type: mimeType });

            // Basic LRU eviction to avoid unbounded memory growth.
            templateFileCacheRef.current.set(remoteUrl, file);
            if (templateFileCacheRef.current.size > 20) {
              const oldestKey = templateFileCacheRef.current.keys().next().value;
              if (oldestKey) templateFileCacheRef.current.delete(oldestKey);
            }

            await onPickSource(file);
            setLoadingTemplateId(null);
          } catch (e) {
            console.warn('[TemplatePicker] Failed to fetch template src:', e);
            showError('فشل تحميل القالب المختار');
            setLoadingTemplateId(null);
          }
        } else {
          setLoadingTemplateId(null);
        }
      };

      if (isPremium && !isSubscribed) {
        const res = await executeCreditAction('premium_template', doSelect);
        if (!res.ok && 'reason' in res && res.reason === 'insufficient') {
          setIsUpgradeModalOpen(true);
        }
        return;
      }

      await doSelect();
    },
    [executeCreditAction, isSubscribed, onPickSource, persistTemplateId, selectTemplate, showError]
  );

  const onPickFabric = React.useCallback(async (file: File) => {
    if (!file) return;
    if (fabricPreviewUrl) URL.revokeObjectURL(fabricPreviewUrl);

    try {
      console.log('[Designer V2.1] 🎨 FABRIC UPLOADED - Processing...');
      
      // Apply Privacy Shield if enabled (blur faces locally)
      let processedFile = file;
      try {
        processedFile = await processWithPrivacyShield(file);
      } catch (privacyError) {
        console.warn('[Designer V2.1] Privacy Shield failed, using original image:', privacyError);
        // Continue with original file
      }
      
      const previewUrl = URL.createObjectURL(processedFile);
      setFabricPreviewUrl(previewUrl);
      
      const { base64, mimeType } = await smartCompressImage(processedFile);
      
      setFabricImageBase64(base64);

      // Persist fabric upload for navigation resilience (Directive 3)
      persistFabricSelection({
        fabricId: null,
        image: { base64, mimeType },
      });
    } catch (e: any) {
      showError(e?.message || 'فشل تحميل صورة القماش');
    } finally {
      setIsProcessingFabric(false);
    }
  }, [fabricPreviewUrl, persistFabricSelection, showError, processWithPrivacyShield]);

  const handleSelectHistory = React.useCallback(async (item: any) => {
    // Get URLs
    const jobId: string | null = item?.jobId ?? null;
    const beforeImage = item?.templateUrl || sourcePreviewUrl || ORIGINAL;
    const afterFullRemote = item?.fullImageUrl || item?.thumbnailUrl || ORIGINAL;
    
    // Check if we have a cached blob URL for instant switching
    const imageId = jobId || item?.clientId || afterFullRemote;
    const cachedBlobUrl = blobCache.current.get(imageId);
    const afterFull = cachedBlobUrl || afterFullRemote;
    
    // Restore saved slider position for this generation (default to 50 if not saved)
    const savedSliderPos = getSavedSliderPosition(imageId) ?? 50;

    // If using cached blob, switch instantly without loading state
    if (cachedBlobUrl) {
      // Mark as recently used (LRU): Move to end by deleting and re-inserting
      blobCache.current.delete(imageId);
      blobCache.current.set(imageId, cachedBlobUrl);
      console.log(`[BlobCache] Cache hit (instant switch): ${imageId}`);
      
      setSourceForComparison(beforeImage);
      setAfterImage(afterFull);
      setBeforeUpscaleImage(afterFull?.startsWith('data:') ? afterFull : null);
      setSliderPos(savedSliderPos);
      setActiveId(jobId);
      
      // Task navigation (best-effort)
      try {
        const tasks = await taskStorage.listTasks(user?.uid);
        const matchingTask = tasks.find(t => t.results?.jobId === jobId);
        if (matchingTask) {
          navigate(`/designer-v2-1/design/${matchingTask.taskId}`);
        }
      } catch {
        // ignore
      }
      return;
    }

    // Fallback: Load from network if not cached
    setIsLoadingHistoryImage(true);

    // Preload the high-res image in memory BEFORE updating state
    const img = new Image();
    img.src = afterFull;

    img.onload = () => {
      // Only update UI after image is fully loaded in browser cache
      setSourceForComparison(beforeImage);
      setAfterImage(afterFull);
      setBeforeUpscaleImage(afterFull?.startsWith('data:') ? afterFull : null);
      setSliderPos(savedSliderPos);
      setActiveId(jobId);
      setIsLoadingHistoryImage(false);
    };

    img.onerror = () => {
      // Fallback if image fails to load
      setSourceForComparison(beforeImage);
      setAfterImage(ORIGINAL);
      setBeforeUpscaleImage(null);
      setSliderPos(savedSliderPos);
      setActiveId(jobId);
      setIsLoadingHistoryImage(false);
    };

    // Try to find associated task and navigate to it (best-effort)
    try {
      const tasks = await taskStorage.listTasks(user?.uid);
      const matchingTask = tasks.find(t => t.results?.jobId === jobId);
      if (matchingTask) {
        navigate(`/designer-v2-1/design/${matchingTask.taskId}`);
        return;
      }
    } catch {
      // ignore and keep the immediate UI fallback
    }
  }, [navigate, setActiveId, sourcePreviewUrl, user?.uid]);

  // Mobile history uses the same selection logic as the desktop filmstrip.
  const handleHistorySelect = handleSelectHistory;

  const handleDeleteSlot = React.useCallback((jobId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setDeletingJobId(jobId);
    setDeleteModalOpen(true);
  }, []);

  const confirmDelete = React.useCallback(async () => {
    if (!deletingJobId) return;
    
    // Start deletion animation
    setDeletingItemId(deletingJobId);
    setDeleteModalOpen(false);
    
    // Small delay for animation
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Smart state management: find previous item to switch to
    const deletedIndex = history.findIndex(h => h.jobId === deletingJobId);
    const wasActive = activeId === deletingJobId;
    
    // Delete from history
    deleteHistoryItem(deletingJobId);
    
    // Also delete associated task
    const tasks = await taskStorage.listTasks(user?.uid);
    const taskToDelete = tasks.find(t => t.results?.jobId === deletingJobId);
    if (taskToDelete) {
      await taskStorage.deleteTask(taskToDelete.taskId, user?.uid);
    }
    
    // Post-deletion behavior:
    // If the deleted thumbnail was being viewed, revert comparison to sidebar template.
    // If no template is selected, show default placeholders.
    if (wasActive) {
      setActiveId(null);
      setSourceForComparison(sourcePreviewUrl || ORIGINAL);
      setAfterImage(ORIGINAL);
      setBeforeUpscaleImage(null);
      setSliderPos(100);
    }
    
    // Clear deletion state
    setDeletingItemId(null);
    setDeletingJobId(null);
  }, [deletingJobId, history, activeId, deleteHistoryItem, user?.uid, sourcePreviewUrl, setActiveId]);

  const cancelDelete = React.useCallback(() => {
    setDeleteModalOpen(false);
    setDeletingJobId(null);
  }, []);
  
  // Copy URL to clipboard helper
  const copyToClipboard = React.useCallback((url: string, label: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(label);
      setTimeout(() => setCopiedUrl(null), 2000);
    }).catch(() => {
      showError('Failed to copy to clipboard');
    });
  }, [showError]);
  
  // Track image dimensions when they load
  React.useEffect(() => {
    if (!sourceForComparison || sourceForComparison === ORIGINAL) {
      setSourceImageDimensions(null);
      return;
    }
    const img = new Image();
    img.onload = () => setSourceImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    img.src = sourceForComparison;
  }, [sourceForComparison]);
  
  React.useEffect(() => {
    if (!afterImage || afterImage === ORIGINAL) {
      setAfterImageDimensions(null);
      return;
    }
    const img = new Image();
    img.onload = () => setAfterImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    img.src = afterImage;
  }, [afterImage]);

  const handleShareTask = React.useCallback(async () => {
    if (!currentTaskId) {
      showError('Please generate a design first to share it.');
      return;
    }

    const success = await copyTaskUrlToClipboard(currentTaskId);
    if (success) {
      setShareUrlCopied(true);
      setTimeout(() => setShareUrlCopied(false), 2000);
    } else {
      showError('Failed to copy URL to clipboard');
    }
  }, [currentTaskId, showError]);

  // Master footer "Generate" button support (mobile).
  React.useEffect(() => {
    const onFooterGenerate = () => {
      try {
        if (uiState.generationDisabled) return;
        if (uiState.inputsDisabled) return;
        if (isProcessing) return;
        void handleFabricSwap();
      } catch {
        // ignore
      }
    };

    window.addEventListener('khuyoot:designer-generate', onFooterGenerate as EventListener);
    return () => {
      window.removeEventListener('khuyoot:designer-generate', onFooterGenerate as EventListener);
    };
  }, [handleFabricSwap, isProcessing, uiState.generationDisabled, uiState.inputsDisabled]);

  // ========== MOBILE LAYOUT ==========
  if (isMobile) {
    const canGenerateNow = !uiState.generationDisabled && (!creditsEnabled || canAfford('generation'));
    return (
      <MobileDesignerV2
        beforeImage={sourceForComparison || ORIGINAL}
        afterImage={afterImage || ORIGINAL}
        sliderPos={sliderPos}
        onSliderChange={setSliderPos}
        isProcessing={isProcessing}
        onSelectTemplate={handleTemplateSelect}
        currentTemplateId={selectedTemplate?.id}
        isSubscribedToPremiumTemplates={isSubscribed || canAfford('premium_template')}
        onPremiumTemplateClick={() => setIsUpgradeModalOpen(true)}
        privacy={{
          isPrivacyMode,
          setPrivacyMode,
          maskingStyle,
          setMaskingStyle,
          blurStrength,
          setBlurStrength,
          selectedEmoji,
          setSelectedEmoji,
          isProcessingPrivacy,
          canApplyToCurrentTemplate: Boolean(afterImage && sourceImageBase64),
          onApplyToCurrentTemplate: handleApplyPrivacyShieldToCurrentTemplate,
        }}
        fabricPreviewUrl={
          history.find((h: any) => (h?.jobId ?? h?.clientId) === activeId)?.fabricUrl ||
          fabricPreviewUrl ||
          undefined
        }
        fabricProductId={
          history.find((h: any) => (h?.jobId ?? h?.clientId) === activeId)?.fabricId || undefined
        }
        fabricDebug={lastResponseDebug}
        onUploadFabric={(file) => void onPickFabric(file)}
        lightingPreset={lightingGenerator.value}
        onSelectLightingPreset={lightingGenerator.onSelectPreset}
        selectedModel={selectedModel}
        onChangeSelectedModel={setSelectedModel}
        upscaleEngine={upscaleEngine}
        onChangeUpscaleEngine={setUpscaleEngine}
        outputFit={outputFit}
        onChangeOutputFit={setOutputFit}
        generationCost={generationCost}
        canGenerate={canGenerateNow}
        onGenerate={() => void handleFabricSwap()}
        onRefillCredits={() => setIsUpgradeModalOpen(true)}
        history={history}
        historyLoading={isLoading}
        activeHistoryId={activeId}
        onSelectHistoryItem={handleHistorySelect}
        inputsDisabled={uiState.inputsDisabled}
      />
    );
  }

  // ========== DESKTOP LAYOUT ==========
  return (
    <>
      {/* Feature Toggle Bar (Admin Only) */}
      <FeatureToggleBar
        features={features}
        onFeaturesChange={setFeatures}
        isAdminUser={isAdminUser}
      />

      <div className="main-wrapper flex h-screen overflow-hidden bg-zinc-950 text-zinc-200">
        {/* Left Sidebar */}
        <aside className="w-[280px] shrink-0 border-r-2 border-zinc-700 flex flex-col h-screen bg-zinc-900 overflow-hidden">
          {/* Header & Scrollable Inputs */}
          <div
            className={`flex-1 ${sidebarHasVisibleContent ? 'overflow-y-auto custom-scrollbar' : 'overflow-y-hidden'} overflow-x-hidden p-4 space-y-6 pb-10`}
          >
            {/* Sidebar is cleaner without header - title moved to top bar */}

            {/* Model/Template Image */}
            {features.showTemplateUpload && (
              <div>
                <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  النموذج / القالب
                  {isLoadingProduct && (
                    <span className="ml-2 text-[10px] text-purple-400 animate-pulse">جاري التحميل...</span>
                  )}
                </div>
                <div className={uiState.uploadsDisabled ? 'opacity-60 pointer-events-none' : ''}>
                  <TemplateSelectorView
                    onSelect={handleTemplateSelect}
                    onTabChange={(tab) => {
                      // Update active tab immediately when user clicks tab button
                      setLastActiveTemplateTab(tab);
                      console.log(`[Designer] Tab switched to: ${tab}`);
                    }}
                    currentId={selectedTemplate?.id}
                    shopItems={productTemplates || undefined}
                    closetItems={undefined}
                    enableUpload
                    isSubscribed={isSubscribed || canAfford('premium_template')}
                    onPremiumClick={() => setIsUpgradeModalOpen(true)}
                    defaultTab={productTemplates ? 'Shop' : undefined}
                    loadingTemplateId={isLoadingProduct ? 'loading-product' : loadingTemplateId}
                  />
                </div>
              </div>
            )}

            {/* Fabric/Pattern Image */}
            {features.showFabricUpload && (
              <div>
                <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">القماش / النقشة</div>
                <label
                  className={`relative h-28 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/60 flex flex-col items-center justify-center gap-2 overflow-hidden cursor-pointer ${
                    uiState.uploadsDisabled ? 'opacity-60 pointer-events-none' : ''
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uiState.uploadsDisabled}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void onPickFabric(file);
                      e.currentTarget.value = '';
                    }}
                  />
                  {fabricPreviewUrl ? (
                    <img
                      src={fabricPreviewUrl}
                      alt="Fabric"
                      className="absolute inset-0 w-full h-full object-contain object-center"
                    />
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-zinc-500" />
                      <div className="text-xs text-zinc-500">رفع</div>
                    </>
                  )}
                  {fabricPreviewUrl && (
                    <div className="absolute bottom-2 left-2 text-[10px] px-2 py-0.5 rounded bg-black/50 border border-zinc-700">
                      تغيير
                    </div>
                  )}
                </label>

                {/* Fabric Material Selection */}
                <details className="mt-3 mb-4">
                  <summary className="cursor-pointer select-none text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    نوع القماش
                  </summary>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {[
                      { id: 'silk', label: 'حرير', icon: '✨' },
                      { id: 'cotton', label: 'قطن', icon: '☁️' },
                      { id: 'linen', label: 'كتان', icon: '🌾' },
                      { id: 'velvet', label: 'مخمل', icon: '🎭' },
                      { id: 'transparent', label: 'شفاف', icon: '💎' },
                      { id: 'wool', label: 'صوف', icon: '🧶' }
                    ].map(material => (
                      <button
                        key={material.id}
                        type="button"
                        onClick={() => setFabricMaterial(material.id as any)}
                        disabled={uiState.uploadsDisabled}
                        className={`px-2 py-2 rounded-lg text-[11px] font-medium transition-all duration-200 flex flex-col items-center gap-1 ${
                          fabricMaterial === material.id
                            ? 'bg-purple-500/30 border-2 border-purple-500 text-purple-200'
                            : 'bg-zinc-800/50 border border-zinc-700 text-zinc-400 hover:border-zinc-600'
                        } ${uiState.uploadsDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        title={material.label}
                      >
                        <span className="text-lg">{material.icon}</span>
                        <span className="text-[10px]">{material.label}</span>
                      </button>
                    ))}
                  </div>
                </details>
              </div>
            )}

            {/* Sidebar Generate button */}
            {features.showRefinementPrompt && (
              <button
                type="button"
                disabled={uiState.generationDisabled}
                onClick={handleFabricSwap}
                className={`generateButtonShine w-full px-4 py-3 rounded-xl font-extrabold tracking-wide text-base transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-purple-500/40 border ${
                  uiState.generationDisabled
                    ? 'bg-purple-600/60 text-white cursor-not-allowed border-purple-500/20'
                    : 'bg-purple-600 hover:bg-purple-500 text-white active:scale-95 border-purple-500/40 hover:border-purple-400/60'
                }`}
              >
                {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                {isProcessing ? (
                  'جاري المعالجة...'
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-pulse">✨</span>
                    <span>{`توليد${creditsEnabled && generationCost > 0 ? ` (${generationCost})` : ''}`}</span>
                  </span>
                )}
              </button>
            )}

            {/* Privacy Shield Section */}
            <div className="pt-6 border-t border-zinc-800">
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">حماية الخصوصية</div>
              
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-zinc-300">وضع الخصوصية</label>
                  <span className="text-[10px] text-purple-400">🛡️ محلي فقط</span>
                </div>
                <button
                  onClick={() => {
                    console.log('[Privacy Toggle] Current state:', isPrivacyMode, '→ New state:', !isPrivacyMode);
                    setPrivacyMode(!isPrivacyMode);
                  }}
                  disabled={isProcessingTemplate || isProcessingFabric || isProcessingPrivacy}
                  className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${
                    isPrivacyMode
                      ? 'bg-purple-500/40 border border-purple-500/60'
                      : 'bg-zinc-800 border border-zinc-700'
                  } ${(isProcessingTemplate || isProcessingFabric || isProcessingPrivacy) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      isPrivacyMode ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="text-[10px] text-zinc-400 p-3 bg-zinc-900/50 rounded border border-zinc-800 mb-4">
                {isPrivacyMode ? (
                  <>
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-emerald-400">✓</span>
                      <span>سيتم طمس الوجوه تلقائيًا <strong>محليًا</strong> قبل الرفع</span>
                    </div>
                    <div className="text-[9px] text-zinc-500">
                      تتم المعالجة على جهازك. الصور الأصلية غير المطموسة لا تغادر جهازك أبدًا.
                    </div>
                  </>
                ) : (
                  <span>فعّل لطمس الوجوه تلقائيًا في الصور المرفوعة لحماية الخصوصية</span>
                )}
              </div>

              {/* Masking Settings Collapsible */}
              {isPrivacyMode && (
                <details className="mb-4">
                  <summary className="cursor-pointer select-none text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    نمط الإخفاء والإعدادات
                  </summary>

                  <div className="mt-3 p-3 bg-zinc-900/50 border-2 border-purple-500/30 rounded-lg space-y-3">
                      {/* Masking Style Cards */}
                      <div>
                        <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2 block">النمط</label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { value: 'feathered-blur', icon: '🎭', label: 'ضبابية' },
                            { value: 'pixelate', icon: '🔲', label: 'بكسلة' },
                            { value: 'emoji', icon: '😊', label: 'إيموجي' },
                          ].map((style) => (
                            <button
                              key={style.value}
                              onClick={() => setMaskingStyle(style.value as any)}
                              className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                                maskingStyle === style.value
                                  ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                                  : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-purple-500/50'
                              }`}
                            >
                              <div className="text-2xl leading-none mb-1">{style.icon}</div>
                              <div className="text-[11px] font-semibold leading-tight">{style.label}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Blur Strength Slider */}
                      {maskingStyle === 'feathered-blur' && (
                        <div className="pt-2 border-t border-zinc-800">
                          <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2 block">Intensity</label>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-zinc-400">Blur Strength</span>
                            <span className="text-xs text-purple-400">{blurStrength}px</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="50"
                            value={blurStrength}
                            onChange={(e) => setBlurStrength(Number(e.target.value))}
                            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500"
                          />
                          <div className="flex justify-between text-[9px] text-zinc-500 mt-1">
                            <span>Light</span>
                            <span>Heavy</span>
                          </div>
                        </div>
                      )}

                      {/* Emoji Selector */}
                      {maskingStyle === 'emoji' && (
                        <div className="pt-2 border-t border-zinc-800">
                          <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2 block">Choose Emoji</label>
                          <div className="grid grid-cols-6 gap-2">
                            {['😊', '😃', '🙂', '😄', '😁', '🥰', '😍', '🤗', '😌', '😎', '🤩', '😇'].map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => setSelectedEmoji(emoji)}
                                className={`p-2 text-2xl rounded-lg border transition-all ${
                                  selectedEmoji === emoji
                                    ? 'bg-purple-500/20 border-purple-500 scale-110'
                                    : 'bg-zinc-900 border-zinc-700 hover:border-purple-500/50'
                                }`}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Test Button */}
                      {sourceImageBase64 && (
                        <div className="pt-2 border-t border-zinc-800">
                          <button
                          onClick={async () => {
                            try {
                              console.log('[Privacy Test] Starting test on current template image');
                              
                              const currentSliderPos = sliderPos;
                              
                              const binaryString = atob(sourceImageBase64);
                              const bytes = new Uint8Array(binaryString.length);
                              for (let i = 0; i < binaryString.length; i++) {
                                bytes[i] = binaryString.charCodeAt(i);
                              }
                              const blob = new Blob([bytes], { type: sourceImageMimeType || 'image/jpeg' });
                              const file = new File([blob], 'test-image.jpg', { type: blob.type });
                              
                              const processedFile = await processWithPrivacyShield(file);
                              const processedUrl = URL.createObjectURL(processedFile);
                              
                              setAfterImage(processedUrl);
                              setSliderPos(currentSliderPos);
                              
                              console.log('[Privacy Test] ✅ Processing complete, showing result');
                            } catch (error) {
                              console.error('[Privacy Test] Failed:', error);
                              showError('Privacy Shield test failed');
                            }
                          }}
                          disabled={isProcessingPrivacy}
                          className={`w-full px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                            isProcessingPrivacy
                              ? 'bg-purple-500/30 text-purple-300 cursor-wait'
                              : 'bg-purple-600 text-white hover:bg-purple-700 active:scale-95'
                          }`}
                        >
                          {isProcessingPrivacy ? (
                            <span className="flex items-center justify-center gap-2">
                              <span className="inline-block w-4 h-4 border-2 border-purple-300/30 border-t-purple-300 rounded-full animate-spin" />
                              Testing...
                            </span>
                          ) : (
                            '🧪 Test Privacy Shield'
                          )}
                        </button>
                        </div>
                      )}
                  </div>
                </details>
              )}
            </div>

          {/* Sidebar Generate button */}
          {features.showRefinementPrompt && (
            <button
              type="button"
              disabled={uiState.generationDisabled}
              onClick={handleFabricSwap}
              className={`generateButtonShine mt-3 w-full px-4 py-3 rounded-xl font-extrabold tracking-wide text-base transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-purple-500/40 border ${
                uiState.generationDisabled
                  ? 'bg-purple-600/60 text-white cursor-not-allowed border-purple-500/20'
                  : 'bg-purple-600 hover:bg-purple-500 text-white active:scale-95 border-purple-500/40 hover:border-purple-400/60'
              }`}
            >
              {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
              {isProcessing ? (
                'جاري المعالجة...'
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-pulse">✨</span>
                  <span>{`توليد${creditsEnabled && generationCost > 0 ? ` (${generationCost})` : ''}`}</span>
                </span>
              )}
            </button>
          )}

          {/* Apply Privacy Shield Button - Always visible when enabled */}
          {isPrivacyMode && sourceImageBase64 && (
            <button
              onClick={() => void handleApplyPrivacyShieldToCurrentTemplate()}
              disabled={isProcessingPrivacy}
              className={`mt-3 w-full px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                isProcessingPrivacy
                  ? 'bg-purple-500/30 text-purple-300 cursor-wait'
                  : 'bg-purple-600 text-white hover:bg-purple-700 active:scale-95'
              }`}
            >
              {isProcessingPrivacy ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-purple-300/30 border-t-purple-300 rounded-full animate-spin" />
                  جاري التطبيق...
                </span>
              ) : (
                '🛡️ تطبيق حماية الخصوصية'
              )}
            </button>
          )}

          {(features.showModelSelection || features.showRefinementPrompt) && (
            <details className="pt-6 border-t border-zinc-800">
              <summary className="cursor-pointer select-none text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                إعدادات متقدمة
              </summary>

              {/* Model Selection */}
              {features.showModelSelection && (
                <div className="mt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">اختيار النموذج</div>
                    <div className="group relative">
                      <Info className="w-3.5 h-3.5 text-zinc-500 cursor-help" />
                      <div className="invisible group-hover:visible absolute left-0 top-full mt-1 w-40 bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-[10px] text-zinc-300 z-50">
                        اختر بين التبديل السريع (NanoBana) أو النتائج عالية الجودة (Pro).
                      </div>
                    </div>
                  </div>
                  <SegmentedToggle
                    options={[
                      {
                        label: 'NanoBana',
                        badge: 'سريع',
                        description: 'الأفضل للاستبدال السريع للقماش مع الحفاظ على الوضعية والميزات.',
                      },
                      {
                        label: 'Pro',
                        badge: 'جودة عالية',
                        description: 'فهم عميق مع مزج فني للقماش وتدلي طبيعي.',
                      },
                    ]}
                    active={selectedModel}
                    onChange={(v) => setSelectedModel(v as 'NanoBana' | 'Pro')}
                    disabled={uiState.inputsDisabled}
                    showDescription
                  />
                </div>
              )}

              {/* Refinement Prompt */}
              {features.showRefinementPrompt && (
                <div className="mt-4">
                  <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    تعليمات التحسين (اختياري)
                  </div>
                  <textarea
                    value={refinementPrompt}
                    onChange={(e) => setRefinementPrompt(e.target.value)}
                    disabled={uiState.inputsDisabled}
                    placeholder="مثلًا، 'اجعل القماش يتدلى بشكل طبيعي' أو 'حافظ على الخلفية الأصلية'"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40 resize-none"
                    rows={3}
                  />
                </div>
              )}
            </details>
          )}

          {/* Output Quality Section */}
          {features.showOutputQuality && (
            <div className="pt-6 border-t border-zinc-800">
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">جودة المخرجات</div>

              {features.showUpscaleEngine && (
                <div className="mb-3">
                  <div className="text-xs text-zinc-500 mb-1.5">محرك التحسين</div>
                  <div className={`relative ${uiState.allDisabled ? 'opacity-60' : ''}`}>
                    <select
                      value={upscaleEngine}
                      disabled={uiState.allDisabled}
                      onChange={(e) => setUpscaleEngine(e.target.value as 'standard' | 'creative')}
                      className="w-full appearance-none bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                    >
                      <option value="standard">حاد قياسي</option>
                      <option value="creative">تفاصيل إبداعية</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  </div>
                </div>
              )}

              {features.showOutputFit && (
                <div className="mb-1">
                  <div className="text-xs text-zinc-500 mb-1.5">ملاءمة المخرج</div>
                  <div className={`relative ${uiState.inputsDisabled ? 'opacity-60' : ''}`}>
                    <select
                      value={outputFit}
                      disabled={uiState.inputsDisabled}
                      onChange={(e) => setOutputFit(e.target.value as 'contain' | 'cover')}
                      className="w-full appearance-none bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                    >
                      <option value="contain">ملائم (بدون قص)</option>
                      <option value="cover">ممتلئ (مع القص)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  </div>
                </div>
              )}

              {features.showUpscaleButton && uiState.showUpscaleButton && (
                <div className="mt-4 pt-4 border-t border-zinc-700">
                  <button
                    onClick={handleUpscale}
                    disabled={uiState.upscaleDisabled}
                    className={`w-full px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                      uiState.upscaleDisabled
                        ? 'bg-purple-500/30 text-purple-300 cursor-wait'
                        : 'bg-purple-600 text-white hover:bg-purple-700 active:scale-95'
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    {isUpscaling ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="inline-block w-4 h-4 border-2 border-purple-300/30 border-t-purple-300 rounded-full animate-spin" />
                        جاري التحسين ({Math.round(upscaleProgress)}%)
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <span>
                          ✨ تحسين النتيجة (2x)
                          {creditsEnabled && upscaleCost > 0 ? ` (${upscaleCost})` : ''}
                        </span>
                      </span>
                    )}
                  </button>
                  <div className="text-xs text-zinc-500 text-center mt-2">
                    الصورة المولدة ستصبح "قبل"، والنسخة المحسنة ستصبح "بعد"
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Export Settings Section */}
          {features.showExportSettings && (
            <details className="pt-6 border-t border-zinc-800">
              <summary className="cursor-pointer select-none text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                إعدادات التصدير
              </summary>

              <div className="mt-3">

              {features.showWatermarkToggle && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-zinc-300">إضافة علامة مائية</label>
                      {!isSubscribed && <span className="text-[10px] text-purple-400">🔒 الوضع المجاني</span>}
                      {isSubscribed && <span className="text-[10px] text-emerald-400">✓ احترافي</span>}
                    </div>
                    <button
                      onClick={() => {
                        if (!isSubscribed) {
                          // Free users can only toggle ON (watermark always required)
                          if (!isWatermarkEnabled) {
                            setIsUpgradeModalOpen(true);
                            return;
                          }
                        } else {
                          // Pro users can toggle freely
                          setIsWatermarkEnabled(!isWatermarkEnabled);
                        }
                      }}
                      disabled={uiState.watermarkDisabled}
                      className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${
                        isWatermarkEnabled
                          ? 'bg-purple-500/40 border border-purple-500/60'
                          : 'bg-zinc-800 border border-zinc-700'
                      } ${uiState.watermarkDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          isWatermarkEnabled ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  {isWatermarkEnabled && (
                    <div className="text-[10px] text-zinc-400 p-2 bg-zinc-900/50 rounded border border-zinc-800 mb-4">
                      سيتم إضافة علامة مائية "تم التوليد بواسطة خيوط" على الصورة.
                    </div>
                  )}
                </>
              )}

              {features.showSubscriptionControls && uiState.showUpgradePrompt && (
                <button
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="w-full mt-4 px-3 py-2 text-sm font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/30 rounded-lg hover:bg-purple-500/20 hover:border-purple-500/50 transition-all"
                >
                  الترقية إلى احترافي (إزالة العلامات المائية)
                </button>
              )}

              {features.showSubscriptionControls && uiState.showProFeatures && (
                <div className="w-full mt-4 px-3 py-2 text-sm font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-center">
                  ✓ تم فتح الميزات الاحترافية!
                </div>
              )}
              </div>
            </details>
          )}

          {features.showDebugSection && (
          <details className="rounded-lg border border-zinc-800 bg-zinc-950/40">
          <summary className="cursor-pointer select-none px-3 py-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            تصحيح الأخطاء
          </summary>
          <div className="px-3 pb-3 text-[11px] text-zinc-300">
            <div className="text-zinc-500 mb-2">Last request/response (dev only)</div>
            <pre className="whitespace-pre-wrap break-words bg-zinc-950 border border-zinc-800 rounded-md p-2 overflow-auto max-h-64">
{JSON.stringify(
  {
    request: lastRequestDebug,
    response: lastResponseDebug,
  },
  null,
  2
)}
            </pre>
          </div>
          </details>
          )}
        </div>

        {/* Fixed Button Footer - Always visible at bottom */}
        {features.showGenerateButton && (
        <div className="p-4 border-t border-zinc-800 bg-zinc-950">
          <button
            type="button"
            disabled={uiState.generationDisabled}
            onClick={handleFabricSwap}
            className={`generateButtonShine w-full h-14 rounded-2xl font-extrabold tracking-wide text-base transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-purple-500/40 border ${
              uiState.generationDisabled
                ? 'bg-purple-600/60 text-white cursor-not-allowed border-purple-500/20 opacity-50 pointer-events-none'
                : 'bg-purple-600 hover:bg-purple-500 text-white active:scale-95 border-purple-500/40 hover:border-purple-400/60'
            }`}
          >
            {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
            {isProcessing
              ? 'جاري المعالجة...'
              : `توليد وتحسين${creditsEnabled && generationCost > 0 ? ` (${generationCost})` : ''}`}
          </button>
        </div>
        )}
      </aside>

      {/* Center Content */}
      <main className="flex-1 relative flex flex-col min-w-0 min-h-0 overflow-hidden bg-zinc-950">
        {/* Top Bar */}
        {features.showTopBar && (
        <DesignerHeader
          onHome={navigateHome}
          title="مصمم الأقمشة V2.1"
          rightSlot={
            <div className="flex items-center gap-3">
              <CreditBadge onRefill={() => setIsUpgradeModalOpen(true)} />
              <button
                onClick={navigateProfile}
                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-lg border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 transition-colors"
                title={isAdminUser ? 'Go to Control Panel' : 'Go to Account'}
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="text-xs text-zinc-300">{user?.email?.split('@')[0] || 'User'}</span>
              </button>
            </div>
          }
        />
        )}

        {/* Scrollable Content */}
        <div
          className={`flex-1 min-h-0 ${mainHasVisibleContent ? 'overflow-y-auto custom-scrollbar' : 'overflow-y-hidden'} bg-zinc-950 pb-24`}
        >
          {/* Main Viewport */}
          <div className="p-8 bg-zinc-950">
            <div className="relative rounded-2xl border border-zinc-700 bg-zinc-900 overflow-hidden">
              {features.showComparisonSlider ? (
                <div className="relative px-4" dir="ltr">
                  <ImageSlider
                    before={sourceForComparison}
                    after={afterImage}
                    value={sliderPos}
                    onChange={setSliderPos}
                  />

                  <FabricSourceTile
                    debug={lastResponseDebug}
                    fallbackThumbnailUrl={history.find((h: any) => (h?.jobId ?? h?.clientId) === activeId)?.fabricUrl || fabricPreviewUrl || undefined}
                    productId={history.find((h: any) => (h?.jobId ?? h?.clientId) === activeId)?.fabricId || undefined}
                  />

                  {isProcessing && <ProcessingOverlay progress={progress} />}
                  {isLoadingHistoryImage && (
                    <div className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm flex items-center justify-center z-40">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                        <span className="text-xs text-zinc-400">Loading image...</span>
                      </div>
                    </div>
                  )}

                  {/* Floating Vertical Toolbar */}
                  {features.showFloatingToolbar && (
                    <div className="absolute top-1/2 -translate-y-1/2 right-4 flex flex-col gap-2 z-50">
                      <button
                        type="button"
                        title={shareUrlCopied ? 'تم نسخ الرابط!' : 'مشاركة التصميم'}
                        onClick={handleShareTask}
                        disabled={!currentTaskId}
                        className={`p-3 bg-zinc-900/90 border rounded-xl transition-all ${
                          shareUrlCopied
                            ? 'border-green-500/60 bg-green-500/10'
                            : 'border-zinc-800 hover:border-purple-500/60'
                        } ${!currentTaskId ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {shareUrlCopied ? (
                          <Check className="w-5 h-5 text-green-400" />
                        ) : (
                          <Share2 className="w-5 h-5 text-zinc-300" />
                        )}
                      </button>
                      <button
                        type="button"
                        title="تحميل النتيجة"
                        className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl hover:border-purple-500/60 transition-colors"
                      >
                        <Download className="w-5 h-5 text-zinc-300" />
                      </button>
                      <button
                        type="button"
                        title="تكبير"
                        className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl hover:border-purple-500/60 transition-colors"
                      >
                        <ZoomIn className="w-5 h-5 text-zinc-300" />
                      </button>
                      <button
                        type="button"
                        title="وضع ملء الشاشة"
                        className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl hover:border-purple-500/60 transition-colors"
                      >
                        <Maximize2 className="w-5 h-5 text-zinc-300" />
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Lighting presets row (below canvas) */}
            <div className="mt-2 mb-1 flex justify-center">
              <LightingPresets value={lightingGenerator.value} onChange={lightingGenerator.onSelectPreset} />
            </div>
          </div>

          {/* Bottom Filmstrip: Generation History */}
          {features.showHistoryFilmstrip && (
          <HistoryFilmstrip
            history={history}
            isLoading={isLoading}
            activeId={activeId}
            onSelect={handleSelectHistory}
            onDelete={handleDeleteSlot}
            onSetBefore={setBeforeFromHistory}
            onSetAfter={setAfterFromHistory}
            deletingItemId={deletingItemId}
          />
          )}

          {/* Full Size Comparison Section */}
          {features.showFullComparison && (
          <div className="border-t border-zinc-800 bg-zinc-950 p-6" dir="ltr">
            <div className="grid grid-cols-2 gap-6 max-w-7xl mx-auto min-h-[420px]">
              {/* Source Image */}
              <div className="space-y-2 flex flex-col">
                <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">النموذج الأصلي</div>
                <div className="flex-1 bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 flex items-center justify-center relative min-h-[420px]">
                  {sourceForComparison ? (
                    <img
                      src={sourceForComparison}
                      alt="Source"
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  ) : null}
                </div>
              </div>

              {/* Result Image */}
              <div className="space-y-2 flex flex-col">
                <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">نتيجة الذكاء الاصطناعي</div>
                <div className="flex-1 bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 flex items-center justify-center relative min-h-[420px]">
                  {afterImage ? (
                    <img
                      src={afterImage}
                      alt="Result"
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-4 text-zinc-500">
                      <div className="w-24 h-24 rounded-full bg-zinc-800/50 border-2 border-dashed border-zinc-700 flex items-center justify-center">
                        <svg className="w-12 h-12 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="text-sm font-medium">لا توجد نتيجة بعد</div>
                      <div className="text-xs text-zinc-600">قم بالتوليد لرؤية تصميمك</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Metadata Panel - Shows details of selected thumbnail */}
          {features.showFullComparison && activeId && history.find(h => h.jobId === activeId) && (() => {
            const activeItem = history.find(h => h.jobId === activeId);
            return (
              <div className="border-t border-zinc-800 bg-zinc-950 px-6 pt-6 pb-6">
                <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800 max-w-7xl mx-auto">
                  <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    تفاصيل التوليد
                  </div>
                  
                  {/* Currently Displayed Images Info */}
                  <div className="mb-6 p-3 bg-zinc-950 rounded-lg border border-zinc-700">
                    <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3">المعروض حاليًا</div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <div className="text-zinc-500 mb-1 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          النموذج الأصلي (يسار)
                        </div>
                        <div className="text-zinc-300 font-mono text-[10px]">
                          {sourceImageDimensions ? `${sourceImageDimensions.width} × ${sourceImageDimensions.height}px` : 'جاري التحميل...'}
                        </div>
                        <div className="text-zinc-600 text-[9px] mt-1 truncate" title={sourceForComparison}>
                          {sourceForComparison === ORIGINAL ? 'Placeholder' : sourceForComparison.split('/').pop()?.split('?')[0]}
                        </div>
                      </div>
                      <div>
                        <div className="text-zinc-500 mb-1 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                          نتيجة الذكاء الاصطناعي (يمين)
                        </div>
                        <div className="text-zinc-300 font-mono text-[10px]">
                          {afterImageDimensions ? `${afterImageDimensions.width} × ${afterImageDimensions.height}px` : 'جاري التحميل...'}
                        </div>
                        <div className="text-zinc-600 text-[9px] mt-1 truncate" title={afterImage}>
                          {afterImage === ORIGINAL ? 'Placeholder' : afterImage.split('/').pop()?.split('?')[0]}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Selected Generation Data */}
                  <div className="space-y-4">
                    <div>
                      <div className="text-zinc-500 mb-1 text-xs">معرف العملية</div>
                      <div className="flex items-center gap-2">
                        <div className="text-zinc-300 font-mono text-xs flex-1 break-all">{activeId}</div>
                        <button
                          onClick={() => copyToClipboard(activeId, 'Job ID')}
                          className="p-1 hover:bg-zinc-800 rounded transition-colors flex-shrink-0"
                          title="Copy Job ID"
                        >
                          {copiedUrl === 'Job ID' ? (
                            <Check className="w-3 h-3 text-green-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-zinc-400" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-zinc-500 mb-2 text-xs">رابط الصورة الكاملة</div>
                        <URLDisplay label="Full Image" url={activeItem?.fullImageUrl} onCopy={copyToClipboard} />
                      </div>
                      <div>
                        <div className="text-zinc-500 mb-2 text-xs">رابط الصورة المصغرة</div>
                        <URLDisplay label="Thumbnail" url={activeItem?.thumbnailUrl} onCopy={copyToClipboard} />
                      </div>
                      <div>
                        <div className="text-zinc-500 mb-2 text-xs">رابط النموذج</div>
                        <URLDisplay label="Template" url={activeItem?.templateUrl} onCopy={copyToClipboard} />
                      </div>
                      <div>
                        <div className="text-zinc-500 mb-2 text-xs">رابط القماش</div>
                        <URLDisplay label="Fabric" url={activeItem?.fabricUrl} onCopy={copyToClipboard} />
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-zinc-500 mb-1 text-xs">تاريخ الإنشاء</div>
                      <div className="text-zinc-300 text-xs">
                        {new Date(activeItem?.createdAt || '').toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Upgrade Modal */}
        {features.showUpgradeModal && (
          <UpgradeModal
            isOpen={isUpgradeModalOpen}
            onClose={() => setIsUpgradeModalOpen(false)}
            onUpgradeClick={handleUpgrade}
          />
        )}
      </main>
    </div>
    
    <DeleteConfirmModal
      isOpen={deleteModalOpen}
      onConfirm={confirmDelete}
      onCancel={cancelDelete}
      itemName="هذا التوليد"
    />
    
    <ErrorModal
      isOpen={errorModalOpen}
      onClose={() => setErrorModalOpen(false)}
      title="خطأ"
      message={errorMessage}
    />
    </>
  );
};

