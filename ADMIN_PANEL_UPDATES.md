# Admin Panel: Homepage Product Categories Setup

Purpose: Control the product categories used across the homepage filters and the Tailor Join flow.

Where to find:
- Admin → Settings → Homepage Settings

What’s new:
- A "تصنيفات المنتجات" section lets you edit categories via a simple CSV format: `id:name` pairs, separated by commas.
- Example: `dishdasha:الدشاديش, jacket:الجاكيت, abaya:العبايات`

How it works:
- Saving updates writes to global settings field `productCategories`.
- The homepage categories filter and the Tailor Join product category selector both read from `productCategories`.
- If no categories are set, a default list is used.

Best practices:
- Keep `id` short and lowercase (no spaces). This is used for filtering and URLs.
- Use `name` for the Arabic display label.
- Avoid duplicates; ensure each `id` is unique.

Troubleshooting:
- If products don’t appear when filtering, verify:
  - The product was saved with a category (join flow requires it).
  - The category `id` matches one of the configured categories.
  - The product document has `isDraft: false`.
- If the Tailor Join category list is empty, re-open Admin Homepage Settings and save categories.

Notes:
- Existing products won’t be auto-migrated; their `category` stays unchanged.
- You can change categories any time — new products will use the updated list.
# تحديثات لوحة التحكم الرئيسية - Admin Panel Updates

## التحديثات المنفذة

### 1. تحديث Sidebar (القائمة الجانبية)

#### الميزات المضافة:
- ✅ إضافة قسم جديد "المحلات التجارية" يضم:
  - **جميع محلات الخياطة** (تم تغيير من "الخياطين")
  - **البوتيكات** (جديد)
  - **المحلات الأخرى** (محلات أقمشة ومستلزمات خياطة) (جديد)

- ✅ عدادات المحلات المعلقة (Pending Count Badges):
  - يظهر عداد بجانب كل فئة
  - اللون: كهرماني (amber) للفت الانتباه
  - يحسب تلقائياً من `approvalStatus === 'pending'`
  - يختفي العداد عندما يكون العدد 0

- ✅ نقل "إدارة المتجر" لقسم منفصل

#### التعديلات الفنية:
```typescript
// Props جديدة
interface SidebarProps {
  tailorsCount?: number;      // عدد الخياطين المعلقين
  boutiquesCount?: number;    // عدد البوتيكات المعلقة
  shopsCount?: number;        // عدد المحلات الأخرى المعلقة
}

// SidebarItem مع دعم العدادات
const SidebarItem = ({ id, icon, label, count }) => (
  // عرض badge مع العدد إذا كان أكبر من 0
)
```

---

### 2. مكون إدارة المحلات (ShopsManagement)

#### الموقع:
`src/admin/shops/ShopsManagement.tsx`

#### الميزات:
- ✅ **عرض المحلات حسب النوع** (tailor, boutique, fabric_store, sewing_supplies)
- ✅ **فلاتر حالة الموافقة**:
  - الكل
  - معلق (Pending)
  - موافق عليه (Approved)
  - مرفوض (Rejected)

- ✅ **إحصائيات في الأعلى**:
  - عدد المحلات المعلقة
  - عدد المحلات الموافق عليها

- ✅ **كروت عرض المحلات** تحتوي على:
  - صورة الغلاف
  - شعار المحل
  - اسم المحل
  - الموقع
  - رقم التواصل
  - تاريخ الانضمام
  - حالة الموافقة (badge ملون)

- ✅ **أزرار الإجراءات للمحلات المعلقة**:
  - ✅ **موافقة** (Approve): يرسل إشعار للمحل + يحدث الحالة
  - ❌ **رفض** (Reject): يطلب سبب الرفض + يرسل إشعار
  - 💬 **طلب معلومات**: يرسل رسالة للمحل لطلب معلومات إضافية

- ✅ **عرض التفاصيل** (Modal):
  - معلومات كاملة عن المحل
  - معرض الأعمال (Portfolio)
  - البيانات التواصلية
  - التقييم والمتابعون

#### التعديلات الفنية:
```typescript
interface ShopsManagementProps {
  shops: Shop[];
  shopType: ShopType;
  title: string;
}

// الإجراءات
handleApprove(shop)      // موافقة + إشعار
handleReject(shop)       // رفض + إشعار
handleRequestInfo(shop)  // طلب معلومات + إشعار
```

---

### 3. تحديث AdminApp.tsx

#### البيانات:
- ✅ إضافة `allShops: Shop[]` لتخزين جميع المحلات
- ✅ استخدام `getAllShops()` لتحميل البيانات
- ✅ حساب العدادات تلقائياً:
  ```typescript
  const pending = shopsData.filter(t => t.approvalStatus === 'pending');
  setTailorsCount(pending.filter(t => t.shopType === 'tailor').length);
  setBoutiquesCount(pending.filter(t => t.shopType === 'boutique').length);
  setShopsCount(pending.filter(t => t.shopType === 'fabric_store' || ...));
  ```

#### الأقسام الجديدة:
```typescript
type AdminSection = 
  | 'tailors'    // جميع محلات الخياطة
  | 'boutiques'  // البوتيكات
  | 'shops'      // محلات أقمشة ومستلزمات
  | 'store'      // إدارة المتجر
```

---

### 4. بيانات تجريبية (Mock Data)

#### الموقع:
`services/mockService.ts`

