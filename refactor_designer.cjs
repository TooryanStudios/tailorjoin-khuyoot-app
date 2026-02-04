const fs = require('fs');
const path = require('path');

const filePath = 'C:/Projects/Khuyoot App/Code/khuyoot-خيوط/src/pages/DesignerV2_1/DesignerV2_1.tsx';
const content = fs.readFileSync(filePath, 'utf8');

// Identify components parts
// This is a bit manual but safer than regex for this size
const logicStartMatch = content.match(/export const DesignerV2_1: React.FC = \(\) => {/);
const jsxStartMatch = content.match(/return \(/); // Usually the main return

if (!logicStartMatch || !jsxStartMatch) {
  console.error('Could not find logic or JSX start');
  process.exit(1);
}

const logicStart = logicStartMatch.index + logicStartMatch[0].length;
const jsxStart = jsxStartMatch.index;

const logicBlock = content.substring(logicStart, jsxStart);

// Create the hook file
const hookPath = 'C:/Projects/Khuyoot App/Code/khuyoot-خيوط/src/pages/DesignerV2_1/hooks/useDesignerLogic.ts';
const hookContent = `
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';
import { useDesignerStore } from '../../store/useDesignerStore';
import { useTemplateSelection, useTemplateStore } from '../../modules/TemplatePicker';
import { usePrivacyShield } from '../../modules/PrivacyShield';
import { useLightingGenerator } from '../../modules/generator/hooks/useLightingGenerator';
import { useGenerationHistory } from './useGenerationHistory';
import { taskStorage, generateTaskId, copyTaskUrlToClipboard } from '../services/taskStorage';
import { traceStep, traceEnd, traceSetActive } from '../../utils/trace';
import { useCredits } from '../../modules/CreditManager';
import { useModalStore } from '../../store/useModalStore';
import { firebaseService } from '../../../services/firebase';
import { getProductById } from '../../../services/mockService';
import { useMobileDetection } from '../../modules/designer/mobile';

// Constants moved from main file
const FREE_GENERATION_LIMIT = 5;
const ORIGINAL = null as string | null;
const DESIGNER_CACHE_VERSION = 2;

export const useDesignerLogic = () => {
  ${logicBlock}

  // Ensure all needed variables are returned
  return {
    t, navigate, taskId: urlTaskId, user, isAdminUser,
    features, setFeatures, uiState, setUiState,
    selectedModel, setSelectedModel, refinementPrompt, setRefinementPrompt,
    sourcePreviewUrl, setSourcePreviewUrl, sourceImageBase64, setSourceImageBase64, sourceImageMimeType, setSourceImageMimeType,
    fabricPreviewUrl, setFabricPreviewUrl, fabricImageBase64, setFabricImageBase64, fabricImageMimeType, setFabricImageMimeType,
    fabricMaterial, setFabricMaterial, fabricTilingOpen, setFabricTilingOpen,
    fabricInputRef, templateInputRef,
    isProcessingTemplate, setIsProcessingTemplate, isProcessingFabric, setIsProcessingFabric,
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
    // Handlers
    navigateHome, navigateProfile, showError,
    handleTemplateSelect, setLastActiveTemplateTab,
    openFabricPrep, closeFabricPrep, openUserImagePrep, closeUserImagePrep,
    handleFabricSwap, handleUpscale, handleSelectHistory, handleSelectPreset,
    handleDeleteSlot, confirmDelete, cancelDelete, handleShareTask,
    handleClearSelections, copyToClipboard,
    setPrivacyMode, isPrivacyMode, maskingStyle, setMaskingStyle, blurStrength, setBlurStrength,
    selectedEmoji, setSelectedEmoji, isProcessingPrivacy,
    selectedTemplate, lightingGenerator,
    setBeforeFromHistory, setAfterFromHistory
  };
};
`;

fs.writeFileSync(hookPath, hookContent);

// Simplified DesignerV2_1
const simplifiedDesigner = `
import React from 'react';
import { useDesignerLogic } from './hooks/useDesignerLogic';
import { Sidebar } from './sections/refactored/Sidebar';
import { DesignerViewport } from './sections/refactored/DesignerViewport';
import { DesignerFullComparison } from './sections/refactored/DesignerFullComparison';
import { DesignerMetadataPanel } from './sections/refactored/DesignerMetadataPanel';
import { DesignerModals } from './sections/refactored/DesignerModals';
import { DesignerHeader } from '../../modules/navigation/DesignerHeader';
import { HistoryFilmstrip } from './components/HistoryFilmstrip';
import { GenerationHistoryBlock } from './components/GenerationHistoryBlock';
import { CreditBadge } from '../../modules/CreditManager';
import { Trash2 } from 'lucide-react';
import { DebugPanel } from './components/DebugPanel';
import './DesignerV2_1.module.css';

export const DesignerV2_1: React.FC = () => {
  const d = useDesignerLogic();

  return (
    <>
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans selection:bg-purple-500/30">
      <Sidebar 
        {...d}
        isProcessingTemplate={d.isProcessingTemplate}
        isProcessingFabric={d.isProcessingFabric}
        isProcessingPrivacy={d.isProcessingPrivacy}
      />

      <main className="flex-1 relative flex flex-col min-w-0 min-h-0 overflow-hidden bg-zinc-950">
        {d.features.showTopBar && (
          <DesignerHeader
            onHome={d.navigateHome}
            rightSlot={
              <div className="flex items-center gap-3">
                <CreditBadge onRefill={() => d.openUpgradeModal('upgrade_button_main')} />
                <button
                  type="button"
                  onClick={d.handleClearSelections}
                  disabled={d.uiState.inputsDisabled || (!d.sourceForComparison && !d.afterImage && !d.fabricPreviewUrl && !d.selectedTemplate?.id)}
                  className={\`p-2 rounded-lg border transition-colors \${
                    d.uiState.inputsDisabled || (!d.sourceForComparison && !d.afterImage && !d.fabricPreviewUrl && !d.selectedTemplate?.id)
                      ? 'bg-zinc-900/40 border-zinc-800 text-zinc-600 cursor-not-allowed'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700'
                  }\`}
                  title={d.t('clearComparison')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {d.isAdminUser && (
                  <button
                    type="button"
                    onClick={() => d.setDebugPanelOpen(true)}
                    className={\`p-2 rounded-lg border transition-colors \${
                      d.debugPanelOpen
                        ? 'bg-purple-500/15 border-purple-500/40 text-purple-200'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700'
                    }\`}
                  >
                    <span className="w-4 h-4 flex items-center justify-center leading-none">📊</span>
                  </button>
                )}

                <button
                  onClick={d.navigateProfile}
                  className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-lg border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                    {d.user?.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-xs text-zinc-300">{d.user?.email?.split('@')[0] || 'User'}</span>
                </button>
              </div>
            }
          />
        )}

        <div className={\`flex-1 min-h-0 \${(d.sourceForComparison || d.afterImage) ? 'overflow-y-auto custom-scrollbar' : 'overflow-y-hidden'} bg-zinc-950 pb-24\`}>
          <GenerationHistoryBlock className="m-8" />
          
          <DesignerViewport {...d} />

          {d.features.showHistoryFilmstrip && (
            <HistoryFilmstrip
              history={d.history}
              isLoading={d.isLoading}
              activeId={d.activeId}
              onSelect={d.handleSelectHistory}
              onDelete={d.handleDeleteSlot}
              onSetBefore={d.setBeforeFromHistory}
              onSetAfter={d.setAfterFromHistory}
              deletingItemId={d.deletingItemId}
            />
          )}

          <DesignerFullComparison {...d} />
          
          <DesignerMetadataPanel {...d} />
        </div>
      </main>
    </div>

    <DesignerModals {...d} />
    
    {d.isAdminUser && <DebugPanel isOpen={d.debugPanelOpen} onClose={() => d.setDebugPanelOpen(false)} />}
    </>
  );
};
`;

fs.writeFileSync(filePath, simplifiedDesigner);
console.log('Successfully refactored DesignerV2_1.tsx');
