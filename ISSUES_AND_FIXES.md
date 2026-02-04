# Issues and Fixes Log

This document tracks recurring issues and their solutions for the Khuyoot application.

## Common Recurring Issues (Quick Reference)

### 🔐 Authentication & User State
- Firebase Auth timing issues (onAuthStateChanged not firing in React Strict Mode)
- User context out of sync with Firebase Auth
- Session persistence issues
- Login modal spam during auth state changes and token refresh

### 💳 Credit System
- Credit profile not loading for authenticated users
- Credit balance showing 0 despite user being logged in
- Firestore security rules blocking credit operations

### 🎨 UI/UX Issues
- Layout shift when images load (CLS issues)
- Component flickering due to re-mounting instead of re-rendering
- Theme flash on initial page load

### 🔥 Firebase & Firestore
- Firestore rules deployment issues
- Firebase initialization timing
- Storage CORS configuration

### ⚛️ React Performance
- Unstable keys causing unnecessary re-renders
- Components defined inside other components
- Effect cleanup in Strict Mode

---

## Resolved Issues

### Issue #0: Login Issue

**Date:** January 26, 2026  
**Status:** ✅ RESOLVED

#### Symptoms
- Login modal appeared repeatedly on every page refresh
- "Not logged in" prompts during normal token refresh cycles
- Slow credit balance and username loading in header
- Auth state appeared unstable despite user being properly authenticated
- Components making auth decisions before Firebase auth handshake completed

#### Root Cause Analysis

**Primary Issue:** Multiple components were making auth-dependent decisions during the Firebase auth initialization handshake, before `onAuthStateChanged` had fired. This caused:
1. Premature "not logged in" assumptions
2. Login modal spam during token refresh
3. Race conditions between UI components and auth state

**Secondary Issues:**
1. No centralized `authLoading` state to indicate auth handshake in progress
2. Components using inconsistent auth sources (mix of `user?.uid`, localStorage, Firebase currentUser)
3. Aggressive login modal triggers on any transient "Not logged in" error
4. No cached credit/username data for instant UI hydration

#### Investigation Steps

1. **Identified auth fragmentation:**
   - Different components checking auth state differently
   - No way to know when auth handshake was complete
   - Actions triggered before auth state settled

2. **Traced login modal spam:**
   - Modal triggered on transient "Not logged in" errors
   - Auth state changes during token refresh caused false negatives
   - No guard to wait for auth to stabilize

3. **Analyzed header performance:**
   - Credits and username loaded from Firestore on every render
   - No localStorage cache for instant display
   - Caused "empty state" flash during auth check

#### Solution Implemented

**1. Centralized Auth with Loading State**

Modified `AppContext.tsx`:
```typescript
// Added authLoading state that starts true
const [loading, setLoading] = useState(true);

// Set loading during auth handshake
useEffect(() => {
  setLoading(true);
  const unsubscribe = onAuthStateChanged(firebaseService.auth, (user) => {
    setUser(user);
    setLoading(false); // Auth settled
  });
  return () => unsubscribe();
}, []);
```

**2. Guarded All Auth-Dependent Actions**

Modified `DesignerV2_1.tsx`:
```typescript
const { user, loading: authLoading } = useApp();
const authUid = user?.uid ?? null;

// Guard critical actions
const handleGeneration = async () => {
  if (authLoading) return; // Wait for auth to settle
  if (!authUid) {
    toggleAuthModal(); // Only show login if truly unauthenticated
    return;
  }
  // Proceed with action
};
```

**3. Relaxed Transient Error Handling**
```typescript
// BEFORE: Aggressive modal on any "Not logged in"
if (error.includes('Not logged in')) {
  toggleAuthModal(); // Modal spam!
}

// AFTER: Ignore transient auth errors
if (error.includes('Not logged in') && !authLoading) {
  // Only show modal if auth is settled and user truly not logged in
  // Skip during token refresh cycles
}
```

**4. Cache-First Strategy for Header**

Modified `CreditBadge.tsx`:
```typescript
// Load cached balance immediately
const cachedBalance = localStorage.getItem(`khuyoot:credits:lastBalance:${uid}`);
setDisplayBalance(cachedBalance ? parseInt(cachedBalance) : 0);

// Respect authLoading before showing login CTA
if (authLoading) {
  return <Skeleton />; // Don't show login button yet
}
```

Modified `DesignerV2_1.tsx` header:
```typescript
// Cache username
const cachedUser = localStorage.getItem('currentUser');
const userName = user?.displayName || user?.email || cachedUser;
```

