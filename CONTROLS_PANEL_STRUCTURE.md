# Controls Panel Structure (Left Sidebar)

## Component Overview

**Location:** `src/designer/components/tryOnResult/ControlsPanel.tsx`  
**Lines:** 188  
**Purpose:** Left sidebar for template/fabric preview and generation controls

---

## Visual Structure

```
┌─────────────────────────────────────────┐
│  ControlsPanel (Left Sidebar)           │
│  lg:col-start-1 lg:row-start-1         │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Preview Section                   │  │
│  │ [showPreviewSection]              │  │
│  ├───────────────────────────────────┤  │
│  │                                   │  │
│  │  Header: "معاينة القالب والقماش"  │  │
│  │  (Template & Fabric Previews)     │  │
│  │                                   │  │
│  │  ┌─────────────┬────────────────┐ │  │
│  │  │  Template   │    Fabric      │ │  │
│  │  │   Preview   │    Preview     │ │  │
│  │  │   Button    │    Button      │ │  │
│  │  │             │                │ │  │
│  │  │  [Image]    │   [Image]      │ │  │
│  │  │             │                │ │  │
│  │  │  "Template" │   "Fabric"     │ │  │
│  │  │             │                │ │  │
│  │  │  [show      │   [show        │ │  │
│  │  │   Template  │    Fabric      │ │  │
│  │  │   Preview]  │    Preview]    │ │  │
│  │  └─────────────┴────────────────┘ │  │
│  │                                   │  │
│  │              Fabric Tiling Button │  │
│  │              [showFabricTiling    │  │
│  │               Button]             │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Generation Controls               │  │
│  │ [Always visible container]        │  │
│  ├───────────────────────────────────┤  │
│  │                                   │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │  Generate Button            │  │  │
│  │  │  [showGenerateButton]       │  │  │
│  │  │                             │  │  │
│  │  │  ┌───────────────────────┐  │  │  │
│  │  │  │  ⚡ ابدأ التجربة ✨  │  │  │  │
│  │  │  │  (Start Try-On)       │  │  │  │
│  │  │  │                       │  │  │  │
│  │  │  │  [Progress Bar]       │  │  │  │
│  │  │  │  جارٍ الإنشاء... 45% │  │  │  │
│  │  │  └───────────────────────┘  │  │  │
│  │  └─────────────────────────────┘  │  │
│  │                                   │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │  Mask Checkbox              │  │  │
│  │  │  [showMaskCheckbox]         │  │  │
│  │  │                             │  │  │
│  │  │  ☑ تفعيل القناع            │  │  │
│  │  │    (حماية الخلفية)          │  │  │
│  │  │    (Protect Background)     │  │  │
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

---

## Section-by-Section Breakdown

### 1. **Preview Section Container**
**CSS:** `rounded-2xl border bg-white dark:bg-slate-900 p-2 lg:sticky lg:bottom-3`  
**Feature Flag:** `features.showPreviewSection`  
**Visibility:** Entire section can be hidden with one toggle

```tsx
{features.showPreviewSection && (
  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 lg:sticky lg:bottom-3 space-y-1">
    {/* All preview content */}
  </div>
)}
```

#### 1.1 Section Header
**Text:** "معاينة القالب والقماش (Template & Fabric Previews)"  
**CSS:** `text-xs text-slate-500 dark:text-slate-400 px-2 pt-1`  
**Purpose:** Label for the preview section

#### 1.2 Preview Grid Container
**CSS:** `mx-auto w-full max-w-[300px]`  
**Layout:** `grid grid-cols-2 gap-2`  
**Purpose:** 2-column grid for template and fabric previews

---

### 2. **Template Preview Button**
**Feature Flag:** `features.showTemplatePreview`  
**Type:** Button (clickable)  
**Purpose:** Display and change garment template

**Structure:**
```tsx
{features.showTemplatePreview && (
  <button
    type="button"
    onClick={() => onOpenTemplatePicker?.()}
    disabled={!onOpenTemplatePicker}
    className="rounded-xl text-right transition-colors disabled:opacity-60"
  >
    <div className="relative w-full h-36 lg:h-[200px] overflow-hidden rounded-xl">
      {/* Badge */}
      <div className="absolute top-2 left-2 bg-blue-600 text-white text-[9px] px-2 py-1 rounded-full z-10">
        (Template)
      </div>
      
      {/* Image or Loading State */}
      {originalImageUrl ? (
        <>
          <img src={originalImageUrl} alt="القالب" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent" />
        </>
      ) : (
        <div className="absolute inset-0 animate-pulse bg-slate-200/70 dark:bg-slate-700/60" />
      )}
    </div>
  </button>
)}
```

**Elements:**
- **Badge:** Blue "Template" label (top-left)
- **Image:** Current template preview (`originalImageUrl`)
- **Gradient:** Bottom fade overlay for better readability
- **Loading State:** Animated pulse when no image
- **Interaction:** Click to open `onOpenTemplatePicker()`

**States:**
- ✅ Enabled: Clickable, shows template
- 🔒 Disabled: Grayed out when `!onOpenTemplatePicker`
- 📷 With Image: Shows actual template
- ⌛ Loading: Pulse animation

---

### 3. **Fabric Preview Column**
**Feature Flag:** `features.showFabricPreview`  
**Type:** Container with button + optional tiling button  
**Purpose:** Display fabric pattern and tiling controls

**Structure:**
```tsx
{features.showFabricPreview && (
  <div className="flex flex-col gap-1">
    {/* Fabric Preview Button */}
    {/* Fabric Tiling Button (conditional) */}
  </div>
)}
```

#### 3.1 Fabric Preview Button
**Type:** Button (clickable)  
**Purpose:** Display and change fabric pattern

```tsx
<button
  type="button"
  onClick={() => onOpenFabricPicker?.()}
  disabled={!onOpenFabricPicker}
  className="rounded-xl text-right transition-colors disabled:opacity-60"
