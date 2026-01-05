# Designer Page Structure Overview

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────┐
│ DesignerV2.tsx (Main Page Container)                                   │
│ - State Management (templates, fabrics, selections, generations, etc.)  │
│ - Event Handlers (generate, save, modal controls)                       │
└─────────────────────────────────────────────────────────────────────────┘
        │
        ├── [Admin Only] FeatureToggleBar (Fixed Left Sidebar)
        │   └── Control toggles for all UI sections
        │
        ├── Main Layout Container
        │   │
        │   └── CanvasPanel (Center/Main Content Area)
        │       │
        │       └── TryOnSection
        │           │
        │           ├── TryFabricPanel (Try-On Core Component)
        │           │   │
        │           │   ├── Template & Fabric Selection Cards
        │           │   │   ├── TemplateSelectCard (Choose garment template)
        │           │   │   └── FabricSelectCard (Choose fabric pattern)
        │           │   │
        │           │   ├── TryOnResultSection
        │           │   │   └── TryOnResult (Main Try-On Interface)
        │           │   │       │
        │           │   │       ├── ControlsPanel (LEFT SIDE)
        │           │   │       │   ├── Preview Section (معاينة القالب والقماش)
        │           │   │       │   │   ├── Template Preview Button
        │           │   │       │   │   ├── Fabric Preview Button
        │           │   │       │   │   └── Fabric Tiling Button
        │           │   │       │   ├── Generate Button (ابدأ التجربة)
        │           │   │       │   └── Mask Checkbox (تفعيل القناع)
        │           │   │       │
        │           │   │       ├── ComparisonPanel (RIGHT SIDE)
        │           │   │       │   ├── Action Buttons Header
        │           │   │       │   │   ├── Burger Menu (قائمة)
        │           │   │       │   │   │   ├── View Comparison Drawer
        │           │   │       │   │   │   ├── Download Image
        │           │   │       │   │   │   └── Save to Project
        │           │   │       │   │   └── Help Button (مساعدة)
        │           │   │       │   │
        │           │   │       │   ├── ImageComparisonSlider
        │           │   │       │   │   ├── Before Image (القماش)
        │           │   │       │   │   └── After Image (النتيجة)
        │           │   │       │   │
        │           │   │       │   └── Generations Rail (إبداعاتي)
        │           │   │       │       └── Thumbnail grid of results
        │           │   │       │
        │           │   │       └── Comparison Drawer (Portal/Modal)
        │           │   │           └── Full-screen comparison view
        │           │   │
        │           │   └── Modals
        │           │       ├── TryOnTemplatePickerModal
        │           │       ├── TryOnFabricPickerModal
        │           │       ├── FabricImageLibraryModal
        │           │       └── FabricTilingModal
        │           │
        │           └── Top Generations Rail (Mobile Version)
        │               └── Horizontal scrollable rail
        │
        └── ModalsSection (All Page-Level Modals)
            ├── Start Modal (Welcome screen)
            ├── Design Options Modal (Neck, Sleeve, Embroidery)
            ├── Fabric Selection Modals (Khuyoot & Shops)
            ├── Image Library Picker
            ├── My Designs Modal
            └── Fabric Scale/Tiling Modal
