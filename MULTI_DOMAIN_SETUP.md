# Multi-Domain Setup Guide

## Overview
Your Khuyoot app now supports three domains with different behaviors:

| Domain | Behavior | Users See |
|--------|----------|-----------|
| `www.khuyoot.app` | **Maintenance Mode** | Static maintenance page |
| `dev.khuyoot.app` | **Full App** | Complete Khuyoot application |
| `tailorjoin.khuyoot.app` | **Tailor Join Only** | Auto-redirects to `/join-tailor` flow |

---

## What Changed

### 1. Created Maintenance Page
- **File**: `public/maintenance.html`
- Beautiful Arabic/English maintenance page
- Auto-served to `www.khuyoot.app` visitors

### 2. Updated Vercel Configuration
- **File**: `vercel.json`
- Host-based rewrites route traffic by subdomain
- `www.khuyoot.app` → maintenance page
- `dev.khuyoot.app` → full app
- `tailorjoin.khuyoot.app` → full app (auto-redirects to tailor join)

### 3. Added Tailor Join Auto-Redirect
- **File**: `App.tsx`
- When users land on `tailorjoin.khuyoot.app`, they're auto-redirected to `#/join-tailor`
- Seamless experience for tailors joining the platform

---

## Deployment Steps

### Step 1: Configure Domains in Vercel
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Domains**
3. Add these domains:
   - `www.khuyoot.app` (if not already added)
   - `dev.khuyoot.app`
   - `tailorjoin.khuyoot.app`

### Step 2: DNS Configuration
Add these DNS records in your domain registrar (where you bought khuyoot.app):

```
Type    Name           Value                          TTL
------  -------------  -----------------------------  ----
CNAME   dev            cname.vercel-dns.com          3600
CNAME   tailorjoin     cname.vercel-dns.com          3600
```

**Note**: Keep your existing `www` and root domain records as-is.

### Step 3: Deploy Your Code
```bash
# Commit the changes
git add .
git commit -m "feat: multi-domain setup with maintenance mode"

# Push to trigger Vercel deployment
git push
```

Vercel will automatically:
- Build your app
- Deploy to all three domains
- Apply the host-based routing rules

---

## Testing

Once deployed, test each domain:

### ✅ www.khuyoot.app
- Should show the maintenance page
- No access to the app

### ✅ dev.khuyoot.app
- Full app access
- All routes work normally
- You can continue developing

### ✅ tailorjoin.khuyoot.app
- Lands on homepage, then auto-redirects to tailor join form
- Or directly access: `tailorjoin.khuyoot.app/#/join-tailor`

---

## Switching Back to Production

When you're ready to make `www.khuyoot.app` live again:

1. Open `vercel.json`
2. Replace the maintenance rewrite rule:

```json
{
  "source": "/(.*)",
  "has": [
    {
      "type": "host",
      "value": "www.khuyoot.app"
    }
  ],
  "destination": "/index.html"  // Changed from /maintenance.html
}
```

3. Commit and push — `www.khuyoot.app` will serve the full app again

---

## Notes

- **Tailor Join** can work from any domain (`dev` or `tailorjoin`) — the auto-redirect only happens on `tailorjoin.khuyoot.app`
- The maintenance page is static HTML (no React, super fast)
- All domains share the same Firebase backend
- You can develop freely on `dev.khuyoot.app` without affecting production

---

## Security Reminder

- The rewrites are **not authentication** — they're URL routing rules
- Users who know direct URLs can still try accessing them (Vercel will serve maintenance.html)
- For true access control, add authentication at the app level or use Vercel password protection

---

## Questions?

- **How do I add password protection?** Use Vercel's built-in password protection in project settings
- **Can I have more subdomains?** Yes, just add more rewrite rules in `vercel.json`
- **What about Firebase Hosting?** This setup uses Vercel — if you want Firebase Hosting multi-site instead, let me know
