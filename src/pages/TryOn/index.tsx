
import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { useDesignerLogic } from './hooks/useDesignerLogic';
import { type DemoShellOutletContext } from '../demoShell/DemoShellLayout';
import { Sidebar } from './sections/refactored/Sidebar';
import { DesignerViewport } from './sections/refactored/DesignerViewport';
import { DesignerFullComparison } from './sections/refactored/DesignerFullComparison';
import { DesignerMetadataPanel } from './sections/refactored/DesignerMetadataPanel';
import { DesignerModals } from './sections/refactored/DesignerModals';
import { useDesignerUserData } from './components/userData/useDesignerUserData';
import { FeatureToggleBar } from './components/FeatureToggleBar';
import { MobileDesignerV2 } from '../../modules/designer/mobile';
import { HistoryFilmstrip } from './components/HistoryFilmstrip';
import './DesignerV2_1.module.css';

export const TryOn: React.FC = () => {
  const logic = useDesignerLogic();
  const { serverUser } = useDesignerUserData();
  
  // Safe credit and tier extraction for AuthUser
  const credits = serverUser?.billing?.credits ?? (serverUser as any)?.credits ?? (serverUser as any)?.credit_balance;
  const tier = serverUser?.billing?.tier ?? (serverUser as any)?.tier ?? (serverUser as any)?.subscription?.tier ?? (serverUser as any)?.subscriptionTier;

  const { t, isMobile, uiState, features, setFeatures, isAdminUser, handleClearSelections, navigateHome } = logic;

  // Handle payment status from URL
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    
    if (paymentStatus === 'success') {
      window.history.replaceState({}, document.title, window.location.pathname);
      alert(t('paymentSuccess'));
    } else if (paymentStatus === 'cancel') {
      window.history.replaceState({}, document.title, window.location.pathname);
      alert(t('paymentCancelled'));
    }
  }, [t]);
  
  // Synchronize internal sidebar with master shell:
  const context = useOutletContext<DemoShellOutletContext>();
  const { isSidebarCollapsed, setIsSidebarCollapsed } = logic;
  const isMasterExpanded = context && !context.isMasterSidebarCollapsed;

  // Bi-directional toggle: sidebars are mutually exclusive
  // When Master expands, Designer collapses. When Master collapses, Designer expands.
  React.useEffect(() => {
    if (isMasterExpanded) {
      if (!isSidebarCollapsed) setIsSidebarCollapsed(true);
    } else {
      if (isSidebarCollapsed) setIsSidebarCollapsed(false);
    }
  }, [isMasterExpanded, setIsSidebarCollapsed]);

  React.useEffect(() => {
    if (!isSidebarCollapsed) {
      if (isMasterExpanded) context?.setMasterSidebarCollapsed(true);
    }
  }, [isSidebarCollapsed, isMasterExpanded, context]);

  if (isMobile) {
    return (
      <MobileDesignerV2
        beforeImage={logic.sourceForComparison || ''}
        afterImage={logic.afterImage || ''}
        sliderPos={logic.sliderPos}
        onSliderChange={logic.setSliderPos}
        isProcessing={logic.isProcessing}
        onSelectTemplate={logic.handleTemplateSelect}
        currentTemplateId={logic.selectedTemplate?.id}
        isSubscribedToPremiumTemplates={Boolean(logic.isSubscribed)}
        onPremiumTemplateClick={() => logic.openUpgradeModal('mobile_premium_template')}
        privacy={{
          isPrivacyMode: logic.isPrivacyMode,
          setPrivacyMode: logic.setPrivacyMode,
          maskingStyle: logic.maskingStyle,
          setMaskingStyle: logic.setMaskingStyle,
          blurStrength: logic.blurStrength,
          setBlurStrength: logic.setBlurStrength,
          selectedEmoji: logic.selectedEmoji,
          setSelectedEmoji: logic.setSelectedEmoji,
          isProcessingPrivacy: logic.isProcessingPrivacy,
          canApplyToCurrentTemplate: Boolean(logic.sourcePreviewUrl),
          onApplyToCurrentTemplate: () => undefined,
          disabled: Boolean(logic.uiState.inputsDisabled),
        }}
        fabricPreviewUrl={logic.fabricPreviewUrl || undefined}
        fabricImageBase64={logic.fabricImageBase64}
        fabricImageMimeType={logic.fabricImageMimeType}
        originalFabricData={logic.originalFabricData}
        setFabricPreviewUrl={logic.setFabricPreviewUrl}
        setFabricImageBase64={logic.setFabricImageBase64}
        setFabricImageMimeType={logic.setFabricImageMimeType}
        setOriginalFabricData={logic.setOriginalFabricData}
        onUploadFabric={logic.onPickFabric}
        lightingPreset={logic.lightingPreset}
        onSelectLightingPreset={logic.setLightingPreset}
        selectedModel={logic.selectedModel}
        onChangeSelectedModel={logic.setSelectedModel}
        upscaleEngine={logic.upscaleEngine}
        onChangeUpscaleEngine={logic.setUpscaleEngine}
        outputFit={logic.outputFit}
        onChangeOutputFit={logic.setOutputFit}
        generationCost={logic.generationCost}
        canGenerate={!logic.uiState.generationDisabled}
        onGenerate={logic.handleFabricSwap}
        onRefillCredits={() => logic.openUpgradeModal('mobile_credit_chip')}
        onClearSelections={logic.handleClearSelections}
        history={logic.history}
        historyLoading={logic.isLoading}
        activeHistoryId={logic.activeId}
        onSelectHistoryItem={logic.handleHistorySelect}
        inputsDisabled={logic.uiState.inputsDisabled}
      />
    );
  }

  return (
    <div className="w-full h-full overflow-hidden bg-white text-zinc-900 flex flex-col font-sans selection:bg-purple-100">
      {isAdminUser && (
        <FeatureToggleBar 
          features={features} 
          onFeaturesChange={setFeatures} 
          isAdminUser={isAdminUser} 
        />
      )}

      <main className="flex-1 flex overflow-hidden">
        <Sidebar {...logic} />

        <div className="flex-1 flex overflow-hidden bg-[#e5e5e5]">
          <div className="flex-1 flex flex-col min-w-0 relative overflow-y-scroll custom-scrollbar border-l border-zinc-200 pb-6">
            <DesignerViewport {...logic} />

            {features.showFullComparison && (
              <DesignerFullComparison {...logic} />
            )}

            <DesignerMetadataPanel {...logic} />
          </div>

          {features.showHistoryFilmstrip && (
            <HistoryFilmstrip
              history={logic.history}
              isLoading={logic.isLoading}
              activeId={logic.activeId}
              onSelect={logic.handleSelectHistory}
              onDelete={logic.handleDeleteSlot}
              onSetBefore={logic.setBeforeFromHistory}
              onSetAfter={logic.setAfterFromHistory}
              deletingItemId={logic.deletingItemId}
              isCollapsed={logic.isHistoryCollapsed}
              onToggleCollapse={() => logic.setIsHistoryCollapsed(!logic.isHistoryCollapsed)}
            />
          )}
        </div>
      </main>

      <DesignerModals {...logic} />
    </div>
  );
};

export default TryOn;