#### الإضافات:
- ✅ **MOCK_SHOPS** مع 6 محلات نموذجية:
  - 2 بوتيكات (1 موافق + 1 معلق)
  - 2 محلات أقمشة (1 موافق + 1 معلق)
  - 1 محل مستلزمات خياطة (موافق)

- ✅ دالة **getAllShops()**:
  ```typescript
  export const getAllShops = async (): Promise<Shop[]> => {
    const allShops = [...MOCK_TAILORS, ...MOCK_SHOPS];
    return allShops;
  }
  ```

#### البيانات الكاملة لكل محل:
```typescript
{
  id, name, shopType, rating, location, region,
  image, coverImage, description, followers,
  isVerified, approvalStatus, bio, contactNumber,
  portfolio, hasOnlineStore, deliveryAvailable,
  workingHours, services, brands,
  createdAt, updatedAt
}
```

---

## الميزات المتبقية (TODO)

### 1. صفحة إدارة المتجر المنفصلة
- [ ] إنشاء صفحة مستقلة `/store-admin`
- [ ] نظام مصادقة منفصل لفريق المتجر
- [ ] إدارة المنتجات والمخزون
- [ ] إدارة الطلبات الخاصة بالمتجر

### 2. ملف تعريف الخياط المحسّن
- [ ] 3 تبويبات:
  - **الطلبات**: قائمة بجميع الطلبات
  - **الإعدادات**: معلومات المحل + أوقات العمل
  - **لوحة المعلومات**: إحصائيات وتقارير
- [ ] إجراءات مباشرة: قبول/رفض/تواصل

### 3. ميزة التأجير للبوتيكات
- [ ] إضافة خيار "للإيجار" في واجهة Shop
- [ ] اختيار مدة التأجير
- [ ] تسعير مختلف (إيجار vs شراء)
- [ ] نظام حجز وإرجاع

### 4. نظام الموافقات المتقدم
- [ ] تكامل مع Firebase Firestore
- [ ] إشعارات فورية (FCM)
- [ ] سجل تاريخ الموافقات/الرفض
- [ ] طلب معلومات محددة (صور، مستندات، إلخ)

---

## المسارات والروابط

### الروابط الداخلية:
- `/admin` - لوحة التحكم الرئيسية
- `/admin#tailors` - محلات الخياطة
- `/admin#boutiques` - البوتيكات
- `/admin#shops` - المحلات الأخرى
- `/admin#store` - إدارة المتجر

### الأيقونات المستخدمة:
- `Scissors` - الخياطين
- `Store` - البوتيكات والمتجر
- `Building2` - المحلات الأخرى

---

## التحسينات المستقبلية

1. **البحث والفرز**:
   - بحث بالاسم/الموقع
   - فرز حسب التاريخ/التقييم

2. **الإحصائيات المتقدمة**:
   - رسوم بيانية للموافقات
   - تقارير شهرية
   - معدلات القبول/الرفض

3. **التواصل الفوري**:
   - دردشة مباشرة مع أصحاب المحلات
   - إشعارات بالوقت الفعلي

4. **التحقق من الهوية**:
   - رفع المستندات الرسمية
   - التحقق من السجل التجاري
   - علامة "موثق" للمحلات المعتمدة

---

## التعليمات البرمجية الرئيسية

### استدعاء البيانات:
```typescript
useEffect(() => {
  getAllShops().then((shopsData) => {
    setAllShops(shopsData);
    const pending = shopsData.filter(t => t.approvalStatus === 'pending');
    setTailorsCount(pending.filter(t => t.shopType === 'tailor').length);
    // ... حساب باقي العدادات
  });
}, []);
```

### عرض المحلات:
```typescript
case 'tailors': 
  return <ShopsManagement 
    shops={allShops} 
    shopType="tailor" 
    title="جميع محلات الخياطة" 
  />;
```

### إرسال الإشعارات:
```typescript
createNotification(
  shop.id,
  'info',
  'تمت الموافقة على محلك',
  `تم الموافقة على "${shop.name}" وأصبح مرئياً للعملاء الآن`
);
```

---

## الملفات المعدلة

1. ✅ `src/admin/components/Sidebar.tsx`
2. ✅ `src/admin/AdminApp.tsx`
3. ✅ `src/admin/shops/ShopsManagement.tsx` (جديد)
4. ✅ `services/mockService.ts`
5. ✅ `types.ts` (تم التحديث مسبقاً)

---

## ملاحظات مهمة

- جميع الإجراءات حالياً تعتمد على `localStorage` و `alert`
- في الإنتاج، يجب استبدال هذا بـ:
  - Firebase Firestore للبيانات
  - Firebase Cloud Messaging للإشعارات
  - واجهة تأكيد مخصصة (Modal) بدلاً من `alert`/`prompt`

- العدادات يتم حسابها في كل مرة يتم فيها تحميل البيانات
- البيانات التجريبية تحتوي على حالات مختلفة للاختبار

---

## الاختبار

للاختبار:
1. افتح لوحة التحكم: `http://localhost:5173/#/admin`
2. سجل دخول كمسؤول: `admin@khuyoot.com`
3. تحقق من العدادات في القائمة الجانبية
4. انتقل لكل قسم واختبر:
   - عرض المحلات
   - الفلاتر
   - الموافقة/الرفض
   - طلب المعلومات
   - عرض التفاصيل

---

✅ **التحديث مكتمل بنجاح!**
