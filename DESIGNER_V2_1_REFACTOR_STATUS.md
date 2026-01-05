# Designer V2.1 Skeleton-First UI Refactor Status

## ✅ Completed Components

### 1. Feature Toggle System
**Location:** `src/pages/DesignerV2_1/types.ts`

- Created `DesignerV2Features` interface with 20+ granular feature flags
- Created `DesignerUIState` interface for disabled/enabled states
- Defined `DEFAULT_FEATURES` with all features enabled by default

**Features Covered:**
- Sidebar uploads (template, fabric)
- Configuration controls (model selection, refinement prompt)
- Output quality section
- Export settings
- Debug section
- Main area components (top bar, slider, toolbar, filmstrip, comparison)
- Modals

### 2. Feature Toggle UI
**Location:** `src/pages/DesignerV2_1/components/FeatureToggleBar.tsx`

- Admin-only floating toggle panel (top-right corner)
- Quick actions: Enable All, Disable All, Reset to Defaults
- Organized by 7 feature groups
- Clean dark theme matching Designer V2.1 aesthetic
- Individual toggle switches for each feature

### 3. Centralized UI State Pattern
**Approach:** Similar to homepage's skeleton-first pattern

**UI State Properties:**
```typescript
{
  allDisabled: boolean;
  uploadsDisabled: boolean;
  inputsDisabled: boolean;
  generationDisabled: boolean;
  upscaleDisabled: boolean;
  watermarkDisabled: boolean;
  showUpscaleButton: boolean;
  showProFeatures: boolean;
  showUpgradePrompt: boolean;
}
```

## ⚠️ Incomplete Work

### Main Component Integration
**File:** `src/pages/DesignerV2_1/DesignerV2_1.tsx`

**Status:** File corrupted during regex replacement. Needs manual reconstruction.

**Required Changes:**
1. Import `FeatureToggleBar` and types
2. Add `features` state with `DEFAULT_FEATURES`
3. Add `useApp()` hook to get user role
4. Replace all conditional renders with `features.showX &&`
5. Replace all `disabled` props with `uiState.xDisabled`
6. Wrap JSX in fragment with `<FeatureToggleBar />` at top

## 🔧 Implementation Plan

### Step 1: Fix DesignerV2_1.tsx Structure
1. Restore clean version from git
2. Add imports:
   ```tsx
   import { FeatureToggleBar } from './components/FeatureToggleBar';
   import { DesignerV2Features, DEFAULT_FEATURES, DesignerUIState } from './types';
   import { useApp } from '../../../context/AppContext';
   ```

3. Add state and computed values:
   ```tsx
   const { user } = useApp();
   const isAdminUser = user?.role === 'admin';
   const [features, setFeatures] = useState<DesignerV2Features>(DEFAULT_FEATURES);
   
   const uiState: DesignerUIState = useMemo(() => ({
     allDisabled: isProcessing || isUpscaling,
     uploadsDisabled: isProcessing,
     inputsDisabled: isProcessing,
     generationDisabled: isProcessing || !sourcePreviewUrl || !fabricPreviewUrl,
     upscaleDisabled: isProcessing || isUpscaling || !beforeUpscaleImage,
     watermarkDisabled: isProcessing || !isSubscribed,
     showUpscaleButton: !!beforeUpscaleImage,
     showProFeatures: isSubscribed,
     showUpgradePrompt: !isSubscribed,
   }), [isProcessing, isUpscaling, sourcePreviewUrl, fabricPreviewUrl, beforeUpscaleImage, isSubscribed]);
   ```

### Step 2: Apply Feature Toggles
Wrap each major section:

**Template Upload:**
```tsx
{features.showTemplateUpload && (
  <div>
    <label className={uiState.uploadsDisabled ? 'opacity-60 pointer-events-none' : ''}>
      <input disabled={uiState.uploadsDisabled} />
    </label>
  </div>
)}
```

**Model Selection:**
```tsx
{features.showModelSelection && (
  <SegmentedToggle disabled={uiState.inputsDisabled} />
)}
```

**Generate Button:**
```tsx
{features.showGenerateButton && (
  <button disabled={uiState.generationDisabled}>
    Generate & Enhance
  </button>
)}
```

### Step 3: Add Feature Toggle Bar
Wrap entire return in fragment:
```tsx
return (
  <>
    <FeatureToggleBar
      features={features}
      onFeaturesChange={setFeatures}
      isAdminUser={isAdminUser}
    />
    <div className="main-wrapper...">
      {/* Rest of UI */}
    </div>
  </>
);
```

### Step 4: Add Skeleton States
Similar to homepage pattern:

```tsx
const showHistorySkeleton = isLoadingHistory && generationHistory.length === 0;

// In JSX:
{features.showHistoryFilmstrip && (
  <div className="filmstrip">
    {showHistorySkeleton ? (
      <HistorySkeleton />
    ) : (
      generationHistory.map(...)
    )}
  </div>
)}
```

## 📊 Benefits Once Complete

### For Developers:
- ✅ Single source of truth for UI state
- ✅ Easy to add/remove features
- ✅ No scattered disable logic
- ✅ Admin can test partial UIs
- ✅ Clear separation of concerns

### For Users:
- ✅ Consistent disabled states
- ✅ No confusing half-working UI
- ✅ Skeleton states show intent (loading vs. empty)
- ✅ Smooth transitions

### For Testing:
- ✅ Can isolate components
- ✅ Can test edge cases (all disabled)
- ✅ Can verify feature parity
- ✅ Can demo incremental builds

## 🎯 Next Steps

1. **Restore DesignerV2_1.tsx** from a clean state or git history
2. **Apply imports** from Step 1
3. **Add state management** from Step 1
4. **Wrap sections** with feature toggles from Step 2
5. **Add toggle bar** from Step 3
6. **Test admin panel** - verify all toggles work
7. **Add skeleton components** for loading states
8. **Document usage** for team

## 📝 Notes

- Feature toggle bar only shows for admin users (`user?.role === 'admin'`)
- All features default to `true` (full functionality)
- UI state is computed from processing states (reactive)
- Pattern matches homepage implementation for consistency
- TypeScript ensures all feature flags are accounted for

## 🔗 Related Files

- `types.ts` - Feature flags & UI state types ✅
- `components/FeatureToggleBar.tsx` - Toggle UI ✅
- `DesignerV2_1.tsx` - Main component ⚠️ (needs fix)
- `DesignerV2_1.module.css` - Styles (already compatible)

---

**Status:** Foundation complete, integration blocked by file corruption.
**Resolution:** Manually reconstruct DesignerV2_1.tsx following implementation plan above.
