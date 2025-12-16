# نظام الطلبات الحقيقي - دليل التفعيل والاستخدام

## 📋 نظرة عامة

تم إكمال تحويل التطبيق من استخدام بيانات وهمية (MOCK_ORDERS) إلى نظام طلبات حقيقي متكامل يعمل مع Firebase Firestore.

---

## ✅ الملفات التي تم إنشاؤها

### 1. **services/orderService.ts** (343 سطر)
خدمة إدارة الطلبات الكاملة مع جميع العمليات:

**الوظائف الرئيسية:**
- `createOrder()` - إنشاء طلب تفصيل جديد
- `getUserOrders(userId)` - الحصول على طلبات العميل
- `getTailorOrders(tailorId, status?)` - الحصول على طلبات الخياط (مع تصفية اختيارية)
- `getOrderById(orderId)` - الحصول على تفاصيل طلب محدد
- `updateOrderStatus(orderId, status)` - تحديث حالة الطلب
- `acceptOrder(orderId, notes?)` - قبول الطلب من الخياط
- `rejectOrder(orderId, reason)` - رفض الطلب مع السبب
- `updateOrder(orderId, data)` - تحديث بيانات الطلب (للعميل قبل القبول)
- `deleteOrder(orderId)` - حذف الطلب
- `sendNoteToCustomer(orderId, note, isImportant)` - إرسال ملاحظة للعميل
- `updateOrderProgress(orderId, stage, notes?)` - تحديث مراحل التنفيذ
- `getTailorOrdersStats(tailorId)` - إحصائيات الطلبات للوحة التحكم

**دورة حياة الطلب:**
```
pending (قيد الانتظار)
  ↓
accept/reject (قبول/رفض من الخياط)
  ↓
measuring (أخذ المقاسات)
  ↓
cutting (قص)
  ↓
sewing (خياطة)
  ↓
ready (جاهز)
  ↓
delivered (تم التسليم)
```

**الحماية والأمان:**
- التحقق من ملكية الطلب
- منع التعديل بعد قبول الخياط
- التحقق من الصلاحيات لكل عملية
- حفظ سجل التعديلات (timestamps)

---

## 🔄 الملفات التي تم تحديثها

### 1. **pages/TailorOrders.tsx**
الصفحة الرئيسية لإدارة الطلبات للخياط.

**التحسينات:**
- ✅ تحميل الطلبات الحقيقية من Firestore
- ✅ حالة تحميل أولية مع spinner
- ✅ زر تحديث البيانات
- ✅ قبول/رفض الطلبات مع إشعارات
- ✅ تحديث حالة الطلب (dropdown)
- ✅ إرسال ملاحظات للعميل (modal)
- ✅ دعم التفاوض على السعر
- ✅ حالة فارغة عند عدم وجود طلبات

**الوظائف الجديدة:**
```typescript
loadOrders() // تحميل طلبات الخياط
handleRefresh() // تحديث القائمة
acceptOrder(id) // قبول الطلب
rejectOrder(id) // رفض الطلب (مع سبب)
handleSendNote() // إرسال ملاحظة
updateStatus(id, status) // تحديث مرحلة التنفيذ
handleNegotiation(id, accepted) // الرد على التفاوض
```

### 2. **pages/accounts/UserAccount.tsx**
حساب العميل - عرض طلباته.

**التحسينات:**
- ✅ تحميل طلبات المستخدم من Firestore
- ✅ حالة تحميل أثناء جلب البيانات
- ✅ معالجة الأخطاء

### 3. **pages/TailorDashboard.tsx**
لوحة تحكم الخياط.

**التحسينات:**
- ✅ تحميل طلبات الخياط
- ✅ يمكن استخدام `getTailorOrdersStats()` لعرض الإحصائيات
- ✅ حالة تحميل

### 4. **pages/accounts/TailorAccount.tsx**
حساب الخياط المفصل.

**التحسينات:**
- ✅ تحميل الطلبات من Firestore
- ✅ حالة تحميل
- ✅ إزالة الاعتماد على MOCK_ORDERS