**5. Unified Auth Source**
- All components now use `useApp()` as single source of truth
- Consistent use of `authUid` instead of mixing auth checks
- Removed localStorage-based auth checks in favor of centralized state

#### Modified Files
- `context/AppContext.tsx` - Added `authLoading` state
- `src/pages/DesignerV2_1/DesignerV2_1.tsx` - Guarded actions, cached data
- `src/modules/CreditManager/CreditBadge.tsx` - Auth loading awareness, cached credits
- Multiple components - Unified to use `useApp()` consistently

#### Verification
✅ Login modal no longer spams during token refresh  
✅ Credits and username load instantly from cache  
✅ Auth state properly waits for Firebase handshake  
✅ Actions guarded with `authLoading` check  
✅ Smooth UI with no auth-related flashing  

#### Key Takeaways
- **Always wait for auth to settle** before making auth-dependent decisions
- **Cache user data** (credits, username) for instant UI hydration
- **Centralize auth state** to prevent fragmentation and race conditions
- **Distinguish transient vs permanent auth failures** - don't spam modals during token refresh

---

### Issue #1: Authenticated User Not Loading Credit Profile

**Date:** January 22, 2026  
**Status:** ✅ RESOLVED

### Symptoms
- User successfully authenticated (UID: `VkYosy54t5d0RiZXxgr1H0KWbzp2`)
- Credit balance showing as `0` despite being logged in
- `profile` object was `null` in CreditBadge state
- Upgrade modal appearing even when user is authenticated
- Console logs showed:
  ```
  💳 [CreditBadge] State: {
    user: 'VkYosy54t5d0RiZXxgr1H0KWbzp2', 
    enabled: true, 
    currentBalance: 0, 
    isLoading: false, 
    profile: null
  }
  ```

### Root Cause Analysis

**Primary Issue:** CreditProvider was waiting for Firebase Auth's `onAuthStateChanged` event to set `authUid`, but this listener was being cleaned up immediately due to React Strict Mode double-mounting in development, before Firebase Auth could fire the callback.

**Evidence:**
```
CreditProvider.tsx:73 [CreditProvider] Setting up onAuthStateChanged listener... 
  {hasAuth: true, currentUser: undefined}
CreditProvider.tsx:94 [CreditProvider] Cleaning up auth listener
```

The listener cleanup happened immediately after setup, and no `[CreditProvider] onAuthStateChanged fired:` log ever appeared.

**Secondary Issue:** Even though `useApp().user` was properly populated with the authenticated user, CreditProvider was ignoring it and only relying on Firebase Auth's internal state, which wasn't ready yet.

### Investigation Steps

1. **Added debug logging to CreditProvider mount:**
   - Confirmed user exists in `useApp()` context
   - Discovered Firebase Auth's `currentUser` was `undefined` during initial render

2. **Added debug logging to `onAuthStateChanged` listener:**
   - Found listener was being set up but immediately cleaned up
   - No auth state change events were being received

3. **Traced auth state flow:**
   - `useApp().user` ✅ Available immediately with UID
   - Firebase Auth's `currentUser` ❌ Undefined during mount
   - `onAuthStateChanged` callback ❌ Never fired due to cleanup

### Solution Implemented

**Changed CreditProvider to use `useApp().user.id` as the primary source of truth** instead of waiting for Firebase Auth's `onAuthStateChanged`.

**Modified Files:**
- `src/modules/CreditManager/CreditProvider.tsx`

**Key Changes:**

1. **Initialize `authUid` from `user.id`:**
   ```typescript
   // BEFORE: Relied on Firebase Auth's currentUser
   const initialAuthUid = (firebaseService.auth?.currentUser?.uid as string | undefined) || null;
   const [authUid, setAuthUid] = React.useState<string | null>(() => {
     return initialAuthUid;
   });
   
   // AFTER: Use user.id from useApp (already hydrated)
   const [authUid, setAuthUid] = React.useState<string | null>(() => {
     return user?.id || null;
   });
   ```

2. **Sync authUid with user.id changes:**
   ```typescript
   // BEFORE: onAuthStateChanged listener (gets cleaned up in Strict Mode)
   React.useEffect(() => {
     const auth = firebaseService.auth;
     if (!auth) return;
     
     const unsub = onAuthStateChanged(auth, (u) => {
       const next = u?.uid || null;
       setAuthUid(next);
     });
     return () => unsub();
   }, []);
   
   // AFTER: Direct sync with user.id from useApp
   React.useEffect(() => {
     const nextUid = user?.id || null;
     console.log('[CreditProvider] Syncing authUid with user.id:', { 
       prevAuthUid: authUid,
       nextAuthUid: nextUid,
       userEmail: user?.email 
     });
     setAuthUid(nextUid);
   }, [user?.id]);
   ```

