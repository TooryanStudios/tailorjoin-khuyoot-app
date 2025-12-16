# Domain Migration Guide - دليل نقل الدومين

## ✅ Changes Completed - التغييرات المنجزة

### 1. Site Configuration - إعدادات الموقع
- ✅ Created `src/config/site.ts` with centralized site constants
- ✅ Added `SITE_CONFIG` object with official domain: `https://www.khuyoot.app`
- ✅ Helper functions: `getAbsoluteUrl()`, `getOgImageUrl()`, `getSiteUrl()`

### 2. Open Graph Meta Tags - وسوم Open Graph
- ✅ Updated `index.html` with proper meta tags
- ✅ Canonical URL: `<link rel="canonical" href="https://www.khuyoot.app/" />`
- ✅ Open Graph tags with absolute URLs
- ✅ Twitter Card tags with proper image reference
- ✅ Image path: `https://www.khuyoot.app/og/khuyoot-og.jpg`

### 3. SEO Component - مكون SEO
- ✅ Created `src/components/SEO.tsx` (React Helmet component)
- ✅ Reusable SEO component for dynamic page meta tags
- ✅ Supports custom titles, descriptions, images per page

### 4. Domain Redirects - إعادة توجيه الدومين
- ✅ Updated `vercel.json` with 308 permanent redirects
- ✅ Redirect: `khuyoot.app` → `www.khuyoot.app` (308 status)
- ✅ HTTP → HTTPS redirect to www subdomain
- ✅ Added security headers (HSTS, X-Content-Type-Options, X-Frame-Options)

### 5. Environment Variables - متغيرات البيئة
- ✅ Updated `.env.example` with `VITE_SITE_URL=https://www.khuyoot.app`
- ✅ Site config reads from `VITE_SITE_URL` environment variable

### 6. Open Graph Image - صورة Open Graph
- ✅ Created `public/og/` directory
- ✅ Created SVG placeholder: `public/og/khuyoot-og.svg` (1200×630)
- ⚠️ **TODO**: Replace SVG with optimized JPG/PNG (<300KB)

## 📋 Remaining Tasks - المهام المتبقية

### Critical - حرجة
1. **Create Production OG Image** - إنشاء صورة OG نهائية
   - Replace `public/og/khuyoot-og.svg` with `khuyoot-og.jpg`
   - Specifications: 1200×630px, JPG/PNG format, <300KB
   - Should show app branding, Arabic text "خيوط", tagline

2. **Set Environment Variable** - تعيين متغير البيئة
   - Add to Vercel project settings: `VITE_SITE_URL=https://www.khuyoot.app`
   - Or create `.env.local` file for local development

3. **Update Firebase Console** - تحديث Firebase Console
   - Go to: Firebase Console → Authentication → Settings → Authorized domains
   - Add domains:
     - `khuyoot.app`
     - `www.khuyoot.app`
     - `khuyoot.vercel.app` (keep for rollback)

### Testing - الاختبار
4. **Deploy and Verify** - النشر والتحقق
   ```powershell
   # Build locally to test
   npm run build
   
   # Deploy to Vercel
   vercel --prod
   ```

5. **Test Checklist** - قائمة الاختبار
   - [ ] Visit `https://khuyoot.app` → should redirect to `https://www.khuyoot.app`
   - [ ] Visit `http://www.khuyoot.app` → should redirect to `https://www.khuyoot.app`
   - [ ] Check OG image loads: `https://www.khuyoot.app/og/khuyoot-og.jpg`
   - [ ] Share link on WhatsApp → preview should show image and description
   - [ ] Share on Facebook → preview should work
   - [ ] Firebase Auth login works on new domain
   - [ ] No console errors about mixed content or CORS

### WhatsApp Preview Testing - اختبار معاينة WhatsApp
6. **Test WhatsApp Link Sharing**
   - Share: `https://www.khuyoot.app/`
   - Verify image appears in preview
   - Verify title and description are correct
   - Test on: WhatsApp Web and WhatsApp Mobile

## 🔧 How to Use SEO Component - كيفية استخدام مكون SEO

Add to any page component:

```tsx
import { SEO } from '../components/SEO';

function MyPage() {
  return (
    <>
      <SEO 
        title="عنوان الصفحة"
        description="وصف الصفحة"
        url="/my-page"
        image="/path/to/custom-image.jpg"
      />
      {/* Page content */}
    </>
  );
}
```

## 📝 Notes - ملاحظات

### Domain Configuration
- **Primary Domain**: `https://www.khuyoot.app` (with www)
- **Alternate**: `khuyoot.app` (redirects to www)
- **Legacy**: `khuyoot.vercel.app` (keep active for transition)

### Image Optimization
- Use JPG for photos/gradients (better compression)
- Use PNG for logos/text (transparency support)
- Compress with tools: TinyPNG, ImageOptim, Squoosh
- Target: <300KB for fast WhatsApp previews

### Security Headers
Already configured in `vercel.json`:
- HSTS: Force HTTPS for 1 year
- X-Content-Type-Options: Prevent MIME sniffing
- X-Frame-Options: Prevent clickjacking

## 🚀 Deployment Commands - أوامر النشر

```powershell
# Install dependencies
npm install

# Build for production
npm run build

# Preview build locally
npm run preview

# Deploy to Vercel
vercel --prod

# Check deployment
vercel ls
```

## 📞 Support - الدعم

If issues occur:
1. Check Vercel deployment logs: `vercel logs`
2. Verify DNS settings in domain provider
3. Check Firebase Console for authorized domains
4. Test OG tags: https://www.opengraph.xyz/
5. Test Twitter cards: https://cards-dev.twitter.com/validator

---

**Last Updated**: $(Get-Date -Format "yyyy-MM-dd HH:mm")
**Migration Status**: 85% Complete (pending OG image creation and deployment testing)
