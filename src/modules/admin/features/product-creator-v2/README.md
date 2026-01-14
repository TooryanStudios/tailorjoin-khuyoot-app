# Product Creator V2 - Style Snap Inspired UI

## 📍 Location
`src/modules/admin/features/product-creator-v2/`

## 🎨 Design Philosophy
Modern two-column workspace inspired by "Style Snap" layout with dark glassmorphism theme.

## 🗂️ Structure

```
product-creator-v2/
├── NewProductPage.tsx          # Main page component
├── context/
│   └── ProductFormContext.tsx  # Shared state management
├── components/
│   ├── ImageWorkspace.tsx      # Slots 1 & 9: Main image + thumbnail reel
│   ├── ProductDetailsPanel.tsx # Slots 3-7: Form inputs
│   ├── PublishButton.tsx       # Slot 8: Action button
│   └── FabricPresetSelector.tsx # Slot 2: Quick fabric presets
└── index.ts                    # Public exports
```

## 🎯 Feature Mapping (Style Snap → Product Creator)

| Slot | Original (Style Snap) | New (Product Creator) |
|------|-----------------------|------------------------|
| 1    | Model Preview         | **Main Product Image** (Cover) |
| 2    | Select Style          | **Fabric/Pattern Presets** |
| 3    | Upload Image          | **Product Name** (اسم المنتج) |
| 4    | -                     | **Category Selector** (الفئة) |
| 5    | -                     | **Image Upload/Library** |
| 6    | -                     | **Price** (السعر) |
| 7    | -                     | **Tags** (الوسوم) |
| 8    | Generate Image        | **Publish Product** (نشر المنتج) |
| 9    | Thumbnail Carousel    | **Image Thumbnail Reel** |
| 10   | Explore More Apps     | **Future Presets Grid** |

## ✨ Key Features

### Auto-Fill Logic
- Selecting a category automatically fills the product name
- Inherited from TailorCollections bulk mode

### Image Upload Flow
- **No Immediate Upload**: Images stored as blob URLs for preview
- **Upload on Publish**: All images compressed and uploaded when user clicks "Publish"
- **Cover Selection**: Click any thumbnail to set as cover image
- **Memory Safe**: Blob URLs revoked on delete/reset

### State Management
- Centralized via `ProductFormContext`
- Connects to existing Firebase services
- Reuses validation and normalization logic

## 🚀 Usage

### Navigate to the page:
```
/tailor/product/new
```

### Integration in other components:
```tsx
import { NewProductPage } from './src/modules/admin/features/product-creator-v2';

<Route path="/tailor/product/new" element={<NewProductPage />} />
```

## 🎨 Visual Characteristics

- **Dark Theme**: `bg-gradient-to-br from-[#0a0a0c] via-[#0f0f12]`
- **Glassmorphism**: `backdrop-blur-xl border border-white/10`
- **Gradient Accents**: Blue-to-purple gradients for CTAs
- **Responsive**: Two-column on desktop, stacked on mobile

## 📝 Future Enhancements

- [ ] Fabric pattern AI suggestions (Slot 2 expansion)
- [ ] Bulk import from CSV
- [ ] Draft auto-save
- [ ] Image AI enhancement integration
- [ ] Template library (Slot 10)

## 🔗 Dependencies

- `browser-image-compression`: Image optimization
- `lucide-react`: Icons
- `firebase/storage`: Image upload
- Existing `firebaseService` and `categoryData`

## 🧪 Validation Checklist

✅ Visual: Dark aesthetic matching Style Snap reference  
✅ Functional: Category auto-fills product name  
✅ Media: Multiple image upload with cover selection  
✅ State: Connects to Firebase product creation flow  
✅ Performance: Images only upload on publish click
