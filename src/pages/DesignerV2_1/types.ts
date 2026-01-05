/**
 * Designer V2.1 Feature Flags
 * Controls visibility and enabled state of all UI components
 */
export interface DesignerV2Features {
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
  // Sidebar - Upload Section
  showTemplateUpload: true,
  showFabricUpload: true,
  
  // Sidebar - Configuration Section
  showModelSelection: true,
  showRefinementPrompt: true,
  
  // Sidebar - Output Quality Section
  showOutputQuality: true,
  showUpscaleEngine: true,
  showOutputFit: true,
  showUpscaleButton: true,
  
  // Sidebar - Export Settings Section
  showExportSettings: true,
  showWatermarkToggle: true,
  showSubscriptionControls: true,
  
  // Sidebar - Debug Section
  showDebugSection: true,
  
  // Sidebar - Action Button
  showGenerateButton: true,
  
  // Main Area - Top Bar
  showTopBar: true,
  
  // Main Area - Comparison Viewer
  showComparisonSlider: true,
  showFloatingToolbar: true,
  
  // Main Area - History Filmstrip
  showHistoryFilmstrip: true,
  
  // Main Area - Full Comparison Section
  showFullComparison: true,
  
  // Modals
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
