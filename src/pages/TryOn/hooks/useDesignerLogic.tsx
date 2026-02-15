
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useApp } from '../../../../context/AppContext';
import { useAuth } from "../../../auth/useAuth";
import { useDesignerStore } from '../../../store/useDesignerStore';
import { useTemplateSelection, useTemplateStore } from '../../../modules/TemplatePicker';
import { usePrivacyShield } from '../../../modules/PrivacyShield';
import { useLightingGenerator } from '../../../modules/generator/hooks/useLightingGenerator';
import { useGenerationHistory } from './useGenerationHistory';
import { taskStorage, generateTaskId, copyTaskUrlToClipboard } from '../services/taskStorage';
import { traceStep, traceEnd, traceSetActive } from '../../../utils/trace';
import { useCredits } from '../../../modules/CreditManager';
import { useModalStore } from '../../../store/useModalStore';
import { firebaseService } from '../../../../services/firebase';
import { getProductById } from '../../../../services/mockService';
import { useMobileDetection } from '../../../modules/designer/mobile';
import { generateFabricSwap } from '../../../services/fabricSwapService';
import SegmentedToggle from '../../../components/DesignerV2_1/SegmentedToggle';
import { type DesignTask } from '../types/task';
import { DesignerV2Features, DEFAULT_FEATURES, DesignerUIState } from '../types';
import { LightingPresets, getLightingDescriptor, type LightingPreset } from '../components/LightingPresets';


const ORIGINAL = null as string | null;
const DESIGNER_CACHE_VERSION = 2;

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

function parseDataUrlImage(dataUrl: string): { base64: string; mimeType: string } | null {
  if (!dataUrl || !dataUrl.startsWith('data:')) return null;
  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex < 0) return null;

  const header = dataUrl.slice(0, commaIndex);
  const base64 = dataUrl.slice(commaIndex + 1);
  if (!base64) return null;

  const mimeMatch = header.match(/^data:([^;]+);base64$/i);
  const mimeType = (mimeMatch?.[1] || 'image/jpeg').toLowerCase();
  return { base64, mimeType };
}

async function urlToBase64Image(url: string, fallbackMimeType?: string | null): Promise<{ base64: string; mimeType: string } | null> {
  if (!url) return null;

  const fromDataUrl = parseDataUrlImage(url);
  if (fromDataUrl) return fromDataUrl;

  try {
    const res = await fetch(url, { cache: 'force-cache' });
    if (!res.ok) return null;
    const blob = await res.blob();

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('FileReader failed'));
      reader.readAsDataURL(blob);
    });

    const parsed = parseDataUrlImage(dataUrl);
    if (!parsed) return null;

    return {
      base64: parsed.base64,
      mimeType: parsed.mimeType || fallbackMimeType || blob.type || 'image/jpeg',
    };
  } catch {
    return null;
  }
}

/**
 * Smart compression: Only compress images larger than 2MB to prevent ERR_CONNECTION_RESET
 */
async function smartCompressImage(file: File): Promise<{ base64: string; mimeType: string }> {
  const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB threshold
  const MAX_DIMENSION = 1536; // Max dimension for large images
  
  const normalizeMimeType = (type: string): string => {
    const normalizedType = (type || '').toLowerCase();
    if (normalizedType === 'image/jpg' || normalizedType === 'image/jpeg') return 'image/jpeg';
    if (normalizedType === 'image/webp') return 'image/webp';
    if (normalizedType === 'image/png') return 'image/png';
    return 'image/png';
  };
  
  if (file.size <= MAX_SIZE_BYTES) {
    const reader = new FileReader();
    return new Promise((resolve) => {
      reader.onloadend = () => {
        const res = reader.result as string;
        resolve({ base64: res.split(',')[1], mimeType: normalizeMimeType(file.type) });
      };
      reader.readAsDataURL(file);
    });
  }
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let width = img.width;
      let height = img.height;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas ctx failed'));
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Blob failed'));
        const fr = new FileReader();
        fr.onloadend = () => {
          const res = fr.result as string;
          resolve({ base64: res.split(',')[1], mimeType: normalizeMimeType(blob.type) });
        };
        fr.readAsDataURL(blob);
      }, 'image/jpeg', 0.85);
    };
    img.onerror = () => reject(new Error('Load failed'));
    img.src = objectUrl;
  });
}

// Slider position persistence per generation
const SLIDER_POSITIONS_KEY = 'designer_v2_slider_positions';

function getSavedSliderPosition(imageId: string | null): number | null {
  if (!imageId) return null;
  try {
    const value = window.localStorage.getItem(SLIDER_POSITIONS_KEY);
    const positions = value ? JSON.parse(value) : {};
    return positions?.[imageId] ?? null;
  } catch {
    return null;
  }
}

function saveSliderPosition(imageId: string | null, position: number): void {
  if (!imageId) return;
  try {
    const value = window.localStorage.getItem(SLIDER_POSITIONS_KEY);
    const positions = value ? JSON.parse(value) : {};
    positions[imageId] = position;
    window.localStorage.setItem(SLIDER_POSITIONS_KEY, JSON.stringify(positions));
  } catch (e) {
    console.warn('[SliderPersistence] Failed to save position:', e);
  }
}

function safeLocalStorageGet<T>(key: string): T | null {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}


