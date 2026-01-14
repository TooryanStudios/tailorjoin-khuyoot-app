# 🎨 Product Creator V2 - Quick Start Guide

## Access the New UI

### Option 1: Direct URL
Navigate to: `/tailor/product/new`

### Option 2: From TailorCollections
Click the **"تجربة الواجهة الجديدة"** button (gradient blue-purple) at the top of the collections page.

---

## Layout Overview

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  LEFT COLUMN (420px)         RIGHT COLUMN (Flexible)       │
│  ┌──────────────────┐        ┌──────────────────────┐     │
│  │ Header           │        │                      │     │
│  │ إضافة منتج جديد  │        │   Main Product       │     │
│  └──────────────────┘        │   Image (Slot 1)     │     │
│                              │   3:4 Aspect Ratio   │     │
│  ┌──────────────────┐        │                      │     │
│  │ Fabric Presets   │        └──────────────────────┘     │
│  │ (Slot 2)         │                                      │
│  └──────────────────┘        ┌──────────────────────┐     │
│                              │ Thumbnail Reel       │     │
│  ┌──────────────────┐        │ (Slot 9)             │     │
│  │ Product Name     │        └──────────────────────┘     │
│  │ (Slot 3)         │                                      │
│  └──────────────────┘        ┌──────────────────────┐     │
│                              │ Explore More         │     │
│  ┌──────────────────┐        │ (Slot 10)            │     │
│  │ Category         │        └──────────────────────┘     │
│  │ (Slot 4)         │                                      │
│  └──────────────────┘                                      │
│                                                             │
│  ┌──────────────────┐                                      │
│  │ Image Upload     │                                      │
│  │ (Slot 5)         │                                      │
│  └──────────────────┘                                      │
│                                                             │
│  ┌──────────────────┐                                      │
│  │ Price (Slot 6)   │                                      │
│  └──────────────────┘                                      │
│                                                             │
│  ┌──────────────────┐                                      │
│  │ Tags (Slot 7)    │                                      │
│  └──────────────────┘                                      │
│                                                             │
│  ┌──────────────────┐                                      │
│  │ 🌟 نشر المنتج    │                                      │
│  │ (Slot 8)         │                                      │
│  └──────────────────┘                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Workflow

### 1. **Select Category** (Auto-fills Name)
   - Click the category dropdown
   - Choose from organized categories
   - Product name auto-fills with category name

### 2. **Upload Images**
   - Click the upload zone (Slot 5)
   - Select up to 10 images (PNG, JPG, AVIF)
   - Images preview instantly as blob URLs

### 3. **Manage Images**
   - Click any thumbnail to set as cover (star badge appears)
   - Hover thumbnail and click X to delete
   - Images numbered for easy reference

### 4. **Fill Details**
   - Adjust product name if needed
   - Set price (OMR)
   - Add delivery duration (optional)
   - Add description (optional)
   - Add tags comma-separated (optional)

### 5. **Publish**
   - Click **نشر المنتج** button
   - Images compress and upload automatically
   - Product saves to Firestore
   - Form resets for next product

---

## Key Features

### ✨ Smart Auto-Fill
Category selection automatically fills the product name - perfect for bulk entry.

### 📸 Upload-on-Submit
Images stay local until you click publish - no wasted bandwidth, no orphaned files.

### 🎯 Cover Selection
Click any thumbnail to make it the cover image. Visual star badge confirms selection.

### 🎨 Dark Glassmorphism Theme
Modern aesthetic matching the Style Snap reference with gradient accents.

### ⚡ Responsive Design
Two-column on desktop, stacks beautifully on mobile.

---

## Keyboard Shortcuts

- **Tab**: Navigate through form fields
- **Enter**: Submit form when all required fields filled
- **Esc**: Close category modal

---

## Validation Rules

✅ **Required Fields:**
- Product Name
- Category
- Price
- At least 1 image

⚠️ **Optional Fields:**
- Duration
- Description
- Tags

---

## Technical Notes

### Image Handling
- Max 10 images per product
- Auto-compression to 1MB max
- Max dimensions: 1920px
- Supported: JPG, PNG, AVIF

### Storage Path
Images saved to: `products/{userId}/{timestamp}_{filename}`

### Firestore Schema
- No `undefined` values sent
- Empty strings/arrays omitted
- Category auto-fill preserves legacy compatibility

---

## Troubleshooting

### "Missing permissions" error
✅ **Fixed**: Firestore rules updated to allow authenticated tailors

### Images not uploading
- Check file size (must be < 10MB before compression)
- Verify file format (image/*)
- Hard refresh browser (Ctrl+F5)

### Category not auto-filling
- Ensure category data is loaded (check console)
- Verify category has `nameAr` property

---

## Next Steps

1. **Test the flow:** Add a sample product end-to-end
2. **Check Firebase:** Verify product appears in `users/{userId}/products`
3. **View in collections:** Navigate back to `/tailor/collections` to see the new product

---

Built with ❤️ using React, TypeScript, Firebase, and Tailwind CSS
