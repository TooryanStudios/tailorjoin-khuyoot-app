# 💰 نظام الإدارة المالية - دليل شامل

## 📋 نظرة عامة

نظام متكامل لإدارة المعاملات المالية والتدفقات النقدية في منصة خيوط، يشمل:
- تتبع المعاملات المالية
- إدارة الأرصدة
- معالجة طلبات السحب
- تقارير مالية شاملة
- حساب العمولات تلقائياً

---

## 🏗️ البنية التقنية

### الملفات الأساسية

```
src/admin/financial/
├── types.ts                    # التعريفات (Interfaces & Types)
├── FinancialManagement.tsx     # الواجهة الإدارية الرئيسية
services/
└── financialService.ts         # خدمات Firebase للعمليات المالية
```

### مجموعات Firestore

```
collections/
├── transactions/           # المعاملات المالية
├── balances/              # أرصدة المستخدمين
├── withdrawal_requests/   # طلبات السحب
├── financial_reports/     # التقارير المحفوظة
└── settings/financial     # الإعدادات المالية
```

---

## 💳 أنواع المعاملات (Transaction Types)

### 1. دفعة طلب (`order_payment`)
- الدفع مقابل طلب من العميل للخياط/المحل
- يتم احتساب عمولة المنصة تلقائياً
- يضاف المبلغ الصافي لرصيد الخياط

### 2. رسوم اشتراك (`subscription_fee`)
- رسوم اشتراك شهرية/سنوية للتجار
- تذهب بالكامل لرصيد المنصة

### 3. عمولة (`commission`)
- العمولة المستقطعة من المعاملات
- تضاف لرصيد المنصة

### 4. دفع إعلان (`advertisement_payment`)
- دفعات الإعلانات من التجار
- تذهب لرصيد المنصة

### 5. استرجاع (`refund`)
- رد مبلغ للعميل
- يخصم من رصيد الخياط ويعاد للعميل

### 6. سحب (`withdrawal`)
- سحب رصيد من المنصة للحساب البنكي
- يخصم من الرصيد المتاح

### 7. تعديل (`adjustment`)
- تعديل يدوي من المدير
- يمكن أن يكون إضافة (+) أو خصم (-)

### 8. مكافأة (`bonus`)
- مكافأة للتاجر على الأداء الجيد

### 9. غرامة (`penalty`)
- غرامة على مخالفة

---

## 💰 نظام الأرصدة

### أنواع الأرصدة

```typescript
Balance {
  availableBalance   // الرصيد المتاح للسحب
  pendingBalance     // الرصيد المعلق (طلبات قيد التنفيذ)
  totalEarned        // إجمالي المكتسب
  totalWithdrawn     // إجمالي المسحوب
}
```

### كيفية عمل الرصيد

1. **عند دفع طلب:**
   - العميل يدفع: 100 ريال
   - عمولة المنصة (10%): 10 ريال
   - رصيد الخياط يزيد: 90 ريال (متاح)
   - رصيد المنصة يزيد: 10 ريال (عمولة)

2. **عند طلب سحب:**
   - الرصيد المتاح ينتقل للرصيد المعلق
   - بعد الموافقة والتحويل: يخصم من المعلق
   - إجمالي المسحوب يزيد

3. **عند رفض السحب:**
   - الرصيد المعلق يعود للمتاح

---

## 📤 نظام طلبات السحب

### دورة حياة طلب السحب

```
1. pending     → قيد الانتظار (تم إنشاء الطلب)
2. approved    → موافق عليه (المدير وافق)
3. completed   → مكتمل (تم التحويل البنكي)
4. rejected    → مرفوض (رفض المدير)
```

### خطوات المعالجة

#### 1. إنشاء طلب السحب

```typescript
createWithdrawalRequest({
  userId: 'tailor123',
  userName: 'محل الخياطة الذهبية',
  userType: 'tailor',
  amount: 500,
  currency: 'OMR',
  bankName: 'بنك مسقط',
  accountNumber: '1234567890',
  accountHolderName: 'أحمد محمد',
  iban: 'OM12345678901234567890',
  notes: 'سحب شهري'
})
```

**ما يحدث:**
- التحقق من توفر الرصيد
- تحويل المبلغ من متاح → معلق
- إنشاء طلب بحالة `pending`

#### 2. موافقة المدير

```typescript
processWithdrawalRequest(requestId, true, 'موافق عليه')
```