function safeLocalStorageSet(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota/security errors
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
    console.warn('[Slider Persistence] Failed to clear old positions:', e);
  }
}
export const useDesignerLogic = () => {
  const { t, i18n } = useTranslation(['designer']);




  

  // ========== PERFORMANCE TRACKING ==========
  const renderCountRef = React.useRef(0);
  const mountTimeRef = React.useRef(new Date().toISOString());
  // Track active async requests to prevent stale updates on remount
  const activeRequestId = React.useRef<number>(0);
  const isMounted = React.useRef(true);

  React.useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  
  
  React.useEffect(() => {
    // Component lifecycle tracking (debug disabled)
    renderCountRef.current++;
  }, []);

  // ========== MOBILE DETECTION ==========
  const isMobile = useMobileDetection();

  // ========== ROUTING & TASK ID ==========
  const navigate = useNavigate();
  const location = useLocation();
  const { taskId: urlTaskId, productId } = useParams<{ taskId?: string; productId?: string }>();
  // Also check if we have a state-passed product (e.g. from navigation)
  const locationState = location.state as { product?: any; productId?: string } | null;
  
  // Determine if this is a real store product (tailor shop) vs a generic user session
  // If the product is "uploaded by the user", we assume it implies NO VALID STORE PRODUCT ID is present.
  const hasActiveProduct = React.useMemo(() => {
    return !!productId || !!locationState?.product || !!locationState?.productId;
  }, [productId, locationState]);

  // ========== AUTH & ADMIN ==========
  const { user, toggleAuthModal } = useApp();
  const { user: authUser, status } = useAuth();
  const isAdminUser = user?.role === 'admin';

  // ========== UI COLLAPSE STATE ==========
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [isHistoryCollapsed, setIsHistoryCollapsed] = React.useState(true);

  const planBonusKeyRef = React.useRef<string>('designer_v2:planBonusClaimed:guest');
  const [planBonusClaimed, setPlanBonusClaimed] = React.useState(false);

  React.useEffect(() => {
    const key = user?.uid ? `designer_v2:planBonusClaimed:${user.uid}` : 'designer_v2:planBonusClaimed:guest';
    planBonusKeyRef.current = key;
    try {
      setPlanBonusClaimed(window.localStorage.getItem(key) === '1');
    } catch (err) {
      console.warn('[Designer] Failed to read plan bonus flag', err);
      setPlanBonusClaimed(false);
    }
  }, [user?.uid]);

  const markPlanBonusClaimed = React.useCallback(() => {
    setPlanBonusClaimed(true);
    try {
      window.localStorage.setItem(planBonusKeyRef.current, '1');
    } catch (err) {
      console.warn('[Designer] Failed to persist plan bonus flag', err);
    }
  }, []);

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
  const clearSelection = useDesignerStore((s) => s.clearSelection);

  React.useEffect(() => {
    hydrateDesignerStore();
  }, [hydrateDesignerStore]);

  // ========== TEMPLATE SELECTION HOOKS (MUST BE BEFORE handleFabricSwap) ==========
  const { selectedTemplate, selectTemplate } = useTemplateSelection(null);
  const { addToCloset } = useTemplateStore();
  const selectedTemplateIdRef = React.useRef<string | null>(null);
  
  React.useEffect(() => {
    selectedTemplateIdRef.current = selectedTemplate?.id;
  }, [selectedTemplate?.id]);

  // Cache remote template downloads so re-selecting the same template doesn't refetch.
  // This is intentionally File-based (not blob: URLs) to stay compatible with CSP that blocks fetch(blob:...).
  const templateFileCacheRef = React.useRef<Map<string, File>>(new Map());
  
  // Track uploaded templates that should be added to closet after successful generation
  const pendingClosetUploadRef = React.useRef<{ file: File; name: string } | null>(null);

  // Error modal state (must be declared before callbacks that use it)
  const [errorModalOpen, setErrorModalOpen] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  const [currentTaskId, setCurrentTaskId] = React.useState<string | null>(null);
  const [shareUrlCopied, setShareUrlCopied] = React.useState(false);
  
  // Image dimension tracking
  const [sourceImageDimensions, setSourceImageDimensions] = React.useState<{ width: number; height: number } | null>(null);
  const [afterImageDimensions, setAfterImageDimensions] = React.useState<{ width: number; height: number } | null>(null);
  const [copiedUrl, setCopiedUrl] = React.useState<string | null>(null);

  // ========== MEASUREMENTS MODAL ==========
  const [isMeasurementsModalOpen, setIsMeasurementsModalOpen] = React.useState(false);

  const openMeasurementsModal = React.useCallback(() => {
    setIsMeasurementsModalOpen(true);
  }, []);

  const closeMeasurementsModal = React.useCallback(() => {
    setIsMeasurementsModalOpen(false);
  }, []);

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

  // Mobile rule: use only ImagePrepModal for privacy filtering.
  // Desktop/global privacy controls must not affect mobile uploads.
  const effectivePrivacyModeForProcessing = false;

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
  const [lastActiveTemplateTab, setLastActiveTemplateTab] = React.useState<'Studio' | 'Shop' | 'Closet'>('Closet');

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
  
  // Tiling & Scale States
  const [fabricTilingOpen, setFabricTilingOpen] = React.useState(false); // Used for the slider row visibility
  const [fabricScale, setFabricScale] = React.useState(1);
  const [originalFabricData, setOriginalFabricData] = React.useState<{ base64: string; mimeType: string; url: string } | null>(null);
  const fabricInputRef = React.useRef<HTMLInputElement | null>(null);
  const sourceInputRef = React.useRef<HTMLInputElement | null>(null);

  // Image Preparation (crop + optional face hide) before fabric upload
  const [fabricPrepOpen, setFabricPrepOpen] = React.useState(false);
  const [fabricPrepFile, setFabricPrepFile] = React.useState<File | null>(null);

  const openFabricPrep = React.useCallback((file: File) => {
    setFabricPrepFile(file);
    setFabricPrepOpen(true);
  }, []);

  const closeFabricPrep = React.useCallback(() => {
    setFabricPrepOpen(false);
    setFabricPrepFile(null);
  }, []);

  // Image Preparation for user image upload (crop + optional face hide)
  const [userImagePrepOpen, setUserImagePrepOpen] = React.useState(false);
  const [userImagePrepFile, setUserImagePrepFile] = React.useState<File | null>(null);

  const openUserImagePrep = React.useCallback((file: File) => {
    setUserImagePrepFile(file);
    setUserImagePrepOpen(true);
  }, []);

  const closeUserImagePrep = React.useCallback(() => {
    setUserImagePrepOpen(false);
    setUserImagePrepFile(null);
  }, []);

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
      const url = toDataUrl(persistedFabricImage.base64, persistedFabricImage.mimeType);
      setFabricImageBase64(persistedFabricImage.base64);
      setFabricImageMimeType(persistedFabricImage.mimeType);
      setFabricPreviewUrl(url);
      setOriginalFabricData({ base64: persistedFabricImage.base64, mimeType: persistedFabricImage.mimeType, url });
    }
  }, [persistedFabricImage, fabricImageBase64, fabricImageMimeType]);

  // Image processing state
  const [isProcessingTemplate, setIsProcessingTemplate] = React.useState<boolean>(false);
  const [isProcessingFabric, setIsProcessingFabric] = React.useState<boolean>(false);
  const templateProcessTokenRef = React.useRef(0);
  const fabricProcessTokenRef = React.useRef(0);

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
  const [debugPanelOpen, setDebugPanelOpen] = React.useState<boolean>(false);
  
  // Use global modal store action, but avoid subscribing this entire page to modal open/close.
  const setIsUpgradeModalOpen = useModalStore((s) => s.setIsUpgradeModalOpen);

  const {
    canAfford,
    enabled: creditsEnabled,
    getCost,
    executeCreditAction,
    refresh: refreshCredits,
  } = useCredits();

  const generationCost = getCost('generation');
  const upscaleCost = getCost('upscale');

  const openUpgradeModal = React.useCallback(
    (source: string = 'unknown') => {
      traceStep('designer_v2_upgrade_click', { source });
      setIsUpgradeModalOpen(true);
    },
    [setIsUpgradeModalOpen]
  );

  const handlePlanSelect = React.useCallback(
    async (planId: string) => {
      traceStep('designer_v2_plan_select', { planId, bonusApplied: !planBonusClaimed });
      if (planBonusClaimed) return;

      const currentUser = firebaseService.auth?.currentUser;
      if (!currentUser) {
        showError(t('loginRequired'));
        return;
      }

      try {
        markPlanBonusClaimed();
        await refreshCredits();
      } catch (error: any) {
        console.error('[Designer] Failed to apply plan bonus', error);
        showError(error?.message || t('planBonusAddFailed'));
      }
    },
    [markPlanBonusClaimed, planBonusClaimed, refreshCredits, showError]
  );

  const handleUpgrade = React.useCallback(async () => {
    console.log('[Designer] handleUpgrade START');
    const currentUser = firebaseService.auth?.currentUser;
    if (!currentUser) {
      console.error('[Designer] No user logged in');
      throw new Error(t('mustLoginFirst'));
    }

    console.log('[Designer] User ID:', currentUser.uid);
    
    // Use user-allowed purchase flow (Firestore rules block admin/manual adjustments for regular users)
    try {
      console.log('[Designer] Calling Firebase purchaseCredits...');
      const baseAmount = 200;
      const bonusAmount = !planBonusClaimed ? 10 : 0;
      const totalAmount = baseAmount + bonusAmount;

      const result = await firebaseService.purchaseCredits({
        userId: currentUser.uid,
        amount: totalAmount,
        packageType: 'upgrade_bonus',
        packageName: bonusAmount > 0 ? `Upgrade bonus (${baseAmount}) + Plan Selection Bonus (${bonusAmount})` : 'Upgrade bonus',
        amountPaid: 0,
        paymentMethod: 'bonus',
        isSubscription: false,
      });
      
      console.log('[Designer] Firebase result:', result);
      
      if (result?.new_balance != null) {
        console.log('[Designer] New balance:', result.new_balance);
        try {
          window.localStorage.setItem(`khuyoot:credits:lastBalance:${currentUser.uid}`, String(result.new_balance));
        } catch (e) {
          console.warn('[Designer] Failed to save to localStorage:', e);
        }
      }

      if (bonusAmount > 0) {
        markPlanBonusClaimed();
        traceStep('designer_v2_plan_selection_bonus', {
          bonus: bonusAmount,
          user: currentUser.uid,
        });
      }
    } catch (error: any) {
      console.error('❌ Firebase purchaseCredits failed:', error);
      const msg = String(error?.message || '');
      if (msg === 'AUTH_REQUIRED') {
        throw new Error(t('mustLoginFirst'));
      }
      throw new Error(msg || t('creditReserveFailed'));
    }

    console.log('🔵 Setting subscription flags...');
    setIsSubscribed(true);
    setIsWatermarkEnabled(false);
    
    console.log('🔵 Refreshing credits...');
    await refreshCredits();
    console.log('✅ handleUpgrade COMPLETE');
  }, [markPlanBonusClaimed, planBonusClaimed, refreshCredits]);

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
    markGenerationAsError,
  } = useGenerationHistory(authUser?.uid || user?.uid, status);

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
      
      // Clear previous templates immediately to prevent ghosting
      setProductTemplates([]); 

      const loadProductImage = async () => {
        setIsLoadingProduct(true);
        // Track if this specific request is valid for the current effect cycle
        const currentRequestId = Date.now();
        activeRequestId.current = currentRequestId;
        
        try {
          // OPTIMIZATION: Use passed product state if available to skip DB fetch
          let product = locationState?.product;
          
          if (!product || product.id !== productId) {
             console.log(`[ProductCache] No state product found, fetching from DB...`);
             product = await getProductById(productId);
          } else {
             console.log(`[ProductCache] Using passed product state for ${productId}`);
          }

          // Abort if the effect was cleaned up (component unmounted or id changed)
          if (!isMounted.current || activeRequestId.current !== currentRequestId) return;
          
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
                  // Try to use browser's disk cache
                  const res = await fetch(imageUrl, { cache: 'force-cache' });
                  if (!res.ok) throw new Error(`HTTP ${res.status}`);
                  
                  const blob = await res.blob();
                  
                  // Critical check: If unmounted, DO NOT create object URL to avoid leak/ghosting
                  if (!isMounted.current || activeRequestId.current !== currentRequestId) {
                    return { index, blobUrl: imageUrl, imageUrl, blob: null };
                  }

                  const blobUrl = URL.createObjectURL(blob);
                  
                  // Safely add to cache
                  if (blobCache.current) {
                    blobCache.current.set(imageId, blobUrl);
                  }
                  
                  return { index, blobUrl, imageUrl, blob };
                } catch (e) {
                  console.warn(`[ProductCache] Failed to cache ${imageId}:`, e);
                  return { index, blobUrl: imageUrl, imageUrl, blob: null }; // Fallback
                }
              });
              
              const cachedImages = await Promise.all(blobPromises);
              
              // Final mount check before state updates
              if (!isMounted.current || activeRequestId.current !== currentRequestId) {
                // Cleanup any blobs we just created since we're aborting
                cachedImages.forEach(img => {
                  if (img.blob && img.blobUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(img.blobUrl);
                  }
                });
                return;
              }

              // Create template items with blob URLs
              const templates = cachedImages.map(({ index, blobUrl }) => ({
                id: `product-${productId}-${index}`,
                imageUrl: blobUrl, // Use blob URL for instant loading
                name: index === mainImageIndex ? `${product.name} (Main)` : `${product.name} - ${index + 1}`,
                isPremium: false,
                isProductImage: true 
              }));
              
              setProductTemplates(templates);
              
              // Auto-load the main image using blob URL
              const mainImage = cachedImages.find(img => img.index === mainImageIndex);
              if (mainImage && mainImage.blob) {
                setLastActiveTemplateTab('Shop');
                setShopPreviewUrl(mainImage.blobUrl);
                setSourceForComparison(mainImage.blobUrl);
                
                // Convert blob to base64 for API calls
                const reader = new FileReader();
                reader.onloadend = () => {
                  if (!isMounted.current || activeRequestId.current !== currentRequestId) return;
                  const dataUrl = reader.result as string;
                  const parts = dataUrl.split(',');
                  const base64 = parts[1];
                  const mimeType = mainImage.blob!.type || 'image/jpeg';
                  
                  setShopImageBase64(base64);
                  setShopImageMimeType(mimeType);
                };
                reader.readAsDataURL(mainImage.blob);
                
                persistTemplateSelection({
                  templateId: `product-${productId}-${mainImageIndex}`,
                  image: null
                });
              }
            }
          }
        } catch (error) {
          console.error('Failed to load product:', error);
        } finally {
          if (isMounted.current && activeRequestId.current === currentRequestId) {
             setIsLoadingProduct(false);
          }
        }
      };
      
      loadProductImage();

      return () => {
        // We don't revoke blobs here; global cleanup handles that. 
        // We just ensure we don't process the results of this overlapping effect.
      };
    }
  }, [productId]);

  const [lastRequestDebug, setLastRequestDebug] = React.useState<any>(null);
  const [lastResponseDebug, setLastResponseDebug] = React.useState<any>(null);

  const [lightingPreset, setLightingPreset] = React.useState<LightingPreset>('studio');

  React.useEffect(() => {
    if (!sourceForComparison) {
      traceStep('Designer state: sourceForComparison = EMPTY');
      return;
    }
    const s = String(sourceForComparison);
    const kind = s.startsWith('blob:') ? 'blob' : s.startsWith('data:') ? 'data' : s.startsWith('http') ? 'http' : 'other';
    traceStep('Designer state: sourceForComparison SET', { kind, len: s.length });
  }, [sourceForComparison]);

  React.useEffect(() => {
    if (!afterImage) {
      traceStep('Designer state: afterImage = EMPTY');
      return;
    }
    const s = String(afterImage);
    const kind = s.startsWith('blob:') ? 'blob' : s.startsWith('data:') ? 'data' : s.startsWith('http') ? 'http' : 'other';
    traceStep('Designer state: afterImage SET', { kind, len: s.length });
  }, [afterImage]);

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

  // Privacy masking is applied ONLY in the crop window (ImagePrepModal).

  // ========== CENTRALIZED UI STATE (COMPUTED) ==========
  const uiState: DesignerUIState = React.useMemo(() => ({
    allDisabled: isProcessing || isUpscaling,
    uploadsDisabled: isProcessing,
    inputsDisabled: isProcessing,
    generationDisabled: isProcessing || !sourceImageBase64 || !sourceImageMimeType || !fabricImageBase64 || !fabricImageMimeType,
    upscaleDisabled: isProcessing || isUpscaling || !beforeUpscaleImage,
    watermarkDisabled: isProcessing || !isSubscribed,
    showUpscaleButton: !!beforeUpscaleImage,
    showProFeatures: isSubscribed,
    showUpgradePrompt: !isSubscribed,
  }), [isProcessing, isUpscaling, sourceImageBase64, sourceImageMimeType, fabricImageBase64, fabricImageMimeType, beforeUpscaleImage, isSubscribed]);

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
      loadedProductRef.current = null;
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
      void urlToBase64Image(task.metadata.model, task.metadata.modelMimeType).then((img) => {
        if (!img) return;
        setSourceImageBase64(img.base64);
        setSourceImageMimeType(img.mimeType);
        persistTemplateSelection({
          templateId: selectedTemplateIdRef.current ?? null,
          image: { base64: img.base64, mimeType: img.mimeType },
        });
      });
    }
    if (task.metadata.fabric) {
      setFabricPreviewUrl(task.metadata.fabric);
      void urlToBase64Image(task.metadata.fabric, task.metadata.fabricMimeType).then((img) => {
        if (!img) return;
        setFabricImageBase64(img.base64);
        setFabricImageMimeType(img.mimeType);
        setOriginalFabricData({
          base64: img.base64,
          mimeType: img.mimeType,
          url: task.metadata.fabric,
        });
        persistFabricSelection({
          fabricId: persistedFabricId ?? null,
          image: { base64: img.base64, mimeType: img.mimeType },
        });
      });
    }
    if (task.results?.highRes) {
      setAfterImage(task.results.highRes);
      setBeforeUpscaleImage(task.results.highRes);
    }
    if (task.results?.jobId) {
      setActiveId(task.results.jobId);
    }
  }, [user?.uid, setActiveId, persistTemplateSelection, persistFabricSelection, persistedFabricId, setSourceImageBase64, setSourceImageMimeType, setFabricImageBase64, setFabricImageMimeType]);

  // Sync with URL on mount and URL change
  React.useEffect(() => {
    if (urlTaskId) {
      loadTaskFromUrl(urlTaskId);
    }
  }, [urlTaskId, loadTaskFromUrl]);

  // Hydrate persisted state (uploads + comparison state + slider position)
  const didHydrateRef = React.useRef(false);
  React.useEffect(() => {
    didHydrateRef.current = false;
  }, [cacheKey]);

  React.useEffect(() => {
    if (didHydrateRef.current) return;
    if (urlTaskId) {
      didHydrateRef.current = true;
      return; // Skip cache if loading from URL
    }
    const cached = safeLocalStorageGet<DesignerCacheState>(cacheKey);
    if (!cached) {
      didHydrateRef.current = true;
      return;
    }
    if (cached.v !== DESIGNER_CACHE_VERSION) {
      // Purge older cache snapshots (may include persisted user image data).
      try {
        window.localStorage.removeItem(cacheKey);
      } catch {
        // ignore
      }
      didHydrateRef.current = true;
      return;
    }

    setSelectedModel(cached.selectedModel);
    setRefinementPrompt(cached.refinementPrompt ?? '');
    setOutputFit(cached.outputFit ?? 'contain');
    setSliderPos(typeof cached.sliderPos === 'number' ? cached.sliderPos : 100);

    // Restore persisted uploaded images so refresh keeps user progress.
    if (cached.sourceImageBase64 && cached.sourceImageMimeType) {
      const sourceDataUrl = toDataUrl(cached.sourceImageBase64, cached.sourceImageMimeType);
      setLastActiveTemplateTab('Closet');
      setSourceImageBase64(cached.sourceImageBase64);
      setSourceImageMimeType(cached.sourceImageMimeType);
      setSourcePreviewUrl(sourceDataUrl);
      setSourceForComparison(sourceDataUrl);
    }

    if (cached.fabricImageBase64 && cached.fabricImageMimeType) {
      const fabricDataUrl = toDataUrl(cached.fabricImageBase64, cached.fabricImageMimeType);
      setFabricImageBase64(cached.fabricImageBase64);
      setFabricImageMimeType(cached.fabricImageMimeType);
      setFabricPreviewUrl(fabricDataUrl);
      setOriginalFabricData({
        base64: cached.fabricImageBase64,
        mimeType: cached.fabricImageMimeType,
        url: fabricDataUrl,
      });
    }

    // Skip blob/data URLs when restoring from cache (avoid persisting embedded image data)
    const validSourceComp = cached.sourceForComparison?.startsWith('blob:') || cached.sourceForComparison?.startsWith('data:')
      ? ORIGINAL
      : cached.sourceForComparison;
    const validAfterImg = cached.afterImage?.startsWith('blob:') || cached.afterImage?.startsWith('data:')
      ? ORIGINAL
      : cached.afterImage;
    setSourceForComparison(validSourceComp || ORIGINAL);
    if (!cached.sourceImageBase64 && validSourceComp && validSourceComp !== ORIGINAL) {
      setSourcePreviewUrl(validSourceComp);
      void urlToBase64Image(validSourceComp, null).then((img) => {
        if (!img) return;
        setLastActiveTemplateTab('Closet');
        setSourceImageBase64(img.base64);
        setSourceImageMimeType(img.mimeType);
        persistTemplateSelection({
          templateId: selectedTemplateIdRef.current ?? null,
          image: { base64: img.base64, mimeType: img.mimeType },
        });
      });
    }
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
      // Only persist non-blob/non-data URLs for sourceForComparison and afterImage
      const validSourceComp = sourceForComparison?.startsWith('blob:') || sourceForComparison?.startsWith('data:') ? '' : sourceForComparison;
      const validAfterImg = afterImage?.startsWith('blob:') || afterImage?.startsWith('data:') ? '' : afterImage;
      
      const snapshot: DesignerCacheState = {
        v: DESIGNER_CACHE_VERSION,
        selectedModel,
        refinementPrompt,
        outputFit,
        sliderPos,
        // Persist uploaded images for refresh continuity in TryOn.
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
      throw new Error(t('uploadTemplateFirst'));
    }
    if (!fabricImageBase64 || !fabricImageMimeType) {
      throw new Error(t('uploadFabricFirst'));
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
          silk: 'silk with natural sheen, soft drape, and gentle folds',
          cotton: 'matte cotton texture with crisp folds',
          linen: 'linen with visible weave and relaxed wrinkles',
          velvet: 'luxurious velvet with rich texture and deep folds',
          transparent: 'transparent/translucent fabric with light passing through and soft folds',
          wool: 'dense wool texture with structured folds'
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

    if (!user) {
      showError(t('accountRequiredGeneration'));
      traceStep('designer_v2_generation_blocked', { reason: 'no_account' });
      setIsUpgradeModalOpen(true);
      return;
    }

    let payload: ReturnType<typeof getApiPayload>;
    try {
      payload = getApiPayload(opts);
    } catch (e: any) {
      showError(e?.message || 'Missing model template or fabric pattern');
      return;
    }

    traceStep('designer_v2_generation_start', {
      tier: isAdminUser ? 'admin' : isSubscribed ? 'subscribed' : 'credit',
      user: user?.uid || 'unknown',
    });

    // Show processing UI immediately. Credit reservation happens before the callback executes,
    // so we need to flip UI state before awaiting executeCreditAction to avoid a perceived freeze.
    setIsProcessing(true);
    setProgress(5);
    setSliderPos(0);
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));

    // Admin bypass: skip credit check
    const generationCallback = async () => {
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

      if (pendingClosetUploadRef.current) {
        const pending = pendingClosetUploadRef.current;
        pendingClosetUploadRef.current = null;
        Promise.resolve()
          .then(() => addToCloset(pending.file, pending.name))
          .then(() => {
            console.log('[Designer V2.1] 📁 Upload saved to closet (generation started)');
          })
          .catch((e) => {
            console.warn('[Designer V2.1] ⚠️ Failed to save upload to closet (generation started):', e);
          });
      }

      try {
        const res = await generateFabricSwap(payload);
        window.clearInterval(interval);
        setProgress(100);

        if ((res as any)?.debug) setLastResponseDebug((res as any).debug);

        const generatedAfterImage = res.imageDataUrl || res.fullImageUrl || res.thumbnailUrl || null;
        setAfterImage(generatedAfterImage);
        setBeforeUpscaleImage(res.imageDataUrl ?? null); // Store base64 for upscale button
        // Prefer base64 for immediate feedback, fallback to URL
        persistActiveResult(res.imageDataUrl || res.fullImageUrl || null);

        if (pendingClientId && res.jobId) {
          finalizePendingGeneration(pendingClientId, {
            jobId: res.jobId,
            createdAt: new Date().toISOString(),
            fullImageUrl: res.imageDataUrl || res.fullImageUrl,
            thumbnailUrl: res.thumbnailUrl || res.imageDataUrl || res.fullImageUrl,
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
            thumbnail: res.thumbnailUrl || res.imageDataUrl || res.fullImageUrl,
            highRes: res.imageDataUrl || res.fullImageUrl,
            jobId: res.jobId,
            templateUrl: res.templateUrl,
            fabricUrl: res.fabricUrl,
          },
        };
        await taskStorage.saveTask(task, user?.uid);
        setCurrentTaskId(newTaskId);

        // Update URL if not already there
        if (!urlTaskId || urlTaskId !== newTaskId) {
          navigate(`/tryon/design/${newTaskId}`, { replace: true });
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

        const errorMsg = e?.message || t('fabricSwitchFailed');

        // Mark pending generation as error instead of removing it (Directive: including errors)
        if (pendingClientId) {
          markGenerationAsError(pendingClientId, errorMsg);
        }
        const isConnectionError = errorMsg.includes('fetch') || errorMsg.includes('network');

        showError(
          isConnectionError
            ? t('imageSizeError')
            : `${t('error')}: ${errorMsg}`
        );
      }
    };

    // If admin, bypass credit system entirely
    let creditRes: Awaited<ReturnType<typeof executeCreditAction>>;
    if (isAdminUser) {
      console.log('[TryOn Designer] Admin bypass - skipping credit check for generation');
      await generationCallback();
      creditRes = { ok: true };
    } else {
      creditRes = await executeCreditAction('generation', generationCallback);
    }

    if (!creditRes.ok) {
      // If credit reservation fails (or user can't afford), callback may never have run.
      setIsProcessing(false);
      setProgress(0);
      if ('reason' in creditRes && creditRes.reason === 'insufficient') {
        setIsUpgradeModalOpen(true);
      } else if ('reason' in creditRes && creditRes.reason === 'error') {
        // Check if the error is due to not being logged in
        const errorMsg = creditRes.error instanceof Error ? creditRes.error.message : String(creditRes.error || '');
        if (/not logged in|auth_required|permission-denied|insufficient permissions/i.test(errorMsg)) {
          toggleAuthModal(true, 'login');
          showError('انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.');
          return;
        }
        showError('Unable to reserve credits. Please try again.');
      }
      return;
    }
  }, [addPendingGeneration, addToCloset, executeCreditAction, features.showHistoryFilmstrip, finalizePendingGeneration, getApiPayload, isAdminUser, isProcessing, isSubscribed, navigate, refreshHistory, removePendingGeneration, revealSlider, selectedModel, setActiveId, setIsUpgradeModalOpen, showError, sourceImageMimeType, sourcePreviewUrl, fabricPreviewUrl, fabricImageMimeType, user?.uid, urlTaskId]);

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

    const upscaleCallback = async () => {
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
        const upscaleAfterImage = result.imageDataUrl || result.fullImageUrl || result.thumbnailUrl || null;
        setSourceForComparison(beforeUpscaleImage);
        setAfterImage(upscaleAfterImage);
        setBeforeUpscaleImage(result.imageDataUrl ?? null);
        setSliderPos(50); // Position slider in middle to show both

        setTimeout(() => {
          setIsUpscaling(false);
        }, 500);
      } catch (e: any) {
        window.clearInterval(interval);
        setIsUpscaling(false);
        setUpscaleProgress(0);
        showError(t('upscaleError', { message: e?.message || t('upscaleFailedDefault') }));
      }
    };

    // If admin, bypass credit system entirely
    let creditRes: Awaited<ReturnType<typeof executeCreditAction>>;
    if (isAdminUser) {
      console.log('[TryOn Designer] Admin bypass - skipping credit check for upscale');
      await upscaleCallback();
      creditRes = { ok: true };
    } else {
      creditRes = await executeCreditAction('upscale', upscaleCallback);
    }

    if (!creditRes.ok) {
      setIsUpscaling(false);
      setUpscaleProgress(0);
      if ('reason' in creditRes && creditRes.reason === 'insufficient') {
        setIsUpgradeModalOpen(true);
      } else if ('reason' in creditRes && creditRes.reason === 'error') {
        // Check if the error is due to not being logged in
        const errorMsg = creditRes.error instanceof Error ? creditRes.error.message : String(creditRes.error || '');
        if (/not logged in|auth_required|permission-denied|insufficient permissions/i.test(errorMsg)) {
          toggleAuthModal(true, 'login');
          showError('انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.');
          return;
        }
        showError('Unable to reserve credits for upscale. Please try again.');
      }
      return;
    }
  }, [beforeUpscaleImage, executeCreditAction, isUpscaling, upscaleEngine, isWatermarkEnabled, showError]);

  const onPickSource = React.useCallback(async (file: File, options?: { skipPrivacy?: boolean; deferCompression?: boolean }) => {
    if (!file) return;
    traceStep('Designer onPickSource START', {
      name: file.name,
      size: file.size,
      type: file.type,
      skipPrivacy: Boolean(options?.skipPrivacy),
      deferCompression: Boolean(options?.deferCompression),
    });
    const token = ++templateProcessTokenRef.current;
    if (sourcePreviewUrl && String(sourcePreviewUrl).startsWith('blob:')) {
      const prev = sourcePreviewUrl;
      const revokeDelayMs = import.meta.env.DEV ? 2500 : 0;
      traceStep('Designer sourcePreviewUrl revoke scheduled', { ms: revokeDelayMs });
      setTimeout(() => {
        try {
          URL.revokeObjectURL(prev);
        } catch {
          // ignore
        }
      }, revokeDelayMs);
    }

    setIsProcessingTemplate(true);

    // Privacy masking is ONLY applied via the crop window (ImagePrepModal).
    const processedFile = file;

    // Show preview ASAP.
    const previewUrl = URL.createObjectURL(processedFile);
    setSourcePreviewUrl(previewUrl);
    setSourceForComparison(previewUrl); // Store for comparison section
    traceStep('Designer preview set (template)', { kind: previewUrl?.startsWith('blob:') ? 'blob' : 'other' });

    // Give React/DOM a chance to paint the comparison with the new preview.
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    traceStep('Designer comparison paint boundary (template)');

    // Reset previous result: new template becomes BEFORE image.
    setAfterImage(ORIGINAL);
    setBeforeUpscaleImage(null);
    setSliderPos(0);
    setActiveId(null);

    // Allow the UI to paint the preview before heavy work.
    traceStep('Designer yield frame BEFORE compress');
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    traceStep('Designer yield frame AFTER');

    const finalize = async () => {
      try {
        traceStep('Template compress START');
        console.time('[Template] compress');
        const { base64, mimeType } = await smartCompressImage(processedFile);
        console.timeEnd('[Template] compress');
        traceStep('Template compress DONE', { base64Len: base64?.length ?? 0, mimeType });

        if (token !== templateProcessTokenRef.current) return;

        setSourceImageMimeType(mimeType);
        setSourceImageBase64(base64);

        // Persist template upload for navigation resilience (Directive 3)
        persistTemplateSelection({
          templateId: selectedTemplateIdRef.current ?? null,
          image: { base64, mimeType },
        });
        traceStep('Template persist DONE', { templateId: selectedTemplateIdRef.current ?? null });
      } catch (e: any) {
        if (token !== templateProcessTokenRef.current) return;
        traceStep('Template finalize ERROR', { message: String(e?.message || e) });
        showError(e?.message || t('failedToLoadImage'));
      } finally {
        if (token === templateProcessTokenRef.current) {
          setIsProcessingTemplate(false);
          traceStep('Designer onPickSource DONE');

          // If this flow came from an UploadSection trace, end it here.
          // (No-op if there is no active trace.)
          traceEnd(undefined, { where: 'Designer.onPickSource', result: 'template-ready' });
        }
      }
    };

    if (options?.deferCompression) {
      const ric = (window as any).requestIdleCallback as ((cb: () => void) => void) | undefined;
      if (typeof ric === 'function') ric(() => void finalize());
      else setTimeout(() => void finalize(), 0);
      return;
    }

    await finalize();
  }, [isPrivacyMode, persistTemplateSelection, processWithPrivacyShield, showError, sourcePreviewUrl]);

  const handleTemplateSelect = React.useCallback(
    async (templateData: any) => {
      const incomingTraceId = (templateData as any)?.__traceId;
      if (typeof incomingTraceId === 'string' && incomingTraceId) {
        traceSetActive(incomingTraceId);
        traceStep('Designer trace takeover', { traceId: incomingTraceId });
      }
      traceStep('Designer handleTemplateSelect', {
        id: templateData?.id,
        hasFile: templateData?.file instanceof File,
        isClosetItem: Boolean(templateData?.isClosetItem),
      });
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
          traceStep('Template select: product image (blobUrl)', { hasImageUrl: Boolean(templateData?.imageUrl) });
          // Let React render the loading overlay before blocking on image decode
          await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
          // The imageUrl is already a blob URL from the cache
          // Directly set Shop tab state (since we already set lastActiveTemplateTab above)
          setShopPreviewUrl(templateData.imageUrl);
          setSourceForComparison(templateData.imageUrl);
          traceStep('Designer setSourceForComparison (product)', { kind: String(templateData.imageUrl).startsWith('blob:') ? 'blob' : 'other' });
          // Persist lightweight reference so Footer CTA can resolve productId
          persistTemplateSelection({ templateId: templateData?.id ?? null, image: null });
          await endTemplateLoading(templateData.imageUrl);
          traceStep('Template select: product done');
          // Blob URLs work directly without file conversion
          return;
        }

        if (templateData?.file instanceof File) {
          // If already prepped, just pick it
          if ((templateData as any)?.__fromImagePrepModal) {
            traceStep('Template select: prepped file -> onPickSource', {
              privacyApplied: Boolean((templateData as any)?.privacyApplied),
              deferCompression: Boolean(isMobile),
            });
            
            // Track upload for closet after successful generation
            if (!templateData?.isClosetItem) {
              pendingClosetUploadRef.current = {
                file: templateData.file,
                name: templateData.name || templateData.file.name || 'Upload',
              };
              console.log('[Designer V2.1] 📤 Tracked upload for closet:', pendingClosetUploadRef.current.name);
            }
            
            await onPickSource(templateData.file, {
              skipPrivacy: Boolean((templateData as any)?.privacyApplied),
              deferCompression: Boolean(isMobile),
            });
            setLoadingTemplateId(null);
            traceStep('Template select: file done');
            return;
          }
          
          // Otherwise, send to prep modal
          traceStep('Template select: raw file -> openUserImagePrep');
          setLoadingTemplateId(null);
          openUserImagePrep(templateData.file);
          return;
        }

        const remoteUrl =
          (typeof templateData?.imageUrl === 'string' && templateData.imageUrl) ||
          (typeof templateData?.src === 'string' && templateData.src) ||
          null;

        if (remoteUrl) {
          traceStep('Template select: remoteUrl', { kind: remoteUrl.startsWith('http') ? 'http' : 'other' });
          if (remoteUrl.startsWith('blob:')) {
            console.warn('[TemplatePicker] Refusing to fetch blob: URL due to CSP:', remoteUrl);
            showError('This template preview cannot be used due to browser security policy. Please select the original template again.');
            setLoadingTemplateId(null);
            return;
          }

          try {
            const cached = templateFileCacheRef.current.get(remoteUrl);
            if (cached) {
              traceStep('Template select: cache HIT');
              // onPickSource already handles loading state internally
              await onPickSource(cached, { deferCompression: Boolean(isMobile) });
              setLoadingTemplateId(null);
              return;
            }

            traceStep('Template select: cache MISS, fetching');

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

            await onPickSource(file, { deferCompression: Boolean(isMobile) });
            setLoadingTemplateId(null);
          } catch (e) {
            console.warn('[TemplatePicker] Failed to fetch template src:', e);
            traceStep('Template select: remote fetch ERROR', { message: String((e as any)?.message || e) });
            showError(t('failedToLoadTemplate'));
            setLoadingTemplateId(null);
          }
        } else {
          setLoadingTemplateId(null);
        }
      };

      if (isPremium && !isSubscribed) {
        const res = await executeCreditAction('premium_template', doSelect);
        if (!res.ok) {
          if ('reason' in res && res.reason === 'insufficient') {
            setIsUpgradeModalOpen(true);
          } else if ('reason' in res && res.reason === 'error') {
            // Check if the error is due to not being logged in
            const errorMsg = res.error instanceof Error ? res.error.message : String(res.error || '');
            if (/not logged in|auth_required|permission-denied|insufficient permissions/i.test(errorMsg)) {
              toggleAuthModal(true, 'login');
              showError('انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.');
              return;
            }
            showError('Unable to reserve credits for premium template. Please try again.');
          }
        }
        return;
      }

      await doSelect();
    },
    [executeCreditAction, isSubscribed, onPickSource, persistTemplateId, selectTemplate, showError]
  );

  const onPickFabric = React.useCallback(
    async (file: File, options?: { skipPrivacy?: boolean; deferCompression?: boolean }) => {
    if (!file) return;
    const token = ++fabricProcessTokenRef.current;
    if (fabricPreviewUrl) URL.revokeObjectURL(fabricPreviewUrl);

    setIsProcessingFabric(true);
    console.log('[Designer V2.1] 🎨 FABRIC UPLOADED - Processing...');

    // Privacy masking is ONLY applied via the crop window (ImagePrepModal).
    const processedFile = file;

    // Show preview ASAP.
    const previewUrl = URL.createObjectURL(processedFile);
    setFabricPreviewUrl(previewUrl);

    // Allow the UI to paint the preview before heavy work.
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    const finalize = async () => {
      try {
        console.time('[Fabric] compress');
        const { base64, mimeType } = await smartCompressImage(processedFile);
        console.timeEnd('[Fabric] compress');

        // If a newer fabric job started, drop this result.
        if (token !== fabricProcessTokenRef.current) return;

        setFabricImageBase64(base64);
        
        // Save as original for tiling reverts
        setOriginalFabricData({ base64, mimeType, url: previewUrl });
        setFabricScale(1);

        // Persist fabric upload for navigation resilience (Directive 3)
        persistFabricSelection({
          fabricId: null,
          image: { base64, mimeType },
        });
      } catch (e: any) {
        if (token !== fabricProcessTokenRef.current) return;
        showError(e?.message || t('failedToLoadFabric'));
      } finally {
        if (token === fabricProcessTokenRef.current) {
          setIsProcessingFabric(false);
        }
      }
    };

    if (options?.deferCompression) {
      const ric = (window as any).requestIdleCallback as ((cb: () => void) => void) | undefined;
      if (typeof ric === 'function') ric(() => void finalize());
      else setTimeout(() => void finalize(), 0);
      return;
    }

    await finalize();
    },
    [
      fabricPreviewUrl,
      isPrivacyMode,
      persistFabricSelection,
      processWithPrivacyShield,
      showError,
    ]
  );

  const handleClearSelections = React.useCallback(() => {
    // Clear all preview images
    setSourcePreviewUrl(null);
    setSourceForComparison(null);
    setAfterImage(null);
    setFabricPreviewUrl(null);
    
    // Clear base64 data
    setSourceImageBase64(null);
    setFabricImageBase64(null);
    
    // Clear per-tab preview states
    setStudioPreviewUrl(null);
    setStudioImageBase64(null);
    setShopPreviewUrl(null);
    setShopImageBase64(null);
    setClosetPreviewUrl(null);
    setClosetImageBase64(null);
    
    // Clear selected template
    selectTemplate(null);
    
    // Clear active history ID to show intro cards
    setActiveId(null);
    
    // Clear persisted selections in store
    clearSelection();
    
    console.log('[Designer V2.1] 🗑️ Cleared all selections');
  }, [clearSelection, selectTemplate, setSourcePreviewUrl, setSourceImageBase64, setFabricImageBase64]);

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
          navigate(`/tryon/design/${matchingTask.taskId}`);
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
        navigate(`/tryon/design/${matchingTask.taskId}`);
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
    const deletedIndex = history.findIndex(h => (h as any).jobId === deletingJobId || h.clientId === deletingJobId);
    const wasActive = activeId === deletingJobId;
    
    // Delete from history
    const isPending = history.find(h => h.clientId === deletingJobId && 'isPending' in h);
    if (isPending) {
      removePendingGeneration(deletingJobId);
    } else {
      deleteHistoryItem(deletingJobId);
      
      // Also delete associated task (only for actual jobs)
      const tasks = await taskStorage.listTasks(user?.uid);
      const taskToDelete = tasks.find(t => t.results?.jobId === deletingJobId);
      if (taskToDelete) {
        await taskStorage.deleteTask(taskToDelete.taskId, user?.uid);
      }
    }
    
    // Post-deletion behavior:
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

  return {
    t, i18n, navigate, taskId: urlTaskId, user, isAdminUser,
    features, setFeatures, uiState,        
    selectedModel, setSelectedModel, refinementPrompt, setRefinementPrompt,
    sourcePreviewUrl, setSourcePreviewUrl, sourceImageBase64, setSourceImageBase64, sourceImageMimeType, setSourceImageMimeType,
    fabricPreviewUrl, setFabricPreviewUrl, fabricImageBase64, setFabricImageBase64, fabricImageMimeType, setFabricImageMimeType,
    fabricMaterial, setFabricMaterial, fabricTilingOpen, setFabricTilingOpen,
    fabricScale, setFabricScale, originalFabricData, setOriginalFabricData,
    fabricInputRef, sourceInputRef,
    isProcessingTemplate, setIsProcessingTemplate, isProcessingFabric, setIsProcessingFabric,
    isProcessing, progress,
    upscaleEngine, setUpscaleEngine, outputFit, setOutputFit, isUpscaling, setIsUpscaling, upscaleProgress, setUpscaleProgress,
    deleteModalOpen, setDeleteModalOpen, deletingJobId, setDeletingJobId, deletingItemId, setDeletingItemId,
    debugPanelOpen, setDebugPanelOpen, isWatermarkEnabled, setIsWatermarkEnabled, isSubscribed, setIsSubscribed,
    canAfford, creditsEnabled, generationCost, upscaleCost, openUpgradeModal,
    handlePlanSelect, handleUpgrade,
    history, isLoading, activeId, setActiveId, refreshHistory, deleteHistoryItem,
    afterImage, setAfterImage, sourceForComparison, setSourceForComparison,
    isLoadingHistoryImage, setIsLoadingHistoryImage,
    productTemplates, setProductTemplates, isLoadingProduct, setIsLoadingProduct,
    lastRequestDebug, setLastRequestDebug, lastResponseDebug, setLastResponseDebug,
    lightingPreset, setLightingPreset,
    sliderPos, setSliderPos,
    errorMessage, setErrorMessage, errorModalOpen, setErrorModalOpen,
    sourceImageDimensions, setSourceImageDimensions, afterImageDimensions, setAfterImageDimensions,
    copiedUrl, setCopiedUrl, shareUrlCopied, setShareUrlCopied, currentTaskId, setCurrentTaskId,
    isMobile,
    navigateHome, navigateProfile, showError,
    handleTemplateSelect, setLastActiveTemplateTab,
    openFabricPrep, closeFabricPrep, openUserImagePrep, closeUserImagePrep,
    openMeasurementsModal, closeMeasurementsModal, isMeasurementsModalOpen,
    handleFabricSwap, handleUpscale, handleSelectHistory,
    hasActiveProduct,
    handleDeleteSlot, confirmDelete, cancelDelete, handleShareTask,
    handleClearSelections, copyToClipboard,
    setPrivacyMode, isPrivacyMode, maskingStyle, setMaskingStyle, blurStrength, setBlurStrength,
    selectedEmoji, setSelectedEmoji, isProcessingPrivacy,
    selectedTemplate, lightingGenerator,
    setBeforeFromHistory, setAfterFromHistory,
    onPickSource, onPickFabric,
    isSidebarCollapsed, setIsSidebarCollapsed,
    isHistoryCollapsed, setIsHistoryCollapsed,
    userImagePrepOpen, userImagePrepFile,
    fabricPrepOpen, fabricPrepFile
  };
};