3. **Updated initial state calculations:**
   ```typescript
   // BEFORE: Used initialAuthUid from Firebase Auth
   const [isLoading, setIsLoading] = React.useState<boolean>(() => !!initialAuthUid);
   const [profile, setProfile] = React.useState<UserCreditProfile | null>(() => {
     if (!initialAuthUid) return null;
     const cached = readCachedBalance(initialAuthUid);
     // ...
   });
   
   // AFTER: Use user.id directly
   const [isLoading, setIsLoading] = React.useState<boolean>(() => !!user?.id);
   const [profile, setProfile] = React.useState<UserCreditProfile | null>(() => {
     const uid = user?.id;
     if (!uid) return null;
     const cached = readCachedBalance(uid);
     // ...
   });
   ```

### Verification

After the fix, CreditProvider should:
1. ✅ Initialize with `authUid` set to the user's UID immediately
2. ✅ Trigger the `refresh()` function to load credit profile from Firestore
3. ✅ Display the user's credit balance in CreditBadge
4. ✅ Prevent upgrade modal from appearing for authenticated users

**Expected Console Output:**
```
🚀 [CreditProvider] Mounted/Rendered {hasUser: true, userId: 'VkYosy54t5d0RiZXxgr1H0KWbzp2', firebaseAuth: undefined}
[CreditProvider] Syncing authUid with user.id: {prevAuthUid: null, nextAuthUid: 'VkYosy54t5d0RiZXxgr1H0KWbzp2', userEmail: '...'}
[CreditManager] Pricing loaded: {...}
[CreditManager] User profile loaded: {authUid: 'VkYosy54t5d0RiZXxgr1H0KWbzp2', profile: {...}}
💳 [CreditBadge] State: {user: 'VkYosy54t5d0RiZXxgr1H0KWbzp2', enabled: true, currentBalance: 100, isLoading: false, profile: {...}}
```

### Related Changes

**Prior Fixes (Context):**
1. Updated Firestore security rules to allow 0-200 initial credits instead of exactly 0
2. Changed initial credit grant from 0 to 100 in `firebase.ts`
3. Deployed updated Firestore rules to production

### Lessons Learned

1. **Don't rely solely on Firebase Auth's `onAuthStateChanged` in React Strict Mode** - it may be cleaned up before firing during double-mounting
2. **Use existing auth context as source of truth** - If `useApp().user` is already populated, use it directly instead of waiting for Firebase Auth events
3. **React Strict Mode can expose timing issues** - Effects that rely on external async initialization (like Firebase Auth) may not complete before cleanup
4. **Always add comprehensive logging** - Debug logs were essential to identifying the listener cleanup issue

### Prevention

To prevent similar issues in the future:
- ✅ Always check if context/props already contain auth state before setting up Firebase Auth listeners
- ✅ Use `useApp().user` as the primary source of truth for user authentication
- ✅ Add debug logging during development to catch timing issues early
- ✅ Test with React Strict Mode enabled to catch double-mounting issues

---

### Issue #2: Admin/User Login Failures (API Key Invalid, Secure Token 403, and IndexedDB Auth Persistence Hang)

**Date:** January 24–25, 2026  
**Status:** ✅ RESOLVED (with recommended dev-mode persistence)

#### Symptoms
- App login appeared “non-responsive” / slow, with repeated timeouts and warnings like “Firebase connection is slow or blocked”.
- Firebase Auth errors during sign-in:
  - `auth/api-key-not-valid` (API key rejected)
  - `auth/invalid-credential` (API key accepted, but user/password wrong)
- During initialization, some components logged `firebaseAuth: undefined` and auth state felt inconsistent.
- After successful sign-in, token refresh sometimes failed:
  - `POST https://securetoken.googleapis.com/v1/token?key=... 403 (Forbidden)`
- In a standalone diagnostic page, the UI sometimes got stuck on “initializing” after sign-out + refresh:
  - `IndexedDB open is taking too long...`
  - `Auth state did not resolve within 4 seconds...`
  - `onAuthStateChanged` callback never fired.

#### Impact
- Admin login and user login flows were unreliable in development.
- Debugging was confusing because different pages used different env sources and different API keys.

#### Root Cause
1) **Wrong Firebase Browser API key was being used at runtime**
   - `.env.local` overrides `.env` in Vite.
   - `.env.local` contained an old/incorrect `VITE_FIREBASE_API_KEY`, so the app sent the wrong key to Identity Toolkit.
   - Result: `auth/api-key-not-valid`.

