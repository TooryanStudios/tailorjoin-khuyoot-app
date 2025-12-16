# نظام المناطق الشائعة - Popular Regions System

## نظرة عامة
نظام متكامل لعرض المناطق الشائعة على الصفحة الرئيسية وفلترة الخياطين حسب الموقع الجغرافي.

## الميزات الرئيسية

### 1. إدارة المناطق من لوحة الآدمن
- إضافة منطقة جديدة (أيقونة، اسم عربي، اسم إنجليزي)
- تعديل معلومات المنطقة
- حذف المناطق
- إعادة ترتيب المناطق (أسهم أعلى/أسفل)
- تفعيل/إلغاء تفعيل المناطق

### 2. عرض المناطق على الصفحة الرئيسية
- شبكة جذابة من بطاقات المناطق
- تأثيرات متدرجة عند التمرير
- المنطقة المختارة تظهر بخلفية زرقاء متدرجة
- زر "جميع المناطق" 🌍 لإلغاء الفلترة
- مؤشر الفلتر النشط مع زر X للإلغاء

### 3. فلترة الخياطين حسب المنطقة
- عرض أفضل 6 خياطين بالتقييم لكل منطقة
- بطاقات عرض مع التقييم والموقع
- زر "عرض الكل" ينقل لصفحة الخياطين مع الفلتر

### 4. دعم URL Parameters
- صفحة الخياطين تدعم `?region=اسم_المنطقة`
- عند النقر على "عرض الكل" يتم حفظ الفلتر في الرابط
- يمكن مشاركة الرابط مع الفلتر النشط

## الملفات المعنية

### Types (types.ts)
```typescript
interface PopularRegion {
  id: string;
  name: string;           // الاسم بالعربية
  nameEn?: string;        // الاسم بالإنجليزية (اختياري)
  icon: string;           // أيقونة (emoji)
  order: number;          // ترتيب العرض
  enabled: boolean;       // فعال/غير فعال
  createdAt: Date;
}

interface Shop {
  // ... الحقول الموجودة
  region?: string;        // المنطقة الجغرافية
}
```

### Firebase Functions (services/firebase.ts)

#### getPopularRegions()
```typescript
async getPopularRegions(): Promise<PopularRegion[]>
```
- يجلب جميع المناطق
- مرتبة حسب حقل `order`
- تستخدم في لوحة الآدمن والصفحة الرئيسية

#### addPopularRegion(regionData)
```typescript
async addPopularRegion(regionData: Omit<PopularRegion, 'id' | 'createdAt'>): Promise<string>
```
- يضيف منطقة جديدة
- يحدد `createdAt` تلقائياً
- يعيد `id` المنطقة

#### updatePopularRegion(id, updates)
```typescript
async updatePopularRegion(id: string, updates: Partial<PopularRegion>): Promise<void>
```
- يحدث بيانات منطقة موجودة
- يستخدم لتعديل البيانات وإعادة الترتيب

#### deletePopularRegion(id)
```typescript
async deletePopularRegion(id: string): Promise<void>
```
- يحذف منطقة من قاعدة البيانات

#### getTailorsByRegion(region, limit)
```typescript
async getTailorsByRegion(region: string, limit?: number): Promise<Tailor[]>
```
- يجلب الخياطين في منطقة محددة
- مرتبين حسب التقييم تنازلياً
- `limit` اختياري (افتراضي: 6 للصفحة الرئيسية)

## المكونات (Components)

### 1. RegionsManagement.tsx
**المسار:** `src/admin/regions/RegionsManagement.tsx`

**الوظيفة:** واجهة إدارة المناطق في لوحة الآدمن

**الميزات:**
- قائمة المناطق الموجودة (شبكة 3 أعمدة)
- نموذج إضافة/تعديل منطقة
- أزرار إعادة الترتيب (⬆️ ⬇️)
- زر تفعيل/إلغاء تفعيل (✓ / ✗)
- زر تعديل (✏️)
- زر حذف (🗑️)
- تحديث فوري على الصفحة الرئيسية

**الحالة (State):**
```typescript
const [regions, setRegions] = useState<PopularRegion[]>([]);
const [isAdding, setIsAdding] = useState(false);
const [editingRegion, setEditingRegion] = useState<PopularRegion | null>(null);
const [formData, setFormData] = useState({ name: '', nameEn: '', icon: '' });
```

### 2. PopularRegions.tsx
**المسار:** `pages/Home/components/PopularRegions.tsx`

**الوظيفة:** عرض بطاقات المناطق على الصفحة الرئيسية

**الميزات:**
- شبكة متجاوبة (عمودين على الموبايل، 3 على التابلت، 5 على الديسكتوب)
- تأثيرات متدرجة على التمرير
- المنطقة المختارة: خلفية زرقاء + نص أبيض
- المناطق غير المختارة: خلفية بيضاء + تأثير hover
- زر "جميع المناطق" دائماً ظاهر

