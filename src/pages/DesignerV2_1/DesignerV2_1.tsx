
import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { useDesignerLogic } from './hooks/useDesignerLogic';
import { type DemoShellOutletContext } from '../demoShell/DemoShellLayout';
import { Sidebar } from './sections/refactored/Sidebar';
import { DesignerViewport } from './sections/refactored/DesignerViewport';
import { DesignerFullComparison } from './sections/refactored/DesignerFullComparison';
import { DesignerMetadataPanel } from './sections/refactored/DesignerMetadataPanel';
import { DesignerModals } from './sections/refactored/DesignerModals';
import { DesignerHeader } from '../../modules/navigation/DesignerHeader';
import { useDesignerUserData } from './components/userData/useDesignerUserData';
import { FeatureToggleBar } from './components/FeatureToggleBar';
import { MobileDesignerV2 } from '../../modules/designer/mobile';
import { HistoryFilmstrip } from './components/HistoryFilmstrip';
import './DesignerV2_1.module.css';

export const DesignerV2_1: React.FC = () => {
  const logic = useDesignerLogic();
  const { serverUser } = useDesignerUserData();
  
  // Safe credit and tier extraction for AuthUser
  const credits = serverUser?.billing?.credits ?? (serverUser as any)?.credits ?? (serverUser as any)?.credit_balance;
  const tier = serverUser?.billing?.tier ?? (serverUser as any)?.tier ?? (serverUser as any)?.subscription?.tier ?? (serverUser as any)?.subscriptionTier;

  const { t, isMobile, uiState, features, setFeatures, isAdminUser, handleClearSelections, navigateHome, i18n } = logic;
  const isAr = i18n.language === 'ar';

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
    return <MobileDesignerV2 />;
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
        <Sidebar {...(logic as any)._stable || logic} />

        <div className="flex-1 flex overflow-hidden bg-white">
          <div className="flex-1 flex flex-col min-w-0 relative overflow-y-auto custom-scrollbar border-l border-zinc-200">
            <DesignerViewport {...logic} />
            
            {features.showFullComparison && (
              <DesignerFullComparison {...(logic as any)._stable || logic} />
            )}

            <DesignerMetadataPanel {...(logic as any)._stable || logic} />
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

      <DesignerModals {...(logic as any)._stable || logic} />
    </div>
  );
};

export default DesignerV2_1;