**ما يحدث:**
- تغيير الحالة → `approved`
- خصم من الرصيد المعلق
- إنشاء معاملة سحب
- إشعار للمستخدم

#### 3. تأكيد التحويل

```typescript
completeWithdrawal(requestId, adminId)
```

**ما يحدث:**
- تغيير الحالة → `completed`
- تحديث `totalWithdrawn`

#### 4. رفض الطلب

```typescript
processWithdrawalRequest(requestId, false, 'سبب الرفض')
```

**ما يحدث:**
- تغيير الحالة → `rejected`
- إعادة المبلغ من معلق → متاح
- إشعار للمستخدم

---

## 📊 التقارير المالية

### أنواع التقارير

1. **يومي** (`daily`)
2. **أسبوعي** (`weekly`)
3. **شهري** (`monthly`)
4. **ربع سنوي** (`quarterly`)
5. **سنوي** (`yearly`)
6. **مخصص** (`custom`)

### محتويات التقرير

```typescript
FinancialReport {
  // الإحصائيات الأساسية
  totalRevenue          // إجمالي العائدات
  totalCommission       // إجمالي العمولات
  netRevenue            // الصافي
  
  // المعاملات
  totalTransactions
  successfulTransactions
  failedTransactions
  
  // حسب النوع
  orderPayments
  subscriptionFees
  advertisementPayments
  refunds
  withdrawals
  
  // حسب طريقة الدفع
  cashPayments
  bankTransferPayments
  cardPayments
  walletPayments
  
  // أفضل الشركاء
  topEarners: [
    {
      userId,
      userName,
      totalEarned,
      transactionsCount
    }
  ]
}
```

### إنشاء تقرير

```typescript
// تقرير شهري
const report = await generateFinancialReport(
  '2025-01-01',
  '2025-01-31',
  'monthly',
  'admin123'
)
```

---

## ⚙️ الإعدادات المالية

### الإعدادات المتاحة

```typescript
FinancialSettings {
  // العملة
  defaultCurrency: 'OMR',
  
  // نسب العمولات
  defaultCommissionRate: 10,      // %
  tailorCommissionRate: 10,       // %
  boutiqueCommissionRate: 15,     // %
  shopCommissionRate: 12,         // %
  
  // السحب
  minimumWithdrawal: 10,          // OMR
  withdrawalProcessingDays: 3,    // أيام
  
  // طرق الدفع المسموحة
  allowedPaymentMethods: [
    'cash',
    'bank_transfer',
    'credit_card',
    'wallet'
  ],
  
  // إعدادات التقارير
  autoGenerateReports: true,
  reportEmailRecipients: ['admin@khuyoot.com']
}
```

---

## 🎯 حالات الاستخدام

### 1. إضافة دفعة طلب

```typescript
// عند اكتمال طلب وتأكيد الدفع
const transactionId = await createTransaction({
  type: 'order_payment',
  status: 'completed',
  amount: 150.000,
  currency: 'OMR',
  description: 'دفعة طلب #12345 - فستان سهرة',
  
  fromUserId: 'customer123',
  fromUserName: 'فاطمة أحمد',
  
  toUserId: 'tailor456',
  toUserName: 'بوتيك الأناقة',
  
  paymentMethod: 'credit_card',
  reference: 'ORDER-12345',
  
  platformCommission: 15.000,      // 10% عمولة
  platformCommissionRate: 10,
  netAmount: 135.000,              // المبلغ الصافي للخياط
  
  completedAt: new Date().toISOString()
})
```

**النتيجة:**
- ✅ رصيد البوتيك يزيد بـ 135 ريال
- ✅ رصيد المنصة يزيد بـ 15 ريال
- ✅ معاملة مسجلة

### 2. تعديل رصيد يدوياً

```typescript
// إضافة مكافأة
await adjustBalance(
  'tailor456',
  50.000,
  'مكافأة للأداء المتميز في يناير',
  'admin123'
)

// خصم غرامة
await adjustBalance(
  'tailor789',
  -20.000,
  'غرامة تأخير في التسليم',
  'admin123'
)
```

### 3. معالجة طلب سحب

```typescript
// عرض التفاصيل
const request = await getWithdrawalRequests({ 
  status: 'pending' 
})

// موافقة
await processWithdrawalRequest(
  'withdrawal123',
  true,
  'تمت الموافقة. سيتم التحويل خلال 3 أيام'
)

// بعد إتمام التحويل البنكي
await completeWithdrawal('withdrawal123', 'admin123')
```

