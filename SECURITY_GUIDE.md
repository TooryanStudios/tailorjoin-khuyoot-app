# دليل الأمان والخصوصية - Khuyoot Security Guide

## 🔒 الأمان والخصوصية / Security & Privacy

### تم إصلاحه ✅
- ✅ إزالة عرض الأدوار (roles) في واجهة المستخدم
- ✅ إزالة Debug Chips من صفحات الحسابات
- ✅ إخفاء زر تسجيل الخروج من الصفحة الرئيسية (يظهر فقط في صفحات الحسابات)
- ✅ تحسين عرض حالات الطلبات بنصوص عربية واضحة

### التوصيات للنشر Production Deployment

#### 1. HTTPS و SSL/TLS
```bash
# استخدم HTTPS في الإنتاج - يمكن الحصول على شهادة مجانية من:
# - Let's Encrypt (مجاني)
# - Cloudflare (مجاني + CDN)
# - AWS Certificate Manager (مجاني لخدمات AWS)
```

**للنشر على Vercel/Netlify:**
- يتم تفعيل HTTPS تلقائياً
- لا حاجة لإعدادات إضافية

**للنشر على VPS (مثل DigitalOcean/AWS):**
```bash
# تثبيت Certbot لـ Let's Encrypt
sudo apt update
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

#### 2. Firebase Security Rules
قم بتحديث قواعد Firestore للحماية:

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // حماية بيانات المستخدمين
    match /users/{userId} {
      // المستخدم يمكنه قراءة بياناته فقط
      allow read: if request.auth != null && request.auth.uid == userId;
      // المستخدم يمكنه تحديث بياناته فقط (ماعدا role)
      allow update: if request.auth != null 
                    && request.auth.uid == userId
                    && request.resource.data.role == resource.data.role;
    }
    
    // حماية بيانات الطلبات
    match /orders/{orderId} {
      allow read: if request.auth != null 
                  && (resource.data.customerId == request.auth.uid 
                  || resource.data.tailorId == request.auth.uid);
      allow create: if request.auth != null;
      allow update: if request.auth != null 
                    && (resource.data.customerId == request.auth.uid 
                    || resource.data.tailorId == request.auth.uid);
    }
    
    // Admin فقط
    match /admin/{document=**} {
      allow read, write: if request.auth != null 
                         && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

#### 3. متغيرات البيئة Environment Variables

**لا تضع Firebase keys في الكود مباشرة!**

إنشاء ملف `.env.local` (لا يُرفع على Git):
```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

تحديث `services/firebase.ts`:
```typescript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
```

تحديث `.gitignore`:
```
.env.local
.env.production.local
.env.development.local
```

#### 4. Content Security Policy (CSP)

إضافة في `index.html`:
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' 'unsafe-eval'; 
               style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; 
               img-src 'self' data: https:; 
               connect-src 'self' https://*.firebaseio.com https://*.googleapis.com;">
```

#### 5. Rate Limiting

استخدم Firebase App Check:
```bash
npm install firebase/app-check
```

```typescript
// في firebase.ts
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_SITE_KEY'),
  isTokenAutoRefreshEnabled: true
});
```

#### 6. حماية البريد الإلكتروني

**لا تعرض email مباشرة في UI**

بدلاً من:
```tsx
<p>{user.email}</p> ❌
```

استخدم:
```tsx
<p>{user.email ? `${user.email.slice(0, 3)}***@***` : 'غير محدد'}</p> ✅
```

أو استخدم icon فقط:
```tsx
<Mail size={16} /> محمي
```

#### 7. Logging & Monitoring

**إزالة console.log في production:**

إضافة في `vite.config.ts`:
```typescript
export default defineConfig({
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
});
```

#### 8. التحقق من الصلاحيات Client-Side

**دائماً تحقق من role قبل عرض محتوى حساس:**

```tsx
{user?.role === 'admin' && <AdminPanel />}
{user?.role === 'tailor' && <TailorDashboard />}
```

## 📋 Checklist قبل النشر

- [ ] تفعيل HTTPS
- [ ] إعداد Firebase Security Rules
- [ ] نقل Firebase keys إلى environment variables
- [ ] تفعيل Firebase App Check
- [ ] إضافة Content Security Policy headers
- [ ] إزالة console.log statements
- [ ] إخفاء/تشفير البريد الإلكتروني في UI
- [ ] اختبار permissions لجميع الأدوار
- [ ] إعداد backup للـ database
- [ ] تفعيل Firebase Analytics للمراقبة

## 🔐 Password Best Practices

للمستخدمين الجدد:
- ✅ الحد الأدنى: 8 أحرف
- ✅ يحتوي على أحرف كبيرة وصغيرة
- ✅ يحتوي على أرقام ورموز
- ❌ لا تستخدم: 123456, password, test123

## 🚨 ماذا تفعل في حالة اختراق

1. **فوراً:**
   - غير جميع passwords
   - أوقف Firebase project
   - راجع Firestore logs

2. **خلال 24 ساعة:**
   - احذف جميع sessions
   - راجع جميع القواعد الأمنية
   - أبلغ المستخدمين المتأثرين

3. **للمستقبل:**
   - فعّل 2FA للـ admin accounts
   - راجع Security rules دورياً
   - استخدم Firebase Security Checkup

## 📞 موارد إضافية

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Firebase Security Docs](https://firebase.google.com/docs/rules)
- [Web Security by MDN](https://developer.mozilla.org/en-US/docs/Web/Security)

---

**آخر تحديث:** ديسمبر 2025  
**الحالة:** جاهز للنشر بعد تطبيق التوصيات
