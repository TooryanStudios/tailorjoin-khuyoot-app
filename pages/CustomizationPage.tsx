import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Sparkles, AlertCircle } from 'lucide-react';
import type { CustomizationModel, CustomizationState, FabricUpload } from '../src/types/customization';
import { generateFabricPreview } from '../src/services/fabricAIService';
import { firebaseService } from '../services/firebase';
import { useApp } from '../context/AppContext';
import type { MeasurementTemplate } from '../types';

// Components
import { ModelSelector } from '../src/components/customization/ModelSelector';
import { FabricUploader } from '../src/components/customization/FabricUploader';
import { PreviewCanvas } from '../src/components/customization/PreviewCanvas';
import { AITipsPanel } from '../src/components/customization/AITipsPanel';
import { NextStepButton } from '../src/components/customization/NextStepButton';
import DebugPanel from '../components/DebugPanel';

// Mock data for models
const AVAILABLE_MODELS: CustomizationModel[] = [
  {
    id: 'abaya-classic',
    name: 'عباية كلاسيكية',
    type: 'abaya',
    thumbnailUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400',
    description: 'تصميم تقليدي أنيق'
  },
  {
    id: 'abaya-modern',
    name: 'عباية عصرية',
    type: 'abaya',
    thumbnailUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400',
    description: 'تصميم حديث وعملي'
  },
  {
    id: 'dress-elegant',
    name: 'فستان أنيق',
    type: 'dress',
    thumbnailUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400',
    description: 'مناسب للمناسبات'
  },
  {
    id: 'jalabia-gulf',
    name: 'جلابية خليجية',
    type: 'jalabia',
    thumbnailUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
    description: 'تصميم خليجي تقليدي'
  },
  {
    id: 'thobe-formal',
    name: 'ثوب رسمي',
    type: 'thobe',
    thumbnailUrl: 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=400',
    description: 'للمناسبات الرسمية'
  },
  {
    id: 'dress-casual',
    name: 'فستان كاجوال',
    type: 'dress',
    thumbnailUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400',
    description: 'للارتداء اليومي'
  },
];