>
  <div className="relative w-full h-28 lg:h-[156px] overflow-hidden rounded-xl">
    {/* Badge */}
    <div className="absolute top-2 left-2 bg-purple-600 text-white text-[9px] px-2 py-1 rounded-full z-10">
      (Fabric)
    </div>
    
    {/* Image or Loading State */}
    {fabricThumbnailUrl ? (
      <>
        <img src={fabricThumbnailUrl} alt="القماش" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/70 to-transparent" />
      </>
    ) : (
      <div className="absolute inset-0 animate-pulse bg-slate-200/70 dark:bg-slate-700/60" />
    )}
  </div>
</button>
```

**Elements:**
- **Badge:** Purple "Fabric" label (top-left)
- **Image:** Current fabric preview (`fabricThumbnailUrl`)
- **Gradient:** Bottom fade overlay
- **Loading State:** Animated pulse when no image
- **Interaction:** Click to open `onOpenFabricPicker()`

**States:**
- ✅ Enabled: Clickable, shows fabric
- 🔒 Disabled: Grayed out when `!onOpenFabricPicker`
- 🎨 With Image: Shows actual fabric pattern
- ⌛ Loading: Pulse animation

#### 3.2 Fabric Tiling Button
**Feature Flag:** `features.showFabricTilingButton`  
**Type:** Button (small, compact)  
**Purpose:** Adjust fabric scale, rotation, offset

```tsx
{features.showFabricTilingButton && (
  <button
    type="button"
    onClick={() => onOpenFabricTiling?.()}
    disabled={!onOpenFabricTiling}
    className="h-8 px-2 rounded-lg text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
  >
    تكرار القماش
  </button>
)}
```

**Text:** "تكرار القماش" (Fabric Tiling)  
**Style:** Small, subtle button below fabric preview  
**Interaction:** Opens fabric tiling modal

---

### 4. **Generation Controls Container**
**CSS:** `flex flex-col gap-2`  
**Feature Flag:** Individual flags for children  
**Purpose:** Main action controls for try-on generation

---

### 5. **Generate Button**
**Feature Flag:** `features.showGenerateButton`  
**Type:** Primary CTA button  
**Purpose:** Initiate try-on generation

**Structure:**
```tsx
{features.showGenerateButton && (
  <div className="flex flex-col gap-2">
    <button
      type="button"
      onClick={onRetry}
      disabled={(!testingMode && !onRetry) || effectiveLoading}
      className="w-full h-12 relative overflow-hidden rounded-xl bg-violet-600 text-white px-4 text-sm font-bold hover:bg-violet-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {/* Progress Bar Background */}
      {effectiveLoading && typeof effectiveProgress === 'number' && effectiveProgress > 0 && (
        <div className="absolute inset-0 bg-violet-500/30 transition-all duration-300 ease-out" style={{ width: `${effectiveProgress}%` }} />
      )}
      
      {/* Button Content */}
      <div className="relative z-10 flex items-center gap-2">
        {effectiveLoading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
            <span>جارٍ الإنشاء... {typeof effectiveProgress === 'number' ? `${Math.round(effectiveProgress)}%` : ''}</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
            </svg>
            <span>ابدأ التجربة ✨</span>
          </>
        )}
      </div>
    </button>
  </div>
)}
```

**States:**

#### Idle State (Not Generating)
- **Icon:** Play triangle ▶️
- **Text:** "ابدأ التجربة ✨" (Start Try-On)
- **Color:** Violet (bg-violet-600)
- **Hover:** Darker violet (bg-violet-700)
- **Click:** Calls `onRetry()` to start generation

#### Loading State (Generating)
- **Icon:** Spinning loader ⟳
- **Text:** "جارٍ الإنشاء... 45%" (Generating... 45%)
- **Progress Bar:** Animated width from 0% to 100%
- **Color:** Violet background with lighter overlay
- **Disabled:** Cannot click during generation

#### Disabled State
- **Condition:** `!onRetry` or no testing mode
- **Opacity:** 60%
- **Cursor:** not-allowed
- **No Interaction:** Cannot click

**Progress Tracking:**
- Uses `effectiveProgress` from logic hook
- Shows percentage if available
- Animated progress bar overlay
- Smooth transition (300ms ease-out)

---

### 6. **Mask Checkbox**
**Feature Flag:** `features.showMaskCheckbox`  
**Type:** Checkbox with label  
**Purpose:** Toggle background protection during try-on

**Structure:**
```tsx
{features.showMaskCheckbox && onApplyMaskChange && (
  <label className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
    <input
      type="checkbox"
      checked={applyMask}
      onChange={(e) => onApplyMaskChange(e.target.checked)}
      className="w-4 h-4 rounded border-slate-300 dark:border-slate-600"
    />
    <span className="text-xs text-slate-700 dark:text-slate-300">
      تفعيل القناع (حماية الخلفية)
    </span>
  </label>
)}
```

**Elements:**
- **Checkbox:** 16px × 16px, rounded
- **Label:** "تفعيل القناع (حماية الخلفية)" (Enable mask - Protect background)
- **Hover:** Light background on hover
- **Interaction:** Calls `onApplyMaskChange(checked)`

**States:**
- ☑️ Checked: Mask enabled, background protected
- ☐ Unchecked: No mask, full transformation
- 🔒 Hidden: When `!onApplyMaskChange` callback missing

**Conditional Rendering:**
- Requires both `features.showMaskCheckbox` AND `onApplyMaskChange`
- Hidden if callback not provided

---

## Props Interface

```typescript
interface ControlsPanelProps {
  // Image URLs
  originalImageUrl?: string;              // Template preview image
  fabricThumbnailUrl?: string | null;     // Fabric preview image
  
