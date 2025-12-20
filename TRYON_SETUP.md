# Fabric Try-On — Setup

This repo implements a **template-only** Fabric Try-On flow.
- Frontend calls: `POST /api/tryon/fabric`
- Backend does: validation → Gemini → Storage upload → Firestore job write
- **No Gemini/OpenAI keys are used in the browser**.

## 1) Where to paste your API key

### Local development
1. Create a `.env` file in the repo root (same folder as this file).
2. Copy values from `.env.example` and fill them:
   - `GEMINI_API_KEY=...`
   - Firebase Admin credentials (either JSON or split vars)
   - `FIREBASE_STORAGE_BUCKET=...`

The local API server loads `.env` automatically.

### Production (Vercel)
Set the same environment variables in Vercel:
- Project → Settings → Environment Variables

The serverless endpoint lives here:
- `api/tryon/fabric.ts`

## 2) Run locally

Run the app UI:
- `npm run dev`

Run the API server (required for `/api/tryon/fabric` in dev):
- `npm run dev:api`

Vite proxies `/api/*` → `http://localhost:8787` (see `vite.config.ts`).

## 3) Firebase prerequisites

- Firestore enabled (collection: `tryon_jobs`)
- Storage enabled (uploads to: `tryon_results/{jobId}.png`)

## 4) Notes / gotchas

- `FIREBASE_PRIVATE_KEY` should contain literal `\n` sequences. The server converts them to real newlines.
- If you don’t set Firebase Admin env vars, the API will fail on Firestore/Storage operations.
- The backend enforces template IDs server-side and rejects unknown templates.