```

---

## Detailed Breakdown

### 1. **DesignerV2.tsx** (Root Component)
**Location:** `pages/DesignerV2.tsx`

**Purpose:** Main orchestrator for the entire designer experience

**Key Responsibilities:**
- Manages all state (templates, fabrics, selections, generations)
- Handles user flow (steps 1-3: template → fabric → generate)
- Coordinates modals and overlays
- Integrates with Firebase services
- Manages localStorage persistence

**Key State:**
```typescript
- selectedTemplate: string
- fabricImage: string | null
- selections: Record<string, DesignOption | null>
- generations: GenerationItem[]
- features: TryOnResultFeatures (for UI toggles)
```

---

### 2. **FeatureToggleBar** (Admin Control Panel)
**Location:** `pages/designerV2/components/FeatureToggleBar.tsx`

**Purpose:** Admin-only sidebar for toggling UI sections

**Features:**
- Fixed left sidebar (12px collapsed, 288px expanded)
- 15+ toggleable UI elements
- Grouped by category
- Quick actions (Enable All, Disable All, Reset)
- Only visible to `role === 'admin'` users

**Categories:**
1. Full Sections
2. Controls Panel
3. Comparison Panel
4. Menu & Actions
5. Debug & Testing

---

### 3. **CanvasPanel** (Main Content Container)
**Location:** `pages/designerV2/components/CanvasPanel.tsx`

**Purpose:** Visual container with gradient background

**Features:**
- Gradient background overlay
- Dot pattern backdrop
- Admin anchor labels support
- Responsive layout

---

### 4. **TryOnSection** (Try-On Orchestrator)
**Location:** `pages/designerV2/sections/TryOnSection.tsx`

**Purpose:** Wrapper that coordinates TryFabricPanel and top-level generations

**Components:**
- **TryFabricPanel** (Main try-on interface)
- **Top Generations Rail** (Mobile horizontal scroll)
- **Admin metadata** (Last job ID display)

**Props Flow:**
- Receives features from DesignerV2
- Passes features to TryFabricPanel
- Controls top generations rail visibility

---

### 5. **TryFabricPanel** (Try-On Core)
**Location:** `src/designer/components/TryFabricPanel.tsx`

**Purpose:** Manages the complete try-on experience

**Key Features:**
- Template selection and upload
- Fabric selection and upload
- Recent templates cache
- Try-on generation logic
- Integration with try-on API

**Sub-components:**
- **TemplateSelectCard** - Choose/upload garment template
- **FabricSelectCard** - Choose/upload fabric pattern
- **TryOnResultSection** - Displays try-on result interface

---

### 6. **TryOnResult** (Main Try-On UI)
**Location:** `src/designer/components/TryOnResult.tsx`

**Purpose:** Displays the try-on interface with before/after comparison

**Architecture:**
- Uses `useTryOnResultLogic` hook for business logic (429 lines)
- Pure UI component (237 lines)
- Composed of two main panels

**Layout:**
```
┌──────────────────────────────────────────┐
│  ControlsPanel  │  ComparisonPanel       │
│   (LEFT)        │    (RIGHT)             │
│                 │                        │
│  - Template     │  - Burger Menu         │
│  - Fabric       │  - Help Button         │
│  - Generate     │  - Comparison Slider   │
│                 │  - Generations Rail    │
└──────────────────────────────────────────┘
```

---

### 7. **ControlsPanel** (Left Sidebar)
**Location:** `src/designer/components/tryOnResult/ControlsPanel.tsx`

**Purpose:** Template/fabric preview and generation controls

**Sections:**

#### Preview Section (معاينة القالب والقماش)
- **Template Preview Button**
  - Shows current garment template
  - Click to open template picker
  - Toggle: `showTemplatePreview`

- **Fabric Preview Button**
  - Shows current fabric pattern
  - Click to open fabric picker
  - Toggle: `showFabricPreview`

- **Fabric Tiling Button**
  - Adjust fabric scale/rotation/offset
  - Opens tiling modal
  - Toggle: `showFabricTilingButton`

#### Generation Controls
- **Generate Button (ابدأ التجربة)**
  - Primary CTA for starting try-on
  - Shows progress bar during generation
  - Toggle: `showGenerateButton`

- **Mask Checkbox (تفعيل القناع)**
  - Option to protect background
  - Toggle: `showMaskCheckbox`

**Feature Flags:**
- Entire section: `showPreviewSection`
- Individual elements: Each has its own toggle

---

### 8. **ComparisonPanel** (Right Side)
**Location:** `src/designer/components/tryOnResult/ComparisonPanel.tsx`

**Purpose:** Display results, comparisons, and actions

**Sections:**

#### Action Buttons Header
- **Burger Menu (القائمة)**
  - Dropdown with 3 options:
    - View Comparison Drawer
    - Download Image
    - Save to Project
  - Toggle: `showBurgerMenu`
  - Sub-toggles: `showComparisonDrawer`, `showDownloadButton`, `showSaveToProjectButton`

- **Help Button (مساعدة)**
  - Opens help/tutorial
  - Toggle: `showHelpButton`

#### Comparison Slider
- **ImageComparisonSlider**
  - Before: Original template with fabric
  - After: Try-on result
  - Draggable slider for comparison
  - Toggle: `showComparisonSlider`

#### Generations Rail (إبداعاتي)
- **Desktop Version**
  - Grid of generation thumbnails
  - Click to view/set as before/after
  - Shows generation metadata on hover
  - Toggle: `showGenerationsRail`

---

### 9. **Top Generations Rail** (Mobile)
**Location:** Rendered in `TryOnSection.tsx`

**Purpose:** Mobile-optimized horizontal scroll

**Features:**
- Horizontal scrollable rail
- Same functionality as desktop version
- Optimized for touch
- Toggle: `showTopGenerationsRail`

---

### 10. **Comparison Drawer** (Portal)
**Location:** Rendered in `TryOnResult.tsx` via React Portal

**Purpose:** Full-screen comparison view

**Features:**
- Slides in from right
- Full-screen comparison slider
- Backdrop blur overlay
- Close on backdrop click
- Toggle: `showComparisonDrawer`

---

### 11. **ModalsSection** (All Modals)
**Location:** `pages/designerV2/sections/ModalsSection.tsx`

**Purpose:** Consolidated modal management

**Modals:**
1. **Start Modal** - Welcome screen with options
2. **Design Options Modal** - Neck, sleeve, embroidery choices
3. **Fabric Modals** - Khuyoot library & shops
4. **Image Library Picker** - Template image selection
5. **My Designs Modal** - Load saved designs
6. **Fabric Scale Modal** - Adjust fabric tiling

---

## Data Flow

### 1. **Feature Toggles Flow**
```
DesignerV2 (features state)
    ↓
