# How to Enable/Disable UI Elements

With the refactored architecture, it's now **extremely easy** to control UI visibility!

## Quick Examples

### 1. Hide the fabric tiling button:
```tsx
<TryOnResult
  {...otherProps}
  features={{
    showFabricTilingButton: false
  }}
/>
```

### 2. Show only essential UI (minimal mode):
```tsx
import { MINIMAL_FEATURES } from './tryOnResult/TryOnResultFeatures';

<TryOnResult
  {...otherProps}
  features={MINIMAL_FEATURES}
/>
```

### 3. Enable debug/testing features:
```tsx
import { DEVELOPMENT_FEATURES } from './tryOnResult/TryOnResultFeatures';

<TryOnResult
  {...otherProps}
  features={DEVELOPMENT_FEATURES}
/>
```

### 4. Custom configuration:
```tsx
<TryOnResult
  {...otherProps}
  features={{
    // Hide debug UI
    showTestModeToggle: false,
    showDebugLogPanel: false,
    
    // Show only comparison
    showTemplatePreview: false,
    showFabricPreview: false,
    showGenerateButton: false,
    
    // Keep comparison tools
    showComparisonSlider: true,
    showGenerationsRail: true,
  }}
/>
```

### 5. Environment-based features:
```tsx
import { getTryOnResultFeatures } from './tryOnResult/TryOnResultFeatures';

const features = getTryOnResultFeatures(
  process.env.NODE_ENV === 'production' ? 'production' : 'development'
);

<TryOnResult
  {...otherProps}
  features={features}
/>
```

## Available Feature Flags

### Controls Panel
- `showTemplatePreview` - Template image picker button
- `showFabricPreview` - Fabric image picker button  
- `showFabricTilingButton` - Fabric tiling/scale button
- `showGenerateButton` - Generate/retry button
- `showMaskCheckbox` - Apply mask checkbox

### Comparison Panel
- `showComparisonSlider` - Before/after comparison slider
- `showGenerationsRail` - Thumbnail rail of generated images

### Menu & Actions
- `showBurgerMenu` - Burger menu with actions
- `showHelpButton` - Help/info button
- `showDownloadButton` - Download image button
- `showSaveToProjectButton` - Save to project button
- `showComparisonDrawer` - Slide-out comparison drawer

### Debug & Testing
- `showTestModeToggle` - Mock generation toggle
- `showDebugLogPanel` - Generation timing logs
- `showAdminAnchors` - Admin debug labels

## Benefits of This Approach

✅ **Zero code changes** - Just pass different props  
✅ **Type-safe** - TypeScript ensures valid feature names  
✅ **Flexible** - Mix and match features freely  
✅ **Presets included** - Use MINIMAL, PRODUCTION, DEVELOPMENT presets  
✅ **Easy testing** - Toggle features to test different UIs  
✅ **Clean separation** - Logic unchanged, only UI affected  

## Example: A/B Testing

```tsx
const isVariantA = Math.random() < 0.5;

<TryOnResult
  {...otherProps}
  features={{
    showFabricTilingButton: isVariantA,
    showMaskCheckbox: !isVariantA,
  }}
/>
```

## Example: User Role Based

```tsx
const features = user.role === 'admin' 
  ? DEVELOPMENT_FEATURES 
  : PRODUCTION_FEATURES;

<TryOnResult {...otherProps} features={features} />
```

That's it! The separated architecture makes feature toggling trivial. 🎉
