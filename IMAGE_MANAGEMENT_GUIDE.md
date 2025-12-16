# دليل إدارة الصور - Image Management Guide

## نظرة عامة | Overview

تم تطوير نظام شامل لإدارة صور المنتجات يتيح لأصحاب المحلات والبوتيكات والخياطين التحكم الكامل في صور منتجاتهم.

A comprehensive image management system has been developed that allows shop owners, boutiques, and tailors full control over their product images.

---

## الميزات الجديدة | New Features

### 1. صورة الغلاف | Cover Image Selection

**الوصف | Description:**
- يمكن لصاحب المنتج تحديد أي صورة من صور المنتج لتكون صورة الغلاف الرئيسية
- تُستخدم صورة الغلاف كصورة مصغرة في جميع صفحات عرض المنتجات
- يتم حفظ index صورة الغلاف في قاعدة البيانات (`coverImageIndex`)

**The owner can designate any product image as the main cover image**
- The cover image is used as the thumbnail across all product listing pages
- The cover image index is saved in the database (`coverImageIndex`)

**كيفية الاستخدام | How to Use:**
1. في صفحة **إدارة منتجاتي**، قم بإضافة منتج جديد أو تعديل منتج موجود
2. قم برفع عدة صور للمنتج (حتى 10 صور)
3. في قسم **إدارة الصور**، ستظهر جميع الصور المرفوعة
4. اضغط على زر **"تعيين كغلاف"** للصورة التي تريد جعلها الغلاف الرئيسي
5. سيظهر شارة **"غلاف"** على الصورة المحددة
6. عند الحفظ، سيتم استخدام هذه الصورة كصورة رئيسية

---

### 2. استبدال الصور | Image Replacement

**الوصف | Description:**
- يمكن استبدال أي صورة من صور المنتج دون الحاجة لحذفها وإعادة رفعها
- يتم الاحتفاظ بترتيب الصور وموضع صورة الغلاف

**Replace any product image without deleting and re-uploading**
- Image order and cover image position are preserved

**كيفية الاستخدام | How to Use:**
1. في قسم **إدارة الصور** أثناء تعديل المنتج
2. مرر الماوس على الصورة التي تريد استبدالها
3. اضغط على زر **"استبدال"** (أيقونة دائرية مع سهمين)
4. اختر الصورة الجديدة من جهازك
5. سيتم ضغط الصورة ورفعها تلقائياً
6. سيتم استبدال الصورة القديمة بالجديدة في نفس الموضع

---

### 3. حذف الصور | Image Deletion

**الوصف | Description:**
- يمكن حذف أي صورة من صور المنتج
- لا يمكن حذف الصورة الوحيدة (يجب أن يكون للمنتج صورة واحدة على الأقل)
- عند حذف صورة الغلاف، يتم تعيين الصورة الأولى تلقائياً كغلاف جديد

**Delete any product image**
- Cannot delete the only remaining image (product must have at least one image)
- When deleting the cover image, the first image is automatically set as the new cover

**كيفية الاستخدام | How to Use:**
1. في قسم **إدارة الصور**
2. مرر الماوس على الصورة المراد حذفها
3. اضغط على زر **"حذف"** (أيقونة سلة المهملات)
4. قم بتأكيد عملية الحذف
5. سيتم حذف الصورة فوراً

---

### 4. أسهم التنقل الدائمة لصاحب المنتج | Always-Visible Navigation Arrows for Owner

**الوصف | Description:**
- أسهم تقليب الصور تظهر دائماً لصاحب المنتج في جميع أنماط العرض
- بالنسبة للزوار العاديين، تظهر الأسهم فقط عند التمرير فوق المنتج

**Navigation arrows are always visible for the product owner in all view modes**
- For regular visitors, arrows appear only on hover

**التطبيق | Implementation:**
- في صفحة **ProductDetails**: الأسهم دائمة الظهور عند المعاينة كصاحب المنتج
- في **ProductCard**: تم إضافة خاصية `isOwner` للتحكم في ظهور الأسهم

---

## الواجهة البرمجية | Technical Implementation

### التغييرات في types.ts

```typescript
export interface Product {
  // ... الحقول الموجودة
  image: string; // صورة الغلاف الرئيسية
  coverImageIndex?: number; // index الصورة المختارة كغلاف من images
  images?: string[]; // صور إضافية للمنتج (حتى 10)
}
```

### التغييرات في TailorCollections.tsx

**State Management:**
```typescript
const [coverImageIndex, setCoverImageIndex] = useState<number>(0);
const [allProductImages, setAllProductImages] = useState<string[]>([]);
```

**Cover Image Logic:**
```typescript
// عند الحفظ
const finalImages = allProductImages.length > 0 ? allProductImages : [];
const newProduct: Product = {
  // ...
  image: finalImages[coverImageIndex] || finalImages[0], // صورة الغلاف المحددة
  coverImageIndex: coverImageIndex,
  images: finalImages
};
```

