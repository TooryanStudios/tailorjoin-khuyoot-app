# TryOn vs DesignerV2_1 Architecture Guide

**Last Updated:** February 13, 2026  
**Purpose:** Maintain complete separation between TryOn and DesignerV2_1 systems

---

## 🚨 Critical Architecture Decision

**TryOn and DesignerV2_1 are COMPLETELY SEPARATE systems and must remain independent.**

### 🎯 Core Principle

**NEVER touch DesignerV2_1 files when working on TryOn features.**

---

## 📂 File Ownership

### TryOn System Files (✅ Edit These for TryOn)
**Location:** `src/pages/TryOn/` and `src/components/TryOn/`

- `src/components/TryOn/UpgradeModal.tsx` ← **TryOn's upgrade modal**
- `src/pages/TryOn/index.tsx`
- `src/pages/TryOn/hooks/useDesignerLogic.tsx`
- `src/pages/TryOn/sections/refactored/*`
- `src/pages/TryOn/components/*`

**Rule:** When working on TryOn features, ONLY edit files in these directories.

### DesignerV2_1 System Files (❌ DO NOT TOUCH)
**Location:** `src/pages/DesignerV2_1/` and `src/components/DesignerV2_1/`

- `src/components/DesignerV2_1/UpgradeModal.tsx` ← **DesignerV2_1's upgrade modal**
- `src/pages/DesignerV2_1/*`
- All other DesignerV2_1 components

**Rule:** NEVER edit these files when working on TryOn, even if they seem related.

---

## 📋 Quick Decision Guide

### "I'm working on TryOn page - which files do I edit?"

**Answer:** ✅ ONLY edit files in:
- `src/pages/TryOn/**`
- `src/components/TryOn/**`

**Upgrade Modal for TryOn:** `src/components/TryOn/UpgradeModal.tsx`

### "I need to change the upgrade modal in TryOn"

**Answer:** ✅ Edit `src/components/TryOn/UpgradeModal.tsx`

**DO NOT** edit `src/components/DesignerV2_1/UpgradeModal.tsx`

### "Can I share components between TryOn and DesignerV2_1?"

**Answer:** ❌ No - maintain complete separation

**Reason:** Different features, different requirements, different evolution paths

---

## 🏗️ Current Architecture Status

### ⚠️ Important Migration Note

**Current State (February 2026):**
- App.tsx currently renders a global UpgradeModal from DesignerV2_1
- This was causing confusion when editing TryOn features
- **Solution:** TryOn needs to render its own modal independently

### Proper TryOn Architecture

```
src/pages/TryOn/
├── index.tsx                          Main TryOn page
│   └── Should import and render its own UpgradeModal
│
├── hooks/
│   └── useDesignerLogic.tsx          TryOn business logic
│
├── components/
│   └── (TryOn-specific components)
│
└── sections/refactored/
    └── (TryOn UI sections)

src/components/TryOn/
└── UpgradeModal.tsx                   ✅ TryOn's upgrade modal
    └── Import this in TryOn/index.tsx
```

### How TryOn Should Use Its Modal

**File:** `src/pages/TryOn/index.tsx`

```typescript
import { UpgradeModal } from '../../components/TryOn/UpgradeModal';

export const TryOn: React.FC = () => {
  // ... other code
  
  return (
    <>
      {/* TryOn UI */}
      
      {/* TryOn's own upgrade modal */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onUpgradeClick={handleUpgrade}
      />
    </>
  );
};
```

**DO NOT rely on App.tsx global modal for TryOn features.**

---

## 📝 Editing Guidelines for TryOn

### Before Making Changes

1. ✅ Confirm file is in `src/pages/TryOn/**` or `src/components/TryOn/**`
2. ✅ Check file path does NOT contain `DesignerV2_1`
3. ✅ Verify you're in the TryOn directory structure

### Common TryOn Changes

#### 1. Update TryOn Upgrade Modal Colors

**File:** `src/components/TryOn/UpgradeModal.tsx` ✅

```typescript
// Use theme classes
className="text-theme-primary"
className="bg-theme-primary"
className="border-theme-primary"
```

#### 2. Update TryOn Features

**File:** `src/pages/TryOn/index.tsx` or `src/pages/TryOn/components/*` ✅

#### 3. Update TryOn Business Logic

**File:** `src/pages/TryOn/hooks/useDesignerLogic.tsx` ✅

### Tailwind Configuration (Shared)

Theme colors are defined in `index.html` (shared by both systems):

```javascript
theme: {
  extend: {
    colors: {
      theme: {
        primary: '#63498b',    // Main purple
        secondary: '#b5e58d',  // Green accent
        master: '#63498b',
        surface: '#c2b7d3'
      }
    }
  }
}
```

