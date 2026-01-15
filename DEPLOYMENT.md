# 🚀 Deployment Guide - READ THIS FIRST

## ⚠️ CRITICAL: Know Your Deployment Target

**Before deploying, CHECK where the domain points:**

```powershell
# Check DNS to see which service hosts the domain
Resolve-DnsName dev.khuyoot.app -Type A
```

---

## 📍 Current Deployment Setup

### Production Domains (Vercel Auto-Deploy)
These domains are hosted on **Vercel** and auto-deploy when you push to GitHub:

| Domain | Deployment Method | What to Do |
|--------|------------------|------------|
| **dev.khuyoot.app** | Vercel (auto) | Just `git push origin main` |
| **www.khuyoot.app** | Vercel (auto) | Just `git push origin main` |
| **tailorjoin.khuyoot.app** | Vercel (auto) | Just `git push origin main` |

**How Vercel works:**
1. You push code to GitHub
2. Vercel detects the push
3. Vercel builds and deploys automatically
4. Changes appear in 2-3 minutes

**To deploy to Vercel:**
```bash
# 1. Commit your changes
git add .
git commit -m "your message"

# 2. Push to GitHub (Vercel auto-deploys)
git push origin main

# 3. Wait 2-3 minutes, then check the live site
```

---

### Firebase Hosting (Manual Deploy Only)
Firebase is ONLY used for:
- Firestore database
- Firebase Storage
- Firebase Authentication

**Firebase hosting is NOT USED for live domains** (except for testing at khuyoot-app01.web.app).

**If you accidentally deploy to Firebase:**
- It won't affect live sites (dev.khuyoot.app, www.khuyoot.app)
- Firebase deploys to: https://khuyoot-app01.web.app (testing only)

---

## 🎯 Quick Reference: How to Deploy

### For ALL Live Domains (dev, www, tailorjoin):
```bash
git add .
git commit -m "your changes"
git push origin main
# Vercel auto-deploys to all domains in 2-3 minutes
```

### To Test on Firebase (optional):
```bash
npm run build
firebase deploy --only hosting --project khuyoot-app01
# Deploys to https://khuyoot-app01.web.app ONLY
```

---

## 🔍 How to Check Where a Domain Points

```powershell
# Check DNS records
Resolve-DnsName dev.khuyoot.app -Type A

# If you see Vercel IPs (216.x.x.x or 64.x.x.x):
#   → Use git push (Vercel auto-deploy)

# If you see Firebase IPs (199.36.158.x):
#   → Use firebase deploy
```

---

## ✅ Deployment Checklist

Before deploying, verify:

- [ ] Changes are committed: `git status`
- [ ] On main branch: `git branch`
- [ ] Know the target: Check DNS or refer to table above
- [ ] For Vercel: Just `git push origin main`
- [ ] For Firebase: `npm run build` then `firebase deploy --only hosting`

---

## 🚫 Common Mistakes to Avoid

1. **DON'T use `firebase deploy` for live domains** - they're on Vercel
2. **DON'T forget to `git push`** - Vercel needs code on GitHub
3. **DON'T create multiple Firebase hosting sites** - not needed
4. **DO check DNS first** if unsure where a domain points

---

## 📊 Summary

| Action | Command | Affects |
|--------|---------|---------|
| Deploy to live sites | `git push origin main` | dev.khuyoot.app, www.khuyoot.app, tailorjoin.khuyoot.app |
| Deploy to Firebase test | `firebase deploy --only hosting` | khuyoot-app01.web.app ONLY |
| Update database rules | `firebase deploy --only firestore` | Firestore rules |
| Update storage rules | `firebase deploy --only storage` | Storage rules |

---

**Last Updated:** January 16, 2026  
**Maintained By:** Development Team

**If confused, just remember:** 
- Live domains → `git push` (Vercel handles it)
- Firebase → Testing only