### 4. إنشاء تقرير شهري

```typescript
const report = await generateFinancialReport(
  '2025-01-01',
  '2025-01-31',
  'monthly',
  'admin123'
)

console.log(`
  إجمالي العائدات: ${report.totalRevenue} OMR
  العمولات: ${report.totalCommission} OMR
  الصافي: ${report.netRevenue} OMR
  عدد المعاملات: ${report.totalTransactions}
  معدل النجاح: ${(report.successfulTransactions / report.totalTransactions * 100).toFixed(1)}%
`)
```

---

## 🎨 الواجهة الإدارية

### الأقسام الرئيسية

#### 1. لوحة المعلومات
- إحصائيات سريعة
- العائدات الشهرية
- العمولات
- رصيد المنصة
- طلبات السحب المعلقة
- آخر المعاملات

#### 2. المعاملات
- جدول شامل لكل المعاملات
- فلترة حسب:
  - النوع
  - الحالة
  - التاريخ
  - البحث
- عرض تفاصيل كاملة
- تصدير Excel

#### 3. الأرصدة
- جدول بكل الأرصدة
- الرصيد المتاح والمعلق
- إجمالي المكتسب والمسحوب
- تعديل الرصيد يدوياً

#### 4. طلبات السحب
- عرض كل الطلبات
- فلترة حسب الحالة
- معالجة سريعة:
  - موافقة/رفض
  - تأكيد التحويل
- عرض تفاصيل البنك

#### 5. التقارير
- إنشاء تقارير مخصصة
- عرض التقارير المحفوظة
- تصدير PDF/Excel
- رسوم بيانية

---

## 🔒 الأمان والصلاحيات

### قواعد Firestore

```javascript
// firestore.rules
match /transactions/{transactionId} {
  allow read: if isAdmin();
  allow write: if isAdmin();
}

match /balances/{userId} {
  allow read: if isAdmin() || request.auth.uid == userId;
  allow write: if isAdmin();
}

match /withdrawal_requests/{requestId} {
  allow read: if isAdmin() || request.auth.uid == resource.data.userId;
  allow create: if request.auth.uid == request.resource.data.userId;
  allow update: if isAdmin();
}

match /financial_reports/{reportId} {
  allow read, write: if isAdmin();
}
```

### التحقق من الصلاحيات

```typescript
// في كل دالة
if (user?.role !== 'admin') {
  throw new Error('غير مصرح لك بهذه العملية');
}
```

---

## 📱 الإشعارات

### الإشعارات التلقائية

1. **عند استلام دفعة:**
   - إشعار للخياط: "تم استلام دفعة بمبلغ X ريال"

2. **عند الموافقة على السحب:**
   - إشعار للتاجر: "تمت الموافقة على طلب السحب"

3. **عند اكتمال التحويل:**
   - إشعار للتاجر: "تم تحويل المبلغ لحسابك البنكي"

4. **عند رفض السحب:**
   - إشعار للتاجر: "تم رفض طلب السحب - السبب: ..."

---

## 🔍 استعلامات مفيدة

### الحصول على إحصائيات Dashboard

```typescript
const stats = await getFinancialDashboardStats()
// {
//   monthlyRevenue: 15000,
//   monthlyCommission: 1500,
//   totalPlatformBalance: 25000,
//   pendingWithdrawals: 5,
//   pendingWithdrawalAmount: 2500,
//   totalTransactions: 150,
//   successRate: '95.3'
// }
```

### الحصول على معاملات مستخدم

```typescript
const userTransactions = await getTransactions({
  userId: 'tailor123',
  startDate: '2025-01-01',
  endDate: '2025-01-31'
})
```

### الحصول على طلبات سحب معلقة

```typescript
const pending = await getWithdrawalRequests({ 
  status: 'pending' 
})
```

---

## ⚡ نصائح الأداء

### 1. استخدام الفهارس (Indexes)

```
// مطلوب لاستعلامات المعاملات
Collection: transactions
- status (Ascending)
- createdAt (Descending)

Collection: withdrawal_requests  
- status (Ascending)
- createdAt (Descending)
```

### 2. التحديثات الجماعية

```typescript
// استخدم batch للعمليات المتعددة
const batch = writeBatch(db)
batch.update(ref1, data1)
batch.update(ref2, data2)
await batch.commit()
```

### 3. التخزين المؤقت