---

## 📝 Editing Guidelines

### Before Making Changes

1. ✅ Confirm you're editing: `src/components/DesignerV2_1/UpgradeModal.tsx`
2. ✅ Check file path in VS Code title bar
3. ✅ Verify file location before running tools

### Common Changes

#### 1. Update Colors/Theme

**File:** `src/components/DesignerV2_1/UpgradeModal.tsx`

Current theme classes:
- `text-theme-primary` (purple #63498b)
- `bg-theme-primary`
- `border-theme-primary`
- `from-theme-primary to-[#7a5fa3]` (gradient)

#### 2. Update Features List

**File:** `src/components/DesignerV2_1/UpgradeModal.tsx`

Current layout: `grid grid-cols-2 gap-3` (two columns)

Features with strikethrough: Last two features have `line-through opacity-60`

#### 3. Update Pricing Packages

**File:** `src/components/DesignerV2_1/UpgradeModal.tsx`

Package data comes from: `src/modules/CreditManager/purchaseTypes.ts`

#### 4. Update Modal Behavior

**File:** `src/components/DesignerV2_1/UpgradeModal.tsx`

State management: Uses `useModalStore` hook

### Tailwind Configuration

Theme colors are defined in `index.html`:

```javascript
theme: {
  extend: {
    colors: {
      theme: {
        primary: '#63498b',    // Main purple
        secondary: '#b5e58d',  // Green accent
        master: '#63498b',
        surface: '#c2b7d3'
      }
    }
  }
}
```

---

## 🔍 Verification Steps

### After Making Changes

1. **Visual Verification:**
   - Open TryOn page in browser
   - Click any "Upgrade" or credits-related button
   - Verify changes appear in the modal

2. **File Verification:**
   ```bash
   # Check which file you edited
   git status
   
   # Should show: src/components/DesignerV2_1/UpgradeModal.tsx
   # Should NOT show: src/components/TryOn/UpgradeModal.tsx
   ```

3. **Build Verification:**
   ```bash
   npm run build
   # Ensure no errors
   ```

---

## 🗺️ File Reference Map

### TryOn System Files

```
src/
├── pages/
│   └── TryOn/
│       ├── index.tsx                 ✅ Main TryOn page
│       ├── hooks/
│       │   └── useDesignerLogic.tsx  ✅ TryOn logic
│       ├── components/               ✅ TryOn-specific components
│       └── sections/refactored/      ✅ TryOn UI sections
│
└── components/
    └── TryOn/
        └── UpgradeModal.tsx          ✅ TryOn's upgrade modal
```

### DesignerV2_1 System Files (DO NOT TOUCH)

```
src/
├── pages/
│   └── DesignerV2_1/
│       ├── DesignerV2_1.tsx          ❌ Don't touch
│       ├── components/               ❌ Don't touch
│       └── sections/                 ❌ Don't touch
│
└── components/
    └── DesignerV2_1/
        └── UpgradeModal.tsx          ❌ Don't touch (DesignerV2_1's modal)
```

### Shared Resources (Edit with Caution)

```
src/
├── store/
│   └── useModalStore.ts              ⚠️ Shared state (both systems)
│
├── modules/
│   └── CreditManager/
│       └── purchaseTypes.ts          ⚠️ Shared package definitions
│
App.tsx                               ⚠️ Root app (both systems)
index.html                            ⚠️ Shared config (Tailwind theme)
```

---

## 🎯 Common Mistakes to Avoid

### ❌ Mistake #1: Editing DesignerV2_1 Files for TryOn
**Problem:** Breaking the separation principle, causing maintenance nightmares

**Solution:** Always stay in `src/pages/TryOn/**` and `src/components/TryOn/**`

### ❌ Mistake #2: Using Hardcoded Colors
**Problem:** Inconsistent theming across the app

**Solution:** Use Tailwind theme classes:
- `text-theme-primary` instead of `text-purple-600` or `text-[#63498b]`
- `bg-theme-primary` instead of `bg-purple-600` or `bg-[#63498b]`

### ❌ Mistake #3: Assuming Global Modal Will Work
**Problem:** TryOn relying on DesignerV2_1's global modal

**Solution:** TryOn should render its own `UpgradeModal` component locally

### ❌ Mistake #4: Sharing Components Between Systems
**Problem:** Creates coupling between independent systems

**Solution:** Duplicate components if needed - maintain separation

---

## 🔧 Troubleshooting

### "I made changes to TryOn upgrade modal but don't see them"

**Check #1: Are you editing the right file?**
- ✅ Should be: `src/components/TryOn/UpgradeModal.tsx`
- ❌ Not: `src/components/DesignerV2_1/UpgradeModal.tsx`

**Check #2: Is TryOn rendering its own modal?**
- Open `src/pages/TryOn/index.tsx`
- Verify it imports and renders `UpgradeModal` from `../../components/TryOn/UpgradeModal`
- Should NOT rely on App.tsx global modal

**Check #3: Clear cache**
```bash
# Hard reload in browser
Ctrl + Shift + R
```

### "How do I make TryOn use its own modal?"

**Step 1:** Ensure `src/components/TryOn/UpgradeModal.tsx` has all needed features

**Step 2:** Import it in TryOn page
```typescript
// src/pages/TryOn/index.tsx
import { UpgradeModal } from '../../components/TryOn/UpgradeModal';
```

**Step 3:** Render it locally (not globally from App.tsx)
```typescript
return (
  <div className="tryon-container">
    {/* TryOn UI */}
    
    {/* TryOn's own modal */}
    <UpgradeModal 
      isOpen={isUpgradeModalOpen}
      onClose={() => setIsUpgradeModalOpen(false)}
    />
  </div>
);
```

---

## 📚 Related Documentation

- **UI Flickering Fix:** See `AGENTS.md` for React re-render optimization
- **Credit System:** See `CREDIT_PURCHASE_FIX.md` for payment flow
- **Theme Configuration:** See `index.html` for Tailwind setup

---

## ✅ Checklist for TryOn Changes

### Before Making Changes:
- [ ] File path starts with `src/pages/TryOn/` or `src/components/TryOn/`
- [ ] File path does NOT contain `DesignerV2_1`
- [ ] Understood separation principle: TryOn ≠ DesignerV2_1
- [ ] Using theme classes (not hardcoded colors)

### For TryOn Upgrade Modal Changes:
- [ ] Editing: `src/components/TryOn/UpgradeModal.tsx`
- [ ] NOT editing: `src/components/DesignerV2_1/UpgradeModal.tsx`
- [ ] TryOn page imports its own modal component
- [ ] Modal renders locally in TryOn (not from App.tsx)

### After Making Changes:
- [ ] Verified file path is in TryOn directory
- [ ] Tested on TryOn page specifically
- [ ] Did NOT touch any DesignerV2_1 files
- [ ] Run `npm run build` successfully
- [ ] Only committed TryOn files

---

## 🚀 Migration Path (If Needed)

### Current Problem
TryOn might be using the global UpgradeModal from App.tsx (DesignerV2_1 version)

### Solution Steps

**Step 1:** Apply all TryOn changes to `src/components/TryOn/UpgradeModal.tsx`
- Colors using theme classes
- Two-column layout
- Strikethrough features
- All TryOn-specific requirements

**Step 2:** Make TryOn render its own modal

```typescript
// src/pages/TryOn/index.tsx
import { UpgradeModal } from '../../components/TryOn/UpgradeModal';

export const TryOn: React.FC = () => {
  const logic = useDesignerLogic();
  
  return (
    <>
      <div className="tryon-main">
        {/* All TryOn UI */}
      </div>
      
      {/* TryOn's own upgrade modal */}
      <UpgradeModal
        isOpen={logic.isUpgradeModalOpen}
        onClose={() => logic.setIsUpgradeModalOpen(false)}
        onUpgradeClick={logic.handleUpgrade}
      />
    </>
  );
};
```

**Step 3:** Test TryOn independently
- TryOn modal should show TryOn-specific styles
- DesignerV2_1 modal remains unchanged
- Complete separation achieved

---

## 📚 Related Documentation

- **UI Optimization:** See `AGENTS.md` for React performance best practices
- **Credit System:** See `CREDIT_PURCHASE_FIX.md` for payment flow
- **Theme Configuration:** See `index.html` for Tailwind setup
- **TryOn Structure:** See `src/pages/TryOn/README.md` (if exists)

---

## 🎓 Key Principles Summary

### 1. Separation of Concerns
- **TryOn** = Modern virtual try-on experience
- **DesignerV2_1** = Legacy designer system
- **Never mix them**

### 2. File Ownership
- TryOn files → Edit freely for TryOn features
- DesignerV2_1 files → Never touch when working on TryOn
- Shared files → Edit with extreme caution, coordinate changes

### 3. Component Independence
- Each system has its own components
- Each system has its own modals
- Each system has its own logic
- Duplication > Coupling

### 4. When In Doubt
- ✅ Stay in `src/pages/TryOn/**` and `src/components/TryOn/**`
- ✅ Create TryOn-specific versions of components
- ✅ Maintain clear boundaries
- ❌ Don't "borrow" from DesignerV2_1
- ❌ Don't create shared dependencies

---

**Final Rule:** If you're working on TryOn, you should NEVER see `DesignerV2_1` in any file path you're editing. Period.
