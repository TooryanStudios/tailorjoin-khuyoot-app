# Image Migration Guide

## Quick Migration: Trigger WebP for Existing Images

The Firebase extension only processes NEW uploads. To get WebP versions of existing images, we need to re-trigger the extension.

### Option 1: Using Firebase CLI (Recommended - Simple)

```bash
# Install Firebase Admin if not already installed
npm install firebase-admin

# Run the migration script (after setting up service account)
node scripts/migrateImagesToWebP.js
```

### Option 2: Manual Re-upload (Easiest for Few Images)

1. **Download images from Firebase Storage**
2. **Delete originals** (or rename them)
3. **Re-upload** - This triggers the extension
4. **Wait 2-3 minutes** for WebP versions

### Option 3: Using Firebase Console Bulk Operations

For `tryon_templates` folder:

1. Go to Firebase Storage
2. Select all images in folder (Ctrl+A)
3. Download as ZIP
4. Delete selected images
5. Re-upload from ZIP
6. Extension auto-generates WebP versions

## After Migration:

1. **Verify WebP files exist** in Firebase Storage:
   - Check for `_200x300.webp` files
   - Check for `_600x800.webp` files  
   - Check for `_1200x1600.webp` files

2. **Enable WebP in code**:
   ```typescript
   // In TemplatePickerModalContent.tsx
   const USE_WEBP_OPTIMIZATION = true; // Change from false to true
   ```

3. **Test in app**:
   - Open template picker
   - Check Network tab for `_200x300.webp` requests
   - Verify 200 status (not 404)

## Service Account Setup (for Script)

If running the migration script:

1. **Get service account key**:
   - Go to: https://console.firebase.google.com/project/khuyoot-app01/settings/serviceaccounts/adminsdk
   - Click "Generate new private key"
   - Save as `serviceAccountKey.json` in project root

2. **Add to .gitignore**:
   ```
   serviceAccountKey.json
   ```

3. **Run script**:
   ```bash
   node scripts/migrateImagesToWebP.js
   ```

## Estimated Time

- **Few images (10-20)**: 5-10 minutes total
- **Many images (50-100)**: 15-30 minutes total
- Processing time: ~1-2 minutes per image for WebP generation
