# SPA Implementation - Code Snippets (Copy & Paste Ready)

## 1. Basic Tab State (Copy & Paste)

### Implementation in Your Component
```tsx
// pages/YourPage.tsx
import React from 'react'
import { useTabState } from '../src/hooks/useTabState'

export const YourPage = () => {
  // 👇 Add this one line
  const { activeTab, setActiveTab } = useTabState({
    defaultTab: 'overview'
  })
  
  return (
    <div>
      {/* Tab buttons */}
      <div className="flex gap-2 p-4 border-b">
        <button
          onClick={() => setActiveTab('overview')}
          className={activeTab === 'overview' ? 'font-bold' : ''}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('details')}
          className={activeTab === 'details' ? 'font-bold' : ''}
        >
          Details
        </button>
      </div>
      
      {/* Content based on tab */}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'details' && <DetailsTab />}
    </div>
  )
}
```

### URL Result
- First load: `/yourpage?tab=overview`
- Click Details: `/yourpage?tab=details`
- Share URL: Friend sees same tab
- Back button: Returns to previous tab

---

## 2. Designer Page with Tabs (Copy & Paste)

### Full Example
```tsx
// pages/DesignerV2.tsx
import React, { useRef } from 'react'
import { useTabState } from '../src/hooks/useTabState'
import { useScrollMemory } from '../src/hooks/useScrollMemory'
import { useFocusOnRouteChange } from '../src/hooks/useFocusOnRouteChange'

export const DesignerV2 = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  
  // 👇 Tab management
  const { activeTab, setActiveTab } = useTabState({
    defaultTab: 'try-on',
    paramName: 'tab'
  })
  
  // 👇 Scroll memory (optional)
  useScrollMemory(containerRef)
  
  // 👇 Accessibility (optional)
  useFocusOnRouteChange('main')
  
  return (
    <div className="flex flex-col h-screen">
      {/* Tab Navigation */}
      <nav className="flex gap-2 p-4 border-b border-slate-200">
        <TabButton
          label="Try On"
          active={activeTab === 'try-on'}
          onClick={() => setActiveTab('try-on')}
        />
        <TabButton
          label="Comparison"
          active={activeTab === 'comparison'}
          onClick={() => setActiveTab('comparison')}
        />
        <TabButton
          label="Generations"
          active={activeTab === 'generations'}
          onClick={() => setActiveTab('generations')}
        />
      </nav>
      
      {/* Content */}
      <main
        ref={containerRef}
        className="flex-1 overflow-auto"
        role="main"
      >
        {activeTab === 'try-on' && <TryOnSection />}
        {activeTab === 'comparison' && <ComparisonPanel />}
        {activeTab === 'generations' && <GenerationsRail />}
      </main>
    </div>
  )
}

// Helper button component
const TabButton = ({ label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded transition ${
      active
        ? 'bg-blue-500 text-white'
        : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300'
    }`}
  >
    {label}
  </button>
)

export default React.memo(DesignerV2)
```

---

## 3. Smart Navigation Link (Copy & Paste)

### In Your Header
```tsx
// src/client/components/Header.tsx
import React from 'react'
import { SmartLink } from '../../../components/SmartLink'

const Designer = React.lazy(() => import('../../../pages/DesignerV2'))

export const Header = () => {
  return (
    <header className="border-b p-4">
      <nav className="flex gap-4">
        {/* 👇 Regular links */}
        <a href="/" className="hover:underline">Home</a>
        
        {/* 👇 Smart link with preload */}
        <SmartLink
          to="/designer"
          preloadComponent={() => import('../../../pages/DesignerV2')}
          className="hover:underline hover:text-blue-500 transition"
        >
          Designer
        </SmartLink>
        
        <a href="/account" className="hover:underline">Account</a>
      </nav>
    </header>
  )
}
```

---

## 4. Scroll Memory for Lists (Copy & Paste)

### Long List with Scroll Restoration
```tsx
// pages/Products.tsx
import React, { useRef } from 'react'
import { useScrollMemory } from '../src/hooks/useScrollMemory'

export const Products = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  
  // 👇 Save and restore scroll position
  useScrollMemory(containerRef)
  
  return (
    <div
      ref={containerRef}
      className="h-screen overflow-auto"
    >
      {/* Long list of products */}
      <div className="grid grid-cols-3 gap-4 p-4">
        {Array.from({ length: 100 }).map((_, i) => (
          <div key={i} className="p-4 border rounded">
            Product {i + 1}
          </div>
        ))}
      </div>
    </div>
  )
}
```

### How it works
1. User scrolls down to product #50
2. Clicks a link to view details
3. Comes back to /products
4. Scroll position automatically restored to #50

---

## 5. Accessibility Focus Management (Copy & Paste)

### Make Screen Readers Happy
```tsx
// pages/AccessiblePage.tsx
import React from 'react'
import { useFocusOnRouteChange } from '../src/hooks/useFocusOnRouteChange'

