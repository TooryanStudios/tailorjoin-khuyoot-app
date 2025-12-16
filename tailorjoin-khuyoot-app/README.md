# Tailor Join Standalone Deployment

Standalone deployment of the Tailor Join feature for Khuyoot at **https://tailorjoin.khuyoot.app**

## 🎯 Purpose

Separate Vercel project that serves **only** the Tailor Join flow with auto-redirect from root.

## 🚀 Quick Deploy

### 1. Install & Build Test
```bash
cd "c:\Projects\Khuyoot App\Code\khuyoot-خيوط\tailorjoin-khuyoot-app"
npm install
npm run build
npm run preview  # Test locally
```

### 2. Deploy to Vercel
1. Go to https://vercel.com/new
2. Import GitHub repo/branch
3. Configure:
   - **Root Directory**: `tailorjoin-khuyoot-app`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variables (from `.env.example`)
5. Deploy

### 3. Add Domain
1. Vercel Settings → Domains → Add `tailorjoin.khuyoot.app`
2. Add CNAME in Namecheap:
   ```
   Type: CNAME | Host: tailorjoin | Value: cname.vercel-dns.com
   ```

## ✅ Success Criteria
- https://tailorjoin.khuyoot.app loads
- Auto-redirects to `/#/join-tailor`
- Tailor join form works
- Image uploads functional
- Firebase integration working

## 📁 Key Files
- `src/App.tsx` - Auto-redirect logic
- `src/features/tailor-join/TailorJoinFlow.jsx` - Main form
- `vercel.json` - SPA routing config
- `.env` - Firebase credentials (create from `.env.example`)

## 🔧 Development
```bash
npm run dev      # Local dev server
npm run build    # Production build
npm run preview  # Test production build
```

See full deployment guide in file for detailed steps and troubleshooting.
