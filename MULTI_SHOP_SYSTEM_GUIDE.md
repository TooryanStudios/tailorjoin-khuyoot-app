# دليل نظام المحلات المتعددة (Multi-Shop System)

## نظرة عامة

تم توسيع التطبيق ليدعم **4 أنواع من المحلات التجارية** بالإضافة للخياطين:

1. **الخياطون (Tailors)** - محلات الخياطة التقليدية
2. **البوتيكات (Boutiques)** - متاجر الملابس الجاهزة والأزياء الراقية
3. **محلات الأقمشة (Fabric Stores)** - متاجر بيع الأقمشة والخامات
4. **محلات مواد الخياطة (Sewing Supplies)** - متاجر بيع أدوات وإكسسوارات الخياطة

---

## الهيكل البرمجي (Technical Structure)

### 1. التعريفات (Types - `types.ts`)

#### ShopType
```typescript
export type ShopType = 'tailor' | 'boutique' | 'fabric_store' | 'sewing_supplies';
```

#### Shop Interface (Base Interface)
```typescript
export interface Shop {
  id: string;
  name: string;
  shopType: ShopType;
  description: string;
  image: string;
  coverImage?: string;
  location: string;
  region: string;
  rating: number;
  followers: number;
  phone: string;
  email?: string;
  whatsapp?: string;
  workingHours?: string;
  experience?: string;
  
  // Social Media
  instagram?: string;
  twitter?: string;
  
  // Business Features
  services?: string[];
  brands?: string[];
  portfolio?: string[];
  deliveryAvailable?: boolean;
  hasOnlineStore?: boolean;
  
  // Status
  isVerified?: boolean;
  isOpen?: boolean;
}
```

#### Tailor extends Shop
```typescript
export interface Tailor extends Shop {
  specialization: string;
  completedOrders?: number;
  collections?: string[];
  // ... other tailor-specific fields
}
```

### 2. الصفحات (Pages)

#### ShopsList.tsx
صفحة عرض جميع المحلات مع فلترة متقدمة.

**المميزات:**
- بحث بالاسم، الوصف، والموقع
- فلترة حسب نوع المحل (4 أنواع)
- فلترة حسب المنطقة
- عرض شبكي (Grid) جميل
- بطاقات مخصصة لكل نوع محل
- أيقونات مميزة لكل نوع:
  - ✂️ Scissors للخياطين
  - 🏪 Store للبوتيكات
  - 🧵 Shirt للأقمشة
  - ✨ Sparkles لمواد الخياطة

**البيانات التجريبية:**
```typescript
const MOCK_SHOPS: Shop[] = [
  // 2 Tailors
  // 2 Boutiques
  // 2 Fabric Stores
  // 2 Sewing Supplies
];
```

**المسار:**
```
/shops
```

#### ShopProfile.tsx
صفحة الملف التعريفي الموحدة لجميع أنواع المحلات.

**المميزات:**
- صورة غلاف (Cover Image)
- صورة البروفايل
- شارة التحقق (Verification Badge)
- أزرار متابعة ومشاركة
- بطاقات معلومات سريعة:
  - رقم الهاتف
  - ساعات العمل
  - خدمة التوصيل
  - المتجر الإلكتروني
- تبويبات (Tabs):
  - عن المحل
  - المنتجات
  - التقييمات
- عرض الخدمات
- عرض الماركات (للمتاجر)
- معرض الأعمال (Portfolio)
- زر التواصل

**المسار:**
```
/shop/:id
```

### 3. المسارات (Routes - `App.tsx`)

تم إضافة المسارات التالية:

```typescript
<Route path="/shops" element={<ShopsList />} />
<Route path="/shop/:id" element={<ShopProfile />} />
```

### 4. التنقل (Navigation)

#### في Header
تم إضافة شريط تنقل يحتوي على:
- الرئيسية
- **المحلات** (جديد)
- الخياطون
- المنتجات

#### في Home
تم إضافة زر بارز للوصول للمحلات:
```tsx
<button onClick={() => navigate('/shops')}>
  استعرض جميع المحلات والبوتيكات
</button>
```

---

## كيفية الاستخدام (Usage)

### 1. إضافة محل جديد

```typescript
const newShop: Shop = {
  id: 'shop-9',
  name: 'بوتيك الأناقة',
  shopType: 'boutique',
  description: 'أحدث صيحات الموضة',
  image: 'https://picsum.photos/400/400?random=9',
  coverImage: 'https://picsum.photos/1200/400?random=9',
  location: 'مسقط',
  region: 'مسقط',
  rating: 4.8,
  followers: 3500,
  phone: '+968 9876 5432',
  email: 'info@elegance.om',
  whatsapp: '+968 9876 5432',
  workingHours: '9 ص - 10 م',
  services: ['ملابس جاهزة', 'إكسسوارات', 'أحذية'],
  brands: ['Zara', 'H&M', 'Mango'],
  deliveryAvailable: true,
  hasOnlineStore: true,
  isVerified: true,
  isOpen: true,
};
```