export const AccessiblePage = () => {
  // 👇 Focus moves to main content when page loads
  useFocusOnRouteChange('main')
  
  return (
    <div>
      {/* 👇 Main content must have role="main" */}
      <main role="main" tabIndex={-1} className="focus:outline-none">
        <h1>Page Title</h1>
        
        <p>
          When you navigate here, focus automatically moves to this
          main content area, which is announced by screen readers.
        </p>
      </main>
    </div>
  )
}
```

---

## 6. Complete Designer with All Features (Copy & Paste)

### Production-Ready Implementation
```tsx
// pages/DesignerV2.tsx
import React, { useState, useRef } from 'react'
import { useTabState } from '../src/hooks/useTabState'
import { useScrollMemory } from '../src/hooks/useScrollMemory'
import { useFocusOnRouteChange } from '../src/hooks/useFocusOnRouteChange'
import { ControlsPanel } from '../src/designer/components/tryOnResult/ControlsPanel'
import { ComparisonPanel } from '../src/designer/components/tryOnResult/ComparisonPanel'
import { GenerationsRail } from '../pages/designerV2/components/GenerationsRail'

export const DesignerV2 = () => {
  const mainRef = useRef<HTMLDivElement>(null)
  
  // Tab state (URL: /designer?tab=try-on)
  const { activeTab, setActiveTab } = useTabState({
    defaultTab: 'try-on'
  })
  
  // Scroll restoration
  useScrollMemory(mainRef)
  
  // Accessibility
  useFocusOnRouteChange('main')
  
  // Local state (preserved across tabs)
  const [fabricImage, setFabricImage] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState('dishdasha')
  
  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-950">
      {/* Header with tabs */}
      <header className="border-b border-slate-200 dark:border-slate-800 p-4">
        <nav className="flex gap-2">
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
        </nav>
      </header>
      
      {/* Content */}
      <main
        ref={mainRef}
        role="main"
        tabIndex={-1}
        className="flex-1 overflow-auto focus:outline-none"
      >
        {activeTab === 'try-on' && (
          <section className="p-4">
            <ControlsPanel
              onOpenTemplatePicker={() => {}}
              onOpenFabricPicker={() => {}}
              effectiveLoading={false}
              onRetry={() => {}}
              testingMode={false}
              features={{}}
            />
          </section>
        )}
        
        {activeTab === 'comparison' && (
          <section className="p-4">
            <ComparisonPanel
              effectiveResultImageSrc={null}
              safeModalGenerations={[]}
              PLACEHOLDER_BEFORE=""
              PLACEHOLDER_AFTER=""
              effectiveLoading={false}
              features={{}}
              showDevUi={false}
            />
          </section>
        )}
        
        {activeTab === 'generations' && (
          <section className="p-4">
            <GenerationsRail
              generations={[]}
              onOpenImage={() => {}}
            />
          </section>
        )}
      </main>
    </div>
  )
}

export default React.memo(DesignerV2)
```

---

## 7. Form with Tab State (Copy & Paste)

### Multi-Step Form with URL
```tsx
// pages/Checkout.tsx
import React from 'react'
import { useTabState } from '../src/hooks/useTabState'

export const Checkout = () => {
  const { activeTab, setActiveTab } = useTabState({
    defaultTab: 'shipping'
  })
  
  const steps = ['shipping', 'payment', 'review'] as const
  const currentStepIndex = steps.indexOf(activeTab as any)
  
  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Step indicator */}
      <div className="flex gap-4 mb-8">
        {steps.map((step, i) => (
          <div
            key={step}
            className={`flex-1 py-2 text-center border-b-2 cursor-pointer ${
              step === activeTab
                ? 'border-blue-500 font-bold'
                : 'border-gray-200'
            }`}
            onClick={() => setActiveTab(step)}
          >
            {i + 1}. {step.charAt(0).toUpperCase() + step.slice(1)}
          </div>
        ))}
      </div>
      
      {/* Step content */}
      <div className="border rounded-lg p-6">
        {activeTab === 'shipping' && <ShippingForm />}
        {activeTab === 'payment' && <PaymentForm />}
        {activeTab === 'review' && <ReviewOrder />}
      </div>
      
      {/* Navigation buttons */}
      <div className="flex gap-4 mt-6">
        <button
          onClick={() => setActiveTab(steps[currentStepIndex - 1])}
          disabled={currentStepIndex === 0}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Back
        </button>
        
        <button
          onClick={() => setActiveTab(steps[currentStepIndex + 1])}
          disabled={currentStepIndex === steps.length - 1}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Next
        </button>
      </div>
    </div>
  )
}

const ShippingForm = () => <div>Shipping form content</div>
const PaymentForm = () => <div>Payment form content</div>
const ReviewOrder = () => <div>Review content</div>
```

### URL Examples
- `/checkout?tab=shipping` - First step
- `/checkout?tab=payment` - Second step  
- `/checkout?tab=review` - Third step
- Back button returns to previous URL step

---

## 8. Nested Tabs (Copy & Paste)

### Multiple Tab Groups
```tsx
// pages/Dashboard.tsx
import React from 'react'
import { useTabState } from '../src/hooks/useTabState'

