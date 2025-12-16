# 📸 نظام إدارة الصور في خيوط

## 🎯 نظرة عامة

تم تنفيذ نظام متكامل لإدارة الصور باستخدام **Firebase Storage** مع مزايا احترافية:

✅ **ضغط تلقائي** - تقليل حجم الصور بنسبة تصل إلى 80%  
✅ **3 أحجام** - صورة مصغرة، متوسطة، وكاملة  
✅ **Lazy Loading** - تحميل الصور عند الحاجة فقط  
✅ **WebP Format** - أفضل جودة وأقل حجم  
✅ **Progressive Loading** - معاينة ضبابية ثم صورة واضحة  
✅ **CDN عالمي** - سرعة عالية في جميع أنحاء العالم  

---

## 📁 الملفات المضافة

### 1. `services/storageService.ts`
خدمة إدارة الصور الشاملة:

```typescript
import { storageService } from '../services/storageService';

// رفع صورة منتج (3 أحجام تلقائياً)
const { thumbnail, medium, full } = await storageService.uploadProductImage(
  file,
  productId,
  tailorId
);

// رفع صورة أفاتار
const avatarUrl = await storageService.uploadAvatar(file, userId);

// رفع صورة غلاف
const coverUrl = await storageService.uploadCoverImage(file, tailorId);

// حذف صورة
await storageService.deleteImage(imageUrl);

// التحقق من الصورة قبل الرفع
const { valid, error } = storageService.validateImageFile(file);
```

**الميزات:**
- ضغط تلقائي لـ 3 أحجام مختلفة
- تحويل تلقائي إلى WebP
- معالجة الأخطاء الشاملة
- Caching تلقائي

---

### 2. `components/ImageUpload.tsx`
مكون React لرفع الصور:

```tsx
import { ImageUpload } from '../components/ImageUpload';

<ImageUpload
  productId="product-123"
  tailorId="tailor-456"
  onUploadComplete={(urls) => {
    console.log('تم رفع الصورة:', urls);
  }}
  onError={(error) => {
    console.error('خطأ:', error);
  }}
  existingImage={product.image} // اختياري
  disabled={false} // اختياري
/>
```

**الميزات:**
- Drag & Drop
- معاينة فورية
- شريط تقدم
- رسائل خطأ واضحة
- دعم تغيير الصورة

---

### 3. `components/OptimizedImage.tsx`
مكون صورة محسّن مع Lazy Loading:

```tsx
import { OptimizedImage, Avatar } from '../components/OptimizedImage';

// صورة عادية مع Lazy Loading
<OptimizedImage
  src={product.image}
  alt={product.name}
  className="w-full h-64"
  sizes={{
    thumbnail: product.thumbnail,
    medium: product.medium,
    full: product.full
  }}
  priority={false} // true للصور المهمة (فوق الصفحة)
/>

// أفاتار
<Avatar
  src={user.avatar}
  name={user.name}
  size="lg" // sm, md, lg, xl
/>
```

**الميزات:**
- Lazy Loading تلقائي
- Progressive Loading (blur → واضح)
- Placeholder جميل
- Error Handling
- Responsive

---

## 🚀 كيفية الاستخدام

### 1️⃣ **رفع صورة منتج في TailorCollections**

تم تحديث `pages/TailorCollections.tsx` بالكامل:

```typescript
// الحالة
const [productImages, setProductImages] = useState(null);

// في النموذج
<ImageUpload
  productId={Date.now().toString()}
  tailorId={user.id}
  onUploadComplete={(urls) => {
    setProductImages(urls);
  }}
  onError={(error) => {
    alert(error);
  }}
/>

// عند الحفظ
const newProduct = {
  ...productData,
  image: productImages.medium, // الصورة المتوسطة
  thumbnail: productImages.thumbnail,
  fullImage: productImages.full
};
```

---

### 2️⃣ **عرض الصور مع Lazy Loading**

```tsx
import { OptimizedImage } from '../components/OptimizedImage';

// في ProductCard أو أي مكان
<OptimizedImage
  src={product.image}
  alt={product.name}
  className="w-full h-full object-cover"
  thumbnailSrc={product.thumbnail} // معاينة سريعة
/>
```

---

### 3️⃣ **رفع صورة أفاتار**