### 5. **pages/accounts/BoutiqueAccount.tsx**
حساب البوتيك.

**التحسينات:**
- ✅ تحميل طلبات البوتيك
- ✅ حالة تحميل أولية
- ✅ دالة `loadOrders()` async

### 6. **pages/accounts/ShopAccount.tsx**
حساب المحل.

**التحسينات:**
- ✅ تحميل الطلبات من Firebase
- ✅ استخدام `getTailorOrders()`
- ✅ معالجة async

### 7. **services/firebase.ts**
تصدير `db` للاستخدام في الخدمات الأخرى.

**التعديل:**
```typescript
export { db }; // تصدير قاعدة البيانات
```

### 8. **pages/accounts/FabricStoreAccount.tsx**
تم تعطيل هذه الصفحة (الدور غير مستخدم حالياً).

---

## 🗄️ هيكل البيانات في Firestore

### مجموعة `orders`

```typescript
{
  id: string,
  userId: string,              // معرف العميل
  tailorId: string,            // معرف الخياط
  productId: string,           // المنتج المطلوب
  productName: string,
  productImage: string,
  price: number,               // السعر النهائي
  status: OrderStatus,         // الحالة الحالية
  orderDate: string,           // تاريخ الطلب
  
  // التفصيل
  measurements?: object,       // المقاسات
  customizations?: object,     // التخصيصات
  notes?: string,              // ملاحظات العميل
  
  // التفاوض
  requestedPrice?: number,     // السعر المقترح من العميل
  negotiationStatus?: 'none' | 'requested' | 'accepted' | 'rejected',
  
  // التتبع
  acceptedByTailor?: boolean,
  acceptedAt?: string,
  rejectedAt?: string,
  rejectReason?: string,
  deliveredAt?: string,
  
  // الملاحظات من الخياط
  tailorNotes?: string,
  
  // الطوابع الزمنية
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### الفهارس المطلوبة (Composite Indexes)

يجب إنشاء الفهارس التالية في Firebase Console:

1. **orders** - `userId` + `orderDate` (desc)
2. **orders** - `tailorId` + `orderDate` (desc)
3. **orders** - `tailorId` + `status` + `orderDate` (desc)

**طريقة الإنشاء السريعة:**
- شغّل التطبيق
- حاول تحميل الطلبات
- ستظهر رسالة خطأ مع رابط
- اضغط على الرابط، سيتم إنشاء الفهرس تلقائياً

أو راجع: `FIREBASE_INDEXES_SETUP.md` للإنشاء اليدوي.

---

## 🔒 قواعد الأمان في Firestore

تأكد من تحديث `firestore.rules`:

```javascript
match /orders/{orderId} {
  allow read: if request.auth != null && (
    resource.data.userId == request.auth.uid ||
    resource.data.tailorId == request.auth.uid ||
    isAdmin()
  );
  
  allow create: if request.auth != null &&
    request.resource.data.userId == request.auth.uid;
  
  allow update: if request.auth != null && (
    resource.data.userId == request.auth.uid ||
    resource.data.tailorId == request.auth.uid ||
    isAdmin()
  );
  
  allow delete: if request.auth != null && (
    resource.data.userId == request.auth.uid ||
    isAdmin()
  );
}
```

**للنشر:**
```bash
firebase deploy --only firestore:rules
```

---

## 🚀 خطوات التفعيل

### 1. تأكد من تشغيل Firebase
```bash
# تأكد من وجود ملف .env
VITE_FIREBASE_API_KEY=your-key
VITE_FIREBASE_AUTH_DOMAIN=your-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
# ... الخ
```

### 2. انشر قواعد Firestore
```bash
firebase deploy --only firestore:rules
```

### 3. أنشئ الفهارس
- شغّل التطبيق
- حاول إنشاء طلب أو عرض الطلبات
- اتبع روابط الأخطاء لإنشاء الفهارس

### 4. اختبر دورة الحياة الكاملة

**كعميل:**
1. ادخل على صفحة منتج
2. اضغط "اطلب تفصيل هذا المنتج"
3. أدخل المقاسات
4. أرسل الطلب

**كخياط:**
1. ادخل `/tailor-orders`
2. شاهد الطلب الجديد
3. اقبل الطلب أو ارفضه
4. حدث الحالة خلال المراحل
5. أرسل ملاحظات للعميل

**كعميل (مرة أخرى):**
1. شاهد حالة الطلب محدثة
2. اقرأ ملاحظات الخياط

---

## 📊 استخدام الإحصائيات

```typescript
import { getTailorOrdersStats } from '../services/orderService';

