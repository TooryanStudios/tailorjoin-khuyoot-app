# نظام التقييمات والتفاعل مع المنتجات - دليل الاستخدام

## 🎯 الميزات المضافة

تم إضافة نظام كامل للتفاعل مع المنتجات والمحلات يشمل:

### ✅ 1. نظام التقييمات (Reviews)
- تقييم المحلات (الخياطين/البوتيكات/محلات الأقمشة)
- تقييم المنتجات
- عرض متوسط التقييمات
- توزيع التقييمات (5 نجوم، 4 نجوم، إلخ)
- إضافة صور مع التقييم
- تمييز المشترين الموثقين
- زر "مفيد" للتقييمات

### ✅ 2. معرض الأعمال (Portfolio)
- إضافة صور وفيديوهات للأعمال
- إدارة كاملة للمعرض
- إحصائيات (المشاهدات والإعجابات)
- الوسوم (Tags) للتصنيف
- واجهة مستخدم احترافية

### ✅ 3. تعديل المنتجات
- تعديل جميع معلومات المنتج
- تغيير الصور
- إضافة وصف تفصيلي
- إضافة وسوم
- واجهة تعديل سهلة

### ✅ 4. التفاعل مع المنتجات
- الإعجاب (Like) بالمنتجات
- إضافة للـ Wishlist
- إنشاء مجموعات (Collections)
- مشاركة المنتجات
- عداد الإعجابات في الوقت الفعلي

---

## 📁 الملفات المضافة

### Services (الخدمات)
1. **`services/reviewService.ts`** - خدمة التقييمات
   - `addReview()` - إضافة تقييم
   - `getReviews()` - جلب التقييمات
   - `deleteReview()` - حذف تقييم
   - `markReviewHelpful()` - تمييز تقييم كمفيد
   - `hasUserReviewed()` - التحقق من وجود تقييم

2. **`services/interactionService.ts`** - خدمة التفاعلات
   - Portfolio: `addPortfolioItem()`, `getPortfolioItems()`, `deletePortfolioItem()`
   - Wishlist: `addToWishlist()`, `removeFromWishlist()`, `isInWishlist()`
   - Collections: `createCollection()`, `addProductToCollection()`
   - Likes: `likeProduct()`, `unlikeProduct()`, `hasLikedProduct()`

### Components (المكونات)
3. **`components/ProductActions.tsx`** - أزرار التفاعل
   - زر الإعجاب (Like)
   - زر الحفظ (Wishlist)
   - زر المشاركة
   - نسخة مدمجة (compact) للبطاقات الصغيرة

4. **`components/ReviewForm.tsx`** - نموذج إضافة تقييم
   - اختيار عدد النجوم
   - كتابة التعليق
   - التحقق من الصلاحية
   - رسائل الخطأ

5. **`components/ReviewsList.tsx`** - عرض قائمة التقييمات
   - ملخص التقييمات
   - متوسط التقييم
   - توزيع النجوم
   - قائمة التقييمات مع الصور
   - زر "مفيد"

### Pages (الصفحات)
6. **`pages/PortfolioManagement.tsx`** - صفحة إدارة معرض الأعمال
   - رفع صور وفيديوهات
   - عرض الإحصائيات
   - حذف العناصر
   - إضافة الوسوم والأوصاف

### Updates (التحديثات)
7. **`types.ts`** - تحديث الأنواع
   - `Review` - واجهة التقييم
   - `PortfolioItem` - عنصر المعرض
   - `WishlistItem` - عنصر قائمة الأمنيات
   - `ProductCollection` - مجموعة المنتجات
   - `ProductLike` - إعجاب المنتج
   - تحديث `Product` و `Shop` بحقول جديدة

8. **`pages/TailorCollections.tsx`** - تحديثات
   - إضافة زر التعديل
   - نموذج تعديل كامل
   - حقول جديدة (وصف، وسوم)
   - عرض التفاصيل الإضافية

