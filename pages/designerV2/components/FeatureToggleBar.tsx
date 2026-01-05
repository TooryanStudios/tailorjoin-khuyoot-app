import React from 'react';
import { Eye, EyeOff, Settings, X } from 'lucide-react';
import type { TryOnResultFeatures } from '../../../src/designer/components/tryOnResult/TryOnResultFeatures';
import { DEFAULT_FEATURES } from '../../../src/designer/components/tryOnResult/TryOnResultFeatures';

interface FeatureToggleBarProps {
  features: TryOnResultFeatures;
  onFeaturesChange: (features: TryOnResultFeatures) => void;
  isAdminUser?: boolean;
}

export const FeatureToggleBar: React.FC<FeatureToggleBarProps> = ({
  features,
  onFeaturesChange,
  isAdminUser = false,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const toggleFeature = (key: keyof TryOnResultFeatures) => {
    onFeaturesChange({
      ...features,
      [key]: !features[key],
    });
  };

  const resetToDefaults = () => {
    onFeaturesChange(DEFAULT_FEATURES);
  };

  const enableAll = () => {
    const allEnabled = Object.keys(features).reduce((acc, key) => ({
      ...acc,
      [key]: true,
    }), {} as TryOnResultFeatures);
    onFeaturesChange(allEnabled);
  };

  const disableAll = () => {
    const allDisabled = Object.keys(features).reduce((acc, key) => ({
      ...acc,
      [key]: false,
    }), {} as TryOnResultFeatures);
    onFeaturesChange(allDisabled);
  };

  // Group features by category
  const featureGroups = {
    'DesignerV2 (Root) - Main orchestrator': [
      { key: 'showPreviewSection' as const, label: 'Preview Section' },
    ],
    'ControlsPanel (Left) - Template/Fabric/Generate': [
      { key: 'showTemplatePreview' as const, label: 'Template Preview' },
      { key: 'showFabricPreview' as const, label: 'Fabric Preview' },
      { key: 'showFabricTilingButton' as const, label: 'Fabric Tiling Button' },
      { key: 'showGenerateButton' as const, label: 'Generate Button' },
      { key: 'showMaskCheckbox' as const, label: 'Mask Checkbox' },
    ],
    'ComparisonPanel (Right) - Slider/Menu/Generations': [
      { key: 'showComparisonSlider' as const, label: 'Comparison Slider' },
      { key: 'showGenerationsRail' as const, label: 'Generations Rail (Responsive)' },
    ],
    'ModalsSection - All page modals': [
      { key: 'showBurgerMenu' as const, label: 'Burger Menu' },
      { key: 'showHelpButton' as const, label: 'Help Button' },
      { key: 'showDownloadButton' as const, label: 'Download Button' },
      { key: 'showSaveToProjectButton' as const, label: 'Save to Project Button' },
      { key: 'showComparisonDrawer' as const, label: 'Comparison Drawer' },
    ],
    'TryOnResult - Main UI interface': [
      { key: 'showTestModeToggle' as const, label: 'Test Mode Toggle' },
      { key: 'showDebugLogPanel' as const, label: 'Debug Log Panel' },
      { key: 'showAdminAnchors' as const, label: 'Admin Anchors' },
    ],
  };

  if (!isAdminUser) return null;

  return (
    <>
      {/* Sidebar Control Bar - PANEL DISABLED, ICON ONLY */}
      <div className="fixed top-0 left-0 bottom-0 z-[499] w-12">
        {/* Toggle Button - Icon Only (Panel Disabled) */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute top-4 left-1/2 -translate-x-1/2 p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-colors"
          title="لوحة التحكم معطلة"
        >
          <Settings size={16} />
        </button>

        {/* Expanded Content - DISABLED */}
        {false && isExpanded && (
          <div className="h-full flex flex-col pt-16">
            {/* Header */}
            <div className="px-3 pb-3 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-sm text-slate-900 dark:text-white mb-2 text-center">
                التحكم في الواجهة
              </h2>

              {/* Quick Actions */}
              <div className="flex gap-1">
                <button
                  onClick={enableAll}
                  className="flex-1 px-2 py-1 text-xs rounded bg-green-600 hover:bg-green-700 text-white transition-colors"
                  title="إظهار الكل"
                >
                  <Eye size={12} className="inline" />
                </button>
                <button
                  onClick={disableAll}
                  className="flex-1 px-2 py-1 text-xs rounded bg-red-600 hover:bg-red-700 text-white transition-colors"
                  title="إخفاء الكل"
                >
                  <EyeOff size={12} className="inline" />
                </button>
                <button
                  onClick={resetToDefaults}
                  className="flex-1 px-2 py-1 text-xs rounded bg-slate-600 hover:bg-slate-700 text-white transition-colors"
                  title="افتراضي"
                >
                  ↺
                </button>
              </div>
            </div>

            {/* Feature Groups - Scrollable */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {Object.entries(featureGroups).map(([groupName, groupFeatures]) => (
                <div key={groupName}>
                  <h3 className="text-xs text-slate-700 dark:text-slate-300 mb-1.5">
                    {groupName}
                  </h3>
                  <div className="space-y-1">
                    {groupFeatures.map(({ key, label }) => (
                      <label
                        key={key}
                        className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                      >
                        <span className="text-xs text-slate-700 dark:text-slate-200">
                          {label}
                        </span>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={features[key]}
                            onChange={() => toggleFeature(key)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-300 dark:bg-slate-600 peer-focus:ring-1 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
