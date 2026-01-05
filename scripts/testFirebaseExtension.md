# Test Firebase Resize Extension

## Quick Test Steps

1. **Go to Firebase Console Storage**:
   https://console.firebase.google.com/project/khuyoot-app/storage

2. **Navigate to templates folder**

3. **Upload a test image**: `test-template.jpg`

4. **Wait 1-2 minutes**

5. **Refresh the folder - you should see**:
   - `test-template.jpg` (original)
   - `test-template_300x400.webp` ✅
   - `test-template_600x800.webp` ✅
   - `test-template_1200x1600.webp` ✅

## If Thumbnails Appear - Success! ✅

The extension is working. Now enable it in the app by running:

```bash
# Tell Copilot: "enable webp optimization in template picker"
```

## If No Thumbnails Appear - Troubleshooting

Check extension logs:
```bash
firebase ext:logs resize-images --project=khuyoot-app
```

Or view in console:
https://console.firebase.google.com/project/khuyoot-app/extensions/instances/storage-resize-images