  // Callbacks
  onOpenTemplatePicker?: () => void;      // Open template selection modal
  onOpenFabricPicker?: () => void;        // Open fabric selection modal
  onOpenFabricTiling?: () => void;        // Open fabric tiling/scale modal
  onRetry: () => void;                    // Start/retry generation
  onApplyMaskChange?: (value: boolean) => void;  // Toggle mask option
  
  // State
  effectiveLoading: boolean;              // Is generation in progress?
  effectiveProgress?: number;             // Generation progress (0-100)
  applyMask?: boolean;                    // Is mask enabled?
  testingMode: boolean;                   // Allow generation without template/fabric
  
  // Feature Flags
  features: TryOnResultFeatures;          // UI toggles
}
```

---

## Feature Flag Dependencies

### Section-Level Toggle
```typescript
features.showPreviewSection: boolean
```
- **Controls:** Entire preview section (template + fabric + tiling)
- **When false:** Hides all previews, only shows generate button
- **Use case:** Minimal UI mode, focus on generation only

### Individual Element Toggles
```typescript
features.showTemplatePreview: boolean     // Template preview button
features.showFabricPreview: boolean       // Fabric preview button + column
features.showFabricTilingButton: boolean  // Tiling adjustment button
features.showGenerateButton: boolean      // Main generate CTA
features.showMaskCheckbox: boolean        // Mask protection option
```

### Toggle Hierarchy
```
showPreviewSection (parent)
  └── showTemplatePreview (child)
  └── showFabricPreview (child)
      └── showFabricTilingButton (grandchild)

