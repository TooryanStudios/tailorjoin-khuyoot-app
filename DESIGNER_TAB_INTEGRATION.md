# Designer Page Tab State Integration Guide

## Overview
This guide shows how to integrate `useTabState` into the Designer page to enable URL-driven tab switching.

## Current Structure
The Designer page currently has these main sections:
1. **Try-On Section** - Template and fabric selection
2. **Comparison Panel** - Before/after image slider
3. **Generations Rail** - Generated design history

## Integration Steps

### Step 1: Add Tab State Hook
In `pages/DesignerV2.tsx`, after imports:

```tsx
import { useTabState } from '../src/hooks/useTabState'

export const DesignerV2 = () => {
  // Add this hook call
  const { activeTab, setActiveTab } = useTabState({
    defaultTab: 'try-on',
    paramName: 'tab'
  })
  
  // ... rest of component code
}
```

**Result**: URLs will now look like:
- `/designer?tab=try-on`
- `/designer?tab=comparison`
- `/designer?tab=generations`

### Step 2: Create Tab Navigation Buttons
Add visible tab controls to the Designer page:

```tsx
// Inside the return statement of DesignerV2
<div className="flex gap-2 p-2 border-b border-slate-200 dark:border-slate-800">
  <button
    onClick={() => setActiveTab('try-on')}
    className={`px-4 py-2 rounded transition ${
      activeTab === 'try-on'
        ? 'bg-blue-500 text-white'
        : 'bg-slate-200 dark:bg-slate-800'
    }`}
  >
    Try On
  </button>
  
  <button
    onClick={() => setActiveTab('comparison')}
    className={`px-4 py-2 rounded transition ${
      activeTab === 'comparison'
        ? 'bg-blue-500 text-white'
        : 'bg-slate-200 dark:bg-slate-800'
    }`}
  >
    Comparison
  </button>
  
  <button
    onClick={() => setActiveTab('generations')}
    className={`px-4 py-2 rounded transition ${
      activeTab === 'generations'
        ? 'bg-blue-500 text-white'
        : 'bg-slate-200 dark:bg-slate-800'
    }`}
  >
    Generations
  </button>
</div>
```

### Step 3: Conditional Rendering Based on Tab
Replace the current layout with conditional rendering:

```tsx
// Instead of always showing all sections:
return (
  <div>
    {/* Tab Navigation */}
    <div className="flex gap-2 p-2 border-b">
      {/* Tab buttons from Step 2 */}
    </div>
    
    {/* Content based on active tab */}
    <div className="flex-1 overflow-auto">
      {activeTab === 'try-on' && (
        <TryOnSection {...props} />
      )}
      
      {activeTab === 'comparison' && (
        <ComparisonPanel {...props} />
      )}
      
      {activeTab === 'generations' && (
        <GenerationsRail {...props} />
      )}
    </div>
  </div>
)
```

### Step 4: Add Scroll Memory (Optional)
To preserve scroll position within each tab:

```tsx
import { useScrollMemory } from '../src/hooks/useScrollMemory'

export const DesignerV2 = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const { activeTab, setActiveTab } = useTabState({
    defaultTab: 'try-on'
  })
  
  // Remember scroll per tab
  useScrollMemory(containerRef)
  
  return (
    <div ref={containerRef} className="overflow-auto">
      {/* content */}
    </div>
  )
}
```

### Step 5: Add Focus Management (A11y)
For screen reader users:

```tsx
import { useFocusOnRouteChange } from '../src/hooks/useFocusOnRouteChange'

export const DesignerV2 = () => {
  // ... previous code
  
  // Focus main content when tab changes
  useFocusOnRouteChange('[role="main"]')
  
  return (
    <main role="main" tabIndex={-1} className="focus:outline-none">
      {/* content */}
    </main>
  )
}
```

## Testing the Integration

### 1. Verify URL State
```
✅ Click "Try On" tab → URL becomes /designer?tab=try-on
✅ Click "Comparison" tab → URL becomes /designer?tab=comparison
✅ Click "Generations" tab → URL becomes /designer?tab=generations
```

### 2. Test Back/Forward
```
✅ Click tab buttons to switch: try-on → comparison → generations
✅ Click browser back button 3 times
✅ URLs should revert: generations → comparison → try-on
```

### 3. Test URL Navigation
```
✅ Open /designer?tab=comparison in browser
✅ Page should load with comparison tab active
✅ Share URL with friend - they should see same tab
```

### 4. Test Responsiveness
```
✅ XS/SM mobile: Tabs should stack or hide
✅ MD+ desktop: Tabs visible, full-width layout
```

## Example: Full Implementation

Here's a minimal example showing how it all works together:

