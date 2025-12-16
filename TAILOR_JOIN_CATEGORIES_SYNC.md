# Tailor Join Categories - Dynamic Firestore Integration

## Overview / النظرة العامة

تم تحديث تطبيق Tailor Join لاستخدام **نفس مصدر التصنيفات** الموجود في صفحة Admin Products بدلاً من قائمة ثابتة في الكود.

## Data Source / مصدر البيانات

### Firestore Collection
- **Collection**: `productCategories`
- **Query**: `orderBy('order', 'asc')`
- **Filtering**: Level 2 categories only, filtered by specialization (male/female)

### Gender-Based Filtering
- **Male (رجالي)**: Shows Level 2 categories under "الملابس الرجالية" / "Men's Clothing"
- **Female (نسائي)**: Shows Level 2 categories under "الملابس النسائية" / "Women's Clothing"

## Implementation / التنفيذ

### Files Modified / الملفات المعدلة

1. **tailorjoin-khuyoot-app/src/features/tailor-join/TailorJoinFlow.jsx**
   - Added Firestore integration for dynamic categories
   - Added loading/error/empty states
   - Gender-based category filtering
   - Auto-clear invalid selections when gender changes

2. **src/features/tailor-join/TailorJoinFlow.jsx** (main app copy)
   - Same changes for consistency

### Key Features / المزايا الرئيسية

#### 1. Dynamic Loading
```javascript
const [firestoreProductCategories, setFirestoreProductCategories] = useState(null);
const [categoriesLoading, setCategoriesLoading] = useState(true);
const [categoriesError, setCategoriesError] = useState(null);
```

#### 2. Loading States
- ⏳ **Loading**: Spinner with "جاري تحميل التصنيفات... Loading categories..."
- ❌ **Error**: Error message + Retry button
- 📭 **Empty**: 
  - If no gender selected: "يرجى اختيار طبيعة التخصص أولاً"
  - If gender selected but no categories: "لا توجد تصنيفات متاحة لهذا التخصص"

#### 3. Category Display
In Step 2, categories appear as:
- **Grid of buttons** (3 columns) with Arabic names
- Selected category: `bg-indigo-600 text-white`
- Unselected: `bg-gray-100 dark:bg-gray-800`

#### 4. Category Name Priority
```javascript
cat.nameAr || cat.name || cat.nameEn || cat.title || cat.id
```

## Data Flow / تدفق البيانات

```
┌─────────────────────────────────────────────┐
│ Firestore: productCategories collection     │
│ (same source as Admin Products page)        │
└──────────────────┬──────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────┐
│ Load on mount (with loading state)          │
└──────────────────┬──────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────┐
│ Filter by:                                  │
│ 1. isActive !== false                       │
│ 2. level === 2                              │
│ 3. Parent matches selected gender           │
└──────────────────┬──────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────┐
│ Sort by order field                         │
└──────────────────┬──────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────┐
│ Display as buttons in Step 2                │
└─────────────────────────────────────────────┘
```

## Category Matching Logic / منطق المطابقة

### Gender Root Categories
```javascript
// Male
ar.includes('الملابس الرجالية') || ar.includes('ملابس رجالية') || en.includes('men')

// Female
ar.includes('الملابس النسائية') || ar.includes('ملابس نسائية') || en.includes('women')
```

## Validation / التحقق

### Step 2 Validation
- Each product must have:
  - ✅ Name (non-empty)
  - ✅ Price (> 0)
  - ✅ Category (selected from available list)
  - ✅ At least 1 image

### Auto-Clear on Gender Change
If user changes specialization (male ↔ female), any previously selected categories that are no longer valid are automatically cleared.

## Error Handling / معالجة الأخطاء

### Firestore Connection Failed
- Shows error message in Arabic + English
- Provides "إعادة المحاولة Retry" button
- Falls back to empty array (not default hardcoded list)

### Firebase Not Initialized
- Silently falls back to empty categories
- No error shown (graceful degradation)

## UI States / حالات الواجهة

### Step 2 - Product Categories Section

#### Loading State
```
┌─────────────────────────────────────┐
│ 🔄 جاري تحميل التصنيفات...         │
│    Loading categories...             │
└─────────────────────────────────────┘
```

#### Error State
```
┌─────────────────────────────────────┐
│ ❌ فشل تحميل التصنيفات              │
│    Failed to load categories         │
│                                      │
│    [ إعادة المحاولة Retry ]         │
└─────────────────────────────────────┘
```

#### Empty State (No Gender)
```
┌─────────────────────────────────────┐
│ يرجى اختيار طبيعة التخصص أولاً      │
│ Please select specialization first   │
└─────────────────────────────────────┘
```

#### Success State
```
┌─────────────────────────────────────┐
│ [ جلبية ] [ فستان ] [ لبس عماني ] │
│ [ محجور ] [ مقربي ] [ عباية ]      │
└─────────────────────────────────────┘
```

## Testing / الاختبار

### Manual Testing Steps
1. ✅ Navigate to `http://localhost:5174/#/join-tailor/2`
2. ✅ Select specialization: "ذكر" or "أنثى"
3. ✅ Verify categories load from Firestore
4. ✅ Verify only Level 2 categories for selected gender appear
5. ✅ Add a product and select a category
6. ✅ Change specialization → verify category resets if invalid
7. ✅ Test with network disabled → verify error state + retry

### Expected Results
- Categories match exactly what appears in Admin Products page (Level 2 only)
- Same order (by `order` field)
- Same names (Arabic names prioritized)

## Future Improvements / التحسينات المستقبلية

- [ ] Add category icons/images in button display
- [ ] Cache categories in localStorage to reduce Firestore reads
- [ ] Add category descriptions on hover
- [ ] Support multi-level category selection (Level 3+)

## Notes / ملاحظات

- ⚠️ Categories are **filtered client-side** after loading all from Firestore
- 🔄 Categories reload on component mount only (not on gender change)
- 📊 Performance: ~1 Firestore read per page load
- 🌐 Works offline if categories previously loaded (React state persists during session)

---

**Last Updated**: December 16, 2025  
**Version**: 1.0