showGenerateButton (independent)
showMaskCheckbox (independent)
```

**Logic:**
- If `showPreviewSection` is `false`, all children are hidden regardless of individual flags
- If `showPreviewSection` is `true`, individual flags control each element
- `showGenerateButton` and `showMaskCheckbox` are independent of preview section

---

## Styling & Layout

### Desktop (lg+)
- **Position:** `lg:col-start-1 lg:row-start-1`
- **Layout:** Sticky left sidebar
- **Preview Heights:** 
  - Template: 200px
  - Fabric: 156px
- **Sticky Positioning:** `lg:sticky lg:bottom-3` (sticks to bottom of viewport)

### Mobile (< lg)
- **Position:** Full width, above comparison panel
- **Preview Heights:**
  - Template: 144px (36 × 4)
  - Fabric: 112px (28 × 4)
- **Stacking:** Vertical flow

### Responsive Breakpoint
```css
/* Mobile */
.preview-section { }

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .preview-section {
    position: sticky;
    bottom: 0.75rem;
  }
}
```

---

## Color Scheme

### Light Mode
```css
Background: white
Border: slate-200
Text: slate-700
Hover: slate-50
Badge: blue-600 / purple-600
Button: violet-600
```

### Dark Mode
```css
Background: slate-900
Border: slate-700
Text: slate-300
Hover: slate-800
Badge: (same)
Button: violet-600
```

---

## Accessibility

### Keyboard Navigation
- All buttons are focusable
- Tab order: Template → Fabric → Tiling → Generate → Mask
- Enter/Space activates buttons

### ARIA Labels
```tsx
aria-label="اختيار القالب"    // Template button
aria-label="اختيار القماش"    // Fabric button
aria-label="تكرار القماش"     // Tiling button
```

### Screen Reader Support
- Label text is descriptive
- Disabled states are announced
- Loading states have text indicators

### Focus States
- All interactive elements have focus rings
- Consistent focus styling across theme modes

---

## User Interactions

### 1. Change Template
```
User clicks Template Preview Button
    ↓
onOpenTemplatePicker() called
    ↓
TryOnTemplatePickerModal opens
    ↓
User selects new template
    ↓
Modal closes, preview updates
```

### 2. Change Fabric
```
User clicks Fabric Preview Button
    ↓
onOpenFabricPicker() called
    ↓
TryOnFabricPickerModal opens
    ↓
User selects new fabric
    ↓
Modal closes, preview updates
```

### 3. Adjust Fabric Tiling
```
User clicks "تكرار القماش" button
    ↓
onOpenFabricTiling() called
    ↓
FabricTilingModal opens
    ↓
User adjusts scale/rotation/offset
    ↓
Applies changes
    ↓
Preview updates with new settings
```

### 4. Generate Try-On
```
User clicks "ابدأ التجربة ✨"
    ↓
