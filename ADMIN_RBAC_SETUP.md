# Admin RBAC Setup (No Hardcoding)

This project now supports **database-driven** admin access for `AdminApp`.

## 1) Where to store permissions

Store permissions on the user document in Firestore (`users/{uid}`) using either:

- `adminAccess` (preferred)
- `adminPermissions` (legacy-compatible alias)

Both support the same structure:

```json
{
  "mode": "full | limited",
  "sections": ["dashboard", "products", "measurements", "config"],
  "deniedSections": ["users"],
  "configSections": ["general", "designer", "product-page"],
  "deniedConfigSections": ["advanced", "debug-tools"]
}
```

## 2) Section keys (Admin sidebar/routes)

Use these values in `sections` / `deniedSections`:

- `dashboard`
- `orders`
- `approvals`
- `users`
- `tailors`
- `boutiques`
- `shops`
- `products`
- `orphaned-products`
- `fabrics`
- `measurements`
- `family`
- `ai`
- `store`
- `images`
- `tryon-templates`
- `notifications`
- `ads`
- `regions`
- `financial`
- `credits`
- `settings`
- `config`
- `debug-tools`
- `logs`

## 3) Config tab keys

Use these values in `configSections` / `deniedConfigSections`:

- `general`
- `homepage`
- `landing-page`
- `designer`
- `product-page`
- `texts`
- `social`
- `seo`
- `advanced`
- `debug-tools`

## 4) Example: Limited admin (products + measurements only)

```json
{
  "role": "admin",
  "adminAccess": {
    "mode": "limited",
    "sections": ["dashboard", "products", "measurements"],
    "deniedSections": ["users", "financial", "config"],
    "configSections": [],
    "deniedConfigSections": ["advanced", "debug-tools"]
  }
}
```

## 5) Example: Super admin (full)

```json
{
  "role": "admin",
  "adminAccess": {
    "mode": "full"
  }
}
```

## Notes

- If `role !== "admin"`, admin access is denied.
- If `role === "admin"` and no `adminAccess`/`adminPermissions` exists, access defaults to `full` (backward compatibility).
- UI-level RBAC is now enforced in:
  - `src/admin/AdminApp.tsx` (route/section/config gating)
  - `src/admin/components/Sidebar.tsx` (menu visibility)

