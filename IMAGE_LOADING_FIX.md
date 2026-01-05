# Image Loading Layout Shift Fix

## Issue
When selecting thumbnails from the history filmstrip, the main preview area (AI Result side) was experiencing layout shift/"jumping" because the code was:
1. First loading the low-resolution thumbnail (~300px)
2. Then replacing it with the high-resolution final result

This caused two sequential browser paints, creating a visible flicker/jump.

## Root Cause
In `handleSelectHistory` function, the code was setting the `afterImage` state twice:

```tsx
// ❌ OLD (PROBLEMATIC) CODE:
const afterThumb = item?.thumbnailUrl || item?.fullImageUrl || ORIGINAL;
const afterFull = item?.fullImageUrl || item?.thumbnailUrl || afterThumb;

setAfterImage(afterThumb);  // First paint: low-res
// ... other code ...
await prefetchImage(afterFull);
setAfterImage(afterFull || ORIGINAL);  // Second paint: high-res (causes jump)
```

## Solution Applied
Implemented hidden Image preloading pattern that loads the high-resolution image in memory BEFORE updating the UI state. This ensures only one paint cycle with the final high-res image.

### Changes Made

#### 1. Added Loading State (Line 333)
```tsx
const [isLoadingHistoryImage, setIsLoadingHistoryImage] = React.useState(false);
```

#### 2. Rewrote handleSelectHistory Function (Lines 819-859)
```tsx
const handleSelectHistory = React.useCallback(async (item: any) => {
  // Get URLs
  const jobId: string | null = item?.jobId ?? null;
  const beforeImage = item?.templateUrl || sourcePreviewUrl || ORIGINAL;
  const afterFull = item?.fullImageUrl || item?.thumbnailUrl || ORIGINAL;

  // Set loading state
  setIsLoadingHistoryImage(true);

  // ✅ Preload the high-res image in memory BEFORE updating state
  const img = new Image();
  img.src = afterFull;

  img.onload = () => {
    // Only update UI after image is fully loaded in browser cache
    setSourceForComparison(beforeImage);
    setAfterImage(afterFull);
    setBeforeUpscaleImage(afterFull?.startsWith('data:') ? afterFull : null);
    setSliderPos(50);
    setActiveId(jobId);
    setIsLoadingHistoryImage(false);
  };

  img.onerror = () => {
    // Fallback if image fails to load
    setSourceForComparison(beforeImage);
    setAfterImage(ORIGINAL);
    setBeforeUpscaleImage(null);
    setSliderPos(50);
    setActiveId(jobId);
    setIsLoadingHistoryImage(false);
  };

  // Task navigation (best-effort)
  try {
    const tasks = await taskStorage.listTasks(user?.uid);
    const matchingTask = tasks.find(t => t.results?.jobId === jobId);
    if (matchingTask) {
      navigate(`/designer-v2-1/design/${matchingTask.taskId}`);
      return;
    }
  } catch {
    // ignore and keep the immediate UI fallback
  }
}, [navigate, setActiveId, sourcePreviewUrl, user?.uid]);
```

#### 3. Added Loading Overlay to Comparison View (Lines 1347-1356)
```tsx
{isLoadingHistoryImage && (
  <div className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm flex items-center justify-center z-40">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      <span className="text-xs text-zinc-400">Loading image...</span>
    </div>
  </div>
)}
```

## Benefits

✅ **No More Layout Shift**: Image container maintains stable dimensions throughout loading  
✅ **Single Paint Cycle**: Browser only paints once with the final high-res image  
✅ **Better UX**: Smooth loading indicator instead of jarring image swap  
✅ **Proper Error Handling**: Fallback to ORIGINAL if image fails to load  
✅ **Performance**: Leverages browser image cache for instant display  

## Technical Details

### Hidden Image Preloading Pattern
The pattern uses JavaScript's native `Image()` constructor to preload images in memory:

```tsx
const img = new Image();
img.src = url;
img.onload = () => {
  // Image is now in browser cache
  // Safe to update UI state - will display instantly
};
```

When `setAfterImage(afterFull)` is called after `img.onload`, the browser already has the image in cache, so it renders immediately without a second network request.

### Why This Works
1. **Browser Cache**: Once loaded via `new Image()`, the browser caches it
2. **Same URL**: When React renders `<img src={afterFull} />`, it uses the cached version
3. **No Double Paint**: Only one state update = one render cycle
4. **Maintained Aspect Ratio**: Container CSS keeps layout stable during load

## Files Modified

- `src/pages/DesignerV2_1/DesignerV2_1.tsx`:
  - Added `isLoadingHistoryImage` state (line 333)
  - Rewrote `handleSelectHistory` function (lines 819-859)
  - Added loading overlay to comparison view (lines 1347-1356)

## Testing Checklist

- [x] No compilation errors
- [ ] Click thumbnail from history filmstrip
- [ ] Verify no layout shift/jump
- [ ] Loading indicator appears during image load
- [ ] High-res image displays smoothly
- [ ] Fallback to ORIGINAL if image fails
- [ ] Task navigation still works correctly

## Related Documentation

- `AGENTS.md` - Section B: Eliminate Cumulative Layout Shift (CLS)
- User requirement: "Bypass thumbnail loading for main display, load only high-res URL directly"

---

**Date Applied**: December 29, 2025  
**Issue**: Layout shift when selecting history thumbnails  
**Status**: ✅ Implemented, pending user testing
