# Auth Checklist (Khuyoot)

## Single Source of Truth
- Auth state comes from `AuthProvider` (`loading | authenticated | unauthenticated`).
- UI should not read `firebaseService.auth.currentUser` directly (except inside auth/bootstrap helpers).

## Login Prompting
- Business logic should never directly open modals.
- Use `requestLoginPrompt(reason)` (event: `khuyoot:auth:requestLogin`) or `useAuth().requireAuth()` at the boundary.

## API Calls
- Use `apiFetch()` / `apiJson()` from `src/api/apiFetch.ts`.
- Do not manually attach `Authorization` headers.
- Handle `AuthRequiredError` / `ApiUnauthorizedError` by triggering a login prompt.

## Identifiers
- Standardize on `uid`.
- Avoid mixing `id` and `uid` in new code.

## Persistence
- Set Firebase auth persistence once at initialization.
- Do not switch persistence modes during login.

## Debugging
- Track auth status via `useAuth().status`.
- If tokens fail (e.g., `securetoken` blocked), expect `idToken` to be `null` and API calls to fail with 401.