```typescript
import { storageService } from '../services/storageService';

const handleAvatarUpload = async (file: File) => {
  const url = await storageService.uploadAvatar(file, user.id);
  
  // تحديث بيانات المستخدم
  await firebaseService.updateUserProfile(user.id, { avatar: url });
};
```

---

## 📊 بنية التخزين في Firebase Storage

```
storage/
├── products/
│   ├── {tailorId}/
│   │   ├── {productId}/
│   │   │   ├── thumbnail.webp (400x400, ~100KB)
│   │   │   ├── medium.webp (800x800, ~300KB)
│   │   │   └── full.webp (1200x1200, ~800KB)
│
├── avatars/
│   └── {userId}.webp (200x200, ~50KB)
│
├── covers/
│   └── {tailorId}.webp (1200x400, ~400KB)
│
└── portfolio/
    └── {tailorId}/
        ├── {imageId}-1.webp
        ├── {imageId}-2.webp
        └── ...
```

---

## ⚡ الأداء والتحسينات

### **قبل التحسين:**
- صورة واحدة: 2-5 MB
- تحميل بطيء
- استهلاك عالي للبيانات

### **بعد التحسين:**
- 3 صور: thumbnail (100KB) + medium (300KB) + full (800KB)
- تحميل سريع
- استهلاك أقل بنسبة 80-90%

---

## 💰 تقدير التكلفة

**Firebase Storage Pricing:**
- 5GB مجاناً
- $0.026/GB بعد ذلك

**مثال:**
- 1,000 منتج × 3 صور × 400KB متوسط = **1.2GB** = مجاني ✅
- 10,000 منتج = **12GB** = **$0.18/شهر** ✅

---

## 🔒 قواعد الأمان (يجب تطبيقها)

أضف هذه القواعد في Firebase Console → Storage → Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // السماح بقراءة جميع الصور
    match /{allPaths=**} {
      allow read: if true;
    }
    
    // صور المنتجات - فقط الخياط يستطيع الرفع/الحذف
    match /products/{tailorId}/{productId}/{image} {
      allow write: if request.auth != null && request.auth.uid == tailorId;
    }
    
    // الأفاتار - فقط صاحب الحساب
    match /avatars/{userId}.webp {
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // صور الغلاف - فقط صاحب الحساب
    match /covers/{tailorId}.webp {
      allow write: if request.auth != null && request.auth.uid == tailorId;
    }
    
    // معرض الأعمال - فقط صاحب الحساب
    match /portfolio/{tailorId}/{imageId} {
      allow write: if request.auth != null && request.auth.uid == tailorId;
    }
  }
}
```

---

## 🛠️ التكامل مع المكونات الحالية

### ✅ `ProductCard` - استخدم OptimizedImage
```tsx
<OptimizedImage
  src={product.image}
  alt={product.name}
  className="w-full h-48 object-cover"
  thumbnailSrc={product.thumbnail}
/>
```

### ✅ `TailorProfile` - عرض الصور
```tsx
<OptimizedImage
  src={tailor.coverImage}
  alt="Cover"
  className="w-full h-64"
  priority={true} // صورة الغلاف مهمة
/>
```

### ✅ `Header/Footer` - الأفاتار
```tsx
<Avatar
  src={user.avatar}
  name={user.name}
  size="sm"
/>
```

---

## 📝 TODO - تحسينات مستقبلية

- [ ] إضافة رفع الصور للـ Portfolio
- [ ] دعم رفع عدة صور دفعة واحدة
- [ ] نظام Crop للصور
- [ ] معاينة الصور بـ Lightbox
- [ ] Image Optimization API (تحسين من السيرفر)

---

## 🆘 حل المشاكل الشائعة

### **خطأ: Firebase Storage not initialized**
**الحل:** تأكد من إضافة Storage Bucket في Firebase Console

### **الصور لا تظهر**
**الحل:** 
1. تحقق من قواعد الأمان
2. تأكد من رابط الصورة صحيح
3. افتح Console وشاهد الأخطاء

### **الرفع بطيء**
**الحل:** الصورة الأصلية كبيرة جداً - النظام يضغطها تلقائياً

---

## 📞 الدعم

إذا واجهت أي مشكلة، راجع:
1. Console في المتصفح (F12)
2. Firebase Console → Storage → Files
3. Firebase Console → Storage → Rules

---

**✨ تم بناؤه بـ ❤️ لتطبيق خيوط**
