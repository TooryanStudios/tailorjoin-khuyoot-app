import React from 'react';
import { TryOnResult } from '../components/TryOnResult';
import { MINIMAL_FEATURES, DEVELOPMENT_FEATURES } from '../components/tryOnResult/TryOnResultFeatures';

/**
 * Example: Toggle UI features with a single prop change
 * 
 * This demonstrates how easy it is to enable/disable
 * any UI element in the TryOnResult component.
 */
export function FeatureToggleExample() {
  const [mode, setMode] = React.useState<'full' | 'minimal' | 'custom'>('full');

  // Example: Different feature sets
  const features = React.useMemo(() => {
    switch (mode) {
      case 'minimal':
        return MINIMAL_FEATURES;
      
      case 'custom':
        return {
          // Show only comparison tools
          showTemplatePreview: false,
          showFabricPreview: false,
          showFabricTilingButton: false,
          showGenerateButton: false,
          showMaskCheckbox: false,
          showComparisonSlider: true,
          showGenerationsRail: true,
          showBurgerMenu: false,
        };
      
      case 'full':
      default:
        return undefined; // Use defaults (all enabled)
    }
  }, [mode]);

  return (
    <div>
      {/* Toggle buttons */}
      <div className="flex gap-2 mb-4 p-4 bg-gray-100 rounded">
        <button
          onClick={() => setMode('full')}
          className={`px-4 py-2 rounded ${mode === 'full' ? 'bg-blue-600 text-white' : 'bg-white'}`}
        >
          Full UI
        </button>
        <button
          onClick={() => setMode('minimal')}
          className={`px-4 py-2 rounded ${mode === 'minimal' ? 'bg-blue-600 text-white' : 'bg-white'}`}
        >
          Minimal UI
        </button>
        <button
          onClick={() => setMode('custom')}
          className={`px-4 py-2 rounded ${mode === 'custom' ? 'bg-blue-600 text-white' : 'bg-white'}`}
        >
          Comparison Only
        </button>
      </div>

      {/* Component with toggled features */}
      <TryOnResult
        result={null}
        loading={false}
        features={features}  // ← Single prop changes entire UI!
        // ... other props
      />
    </div>
  );
}

/**
 * Example: Environment-based features
 */
export function EnvironmentBasedExample() {
  const isDev = process.env.NODE_ENV === 'development';
  
  return (
    <TryOnResult
      result={null}
      loading={false}
      features={isDev ? DEVELOPMENT_FEATURES : undefined}
      // ... other props
    />
  );
}

/**
 * Example: User role based features
 */
export function UserRoleExample({ userRole }: { userRole: 'admin' | 'user' }) {
  return (
    <TryOnResult
      result={null}
      loading={false}
      features={{
        showTestModeToggle: userRole === 'admin',
        showDebugLogPanel: userRole === 'admin',
        showAdminAnchors: userRole === 'admin',
      }}
      // ... other props
    />
  );
}

/**
 * Example: A/B testing
 */
export function ABTestExample() {
  const variant = React.useMemo(() => Math.random() < 0.5 ? 'A' : 'B', []);
  
  return (
    <TryOnResult
      result={null}
      loading={false}
      features={{
        showFabricTilingButton: variant === 'A',
        showMaskCheckbox: variant === 'B',
      }}
      // ... other props
    />
  );
}
