# 🎨 نظام التخصيص (Customization System)

## 📋 نظرة عامة

نظام تخصيص التصميم يسمح للمستخدمات باختيار نموذج اللبس ورفع صورة القماش والحصول على معاينة بالذكاء الاصطناعي قبل الانتقال لإدخال المقاسات.

---

## 🏗️ البنية الهيكلية

### 📁 الملفات المنشأة

```
src/
├── types/
│   └── customization.ts              # أنواع TypeScript للتخصيص
│
├── services/
│   └── fabricAIService.ts            # خدمة AI (Mock الآن)
│
├── components/customization/
│   ├── ModelSelector.tsx             # اختيار نموذج التصميم
│   ├── FabricUploader.tsx            # رفع صورة القماش
│   ├── PreviewCanvas.tsx             # معاينة التصميم
│   ├── AITipsPanel.tsx               # عرض توصيات AI
│   └── NextStepButton.tsx            # زر الانتقال للمقاسات
│
└── pages/
    └── CustomizationPage.tsx         # الصفحة الرئيسية
```

---

## 🎯 المكونات

### 1️⃣ **ModelSelector**
- عرض شبكة من نماذج الملابس
- دعم أنواع: عباية، فستان، ثوب، جلابية، قميص
- تحديد نموذج واحد فقط
- حالة مرئية عند التحديد (ring + scale + check badge)

**Props:**
```typescript
{
  models: CustomizationModel[]
  selectedModelId?: string
  onModelSelect: (modelId: string) => void
}
```

### 2️⃣ **FabricUploader**
- دعم رفع الصور (JPG, PNG, WEBP)
- Drag & Drop
- معاينة الصورة المرفوعة
- حد أقصى 10MB
- رسائل خطأ واضحة

**Props:**
```typescript
{
  onFabricSelected: (file: File) => void
  currentFabric?: { preview: string; file: File }
  onRemove?: () => void
}
```

### 3️⃣ **PreviewCanvas**
- عرض المعاينة بعد معالجة AI
- 4 حالات: idle, processing, ready, error
- زر إعادة إنشاء المعاينة
- رسائل خطأ

**Props:**
```typescript
{
  selectedModel: CustomizationModel | null
  fabricImageUrl?: string
  previewUrl?: string
  previewStatus: PreviewStatus
  onRegeneratePreview?: () => void
  errorMessage?: string
}
```

### 4️⃣ **AITipsPanel**
- عرض توصيات الذكاء الاصطناعي
- تصميم جذاب مع gradients
- حالة تحميل
- حالة فارغة

**Props:**
```typescript
{
  tips: string[]
  isLoading?: boolean
}
```

### 5️⃣ **NextStepButton**
- زر الانتقال لصفحة المقاسات
- تعطيل تلقائي إذا لم يتم الاختيار
- رسائل توضيحية
- مؤشر تقدم (1 من 3)

**Props:**
```typescript
{
  onNext: () => void
  disabled?: boolean
  isLoading?: boolean
  modelSelected: boolean
  fabricUploaded: boolean
}
```

---

## 🔧 الخدمات

### fabricAIService.ts

**وظائف Mock حالياً:**

#### `generateFabricPreview()`
```typescript
async function generateFabricPreview(
  model: CustomizationModel,
  fabric: FabricUpload
): Promise<AIPreviewResult>
```
- يحاكي معالجة AI (2 ثانية)
- يرجع previewUrl + aiTips

#### `uploadFabricImage()`
```typescript
async function uploadFabricImage(file: File): Promise<string>
```
- يحول الصورة إلى Data URL
- مستقبلاً: رفع إلى Firebase Storage

#### `validateFabricImage()`
```typescript
function validateFabricImage(file: File): { valid: boolean; error?: string }
```
- فحص النوع والحجم

---

## 📱 الصفحة الرئيسية

### CustomizationPage.tsx

**الحالة (State):**
```typescript
{
  selectedModel?: CustomizationModel
  fabricUpload?: FabricUpload
  previewUrl?: string
  previewStatus: 'idle' | 'processing' | 'ready' | 'error'
  aiTips: string[]
  errorMessage?: string
}
```

**التدفق:**
1. المستخدم يختار نموذج → `handleModelSelect()`
2. المستخدم يرفع قماش → `handleFabricSelect()`
3. تلقائياً يتم توليد المعاينة → `handleGeneratePreview()`
4. عرض توصيات AI
5. الضغط على "التالي" → `handleNext()` → `/measurements`

---

## 🔗 الروابط

### في Router (App.tsx):
```tsx
/customization-new          // صفحة جديدة بدون productId
/customization-new/:productId   // مع productId
```

### الانتقال للمقاسات:
```typescript
navigate('/measurements', {
  state: { 
    customizationData,
    from: 'customization' 
  }
});
```

---

## 🎨 التصميم

- **Mobile First**: يعمل بشكل ممتاز على الجوال
- **Dark Mode**: دعم كامل
- **Tailwind**: جميع الأنماط
- **Gradients**: استخدام تدرجات جميلة (indigo, amber, etc.)
- **Animations**: 
  - Spinner عند المعالجة
  - Scale effect عند التحديد
  - Smooth transitions

---

## 🚀 الاستخدام

### الوصول للصفحة:
```
http://localhost:3001/#/customization-new
```

### التكامل مع صفحة المنتج:
```tsx
<button onClick={() => navigate(`/customization-new/${productId}`)}>
  ابدأ التفصيل
</button>
```

---

## 🔮 خطط مستقبلية

### مرحلة 1 (حالياً) ✅
- [x] بناء الواجهة
- [x] Mock AI Service
- [x] Navigation flow
- [x] State management

### مرحلة 2 (قريباً)
- [ ] ربط Gemini Vision API
- [ ] رفع الصور إلى Firebase Storage
- [ ] حفظ البيانات في Firestore
- [ ] تحسين جودة المعاينة

### مرحلة 3 (لاحقاً)
- [ ] AI لاقتراح الألوان المناسبة
- [ ] AI لاقتراح الزخارف
- [ ] تخصيص متقدم (buttons, pockets, etc.)
- [ ] 3D Preview

---

## 📝 ملاحظات هامة

### للمطورين:
1. **لا تعدل fabricAIService.ts بشكل كبير** - فقط استبدل المحتوى الداخلي للدوال
2. **المكونات منفصلة تماماً** - سهولة الصيانة
3. **التصميم responsive** - اختبر على جميع الأحجام
4. **الحالات واضحة** - idle, processing, ready, error

### للمستخدمين:
1. اختاري التصميم الذي يناسبك
2. ارفعي صورة القماش بإضاءة جيدة
3. انتظري المعاينة (2-3 ثواني)
4. راجعي التوصيات
5. انتقلي للمقاسات

---

## 🐛 استكشاف الأخطاء

### المعاينة لا تظهر:
- تأكد من اختيار Model + Fabric
- تحقق من console للأخطاء
- جرب إعادة المعاينة

### الصورة لا ترفع:
- تحقق من الصيغة (JPG/PNG/WEBP)
- تحقق من الحجم (<10MB)
- جرب صورة أخرى

### زر "التالي" معطل:
- تأكد من اختيار Model
- تأكد من رفع Fabric
- انتظر انتهاء المعالجة

---

**تاريخ الإنشاء:** 2024-12-11  
**الحالة:** ✅ جاهز للاستخدام (Mock)  
**التكامل مع AI:** 🔄 في انتظار الربط