**Props:**
```typescript
interface PopularRegionsProps {
  selectedRegion: string | null;
  onRegionSelect: (region: string | null) => void;
}
```

**الاستخدام:**
```tsx
<PopularRegions 
  selectedRegion={selectedRegion} 
  onRegionSelect={setSelectedRegion} 
/>
```

### 3. FilteredTailors.tsx
**المسار:** `pages/Home/components/FilteredTailors.tsx`

**الوظيفة:** عرض أفضل 6 خياطين عند اختيار منطقة

**الميزات:**
- شبكة متجاوبة (1-2-3 أعمدة)
- بطاقات الخياطين بتصميم جذاب
- شارة التقييم (نجمة كهرمانية)
- شارة المنطقة (أيقونة MapPin زرقاء)
- زر "عرض الكل" بتدرج لوني
- حالة التحميل (spinner)
- حالة فارغة (لا خياطين)

**Props:**
```typescript
interface FilteredTailorsProps {
  region: string;
}
```

**الاستخدام:**
```tsx
{selectedRegion && <FilteredTailors region={selectedRegion} />}
```

## التكامل في الصفحة الرئيسية (Home.tsx)

### State Management
```typescript
const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
```

### الموضع في الصفحة
- يظهر المكون **بين** قسم التصميم/الإعلانات وزر "تصفح المحلات"
- عند اختيار منطقة، يختفي قسم الخياطين العادي ويظهر `FilteredTailors`

### الكود:
```tsx
{/* Popular Regions Section */}
<PopularRegions 
  selectedRegion={selectedRegion} 
  onRegionSelect={setSelectedRegion} 
/>

{/* Show filtered tailors when region is selected */}
{selectedRegion && <FilteredTailors region={selectedRegion} />}

{/* Browse Shops Button */}
{showSection('browseShopsButton') && <BrowseShopsButton />}

{/* Regular Tailors Section - hide when filtering by region */}
{!selectedRegion && showSection('tailors') && <TailorsSection />}
```

## لوحة الآدمن (Admin Panel)

### AdminApp.tsx
- أضيف `'regions'` إلى نوع `AdminSection`
- أضيف `import { RegionsManagement } from './regions/RegionsManagement'`
- أضيف case في switch: `case 'regions': return <RegionsManagement />;`

### Sidebar.tsx
- أضيف `MapPin` إلى imports من `lucide-react`
- أضيف عنصر في قسم "النظام":
```tsx
<SidebarItem id="regions" icon={MapPin} label="المناطق الشائعة" />
```

## صفحة قائمة الخياطين (TailorList.tsx)

### دعم URL Parameter
```typescript
const regionFilter = searchParams.get('region');

useEffect(() => {
  if (regionFilter) {
    const matchedRegion = REGIONS.find(r => r.name === regionFilter || r.id === regionFilter);
    if (matchedRegion && matchedRegion.id !== 'All') {
      setActiveRegion(matchedRegion.id);
    }
  }
}, [regionFilter]);
```

### Region Filter Banner
عند وجود `?region=` في الرابط، يظهر بانر بنفسجي:
```tsx
{regionFilter && (
  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 mb-4">
    <div className="flex items-center gap-3">
      <MapPin size={18} className="text-purple-600 dark:text-purple-400" />
      <div className="flex-1">
        <p className="text-sm font-bold text-purple-900 dark:text-purple-300">
          الخياطون في منطقة: {regionFilter}
        </p>
        <p className="text-xs text-purple-700 dark:text-purple-400 mt-0.5">
          يمكنك اختيار أي منطقة أخرى من الأسفل
        </p>
      </div>
      <button onClick={() => { setActiveRegion('All'); navigate('/tailors'); }}>
        إلغاء الفلترة
      </button>
    </div>
  </div>
)}
```

## قاعدة البيانات Firestore

### Collection: `popularRegions`

**البنية:**
```
popularRegions/
  ├─ {regionId}/
      ├─ name: "البريمي"
      ├─ nameEn: "Al Buraimi" (optional)
      ├─ icon: "🏜️"
      ├─ order: 1
      ├─ enabled: true
      ├─ createdAt: Timestamp
```

**الفهارس المطلوبة:**
- `order` (ascending) - للترتيب
- `enabled` (ascending) - للفلترة

### تحديث Collection: `tailors` / `shops`

**حقل جديد:**
```typescript
region?: string  // مثال: "البريمي", "السيب", "مطرح"
```

**ملاحظة:** يجب على الخياطين تحديث حقل `region` في ملفاتهم الشخصية

## سير العمل (Workflow)

