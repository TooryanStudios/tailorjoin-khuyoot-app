# WhatsApp Sandbox Testing Panel

> **DEV-ONLY Component** - Safe to delete

This component provides a UI for testing WhatsApp Business Platform integration using Meta's test phone number.

## Access

Only visible in development mode:

```
http://localhost:3000/__dev/whatsapp-sandbox
```

Or on Vercel preview deployments:

```
https://<preview-url>/__dev/whatsapp-sandbox
```

## Features

- Health check button
- Send test template message
- View API responses
- Form for entering recipient/parameters

## Route

Added to `App.tsx` under dev-only routes:

```tsx
{isDev && (
  <Route
    path="/__dev/whatsapp-sandbox"
    element={
      <React.Suspense fallback={<LoadingShell />}>
        <WhatsAppSandboxPanel />
      </React.Suspense>
    }
  />
)}
```

## Removal

To remove:
1. Delete this folder
2. Delete the route from `App.tsx`
3. Delete the import from `App.tsx`