### 2. الفلترة حسب نوع المحل

في `ShopsList.tsx`:

```typescript
// All shops
setSelectedType('all');

// Tailors only
setSelectedType('tailor');

// Boutiques only
setSelectedType('boutique');

// Fabric stores only
setSelectedType('fabric_store');

// Sewing supplies only
setSelectedType('sewing_supplies');
```

### 3. البحث والفلترة

```typescript
const filteredShops = MOCK_SHOPS
  .filter(shop => 
    selectedType === 'all' || shop.shopType === selectedType
  )
  .filter(shop => 
    selectedRegion === 'all' || shop.region === selectedRegion
  )
  .filter(shop => {
    const query = searchQuery.toLowerCase();
    return (
      shop.name.toLowerCase().includes(query) ||
      shop.description.toLowerCase().includes(query) ||
      shop.location.toLowerCase().includes(query)
    );
  });
```

---

## التطويرات المستقبلية (Future Enhancements)

### 1. نظام التسجيل للمحلات
- نموذج تسجيل موحد مع اختيار نوع المحل
- رفع المستندات الرسمية
- التحقق من البيانات

### 2. لوحة التحكم الإدارية
- الموافقة على المحلات الجديدة
- إدارة جميع أنواع المحلات
- إحصائيات شاملة

### 3. المنتجات المخصصة لكل نوع
- **البوتيكات:** ملابس جاهزة، إكسسوارات
- **محلات الأقمشة:** أقمشة بالمتر، عينات
- **مواد الخياطة:** خيوط، أزرار، سحابات

### 4. نظام الطلبات الموحد
- طلب من البوتيكات (شراء مباشر)
- طلب من محلات الأقمشة (بيع بالمتر)
- طلب من الخياطين (تفصيل)

### 5. التكامل بين الأنواع
- الخياط يوصي بمحل أقمشة معين
- محل الأقمشة يوصي بخياط ماهر
- البوتيك يوفر خدمة التعديلات عبر خياط

---

## الملفات المعدلة (Modified Files)

1. **types.ts** - إضافة ShopType و Shop interface
2. **App.tsx** - إضافة مسارات /shops و /shop/:id
3. **Home.tsx** - إضافة زر "استعرض المحلات"
4. **Header.tsx** - إضافة روابط التنقل

## الملفات الجديدة (New Files)

1. **pages/ShopsList.tsx** - صفحة عرض المحلات
2. **pages/ShopProfile.tsx** - صفحة الملف التعريفي
3. **MULTI_SHOP_SYSTEM_GUIDE.md** - هذا الدليل

---

## ملاحظات تقنية (Technical Notes)

### Backward Compatibility
- `Tailor extends Shop` للحفاظ على التوافق مع الكود الحالي
- جميع صفحات الخياطين القديمة تعمل بدون تغيير
- يمكن تحويل `TailorList` تدريجياً لاستخدام `Shop`

### Performance
- استخدام `useMemo` للفلترة في ShopsList
- lazy loading للصور
- pagination جاهزة للتفعيل عند زيادة البيانات

### Accessibility
- aria-labels لجميع الأزرار
- keyboard navigation
- screen reader friendly

### Responsive Design
- Grid responsive (1/2/3 أعمدة حسب الشاشة)
- Mobile-first approach
- Touch-friendly buttons

---

## أمثلة الاستخدام (Usage Examples)

### مثال 1: الانتقال لصفحة المحلات
```tsx
<button onClick={() => navigate('/shops')}>
  عرض جميع المحلات
</button>
```

### مثال 2: فتح ملف محل معين
```tsx
<button onClick={() => navigate(`/shop/${shop.id}`)}>
  عرض التفاصيل
</button>
```

### مثال 3: عرض محلات منطقة معينة
```tsx
const muscat_shops = MOCK_SHOPS.filter(s => s.region === 'مسقط');
```

---

## التواصل والدعم (Support)

للمزيد من المعلومات أو الاستفسارات حول نظام المحلات المتعددة، يرجى مراجعة:
- الكود المصدري في `pages/ShopsList.tsx` و `pages/ShopProfile.tsx`
- التعريفات في `types.ts`
- أمثلة البيانات التجريبية في المكونات

---

**تم إنشاء هذا النظام بتاريخ:** ديسمبر 2024  
**الإصدار:** 1.0.0  
**الحالة:** جاهز للاستخدام ✅
