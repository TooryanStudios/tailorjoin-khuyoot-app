# 🔥 حل مشكلة فشل رفع الصور - Firebase Storage

## المشكلة
الموقع بالكامل يفشل في رفع الصور

## السبب الرئيسي
**قواعد Firebase Storage** تمنع الرفع بدون مصادقة صحيحة

---

## ✅ ملاحظة مهمة: مشكلة CORS (للخصائص التي تستخدم Canvas مثل تبليط القماش)

إذا ظهر في Console خطأ مثل:

```
Access to image at 'https://firebasestorage.googleapis.com/...' from origin 'http://localhost:3000' has been blocked by CORS policy
No 'Access-Control-Allow-Origin' header is present
```

هذا ليس له علاقة بقواعد Storage Rules.

**السبب:** إعدادات CORS الخاصة بـ Firebase Storage / Google Cloud Storage غير مفعلة للقراءة من المتصفح (خصوصاً عند رسم الصورة على Canvas ثم تصديرها).

### ✅ الحل (مرة واحدة على الـ Bucket)

1) ثبّت Google Cloud SDK (يتضمن `gsutil`).

2) سجّل دخولك:

```powershell
gcloud auth login
```

3) طبّق ملف CORS الموجود في المشروع:

- الملف: `firebase.storage.cors.json`
- اسم الـ bucket (عادة) موجود في `.env.local` ضمن `VITE_FIREBASE_STORAGE_BUCKET`

```powershell
gsutil cors set firebase.storage.cors.json gs://YOUR_BUCKET_NAME
```

4) تحقق:

```powershell
gsutil cors get gs://YOUR_BUCKET_NAME
```

### ⚠️ تنبيه

ملف `firebase.storage.cors.json` مضبوط بشكل متساهل (`origin: ["*"]`) للتجارب.
في الإنتاج يُفضل تقييد `origin` إلى دوميناتك فقط.

---

## ✅ الحل السريع

### 1️⃣ افتح Firebase Console
https://console.firebase.google.com/

### 2️⃣ اذهب إلى Storage
- اختر مشروعك
- من القائمة الجانبية: **Storage** → **Rules**

### 3️⃣ استبدل القواعد بهذه:

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    
    // قاعدة عامة: السماح للمستخدمين المسجلين فقط
    match /{allPaths=**} {
      allow read: if true; // قراءة متاحة للجميع
      allow write: if request.auth != null; // كتابة للمستخدمين المسجلين فقط
    }
    
    // مجلد منتجات المستخدمين
    match /products/{userId}/{allImages=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // مكتبة الصور (للأدمن فقط)
    match /imageLibrary/{categoryId}/{allImages=**} {
      allow read: if true;
      allow write: if request.auth != null;
      // يمكن تقييدها للأدمن فقط لاحقاً:
      // allow write: if request.auth.token.admin == true;
    }
    
    // صور الملفات الشخصية
    match /avatars/{userId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 4️⃣ اضغط **Publish** لحفظ التغييرات

---

## 🔍 التحقق من المشكلة

افتح **Developer Console** في المتصفح (`F12`) وتحقق من:

### ❌ إذا ظهرت هذه الأخطاء:
```
FirebaseError: storage/unauthorized
FirebaseError: Missing or insufficient permissions
```
**الحل**: طبّق القواعد أعلاه ✅

### ❌ إذا ظهر:
```
FirebaseError: storage/object-not-found
```
**الحل**: تأكد من أن Storage Bucket تم تفعيله في Firebase Console

### ❌ إذا ظهر:
```
FirebaseError: storage/canceled
```
**الحل**: تحقق من حجم الصورة (يجب أن يكون أقل من 10MB)

---

## 🧪 اختبار الرفع

بعد تطبيق القواعد:

1. **سجل دخول** كمستخدم
2. اذهب إلى **إضافة منتج**
3. جرب رفع صورة
4. تأكد من ظهور الصورة في المعاينة

---

## 🔐 قواعد أكثر أماناً (للإنتاج)

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    
    // دوال مساعدة
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isValidImage() {
      return request.resource.size < 10 * 1024 * 1024 // 10MB
        && request.resource.contentType.matches('image/.*');
    }
    
    // منتجات المستخدمين
    match /products/{userId}/{imageId} {
      allow read: if true;
      allow write: if isOwner(userId) && isValidImage();
      allow delete: if isOwner(userId);
    }
    
    // مكتبة الصور
    match /imageLibrary/{categoryId}/{imageId} {
      allow read: if true;
      allow create: if isAuthenticated() && isValidImage();
      allow update, delete: if isAuthenticated();
      // للأدمن فقط: isAdmin()
    }
    
    // صور المستخدمين
    match /avatars/{userId}/{fileName} {
      allow read: if true;
      allow write: if isOwner(userId) && isValidImage();
    }
  }
}
```

---

## 📝 ملاحظات مهمة

1. ✅ **القراءة متاحة للجميع** - لعرض الصور في الموقع
2. ✅ **الكتابة للمسجلين فقط** - لحماية Storage
3. ✅ **المستخدم يرفع في مجلده فقط** - `products/{userId}/`
4. ✅ **حجم الصورة محدود** - أقل من 10MB
5. ✅ **أنواع ملفات محددة** - صور فقط (image/*)

---

## 🆘 إذا استمرت المشكلة

### تحقق من:
1. **هل تم تسجيل الدخول؟** - `user` موجود في Context
2. **هل Firebase مهيأ؟** - تحقق من Console: "Firebase initialized successfully"
3. **هل Storage Bucket صحيح؟** - في `.env`: `VITE_FIREBASE_STORAGE_BUCKET`

### تصحيح الأخطاء:
```javascript
// في TailorCollections.tsx - سطر الرفع
try {
  console.log('User ID:', user?.id);
  console.log('Storage:', storage);
  console.log('File:', file);
  
  const storageRef = ref(storage, `products/${user?.id}/${uniqueId}_${file.name}`);
  console.log('Storage Ref:', storageRef);
  
  await uploadBytes(storageRef, compressedFile);
  console.log('Upload successful!');
  
  const url = await getDownloadURL(storageRef);
  console.log('Download URL:', url);
} catch (error) {
  console.error('Upload Error:', error);
  console.error('Error Code:', error.code);
  console.error('Error Message:', error.message);
}
```

---

## 🚀 بعد الحل

سيعمل رفع الصور في:
- ✅ صفحة إضافة المنتج (TailorCollections)
- ✅ لوحة التحكم (Admin - Image Library)
- ✅ تعديل الصور في المنتجات

تم! 🎉
