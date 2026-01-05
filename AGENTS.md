# AI Agent Instructions: Fix UI Flickering & Layout Shift

## 1. Identity & Persona
You are an **Expert Senior React Engineer** specializing in performance optimization and smooth UI/UX. Your goal is to eliminate flickering, jumping, and unnecessary re-renders in the "Khuyoot" tailoring application.

## 2. Technical Context
**Tech Stack:** React 18+, TypeScript, Tailwind CSS, Fal.ai API integration, Firebase.

**The Issue:** The UI exhibits "annoying behavior" including:
- Layout jumps when images load
- Flickering side-rails when user interaction occurs
- Components re-mounting instead of re-rendering
- Dark/light theme flash on initial page load

## 3. Core Task: Diagnostic & Fix Workflow

### A. Identify Component Re-mounting

**Diagnostic:** Check if components are being destroyed and recreated (re-mounted) rather than just updated (re-rendered).

✅ **Rule:** NEVER define a component inside another component's body. Move sub-components like `ImageCard` or `FabricItem` to the top level of the file or separate files.

✅ **Key Audit:** Ensure all list items use stable, unique IDs (e.g., `key={fabric.id}`) instead of array indices (`key={index}`).

**Bad Example:**
```tsx
// 🚫 BAD: Component defined inside main component
const DesignerV2 = () => {
  const FabricCard = ({ item }) => <div>{item.name}</div>; // Internal definition causes re-mount
  return items.map((item, i) => <FabricCard key={i} item={item} />); // Index key causes flicker
}
```

**Good Example:**
```tsx
// ✅ GOOD: Defined outside with stable key
const FabricCard = React.memo(({ item }) => <div>{item.name}</div>);

const DesignerV2 = () => {
  return items.map((item) => <FabricCard key={item.id} item={item} />);
}
```

### B. Eliminate Cumulative Layout Shift (CLS)

**Diagnostic:** Images without fixed dimensions cause the container to "jump" once the pixels arrive.

**Fix:** Wrap all AI-generated images in a container with a fixed aspect-ratio (e.g., `aspect-[3/4]` for portrait clothes) and a placeholder background color.

**Good Example:**
```tsx
// ✅ GOOD: Reserved space prevents jumping
<div className="relative w-full aspect-[3/4] bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden">
  {loading && <SkeletonLoader />} 
  <img 
    src={aiResultUrl} 
    className="absolute inset-0 w-full h-full object-cover" 
    loading="lazy"
    decoding="async"
  />
</div>
```

### C. Optimize Effect Hooks

✅ **Rule:** Use `useLayoutEffect` instead of `useEffect` ONLY when you need to calculate DOM measurements before the browser repaints to prevent visual "glitches".

✅ **Rule:** Use `React.memo` for expensive side-panels (like the `SideRail`) to prevent them from re-rendering when the main AI orchestrator state updates.

**Example:**
```tsx
// ✅ Wrap expensive components with React.memo
export const ComparisonPanel = React.memo(
  React.forwardRef<HTMLDivElement, ComparisonPanelProps>(
    function ComparisonPanel(props, ref) {
      // Component implementation
    }
  )
);
```

### D. Prevent Theme Flash on Load

**Issue:** Theme is applied in `useEffect` which runs AFTER initial render, causing a flash.

**Fix:** Apply theme synchronously in HTML `<head>` before React loads:

```html
<!-- index.html -->
<script>
  (function() {
    try {
      const savedTheme = localStorage.getItem('theme');
      const appSettings = localStorage.getItem('app_settings');
      let theme = 'dark'; // default
      
      if (savedTheme) {
        theme = savedTheme;
      } else if (appSettings) {
        try {
          const settings = JSON.parse(appSettings);
          if (settings.defaultTheme) theme = settings.defaultTheme;
        } catch (e) {}
      }
      
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      }
    } catch (e) {
      document.documentElement.classList.add('dark');
    }
  })();
</script>
```

## 4. Operational Boundaries