export const CustomizationPage = () => {
  const { productId } = useParams<{ productId?: string }>();
  const navigate = useNavigate();
  const { user } = useApp();

  const [state, setState] = useState<CustomizationState>({
    previewStatus: 'idle',
    aiTips: []
  });

  const [fabricFile, setFabricFile] = useState<{ file: File; preview: string }>();
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [product, setProduct] = useState<any | null>(null);
  const [templates, setTemplates] = useState<MeasurementTemplate[]>([]);
  const [isTemplatesLoading, setIsTemplatesLoading] = useState(false);
  const [matchedTemplate, setMatchedTemplate] = useState<MeasurementTemplate | null>(null);

  // Auto-generate preview when both model and fabric are selected
  useEffect(() => {
    if (state.selectedModel && fabricFile && state.previewStatus === 'idle') {
      handleGeneratePreview();
    }
  }, [state.selectedModel, fabricFile]);

  // Load product details for debug and UI context
  useEffect(() => {
    const load = async () => {
      if (!productId) return;
      try {
        const p = await firebaseService.getProduct(productId);
        setProduct(p);
        console.log('[DEBUG] CustomizationPage.tsx product loaded:', p);
      } catch (e) {
        console.warn('⚠️ Failed to load product:', e);
      }
    };
    load();
  }, [productId]);

  // Load measurement templates once
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setIsTemplatesLoading(true);
        const data = await firebaseService.getMeasurementTemplates();
        setTemplates(data || []);
        console.log('[DEBUG] CustomizationPage.tsx templates loaded:', data?.length || 0);
      } catch (e) {
        console.warn('⚠️ Failed to load measurement templates:', e);
      } finally {
        setIsTemplatesLoading(false);
      }
    };
    loadTemplates();
  }, []);

  // Match template by strict rule: Template.id === Product.categoryId
  useEffect(() => {
    if (!product?.categoryId || templates.length === 0) {
      setMatchedTemplate(null);
      return;
    }
    const match = templates.find(t => t.id === product.categoryId) || null;
    setMatchedTemplate(match);
    if (match) console.log('[DEBUG] Matched template for categoryId', product.categoryId, '=>', match.id);
  }, [product?.categoryId, templates]);

  const handleModelSelect = (modelId: string) => {
    const model = AVAILABLE_MODELS.find(m => m.id === modelId);
    setState(prev => ({
      ...prev,
      selectedModel: model,
      previewStatus: 'idle',
      previewUrl: undefined,
      aiTips: []
    }));
  };

  const handleFabricSelect = async (file: File) => {
    console.log('Fabric selected in page:', file);
    
    // Convert to Data URL instead of blob URL (CSP compliant)
    const reader = new FileReader();
    reader.onloadend = () => {
      const preview = reader.result as string;
      console.log('Preview Data URL created');
      
      setFabricFile({ file, preview });

      setState(prev => ({
        ...prev,
        fabricUpload: {
          file,
          url: preview,
          preview,
          uploadedAt: new Date()
        },
        previewStatus: 'idle',
        previewUrl: undefined,
        aiTips: []
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleFabricRemove = () => {
    // No need to revoke Data URL
    setFabricFile(undefined);
    setState(prev => ({
      ...prev,
      fabricUpload: undefined,
      previewStatus: 'idle',
      previewUrl: undefined,
      aiTips: []
    }));
  };

  const handleGeneratePreview = async () => {
    if (!state.selectedModel || !state.fabricUpload) return;

    setIsGeneratingPreview(true);
    setState(prev => ({ ...prev, previewStatus: 'processing' }));

    try {
      const result = await generateFabricPreview(state.selectedModel, state.fabricUpload);
      
      setState(prev => ({
        ...prev,
        previewUrl: result.previewUrl,
        aiTips: result.aiTips,
        previewStatus: 'ready'
      }));
    } catch (error) {
      console.error('Error generating preview:', error);
      setState(prev => ({
        ...prev,
        previewStatus: 'error',
        errorMessage: 'حدث خطأ في إنشاء المعاينة. يرجى المحاولة مرة أخرى.'
      }));
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleNext = async () => {
    console.log('[DEBUG] handleNext - User:', user);
    console.log('[DEBUG] handleNext - User ID:', user?.id);

    try {
      setIsSaving(true);

      // Save customization metadata (without images - keep them temporary)
      const customizationData = {
        modelId: state.selectedModel?.id,
        modelName: state.selectedModel?.name,
        fabricUrl: '', // Don't save Data URL to database (too large)
        previewUrl: '', // Don't save Data URL to database (too large)
        aiTips: state.aiTips
      };

      let customizationId = null;
      
      // Only save to Firebase if user is logged in
      if (user?.id) {
        console.log('[DEBUG] Saving customization with userId:', user.id);
        customizationId = await firebaseService.saveCustomization(user.id, customizationData);
      } else {
        console.log('[DEBUG] User not logged in, skipping Firebase save');
      }

      // Navigate to measurements page with productId in URL and data in state
      const navigationPath = productId ? `/measurements/${productId}` : '/measurements';
      navigate(navigationPath, {
        state: { 
          productId: productId || null,
          customizationId,
          customizationData: {
            ...customizationData,
            id: customizationId,
            fabricUrl: state.fabricUpload?.url, // Pass temporary Data URL in state only
            previewUrl: state.previewUrl // Pass temporary Data URL in state only
          },
          from: 'customization' 
        }
      });
    } catch (error) {
      console.error('Error saving customization:', error);
      // Don't show error, just navigate anyway
      const navigationPath = productId ? `/measurements/${productId}` : '/measurements';
      navigate(navigationPath, {
        state: { 
          productId: productId || null,
          from: 'customization' 
        }
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    const navigationPath = productId ? `/measurements/${productId}` : '/measurements';
    navigate(navigationPath, {
      state: {
        productId: productId || null,
        from: 'customization-skip'
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ChevronLeft size={24} className="text-slate-700 dark:text-slate-300" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles size={24} className="text-indigo-600" />
              تخصيص التصميم
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              اختاري التصميم والقماش قبل إدخال المقاسات
            </p>
          </div>
        </div>
      </div>

      {/* Product Info Card */}
      {(productId || state.selectedModel) && (
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
                <Sparkles size={32} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-white/80 mb-1">المنتج المراد تخصيصه</p>
                <h2 className="text-lg font-bold text-white mb-1">
                  {state.selectedModel?.name || 'تخصيص جديد'}
                </h2>
                <div className="flex gap-2 flex-wrap">
                  {state.selectedModel?.id && (
                    <span className="px-2 py-0.5 bg-white/20 backdrop-blur rounded-full text-xs text-white font-medium">
                      {state.selectedModel.id}
                    </span>
                  )}
                  {state.selectedModel?.type && (
                    <span className="px-2 py-0.5 bg-white/20 backdrop-blur rounded-full text-xs text-white font-medium">
                      {state.selectedModel.type}
                    </span>
                  )}
                  {productId && (
                    <span className="px-2 py-0.5 bg-white/20 backdrop-blur rounded-full text-xs text-white font-medium">
                      Product: {productId.slice(0, 8)}...
                    </span>
                  )}
                  {product?.categoryId && (
                    <span className="px-2 py-0.5 bg-white/20 backdrop-blur rounded-full text-xs text-white font-medium">
                      Cat: {product.categoryId}
                    </span>
                  )}
                </div>
              </div>
              {fabricFile && (
                <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-white/30 flex-shrink-0">
                  <img 
                    src={fabricFile.preview} 
                    alt="القماش المختار" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 pb-32">
        {/* Model Selection */}
        <ModelSelector
          models={AVAILABLE_MODELS}
          selectedModelId={state.selectedModel?.id}
          onModelSelect={handleModelSelect}
        />

        {/* Fabric Upload */}
        <FabricUploader
          onFabricSelected={handleFabricSelect}
          currentFabric={fabricFile}
          onRemove={handleFabricRemove}
        />

        {/* Preview Canvas */}
        {(state.selectedModel || fabricFile) && (
          <PreviewCanvas
            selectedModel={state.selectedModel || null}
            fabricImageUrl={state.fabricUpload?.url}
            previewUrl={state.previewUrl}
            previewStatus={state.previewStatus}
            onRegeneratePreview={handleGeneratePreview}
            errorMessage={state.errorMessage}
          />
        )}

        {/* AI Tips */}
        {state.previewStatus !== 'idle' && (
          <AITipsPanel
            tips={state.aiTips}
            isLoading={state.previewStatus === 'processing'}
          />
        )}
      </div>

      {/* Fixed Bottom Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent dark:from-slate-900 dark:via-slate-900 p-4 z-50 pb-24">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <button
            onClick={handleSkip}
            className="px-6 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-semibold"
          >
            تخطي
          </button>
          <div className="flex-1">
            <NextStepButton
              onNext={handleNext}
              modelSelected={!!state.selectedModel}
              fabricUploaded={!!fabricFile}
              isLoading={isGeneratingPreview || isSaving}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
