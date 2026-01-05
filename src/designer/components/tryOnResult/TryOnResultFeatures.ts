/**
 * Feature flags for TryOnResult UI elements
 * Set to false to hide/disable any feature
 */
export interface TryOnResultFeatures {
  // Entire Sections
  showPreviewSection: boolean; // معاينة القالب والقماش section
  
  // Controls Panel Features
  showTemplatePreview: boolean;
  showFabricPreview: boolean;
  showFabricTilingButton: boolean;
  showGenerateButton: boolean;
  showMaskCheckbox: boolean;
  
  // Comparison Panel Features
  showComparisonSlider: boolean;
  showGenerationsRail: boolean; // Unified responsive rail (horizontal on mobile, vertical on SM+)
  
  // Menu & Actions
  showBurgerMenu: boolean;
  showHelpButton: boolean;
  showDownloadButton: boolean;
  showSaveToProjectButton: boolean;
  showComparisonDrawer: boolean;
  
  // Debug & Testing
  showTestModeToggle: boolean;
  showDebugLogPanel: boolean;
  showAdminAnchors: boolean;
}

/**
 * Default feature flags - all enabled
 */
export const DEFAULT_FEATURES: TryOnResultFeatures = {
  showPreviewSection: true,
  showTemplatePreview: true,
  showFabricPreview: true,
  showFabricTilingButton: true,
  showGenerateButton: true,
  showMaskCheckbox: true,
  showComparisonSlider: true,
  showGenerationsRail: true,
  showBurgerMenu: true,
  showHelpButton: true,
  showDownloadButton: true,
  showSaveToProjectButton: true,
  showComparisonDrawer: true,
  showTestModeToggle: false, // Hidden by default
  showDebugLogPanel: false,  // Hidden by default
  showAdminAnchors: false,   // Hidden by default
};

/**
 * Production features - minimal UI for end users
 */
export const PRODUCTION_FEATURES: TryOnResultFeatures = {
  ...DEFAULT_FEATURES,
  showPreviewSection: true,
  showTestModeToggle: false,
  showDebugLogPanel: false,
  showAdminAnchors: false,
  showBurgerMenu: true,
  showHelpButton: true,
};

/**
 * Development features - all features visible for testing
 */
export const DEVELOPMENT_FEATURES: TryOnResultFeatures = {
  ...DEFAULT_FEATURES,
  showTestModeToggle: true,
  showDebugLogPanel: true,
  showAdminAnchors: true,
};

/**
 * Minimal features - only essential UI
 */
export const MINIMAL_FEATURES: TryOnResultFeatures = {
  ...DEFAULT_FEATURES,
  showTemplatePreview: false,
  showFabricTilingButton: false,
  showMaskCheckbox: false,
  showBurgerMenu: false,
  showHelpButton: false,
  showTestModeToggle: false,
  showDebugLogPanel: false,
  showAdminAnchors: false,
};

/**
 * Get features based on environment or custom config
 */
export function getTryOnResultFeatures(
  env: 'production' | 'development' | 'minimal' | 'custom' = 'production',
  customFeatures?: Partial<TryOnResultFeatures>
): TryOnResultFeatures {
  let baseFeatures: TryOnResultFeatures;
  
  switch (env) {
    case 'development':
      baseFeatures = DEVELOPMENT_FEATURES;
      break;
    case 'minimal':
      baseFeatures = MINIMAL_FEATURES;
      break;
    case 'custom':
      baseFeatures = customFeatures ? { ...DEFAULT_FEATURES, ...customFeatures } : DEFAULT_FEATURES;
      break;
    case 'production':
    default:
      baseFeatures = PRODUCTION_FEATURES;
      break;
  }
  
  return customFeatures ? { ...baseFeatures, ...customFeatures } : baseFeatures;
}