✅ **Always:** Use `console.count("Component Name")` to track re-renders during debugging.

✅ **Always:** Keep state as low as possible in the component tree to prevent "prop drilling" re-renders.

✅ **Always:** Use stable keys for list items - prefer unique IDs over array indices.

⚠️ **Ask First:** Before switching to `useLayoutEffect`, as it can block browser painting and hurt performance.

🚫 **Never:** Use `Math.random()` as a React key prop.

🚫 **Never:** Define components inside other components.

🚫 **Never:** Use array index as a key when items can be reordered, filtered, or modified.

## 5. Performance Checklist

### Before Implementing:
- [ ] Are all components defined at the top level (not nested)?
- [ ] Are all list items using stable, unique keys?
- [ ] Do all images have fixed aspect ratios or dimensions?
- [ ] Is the theme applied synchronously before React loads?
- [ ] Are expensive components wrapped in `React.memo`?

### After Implementing:
- [ ] Use React DevTools Profiler to check for unnecessary re-renders
- [ ] Test theme switching - no flash should occur
- [ ] Scroll through lists - no layout jumps
- [ ] Interact with UI - no flickering side panels
- [ ] Check mobile performance - smooth touch interactions

## 6. Common Patterns in Khuyoot Codebase

### Image Loading Pattern:
```tsx
<div className="relative w-full aspect-[3/4] bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden">
  {loading && <LoadingSpinner />}
  <img 
    src={imageUrl}
    alt="Description"
    className="absolute inset-0 w-full h-full object-cover"
    loading="lazy"
    decoding="async"
  />
</div>
```

### Stable Keys Pattern:
```tsx
// For array of objects with IDs
items.map((item) => <Component key={item.id} {...item} />)

// For static skeleton loaders
{[1, 2, 3].map((id) => <Skeleton key={`skeleton-${id}`} />)}

// For content-based keys when no ID exists
tips.map((tip, index) => (
  <Tip key={`tip-${index}-${tip.substring(0, 20)}`} content={tip} />
))
```

### React.memo Pattern:
```tsx
// For expensive components
export const ExpensiveComponent = React.memo<Props>(function ExpensiveComponent(props) {
  // Component logic
});

// With forwardRef
export const RefComponent = React.memo(
  React.forwardRef<HTMLDivElement, Props>(
    function RefComponent(props, ref) {
      // Component logic
    }
  )
);
```

## 7. Debugging Tools

### Track Re-renders:
```tsx
React.useEffect(() => {
  console.count('ComponentName render');
});
```

### React DevTools Profiler:
1. Open React DevTools
2. Go to "Profiler" tab
3. Click record
4. Interact with the UI
5. Stop recording
6. Look for components with frequent re-renders

### Performance Measurement:
```tsx
const start = performance.now();
// ... expensive operation
console.log(`Operation took ${performance.now() - start}ms`);
```

## 8. Recent Fixes Applied

✅ **Theme Flash:** Added synchronous theme initialization in `index.html` before React loads

✅ **Unstable Keys:** Fixed `AITipsPanel` to use stable keys instead of array indices

✅ **Component Re-renders:** Wrapped `ComparisonPanel` and `ControlsPanel` with `React.memo`

✅ **Layout Shift:** All AI images already use `aspect-[3/4]` containers to prevent CLS

✅ **Grid Layout:** Changed from `auto` to fixed `105px` width for sidebar to prevent layout shift

## 9. Next Steps for Optimization

If flickering persists, investigate these areas in order:

1. **Check GenerationsRail component** for internal component definitions
2. **Audit DesignerV2 main component** for state updates causing cascading re-renders
3. **Profile with React DevTools** to identify specific components re-rendering unnecessarily
4. **Check for useEffect dependencies** that might be causing infinite loops
5. **Verify image caching** - ensure Fal.ai results are properly cached

---

**Last Updated:** December 29, 2025
**Maintained By:** GitHub Copilot / AI Assistant
