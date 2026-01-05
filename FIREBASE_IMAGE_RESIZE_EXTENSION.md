# Firebase Storage Image Resize Extension Setup

## Overview
This guide sets up automatic image optimization using Firebase's official image resize extension. It automatically generates WebP thumbnails for all uploaded images.

## Installation

### 1. Install the Extension via Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Build** → **Extensions**
4. Click **Install Extension**
5. Search for "Resize Images" (by Firebase)
6. Click **Install**

### 2. Configuration Parameters

Use these settings when prompted:

```
Cloud Functions location: us-central1 (or your preferred region)

Cloud Storage bucket for images: 
  gs://your-project.appspot.com (your default bucket)

Paths of images to resize:
  templates/,productImages/,userUploads/

Sizes of resized images (in WxH format):
  300x400,600x800,1200x1600

Conversion type:
  webp

Delete original file:
  No (keep originals for full-size viewing)

Output directory for resized images:
  (leave empty - will use _300x400, _600x800, _1200x1600 suffixes)

Cache-Control header for resized images:
  max-age=31536000

Make resized images public:
  Yes (if your images are public)
```

### 3. How It Works

When you upload an image to Firebase Storage:
```
Original: templates/template-123.jpg (2MB, 2000x2666px)
```

Extension automatically creates:
```
templates/template-123_300x400.webp   (~30KB)  ← Use for picker
templates/template-123_600x800.webp   (~80KB)  ← Use for preview modal
templates/template-123_1200x1600.webp (~200KB) ← Use for try-on canvas
```

## URL Generation

### Original (Full Size)
```
https://firebasestorage.googleapis.com/v0/b/PROJECT.appspot.com/o/templates%2Ftemplate-123.jpg?alt=media
```

### Thumbnail (300x400 WebP)
```
https://firebasestorage.googleapis.com/v0/b/PROJECT.appspot.com/o/templates%2Ftemplate-123_300x400.webp?alt=media
```

## Code Integration

Use the utility function `getOptimizedImageUrl()` to automatically request the right size:

```typescript
import { getOptimizedImageUrl } from '@/utils/imageOptimization';

// In template picker - request 300x400 thumbnail
const thumbnailUrl = getOptimizedImageUrl(originalUrl, 'thumbnail');

// In preview modal - request 600x800 medium size
const previewUrl = getOptimizedImageUrl(originalUrl, 'medium');

// In try-on canvas - request 1200x1600 large size
const canvasUrl = getOptimizedImageUrl(originalUrl, 'large');
```

## Migration Strategy

### Existing Images
The extension only processes NEW uploads. For existing images:

**Option A: Trigger Extension Manually**
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Trigger resize for existing images
firebase ext:run resize-images --project=your-project-id
```

**Option B: Re-upload Script**
```bash
# Run migration script to trigger resize
node scripts/migrateExistingImages.js
```

**Option C: Lazy Migration**
Images get optimized on-demand when users view them (fallback to original if thumbnail doesn't exist).

### New Uploads
All new uploads automatically get optimized thumbnails within 1-2 minutes of upload.

## Performance Impact

### Before Optimization
- Average image: 2MB (JPEG, 2000x2666px)
- Picker loads 20 images: 40MB download
- Load time on 3G: ~45 seconds

### After Optimization
- Thumbnail: 30KB (WebP, 300x400px)
- Picker loads 20 images: 600KB download
- Load time on 3G: ~2 seconds

**Result: ~22x faster, 67x less bandwidth**

## Browser Support

WebP is supported by:
- Chrome/Edge: ✅ All versions
- Firefox: ✅ 65+
- Safari: ✅ 14+ (iOS 14+, macOS Big Sur+)
- Coverage: ~97% of users

Fallback to JPEG is automatic for unsupported browsers.

## Monitoring

Check extension logs:
```bash
firebase ext:logs resize-images
```

View processed images in Firebase Console:
- Storage → Files → Look for `_300x400.webp` files

## Cost Estimate

- Extension execution: ~$0.0001 per image resize
- Storage: WebP thumbnails are 95% smaller than originals
- Bandwidth: 67x reduction in data transfer

**Net result: Significant cost savings** (less storage + less egress bandwidth)

## Troubleshooting

### Thumbnails Not Generated
1. Check extension logs: `firebase ext:logs resize-images`
2. Verify paths match: Must upload to `templates/`, `productImages/`, etc.
3. Wait 1-2 minutes after upload
4. Check IAM permissions for extension service account

### Images Not Displaying
1. Ensure `Make resized images public: Yes` is enabled
2. Check Firebase Storage rules allow read access
3. Verify URL includes `?alt=media` parameter

### Slow First Load
- Extension processes images asynchronously (1-2 min delay)
- First viewer sees original, subsequent viewers see WebP thumbnail
- Use lazy migration approach or pre-process images

## Next Steps

1. ✅ Install extension via Firebase Console
2. ✅ Configure parameters (see above)
3. ✅ Deploy extension
4. ✅ Integrate `getOptimizedImageUrl()` utility in code
5. ✅ Test with new upload
6. ⏳ Migrate existing images (optional)

## Additional Resources

- [Firebase Resize Images Extension Docs](https://firebase.google.com/products/extensions/firebase-storage-resize-images)
- [WebP Format Guide](https://developers.google.com/speed/webp)
- [Image Optimization Best Practices](https://web.dev/fast/#optimize-your-images)
