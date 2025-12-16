# Firebase Configuration Instructions
# دليل إعدادات Firebase

## Critical: Update Authorized Domains - مهم: تحديث النطاقات المصرح بها

⚠️ **يجب تنفيذ هذا قبل النشر على الدومين الجديد!**

### خطوات إضافة النطاقات في Firebase:

1. **افتح Firebase Console**
   - اذهب إلى: https://console.firebase.google.com/
   - اختر مشروع: `khuyoot-app01`

2. **انتقل إلى Authentication**
   - من القائمة الجانبية، اختر **Authentication**
   - انقر على تبويب **Settings**
   - ابحث عن قسم **Authorized domains**

3. **أضف النطاقات التالية:**

   انقر على "Add domain" وأضف كل واحد من هذه:
   
   ```
   khuyoot.app
   www.khuyoot.app
   khuyoot.vercel.app
   ```

   ملاحظات:
   - `khuyoot.app` - النطاق الرئيسي بدون www
   - `www.khuyoot.app` - النطاق الرئيسي مع www (الأساسي)
   - `khuyoot.vercel.app` - احتفظ به للاختبار والرجوع للإصدار السابق

4. **احفظ التغييرات**
   - تأكد من حفظ جميع التغييرات
   - لن تحتاج إعادة نشر القواعد

### Screenshots Location - موقع الصور التوضيحية:
```
Firebase Console → Authentication → Settings → Authorized domains
```

## Vercel Environment Variables - متغيرات البيئة في Vercel

### خطوات إضافة المتغيرات:

1. **افتح مشروعك في Vercel**
   - اذهب إلى: https://vercel.com/
   - اختر مشروع `khuyoot`

2. **انتقل إلى Settings**
   - Settings → Environment Variables

3. **أضف المتغير التالي:**

   **Name:** `VITE_SITE_URL`  
   **Value:** `https://www.khuyoot.app`  
   **Environments:** ✅ Production, ✅ Preview, ✅ Development

4. **احفظ واعد النشر**
   - بعد إضافة المتغير، قم بإعادة نشر المشروع
   - `Deployments` → أحدث deployment → `Redeploy`

## Testing Checklist - قائمة الاختبار

بعد إضافة النطاقات والمتغيرات:

### ✅ Firebase Auth Test:
```powershell
# Test login on new domain
# افتح: https://www.khuyoot.app
# جرب تسجيل الدخول بحساب Google أو البريد الإلكتروني
```

### ✅ Domain Redirect Test:
```powershell
# يجب أن يحول تلقائياً إلى www
curl -I https://khuyoot.app
# Expected: 308 Permanent Redirect → https://www.khuyoot.app
```

### ✅ OG Image Test:
```powershell
# Check image loads
curl -I https://www.khuyoot.app/og/khuyoot-og.jpg
# Expected: 200 OK
```

### ✅ WhatsApp Preview Test:
1. شارك رابط على WhatsApp: `https://www.khuyoot.app/`
2. تأكد من ظهور:
   - صورة المعاينة (khuyoot-og.jpg)
   - العنوان: "خيوط - Khuyoot | منصة تفصيل الملابس"
   - الوصف

## Common Issues - المشاكل الشائعة

### Issue 1: Firebase Auth Error
```
Error: auth/unauthorized-domain
```
**Solution:** تأكد من إضافة النطاق في Authorized domains

### Issue 2: OG Image Not Showing
```
WhatsApp shows no preview
```
**Solutions:**
1. تأكد من أن الصورة موجودة: `/public/og/khuyoot-og.jpg`
2. تحقق من حجم الصورة (<300KB)
3. استخدم URL كاملة مع https://www
4. اختبر باستخدام: https://www.opengraph.xyz/

### Issue 3: Environment Variable Not Working
```
SITE_CONFIG.url shows localhost or old domain
```
**Solution:** 
1. تأكد من إضافة `VITE_SITE_URL` في Vercel
2. أعد نشر المشروع (Redeploy)
3. انتظر دقيقة لتحديث CDN

## Deployment Commands - أوامر النشر

```powershell
# Build locally first
npm run build

# Preview build
npm run preview

# Deploy to Vercel (if using CLI)
vercel --prod

# Or push to main branch for automatic deployment
git add .
git commit -m "Domain migration to www.khuyoot.app"
git push origin main
```

## Post-Deployment Verification - التحقق بعد النشر

1. ✅ Visit https://khuyoot.app → redirects to https://www.khuyoot.app
2. ✅ Firebase login works
3. ✅ OG image loads: https://www.khuyoot.app/og/khuyoot-og.jpg
4. ✅ Share link on WhatsApp shows preview
5. ✅ No console errors
6. ✅ HTTPS certificate is valid
7. ✅ All pages load correctly

## Support & Troubleshooting - الدعم وحل المشاكل

If you encounter issues:

1. **Check Vercel Logs:**
   ```powershell
   vercel logs
   ```

2. **Check Browser Console:**
   - F12 → Console
   - Look for CORS, CSP, or authentication errors

3. **Verify DNS:**
   ```powershell
   nslookup www.khuyoot.app
   nslookup khuyoot.app
   ```

4. **Test OG Tags:**
   - Facebook: https://developers.facebook.com/tools/debug/
   - LinkedIn: https://www.linkedin.com/post-inspector/
   - Twitter: https://cards-dev.twitter.com/validator

---

**Created:** December 14, 2025  
**Status:** Ready for deployment  
**Next Step:** Add domains to Firebase Console, then deploy to Vercel