```tsx
// pages/DesignerV2.tsx

import React, { useRef } from 'react'
import { useTabState } from '../src/hooks/useTabState'
import { useScrollMemory } from '../src/hooks/useScrollMemory'
import { useFocusOnRouteChange } from '../src/hooks/useFocusOnRouteChange'

export const DesignerV2 = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Tab state management
  const { activeTab, setActiveTab } = useTabState({
    defaultTab: 'try-on'
  })
  
  // Scroll restoration
  useScrollMemory(containerRef)
  
  // Accessibility focus
  useFocusOnRouteChange('main')
  
  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-950">
      {/* Tab Navigation */}
      <nav className="flex gap-2 p-4 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('try-on')}
          className={`px-4 py-2 rounded ${
            activeTab === 'try-on'
              ? 'bg-blue-500 text-white'
              : 'bg-slate-200 dark:bg-slate-800'
          }`}
        >
          Try On
        </button>
        <button
          onClick={() => setActiveTab('comparison')}
          className={`px-4 py-2 rounded ${
            activeTab === 'comparison'
              ? 'bg-blue-500 text-white'
              : 'bg-slate-200 dark:bg-slate-800'
          }`}
        >
          Comparison
        </button>
        <button
          onClick={() => setActiveTab('generations')}
          className={`px-4 py-2 rounded ${
            activeTab === 'generations'
              ? 'bg-blue-500 text-white'
              : 'bg-slate-200 dark:bg-slate-800'
          }`}
        >
          Generations
        </button>
      </nav>
      
      {/* Content Area */}
      <main
        ref={containerRef}
        role="main"
        tabIndex={-1}
        className="flex-1 overflow-auto focus:outline-none"
      >
        {activeTab === 'try-on' && (
          <section>
            {/* Try On content */}
          </section>
        )}
        
        {activeTab === 'comparison' && (
          <section>
            {/* Comparison content */}
          </section>
        )}
        
        {activeTab === 'generations' && (
          <section>
            {/* Generations content */}
          </section>
        )}
      </main>
    </div>
  )
}

// Export with memo
export default React.memo(DesignerV2)
```

## Benefits of This Approach

### For Users
- ✅ **Shareable URLs**: Send `/designer?tab=comparison` to a friend
- ✅ **Back/Forward Works**: Browser history preserved
- ✅ **No Page Reload**: Instant tab switching
- ✅ **Bookmark Friendly**: Can save favorite tab state

### For Developers
- ✅ **URL-Driven State**: Single source of truth
- ✅ **Debugging Easy**: URL shows current state
- ✅ **Testing Simple**: Can test by changing URL
- ✅ **Scalable**: Works with nested tabs too

## Advanced: Nested Tabs

For nested tabs (e.g., Comparison has sub-tabs):

```tsx
const { activeTab, setActiveTab } = useTabState({
  defaultTab: 'try-on'
})

const { activeSubTab, setActiveSubTab } = useTabState({
  defaultTab: 'slider',
  paramName: 'subtab'
})

// URLs:
// /designer?tab=comparison&subtab=slider
// /designer?tab=comparison&subtab=generations
```

## Migration Timeline

1. **Day 1**: Implement basic tab state + buttons
2. **Day 2**: Test back/forward and URL navigation
3. **Day 3**: Add scroll memory + focus management
4. **Day 4**: Deploy to staging
5. **Day 5**: User testing and feedback
6. **Day 6**: Deploy to production

## Known Limitations

- ⚠️ Tab state resets on page refresh (URL is restored though)
- ⚠️ Can't mix mobile bottom nav with desktop top tabs easily
- ⚠️ Multiple tab groups require unique paramName

## Troubleshooting

### Tab state not showing in URL
```tsx
// Check that BrowserRouter is used (not HashRouter)
// And hooks are called at component level (not inside loops)
```

### URL changes but tab doesn't
```tsx
// Verify activeTab is used in rendering
// Check that setActiveTab is called correctly
```

### Back/forward doesn't work
```tsx
// Ensure BrowserRouter is enabled
// Check browser console for routing errors
// Verify useTabState hook is present
```

## Next Features

After tab state is working:
- [ ] Add loading indicators when switching tabs
- [ ] Add animations/transitions between tabs
- [ ] Persist tab state to localStorage (backup)
- [ ] Add tab switching keyboard shortcuts (⌘+1, ⌘+2, etc.)
- [ ] Add "Close tab" functionality
- [ ] Add "Open in new window" feature

---
**Ready to implement?** Start with Step 1, test after each step before moving to the next.

**Questions?** Check [SPA_ROUTING_IMPLEMENTATION.md](SPA_ROUTING_IMPLEMENTATION.md) for detailed API docs.