```typescript
// احفظ التقارير المكررة
const cachedReport = localStorage.getItem('report_monthly_2025_01')
if (cachedReport) {
  return JSON.parse(cachedReport)
}
```

---

## 🐛 معالجة الأخطاء

### الأخطاء الشائعة

#### 1. رصيد غير كافٍ

```typescript
try {
  await createWithdrawalRequest(...)
} catch (error) {
  if (error.message === 'الرصيد غير كافٍ') {
    alert('رصيدك الحالي غير كافٍ لهذا الطلب')
  }
}
```

#### 2. عملية مكررة

```typescript
// تحقق قبل الإنشاء
const existing = await getTransaction(orderId)
if (existing) {
  throw new Error('المعاملة موجودة مسبقاً')
}
```

#### 3. فشل التحديث

```typescript
try {
  await updateBalancesAfterTransaction(...)
} catch (error) {
  console.error('فشل تحديث الأرصدة:', error)
  // إنشاء سجل للمراجعة
  await createLog({
    type: 'error',
    message: 'فشل تحديث الرصيد',
    data: { transactionId, error }
  })
}
```

---

## 📈 التطويرات المستقبلية

### المخطط لها

1. **تقارير متقدمة:**
   - رسوم بيانية تفاعلية
   - مقارنات شهرية
   - تنبؤات بالعائدات

2. **الدفع التلقائي:**
   - ربط بوابة دفع
   - سحب تلقائي شهري
   - تحصيل رسوم اشتراك

3. **الفواتير:**
   - إنشاء فواتير PDF
   - إرسال بالبريد الإلكتروني
   - أرشفة الفواتير

4. **التحليلات:**
   - تحليل سلوك الدفع
   - أفضل أوقات المبيعات
   - توقعات الإيرادات

5. **التكامل:**
   - ربط مع أنظمة محاسبية
   - تصدير للبرامج المحاسبية
   - API للبنوك

---

## 📞 الدعم والمساعدة

### الأسئلة الشائعة

**س: كيف يتم حساب العمولة؟**
ج: تلقائياً حسب نوع المحل (خياط 10%، بوتيك 15%، محل 12%)

**س: متى يمكن للتاجر سحب رصيده؟**
ج: بعد تجاوز الحد الأدنى (10 ريال افتراضياً)

**س: كم يستغرق معالجة طلب السحب؟**
ج: 3 أيام عمل (قابل للتعديل في الإعدادات)

**س: هل يمكن إلغاء معاملة؟**
ج: نعم، من خلال إنشاء معاملة استرجاع (refund)

---

## ✅ قائمة التحقق

قبل الإطلاق:

- [ ] تفعيل Firestore Rules
- [ ] إنشاء الفهارس (Indexes)
- [ ] ضبط الإعدادات المالية
- [ ] اختبار دورة الدفع كاملة
- [ ] اختبار دورة السحب كاملة
- [ ] إنشاء تقرير تجريبي
- [ ] اختبار التعديلات اليدوية
- [ ] ضبط الإشعارات
- [ ] تدريب الفريق

---

## 📝 السجلات (Changelog)

### الإصدار 1.0.0 (ديسمبر 2025)

**الميزات الأساسية:**
- ✅ إدارة المعاملات المالية
- ✅ نظام الأرصدة
- ✅ طلبات السحب
- ✅ التقارير الأساسية
- ✅ لوحة معلومات شاملة
- ✅ حساب العمولات تلقائياً
- ✅ التعديلات اليدوية
- ✅ فلترة وبحث متقدم
- ✅ واجهة إدارية احترافية

---

## 🎓 الخلاصة

النظام المالي في منصة خيوط:
- ✅ **شامل**: يغطي جميع احتياجات الإدارة المالية
- ✅ **آمن**: قواعد صارمة وتحقق من الصلاحيات
- ✅ **دقيق**: حسابات تلقائية بدون أخطاء
- ✅ **شفاف**: تقارير مفصلة وسجلات كاملة
- ✅ **مرن**: إعدادات قابلة للتخصيص
- ✅ **سهل**: واجهة بديهية للمدير

**للبدء:**
1. ادخل للوحة التحكم
2. اضغط "الإدارة المالية"
3. استكشف الأقسام المختلفة
4. ابدأ بمعالجة المعاملات

**للدعم:**
- راجع هذا الدليل
- تحقق من الأمثلة في الكود
- اتصل بالفريق التقني

---

© 2025 Khuyoot Platform - نظام الإدارة المالية v1.0.0
