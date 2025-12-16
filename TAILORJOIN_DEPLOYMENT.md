# Tailor Join Separate Deployment Guide

## Overview

The Tailor Join feature is now configured as a **standalone Vercel project** that will be accessible at:
- **https://tailorjoin.khuyoot.app**

This is completely separate from your main Khuyoot app deployment.

---

## What Was Created

### 📁 New Standalone App
- **Location**: `tailorjoin-khuyoot-app/`
- **Purpose**: Dedicated deployment for tailor registration
- **Features**:
  - Auto-redirects root `/` to `/#/join-tailor`
  - Complete tailor join flow (all steps)
  - Shares Firebase backend with main app
  - Independent build and deployment

### 📄 Key Files Created/Modified

1. **`tailorjoin-khuyoot-app/src/App.tsx`**
   - Main app component with auto-redirect logic
   - Routes all paths to tailor join flow

2. **`tailorjoin-khuyoot-app/src/main.tsx`**
   - React entry point

3. **`tailorjoin-khuyoot-app/package.json`**
   - Modern dependencies matching main app
   - Build scripts for Vite

4. **`tailorjoin-khuyoot-app/vercel.json`**
   - SPA routing configuration
   - Security headers

5. **`tailorjoin-khuyoot-app/.env.example`**
   - Firebase configuration template

6. **`tailorjoin-khuyoot-app/README.md`**
   - Complete deployment instructions

### 📋 Copied Dependencies
- Firebase service (`services/firebase.ts`)
- App Context (`context/AppContext.tsx`)
- Image compression utility (`utils/imageCompression.js`)
- All utilities and types
- Tailor Join component (`features/tailor-join/TailorJoinFlow.jsx`)

---

## 🚀 Next Steps to Deploy

### Step 1: Set Up Environment
```bash
cd tailorjoin-khuyoot-app
cp .env.example .env
# Edit .env with your Firebase credentials (same as main app)
```

### Step 2: Test Build Locally
```bash
npm install
npm run build
npm run preview
```

Visit http://localhost:4173 and verify:
- ✅ Auto-redirects to join-tailor form
- ✅ All form steps work
- ✅ No console errors

### Step 3: Deploy to Vercel

#### Option A: Deploy from Subdirectory (Recommended)
1. Push your changes to GitHub
2. Go to https://vercel.com/new
3. Click "Add New Project"
4. Import your Khuyoot repo
5. Configure:
   - **Project Name**: `khuyoot-tailorjoin`
   - **Root Directory**: `tailorjoin-khuyoot-app` ⚠️ IMPORTANT
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Add Environment Variables:
   ```
   VITE_SITE_URL=https://tailorjoin.khuyoot.app
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   VITE_FIREBASE_MEASUREMENT_ID=...
   ```
7. Click "Deploy"

#### Option B: Separate GitHub Branch
```bash
git checkout -b tailorjoin-deploy
# Copy tailorjoin-khuyoot-app contents to root
# Deploy from root of this branch
```

### Step 4: Configure Domain in Vercel
1. In your new Vercel project, go to **Settings** → **Domains**
2. Click "Add Domain"
3. Enter: `tailorjoin.khuyoot.app`
4. Click "Add"

### Step 5: Configure DNS in Namecheap
1. Log into Namecheap
2. Go to your domain management
3. Click **Advanced DNS**
4. Add CNAME record:
   ```
   Type:  CNAME
   Host:  tailorjoin
   Value: cname.vercel-dns.com
   TTL:   Automatic
   ```
5. Save changes
6. Wait 5-10 minutes for DNS propagation

---

## ✅ Verification Checklist

Once deployed, test these scenarios:

- [ ] Visit `https://tailorjoin.khuyoot.app`
- [ ] Redirects to `https://tailorjoin.khuyoot.app/#/join-tailor`
- [ ] Form displays correctly (all steps)
- [ ] Can fill out and submit form
- [ ] Image uploads work
- [ ] Form submission creates user in Firebase
- [ ] Refresh page doesn't cause 404
- [ ] Direct link `https://tailorjoin.khuyoot.app/#/join-tailor/step-2` works
- [ ] No console errors

---

## 🔐 Security Notes

- Uses same Firebase project as main app
- All Firestore security rules apply
- No additional authentication needed
- HTTPS enforced by Vercel
- Same user accounts across both deployments

---

## 🛠️ Maintenance

### Updating the Tailor Join App
1. Make changes in `tailorjoin-khuyoot-app/`
2. Test locally: `npm run build && npm run preview`
3. Push to GitHub
4. Vercel auto-deploys

### Syncing Changes from Main App
If you update TailorJoinFlow.jsx in the main app:
```bash
cp src/features/tailor-join/TailorJoinFlow.jsx tailorjoin-khuyoot-app/src/features/tailor-join/
cd tailorjoin-khuyoot-app
npm run build  # Test
git add . && git commit -m "sync: update TailorJoinFlow"
git push
```

---

## 🐛 Troubleshooting

### Build Fails
- Verify Node.js 18+ installed
- Delete `node_modules` and reinstall
- Check for TypeScript errors

### Domain Not Working
- Verify CNAME record is correct in Namecheap
- Check DNS propagation: https://dnschecker.org
- Wait up to 48 hours (usually 5-10 minutes)
- Ensure no conflicting DNS records

### Firebase Errors
- Verify `.env` variables match main app
- Check Firebase Console → Authentication → Settings → Authorized domains
- Add `tailorjoin.khuyoot.app` to authorized domains

### Auto-Redirect Not Working
- Check browser console for errors
- Verify `src/App.tsx` has redirect logic
- Clear browser cache and try again

---

## 📊 Project Comparison

| Feature | Main App (khuyoot) | Tailor Join (tailorjoin) |
|---------|-------------------|--------------------------|
| **URL** | www.khuyoot.app, dev.khuyoot.app | tailorjoin.khuyoot.app |
| **Purpose** | Full e-commerce platform | Tailor registration only |
| **Routes** | All app routes | Only `/join-tailor` |
| **Auto-redirect** | No | Yes (root → join-tailor) |
| **Firebase** | Shared project | Shared project |
| **Deployment** | Main Vercel project | Separate Vercel project |

---

## 🎉 Success!

Once deployed:
- Main app: `www.khuyoot.app` (maintenance mode)
- Dev environment: `dev.khuyoot.app` (full app for you)
- Tailor Join: `tailorjoin.khuyoot.app` (dedicated registration)

All three use the same Firebase backend but are independent deployments.

---

## 📞 Need Help?

- Check `tailorjoin-khuyoot-app/README.md` for detailed guide
- Review Vercel deployment logs for errors
- Check Firebase Console for auth/firestore issues
- Use browser DevTools to inspect network requests

---

**Last Updated**: December 16, 2025