### 1. إضافة منطقة جديدة
1. الآدمن يدخل لوحة التحكم → "المناطق الشائعة"
2. ينقر زر "➕ إضافة منطقة جديدة"
3. يملأ النموذج:
   - الاسم بالعربية (مطلوب)
   - الاسم بالإنجليزية (اختياري)
   - أيقونة (emoji - مطلوب)
4. ينقر "💾 حفظ"
5. المنطقة تظهر فوراً في القائمة

### 2. إعادة ترتيب المناطق
1. ينقر زر ⬆️ لرفع المنطقة
2. ينقر زر ⬇️ لخفض المنطقة
3. يتم تحديث حقل `order` في Firestore
4. الترتيب يتحدث فوراً على الصفحة الرئيسية

### 3. تفعيل/إلغاء تفعيل منطقة
1. ينقر زر التفعيل (✓ أو ✗)
2. يتم تحديث `enabled` في Firestore
3. المنطقة المعطلة لا تظهر على الصفحة الرئيسية

### 4. المستخدم يختار منطقة
1. يزور الصفحة الرئيسية
2. يرى بطاقات المناطق الشائعة
3. ينقر على منطقة (مثلاً: البريمي)
4. يظهر `FilteredTailors` مع أفضل 6 خياطين
5. إذا أراد رؤية الكل، ينقر "عرض الكل"
6. ينتقل إلى `/tailors?region=البريمي`
7. يرى بانر بنفسجي + قائمة مفلترة

## الاختبار (Testing)

### اختبار لوحة الآدمن
- [ ] إضافة منطقة جديدة
- [ ] تعديل منطقة موجودة
- [ ] حذف منطقة
- [ ] رفع/خفض ترتيب المناطق
- [ ] تفعيل/إلغاء تفعيل منطقة
- [ ] التأكد من ظهور التحديثات فوراً

### اختبار الصفحة الرئيسية
- [ ] ظهور المناطق المفعلة فقط
- [ ] ترتيب المناطق حسب `order`
- [ ] اختيار منطقة → يظهر FilteredTailors
- [ ] اختيار منطقة → يختفي TailorsSection
- [ ] نقر "جميع المناطق" → يعيد التصفية
- [ ] نقر X على badge → يعيد التصفية

### اختبار صفحة الخياطين
- [ ] النقر على "عرض الكل" ينقل لـ `/tailors?region=X`
- [ ] ظهور بانر الفلترة البنفسجي
- [ ] فلترة الخياطين حسب المنطقة
- [ ] نقر "إلغاء الفلترة" يعود لـ `/tailors`
- [ ] مشاركة الرابط مع `?region=` يحافظ على الفلتر

## الإطلاق (Deployment)

### قبل الإطلاق
1. تحديث timestamp في `Home.tsx`:
   ```typescript
   <div className="...">11 ديسمبر 2025 - 09:20 م</div>
   ```

2. التأكد من عدم وجود أخطاء:
   ```bash
   npm run build
   ```

3. اختبار محلياً:
   ```bash
   npm run dev
   ```

### الإطلاق على Vercel
```bash
vercel --prod
```

### بعد الإطلاق
1. اختبار على البيئة الحية
2. إضافة مناطق من لوحة الآدمن
3. التأكد من ظهور البيانات
4. إضافة حقل `region` للخياطين الموجودين

## ملاحظات مهمة

⚠️ **التوافق مع البيانات الموجودة:**
- الخياطين الحاليون لن يكون لديهم حقل `region`
- يجب تحديث ملفاتهم الشخصية لإضافة المنطقة
- حتى ذلك الوقت، لن يظهروا عند فلترة المناطق

💡 **الأداء:**
- استعلام Firebase محدود بـ 6 خياطين للصفحة الرئيسية
- استخدام `orderBy('rating', 'desc')` للحصول على الأفضل
- الفهارس موجودة على `region` و `rating`

🎨 **التصميم:**
- الألوان متناسقة مع باقي الموقع
- تدعم الوضع الداكن (dark mode)
- متجاوبة على جميع الأحجام
- تأثيرات سلسة وجذابة

## الخطوات القادمة

1. ✅ إنشاء collection `popularRegions` في Firestore
2. ✅ إضافة مناطق افتراضية (البريمي، السيب، مطرح، سناو، بركاء)
3. ⏳ تحديث ملفات الخياطين الموجودين لإضافة `region`
4. ⏳ إنشاء Firestore Index على `region` في collection `tailors`
5. ⏳ اختبار النظام بالكامل
6. ⏳ الإطلاق على Production

---

**تاريخ الإنشاء:** 11 ديسمبر 2025  
**آخر تحديث:** 11 ديسمبر 2025  
**الحالة:** ✅ جاهز للاختبار والإطلاق