9. **`components/ProductCard.tsx`** - تحديثات
   - إضافة أزرار اللايك والحفظ
   - عرض عدد الإعجابات

---

## 🚀 كيفية الاستخدام

### 1. نظام التقييمات

#### إضافة تقييم لمنتج:
```tsx
import ReviewForm from '../components/ReviewForm';

<ReviewForm
  targetType="product"
  targetId={product.id}
  targetName={product.name}
  onSuccess={(review) => {
    console.log('تم إضافة التقييم:', review);
  }}
  onCancel={() => {
    // إلغاء التقييم
  }}
/>
```

#### عرض التقييمات:
```tsx
import ReviewsList from '../components/ReviewsList';

<ReviewsList
  targetType="product"
  targetId={product.id}
  showAddButton={true}
  onAddReview={() => {
    // فتح نموذج التقييم
  }}
/>
```

### 2. أزرار التفاعل

#### في صفحة المنتج:
```tsx
import ProductActions from '../components/ProductActions';

<ProductActions
  productId={product.id}
  likes={product.likes}
  onLikeChange={(newCount) => {
    // تحديث عدد الإعجابات
  }}
/>
```

#### في بطاقة المنتج (compact):
```tsx
<ProductActions
  productId={product.id}
  likes={product.likes}
  compact={true}
/>
```

### 3. معرض الأعمال

الوصول للصفحة:
- من حساب الخياط/البوتيك/المحل
- الرابط: `/portfolio-management`

الميزات:
- رفع صور (يتم رفعها على Firebase Storage)
- إضافة روابط فيديوهات (YouTube/Vimeo)
- إضافة عنوان ووصف ووسوم
- عرض الإحصائيات (مشاهدات، إعجابات)
- حذف العناصر

### 4. تعديل المنتجات

في صفحة "إدارة منتجاتي":
1. اضغط على زر التعديل ✏️
2. قم بتعديل المعلومات
3. يمكنك تغيير الصورة (اختياري)
4. اضغط "تحديث"

الحقول القابلة للتعديل:
- الاسم
- السعر
- مدة الإنجاز
- الفئة
- الوصف (جديد)
- الوسوم (جديد)
- الصورة (اختياري)

---

## 🗄️ قاعدة البيانات Firebase

### Collections المطلوبة:

1. **`reviews`**
```typescript
{
  id: string
  userId: string
  userName: string
  userAvatar?: string
  rating: number (1-5)
  comment: string
  targetType: 'shop' | 'product'
  targetId: string
  helpful: number
  verified: boolean
  images?: string[]
  date: string
  createdAt: Timestamp
}
```

