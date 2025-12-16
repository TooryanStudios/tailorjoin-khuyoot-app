import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Sparkles } from 'lucide-react';
import type { CustomizationModel, CustomizationState, FabricUpload } from '../types/customization';
import { generateFabricPreview } from '../services/fabricAIService';
import { firebaseService } from '../../services/firebase';
import { useApp } from '../../context/AppContext';
import type { MeasurementTemplate } from '../../types';

// Components
import { ModelSelector } from '../components/customization/ModelSelector';
import { FabricUploader } from '../components/customization/FabricUploader';
import { PreviewCanvas } from '../components/customization/PreviewCanvas';
import { AITipsPanel } from '../components/customization/AITipsPanel';
import { NextStepButton } from '../components/customization/NextStepButton';

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

  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) return;
      try {
        const p = await firebaseService.getProduct(productId);
        setProduct(p);
        console.log('[DEBUG] CustomizationPage product loaded:', p);
      } catch (err) {
        console.warn('⚠️ Failed to load product for customization:', err);
      }
    };
    loadProduct();
  }, [productId]);

  // Load measurement templates once
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setIsTemplatesLoading(true);
        const data = await firebaseService.getMeasurementTemplates();
        setTemplates(data || []);
        console.log('[DEBUG] CustomizationPage templates loaded:', data?.length || 0);
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
    if (!user) {
      alert('يجب تسجيل الدخول أولاً');
      return;
    }

    console.log('[DEBUG] handleNext - User:', user);
    console.log('[DEBUG] handleNext - User ID:', user.id);

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

      console.log('[DEBUG] Saving customization with userId:', user.id);
      const customizationId = await firebaseService.saveCustomization(user.id, customizationData);

      // Navigate to measurements page with temporary fabric preview in state
      navigate('/measurements', {
        state: { 
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
      alert('حدث خطأ أثناء حفظ التخصيص. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSaving(false);
    }
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
            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-3">
              <span>اختاري التصميم والقماش قبل إدخال المقاسات</span>
              {productId && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200">
                  Product ID: {productId}
                </span>
              )}
              {product && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200">
                  Category ID: {product.categoryId || 'غير متوفر'}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

        {/* Debug Panel */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 p-4">
          <div className="max-w-5xl mx-auto">
            <h3 className="font-bold text-yellow-900 dark:text-yellow-200 mb-2">Debug Info - CustomizationPage.tsx</h3>
            <div className="grid gap-1 text-sm font-mono">
              <div>
                <span className="text-yellow-700 dark:text-yellow-300 font-bold">Product ID:</span>
                <span className="ml-2 text-yellow-900 dark:text-yellow-100">{productId || 'None'}</span>
              </div>
              <div>
                <span className="text-yellow-700 dark:text-yellow-300 font-bold">Category ID:</span>
                <span className="ml-2 text-yellow-900 dark:text-yellow-100">{product?.categoryId || 'None'}</span>
              </div>
              <div>
                <span className="text-yellow-700 dark:text-yellow-300 font-bold">Templates Loaded:</span>
                <span className="ml-2 text-yellow-900 dark:text-yellow-100">{isTemplatesLoading ? 'loading…' : templates.length}</span>
              </div>
              <div>
                <span className="text-yellow-700 dark:text-yellow-300 font-bold">Rule:</span>
                <span className="ml-2 text-yellow-900 dark:text-yellow-100">Template.id === Product.categoryId</span>
              </div>
              <div>
                <span className="text-yellow-700 dark:text-yellow-300 font-bold">Comparison:</span>
                <span className="ml-2 text-yellow-900 dark:text-yellow-100">
                  T.id = {matchedTemplate?.id || '—'} | P.categoryId = {product?.categoryId || '—'}
                  { matchedTemplate ? ' ✅' : ' ❌' }
                </span>
              </div>
              <div>
                <span className="text-yellow-700 dark:text-yellow-300 font-bold">Matched Template ID:</span>
                <span className="ml-2 text-yellow-900 dark:text-yellow-100">{matchedTemplate?.id || 'None'}</span>
              </div>
              {matchedTemplate && (
                <>
                  <div>
                    <span className="text-yellow-700 dark:text-yellow-300 font-bold">Matched Template Name:</span>
                    <span className="ml-2 text-yellow-900 dark:text-yellow-100">{matchedTemplate.name}</span>
                  </div>
                  <div>
                    <span className="text-yellow-700 dark:text-yellow-300 font-bold">Points Count:</span>
                    <span className="ml-2 text-yellow-900 dark:text-yellow-100">{matchedTemplate.points?.length || 0}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

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

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent dark:from-slate-900 dark:via-slate-900 p-4 z-50 pb-24">
        <div className="max-w-5xl mx-auto">
          <NextStepButton
            onNext={handleNext}
            modelSelected={!!state.selectedModel}
            fabricUploaded={!!fabricFile}
            isLoading={isGeneratingPreview || isSaving}
          />
        </div>
      </div>
    </div>
  );
};
