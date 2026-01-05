# Feature Toggle Control Bar

## Overview

A powerful UI control panel has been added to the Designer page that allows admins to toggle any UI element on/off in real-time. This is perfect for testing, A/B experiments, and customizing the interface for different users.

## Features

### 🎯 Real-Time UI Control
- Toggle any UI element on/off instantly
- Changes apply immediately without page reload
- Organized by category for easy navigation

### 🔐 Admin-Only Access
- Only visible to users with `role: 'admin'`
- Accessed via a settings button in the top-right corner
- Secure and non-intrusive

### 🎨 Categorized Controls
The toggle bar organizes features into logical groups:

#### لوحة التحكم (Controls Panel)
- Template preview
- Fabric preview
- Fabric tiling button
- Generate button
- Mask checkbox

#### لوحة المقارنة (Comparison Panel)
- Comparison slider
- Generations rail

#### القائمة والإجراءات (Menu & Actions)
- Burger menu
- Help button
- Download button
- Save to project button
- Comparison drawer

#### التصحيح والاختبار (Debug & Testing)
- Test mode toggle
- Debug log panel
- Admin anchors

### ⚡ Quick Actions
- **إظهار الكل (Show All)**: Enable all features
- **إخفاء الكل (Hide All)**: Disable all features
- **استعادة الافتراضي (Reset to Defaults)**: Restore default settings

## How to Use

### As an Admin User

1. **Open the Designer Page**: Navigate to `/designer`

2. **Click the Settings Button**: Look for the blue settings icon (⚙️) in the top-right corner

3. **Toggle Features**: 
   - Click any toggle to enable/disable that feature
   - Changes apply instantly
   - The interface updates in real-time

4. **Use Quick Actions**:
   - Click "إظهار الكل" to enable everything
   - Click "إخفاء الكل" to hide everything
   - Click "استعادة الافتراضي" to reset

5. **Close the Panel**: Click the X button or click outside the panel

### For Developers

The feature toggle system uses the existing architecture:

```tsx
// In DesignerV2.tsx
const [features, setFeatures] = useState<TryOnResultFeatures>(DEFAULT_FEATURES);

<FeatureToggleBar 
  features={features}
  onFeaturesChange={setFeatures}
  isAdminUser={isAdminUser}
/>

<TryOnSection 
  features={features}
  // ... other props
/>
```

The `features` state is passed down through the component hierarchy:
- `DesignerV2` → `TryOnSection` → `TryFabricPanel` → `TryOnResultSection` → `TryOnResult` → `ControlsPanel`

Each component can check feature flags and conditionally render:

```tsx
{features.showTemplatePreview && (
  <TemplatePreviewButton />
)}
```

## Technical Details

### Component Location
- **Component**: `pages/designerV2/components/FeatureToggleBar.tsx`
- **Integration**: `pages/DesignerV2.tsx`

### State Management
- Uses React `useState` for feature toggles
- Features passed as props through component tree
- Type-safe with `TryOnResultFeatures` interface

### Styling
- Responsive design (full-width on mobile, sidebar on desktop)
- Dark mode support
- Smooth animations and transitions
- Accessible toggle switches

### Available Feature Flags
See [FEATURE_FLAGS_GUIDE.md](./FEATURE_FLAGS_GUIDE.md) for the complete list of all 14 toggleable features.

## Use Cases

### 1. Testing New Features
Hide experimental features from regular users while testing with admin access.

### 2. A/B Testing
Compare different UI configurations by quickly toggling features on/off.

### 3. User Role Customization
Different users can have different feature sets based on their subscription level.

### 4. Debugging
Isolate issues by disabling specific UI elements to narrow down problems.

### 5. Performance Testing
Measure the impact of specific UI elements on page performance.

## Benefits

✅ **No Code Changes Required**: Toggle features without editing code  
✅ **Instant Feedback**: See changes immediately  
✅ **Safe Testing**: Admins can test without affecting users  
✅ **Clean UI**: Hidden when not needed  
✅ **Type-Safe**: Full TypeScript support  
✅ **Organized**: Features grouped by category  
✅ **Accessible**: Keyboard navigation support  

## Future Enhancements

Potential improvements:
- Save preferences to localStorage
- Create named presets (e.g., "Minimal", "Full", "Mobile")
- Add feature usage analytics
- Export/import configurations
- Per-user feature settings
- Feature toggle API for remote control

## Related Documentation

- [FEATURE_FLAGS_GUIDE.md](./FEATURE_FLAGS_GUIDE.md) - Complete feature flags reference
- [src/designer/examples/FeatureToggleExamples.tsx](./src/designer/examples/FeatureToggleExamples.tsx) - Code examples
- [TryOnResultFeatures.ts](./src/designer/components/tryOnResult/TryOnResultFeatures.ts) - Type definitions

## Support

For questions or issues:
1. Check existing documentation
2. Review code examples
3. Test with admin account
4. Check browser console for errors
