/**
 * Designer V2.1 Feature Flags
 * Controls visibility and enabled state of all UI components
 */
export interface DesignerV2Features {
  // Sidebar Visibility
  showSidebar: boolean;

  // Lighting Controls
  showLighting: boolean;

  // Sidebar - Upload Section
  showTemplateUpload: boolean;
  showFabricUpload: boolean;
  
  // Sidebar - Configuration Section
  showModelSelection: boolean;
  showRefinementPrompt: boolean;
  
  // Sidebar - Output Quality Section
  showOutputQuality: boolean;
  showUpscaleEngine: boolean;
  showOutputFit: boolean;
  showUpscaleButton: boolean;
  
  // Sidebar - Export Settings Section
  showExportSettings: boolean;
  showWatermarkToggle: boolean;
  showSubscriptionControls: boolean;
  
  // Sidebar - Debug Section
  showDebugSection: boolean;
  
  // Sidebar - Action Button
  showGenerateButton: boolean;
  
  // Sidebar - Privacy Shield
  showPrivacySettings: boolean;
  
  // Sidebar - Tiling Controls
  showTilingControls: boolean;
  
  // Main Area - Top Bar
  showTopBar: boolean;
  
  // Main Area - Comparison Viewer
  showComparisonSlider: boolean;
  showFloatingToolbar: boolean;
  
  // Main Area - History Filmstrip
  showHistoryFilmstrip: boolean;
  
  // Main Area - Full Comparison Section
  showFullComparison: boolean;
  
  // Modals
  showUpgradeModal: boolean;
}

export const DEFAULT_FEATURES: DesignerV2Features = {
  showSidebar: true,
  showLighting: true,
  showTemplateUpload: true,
  showFabricUpload: true,
  showModelSelection: true,
  showRefinementPrompt: true,
  showOutputQuality: true,
  showUpscaleEngine: true,
  showOutputFit: true,
  showUpscaleButton: true,
  showExportSettings: true,
  showWatermarkToggle: true,
  showSubscriptionControls: true,
  showDebugSection: true,
  showGenerateButton: true,
  showPrivacySettings: true,
  showTilingControls: true,
  showTopBar: true,
  showComparisonSlider: true,
  showFloatingToolbar: true,
  showHistoryFilmstrip: true,
  showFullComparison: true,
  showUpgradeModal: true,
};

/**
 * UI State - Controls disabled/enabled state
 */
export interface DesignerUIState {
  // Global disabled states
  allDisabled: boolean;
  uploadsDisabled: boolean;
  inputsDisabled: boolean;
  generationDisabled: boolean;
  upscaleDisabled: boolean;
  watermarkDisabled: boolean;
  
  // Visibility states (computed from processing states)
  showUpscaleButton: boolean;
  showProFeatures: boolean;
  showUpgradePrompt: boolean;
}
