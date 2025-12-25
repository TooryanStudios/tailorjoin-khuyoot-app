# 🔥 Firebase Storage CORS Setup - تطبيق إعدادات CORS

## المشكلة
عند استخدام ميزة **تبليط القماش** أو أي ميزة تستخدم Canvas مع صور من Firebase Storage، يظهر خطأ CORS:

```
Access to image at 'https://firebasestorage.googleapis.com/...' has been blocked by CORS policy
```

## الحل السريع (خطوة بخطوة)

### 1️⃣ تثبيت Google Cloud SDK

**Windows:**
1. حمّل المثبت من:
   https://cloud.google.com/sdk/docs/install#windows

2. أو استخدم PowerShell (كمسؤول):
   ```powershell
   (New-Object Net.WebClient).DownloadFile("https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe", "$env:Temp\GoogleCloudSDKInstaller.exe")
   & $env:Temp\GoogleCloudSDKInstaller.exe
   ```

3. اتبع خطوات التثبيت
4. **أعد تشغيل PowerShell** بعد التثبيت

### 2️⃣ تسجيل الدخول

افتح PowerShell جديد وشغّل:

```powershell
gcloud auth login
```

سيفتح متصفح للمصادقة → اختر حساب Google المرتبط بمشروع Firebase.

### 3️⃣ تطبيق إعدادات CORS

```powershell
# تأكد أنك في مجلد المشروع
cd "C:\Projects\Khuyoot App\Code\khuyoot-خيوط"

# طبّق ملف CORS على البكت
gsutil cors set firebase.storage.cors.json gs://khuyoot-app01.firebasestorage.app
```

### 4️⃣ تحقق من التطبيق

```powershell
gsutil cors get gs://khuyoot-app01.firebasestorage.app
```

يجب أن ترى:

```json
[{"maxAgeSeconds": 3600, "method": ["GET", "HEAD"], "origin": ["*"], "responseHeader": ["Content-Type", "Cache-Control", "Content-Length", "ETag", "Last-Modified"]}]
```

---

## ✅ اختبار النتيجة

1. افتح الموقع: http://localhost:3000/#/designer
2. اختر قماشاً من مكتبة خيوط
3. اضغط **تبليط القماش (تجريبي)**
4. يجب أن تظهر الصورة بدون أخطاء CORS

---

## 🔐 ملاحظات أمان

الملف الحالي `firebase.storage.cors.json` يسمح لجميع المصادر (`"origin": ["*"]`).

للإنتاج، قيّد المصادر:

```json
[
  {
    "origin": [
      "https://www.khuyoot.app",
      "https://khuyoot.app",
      "http://localhost:3000",
      "http://localhost:5173"
    ],
    "method": ["GET", "HEAD"],
    "responseHeader": [
      "Content-Type",
      "Cache-Control",
      "Content-Length",
      "ETag",
      "Last-Modified"
    ],
    "maxAgeSeconds": 3600
  }
]
```

ثم أعد تطبيقه:

```powershell
gsutil cors set firebase.storage.cors.json gs://khuyoot-app01.firebasestorage.app
```

---

## 🆘 مشاكل شائعة

### ❌ `gcloud: command not found`
**الحل:** أعد تشغيل PowerShell بعد تثبيت Cloud SDK

### ❌ `AccessDeniedException: ... does not have storage.buckets.get access`
**الحل:** تأكد أنك مسجل دخول بحساب Google الصحيح (صاحب مشروع Firebase):
```powershell
gcloud auth list
gcloud auth login
```

### ❌ `BadRequestException: Invalid argument`
**الحل:** تأكد من صحة اسم البكت (بدون `gs://` في بعض الأوامر):
```powershell
# ✅ صحيح
gsutil cors set firebase.storage.cors.json gs://khuyoot-app01.firebasestorage.app

# ❌ خطأ
gsutil cors set firebase.storage.cors.json khuyoot-app01.firebasestorage.app
```

---

**Created:** December 24, 2025  
**Bucket:** `khuyoot-app01.firebasestorage.app`  
**Status:** جاهز للتطبيق

تم! 🎉