**Image Replacement Function:**
```typescript
// داخل زر الاستبدال
onClick={async () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      // ضغط ورفع الصورة
      const compressedFile = await imageCompression(file, options);
      const storageRef = ref(storage, `products/${user?.id}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, compressedFile);
      const newUrl = await getDownloadURL(storageRef);
      
      // استبدال في المصفوفة
      setAllProductImages(prev => {
        const newArr = [...prev];
        newArr[index] = newUrl;
        return newArr;
      });
    }
  };
  input.click();
}}
```

### التغييرات في ProductCard.tsx

**Props:**
```typescript
interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'compact' | 'list';
  isOwner?: boolean; // هل المستخدم هو صاحب المنتج
}
```

**Owner-Visible Arrows:**
```typescript
className={`...z-10 ${
  isOwner ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
}`}
```

---

## واجهة المستخدم | User Interface

### قسم إدارة الصور

```
┌─────────────────────────────────────────────┐
│ إدارة الصور (3/10)    الصورة #1 هي صورة الغلاف │
├─────────────────────────────────────────────┤
│  ┌────┐  ┌────┐  ┌────┐                    │
│  │ [✓]│  │    │  │    │                    │
│  │غلاف│  │    │  │    │                    │
│  │ 🌟 │  │ 🔄 │  │ 🔄 │                    │
│  │    │  │ 🗑 │  │ 🗑 │                    │
│  └────┘  └────┘  └────┘                    │
│    #1      #2      #3                       │
└─────────────────────────────────────────────┘
```

**الأزرار | Buttons:**
- 🌟 **تعيين كغلاف** - Set as Cover (يظهر لكل الصور عدا الغلاف الحالي)
- 🔄 **استبدال** - Replace (يظهر لجميع الصور)
- 🗑 **حذف** - Delete (يظهر لجميع الصور، معطل إذا كانت الصورة الوحيدة)

**الشارات | Badges:**
- **غلاف** - Cover badge (أزرق، يظهر على صورة الغلاف فقط)
- **#1, #2, #3...** - Image number (رمادي، يظهر على كل صورة)

---

## سير العمل | Workflow

### إضافة منتج جديد | Adding New Product

1. انتقل إلى **إدارة منتجاتي** ← **إضافة منتج جديد**
2. املأ تفاصيل المنتج (الاسم، السعر، المدة، الفئة، إلخ.)
3. ارفع عدة صور للمنتج (حتى 10 صور)
4. بعد رفع الصور، اختر صورة الغلاف من قسم **إدارة الصور**
5. اضغط **حفظ ونشر**

### تعديل منتج موجود | Editing Existing Product

1. في صفحة **إدارة منتجاتي**، اضغط زر **تعديل** ✏️ على المنتج
2. ستظهر الصور الموجودة في قسم **إدارة الصور**
3. يمكنك:
   - تعيين صورة غلاف جديدة
   - استبدال أي صورة
   - حذف صورة
   - إضافة صور جديدة (إذا لم تصل للحد الأقصى 10 صور)
4. اضغط **تحديث** لحفظ التغييرات

---

## ملاحظات مهمة | Important Notes

### صورة الغلاف | Cover Image
- **افتراضياً**: الصورة الأولى (index 0) هي صورة الغلاف
- **عند استبدال صورة الغلاف**: يتم تحديث `image` و `images[coverImageIndex]` معاً
- **في العرض للزبون**: تُستخدم `product.image` كصورة مصغرة

### ضغط الصور | Image Compression
- **الحد الأقصى**: 1 MB per image
- **الأبعاد**: Max 1920px width/height
- **المكتبة**: `browser-image-compression`

### التخزين | Storage
- **المسار**: `products/{userId}/{timestamp}_{filename}`
- **Firebase Storage**: Automatic URL generation
- **الأمان**: Only authenticated users can upload

### الحدود | Limits
- **الحد الأقصى للصور**: 10 images per product
- **الحد الأدنى**: 1 image required
- **لا يمكن حذف**: الصورة الوحيدة

---

## استكشاف الأخطاء | Troubleshooting

### المشكلة: لا تظهر الأزرار عند التمرير
**الحل**: تأكد من أن المتصفح يدعم `:hover` pseudo-class

### المشكلة: فشل استبدال الصورة
**الحل**: 
- تحقق من اتصال الإنترنت
- تأكد من أن حجم الصورة مناسب (< 5 MB قبل الضغط)
- تحقق من أذونات Firebase Storage

### المشكلة: صورة الغلاف لا تتغير
**الحل**:
- تأكد من الضغط على زر **"تعيين كغلاف"**
- تأكد من حفظ المنتج بعد التعديل
- قم بتحديث الصفحة إذا لزم الأمر

---

## التطوير المستقبلي | Future Enhancements

### مخطط | Planned
- [ ] إعادة ترتيب الصور بالسحب والإفلات (Drag & Drop)
- [ ] معاينة الصورة بحجم كامل قبل الحفظ
- [ ] دفعة رفع متعددة (Batch Upload)
- [ ] تحرير الصور (Crop, Rotate, Filters)
- [ ] تحسين الصور تلقائياً (Auto Enhancement)

### قيد الدراسة | Under Consideration
- [ ] فيديوهات المنتج (Product Videos)
- [ ] صور 360 درجة (360° Product View)
- [ ] AI لاقتراح أفضل صورة غلاف (AI Cover Suggestion)
- [ ] تصنيف تلقائي للصور (Auto Image Tagging)

---

## التحديثات | Changelog

### v1.0.0 - 2024
- ✅ إضافة نظام صورة الغلاف
- ✅ إضافة ميزة استبدال الصور
- ✅ تحسين واجهة إدارة الصور
- ✅ أسهم دائمة الظهور لصاحب المنتج
- ✅ دعم حتى 10 صور لكل منتج

---

## الدعم | Support

للمساعدة أو الإبلاغ عن مشكلة، يرجى التواصل مع فريق التطوير.

For help or to report an issue, please contact the development team.