// في لوحة تحكم الخياط
const stats = await getTailorOrdersStats(tailorId);

console.log(stats);
/*
{
  total: 45,
  pending: 5,
  inProgress: 10,    // measuring, cutting, sewing
  completed: 25,     // delivered
  rejected: 5
}
*/
```

---

## 🐛 استكشاف الأخطاء

### خطأ: "Missing index"
**الحل:** اضغط على رابط الخطأ في الكونسول لإنشاء الفهرس.

### خطأ: "Permission denied"
**الحل:** تأكد من نشر `firestore.rules` الجديدة.

### لا تظهر الطلبات
**الحل:** 
- تأكد من تسجيل الدخول
- افتح Network tab وشاهد طلبات Firestore
- تأكد من وجود طلبات فعلاً في Firebase Console

### خطأ: "db is not exported"
**الحل:** تأكد من وجود `export { db };` في `services/firebase.ts`.

---

## 🔄 الفرق بين النظام القديم والجديد

| الميزة | النظام القديم | النظام الجديد |
|--------|---------------|---------------|
| مصدر البيانات | `MOCK_ORDERS` في الذاكرة | Firebase Firestore |
| البقاء | تُفقد عند إعادة التحميل | دائمة |
| المزامنة | لا يوجد | تحديث فوري |
| الحماية | لا يوجد | قواعد Firestore |
| الإشعارات | وهمية | حقيقية مع Firebase |
| التعاون | غير ممكن | متعدد المستخدمين |

---

## 📝 ملاحظات مهمة

1. **التوافق العكسي:** تم الحفاظ على جميع الواجهات البرمجية (interfaces).
2. **معالجة الأخطاء:** كل دالة تحتوي على `try/catch` مع console.error.
3. **Loading States:** جميع الصفحات تعرض حالة تحميل أثناء جلب البيانات.
4. **Empty States:** رسائل واضحة عند عدم وجود طلبات.
5. **Real-time:** يمكن إضافة `onSnapshot()` لاحقاً للتحديثات الفورية.

---

## 🎯 المهام المتبقية (اختيارية)

- [ ] إضافة Real-time updates باستخدام `onSnapshot()`
- [ ] نظام إشعارات push لتحديثات الطلبات
- [ ] صفحة تفاصيل الطلب المخصصة
- [ ] تصدير الطلبات (CSV/PDF)
- [ ] إحصائيات متقدمة (charts)
- [ ] بحث وتصفية الطلبات
- [ ] أرشفة الطلبات القديمة
- [ ] نظام تقييم بعد التسليم

---

## 📚 موارد إضافية

- [Firebase Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [FIREBASE_INDEXES_SETUP.md](./FIREBASE_INDEXES_SETUP.md)
- [INTERACTION_SYSTEM_GUIDE.md](./INTERACTION_SYSTEM_GUIDE.md)

---

## ✅ Checklist التفعيل

```
[x] إنشاء orderService.ts
[x] تحديث TailorOrders.tsx
[x] تحديث UserAccount.tsx
[x] تحديث TailorDashboard.tsx
[x] تحديث TailorAccount.tsx
[x] تحديث BoutiqueAccount.tsx
[x] تحديث ShopAccount.tsx
[x] تصدير db من firebase.ts
[x] إزالة جميع استخدامات MOCK_ORDERS
[x] اختبار الكومبايل (لا أخطاء)
[ ] نشر firestore.rules
[ ] إنشاء Firestore indexes
[ ] اختبار دورة حياة الطلب كاملة
[ ] اختبار على الإنتاج
```

---

**تاريخ الإكمال:** 2024
**الحالة:** ✅ جاهز للنشر والاختبار
