<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1-tY7KwflpAbsRMGcCroTdJKmWwGGoGta

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

<!-- deploy trigger -->

## 🚀 Deployment (IMPORTANT!)

### Quick Deploy to dev.khuyoot.app

```bash
# Make your changes, commit them
git add .
git commit -m "your changes"

# Deploy (this runs verification + pushes to GitHub)
npm run deploy

# Or use the verification script first
npm run verify-deploy
git push origin main
```

### ⚠️ CRITICAL: Know Your Target

**dev.khuyoot.app** is hosted on **Vercel**, not Firebase.
- It auto-deploys when you push to the `main` branch on GitHub
- Takes 2-3 minutes to build and deploy
- **Never use `firebase deploy` for live domains**

### Deployment Safeguards in Place

1. **Pre-push git hook** - Blocks pushes from wrong branch
2. **Verification script** - Checks target before deployment
3. **DEPLOYMENT.md** - Full deployment guide

### Deployment Commands

| Command | What It Does |
|---------|------------|
| `npm run deploy` | Verify + push to main (recommended) |
| `npm run verify-deploy` | Check if ready to deploy |
| `git push origin main` | Manual push (if you know what you're doing) |

### If Something Goes Wrong

1. Check [DEPLOYMENT.md](./DEPLOYMENT.md) for full guide
2. Review [Vercel build logs](https://vercel.com/dashboard)
3. Check DNS with: `Resolve-DnsName dev.khuyoot.app -Type A`

---
