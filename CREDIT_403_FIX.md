# Credit System 403 Error Fix

## Problem Summary
Users were experiencing 403 Forbidden errors when trying to:
- Generate fabric swaps
- Upscale images
- Select premium templates

The error occurred because:
1. Users could visit the Designer page without being authenticated
2. When they tried to use credits, the system attempted to create a Firestore `credit_transactions` document
3. Firestore security rules require `isSignedIn()` to be true for credit transactions
4. The request was rejected with 403 Forbidden since `request.auth == null`

## Root Cause
The application allowed **unauthenticated users** to attempt credit-consuming actions, but Firestore security rules correctly blocked these attempts:

```javascript
// Firestore Rule (line 545-556)
allow create: if isAdminUser() || (
  isSignedIn()  // <-- This check failed for unauthenticated users
  && request.resource.data.user_id == request.auth.uid
  && request.resource.data.transaction_id == txId
  && request.resource.data.status == 'pending'
  ...
);
```

## Solution Implemented
Modified `src/pages/DesignerV2_1/DesignerV2_1.tsx` to detect "Not logged in" errors and prompt users to authenticate:

### Changes Made:

1. **Added `toggleAuthModal` import** (line ~358):
```tsx
const { user, toggleAuthModal } = useApp();
```

2. **Generation Error Handling** (line ~1559):
```tsx
if (!creditRes.ok) {
  setIsProcessing(false);
  setProgress(0);
  if ('reason' in creditRes && creditRes.reason === 'insufficient') {
    setIsUpgradeModalOpen(true);
  } else if ('reason' in creditRes && creditRes.reason === 'error') {
    // Check if the error is due to not being logged in
    const errorMsg = creditRes.error instanceof Error ? creditRes.error.message : String(creditRes.error || '');
    if (errorMsg.includes('Not logged in')) {
      toggleAuthModal(true, 'login');  // <-- Prompt user to log in
      return;
    }
    showError('Unable to reserve credits. Please try again.');
  }
  return;
}
```

3. **Upscale Error Handling** (line ~1672):
- Moved credit check **outside** the callback (it was incorrectly inside)
- Added same "Not logged in" detection and login prompt

4. **Premium Template Error Handling** (line ~1924):
- Added "Not logged in" detection and login prompt

## User Experience Now
**Before Fix:**
- User clicks "Generate now" → sees "200 credits" → 403 error → credits reset to 0
- Confusing error messages
- No clear path to fix the issue

**After Fix:**
- User clicks "Generate now" → login modal appears
- User logs in → credits work properly
- Clear, actionable feedback

## Testing Checklist
- [ ] Visit Designer V2.1 without being logged in
- [ ] Try to generate a fabric swap → should see login modal
- [ ] Log in → should be able to generate successfully
- [ ] Try upscale without login → should see login modal
- [ ] Try premium template without login → should see login modal

## Technical Notes
- The fix is **defense in depth**: Firestore rules still enforce authentication
- No security weakening - just better UX for authentication failures
- The `CreditProvider` already checks for authentication, but Designer wasn't handling it properly
- This pattern should be applied to any other features that use `executeCreditAction`

## Files Modified
- `src/pages/DesignerV2_1/DesignerV2_1.tsx`
  - Added `toggleAuthModal` to `useApp()` destructuring
  - Enhanced error handling for generation, upscale, and premium template selection
  - Fixed upscale credit check placement (moved outside callback)

## Related Files (for reference)
- `src/modules/CreditManager/CreditProvider.tsx` - Credit system logic
- `firestore.rules` (lines 541-579) - Credit transaction security rules
- `services/firebase.ts` (lines 390-450) - `reserveCredits` implementation
- `context/AppContext.tsx` - Authentication modal provider

---
**Date:** December 29, 2024
**Status:** Fixed ✅
**Deployed:** Pending (test locally first)
