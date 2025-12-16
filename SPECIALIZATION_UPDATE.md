# تحديث نظام التخصصات - Specialization System Update

## التغييرات المطبقة

تم تحديث نظام التخصصات بحيث يتم **تخزين القيم بالإنجليزية** في قاعدة البيانات و**عرضها بالعربية** في الواجهة.

### القيم الجديدة في قاعدة البيانات:

| القيمة المخزنة (English) | العرض في الواجهة (Arabic) |
|--------------------------|---------------------------|
| `males`                  | خياطة رجالية               |
| `females`                | خياطة نسائية               |
| `kids`                   | خياطة أطفال                |
| `general`                | خياطة عامة                 |

## الملفات المعدلة

### 1. إنشاء ملف مساعد للترجمة
**`utils/specializationHelper.ts`**
- `getSpecializationLabel()` - لتحويل القيمة الإنجليزية إلى عربية للعرض
- `tailorGenderToSpecialization()` - لتحويل `tailorGender` إلى قيمة `specialization`
- `SPECIALIZATION_MAP` - خريطة الترجمة

### 2. تحديث مكونات التسجيل
**`components/AuthModal.tsx`**
- استخدام `tailorGenderToSpecialization()` لتخزين القيمة الإنجليزية عند التسجيل
- بدلاً من: `specialization: 'رجالي'` أو `'نسائي'`
- أصبح: `specialization: 'males'` أو `'females'`

### 3. تحديث صفحات العرض
تم تحديث الصفحات التالية لاستخدام `getSpecializationLabel()`:

- **`pages/TailorList.tsx`** - قائمة الخياطين
- **`pages/TailorProfile.tsx`** - صفحة الخياط
- **`src/admin/merchants/MerchantsApproval.tsx`** - موافقات التجار

### 4. تحديث البيانات الوهمية
**`services/mockService.ts`**
- تحديث `MOCK_TAILORS` لاستخدام القيم الإنجليزية:
  - `'دشاديش خليجية'` → `'males'`
  - `'عبايات وفساتين'` → `'females'`
  - `'تصليح وتعديل'` → `'general'`

### 5. سكريبت الترحيل
**`scripts/migrateSpecialization.ts`**
- سكريبت لتحديث قاعدة البيانات الحالية
- يحول جميع القيم العربية القديمة إلى الإنجليزية الجديدة

## كيفية تشغيل الترحيل

لتحديث البيانات الموجودة في Firestore:

\`\`\`powershell
npx tsx scripts/migrateSpecialization.ts
\`\`\`

سيقوم السكريبت بـ:
1. قراءة جميع المستخدمين من Firestore
2. البحث عن أي `specialization` بالعربية
3. تحويلها للقيمة الإنجليزية المقابلة
4. تحديث السجل في قاعدة البيانات
5. طباعة ملخص بعدد السجلات المحدثة

## المزايا

✅ **قاعدة بيانات موحدة**: جميع القيم بالإنجليزية  
✅ **واجهة عربية**: العرض يبقى بالعربية للمستخدم  
✅ **سهولة الاستعلامات**: البحث والفلترة أسهل بالقيم الإنجليزية  
✅ **قابلية التوسع**: سهولة إضافة لغات أخرى مستقبلاً  
✅ **توافق API**: القيم الإنجليزية أفضل للتكامل مع APIs خارجية  

## مثال على الاستخدام

### في المكونات (Components):

\`\`\`tsx
import { getSpecializationLabel } from '../utils/specializationHelper';

// في العرض
<p>{getSpecializationLabel(tailor.specialization)}</p>
// إذا كان specialization = 'males'
// سيعرض: "خياطة رجالية"
\`\`\`

### عند التسجيل:

\`\`\`tsx
import { tailorGenderToSpecialization } from '../utils/specializationHelper';

const specialization = tailorGenderToSpecialization(tailorGender);
// إذا كان tailorGender = 'male'
// سيرجع: 'males'
\`\`\`

## ملاحظات مهمة

⚠️ **لا تستخدم القيم العربية في الكود الجديد**  
✅ استخدم دائمًا: `'males'`, `'females'`, `'kids'`, `'general'`  
✅ استخدم `getSpecializationLabel()` للعرض في الواجهة  

## الخطوات التالية (اختياري)

1. تحديث جميع الاستعلامات التي تبحث بالقيم العربية القديمة
2. إضافة validation للتأكد من القيم الصحيحة فقط
3. إضافة المزيد من التخصصات إذا لزم الأمر في `SPECIALIZATION_MAP`
