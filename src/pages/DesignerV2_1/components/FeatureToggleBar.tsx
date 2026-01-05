import React from 'react';
import { Eye, EyeOff, Settings } from 'lucide-react';
import { DesignerV2Features, DEFAULT_FEATURES } from '../types';

interface FeatureToggleBarProps {
  features: DesignerV2Features;
  onFeaturesChange: (features: DesignerV2Features) => void;
  isAdminUser?: boolean;
}

export const FeatureToggleBar: React.FC<FeatureToggleBarProps> = ({
  features,
  onFeaturesChange,
  isAdminUser = false,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const toggleFeature = (key: keyof DesignerV2Features) => {
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
    }), {} as DesignerV2Features);
    onFeaturesChange(allEnabled);
  };

  const disableAll = () => {
    const allDisabled = Object.keys(features).reduce((acc, key) => ({
      ...acc,
      [key]: false,
    }), {} as DesignerV2Features);
    onFeaturesChange(allDisabled);
  };

  const featureGroups = {
    'Sidebar - Upload Section': [
      { key: 'showTemplateUpload' as const, label: 'Template Upload' },
      { key: 'showFabricUpload' as const, label: 'Fabric Upload' },
    ],
    'Sidebar - Configuration': [
      { key: 'showModelSelection' as const, label: 'Model Selection' },
      { key: 'showRefinementPrompt' as const, label: 'Refinement Prompt' },
    ],
    'Sidebar - Output Quality': [
      { key: 'showOutputQuality' as const, label: 'Output Quality Section' },
      { key: 'showUpscaleEngine' as const, label: 'Upscale Engine' },
      { key: 'showOutputFit' as const, label: 'Output Fit' },
      { key: 'showUpscaleButton' as const, label: 'Upscale Button' },
    ],
    'Sidebar - Export Settings': [
      { key: 'showExportSettings' as const, label: 'Export Settings Section' },
      { key: 'showWatermarkToggle' as const, label: 'Watermark Toggle' },
      { key: 'showSubscriptionControls' as const, label: 'Subscription Controls' },
    ],
    'Sidebar - Other': [
      { key: 'showDebugSection' as const, label: 'Debug Section' },
      { key: 'showGenerateButton' as const, label: 'Generate Button' },
    ],
    'Main Area - Viewer': [
      { key: 'showTopBar' as const, label: 'Top Bar' },
      { key: 'showComparisonSlider' as const, label: 'Comparison Slider' },
      { key: 'showFloatingToolbar' as const, label: 'Floating Toolbar' },
    ],
    'Main Area - Collections': [
      { key: 'showHistoryFilmstrip' as const, label: 'History Filmstrip' },
      { key: 'showFullComparison' as const, label: 'Full Comparison Section' },
    ],
    'Modals': [
      { key: 'showUpgradeModal' as const, label: 'Upgrade Modal' },
    ],
  };

  if (!isAdminUser) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[999]">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-lg transition-all active:scale-95"
        title="Designer V2.1 Feature Toggles"
      >
        <Settings size={20} />
      </button>

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="absolute bottom-14 left-0 w-80 max-h-[80vh] bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-zinc-700 bg-zinc-950">
            <h2 className="text-sm font-bold text-white mb-2">
              Designer V2.1 Controls
            </h2>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <button
                onClick={enableAll}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors flex items-center justify-center gap-1"
              >
                <Eye size={14} />
                Show All
              </button>
              <button
                onClick={disableAll}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center justify-center gap-1"
              >
                <EyeOff size={14} />
                Hide All
              </button>
              <button
                onClick={resetToDefaults}
                className="px-3 py-1.5 text-xs rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Feature Groups - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {Object.entries(featureGroups).map(([groupName, groupFeatures]) => (
              <div key={groupName}>
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  {groupName}
                </h3>
                <div className="space-y-1">
                  {groupFeatures.map(({ key, label }) => (
                    <label
                      key={key}
                      className="flex items-center justify-between p-2 rounded-lg bg-zinc-800 hover:bg-zinc-750 cursor-pointer transition-colors"
                    >
                      <span className="text-xs text-zinc-200">{label}</span>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={features[key]}
                          onChange={() => toggleFeature(key)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-zinc-600 peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
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
  );
};