onRetry() called
    ↓
effectiveLoading = true
    ↓
Button shows spinner + progress
    ↓
API call to /api/tryon
    ↓
Progress updates (0% → 100%)
    ↓
Generation completes
    ↓
effectiveLoading = false
    ↓
Result displays in ComparisonPanel
```

### 5. Toggle Mask
```
User clicks checkbox
    ↓
onApplyMaskChange(checked) called
    ↓
applyMask state updates
    ↓
Next generation uses mask setting
```

---

## State Flow

### From Parent (TryOnResult)
```
TryOnResult
  ├── originalImageUrl (template)
  ├── fabricThumbnailUrl (fabric)
  ├── effectiveLoading (from hook)
  ├── effectiveProgress (from hook)
  ├── applyMask (from props)
  ├── onApplyMaskChange (from props)
  ├── onRetry (from hook.handleRetry)
  ├── testingMode (from hook)
  └── features (merged with defaults)
      ↓
  ControlsPanel
```

### To Parent (via Callbacks)
```
ControlsPanel
  ├── onOpenTemplatePicker()
  ├── onOpenFabricPicker()
  ├── onOpenFabricTiling()
  ├── onRetry() → handleRetry()
  └── onApplyMaskChange(value)
      ↓
  TryOnResult → TryFabricPanel → DesignerV2
```

---

## Performance Optimizations

### Image Loading
- Lazy loading with `loading="lazy"`
- Async decoding with `decoding="async"`
- Placeholder skeleton during load
- Object-fit cover for proper aspect ratio

### Re-render Prevention
- Features merged with useMemo
- Callbacks are stable (passed down from parent)
- No local state (stateless component)

### Sticky Positioning
- Uses CSS `position: sticky` instead of JS scroll listeners
- Better performance on scroll
- GPU-accelerated

---

## Common Patterns

### Conditional Rendering
```tsx
{features.showXXX && (
  <Element />
)}
```

### Conditional + Callback
```tsx
{features.showXXX && onCallback && (
  <Element onClick={onCallback} />
)}
```

### Nested Conditionals
```tsx
{features.showParent && (
  <Parent>
    {features.showChild && <Child />}
  </Parent>
)}
```

---

## Testing Considerations

### Unit Tests
- Test each feature flag independently
- Verify callbacks are called correctly
- Check disabled states
- Validate loading states

### Integration Tests
- Full generation flow
- Modal opening/closing
- Feature toggle interactions
- Responsive behavior

### Visual Regression
- Light/dark mode
- Desktop/mobile layouts
- Loading states
- Disabled states

---

## Common Issues & Solutions

### Issue: Preview images not loading
**Cause:** Invalid URLs or CORS issues  
**Solution:** Check URL validity, ensure CORS headers

### Issue: Generate button stuck in loading
**Cause:** `effectiveLoading` not resetting  
**Solution:** Check generation flow, ensure error handling resets state

### Issue: Mask checkbox not appearing
**Cause:** Missing `onApplyMaskChange` callback  
**Solution:** Verify callback is passed from parent component

### Issue: Sticky positioning not working
**Cause:** Parent container has `overflow: hidden`  
**Solution:** Check parent CSS, ensure no conflicting overflow

---

## Related Components

- **ComparisonPanel** - Right side (results, actions, generations)
- **TryOnResult** - Parent container
- **useTryOnResultLogic** - Business logic hook
- **TryOnResultFeatures** - Feature flag definitions

---

## Best Practices

### When Adding New Elements
1. Add to preview section OR generation controls
2. Create feature flag in `TryOnResultFeatures.ts`
3. Add to `FeatureToggleBar` groups
4. Wrap with conditional rendering
5. Update this documentation

### When Modifying Existing Elements
1. Check feature flag dependencies
2. Maintain backward compatibility
3. Test all feature combinations
4. Update documentation

### When Styling
1. Use Tailwind utility classes
2. Follow existing color scheme
3. Maintain dark mode support
4. Test responsive breakpoints

---

Last Updated: December 28, 2025
