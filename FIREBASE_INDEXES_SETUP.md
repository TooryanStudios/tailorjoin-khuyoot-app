# Firebase Indexes Setup Guide

## 📌 الخطوات المطلوبة

### 1. الدخول إلى Firebase Console
1. افتح [Firebase Console](https://console.firebase.google.com/)
2. اختر مشروع Khuyoot App
3. اذهب إلى **Firestore Database**
4. اضغط على تبويب **Indexes**

---

## 🔍 Composite Indexes المطلوبة

### Index 1: Reviews by Target
```
Collection ID: reviews
Fields indexed:
  - targetType (Ascending)
  - targetId (Ascending)
  - date (Descending)
Query scope: Collection
```

**كيفية الإضافة:**
1. اضغط "Create Index"
2. Collection ID: `reviews`
3. أضف الحقول بالترتيب:
   - `targetType` → Ascending
   - `targetId` → Ascending
   - `date` → Descending
4. اضغط "Create"

---

### Index 2: Reviews by User
```
Collection ID: reviews
Fields indexed:
  - userId (Ascending)
  - targetType (Ascending)
  - targetId (Ascending)
Query scope: Collection
```

---

### Index 3: Advertisements (Active)
```
Collection ID: advertisements
Fields indexed:
  - status (Ascending)
  - endDate (Ascending)
Query scope: Collection
```

**كيفية الإضافة:**
1. اضغط "Create Index"
2. Collection ID: `advertisements`
3. أضف الحقول بالترتيب:
   - `status` → Ascending
   - `endDate` → Ascending
4. اضغط "Create"

**أو استخدم الرابط المباشر:**
```
https://console.firebase.google.com/v1/r/project/khuyoot-app01/firestore/indexes?create_composite=ClRwcm9qZWN0cy9raHV5b290LWFwcDAxL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9hZHZlcnRpc2VtZW50cy9pbmRleGVzL18QARoKCgZzdGF0dXMQARoLCgdlbmREYXRlEAE
```

---

### Index 4: Portfolio by Owner
```
Collection ID: portfolio
Fields indexed:
  - ownerId (Ascending)
  - createdAt (Descending)
Query scope: Collection
```

---

### Index 5: Wishlists by User
```
Collection ID: wishlists
Fields indexed:
  - userId (Ascending)
  - addedAt (Descending)
Query scope: Collection
```

---

### Index 5: Wishlists - User + Product
```
Collection ID: wishlists
Fields indexed:
  - userId (Ascending)
  - productId (Ascending)
Query scope: Collection
```

---

### Index 6: Collections by User
```
Collection ID: collections
Fields indexed:
  - userId (Ascending)
  - createdAt (Descending)
Query scope: Collection
```

---

### Index 7: Product Likes
```
Collection ID: productLikes
Fields indexed:
  - userId (Ascending)
  - productId (Ascending)
Query scope: Collection
```

---

### Index 8: Orders by User
```
Collection ID: orders
Fields indexed:
  - userId (Ascending)
  - orderDate (Descending)
Query scope: Collection
```

---

### Index 9: Orders by Tailor
```
Collection ID: orders
Fields indexed:
  - tailorId (Ascending)
  - orderDate (Descending)
Query scope: Collection
```

---

### Index 10: Orders by Status
```
Collection ID: orders
Fields indexed:
  - tailorId (Ascending)
  - status (Ascending)
  - orderDate (Descending)
Query scope: Collection
```

---

## 🚀 الطريقة السريعة (Automatic)

عند تشغيل التطبيق، إذا حاولت تنفيذ query يحتاج index، سيظهر خطأ في Console يحتوي على رابط مباشر لإنشاء الـ Index المطلوب:

```
FirebaseError: The query requires an index. You can create it here: https://console.firebase.google.com/...
```

فقط اضغط على الرابط وسيتم إنشاء الـ Index تلقائياً!

---

## ✅ التحقق من الـ Indexes

بعد إنشاء الـ Indexes:
1. اذهب إلى Firestore → Indexes
2. تأكد من أن جميع الـ Indexes في حالة **"Enabled"** (خضراء)
3. قد يستغرق إنشاء بعض الـ Indexes بضع دقائق

---

## 📝 ملاحظات مهمة

- ⏱️ **وقت الإنشاء**: قد يستغرق Index جديد من 1-5 دقائق ليصبح جاهزاً
- 🔄 **التحديث التلقائي**: Firebase يقترح Indexes تلقائياً عند الحاجة
- 💰 **التكلفة**: Indexes مجانية في Free Plan (حتى 200 indexes)
- 🔍 **الأداء**: Indexes ضرورية لسرعة الاستعلامات

---

## 🐛 حل المشاكل

### المشكلة: Query تفشل برسالة "requires an index"
**الحل:**
1. انسخ الرابط من رسالة الخطأ
2. افتح الرابط في المتصفح
3. اضغط "Create Index"
4. انتظر حتى يكتمل الإنشاء

### المشكلة: Index عالق في "Building"
**الحل:**
- انتظر 5-10 دقائق
- أعد تحميل الصفحة
- إذا استمرت المشكلة، احذف الـ Index وأعد إنشاءه

### المشكلة: Error: "Index already exists"
**الحل:**
- تحقق من قائمة Indexes الموجودة
- قد يكون الـ Index موجود بالفعل

---

### Index 8: Notifications by User (NEW - Dec 2025)
```
Collection ID: notifications
Fields indexed:
  - userId (Ascending)
  - createdAt (Descending)
Query scope: Collection
```

**كيفية الإضافة:**
1. اضغط "Create Index"
2. Collection ID: `notifications`
3. أضف الحقول بالترتيب:
   - `userId` → Ascending
   - `createdAt` → Descending
4. اضغط "Create"

**لماذا نحتاجه:**
هذا الـ Index مطلوب لصفحة الإشعارات، حيث نقوم بجلب إشعارات مستخدم معين مرتبة من الأحدث للأقدم.

---

## 📊 Monitoring

لمراقبة استخدام Indexes:
1. اذهب إلى Firestore → Usage
2. راقب:
   - Read operations
   - Write operations
   - Delete operations
3. راجع Performance في Firebase Console

---

تم إنشاء هذا الدليل بواسطة GitHub Copilot 🤖