FeatureToggleBar (controls)
    ↓
TryOnSection (passes features)
    ↓
TryFabricPanel (forwards features)
    ↓
TryOnResultSection (forwards features)
    ↓
TryOnResult (merges with defaults)
    ↓ ↓
ControlsPanel & ComparisonPanel (conditional rendering)
```

### 2. **Try-On Generation Flow**
```
User clicks "ابدأ التجربة" in ControlsPanel
    ↓
TryOnResult.handleRetry()
    ↓
TryFabricPanel.generate()
    ↓
API call to /api/tryon
    ↓
onGenerated callback
    ↓
DesignerV2.upsertGeneration()
    ↓
Updates generations state
    ↓
Displays in GenerationsRail
```

### 3. **State Management**
```
DesignerV2 (source of truth)
    ├── Template state → TryFabricPanel
    ├── Fabric state → TryFabricPanel
    ├── Generations → ComparisonPanel
    ├── Features → All components
    └── Modal state → ModalsSection
```

---

## Key Files Reference

| Component | File Path | Lines | Purpose |
|-----------|-----------|-------|---------|
| DesignerV2 | `pages/DesignerV2.tsx` | 1548 | Main page |
| FeatureToggleBar | `pages/designerV2/components/FeatureToggleBar.tsx` | 165 | Admin controls |
| TryOnSection | `pages/designerV2/sections/TryOnSection.tsx` | 175 | Try-on wrapper |
| TryFabricPanel | `src/designer/components/TryFabricPanel.tsx` | 858 | Try-on core |
| TryOnResult | `src/designer/components/TryOnResult.tsx` | 237 | Try-on UI |
| ControlsPanel | `src/designer/components/tryOnResult/ControlsPanel.tsx` | 188 | Left controls |
| ComparisonPanel | `src/designer/components/tryOnResult/ComparisonPanel.tsx` | 154 | Right comparison |
| useTryOnResultLogic | `src/designer/components/tryOnResult/useTryOnResultLogic.ts` | 429 | Business logic |
| TryOnResultFeatures | `src/designer/components/tryOnResult/TryOnResultFeatures.ts` | 120 | Feature flags |
| ModalsSection | `pages/designerV2/sections/ModalsSection.tsx` | 334 | All modals |

---

## Feature Flag Categories

### الأقسام الكاملة (Full Sections)
- `showPreviewSection` - Entire template & fabric preview section

### لوحة التحكم (Controls Panel)
- `showTemplatePreview` - Template preview button
- `showFabricPreview` - Fabric preview button
- `showFabricTilingButton` - Fabric tiling adjustment button
- `showGenerateButton` - Main generate CTA
- `showMaskCheckbox` - Background protection option

### لوحة المقارنة (Comparison Panel)
- `showComparisonSlider` - Before/after slider
- `showGenerationsRail` - Generations grid (desktop)
- `showTopGenerationsRail` - Generations rail (mobile/top)

### القائمة والإجراءات (Menu & Actions)
- `showBurgerMenu` - Main menu dropdown
- `showHelpButton` - Help/tutorial button
- `showDownloadButton` - Download image option
- `showSaveToProjectButton` - Save to project option
- `showComparisonDrawer` - Full-screen comparison view

### التصحيح والاختبار (Debug & Testing)
- `showTestModeToggle` - Testing mode switch
- `showDebugLogPanel` - Debug logs panel
- `showAdminAnchors` - Admin anchor labels

---

## Responsive Behavior

### Desktop (lg+)
```
┌─────────────────────────────────────────────┐
│ [ControlsPanel]  [ComparisonPanel]          │
│    (Sticky)          (Main)                 │
│                                             │
│  Template/Fabric   Comparison Slider        │
│  Generate Btn      Generations Rail         │
└─────────────────────────────────────────────┘
```

### Mobile
```
┌─────────────────────┐
│  ControlsPanel      │
│  (Full width)       │
├─────────────────────┤
│  ComparisonPanel    │
│  (Below controls)   │
└─────────────────────┘
```

---

## User Flow

### Happy Path
1. User lands on designer page
2. (Optional) Sees start modal with welcome
3. Selects/uploads garment template
4. Selects/uploads fabric pattern
5. (Optional) Adjusts fabric tiling
6. Clicks "ابدأ التجربة" (Generate)
7. Waits for AI generation (progress bar)
8. Views result in comparison slider
9. Can download, save, or retry
10. Generation appears in "إبداعاتي" rail

### Admin Experience
1. Opens feature toggle sidebar (left)
2. Toggles UI sections on/off in real-time
3. Tests different configurations
4. Sees instant UI updates
5. Can reset to defaults anytime

---

## Best Practices

### Adding New UI Elements
1. Add to appropriate panel (ControlsPanel or ComparisonPanel)
2. Create feature flag in `TryOnResultFeatures.ts`
3. Add to `FeatureToggleBar` groups
4. Wrap element with conditional: `{features.showXXX && <Element />}`
5. Update all preset configurations

### Modifying Existing Sections
1. Check if feature flag exists
2. Update both component and feature flags if needed
3. Ensure type safety (TypeScript)
4. Test with toggle on/off

### State Management
- Keep state in DesignerV2 when shared across sections
- Use local state for UI-only concerns (menu open/close)
- Use custom hooks for complex logic (useTryOnResultLogic)

---

## Architecture Benefits

✅ **Separation of Concerns**
- Logic separated from UI (custom hooks)
- Each component has single responsibility
- Feature flags isolated in dedicated files

✅ **Reusability**
- ControlsPanel, ComparisonPanel are independent
- Can be used in different contexts
- Feature flags enable A/B testing

✅ **Maintainability**
- Clear component hierarchy
- Type-safe with TypeScript
- Well-documented structure

✅ **Flexibility**
- Admin can toggle any UI element
- Easy to add/remove features
- No code changes needed for UI tests

---

## Related Documentation

- [FEATURE_FLAGS_GUIDE.md](./src/designer/components/tryOnResult/FEATURE_FLAGS_GUIDE.md) - Complete feature flags reference
- [FEATURE_TOGGLE_BAR.md](./FEATURE_TOGGLE_BAR.md) - Admin control panel guide
- [FeatureToggleExamples.tsx](./src/designer/examples/FeatureToggleExamples.tsx) - Code examples

---

Last Updated: December 28, 2025
