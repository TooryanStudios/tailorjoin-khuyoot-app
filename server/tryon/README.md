# Try-On backend

Core handler:
- `server/tryon/tryonHandler.ts` → `handleTryOnFabric()`

Entry points:
- Local dev server: `server/devApiServer.ts` (used by `npm run dev:api`)
- Serverless route: `api/tryon/fabric.ts` (used by Vercel deployments)

Environment variables are documented in `TRYON_SETUP.md` and `.env.example`.