2. **`portfolio`**
```typescript
{
  id: string
  ownerId: string
  ownerName: string
  type: 'image' | 'video'
  mediaUrl: string
  thumbnailUrl?: string
  title: string
  description?: string
  tags?: string[]
  likes: number
  views: number
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

3. **`wishlists`**
```typescript
{
  id: string
  userId: string
  productId: string
  addedAt: Timestamp
}
```

4. **`collections`**
```typescript
{
  id: string
  userId: string
  name: string
  description?: string
  products: string[]
  isPublic: boolean
  coverImage?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

5. **`productLikes`**
```typescript
{
  id: string
  userId: string
  productId: string
  likedAt: Timestamp
}
```

### Indexes المطلوبة:

في Firebase Console → Firestore → Indexes:

1. **reviews**
   - `targetType` (Ascending) + `targetId` (Ascending) + `date` (Descending)
   - `userId` (Ascending) + `targetType` (Ascending) + `targetId` (Ascending)

2. **portfolio**
   - `ownerId` (Ascending) + `createdAt` (Descending)

3. **wishlists**
   - `userId` (Ascending) + `addedAt` (Descending)
   - `userId` (Ascending) + `productId` (Ascending)

4. **collections**
   - `userId` (Ascending) + `createdAt` (Descending)

5. **productLikes**
   - `userId` (Ascending) + `productId` (Ascending)

---

## 🔐 قواعد الأمان Firebase

يجب تحديث `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // التحقق من تسجيل الدخول
    function isSignedIn() {
      return request.auth != null;
    }
    
    // التحقق من الملكية
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    
    // التقييمات
    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if isSignedIn();
      allow update: if isOwner(resource.data.userId);
      allow delete: if isOwner(resource.data.userId);
    }
    
    // معرض الأعمال
    match /portfolio/{itemId} {
      allow read: if true;
      allow create: if isSignedIn();
      allow update: if isOwner(resource.data.ownerId);
      allow delete: if isOwner(resource.data.ownerId);
    }
    
    // قوائم الأمنيات
    match /wishlists/{wishlistId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if isSignedIn();
      allow delete: if isOwner(resource.data.userId);
    }
    
    // المجموعات
    match /collections/{collectionId} {
      allow read: if resource.data.isPublic == true || isOwner(resource.data.userId);
      allow create: if isSignedIn();
      allow update: if isOwner(resource.data.userId);
      allow delete: if isOwner(resource.data.userId);
    }
    
    // الإعجابات
    match /productLikes/{likeId} {
      allow read: if true;
      allow create: if isSignedIn();
      allow delete: if isOwner(resource.data.userId);
    }
  }
}
```

---

## 📊 الإحصائيات والمقاييس

### ما تم إضافته:
- ✅ 5 ملفات خدمات جديدة
- ✅ 3 مكونات React جديدة
- ✅ 1 صفحة جديدة (معرض الأعمال)
- ✅ تحديث 3 ملفات موجودة
- ✅ 7 أنواع TypeScript جديدة
- ✅ 5 Firebase Collections
- ✅ ~1,500 سطر من الكود

### الوظائف الرئيسية:
1. **نظام التقييمات الكامل** - 15 وظيفة
2. **نظام التفاعل** - 18 وظيفة
3. **معرض الأعمال** - صفحة كاملة
4. **تعديل المنتجات** - ميزة متكاملة
5. **أزرار التفاعل** - مكونات قابلة لإعادة الاستخدام

---

## 🎨 التحسينات البصرية

- تصميم عصري ومتجاوب
- أيقونات من Lucide React
- ألوان متناسقة (Purple/Blue theme)
- رسوم متحركة (Transitions & Animations)
- Dark Mode Support (في معظم المكونات)
- RTL Support كامل

---

## 🔄 الخطوات التالية (اختيارية)

1. **إضافة صفحة Wishlist للمستخدم**
2. **إضافة صفحة Collections (المجموعات)**
3. **إضافة إشعارات للتقييمات الجديدة**
4. **إضافة تصفية التقييمات (حسب النجوم)**
5. **إضافة الرد على التقييمات (من صاحب المحل)**
6. **إضافة معرض الأعمال في صفحة الملف الشخصي**
7. **إضافة صفحة عرض المنتج الكاملة**

---

## 🐛 استكشاف الأخطاء

### المشكلة: التقييمات لا تظهر
- تأكد من وجود Firebase Indexes
- تحقق من Console للأخطاء
- تأكد من وجود البيانات في Firestore

### المشكلة: لا يمكن الإعجاب بالمنتج
- تأكد من تسجيل الدخول
- تحقق من Firebase Rules
- تأكد من وجود `productLikes` collection

### المشكلة: معرض الأعمال لا يقبل الرفع
- تحقق من Firebase Storage Rules
- تأكد من رفع `storage.rules`
- تحقق من حجم الصور (حد أقصى 10MB)

---

## 📞 الدعم

في حالة وجود أي مشاكل أو استفسارات:
1. راجع Console للأخطاء
2. تحقق من Firebase Console
3. راجع هذا الدليل
4. تواصل مع المطور

---

تم إنشاء هذا النظام بواسطة GitHub Copilot 🤖
التاريخ: ديسمبر 2025