2) **API key restrictions blocked Secure Token API**
   - API restrictions were set to only allow Identity Toolkit.
   - Firebase Auth token refresh uses Secure Token API.
   - Result: `securetoken.googleapis.com ... 403 (Forbidden)`.

3) **IndexedDB persistence could hang/lock, preventing auth state from resolving**
   - Firebase Auth local persistence uses IndexedDB (`firebaseLocalStorageDb`).
   - When another tab/window on the same origin is open, IndexedDB deletes/opens can be **BLOCKED**.
   - When IndexedDB open hangs/blocks, Firebase Auth initialization can stall and `onAuthStateChanged` may not fire.
   - Result: diagnostic page stuck at “initializing”, and local-mode auth state sometimes appeared “frozen”.

#### Investigation / Diagnostic Work
- Created and iterated a standalone diagnostic page to isolate Firebase SDK from app code:
  - `firebase-auth-diagnostic.html`
- Added:
  - Copy logs button
  - Email/password sign-in UI (password masked in logs)
  - Error modal for failures
  - API key prefix logging to confirm which key is in use
  - Network fetch instrumentation for Google APIs
  - A direct REST sign-in test (Identity Toolkit) to distinguish “SDK hang” vs “network/credentials”
  - Persistence-mode selector via URL query param: `?p=local|session|memory`
  - IndexedDB watchdogs so “stuck initializing” is visible and explained

#### Fixes Implemented
1) **Corrected the API key source (fixing `auth/api-key-not-valid`)**
   - Updated `.env.local` to match `.env`:
     - Set `VITE_FIREBASE_API_KEY` to the correct Browser key used by the project.
   - Kept local helper pages consistent with the correct key:
     - `test-regions.html`
     - `add-test-regions.html`

2) **Adjusted API key restrictions to allow token refresh (fixing Secure Token 403)**
   - In Google Cloud Console → APIs & Services → Credentials → Browser key:
     - Either set **API restrictions = Don’t restrict key** (recommended while debugging)
     - Or restrict but allow **both**:
       - Identity Toolkit API
       - Secure Token API

3) **Made auth persistence robust for debugging by avoiding IndexedDB when needed**
   - For diagnosis and reliable testing, use:
     - `firebase-auth-diagnostic.html?p=memory` (no persistence; never touches IndexedDB)
     - `firebase-auth-diagnostic.html?p=session` (session storage; avoids IndexedDB)
   - Improved Clear Session behavior:
     - Mode-aware: does not attempt IndexedDB deletion in session/memory mode
     - In local mode, reports `blocked` deletes and instructs to close other tabs

#### Modified Files
- `.env` (aligned Firebase web config)
- `.env.local` (critical: removed incorrect API key override)
- `firebase-auth-diagnostic.html` (diagnostic tooling + persistence modes + watchdogs)
- `test-regions.html` (updated key)
- `add-test-regions.html` (updated key)

#### Verification
- App console prints correct config prefix:
  - `🔥 Firebase Config: { apiKey: 'AIzaSyB_SsoGd...', projectId: 'khuyoot-app01' }`
- Identity Toolkit sign-in returns `200` and sets auth state.
- In `?p=memory` / `?p=session` diagnostic mode:
  - `ℹ️ Auth state changed: No user signed in` appears immediately after load.
  - Sign-in succeeds without timeouts.
- Secure Token refresh no longer returns `403` once Secure Token API is allowed.

#### Prevention / Operational Notes
- Avoid storing a different Firebase API key in `.env.local` unless intentionally testing.
- When debugging auth persistence issues:
  - Prefer session/memory persistence to bypass IndexedDB locks.
  - Close other tabs on the same origin before attempting IndexedDB deletion.
- For production, revisit API key restriction strategy carefully:
  - Restrict by HTTP referrers and allow required APIs (Identity Toolkit + Secure Token).

---

## Issue Template

When documenting new issues, use this template:

```markdown
### Issue #X: [Brief Title]

**Date:** [Date]  
**Status:** ✅ RESOLVED | ⏳ IN PROGRESS | 🔍 INVESTIGATING

#### Symptoms
- [What the user experienced]
- [Error messages or unexpected behavior]

#### Root Cause
[Technical explanation of why it happened]

#### Solution
[What was changed to fix it]

**Modified Files:**
- `path/to/file.ext`

#### Verification
[How to confirm the fix works]

#### Prevention
[How to avoid this issue in the future]
```

---

*New issues will be documented below as they are discovered and resolved.*
