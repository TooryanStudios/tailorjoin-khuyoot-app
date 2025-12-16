# دليل نشر Firebase - Firebase Deployment Guide

## 📋 الخطوات المطلوبة

### 1. رفع قواعد Firestore Security

```bash
# تثبيت Firebase CLI إذا لم يكن مثبتاً
npm install -g firebase-tools

# تسجيل الدخول إلى Firebase
firebase login

# ربط المشروع
firebase init firestore

# اختر المشروع: khuyoot-app01
# استخدم الملف الموجود: firestore.rules

# رفع القواعد
firebase deploy --only firestore:rules
```

### 2. التحقق من متغيرات البيئة

تأكد أن ملف `.env.local` موجود ويحتوي على:
```env
VITE_FIREBASE_API_KEY=***
VITE_FIREBASE_AUTH_DOMAIN=***
VITE_FIREBASE_PROJECT_ID=***
VITE_FIREBASE_STORAGE_BUCKET=***
VITE_FIREBASE_MESSAGING_SENDER_ID=***
VITE_FIREBASE_APP_ID=***
VITE_FIREBASE_MEASUREMENT_ID=***
```

### 3. اختبار محلياً

```bash
# التأكد من عمل المتغيرات البيئية
npm run dev

# التأكد من عدم وجود أخطاء Console
# افتح المتصفح Console (F12)
```

### 4. بناء للإنتاج

```bash
# بناء المشروع
npm run build

# معاينة البناء محلياً
npm run preview
```

### 5. النشر

#### خيار أ: Vercel (موصى به)
```bash
# تثبيت Vercel CLI
npm i -g vercel

# النشر
vercel

# إضافة متغيرات البيئة في Vercel Dashboard
# Settings → Environment Variables
```

#### خيار ب: Netlify
```bash
# تثبيت Netlify CLI
npm i -g netlify-cli

# النشر
netlify deploy --prod

# إضافة متغيرات البيئة في Netlify Dashboard
# Site settings → Build & deploy → Environment
```

#### خيار ج: Firebase Hosting
```bash
firebase init hosting
# اختر dist كمجلد للنشر
firebase deploy --only hosting
```

## 🔐 إعدادات الأمان بعد النشر

### 1. تفعيل Firebase App Check

```bash
# في Firebase Console
# 1. اذهب إلى: App Check
# 2. Register app
# 3. اختر reCAPTCHA v3
# 4. انسخ Site Key
```

أضف في `services/firebase.ts`:
```typescript
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_SITE_KEY'),
  isTokenAutoRefreshEnabled: true
});
```

### 2. تقييد API Keys

في Firebase Console:
1. اذهب إلى: Project Settings → API Keys
2. اضغط على API Key
3. Application restrictions → HTTP referrers
4. أضف نطاقك: `yourdomain.com/*`

### 3. تفعيل Authentication Email Verification

```typescript
// في register function
import { sendEmailVerification } from 'firebase/auth';

await sendEmailVerification(userCredential.user);
```

## ✅ Checklist قبل الإطلاق النهائي

- [ ] Firebase Security Rules مرفوعة
- [ ] Environment Variables محدثة في منصة النشر
- [ ] HTTPS مفعل (تلقائي في Vercel/Netlify)
- [ ] CSP Headers موجودة في index.html
- [ ] console.log statements محذوفة في production
- [ ] Firebase App Check مفعل
- [ ] API Keys مقيدة بالنطاق
- [ ] Email verification مفعل
- [ ] اختبار جميع الأدوار (user, tailor, boutique, shop, admin)
- [ ] اختبار الطلبات والدفع
- [ ] اختبار على Mobile
- [ ] Backup للـ Firestore database

## 🚀 بعد النشر

### مراقبة الأداء
```bash
# تفعيل Firebase Analytics
# في Firebase Console → Analytics
```

### إعداد Monitoring
```bash
# تفعيل Error Reporting
# في Firebase Console → Crashlytics
```

## 📞 الدعم الفني

إذا واجهت أي مشاكل:
1. راجع [Firebase Docs](https://firebase.google.com/docs)
2. راجع [Vercel Docs](https://vercel.com/docs)
3. افحص Console للأخطاء
4. راجع Firebase Console → Usage

---

**ملاحظة:** كل التعليمات أعلاه تم تطبيقها بالفعل في الكود. فقط نفذ خطوات النشر!