export const Dashboard = () => {
  // Main tabs
  const { activeTab, setActiveTab } = useTabState({
    defaultTab: 'overview'
  })
  
  // Sub-tabs (different paramName)
  const { activeTab: activeSubTab, setActiveTab: setActiveSubTab } = useTabState({
    defaultTab: 'daily',
    paramName: 'period'
  })
  
  return (
    <div>
      {/* Main tabs */}
      <nav className="flex gap-2 p-4 border-b">
        <button
          onClick={() => setActiveTab('overview')}
          className={activeTab === 'overview' ? 'font-bold' : ''}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={activeTab === 'analytics' ? 'font-bold' : ''}
        >
          Analytics
        </button>
      </nav>
      
      {activeTab === 'overview' && <Overview />}
      
      {activeTab === 'analytics' && (
        <div>
          {/* Sub-tabs */}
          <div className="flex gap-2 p-4 border-b bg-gray-50">
            <button
              onClick={() => setActiveSubTab('daily')}
              className={activeSubTab === 'daily' ? 'font-bold' : ''}
            >
              Daily
            </button>
            <button
              onClick={() => setActiveSubTab('weekly')}
              className={activeSubTab === 'weekly' ? 'font-bold' : ''}
            >
              Weekly
            </button>
            <button
              onClick={() => setActiveSubTab('monthly')}
              className={activeSubTab === 'monthly' ? 'font-bold' : ''}
            >
              Monthly
            </button>
          </div>
          
          {/* Sub-tab content */}
          {activeSubTab === 'daily' && <DailyAnalytics />}
          {activeSubTab === 'weekly' && <WeeklyAnalytics />}
          {activeSubTab === 'monthly' && <MonthlyAnalytics />}
        </div>
      )}
    </div>
  )
}

const Overview = () => <div>Overview content</div>
const DailyAnalytics = () => <div>Daily analytics</div>
const WeeklyAnalytics = () => <div>Weekly analytics</div>
const MonthlyAnalytics = () => <div>Monthly analytics</div>
```

### URL Examples
- `/dashboard?tab=overview&period=daily`
- `/dashboard?tab=analytics&period=weekly`
- Back button preserves both tabs

---

## 9. Error Handling (Copy & Paste)

### Graceful Fallbacks
```tsx
// pages/SafePage.tsx
import React, { Suspense } from 'react'
import { useTabState } from '../src/hooks/useTabState'
import { TabSkeleton } from '../src/components/skeletons/TabSkeleton'

export const SafePage = () => {
  const { activeTab, setActiveTab } = useTabState({
    defaultTab: 'overview'
  })
  
  return (
    <div>
      <nav className="flex gap-2 p-4">
        <button onClick={() => setActiveTab('overview')}>Overview</button>
        <button onClick={() => setActiveTab('details')}>Details</button>
      </nav>
      
      {/* Suspense for lazy components */}
      <Suspense fallback={<TabSkeleton />}>
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'details' && <DetailsTab />}
      </Suspense>
    </div>
  )
}

const OverviewTab = React.lazy(() => import('./OverviewTab'))
const DetailsTab = React.lazy(() => import('./DetailsTab'))
```

---

## 10. Testing (Copy & Paste)

### Unit Test Example
```tsx
// __tests__/useTabState.test.tsx
import { renderHook, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { useTabState } from '../src/hooks/useTabState'

describe('useTabState', () => {
  it('should initialize with default tab', () => {
    const wrapper = ({ children }: any) => (
      <BrowserRouter>{children}</BrowserRouter>
    )
    
    const { result } = renderHook(() => useTabState({
      defaultTab: 'overview'
    }), { wrapper })
    
    expect(result.current.activeTab).toBe('overview')
  })
  
  it('should change tab on setActiveTab', () => {
    const wrapper = ({ children }: any) => (
      <BrowserRouter>{children}</BrowserRouter>
    )
    
    const { result } = renderHook(() => useTabState({
      defaultTab: 'overview'
    }), { wrapper })
    
    act(() => {
      result.current.setActiveTab('details')
    })
    
    expect(result.current.activeTab).toBe('details')
  })
})
```

---

## Quick Copy-Paste Checklist

```
✅ 1. Basic tab state - Copy from section 1
✅ 2. Designer tabs - Copy from section 2
✅ 3. Smart links - Copy from section 3
✅ 4. Scroll memory - Copy from section 4
✅ 5. Focus management - Copy from section 5
✅ 6. Complete example - Copy from section 6
✅ 7. Forms with tabs - Copy from section 7
✅ 8. Nested tabs - Copy from section 8
✅ 9. Error handling - Copy from section 9
✅ 10. Tests - Copy from section 10
```

---

## Production Checklist

Before deploying your implementation:

- [ ] All tab buttons working
- [ ] URL updates correctly (?tab=x)
- [ ] Back/forward works
- [ ] Scroll position restored
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Tested on prod domain
- [ ] Analytics configured
- [ ] Rollback plan ready

---

**Ready to implement?** Pick a code snippet above and start! 🚀
